import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/paddy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const folder='outputs/visual-review/royal243';await mkdir(folder,{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1180,height:940}}),errors=[],missing=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{const u=new URL(route.request().url()),file=resolve('game',u.pathname.slice(6));try{await route.fulfill({body:await readFile(file),contentType:/\.m?js$/.test(file)?'text/javascript':file.endsWith('.png')?'image/png':file.endsWith('.css')?'text/css':'text/html'});}catch{missing.push(u.pathname);await route.fulfill({status:404,body:''});}});
 await page.goto('https://appassets.androidplatform.net/game/index.html?native=1');await page.locator('#startupStatus').waitFor({state:'detached'});
 const before=await page.evaluate(()=>localStorage.getItem('imp2-rebuild-v3'));
 const coverage=await page.evaluate(async()=>{
  const {MILITARY_TYPES,MILITARY_ATLAS,militaryPortrait,militarySprite,drawMilitarySprite}=await import('./military-art.mjs'),{ARMY,nameOf}=await import('./rules.mjs');
  const sheet=new Image();sheet.src=MILITARY_ATLAS.url;await sheet.decode();
  const root=document.createElement('section');root.id='artReview';root.style='position:fixed;inset:0;z-index:4000;background:#092d40;overflow:auto;padding:20px;color:#ffe7b5;display:grid;grid-template-columns:repeat(6,1fr);gap:10px';
  root.innerHTML=MILITARY_TYPES.map(type=>`<article style="border:1px solid #bd9658;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:5px;background:#f1ddb3;color:#3c2815">${militaryPortrait(type)}<b style="font:14px Georgia">${nameOf(type)}</b><small>Era ${ARMY[type].era}</small><canvas width="44" height="44" data-type="${type}" aria-label="Map-size ${type}"></canvas></article>`).join('');document.body.append(root);
  for(const c of root.querySelectorAll('canvas')){c.style='width:44px;height:44px;flex:none';drawMilitarySprite(c.getContext('2d'),sheet,c.dataset.type,22,22,44);}
  return {types:MILITARY_TYPES,ruleTypes:Object.keys(ARMY),indices:MILITARY_TYPES.map(militarySprite),width:sheet.naturalWidth,height:sheet.naturalHeight};
 });
 assert.deepEqual([...coverage.types].sort(),coverage.ruleTypes.sort());assert.equal(new Set(coverage.indices).size,30);assert.equal(coverage.width/6,coverage.height/5,'square atlas cells');
 const sizes=await page.locator('#artReview .military-portrait').evaluateAll(es=>es.map(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return {w:r.width,h:r.height,bg:s.backgroundImage,size:s.backgroundSize};}));
 const crops=await page.locator('#artReview .military-paint').evaluateAll(es=>es.map(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect(),p=e.parentElement.getBoundingClientRect();return {bg:s.backgroundImage,w:r.width,h:r.height,inFrame:r.x>=p.x&&r.y>=p.y&&r.right<=p.right+.1&&r.bottom<=p.bottom+.1};}));
 assert.equal(crops.length,30);assert.ok(crops.every(c=>c.bg.includes('royal-regiments.png')&&c.w>25&&c.h>25&&c.inFrame));
 assert.ok(sizes.every(s=>s.w===72&&s.h===72));
 await page.screenshot({path:folder+'/regiment-catalog.png'});
 for(const viewport of [{width:412,height:915},{width:915,height:412}]){
  await page.setViewportSize(viewport);await page.locator('#artReview').evaluate(e=>{e.style.gridTemplateColumns=innerWidth<500?'repeat(3,1fr)':'repeat(6,1fr)';});
  await page.screenshot({path:folder+'/regiments-'+viewport.width+'.png'});
  assert.ok(await page.locator('#artReview').evaluate(e=>e.scrollWidth<=e.clientWidth));
 }
 assert.equal(await page.evaluate(()=>localStorage.getItem('imp2-rebuild-v3')),before);assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
 console.log('PASS: all30 engine regiment types have unique loaded portraits, square CSS/canvas crops, phone/landscape gallery, no missing files/errors or campaign mutation.');
}finally{await browser.close();}
