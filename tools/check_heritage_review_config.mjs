/** Smoke-test isolated Mac review configuration without touching the shared config. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createServer} from '../frontend/node_modules/vite/dist/node/index.js';
import config from './heritage-review.vite.config.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const environment={...process.env,MUSEUM_AI_ENABLED:'0',RACE_ENGINEER_AI_ENABLED:'0'};
delete environment.GROQ_API_KEY;delete environment.OPENAI_API_KEY;
const apiPort=Number(new URL(config.server.proxy['/api']).port);
const api=spawn(process.env.PYTHON||'python',['-m','uvicorn','main:app','--app-dir','backend','--host','127.0.0.1','--port',String(apiPort),'--no-proxy-headers'],{cwd:root,env:environment,stdio:'ignore'});
let server,collision;
const checks=[];
try{
 assert.equal(config.server.host,'127.0.0.1');assert.equal(config.server.strictPort,true);
 for(let i=0;i<100;i++){
  try{if((await fetch(`http://127.0.0.1:${apiPort}/api/health`)).ok)break;}catch{}
  if(i===99)throw Error('Review backend fails to start; check Python dependencies or occupied port');
  await new Promise(resolve=>setTimeout(resolve,100));
 }
 server=await createServer({...config,configFile:false});await server.listen();
 const base=`http://127.0.0.1:${config.server.port}`;
 assert.equal((await fetch(base)).status,200);
 const catalogue=await fetch(base+'/api/heritage/entities');assert.equal(catalogue.status,200);assert.equal((await catalogue.json()).total,10);
 const historian=await fetch(base+'/api/museum/historian?question=carbon%20chassis');assert.equal(historian.status,200);assert.equal((await historian.json()).mode,'curated-retrieval');
 checks.push('review config serves frontend and proxies catalogue/curated historian to isolated backend');
 const museum=await fetch(base+'/api/museum/historian',{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:JSON.stringify({question:'carbon chassis'})});assert.equal(museum.status,403);
 const engineer=await fetch(base+'/api/race-engineer/ask',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});assert.equal(engineer.status,503);
 checks.push('review AI remains disabled or rejected by existing local-origin guard; no provider key supplied');
 collision=await createServer({...config,configFile:false,logLevel:'silent'});
 await assert.rejects(collision.listen(),/already in use/);
 assert.equal((await fetch(base+'/api/health')).status,200);
 checks.push('strict port collision rejects second frontend and leaves first service working');
 console.log(JSON.stringify({status:'passed',checks},null,2));
}finally{
 if(collision)await collision.close();if(server)await server.close();api.kill('SIGTERM');
}
