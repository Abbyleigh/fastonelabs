/** Repeatable source-snapshot profile. Software GPU/loopback results are not Mac budgets. */
import {reviewEnvironment} from './review_environment.mjs';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {preview} from '../frontend/node_modules/vite/dist/node/index.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const freePort=()=>new Promise(resolve=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
const port=await freePort();
const api=spawn(process.env.PYTHON||'python',['-m','uvicorn','main:app','--app-dir','backend','--host','127.0.0.1','--port',String(port),'--no-proxy-headers'],{cwd:root,env:reviewEnvironment(),stdio:'ignore'});
let server,browser;
try{
 for(let i=0;i<100;i++){try{if((await fetch(`http://127.0.0.1:${port}/api/health`)).ok)break;}catch{}if(i===99)throw Error('Backend unavailable');await new Promise(r=>setTimeout(r,100));}
 server=await preview({root:root+'frontend',configFile:false,preview:{host:'127.0.0.1',port:await freePort(),strictPort:true,proxy:{'/api':`http://127.0.0.1:${port}`}}});
 const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const base=`http://127.0.0.1:${server.httpServer.address().port}`;
 const samples=[];
 for(const screen of ['museum','library'])for(let run=0;run<3;run++){
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),page=await context.newPage();
  const failures=[],errors=[];page.on('requestfailed',r=>failures.push(new URL(r.url()).pathname));page.on('pageerror',e=>errors.push(e.message));
  // Block direct third-party browser requests; backend GETs may use their own provider caches.
  await page.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
  await page.addInitScript(()=>sessionStorage.setItem('fastone.pit-intro.seen.v1','1'));
  const started=performance.now();await page.goto(base+'/#'+screen);
  if(screen==='museum')await page.locator('.heritage-catalogue').getByText(/10 records match/).waitFor();else await page.locator('.vehicle-canvas canvas').waitFor();
  const readyMs=performance.now()-started;
  const cdp=await context.newCDPSession(page);await cdp.send('Performance.enable');
  const metrics=async()=>Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
  await page.waitForTimeout(500);await cdp.send('HeapProfiler.collectGarbage');const before=await metrics(),idleStarted=performance.now();
  await page.waitForTimeout(2000);const after=await metrics(),idleWallMs=performance.now()-idleStarted;
  const resources=await page.evaluate(()=>performance.getEntriesByType('resource').map(r=>({path:new URL(r.name).pathname,transfer:r.transferSize,decoded:r.decodedBodySize})));
  samples.push({screen,run,readyMs:Math.round(readyMs),canvases:await page.locator('canvas').count(),heapMiB:+(after.JSHeapUsedSize/1048576).toFixed(2),idleWallMs:Math.round(idleWallMs),idleTaskMs:+((after.TaskDuration-before.TaskDuration)*1000).toFixed(2),localTransferBytes:resources.reduce((sum,r)=>sum+r.transfer,0),failedRequests:failures,pageErrors:errors});
  await context.close();
 }
 const apiSamples=[];
 for(const collection of ['silverstone-1950','cooper-1959-1960']){
  const url=`http://127.0.0.1:${port}/api/heritage/entities?collection=${collection}`;
  const first=await fetch(url),etag=first.headers.get('etag'),body=await first.text(),times=[];
  for(let i=0;i<50;i++){const t=performance.now();const response=await fetch(url);await response.arrayBuffer();times.push(performance.now()-t);}
  times.sort((a,b)=>a-b);apiSamples.push({collection,responseBytes:Buffer.byteLength(body),warmMedianMs:+times[25].toFixed(2),warmP95Ms:+times[47].toFixed(2),conditionalStatus:(await fetch(url,{headers:{'If-None-Match':etag}})).status});
 }
 console.log(JSON.stringify({environment:'production build; Chromium software GL; blocked external resources; cold browser contexts; 2s idle window; JS heap is not GPU/process memory',samples,apiSamples},null,2));
}finally{if(browser)await browser.close();if(server)await new Promise(r=>server.httpServer.close(r));api.kill('SIGTERM');}
