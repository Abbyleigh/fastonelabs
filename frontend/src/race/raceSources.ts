import type {UnifiedRaceState,CarState,Pose,Telemetry} from './unifiedRaceState';
import type {RaceState as PrototypeState} from './raceState';
export type PositionSample={time:number;x:number;y:number;z?:number};
export type ReplayInput={year:number;round:number;session_key:number;event:string;window_start:number;window_start_utc:string;duration:number;drivers:{driver_number:number;code:string;name:string;color:string;samples:PositionSample[]}[]};
export type ChannelRow={time:number;driver_number?:number;[key:string]:unknown};
export type Channels=Record<string,ChannelRow[]>;
export interface RaceSource {readonly kind:'recorded'|'simulated';frameAt(time:number):UnifiedRaceState;}
const limitations=['OpenF1 coordinates are provider units, not verified metres or road elevation.','Linear interpolation only within two seconds; missing positions remain null.','Classification is the last reported update; tyre, pit and energy state are unknown unless supplied.'];
function freeze<T>(value:T):T{if(value&&typeof value==='object'){Object.freeze(value);Object.values(value).forEach(v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v))freeze(v);});}return value;}
function clone<T>(v:T):T{return JSON.parse(JSON.stringify(v));}
function latest(rows:ChannelRow[],time:number,driver:number){let result:ChannelRow|undefined;for(const row of rows)if(row.driver_number===driver&&row.time<=time&&(!result||row.time>=result.time))result=row;return result;}
function number(row:ChannelRow|undefined,key:string){const n=row?.[key];return typeof n==='number'&&Number.isFinite(n)?n:null;}
export function samplePose(samples:readonly PositionSample[],time:number):Pose|null{
 if(samples.length<2||time<samples[0].time||time>samples[samples.length-1].time)return null;
 let lo=0,hi=samples.length-1;while(lo<hi){const mid=Math.floor((lo+hi)/2);if(samples[mid].time<time)lo=mid+1;else hi=mid;}
 const i=Math.max(0,Math.min(lo-1,samples.length-2)),a=samples[i],b=samples[i+1],span=b.time-a.time;
 if(span<=0||span>2)return null;
 const f=Math.max(0,Math.min(1,(time-a.time)/span));
 return {x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f,z:(a.z??0)+((b.z??0)-(a.z??0))*f,headingRad:Math.atan2(b.x-a.x,-(b.y-a.y)),quality:f===0||f===1?'sampled':'interpolated'};
}
const blankTelemetry=():Telemetry=>({speedMps:null,rpm:null,gear:null,throttlePercent:null,brakePressed:null,legacyDrsCode:null,sampleAgeS:null});
export class ReplaySource implements RaceSource{
 readonly kind='recorded' as const;private readonly replay:ReplayInput;private readonly channels:Channels;
 constructor(replay:ReplayInput,channels:Channels={}){this.replay=freeze(clone(replay));this.channels=freeze(clone(channels));}
 frameAt(time:number):UnifiedRaceState{
  const r=this.replay;if(!Number.isFinite(time)||time<0||time>r.duration)throw Error('Seek within the loaded recorded window.');
  const cars:CarState[]=r.drivers.map<CarState>(d=>{
   const position=latest(this.channels.position||[],time,d.driver_number),interval=latest(this.channels.intervals||[],time,d.driver_number);
   let car=latest(this.channels.car_data||[],time,d.driver_number);if(car&&time-car.time>2)car=undefined;
   const speed=number(car,'speed'),gear=number(car,'n_gear'),brake=number(car,'brake'),gap=number(interval,'gap_to_leader');
   return {id:String(d.driver_number),driverNumber:d.driver_number,code:d.code,name:d.name,color:d.color,position:number(position,'position'),classificationQuality:position?'recorded':'missing',classificationAgeS:position?time-position.time:null,pose:samplePose(d.samples,time),lap:null,trackDistanceM:null,lateralOffsetM:null,gapToLeaderS:gap!==null&&gap>=0?gap:null,gapLabel:typeof interval?.gap_to_leader==='string'?interval.gap_to_leader:null,telemetry:{speedMps:speed===null?null:speed/3.6,rpm:number(car,'rpm'),gear,throttlePercent:number(car,'throttle'),brakePressed:brake===null?null:brake>0,legacyDrsCode:number(car,'drs'),sampleAgeS:car?time-car.time:null},tyre:null,pitPhase:'unknown',energy:null};
  }).sort((a,b)=>(a.position??99999)-(b.position??99999)||(a.driverNumber??0)-(b.driverNumber??0));
  return freeze({schemaVersion:1,sourceKind:'recorded',raceId:`${r.year}:${r.round}`,sessionId:`OpenF1:${r.session_key}`,event:r.event,timestampS:r.window_start+time,timestampUtc:new Date(Date.parse(r.window_start_utc)+time*1000).toISOString(),windowStartS:r.window_start,trackLengthM:null,totalLaps:null,status:'recorded',cars,flags:null,events:null,provenance:{provider:'OpenF1',adapterVersion:'race-state-v1',coordinateUnits:'provider_units',maxInterpolationGapS:2,elevationVerified:false,limitations:[...limitations]}});
 }
}
/** Adapts a prototype checkpoint only. Does not invent a future at arbitrary times. */
export class SimulationSource implements RaceSource{
 readonly kind='simulated' as const;private readonly state:PrototypeState;
 constructor(state:PrototypeState){
  const finite=(n:number)=>Number.isFinite(n);
  if(state.schemaVersion!==1||!finite(state.timestampS)||state.timestampS<0||!finite(state.trackLengthM)||state.trackLengthM<=0||!Number.isInteger(state.totalLaps)||state.totalLaps<1||new Set(state.drivers.map(d=>d.id)).size!==state.drivers.length||state.drivers.some(d=>!d.id||![d.lap,d.lapDistanceM,d.lateralOffsetM,d.velocityMps,d.tyre.ageLaps,d.tyre.wear,d.energy.fraction,d.position].every(finite)||d.velocityMps<0||d.lap<0||d.lapDistanceM<0||d.lapDistanceM>=state.trackLengthM||d.tyre.ageLaps<0||d.tyre.wear<0||d.tyre.wear>1||d.energy.fraction<0||d.energy.fraction>1||!Number.isInteger(d.position)||d.position<1))throw Error('Invalid prototype checkpoint');
  this.state=freeze(clone(state));
 }
 frameAt(time:number):UnifiedRaceState{
  const s=this.state;if(time!==s.timestampS)throw Error('Advance the simulation engine to this time before requesting its state.');
  const cars:CarState[]=s.drivers.map<CarState>(d=>({id:d.id,driverNumber:null,code:d.id,name:d.id,color:'#8A9CB5',position:d.position,classificationQuality:'estimated',classificationAgeS:0,pose:null,lap:d.lap,trackDistanceM:d.lapDistanceM,lateralOffsetM:d.lateralOffsetM,gapToLeaderS:d.gapToLeaderS,gapLabel:null,telemetry:{...blankTelemetry(),speedMps:d.velocityMps,sampleAgeS:0},tyre:{compound:d.tyre.compound,ageLaps:d.tyre.ageLaps,wearFraction:d.tyre.wear,quality:'estimated'},pitPhase:d.pitStatus,energy:{fraction:d.energy.fraction,aero:d.energy.aero,boost:d.energy.boost,overtakeEligible:d.energy.overtakeEligible,overtakeActive:d.energy.overtakeActive,quality:'estimated'}})).sort((a,b)=>(a.position??99999)-(b.position??99999));
  return freeze({schemaVersion:1,sourceKind:'simulated',raceId:`simulation:${s.circuitId}`,sessionId:`prototype:${s.circuitId}`,event:s.circuitId,timestampS:s.timestampS,timestampUtc:null,windowStartS:0,trackLengthM:s.trackLengthM,totalLaps:s.totalLaps,status:s.status,cars,flags:null,events:null,provenance:{provider:'prototype',adapterVersion:'race-state-v1',coordinateUnits:'metres',maxInterpolationGapS:0,elevationVerified:false,limitations:['Kinematic prototype checkpoint; not a recorded race or calibrated vehicle physics.','Energy, tyres, classification and gaps are illustrative simulation estimates.']}});
 }
}
/** Animation callbacks can carry a frame timestamp earlier than setup time. */
export function advanceReplayClock(current:number,elapsed:number,speed:number,duration:number){
 if(!Number.isFinite(duration)||duration<=0)return 0;
 const safeCurrent=Number.isFinite(current)?Math.max(0,Math.min(duration,current)):0;
 const dt=Number.isFinite(elapsed)?Math.max(0,Math.min(.1,elapsed)):0;
 const rate=Number.isFinite(speed)?Math.max(0,speed):0;
 return (safeCurrent+dt*rate)%duration;
}
