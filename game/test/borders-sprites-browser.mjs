import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const out='outputs/visual-review/borders-sprites/'+(process.argv[2]||'after');await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{})});
try{
 const page=await browser.newPage({viewport:{width:1448,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async r=>{const path=new URL(r.request().url()).pathname;const file=resolve('game',path.slice(6));try{await r.fulfill({body:await readFile(file),contentType:file.endsWith('.png')?'image/png':file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});}catch{await r.fulfill({status:404,body:''});}});
 await page.goto('https://appassets.androidplatform.net/game/index.html?native=1');await page.locator('#startupStatus').waitFor({state:'detached'});
 await page.evaluate(async()=>{const {createMap}=await import('./map.mjs'),{createGame}=await import('./engine.mjs');const s=createGame(),old=document.querySelector('#map'),canvas=old.cloneNode();old.replaceWith(canvas);window.fixture=s;window.before=JSON.stringify(s);window.testMap=createMap(canvas,()=>s,()=>{});testMap.focus(s.nations[s.player].capital);});
 await page.waitForTimeout(2000);await page.screenshot({path:out+'/local.png'});
 await page.evaluate(()=>testMap.fitNation());await page.screenshot({path:out+'/nation.png'});
 await page.evaluate(()=>{testMap.focus(fixture.tiles.find(t=>t.terrain===12&&t.owner===fixture.player).id);testMap.zoom(110/78);});await page.screenshot({path:out+'/forest-close.png'});
 await page.evaluate(()=>testMap.fit());await page.screenshot({path:out+'/world.png'});
 await page.setViewportSize({width:412,height:915});await page.evaluate(()=>testMap.focus(fixture.nations[fixture.player].capital));await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:out+'/phone-local.png'});
 await page.evaluate(()=>testMap.fitNation());await page.screenshot({path:out+'/phone-nation.png'});
 assert.equal(await page.evaluate(()=>JSON.stringify(fixture)===before),true);
 await page.setViewportSize({width:1448,height:1000});
 await page.evaluate(async()=>{
  const {createReviewedSprites}=await import('./reviewed-sprites.mjs'),{SPRITES}=await import('./reviewed-sprite-data.mjs');const r=createReviewedSprites(()=>{});await r.ready;
  if(r.errors.length||r.tiles.size!==Object.keys(SPRITES).length)throw Error('Sprite loading failed: '+JSON.stringify(r.errors));
  const c=document.createElement('canvas');c.width=1448;c.height=1000;document.body.replaceChildren(c);const ctx=c.getContext('2d');ctx.fillStyle='#f5eed9';ctx.fillRect(0,0,c.width,c.height);
  const scale=210,pattern=r.grassPattern(ctx);pattern.setTransform(new DOMMatrix().scale(scale*1.1/256));
  const keys=['008','013','010-level-0','010-level-1','010-level-2','010-level-3','010-level-4','009'];
  const labels=['Hardwood forest','Horses','Grain — undeveloped','Grain — level 1','Grain — level 2','Grain — level 3','Grain — level 4','Scrub forest'];
  function hex(x,y,s){ctx.beginPath();for(let n=0;n<6;n++){const a=(60*n-30)*Math.PI/180;ctx.lineTo(x+Math.cos(a)*s*.57735,y+Math.sin(a)*s*.57735);}ctx.closePath();}
  for(let i=0;i<keys.length;i++){
   const x=190+(i%4)*350,y=180+Math.floor(i/4)*450;ctx.save();hex(x,y,scale);ctx.clip();ctx.fillStyle=pattern;ctx.fill();r.draw(ctx,keys[i],x,y,scale);ctx.restore();
   ctx.fillStyle='#27392b';ctx.font='bold 20px Georgia';ctx.textAlign='center';ctx.fillText(labels[i],x,y+150);
   ctx.save();hex(x,y+230,78);ctx.clip();ctx.fillStyle=pattern;ctx.fill();r.draw(ctx,keys[i],x,y+230,78);ctx.restore();
  }
 });await page.screenshot({path:out+'/sprites.png'});assert.deepEqual(errors,[]);
 console.log('PASS: local/nation/world and phone views; all render state unchanged; no browser errors. '+out);
}finally{await browser.close();}
