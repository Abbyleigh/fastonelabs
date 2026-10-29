import fs from 'node:fs';import ts from '../frontend/node_modules/typescript/lib/typescript.js';
const code=ts.transpileModule(fs.readFileSync(new URL('../frontend/src/GarageAssets.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const {garageCars}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
fs.writeFileSync(new URL('../backups/vehicle-preview-input.json',import.meta.url),JSON.stringify(garageCars));
