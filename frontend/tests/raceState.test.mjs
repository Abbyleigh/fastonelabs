import test from 'node:test';
import assert from 'node:assert/strict';
import {createRace,stepRace,toCarView,snapshot,restore,classify} from '../src/race/raceState.ts';
test('original state immutable and replayable',()=>{
 const a=createRace(['red','blue']); const b=stepRace(a,0.2).state;
 assert.equal(a.timestampS,0); assert.deepEqual(restore(snapshot(b)),b);
 assert.deepEqual(stepRace(b,0.2).state,stepRace(restore(snapshot(b)),0.2).state);
});
test('render adapter has stable shape and no side effects',()=>{
 const s=createRace(['red','blue']); const before=snapshot(s);const v=toCarView(s,'red');
 assert.equal(v.id,'red');assert.equal(typeof v.lateralOffset,'number');assert.equal(snapshot(s),before);
});
test('speed, lateral displacement and headway remain bounded',()=>{
 let s=createRace(['red','blue']);
 for(let i=0;i<400;i++) s=stepRace(s,0.2).state;
 for(const d of s.drivers){assert.ok(d.velocityMps>=0);assert.ok(Math.abs(d.lateralOffsetM)<=2.11);}
 assert.deepEqual(s.drivers.map(d=>d.position).sort(),[1,2]);
});
test('classification order responds to race distance',()=>{
 const s=createRace(['a','b']);s.drivers[0].lapDistanceM=50;s.drivers[1].lapDistanceM=250;
 assert.equal(classify(s).drivers[0].id,'b');
});
test('one-lap race completes; further steps are idempotent',()=>{
 let s=createRace(['a'],'test',1,100);s.drivers[0].lapDistanceM=90;s.drivers[0].velocityMps=30;
 for(let i=0;i<10 && s.status!=='finished';i++) s=stepRace(s,.5).state;
 assert.equal(s.status,'finished');assert.equal(s.drivers[0].lap,1);
 assert.deepEqual(stepRace(s,.5).state,s);
});
test('faster car eventually overtakes and classifications change',()=>{
 let s=createRace(['slow','fast'],'test',2,500);
 const slow=s.drivers.find(d=>d.id==='slow'); const fast=s.drivers.find(d=>d.id==='fast');
 slow.lapDistanceM=120;slow.velocityMps=20;slow.desiredVelocityMps=20;
 fast.lapDistanceM=100;fast.velocityMps=24;fast.desiredVelocityMps=28;
 s=classify(s);
 let observed=false;
 for(let i=0;i<80;i++){
  const result=stepRace(s,.25);s=result.state;
  if(result.events.some(e=>e.type==='pass'&&e.driverId==='fast'))observed=true;
 }
 assert.equal(observed,true);assert.equal(s.drivers[0].id,'fast');
});
