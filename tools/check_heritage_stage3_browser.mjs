/** Local browser integration checks. Requires externally installed Playwright + Chromium.
 * No dependency manifests, deployed services or existing processes are changed.
 */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer as netServer} from 'node:net';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
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
const checks=[],errors=[];
const preview=path.join(root,'docs/previews/stage3');await mkdir(preview,{recursive:true});

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
 page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(()=>sessionStorage.setItem('fastone.pit-intro.seen.v1','1'));
 await page.goto(url);
 const gallery=page.locator('.heritage-catalogue');
 await gallery.getByText('10 records match · silverstone-1950-v1',{exact:true}).waitFor();
 await gallery.screenshot({style:'.site-header {visibility:hidden!important}',path:path.join(preview,'original-chapter-desktop.png')});
 checks.push('original 1950 catalogue remains default');
 await gallery.getByRole('button',{name:'1959–60 / Cooper',exact:true}).click();
 await gallery.getByText('19 records match · cooper-1959-1960-v1',{exact:true}).waitFor();
 await gallery.getByRole('heading',{name:'A different balance. A new architecture.',exact:true}).waitFor();
 checks.push('Cooper chapter real API, runtime contracts and 19 records');
 const lesson=gallery.getByRole('region',{name:'Move the engine. Question the balance.'});
 const before=await lesson.getByRole('status').innerText();
 await lesson.getByRole('button',{name:'Behind-driver assumption',exact:true}).click();
 assert.notEqual(await lesson.getByRole('status').innerText(),before);
 await lesson.getByLabel(/^Assumed engine position/).focus();await page.keyboard.press('End');
 assert.equal(await lesson.getByLabel(/^Assumed engine position/).inputValue(),'0.9');
 await lesson.getByText('Model assumptions and historical evidence',{exact:true}).click();
 assert.match(await lesson.innerText(),/does not predict oversteer/);
 checks.push('interactive static balance responds to presets and keyboard; assumptions visible');
 for(const [name,width,height] of [['desktop',1440,1000],['tablet',834,1112],['mobile',390,844],['narrow',320,740]]){
  await page.setViewportSize({width,height});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  assert.equal(await gallery.evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
  await gallery.screenshot({style:'.site-header {visibility:hidden!important}',path:path.join(preview,'cooper-'+name+'.png')});
 }
 checks.push('1440/834/390/320px no document or catalogue overflow');
 await page.setViewportSize({width:1440,height:1000});
 await gallery.getByRole('button',{name:'02 / The machine →',exact:true}).click();
 await gallery.getByRole('heading',{name:'Cooper T51',exact:true}).waitFor();
 const readiness=gallery.getByRole('region',{name:'Historic 3D exhibit readiness'});
 await readiness.waitFor();assert.match(await readiness.innerText(),/No approved historic model/);
 assert.equal(await readiness.locator('canvas,iframe,img').count(),0);
 await gallery.screenshot({style:'.site-header {visibility:hidden!important}',path:path.join(preview,'t51-record.png')});
 await gallery.getByRole('button',{name:/Coventry Climax — selected 2.5-litre configurations →/}).click();
 await gallery.getByRole('heading',{name:'Coventry Climax — selected 2.5-litre configurations',exact:true}).waitFor();
 assert.match(await gallery.innerText(),/No period test sheet/);
 checks.push('vehicle-to-engine relationship, evidence and pending model contract');
 await gallery.getByRole('button',{name:'01 / The race →',exact:true}).click();
 await gallery.getByRole('table').waitFor();assert.match(await gallery.innerText(),/4.5/);assert.match(await gallery.innerText(),/Aintree/);
 checks.push('Aintree selected race rows retain fractional points and venue');
 await gallery.getByRole('button',{name:'03 / The circuit →',exact:true}).click();
 const circuit=gallery.getByRole('region',{name:'Historical circuit experience'});
 await circuit.getByLabel('Compare reviewed event layouts').selectOption('silverstone-1960');
 await circuit.getByRole('heading',{name:'Silverstone — 1960 event layout',exact:true}).waitFor();
 await circuit.getByRole('button',{name:'Expand circuit study',exact:true}).click();
 assert.match(await circuit.innerText(),/No track outline is displayed/);
 assert.equal(await circuit.locator('svg,canvas,img').count(),0);
 for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
  await page.setViewportSize({width,height});
  assert.equal(await circuit.evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
  await circuit.screenshot({style:'.site-header {visibility:hidden!important}',path:path.join(preview,'silverstone-family-'+name+'.png')});
 }
 await circuit.getByLabel('Compare reviewed event layouts').selectOption('silverstone-1950');
 await circuit.getByRole('heading',{name:'Silverstone — 1950 event layout',exact:true}).waitFor();
 checks.push('same-venue 1950/1960 switching; event evidence only, no invented geometry');
 await gallery.getByRole('button',{name:'← Back to results',exact:true}).click();
 await gallery.getByLabel('Record type').selectOption('engine');
 await gallery.getByText('1 records match · cooper-1959-1960-v1',{exact:true}).waitFor();
 await gallery.getByLabel('Search the collection').fill('no such engine');
 await gallery.getByText(/No reviewed records match/).waitFor();
 await gallery.getByRole('button',{name:'Clear filters',exact:true}).click();
 await gallery.getByText('19 records match · cooper-1959-1960-v1',{exact:true}).waitFor();
 checks.push('engine filter, empty result and clear state');
 await page.route('**/api/heritage/entities?**',route=>route.fulfill({status:503,contentType:'application/json',body:'{}'}));
 await gallery.getByLabel('Search the collection').fill('Cooper');
 await gallery.getByRole('alert').waitFor();await page.unroute('**/api/heritage/entities?**');
 await gallery.getByRole('button',{name:'Retry collection',exact:true}).click();
 await gallery.getByRole('button',{name:/Explore Cooper T51/}).waitFor();
 checks.push('Cooper API error and retry preserve typed rendering');
 await gallery.getByRole('button',{name:'1950 / Silverstone',exact:true}).click();
 await gallery.getByText('10 records match · silverstone-1950-v1',{exact:true}).waitFor();
 assert.equal(await gallery.locator('.hc-engineering').count(),0);
 assert.deepEqual(errors,[]);checks.push('return to original chapter resets filters; no page errors');
 console.log(JSON.stringify({status:'passed',checks,screenshots:preview},null,2));
}finally{if(browser)await browser.close();if(server)await server.close();api.kill('SIGTERM');}
