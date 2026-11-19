import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)('C:/Users/paddy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const out='outputs/visual-review/sprites254';await mkdir(out,{recursive:true});
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
  const {createReviewedSprites}=await import('./reviewed-sprites.mjs'),{SPRITES}=await import('./reviewed-sprite-data.mjs');const reviewed=createReviewedSprites(()=>{});await reviewed.ready;
  const c=document.createElement('canvas');c.width=1200;c.height=1000;document.body.replaceChildren(c);const x=c.getContext('2d');
  x.fillStyle='#f5eed9';x.fillRect(0,0,1200,1000);
  const scale=210,pattern=reviewed.grassPattern(x);pattern.setTransform(new DOMMatrix().scale(scale*1.1/256));
  function hex(cx,cy){x.beginPath();for(let n=0;n<6;n++){const a=(60*n-30)*Math.PI/180;x.lineTo(cx+Math.cos(a)*scale*.57735,cy+Math.sin(a)*scale*.57735);}x.closePath();}
  const ids=['003-r1','003-r1','004','005','006-r1','007','008','009','010-level-0','011','014','015-r4-4'];
  const labels=['Hills','Same hills + sheep','Mountains','Swamp','Desert','Tundra','Forest','Scrub','Grain','Cattle','Cotton','Spices'];
  const land=new Path2D();for(let i=0;i<ids.length;i++){const row=Math.floor(i/4),cx=180+i%4*scale+row%2*scale/2,cy=200+row*scale*.866;for(let n=0;n<6;n++){const a=(60*n-30)*Math.PI/180;const px=cx+Math.cos(a)*scale*.579,py=cy+Math.sin(a)*scale*.579;n?land.lineTo(px,py):land.moveTo(px,py);}land.closePath();}
  x.fillStyle=pattern;x.fill(land);
  for(const [i,id] of ids.entries()){
   const row=Math.floor(i/4),col=i%4,cx=180+col*scale+(row%2)*scale/2,cy=200+row*scale*.866;
   x.save();hex(cx,cy);x.clip();x.fillStyle=pattern;x.fill();if(id!=='001-default')reviewed.draw(x,id,cx,cy,scale);if(i===1)reviewed.drawSheep(x,'wool',cx,cy,scale);x.restore();
   x.textAlign='center';x.font='bold 16px Georgia';x.lineWidth=4;x.strokeStyle='#f5eed9';x.fillStyle='#253a27';x.strokeText(labels[i],cx,cy+70);x.fillText(labels[i],cx,cy+70);
  }
  x.fillStyle='#253a27';x.font='bold 26px Georgia';x.textAlign='center';x.fillText('One continuous grass texture across land edges',600,45);
  x.font='20px Georgia';x.fillText('Normal hills and sheep hills use the identical ground image',600,770);
  for(let i=0;i<2;i++){const cx=420+i*330,cy=890;x.save();hex(cx,cy);x.clip();x.fillStyle=pattern;x.fill();reviewed.draw(x,'003-r1',cx,cy,scale);if(i)reviewed.drawSheep(x,'wool',cx,cy,scale);x.restore();}
  return {errors:reviewed.errors,count:reviewed.tiles.size,expected:Object.keys(SPRITES).length};
 });
 await page.screenshot({path:out+'/terrain-sheep.png'});
 assert.deepEqual(result.errors,[]);assert.equal(result.count,result.expected);assert.deepEqual(errors,[]);
 console.log('PASS: '+result.count+' sprites decoded; shared-edge terrain and identical sheep hills rendered; desktop/nation/phone views; state unchanged; no browser errors.');
}finally{await browser.close();}
