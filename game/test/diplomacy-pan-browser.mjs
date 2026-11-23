import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const browser=await chromium.launch({headless:true,...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{})});
const output='work/diplomacy-pan-review';await mkdir(output,{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:412,height:915}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{const u=new URL(route.request().url()),file=resolve('game',u.pathname.slice(6));await route.fulfill({body:await readFile(file),contentType:file.endsWith('.png')?'image/png':file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});});
 await page.goto('https://appassets.androidplatform.net/game/index.html?native=1');await page.locator('#startupStatus').waitFor({state:'detached'});
 const saved=()=>page.evaluate(()=>localStorage.getItem('imp2-rebuild-v3'));
 const viewport=()=>page.locator('.atlas-viewport');
 const position=()=>viewport().evaluate(e=>e.scrollLeft);
 const open=()=>page.locator('[data-panel=diplomacy]').click();
 await open();
 assert.equal(await page.locator('[data-action=diplomacyRegion]').count(),0);
 assert.equal(await page.locator('.political-map').count(),1);
 assert.equal(await page.locator('.political-map').getAttribute('viewBox'),'-8 -8 1100 540');
 assert.equal(await page.locator('.atlas-country').count(),12,'Uncharted nations stay hidden');
 await page.locator('.overture-palette').getByRole('button',{name:'Alliance',exact:true}).click();
 await page.waitForTimeout(150);
 const before=await saved(),right=await position();assert.ok(right>250,'Phone map is large enough to scroll across');
 // Begin on a nation with an alliance armed; dragging must not dispatch it.
 const start=await page.getByRole('button',{name:'Select France',exact:true}).evaluate(g=>{const p=g.querySelector('path'),v=p.getAttribute('d').split('Z')[0].match(/-?\d+(?:\.\d+)?/g).map(Number),q=new DOMPoint(v.filter((_,i)=>i%2===0).reduce((a,x)=>a+x,0)/6,v.filter((_,i)=>i%2===1).reduce((a,x)=>a+x,0)/6).matrixTransform(p.getScreenCTM());return {x:q.x,y:q.y};});
 await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(start.x+100,start.y,{steps:10});await page.mouse.up();
 assert.ok(await position()<right-50);assert.equal(await saved(),before,'Dragging across a nation cannot offer an alliance');
 const moved=await position();
 await page.locator('.diplomacy-map-switch').getByRole('button',{name:'Relations map',exact:true}).click();await page.waitForTimeout(100);
 assert.ok(Math.abs(await position()-moved)<2,'Map location survives presentation changes');assert.equal(await saved(),before);
 await viewport().focus();await page.keyboard.press('Home');assert.equal(await position(),0);
 await page.screenshot({path:output+'/uncharted-west.png'});
 await page.keyboard.press('End');assert.ok(await position()>250);
 const box=await viewport().boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.wheel(0,-100);await page.waitForTimeout(100);
 assert.ok(await position()<right-50,'Mouse wheel scrolls horizontally over the atlas');assert.equal(await saved(),before);
 // Real browser touch gestures exercise native scrolling, not synthetic clicks.
 await viewport().focus();await page.keyboard.press('End');
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true});
 const x=box.x+70,y=box.y+box.height/2;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
 for(let i=1;i<=8;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+i*20,y}]});await page.waitForTimeout(25);}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(350);
 assert.ok(await position()<right-60,'A finger swipe scrolls the same world map');assert.equal(await saved(),before);
 await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:false});
 // A disposable fully surveyed fixture verifies both landmasses coexist.
 const overseas=await page.evaluate(async()=>{const {createGame,saveGame}=await import('./engine.mjs');const s=createGame({seed:4242});s.nations.england.revealed=s.tiles.map(t=>t.id);localStorage.setItem('imp2-rebuild-v3',saveGame(s));return s.provinces.find(p=>!p.old&&!s.nations[p.owner]).owner;});
 await page.reload();await page.locator('#startupStatus').waitFor({state:'detached'});await open();
 const discovered=await saved();
 await page.locator('.overture-picker summary').click();await viewport().scrollIntoViewIfNeeded();
 assert.ok(await page.locator('.atlas-country').count()>12);assert.equal(await page.locator(`.atlas-country[data-args='{"id":"${overseas}"}']`).count(),1);assert.equal(await page.getByRole('button',{name:'Select France',exact:true}).count(),1);
 await viewport().focus();await page.keyboard.press('Home');await page.screenshot({path:output+'/discovered-west-phone.png'});
 await page.locator('.atlas-key [data-args=\'{"id":"france"}\']').click();await page.waitForTimeout(100);assert.ok(await position()>200,'Nation directory centres the selected country');
 assert.equal(await saved(),discovered,'Browsing either continent leaves campaign data unchanged');
 await page.locator('#closePanel').click();await page.setViewportSize({width:1448,height:1080});await open();
 await page.screenshot({path:output+'/continuous-world-desktop.png'});
 assert.ok(await page.locator('#panel').evaluate(e=>e.scrollWidth<=e.clientWidth+2));assert.deepEqual(errors,[]);
 console.log('PASS: single world map; hidden land stays hidden; mouse drag, wheel, native touch swipe and keyboard scrolling; no drag orders; position retained; both continents accessible; nation-directory centring; save bytes unchanged');
}finally{await browser.close();}
