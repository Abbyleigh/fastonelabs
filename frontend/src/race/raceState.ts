/** Pure, deterministic prototype engine. All distances are metres; times seconds. */
export type AeroMode = 'corner' | 'straight';
export type PitStatus = 'track' | 'entry' | 'box' | 'exit';
export type TyreCompound = 'soft' | 'medium' | 'hard' | 'intermediate' | 'wet';
export interface DriverState {
  id: string; grid: number; lap: number; lapDistanceM: number;
  lateralOffsetM: number; velocityMps: number; desiredVelocityMps: number;
  tyre: { compound: TyreCompound; ageLaps: number; wear: number };
  energy: { fraction: number; aero: AeroMode; boost: boolean; overtakeEligible: boolean; overtakeActive: boolean };
  pitStatus: PitStatus; position: number; gapToLeaderS: number | null;
  finishedAtS: number | null;
}
export interface RaceState {
  schemaVersion: 1; circuitId: string; trackLengthM: number; totalLaps: number;
  timestampS: number; status: 'running' | 'finished'; drivers: DriverState[];
}
export interface RaceEvent { timestampS: number; type: 'pass' | 'finish'; driverId: string; otherId?: string }
export interface StepResult { state: RaceState; events: RaceEvent[] }
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const distance = (d: DriverState, length: number) => d.lap * length + d.lapDistanceM;
const copy = (s: RaceState): RaceState => JSON.parse(JSON.stringify(s));
export function validateRaceState(s: RaceState): void {
  if (s.schemaVersion !== 1 || s.trackLengthM <= 0 || !Number.isFinite(s.timestampS) || !Number.isInteger(s.totalLaps) || s.totalLaps < 1) throw Error('Invalid race header');
  const ids = new Set<string>();
  for (const d of s.drivers) {
    if (ids.has(d.id) || !d.id || d.lap < 0 || d.lapDistanceM < 0 || d.lapDistanceM >= s.trackLengthM + 1e-6 || !Number.isFinite(d.velocityMps) || d.velocityMps < 0 || !Number.isFinite(d.lateralOffsetM) || d.energy.fraction < 0 || d.energy.fraction > 1 || d.tyre.wear < 0 || d.tyre.wear > 1) throw Error('Invalid driver state');
    ids.add(d.id);
  }
}
export function createRace(ids: string[], circuitId = 'Mexico City GP 2026', totalLaps = 71, trackLengthM = 4304): RaceState {
  const state: RaceState = {schemaVersion:1, circuitId, totalLaps, trackLengthM, timestampS:0, status:'running', drivers:ids.map((id,i)=>({
    id, grid:i+1, lap:0, lapDistanceM:0, lateralOffsetM:i%2 ? 1.2 : -1.2,
    velocityMps:0, desiredVelocityMps:73-i*.13,
    tyre:{compound:'medium',ageLaps:0,wear:0}, energy:{fraction:.8,aero:'corner',boost:false,overtakeEligible:false,overtakeActive:false},
    pitStatus:'track', position:i+1, gapToLeaderS:null, finishedAtS:null
  }))};
  // The visual renderer supplies grid geometry; elapsed-time start delays are added in a later integration milestone.
  validateRaceState(state); return state;
}
/** Explicitly sets a clean race grid without modifying existing callers. */
export function setGridDistances(s: RaceState): RaceState {
  const next=copy(s);
  next.drivers.forEach((d,i)=>{d.lap=0; d.lapDistanceM=0; d.lateralOffsetM=i%2?1.2:-1.2; d.velocityMps=0; });
  return next;
}
/** Computes leader and gaps from distance, not visual lateral offsets. */
export function classify(s: RaceState): RaceState {
  const next=copy(s); const L=s.trackLengthM;
  next.drivers.sort((a,b)=>{
    if (a.finishedAtS !== null && b.finishedAtS !== null) return a.finishedAtS-b.finishedAtS;
    if (a.finishedAtS !== null) return -1;
    if (b.finishedAtS !== null) return 1;
    return distance(b,L)-distance(a,L) || a.grid-b.grid;
  });
  const leader=next.drivers[0];
  next.drivers.forEach((d,i)=>{d.position=i+1; d.gapToLeaderS=i===0?0:Math.max(0,(distance(leader,L)-distance(d,L))/Math.max(1,d.velocityMps));});
  return next;
}
/** One fixed simulation step, no I/O, random numbers, or Three.js dependencies. */
export function stepRace(input: RaceState, dt: number): StepResult {
  validateRaceState(input);
  if (!(dt>0 && dt<=1)) throw Error('dt must be in (0,1] seconds');
  if(input.status==='finished') return {state:copy(input),events:[]};
  const before=classify(input), result=copy(before), events: RaceEvent[]=[];
  const L=result.trackLengthM, finishDistance=L*result.totalLaps;
  // Snapshot traffic at step start ensures input ordering cannot affect decisions.
  for (const d of result.drivers) {
    if (d.finishedAtS !== null) continue;
    const myDistance=distance(d,L);
    const ahead=before.drivers.filter(o=>o.id!==d.id && o.finishedAtS===null && distance(o,L)>myDistance)
      .sort((a,b)=>distance(a,L)-distance(b,L))[0];
    const gap=ahead ? distance(ahead,L)-myDistance : Infinity;
    const lateralSeparation=ahead ? Math.abs(ahead.lateralOffsetM-d.lateralOffsetM) : Infinity;
    const passing=gap<24 && d.desiredVelocityMps > (ahead?.velocityMps ?? Infinity)+0.5;
    const targetLane=passing ? (ahead!.lateralOffsetM<=0 ? 2.1 : -2.1) : (d.grid%2 ? -0.25 : 0.25);
    const maxLateralRate=1.4; // m/s
    d.lateralOffsetM+=clamp(targetLane-d.lateralOffsetM,-maxLateralRate*dt,maxLateralRate*dt);
    const safeFollow=gap<12 && lateralSeparation<1.5;
    // Simplified acceleration + following headway, not full vehicle physics.
    let target=Math.max(0,d.desiredVelocityMps*(1-0.17*d.tyre.wear));
    if(safeFollow && ahead) target=Math.min(target,Math.max(0,ahead.velocityMps+(gap-8)*0.4));
    if(d.pitStatus!=='track') target=Math.min(target,22);
    const acceleration=target>d.velocityMps?5:9; // m/s²
    const nextV=clamp(target,d.velocityMps-acceleration*dt,d.velocityMps+acceleration*dt);
    const deltaM=(d.velocityMps+nextV)*0.5*dt;
    d.velocityMps=nextV;
    const updated=Math.min(finishDistance,myDistance+deltaM);
    d.lap=Math.min(result.totalLaps,Math.floor(updated/L));
    d.lapDistanceM=updated===finishDistance ? 0 : updated%L;
    d.tyre.ageLaps += deltaM/L;
    d.tyre.wear=clamp(d.tyre.wear+deltaM/(L*85),0,1);
    // 2026 concepts are modelled as separate state flags, not legacy DRS.
    d.energy.fraction=clamp(d.energy.fraction + (d.energy.boost ? -0.003 : 0.0005)*dt,0,1);
    if(updated>=finishDistance) {d.finishedAtS=input.timestampS+dt; events.push({type:'finish',driverId:d.id,timestampS:input.timestampS+dt});}
  }
  result.timestampS=input.timestampS+dt;
  result.status=result.drivers.every(d=>d.finishedAtS!==null)?'finished':'running';
  const ranked=classify(result);
  for(const d of ranked.drivers) {
    const old=before.drivers.find(b=>b.id===d.id)!;
    if(d.position<old.position && d.finishedAtS===null) events.push({type:'pass',driverId:d.id,timestampS:ranked.timestampS});
  }
  validateRaceState(ranked);
  return {state:ranked, events};
}
/** Rendering adapter: consumes state, never mutates it. */
export function toCarView(s: RaceState, id: string) {
  const d=s.drivers.find(d=>d.id===id);
  if(!d) throw Error(`Unknown driver: ${id}`);
  return {id:d.id, progress:d.lap+d.lapDistanceM/s.trackLengthM, lateralOffset:d.lateralOffsetM,
    speedKmh:d.velocityMps*3.6, lap:Math.min(s.totalLaps,d.lap+1), position:d.position,
    gapS:d.gapToLeaderS, tyre:d.tyre.compound, finished:d.finishedAtS!==null};
}
export function snapshot(s: RaceState): string {validateRaceState(s);return JSON.stringify(s);}
export function restore(json: string): RaceState {const s=JSON.parse(json) as RaceState;validateRaceState(s);return s;}
