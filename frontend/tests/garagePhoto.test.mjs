import {readFileSync}from'node:fs';import ts from'typescript';import test from'node:test';import assert from'node:assert/strict';
const compiled=ts.transpileModule(readFileSync(new URL('../src/garagePhoto.ts',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ES2020}}).outputText;
const{coverRect}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
test('export photo uses the same centered cover framing as the viewer',()=>{assert.deepEqual(coverRect(1920,1280,900,600),{x:0,y:0,width:900,height:600});const r=coverRect(1920,1280,1200,410);assert.equal(r.width,1200);assert.equal(r.height,800);assert.equal(r.y,-195);assert.equal(r.x,0);});
