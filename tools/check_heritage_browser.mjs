import {reviewEnvironment} from './review_environment.mjs';
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
const api=spawn(process.env.PYTHON||'python',['-m','uvicorn','main:app','--host','127.0.0.1','--port',String(port)],{cwd:path.join(root,'backend'),env:reviewEnvironment(),stdio:'ignore'});
let server,browser;
const checks=[],errors=[];
const preview=process.env.FASTONE_REVIEW_SCREENSHOTS || path.join(root,'docs/previews');await mkdir(preview,{recursive:true});
const stage2=path.join(preview,'stage2');await mkdir(stage2,{recursive:true});
try{
 for(let i=0;i<100;i++){
  try{if((await fetch(`http://127.0.0.1:${port}/api/heritage/entities`)).ok)break;}catch{}
  if(i===99)throw Error('Isolated backend does not start');
  await new Promise(r=>setTimeout(r,100));
 }
 server=await createServer({root:path.join(root,'frontend'),configFile:false,server:{host:'127.0.0.1',port:0,proxy:{'/api':`http://127.0.0.1:${port}`}}});await server.listen();
 const url=`http://127.0.0.1:${server.httpServer.address().port}/#museum?section=origins`;
 browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE_PATH?{executablePath:process.env.BROWSER_EXECUTABLE_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>sessionStorage.setItem('fastone.pit-intro.seen.v1','1'));
 await page.goto(url);
 const gallery=page.locator('.heritage-catalogue');
 await gallery.getByRole('button',{name:'Next',exact:true}).waitFor();
 assert.match(await gallery.innerText(),/10 records match/);
 await gallery.screenshot({style:'.site-header {visibility:hidden !important}',path:path.join(preview,'heritage-desktop.png')});checks.push('desktop real API catalogue');
 await gallery.getByRole('button',{name:'Next',exact:true}).click();
 await gallery.getByText('7–10 of 10',{exact:true}).waitFor();checks.push('pagination');
 await gallery.getByLabel('Record type').selectOption('vehicle');
 await gallery.getByRole('button',{name:/Explore Alfa Romeo GP/}).click();
 await gallery.getByRole('heading',{name:'Alfa Romeo GP Tipo 158 “Alfetta”',exact:true}).waitFor();
 assert.match(await gallery.innerText(),/620 kg/);assert.match(await gallery.innerText(),/unspecified/);assert.match(await gallery.innerText(),/Not available/);
 await gallery.screenshot({style:'.site-header {visibility:hidden !important}',path:path.join(preview,'heritage-vehicle.png')});checks.push('vehicle claims, citations, missing data');
 await gallery.getByRole('button',{name:'← Back to results',exact:true}).click();
 await gallery.getByRole('button',{name:'Clear filters',exact:true}).click();
 await gallery.getByLabel('Search the collection').fill('nothing-matches-this');
 await gallery.getByText(/No reviewed records match/).waitFor();checks.push('empty state');
 await gallery.getByRole('button',{name:'Clear filters',exact:true}).click();
 await gallery.getByLabel('Record type').selectOption('race');
 await gallery.getByRole('button',{name:'Explore 1950 British Grand Prix →',exact:true}).click();
 await gallery.getByRole('table').waitFor();
 assert.equal(await gallery.locator('tbody tr').count(),4);assert.match(await gallery.innerText(),/partial coverage/);checks.push('partial race and qualifying coverage');
 await gallery.getByRole('button',{name:'← Back to results',exact:true}).click();
 await page.setViewportSize({width:390,height:844});
 await gallery.getByRole('button',{name:'Clear filters',exact:true}).click();
 await gallery.getByText('10 records match · silverstone-1950-v1',{exact:true}).waitFor();
 assert.equal(await gallery.evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
 assert.equal(await gallery.locator(':scope > header').evaluate(el=>getComputedStyle(el).display),'block');
 await gallery.screenshot({style:'.site-header {visibility:hidden !important}',path:path.join(preview,'heritage-mobile.png')});checks.push('390px responsive gallery');
 await page.route('**/api/heritage/entities?**',route=>route.fulfill({status:503,body:'{}',contentType:'application/json'}));
 await gallery.getByLabel('Search the collection').fill('Alfa');
 await gallery.getByRole('alert').waitFor();
 await page.unroute('**/api/heritage/entities?**');
 await gallery.getByRole('button',{name:'Retry collection'}).click();
 await gallery.getByText('2 records match · silverstone-1950-v1',{exact:true}).waitFor();checks.push('HTTP failure and retry');
 await page.route('**/api/heritage/entities?**',async route=>{await new Promise(r=>setTimeout(r,500));await route.continue();});
 await gallery.getByLabel('Search the collection').fill('Farina');
 await gallery.getByText('Loading the research collection…',{exact:true}).waitFor();
 await gallery.getByLabel('Search the collection').fill('Alfetta');
 await gallery.getByRole('button',{name:/Explore Alfa Romeo GP/}).waitFor();checks.push('loading state and stale-search cancellation');
 await gallery.getByLabel('Search the collection').focus();
 await page.keyboard.press('Tab');assert.equal(await gallery.getByLabel('Record type').evaluate(el=>el===document.activeElement),true);checks.push('keyboard filter navigation');

 await page.unroute('**/api/heritage/entities?**');
 await gallery.getByRole('button',{name:'Clear filters',exact:true}).click();
 await gallery.getByText('10 records match · silverstone-1950-v1',{exact:true}).waitFor();
 for(const [name,width,height] of [['desktop',1440,1000],['tablet',834,1112],['mobile',390,844]]){
  await page.setViewportSize({width,height});
  assert.equal(await gallery.evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  assert.equal(await gallery.locator('.hc-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),name==='desktop'?3:name==='tablet'?2:1);
  await gallery.screenshot({style:'.site-header {visibility:hidden !important}',path:path.join(stage2,'after-'+name+'.png')});
  await gallery.getByRole('button',{name:'03 / The circuit →',exact:true}).click();
  const circuit=gallery.getByRole('region',{name:'Historical circuit experience'});
  await circuit.getByRole('button',{name:'Expand circuit study'}).click();
  assert.equal(await circuit.getByRole('button',{name:'Collapse circuit study'}).getAttribute('aria-expanded'),'true');
  assert.match(await circuit.innerText(),/No track outline is displayed/);
  assert.equal(await circuit.locator('svg,canvas,img').count(),0);
  assert.equal(await circuit.evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
  await circuit.screenshot({style:'.site-header {visibility:hidden !important}',path:path.join(stage2,'circuit-'+name+'.png')});
  await circuit.getByRole('button',{name:'Collapse circuit study'}).click();
  assert.equal(await circuit.getByText('What this layout record supports',{exact:true}).isVisible(),false);
  await gallery.getByRole('button',{name:'← Back to results',exact:true}).click();
 }
 checks.push('desktop/tablet/mobile catalogue and expandable circuit evidence; no invented geometry');
 await page.setViewportSize({width:1440,height:1000});
 await gallery.getByRole('button',{name:'02 / The machine →',exact:true}).click();
 const exhibit=gallery.getByRole('link',{name:'Explore the Alfetta exhibit ↗'});
 await exhibit.click();
 await page.getByRole('heading',{name:'Documented specifications',exact:true}).waitFor();
 assert.match(page.url(),/section=collection&id=alfa-158/);
 checks.push('research record to existing Alfetta exhibit navigation');
 await page.goto(url);await gallery.getByRole('button',{name:'Next',exact:true}).waitFor();
 const card=gallery.locator('.hc-grid>li').first();
 assert.equal(await card.evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
 await page.emulateMedia({reducedMotion:'no-preference'});
 assert.notEqual(await card.evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
 await page.emulateMedia({reducedMotion:'reduce'});
 checks.push('reduced-motion disables hover transitions');
 await page.screenshot({path:path.join(stage2,'museum-context.png'),fullPage:true});
 // Reference captures preserve the actual source-only site's visible states. Missing assets are documented.
 for(const [name,hash,ready] of [['home','#home','.cinematic-heading'],['library','#library','.vehicle-library'],['engineering','#museum?section=innovations','.museum-force'],['race-centre','#replay?year=2025&round=1&name=Australian+Grand+Prix','main']]){
  const reference=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  await reference.addInitScript(()=>sessionStorage.setItem('fastone.pit-intro.seen.v1','1'));
  await reference.goto(url.split('/#')[0]+'/'+hash);
  try{await reference.locator(ready).first().waitFor({timeout:15000});await reference.locator(ready).first().scrollIntoViewIfNeeded();}catch{}
  await reference.screenshot({path:path.join(stage2,'reference-'+name+'.png')});
  await reference.close();
 }
 assert.deepEqual(errors,[]);checks.push('no JavaScript page errors');
 console.log(JSON.stringify({status:'passed',checks,screenshots:['heritage-desktop.png','heritage-vehicle.png','heritage-mobile.png']},null,2));
}catch(error){
 if(browser){const pages=browser.contexts()[0].pages();if(pages.length)console.error('Gallery at failure:',await pages[0].locator('.heritage-catalogue').innerText());}
 throw error;
}finally{
 if(browser)await browser.close();
 if(server)await server.close();
 api.kill('SIGTERM');
}
