/** Educational estimates only. Coefficients are illustrative, not fitted to telemetry. */
export const COMPOUNDS = ['soft', 'medium', 'hard', 'intermediate', 'wet'] as const;
export type Compound = typeof COMPOUNDS[number];
export type Plan = { name: string; compounds: Compound[]; pits: number[] };
export type Conditions = { laps: number; baseLap: number; pitLoss: number; degradation: number; rainLap: number; rain: number; safetyLap: number; safetyDuration: number };
export type RaceContext = { season:number; round:number; name:string; circuit:string; date:string; recordedLaps?:number; fastestLapSeconds?:number };
export type Scenario = { version: 1; name: string; race?:RaceContext; conditions: Conditions; plans: [Plan, Plan] };
export type Lap = { lap: number; seconds: number; cumulative: number; compound: Compound; pit: boolean; safety: boolean };
export const DEFAULT_SCENARIO: Scenario = {version:1, name:'My race scenario', conditions:{laps:52,baseLap:90,pitLoss:22,degradation:1,rainLap:25,rain:0,safetyLap:0,safetyDuration:3},plans:[{name:'Plan A · one stop',compounds:['medium','hard'],pits:[26]},{name:'Plan B · two stops',compounds:['soft','medium','hard'],pits:[17,35]}]};
const tyre = {soft:{pace:-.8,wear:.09},medium:{pace:0,wear:.055},hard:{pace:.6,wear:.03},intermediate:{pace:4,wear:.045},wet:{pace:8,wear:.035}};
export function validateScenario(value: unknown): asserts value is Scenario {
 const s=value as Scenario;
 if(!s || s.version!==1 || typeof s.name!=='string' || !s.name.trim() || s.name.length>100 || !s.conditions || !Array.isArray(s.plans) || s.plans.length!==2)throw Error('Invalid scenario format.');
 if(s.race!==undefined){
  const r=s.race;
  if(!r||!Number.isInteger(r.season)||r.season<1950||r.season>2200||!Number.isInteger(r.round)||r.round<1||r.round>30||!['name','circuit','date'].every(k=>typeof r[k as 'name']==='string'&&r[k as 'name'].length>0&&r[k as 'name'].length<=200)||!/^\d{4}-\d{2}-\d{2}$/.test(r.date)||(r.recordedLaps!==undefined&&(!Number.isInteger(r.recordedLaps)||r.recordedLaps<1||r.recordedLaps>300))||(r.fastestLapSeconds!==undefined&&(!Number.isFinite(r.fastestLapSeconds)||r.fastestLapSeconds<20||r.fastestLapSeconds>1000)))throw Error('Invalid race context.');
 }
 const c=s.conditions;
 const ranges: [keyof Conditions,number,number,boolean][]=[['laps',2,100,true],['baseLap',40,200,false],['pitLoss',5,60,false],['degradation',0,3,false],['rainLap',1,c.laps,true],['rain',0,100,false],['safetyLap',0,c.laps,true],['safetyDuration',1,10,true]];
 for(const [key,min,max,integer] of ranges){const n=c[key];if(typeof n!=='number'||!Number.isFinite(n)||n<min||n>max||(integer&&!Number.isInteger(n)))throw Error(`Check ${key}: use ${min}–${max}${integer?' whole numbers':''}.`);}
 for(const p of s.plans){
  if(!p||typeof p.name!=='string'||!p.name.trim()||p.name.length>100||!Array.isArray(p.pits)||p.pits.length>3||!Array.isArray(p.compounds)||p.compounds.length!==p.pits.length+1||!p.compounds.every(t=>COMPOUNDS.includes(t)))throw Error('Each plan needs one compound per stint and at most three stops.');
  if(p.pits.some((lap,i)=>!Number.isInteger(lap)||lap<1||lap>=c.laps||(i>0&&lap<=p.pits[i-1])))throw Error('Pit laps must increase, from lap 1 through the penultimate lap.');
 }
}
function isSafetyLap(lap:number,c:Conditions){return c.safetyLap>0&&lap>=c.safetyLap&&lap<c.safetyLap+c.safetyDuration;}
function lapSeconds(compound:Compound,age:number,lap:number,c:Conditions,pit:boolean){
 const t=tyre[compound],wetness=lap>=c.rainLap?c.rain/100:0;
 const mismatch=compound==='wet'?8*(1-wetness):compound==='intermediate'?3*(1-wetness)+8*Math.max(0,wetness-.65):30*wetness;
 const running=c.baseLap+t.pace+t.wear*age*c.degradation+mismatch;
 const safety=isSafetyLap(lap,c);
 return (safety?Math.max(c.baseLap*1.35,running):running)+(pit?c.pitLoss*(safety?.55:1):0);
}
export function simulate(plan: Plan, conditions: Conditions): Lap[] {
 validateScenario({version:1,name:'Calculation',conditions,plans:[plan,plan]});
 let stint=0,age=0,cumulative=0;
 return Array.from({length:conditions.laps},(_,index)=>{
  const lap=index+1,compound=plan.compounds[stint];
  const safety=isSafetyLap(lap,conditions),pit=plan.pits.includes(lap);
  const seconds=lapSeconds(compound,age,lap,conditions,pit);
  cumulative+=seconds;
  if(pit){stint++;age=0;}else age++;
  return {lap,seconds,cumulative,compound,pit,safety};
 });
}

export const ASSUMPTION_PROFILES = [
 {id:'balanced',label:'Balanced example',pitLoss:22,degradation:1},
 {id:'tyreStress',label:'Higher tyre wear example',pitLoss:22,degradation:1.7},
 {id:'pitCost',label:'Costly pit lane example',pitLoss:30,degradation:1},
] as const;
export function parseLapTime(value: string | undefined): number | undefined {
 if(!value || !/^\d{1,2}:\d{2}(?:\.\d{1,3})?$/.test(value))return undefined;
 const [minutes,seconds]=value.split(':').map(Number);
 const result=minutes*60+seconds;
 return seconds<60&&result>=20&&result<=1000?result:undefined;
}
export function scenarioForRace(race?:RaceContext):Scenario {
 const s:Scenario=JSON.parse(JSON.stringify(DEFAULT_SCENARIO));
 if(!race)return s;
 s.race={...race};s.name=`${race.season} ${race.name}`.slice(0,100);
 // Winner's completed distance can represent a shortened race, not scheduled distance.
 if(race.recordedLaps && race.recordedLaps>=2 && race.recordedLaps<=100)s.conditions.laps=race.recordedLaps;
 if(race.fastestLapSeconds && race.fastestLapSeconds+5>=40 && race.fastestLapSeconds+5<=200)s.conditions.baseLap=Math.round((race.fastestLapSeconds+5)*10)/10;
 s.conditions.rainLap=Math.max(1,Math.round(s.conditions.laps*.5));
 s.plans=s.plans.map(p=>({...p,pits:p.pits.map((_,i)=>Math.max(1,Math.round(s.conditions.laps*(i+1)/(p.pits.length+1))))})) as [Plan,Plan];
 // Two laps cannot accommodate two separate stops.
 if(s.conditions.laps===2)s.plans[1]={...s.plans[1],pits:[1],compounds:['soft','hard']};
 validateScenario(s);return s;
}
export function baselineComparison(s:Scenario){
 validateScenario(s);
 const dry={...s.conditions,rain:0,safetyLap:0};
 return s.plans.map(plan=>{
  const actual=simulate(plan,s.conditions).slice(-1)[0].cumulative;
  const baseline=simulate(plan,dry).slice(-1)[0].cumulative;
  return {name:plan.name,actual,baseline,difference:actual-baseline};
 });
}

export function planWarnings(plan: Plan,c: Conditions): string[] {
 const notes:string[]=[];
 if(c.rain===0&&new Set(plan.compounds).size<2)notes.push('Only one compound used: check the applicable dry-race tyre rules.');
 if(c.rain>0&&!plan.compounds.some(t=>t==='wet'||t==='intermediate'))notes.push('Rain is enabled but this plan stays on slicks.');
 return notes;
}
export const duration=(s:number)=>`${Math.floor(s/3600)}h ${String(Math.floor(s%3600/60)).padStart(2,'0')}m ${(s%60).toFixed(1)}s`;
export function briefing(s: Scenario): string {
 validateScenario(s);
 const uncertainty=strategyUncertainty(s);
 const c=s.conditions,a=simulate(s.plans[0],c),b=simulate(s.plans[1],c),delta=a.slice(-1)[0]!.cumulative-b.slice(-1)[0]!.cumulative;
 return [`# ${s.name}`,'','Educational estimate — illustrative coefficients, not a prediction or official race data.','',...(s.race?[`Event: ${s.race.name}; season ${s.race.season}; round ${s.race.round}; circuit ${s.race.circuit}; date ${s.race.date}.`,`Archive reference: winner completed ${s.race.recordedLaps??'unknown'} laps; winner fastest lap ${s.race.fastestLapSeconds??'unknown'} seconds. References are not predictions or scheduled race distance.`,'']:[]),`Race: ${c.laps} laps; baseline ${c.baseLap}s/lap; pit loss ${c.pitLoss}s; degradation multiplier ${c.degradation}×.`,`Rain: ${c.rain}% from lap ${c.rainLap}; safety car: ${c.safetyLap?`lap ${c.safetyLap}, ${c.safetyDuration} laps`:'off'}.`,'',...s.plans.flatMap((p,i)=>[`## ${p.name}`,`Compounds: ${p.compounds.join(' → ')}. Stops at end of laps: ${p.pits.join(', ')||'none'}.`,`Estimated total: ${duration((i===0?a:b).slice(-1)[0]!.cumulative)}.`,...planWarnings(p,c),'']),`Comparison: ${Math.abs(delta)<.05?'Effectively tied':`${delta<0?s.plans[0].name:s.plans[1].name} is ${Math.abs(delta).toFixed(1)}s quicker in this model`}.`,'','## Strategy recommendation',recommendation(s),'','## Strategy uncertainty forecast',`Across ${uncertainty.count} paired assumption samples: A leads ${uncertainty.aShare.toFixed(1)}%, B leads ${uncertainty.bShare.toFixed(1)}%, tied ${uncertainty.tieShare.toFixed(1)}%. These are sample shares, not calibrated real-race probabilities. Varies tyre wear ±20%, pit loss ±5s, rain onset ±3 laps and rain intensity ±10 points if rain is enabled; safety-car timing stays fixed.`,'','## Sensitivity checks','Check | A total (s) | B total (s) | A minus B (s)','--- | --- | --- | ---',...sensitivity(s).map(r=>`${r.label} | ${r.a.toFixed(2)} | ${r.b.toFixed(2)} | ${r.gap.toFixed(2)}`),'','## Dry baseline (no safety car)',...baselineComparison(s).map(r=>`${r.name}: ${duration(r.baseline)}; current conditions change total by ${r.difference>=0?'+':''}${r.difference.toFixed(1)}s.`),'','## Model assumptions','Tyre age adds a linear lap-time penalty; fresh tyres reset age. Rain starts abruptly and stays constant. Safety-car laps have a common minimum time and 55% of normal pit loss. A pit stop occurs at the end of its chosen lap. No traffic, overtaking, fuel burn, temperature, track evolution, red flags or automatic tyre changes are simulated. Tyre-rule notes are prompts to check event rules, not eligibility validation.','','## Lap comparison','Lap | A compound | A lap (s) | A total (s) | B compound | B lap (s) | B total (s)','--- | --- | --- | --- | --- | --- | ---',...a.map((r,i)=>`${r.lap} | ${r.compound}${r.pit?' (pit)':''} | ${r.seconds.toFixed(2)} | ${r.cumulative.toFixed(2)} | ${b[i].compound}${b[i].pit?' (pit)':''} | ${b[i].seconds.toFixed(2)} | ${b[i].cumulative.toFixed(2)}`)].join('\n');
}

export type RankedPlan = {plan:Plan; total:number; gain:number; source:number};
export const totalTime=(plan:Plan,c:Conditions)=>simulate(plan,c).slice(-1)[0].cumulative;
/** Exact top-five dynamic programme for the selected compound sequences.
 * Each stint costs only its own laps under the existing independent-lap model.
 * This does not search alternative compounds, traffic or regulatory eligibility.
 */
export function optimisePitLaps(s:Scenario,minStint=3):RankedPlan[]{
 validateScenario(s);
 if(!Number.isInteger(minStint)||minStint<1||minStint>20)throw Error('Minimum stint must be a whole number from 1 to 20.');
 const c=s.conditions,L=c.laps,ranked:RankedPlan[]=[];
 type Node={total:number;pits:number[]};
 const order=(a:Node,b:Node)=>a.total-b.total||a.pits.join(',').localeCompare(b.pits.join(','));
 s.plans.forEach((original,source)=>{
  const count=original.compounds.length;
  if(count*minStint>L)return;
  const costs=new Map<Compound,number[][]>();
  for(const compound of new Set(original.compounds)){
   const table=Array.from({length:L},()=>Array(L+1).fill(0));
   for(let start=0;start<L;start++){
    let sum=0;
    for(let end=start+1;end<=L;end++){
     sum+=lapSeconds(compound,end-start-1,end,c,false);
     table[start][end]=sum;
    }
   }
   costs.set(compound,table);
  }
  let previous:Node[][]=Array.from({length:L+1},()=>[]);previous[0]=[{total:0,pits:[]}];
  for(let stint=0;stint<count;stint++){
   const next:Node[][]=Array.from({length:L+1},()=>[]);
   const final=stint===count-1;
   for(let end=(stint+1)*minStint;end<=L-(count-stint-1)*minStint;end++){
    if(final&&end!==L)continue;
    const options:Node[]=[];
    const pitCost=final?0:c.pitLoss*(isSafetyLap(end,c)?.55:1);
    for(let start=stint*minStint;start<=end-minStint;start++){
     for(const prefix of previous[start])options.push({total:prefix.total+costs.get(original.compounds[stint])![start][end]+pitCost,pits:final?prefix.pits:[...prefix.pits,end]});
    }
    next[end]=options.sort(order).slice(0,5);
   }
   previous=next;
  }
  const originalTime=totalTime(original,c);
  for(const candidate of previous[L]){
   const plan={...original,pits:candidate.pits,compounds:[...original.compounds]};
   const total=totalTime(plan,c);
   ranked.push({plan,total,gain:originalTime-total,source});
  }
 });
 return ranked.sort((a,b)=>a.total-b.total||a.source-b.source||a.plan.pits.join(',').localeCompare(b.plan.pits.join(','))).slice(0,10);
}
export function stintTimeline(plan:Plan,laps:number){
 return plan.compounds.map((compound,i)=>{const start=i===0?1:plan.pits[i-1]+1;const end=plan.pits[i]??laps;return {compound,start,end,length:end-start+1};});
}
export function sensitivity(s:Scenario){
 validateScenario(s);
 const c=s.conditions;
 const variations:[string,Conditions][]=[['Current assumptions',c],['Tyre wear −20%',{...c,degradation:Math.max(0,c.degradation*.8)}],['Tyre wear +20%',{...c,degradation:Math.min(3,c.degradation*1.2)}],['Pit loss −5s',{...c,pitLoss:Math.max(5,c.pitLoss-5)}],['Pit loss +5s',{...c,pitLoss:Math.min(60,c.pitLoss+5)}],['Rain starts 3 laps earlier',{...c,rainLap:Math.max(1,c.rainLap-3)}],['Rain starts 3 laps later',{...c,rainLap:Math.min(c.laps,c.rainLap+3)}]];
 return variations.map(([label,conditions])=>{const a=totalTime(s.plans[0],conditions),b=totalTime(s.plans[1],conditions),gap=a-b;return {label,a,b,gap,winner:Math.abs(gap)<.05?null:gap<0?0:1};});
}
export function recommendation(s:Scenario):string {
 const rows=sensitivity(s),base=rows[0];
 const wins=[0,1].map(i=>rows.filter(r=>r.winner===i).length);
 const summary=base.winner===null?'The plans are effectively tied at current assumptions.':`${s.plans[base.winner].name} leads by ${Math.abs(base.gap).toFixed(1)}s at current assumptions.`;
 return `${summary} A leads in ${wins[0]} of ${rows.length} checks; B leads in ${wins[1]}; ${rows.filter(r=>r.winner===null).length} are tied. These are deterministic what-if checks, not probabilities. Compounds and pit laps stay fixed; values are clamped to the supported ranges, so some checks can be identical.`;
}

export function strategyUncertainty(s:Scenario,count=200){
 validateScenario(s);
 if(!Number.isInteger(count)||count<20||count>1000)throw Error('Use 20–1000 samples.');
 let seed=87023;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const clamp=(n:number,low:number,high:number)=>Math.max(low,Math.min(high,n));
 const times:[number[],number[]]=[[],[]];let aWins=0,bWins=0,ties=0;
 for(let i=0;i<count;i++){
  const c={...s.conditions,degradation:clamp(s.conditions.degradation*(.8+.4*random()),0,3),pitLoss:clamp(s.conditions.pitLoss+(random()-.5)*10,5,60),rainLap:clamp(s.conditions.rainLap+Math.floor(random()*7)-3,1,s.conditions.laps),rain:s.conditions.rain===0?0:clamp(s.conditions.rain+(random()-.5)*20,0,100)};
  const a=totalTime(s.plans[0],c),b=totalTime(s.plans[1],c);times[0].push(a);times[1].push(b);
  if(Math.abs(a-b)<.05)ties++;else if(a<b)aWins++;else bWins++;
 }
 const summaries=times.map(values=>{const sorted=[...values].sort((a,b)=>a-b);return {mean:values.reduce((a,b)=>a+b,0)/count,low:sorted[Math.floor((count-1)*.1)],high:sorted[Math.floor((count-1)*.9)]};});
 return {count,aShare:aWins/count*100,bShare:bWins/count*100,tieShare:ties/count*100,summaries};
}
