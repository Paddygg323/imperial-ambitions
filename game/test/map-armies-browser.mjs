import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/paddy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{const page=await browser.newPage({viewport:{width:412,height:915},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',async route=>{const u=new URL(route.request().url());try{const file=resolve('game',u.pathname.slice(6));const body=await readFile(file);await route.fulfill({body,contentType:file.endsWith('.png')?'image/png':file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});}catch{await route.fulfill({status:404,body:''});}});
await page.goto('https://appassets.androidplatform.net/game/index.html?native=1');await page.waitForFunction(()=>document.querySelector('#heading').textContent.includes('1500'));await page.waitForTimeout(600);await mkdir('outputs/visual-review',{recursive:true});

await page.locator('[data-panel=army]').tap();
await page.getByRole('button',{name:'Show garrison',exact:true}).first().tap();
const box=await page.locator('#map').boundingBox();
await page.touchscreen.tap(box.x+box.width/2-54*.85,box.y+box.height/2+54*.78-12);
assert.equal(await page.locator('#panel').evaluate(e=>e.open),true);
assert.equal(await page.locator('#panelTitle').innerText(),'Army');
assert.ok(await page.locator('[data-action=selectRegiment]').filter({hasText:'✓'}).count()>0,'Tapping garrison selects its actual regiments');
await page.screenshot({path:'outputs/visual-review/map-army-selection.png'});
await page.locator('#closePanel').tap();await page.screenshot({path:'outputs/visual-review/map-army-local.png'});
await page.locator('#nationView').tap();await page.screenshot({path:'outputs/visual-review/map-army-nation.png'});
// Isolated crowded capital: use actual painted sprite/marker positions at each zoom.
await page.evaluate(async()=>{
 const {createGame}=await import('./engine.mjs'),{createMap}=await import('./map.mjs');const state=createGame(),tile=state.nations.england.capital,province=state.tiles.find(t=>t.id===tile).province;
 for(const c of state.civilians.filter(c=>c.owner==='england')){c.tile=tile;c.order=null;}
 state.armies=Array.from({length:7},(_,i)=>({id:'map-army-'+i,owner:'england',province,type:'pikeman',hp:100,order:null}));
 const old=document.querySelector('#map'),canvas=old.cloneNode();old.replaceWith(canvas);const ctx=canvas.getContext('2d'),text=ctx.fillText.bind(ctx),arc=ctx.arc.bind(ctx);
 ctx.fillText=(value,x,y,...rest)=>{if(value==='7')window.armyPaint={x,y:y-12};return text(value,x,y,...rest);};
 ctx.arc=(x,y,r,...rest)=>{if(r===4||r===6)window.armyPaint={x,y};return arc(x,y,r,...rest);};
 window.mapArmyTest=createMap(canvas,()=>state,(tile,civilian,regiments)=>window.mapArmyHit={tile,civilian,regiments});mapArmyTest.focus(tile);
});
await page.waitForTimeout(500);
for(const scale of [18,26,35,47,60,8]){
 await page.evaluate(scale=>{window.mapArmyHit=null;window.armyPaint=null;mapArmyTest.zoom(scale/mapArmyTest.viewport().scale);},scale);
 const paint=await page.evaluate(()=>armyPaint);assert.ok(paint,'Army representation must be painted at '+scale);
 const bounds=await page.locator('#map').boundingBox();await page.touchscreen.tap(bounds.x+paint.x,bounds.y+paint.y);
 assert.equal((await page.evaluate(()=>mapArmyHit))?.regiments?.length,7,'Painted garrison selects all seven units at zoom '+scale);
 if(scale===35)await page.screenshot({path:'outputs/visual-review/map-army-crowded-midzoom.png'});
}
assert.deepEqual(errors,[]);console.log('PASS: direct map garrison touch opens Army with selected regiments; local and nation screenshots; no gameplay orders issued.');
}finally{await browser.close();}
