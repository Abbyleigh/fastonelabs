import {readFileSync} from 'node:fs';
import ts from 'typescript';
import test from 'node:test';
import assert from 'node:assert/strict';
const source=readFileSync(new URL('../src/strategyModel.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ES2020}}).outputText;
const {DEFAULT_SCENARIO,simulate,validateScenario,briefing}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const clone=v=>JSON.parse(JSON.stringify(v));
const base={...DEFAULT_SCENARIO.conditions,laps:10,rainLap:5,baseLap:90,degradation:0};
const total=rows=>rows[rows.length-1].cumulative;
test('one lap per race lap; determinism and no mutation',()=>{
 const s=clone(DEFAULT_SCENARIO),before=JSON.stringify(s),a=simulate(s.plans[0],s.conditions);
 assert.equal(a.length,52);assert.deepEqual(a,simulate(s.plans[0],s.conditions));assert.equal(JSON.stringify(s),before);
 assert.ok(a.every(r=>Number.isFinite(r.seconds)&&r.seconds>0));
});
test('stop charged at end of selected lap; next lap has fresh compound and age',()=>{
 const c={...base,degradation:1};const rows=simulate({name:'x',compounds:['soft','hard'],pits:[4]},c);
 assert.equal(rows[3].compound,'soft');assert.equal(rows[3].pit,true);
 assert.equal(rows[4].compound,'hard');assert.equal(rows[4].seconds,90.6);
 assert.ok(Math.abs(rows[3].seconds-(90-.8+3*.09+22))<1e-8);
});
test('pit time is exactly additional loss with identical tyres and no degradation',()=>{
 const no=simulate({name:'none',compounds:['medium'],pits:[]},base);
 const yes=simulate({name:'one',compounds:['medium','medium'],pits:[4]},base);
 assert.equal(total(yes)-total(no),22);
});
test('safety-car reduction applies only when pit lap falls inside window',()=>{
 const c={...base,safetyLap:4,safetyDuration:2};
 const none=total(simulate({name:'none',compounds:['medium'],pits:[]},c));
 const inside=total(simulate({name:'in',compounds:['medium','medium'],pits:[5]},c));
 const outside=total(simulate({name:'out',compounds:['medium','medium'],pits:[6]},c));
 assert.ok(Math.abs(inside-none-22*.55)<1e-8);assert.equal(outside-none,22);
});
test('rain onset affects only laps from the selected lap; wet tyres help in heavy rain',()=>{
 const p={name:'slicks',compounds:['medium'],pits:[]};const dry=simulate(p,base),rain=simulate(p,{...base,rain:100});
 assert.equal(dry[3].seconds,rain[3].seconds);assert.equal(rain[4].seconds-dry[4].seconds,30);
 const wet=simulate({name:'wet',compounds:['wet'],pits:[]},{...base,rain:100,rainLap:1});
 assert.ok(total(wet)<total(simulate(p,{...base,rain:100,rainLap:1})));
});
test('reject invalid and hostile imported data; reject impossible pit schedules',()=>{
 for(const value of [null,{}, {...clone(DEFAULT_SCENARIO),version:2}])assert.throws(()=>validateScenario(value));
 for(const pits of [[20,10],[0],[52],[2.5],[NaN]]){const s=clone(DEFAULT_SCENARIO);s.plans[0].pits=pits;s.plans[0].compounds=Array(pits.length+1).fill('soft');assert.throws(()=>validateScenario(s));}
 const s=clone(DEFAULT_SCENARIO);s.conditions.baseLap=Infinity;assert.throws(()=>validateScenario(s));
});
test('degradation changes results; exported JSON round trips with same results',()=>{
 const s=clone(DEFAULT_SCENARIO),round=JSON.parse(JSON.stringify(s));validateScenario(round);
 assert.deepEqual(simulate(s.plans[0],s.conditions),simulate(round.plans[0],round.conditions));
 assert.ok(total(simulate(s.plans[0],{...s.conditions,degradation:2}))>total(simulate(s.plans[0],{...s.conditions,degradation:0})));
 const text=briefing(s);assert.ok(text.includes(s.name));assert.ok(text.includes('not a prediction'));assert.ok(text.includes('Lap | A compound'));assert.ok(!text.includes('NaN'));
});
const {scenarioForRace,parseLapTime,baselineComparison}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const race={season:2024,round:12,name:'British Grand Prix',circuit:'Silverstone Circuit',date:'2024-07-07',recordedLaps:52,fastestLapSeconds:88.3};
test('race reference seeds editable conditions and rescales stops',()=>{
 const s=scenarioForRace({...race,recordedLaps:71});validateScenario(s);
 assert.equal(s.conditions.laps,71);assert.equal(s.conditions.baseLap,93.3);
 assert.deepEqual(s.plans[0].pits,[36]);assert.deepEqual(s.plans[1].pits,[24,47]);
 assert.equal(s.race.name,race.name);assert.equal(s.race.recordedLaps,71);
 assert.notEqual(s.race,race);
});
test('missing and out-of-range race references retain declared example defaults',()=>{
 const {recordedLaps,fastestLapSeconds,...calendar}=race;
 assert.equal(scenarioForRace(calendar).conditions.laps,52);
 assert.equal(scenarioForRace({...race,recordedLaps:120,fastestLapSeconds:210}).conditions.baseLap,90);
 assert.equal(scenarioForRace({...race,recordedLaps:120}).conditions.laps,52);
 const short=scenarioForRace({...race,recordedLaps:2});validateScenario(short);assert.deepEqual(short.plans[1].pits,[1]);
});
test('lap-time parser rejects gaps, malformed values and invalid seconds',()=>{
 assert.equal(parseLapTime('1:28.300'),88.3);assert.equal(parseLapTime('0:55.1'),55.1);
 for(const v of [undefined,'+12.0','1:90','garbage','1:2','-1:22'])assert.equal(parseLapTime(v),undefined);
});
test('dry baseline keeps plans intact and isolates condition changes',()=>{
 const s=scenarioForRace(race),before=JSON.stringify(s);
 assert.ok(baselineComparison(s).every(r=>r.difference===0));
 s.conditions.rain=80;const wet=baselineComparison(s);assert.ok(wet.every(r=>r.difference>0));
 assert.equal(wet[0].baseline,baselineComparison(scenarioForRace(race))[0].baseline);
 assert.equal(JSON.stringify(scenarioForRace(race)),before);
});
test('race metadata round trips; briefing includes context; old scenarios still validate',()=>{
 const s=scenarioForRace(race),round=JSON.parse(JSON.stringify(s));validateScenario(round);
 assert.deepEqual(round.race,s.race);assert.ok(briefing(round).includes('Silverstone Circuit'));assert.ok(briefing(round).includes('## Dry baseline'));
 validateScenario(DEFAULT_SCENARIO);
 for(const context of [null,{...race,season:'2024'},{...race,recordedLaps:NaN},{...race,name:{}},{...race,date:'tomorrow'},{...race,fastestLapSeconds:Infinity}])assert.throws(()=>validateScenario({...s,race:context}));
});
const {optimisePitLaps,totalTime,stintTimeline,sensitivity,recommendation}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
test('optimiser agrees with exhaustive two-stop search in rain and safety car',()=>{
 const s=clone(DEFAULT_SCENARIO);s.conditions={...base,laps:12,rain:65,rainLap:7,safetyLap:5,safetyDuration:2,degradation:1.2};
 s.plans=[{name:'wet change',compounds:['soft','medium','intermediate'],pits:[4,8]},{name:'one',compounds:['medium','wet'],pits:[6]}];
 const before=JSON.stringify(s),ranked=optimisePitLaps(s,2);
 for(let source=0;source<2;source++){
  const p=s.plans[source],all=[];
  if(source===0){for(let a=2;a<=8;a++)for(let b=a+2;b<=10;b++)all.push(totalTime({...p,pits:[a,b]},s.conditions));}
  else {for(let a=2;a<=10;a++)all.push(totalTime({...p,pits:[a]},s.conditions));}
  all.sort((a,b)=>a-b);const selected=ranked.filter(r=>r.source===source);assert.equal(selected.length,5);
  selected.forEach((r,i)=>assert.ok(Math.abs(r.total-all[i])<1e-8));
 }
 assert.equal(JSON.stringify(s),before);assert.ok(ranked.every((r,i)=>i===0||r.total>=ranked[i-1].total-1e-8));
});
test('no-stop, infeasible stints and invalid optimiser bounds',()=>{
 const s=clone(DEFAULT_SCENARIO);s.conditions={...base,laps:4,rainLap:2};s.plans=[{name:'none',compounds:['medium'],pits:[]},{name:'one',compounds:['soft','hard'],pits:[2]}];
 assert.equal(optimisePitLaps(s,3).length,1);assert.deepEqual(optimisePitLaps(s,3)[0].plan.pits,[]);assert.equal(optimisePitLaps(s,5).length,0);
 for(const v of [0,21,NaN,1.5])assert.throws(()=>optimisePitLaps(s,v));
});
test('timeline covers all laps without gaps; sensitivity and recommendation exported',()=>{
 const s=clone(DEFAULT_SCENARIO),before=JSON.stringify(s),stints=stintTimeline(s.plans[1],52),rows=sensitivity(s);
 assert.deepEqual(stints.map(s=>[s.start,s.end]),[[1,17],[18,35],[36,52]]);assert.equal(stints.reduce((n,s)=>n+s.length,0),52);
 assert.equal(rows.length,7);assert.equal(rows[0].a,totalTime(s.plans[0],s.conditions));assert.equal(JSON.stringify(s),before);
 assert.ok(rows.every(r=>Number.isFinite(r.gap)));assert.ok(recommendation(s).includes('not probabilities'));assert.ok(briefing(s).includes('## Strategy recommendation'));assert.ok(briefing(s).includes('## Sensitivity checks'));
});
test('100-lap three-stop searches finish within practical runtime',()=>{
 const s=clone(DEFAULT_SCENARIO);s.conditions.laps=100;s.plans=[{name:'a',compounds:['soft','medium','hard','hard'],pits:[20,45,70]},{name:'b',compounds:['medium','hard','medium','hard'],pits:[25,50,75]}];
 const start=performance.now(),rows=optimisePitLaps(s,3),elapsed=performance.now()-start;
 assert.equal(rows.length,10);rows.forEach(r=>validateScenario({...s,plans:[r.plan,r.plan]}));assert.ok(elapsed<3000,`Search took ${elapsed} ms`);
});
const {strategyUncertainty}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
test('uncertainty samples are paired, deterministic and preserve scenario',()=>{
 const s=clone(DEFAULT_SCENARIO),before=JSON.stringify(s),a=strategyUncertainty(s);
 assert.deepEqual(a,strategyUncertainty(s));assert.equal(JSON.stringify(s),before);assert.ok(Math.abs(a.aShare+a.bShare+a.tieShare-100)<1e-8);
 assert.ok(a.summaries.every(r=>r.low<=r.high&&Number.isFinite(r.mean)));
 s.plans[1]=clone(s.plans[0]);const ties=strategyUncertainty(s);assert.equal(ties.tieShare,100);assert.equal(ties.aShare,0);
 assert.throws(()=>strategyUncertainty(s,0));assert.ok(briefing(s).includes('## Strategy uncertainty forecast'));
});
