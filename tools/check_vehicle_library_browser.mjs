/** Local browser integration checks. Requires externally installed Playwright + Chromium.
 * No dependency manifests, deployed services or existing processes are changed.
 */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer as netServer} from 'node:net';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createServer} from '../frontend/node_modules/vite/dist/node/index.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const modulePath=process.env.PLAYWRIGHT_MODULE || (process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES ? process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright' : 'playwright');
const {chromium}=createRequire(import.meta.url)(modulePath);
const freePort=()=>new Promise(resolve=>{const s=netServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
const port=await freePort();
const api=spawn(process.env.PYTHON||'python',['-m','uvicorn','main:app','--host','127.0.0.1','--port',String(port)],{cwd:path.join(root,'backend'),stdio:'ignore'});
let server,browser;
const checks=[];

try{
 for(let i=0;i<100;i++){
  try{if((await fetch(`http://127.0.0.1:${port}/api/heritage/entities`)).ok)break;}catch{}
  if(i===99)throw Error('Isolated backend does not start');
  await new Promise(r=>setTimeout(r,100));
 }
 server=await createServer({root:path.join(root,'frontend'),configFile:false,server:{host:'127.0.0.1',port:await freePort(),strictPort:true,proxy:{'/api':`http://127.0.0.1:${port}`}}});await server.listen();
 const url=`http://127.0.0.1:${server.httpServer.address().port}/#museum?section=origins`;
 browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE_PATH?{executablePath:process.env.BROWSER_EXECUTABLE_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 await page.addInitScript(()=>{
  sessionStorage.setItem('fastone.pit-intro.seen.v1','1');
  window.__forceVehicleGraphicsFailure=true;
  const getContext=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(kind,...args){
   const comparison=this.closest('.vehicle-comparison');
   const blocked=window.__forceVehicleGraphicsFailure||(window.__failComparisonOnly&&comparison?.children[1]?.contains(this));
   if(blocked&&['webgl','webgl2','experimental-webgl'].includes(kind))return null;
   return getContext.call(this,kind,...args);
  };
 });
 await page.goto(url.split('/#')[0]+'/#library');
 const library=page.locator('.vehicle-library');
 await library.getByRole('heading',{name:'Interactive vehicle preview unavailable.',exact:true}).waitFor();
 assert.equal(await page.getByText('This page could not open.',{exact:true}).count(),0);
 await library.getByRole('heading',{name:'THE VEHICLE LIBRARY.',exact:true}).waitFor();
 assert.match(await library.innerText(),/Original project geometry/);
 checks.push('canvas creation failure stays inside library preview; catalogue and provenance survive');
 await library.getByLabel('Search model or livery').fill('nothing matches this');
 await library.getByText('No vehicles match. Clear a filter or save a favourite.',{exact:true}).waitFor();
 await library.getByLabel('Search model or livery').fill('');
 await library.getByRole('button',{name:'☆ Save favourite',exact:true}).click();
 assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('ri-personal-garage-v1')).favourites),['original-study']);
 checks.push('search and favourites remain functional after preview failure');
 await library.getByRole('button',{name:'Retry vehicle preview',exact:true}).click();
 await library.getByRole('heading',{name:'Interactive vehicle preview unavailable.',exact:true}).waitFor();
 assert.equal(await page.getByText('This page could not open.',{exact:true}).count(),0);
 checks.push('retry under continued graphics failure preserves page');
 await page.evaluate(()=>{window.__forceVehicleGraphicsFailure=false;});
 const capable=await page.evaluate(()=>!!document.createElement('canvas').getContext('webgl2'));
 assert.equal(capable,true,'A graphics-capable browser is required to verify recovery (software GL is sufficient).');
 await library.getByRole('button',{name:'Retry vehicle preview',exact:true}).click();
 await library.getByRole('button',{name:'Fit complete model',exact:true}).waitFor();
 assert.equal(await library.getByRole('heading',{name:'Interactive vehicle preview unavailable.',exact:true}).count(),0);
 assert.ok(await library.locator('canvas').count()>0);
 checks.push('retry recovers the real procedural viewer when WebGL becomes available');
 await page.evaluate(()=>{window.__failComparisonOnly=true;});
 await library.getByRole('button',{name:'Comparison laboratory',exact:true}).click();
 await library.getByRole('heading',{name:'Interactive vehicle preview unavailable.',exact:true}).waitFor();
 assert.equal(await library.getByRole('button',{name:'Fit complete model',exact:true}).count(),1);
 assert.match(await library.innerText(),/Read the geometry, question the numbers/);
 checks.push('failed comparison preview does not remove the working primary viewer or comparison text');
 await page.setViewportSize({width:390,height:844});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
 checks.push('390px failure state has no document overflow');
 await page.evaluate(()=>{window.__forceVehicleGraphicsFailure=true;});
 await page.goto(url.split('/#')[0]+'/#personal-garage');
 await page.getByRole('heading',{name:'YOUR PERSONAL GARAGE.',exact:true}).waitFor();
 await page.getByRole('heading',{name:'Interactive vehicle preview unavailable.',exact:true}).waitFor();
 assert.equal(await page.getByText('This page could not open.',{exact:true}).count(),0);
 checks.push('personal garage shares contained failure behaviour');
 console.log(JSON.stringify({status:'passed',checks},null,2));
}finally{if(browser)await browser.close();if(server)await server.close();api.kill('SIGTERM');}
