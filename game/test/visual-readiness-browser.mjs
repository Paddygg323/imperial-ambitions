import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {createGame,saveGame} from '../engine.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const browser=await chromium.launch({headless:true,...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{})});
const out='work/polish265/loading';await mkdir(out,{recursive:true});
try{
 for(const failure of [false,true]){
  const page=await browser.newPage({viewport:{width:412,height:915}});let release,held=false;const gate=new Promise(r=>release=r);
  const campaign=saveGame(createGame({transportModel:'ports'}));
  await page.addInitScript(saved=>localStorage.setItem('imp2-rebuild-v3',saved),campaign);
  await page.route('**/*',async route=>{
   const file=resolve('game',new URL(route.request().url()).pathname.slice(6));
   if(file.endsWith('landscape/grass.png')||file.endsWith('landscape\\grass.png')){held=true;await gate;if(failure){await route.fulfill({status:503,body:''});return;}}
   try{await route.fulfill({body:await readFile(file),contentType:file.endsWith('.png')?'image/png':/\.(mjs|js)$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});}catch{await route.fulfill({status:404,body:''});}
  });
  await page.goto('https://appassets.androidplatform.net/game/index.html?native=1',{waitUntil:'domcontentloaded'});
  await page.locator('#startupStatus').waitFor();await page.waitForFunction(()=>document.querySelector('#heading').textContent.includes('1500'));
  for(let i=0;i<100&&!held;i++)await page.waitForTimeout(100);
  assert.ok(held);assert.equal(await page.locator('#app').evaluate(e=>getComputedStyle(e).visibility),'hidden');
  assert.equal(await page.locator('#startupStatus').isVisible(),true);
  const saved=await page.evaluate(()=>localStorage.getItem('imp2-rebuild-v3'));
  assert.equal(saved,campaign);
  await page.screenshot({path:out+(failure?'/failure-wait.png':'/loading.png')});release();
  if(failure){await page.getByRole('button',{name:'Try again',exact:true}).waitFor();assert.equal(await page.locator('#app').evaluate(e=>getComputedStyle(e).visibility),'hidden');assert.equal(await page.evaluate(()=>localStorage.getItem('imp2-rebuild-v3')),saved);await page.screenshot({path:out+'/failure.png'});}
  else{await page.locator('#startupStatus').waitFor({state:'detached'});assert.equal(await page.locator('#app').evaluate(e=>getComputedStyle(e).visibility),'visible');const pixels=await page.locator('#map').evaluate(c=>c.toDataURL());await page.waitForTimeout(700);assert.equal(await page.locator('#map').evaluate(c=>c.toDataURL()),pixels,'No late map-art pop-in after reveal');await page.screenshot({path:out+'/ready.png'});}
  await page.close();
 }
 console.log('PASS: delayed map art keeps the full-screen loader; complete reveal is stable; missing art keeps retry visible and does not replace saves.');
}finally{await browser.close();}
