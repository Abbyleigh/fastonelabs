import {readFileSync} from 'node:fs';
import ts from 'typescript';
import test from 'node:test';
import assert from 'node:assert/strict';
const source=readFileSync(new URL('../src/GarageAssets.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ES2020}}).outputText;
const {matchGarageCar}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
test('car identity requires matching team, season and driver',()=>{
 assert.equal(matchGarageCar('hamilton','Ferrari',2026)?.id,'ferrari-2026');
 assert.equal(matchGarageCar('antonelli','Mercedes',2026)?.id,'mercedes-2026');
 assert.equal(matchGarageCar('leclerc','Ferrari',2023)?.id,'ferrari-2023');
 assert.equal(matchGarageCar('hamilton','Ferrari',2023),undefined);
 assert.equal(matchGarageCar('hamilton','Mercedes',2026),undefined);
 assert.equal(matchGarageCar('norris','McLaren',2026)?.id,'mclaren-2026');
 assert.equal(matchGarageCar('norris','Ferrari',2026),undefined);
 assert.equal(matchGarageCar('hamilton','Ferrari',undefined),undefined);
});

test('all eight installed 2026 teams match both correct drivers',()=>{
 const teams=[['Ferrari',['hamilton','leclerc']],['Mercedes',['russell','antonelli']],['McLaren',['norris','piastri']],['Red Bull',['max_verstappen','hadjar']],['Audi',['hulkenberg','bortoleto']],['Aston Martin',['alonso','stroll']],['Cadillac F1 Team',['perez','bottas']],['Haas F1 Team',['ocon','bearman']]];
 for(const [team,drivers] of teams)for(const driver of drivers){assert.ok(matchGarageCar(driver,team,2026));assert.equal(matchGarageCar(driver,team,2025),undefined);}
 for(const [driver,team] of [['sainz','Williams'],['gasly','Alpine F1 Team'],['lawson','RB F1 Team']])assert.equal(matchGarageCar(driver,team,2026),undefined);
});
