import fs from 'node:fs';import ts from '../frontend/node_modules/typescript/lib/typescript.js';
const code=ts.transpileModule(fs.readFileSync(new URL('../frontend/src/heritageData.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020}}).outputText;
const {historicCars:cars,historicEvents:events,references}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const data=JSON.stringify({version:1,references,events,cars},null,2)+'\n',path=new URL('../backend/museum_knowledge.json',import.meta.url);
if(process.argv.includes('--check')){if(!fs.existsSync(path)||fs.readFileSync(path,'utf8')!==data){console.error('Museum knowledge snapshot is stale. Run node tools/export_museum_knowledge.mjs');process.exit(1);}console.log('Museum knowledge snapshot verified');}else{fs.writeFileSync(path,data);console.log('Museum knowledge snapshot exported');}
