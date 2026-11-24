import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const out='work/polish265/field';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{})});
try{
 const page=await browser.newPage({viewport:{width:1448,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{const file=resolve('game',new URL(route.request().url()).pathname.slice(6));try{await route.fulfill({body:await readFile(file),contentType:file.endsWith('.png')?'image/png':/\.(mjs|js)$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});}catch{await route.fulfill({status:404,body:''});}});
 await page.goto('https://appassets.androidplatform.net/game/index.html?native=1');await page.locator('#startupStatus').waitFor({state:'detached'});
 await page.evaluate(async()=>{
  const {createBattle}=await import('./battle.mjs'),{mountBattle}=await import('./battle-view.mjs');
  document.body.innerHTML='<main id="battle"></main>';
  const types=['arquebusier','pikeman','knight','culverin','musketeer','general'];
  const forces=Object.fromEntries(['england','france'].map((owner,side)=>[owner,types.map((type,i)=>({id:(side?'f':'e')+i,owner,type,hp:100}))]));
  const cells=Array.from({length:464},(_,tile)=>{const x=tile%29,y=Math.floor(tile/29);return {terrain:(x<4||x>23)&&y%4!==0?1:x>18&&y<5?2:x<7&&y>11?3:x>25&&y>10?4:0};});
  const b=createBattle({attacker:'england',defender:'france',province:'art-review',nations:{england:{known:[]},france:{known:[]}},forces,activeWidth:29,fortLevel:2,cells});
  Object.assign(b,{phase:'combat',activeSide:0,round:1,ready:[true,true]});
  for(const c of b.cells)c.unit=null;
  const positions=[204,262,321,234,292,350,208,266,325,258,296,354];
  b.units.forEach((u,i)=>{if(u.emplaced)return;u.tile=positions[i];u.done=false;u.fireReady=true;u.moveLeft=4;b.cells[u.tile].unit=u.id;});
  window.fixture=structuredClone(b);window.view=mountBattle(document.querySelector('#battle'),{battle:b,player:'england'});
 });
 await page.waitForTimeout(400);
 // Initial command commits immediately. Animation does not advance or modify it.
 await page.locator('[data-unit=e0]').click();
 const dest=await page.evaluate(async()=>{const {openFieldPaths}=await import('./battle.mjs');return [...openFieldPaths(view.getState(),'e0')].find(([t])=>t!==204)?.[0];});
 await page.locator(`[data-tile="${dest}"]`).click();
 assert.equal(await page.evaluate(()=>view.getState().units.find(u=>u.id==='e0').tile),dest);
 assert.ok(await page.locator(`[data-tile="${dest}"] .battle-formation`).evaluate(e=>e.getAnimations().length>0));
 const committed=await page.evaluate(()=>JSON.stringify(view.getState()));await page.waitForTimeout(450);assert.equal(await page.evaluate(()=>JSON.stringify(view.getState())),committed);
 await page.locator('[data-do=terrain]').click();assert.equal(await page.locator('[data-do=terrain]').getAttribute('aria-pressed'),'true');assert.equal(await page.evaluate(()=>JSON.stringify(view.getState())),committed);await page.locator('[data-do=terrain]').click();
 await page.screenshot({path:out+'/field-1448.png'});
 await page.setViewportSize({width:412,height:915});await page.locator('[data-unit=e1]').click();await page.screenshot({path:out+'/field-412.png'});
 await page.emulateMedia({reducedMotion:'reduce'});
 const next=await page.evaluate(async()=>{const {openFieldPaths}=await import('./battle.mjs');return [...openFieldPaths(view.getState(),'e1')].find(([t])=>t!==262)?.[0];});
 await page.locator(`[data-tile="${next}"]`).click();assert.equal(await page.locator(`[data-tile="${next}"] .battle-formation`).evaluate(e=>e.getAnimations().length),0);
 // Use the same real shot command for effects, not a simulated damage animation.
 await page.evaluate(async()=>{view.destroy();const {mountBattle}=await import('./battle-view.mjs');const b=structuredClone(fixture);for(const c of b.cells)c.unit=null;b.units=b.units.filter(u=>['e0','f0'].includes(u.id));Object.assign(b.units[0],{tile:235,done:false,fireReady:true});Object.assign(b.units[1],{tile:236,hp:100,effective:100});for(const u of b.units)b.cells[u.tile].unit=u.id;view=mountBattle(document.querySelector('#battle'),{battle:b,player:'england'});});
 await page.emulateMedia({reducedMotion:'no-preference'});await page.locator('[data-unit=e0]').click();await page.locator('[data-tile="236"]').click();
 assert.ok(await page.locator('.battle-impact').count());const shot=await page.evaluate(()=>JSON.stringify(view.getState()));await page.waitForTimeout(1000);assert.equal(await page.evaluate(()=>JSON.stringify(view.getState())),shot);assert.equal(await page.locator('.battle-impact,.battle-loss').count(),0);
 assert.deepEqual(errors,[]);await writeFile(out+'/checks.json',JSON.stringify({committedMoveBeforeAnimation:true,noStateChangesFromEffects:true,terrainToggleNoStateChange:true,reducedMotion:true,actualShotFeedback:true,effectsCleanedUp:true,errors},null,2));
 console.log('PASS: movement and shot feedback follow real commands, leave state untouched, honour reduced motion and clean up. Mixed-terrain formations captured at two sizes.');
}finally{await browser.close();}
