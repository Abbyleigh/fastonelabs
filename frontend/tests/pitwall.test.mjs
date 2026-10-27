import {readFileSync} from 'node:fs';
import ts from 'typescript';
import test from 'node:test';
import assert from 'node:assert/strict';
const compiled=ts.transpileModule(readFileSync(new URL('../src/pitwallState.ts',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ES2020}}).outputText;
const {latest,freshCar,drsStatus}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
test('scrubbing uses only past rows for the exact driver, regardless of input order',()=>{
 const rows=[{time:10,driver_number:44,position:3},{time:5,driver_number:1,position:2},{time:2,driver_number:44,position:4}];
 assert.equal(latest(rows,9,44).position,4);
 assert.equal(latest(rows,11,44).position,3);
 assert.equal(latest(rows,1,44),undefined);
});
test('stale telemetry clears instead of inventing or holding speed indefinitely',()=>{
 const rows=[{time:2,speed:240},{time:10,speed:280}];
 assert.equal(freshCar(rows,3).speed,240);
 assert.equal(freshCar(rows,5),undefined);
 assert.equal(freshCar(rows,0),undefined);
});
test('unknown DRS is distinct from closed and open',()=>{
 assert.equal(drsStatus(null),'Unavailable');assert.equal(drsStatus(0),'Closed');assert.equal(drsStatus(8),'Eligible');assert.equal(drsStatus(12),'Open');assert.equal(drsStatus(9),'Unknown');
});
