import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)('C:/Users/paddy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const out='outputs/visual-review/sprites252';await mkdir(out,{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1448,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async r=>{const file=resolve('game',new URL(r.request().url()).pathname.slice(6));try{await r.fulfill({body:await readFile(file),contentType:file.endsWith('.png')?'image/png':file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});}catch{await r.fulfill({status:404,body:''});}});
 await page.goto('https://appassets.androidplatform.net/game/index.html?native=1');await page.locator('#startupStatus').waitFor({state:'detached'});
 await page.evaluate(async()=>{const {createMap}=await import('./map.mjs'),{createGame}=await import('./engine.mjs');const s=createGame(),old=document.querySelector('#map'),canvas=old.cloneNode();old.replaceWith(canvas);window.fixture=s;window.before=JSON.stringify(s);window.testMap=createMap(canvas,()=>s,()=>{});testMap.focus(s.nations[s.player].capital);});
 await page.waitForTimeout(2500);await page.screenshot({path:out+'/local.png'});
 await page.evaluate(()=>testMap.fitNation());await page.screenshot({path:out+'/nation.png'});
 await page.setViewportSize({width:412,height:915});await page.evaluate(()=>testMap.focus(fixture.nations[fixture.player].capital));await page.waitForTimeout(300);await page.screenshot({path:out+'/phone.png'});
 assert.equal(await page.evaluate(()=>JSON.stringify(fixture)===before),true);
 await page.setViewportSize({width:1200,height:1000});
 const result=await page.evaluate(async()=>{
  const {createReviewedSprites}=await import('./reviewed-sprites.mjs');window.reviewed=createReviewedSprites(()=>{});await reviewed.ready;
  const c=document.createElement('canvas');c.width=1200;c.height=1000;document.body.replaceChildren(c);const x=c.getContext('2d');x.fillStyle='#7f9b27';x.fillRect(0,0,1200,1000);
  const ids=['001-default','003-r1','004','005','006-r1','007','008','009','011','012','013','014','015-r4-4','016','017','018','010-level-0','010-level-1','010-level-2','010-level-3','010-level-4','019','019-level1','019-level2','019-level3','019-level4','cotton-1','cotton-2','cotton-3','cotton-4','spices-1','spices-2','spices-3','spices-4','002'];
  ids.forEach((id,i)=>{const cx=90+(i%7)*170,cy=90+Math.floor(i/7)*190;reviewed.draw(x,id,cx,cy,130);x.fillStyle='#fff';x.font='15px sans-serif';x.textAlign='center';x.fillText(id,cx,cy+87);});
  return {errors:reviewed.errors,count:reviewed.tiles.size,expected:Object.keys((await import('./reviewed-sprite-data.mjs')).SPRITES).length};
 });
 await page.screenshot({path:out+'/gallery.png'});assert.deepEqual(result.errors,[]);assert.equal(result.count,result.expected);assert.deepEqual(errors,[]);
 console.log('PASS: all mapped sprites decoded; home/nation/phone rendered; state unchanged; no browser errors.');
}finally{await browser.close();}
