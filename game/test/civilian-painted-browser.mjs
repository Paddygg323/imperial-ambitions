import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const out='work/polish265/civilians';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{})});
try{
 const page=await browser.newPage({viewport:{width:1448,height:1080}}),errors=[],missing=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{const file=resolve('game',new URL(route.request().url()).pathname.slice(6));try{await route.fulfill({body:await readFile(file),contentType:file.endsWith('.png')?'image/png':file.endsWith('.mjs')||file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});}catch{missing.push(file);await route.fulfill({status:404,body:''});}});
 await page.goto('https://appassets.androidplatform.net/game/index.html?native=1');await page.locator('#startupStatus').waitFor({state:'detached'});
 // Productive engineering order uses the real command validation. No user save is loaded.
 const unit=await page.evaluate(async()=>{
  const {createGame,command,saveGame}=await import('./engine.mjs');const {neighbourIds}=await import('./world.mjs');const {transportLink}=await import('./transport-links.mjs');let s=createGame({transportModel:'ports'});
  const u=s.civilians.find(c=>c.owner===s.player&&c.type==='engineer'),from=s.tiles.find(t=>t.id===u.tile),target=s.tiles.find(t=>t.owner===s.player&&neighbourIds(from).includes(t.id)&&!transportLink(s,from,t));
  s=command(s,s.player,{type:'civilian',unit:u.id,job:'road',tile:target.id});localStorage.setItem('imp2-rebuild-v3',saveGame(s));return u.id;
 });
 await page.reload();await page.locator('#startupStatus').waitFor({state:'detached'});await page.locator('[data-panel=civilians]').click();await page.locator(`button[data-action=selectCivilian][data-args='{"id":"${unit}"}']`).click();await page.waitForTimeout(800);
 const saved=await page.evaluate(()=>localStorage.getItem('imp2-rebuild-v3'));
 const pixels=()=>page.locator('#map').evaluate(c=>c.toDataURL());const first=await pixels();await page.waitForTimeout(530);assert.notEqual(await pixels(),first);assert.equal(await page.locator('.civilian-work-portrait').count(),1);
 await page.screenshot({path:out+'/engineer-map.png'});
 assert.equal(await page.evaluate(()=>localStorage.getItem('imp2-rebuild-v3')),saved);
 await page.locator('[data-panel=research]').click();await page.waitForTimeout(250);const covered=await pixels();await page.waitForTimeout(500);assert.equal(await pixels(),covered,'Covered map stops animating');await page.locator('#closePanel').click();await page.waitForTimeout(250);const resumed=await pixels();await page.waitForTimeout(530);assert.notEqual(await pixels(),resumed,'Work resumes after the menu closes');
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(250);const reduced=await pixels();await page.waitForTimeout(520);assert.equal(await pixels(),reduced,'Reduced motion holds one complete work pose');
 await page.emulateMedia({reducedMotion:'no-preference'});await page.getByRole('button',{name:'Cancel order',exact:true}).click();await page.waitForTimeout(250);const idle=await pixels();await page.waitForTimeout(520);assert.equal(await pixels(),idle,'Cancellation stops the work cycle');assert.equal(await page.locator('.civilian-work-portrait').count(),0);
 // Inspect all five production renderers, at cabinet and map sizes, on actual game surfaces.
 await page.evaluate(async()=>{
  const art=await import('./civilian-art.mjs');await Promise.all(Object.keys(art.CIVILIAN_WORK).map(role=>new Promise((done,fail)=>{const im=new Image();im.onload=done;im.onerror=fail;im.src=`./assets/civilians/${role}-work.png`;})));art.loadCivilianArt();
  const grass=new Image();grass.src='./assets/royal-meadow.png';await grass.decode();const paper=new Image();paper.src='./assets/royal-vellum.png';await paper.decode();
  const gallery=document.createElement('canvas');gallery.width=1100;gallery.height=440;gallery.id='work-gallery';gallery.style='position:fixed;inset:0;z-index:2000;width:1100px;height:440px';document.body.append(gallery);window.gallery=gallery;const ctx=gallery.getContext('2d');
  window.drawPoses=time=>{ctx.fillStyle='#173a4b';ctx.fillRect(0,0,1100,440);ctx.fillStyle=ctx.createPattern(paper,'repeat');ctx.fillRect(0,40,1100,230);ctx.fillStyle=ctx.createPattern(grass,'repeat');ctx.fillRect(0,270,1100,170);ctx.fillStyle='#e9d7ad';ctx.font='20px Georgia';ctx.fillText('Civilian work cycles — cabinet scale and map scale',24,28);
   for(const [i,role]of Object.keys(art.CIVILIAN_WORK).entries()){const x=110+i*220;art.drawWorkingCivilian(ctx,role,x,240,166,time);art.drawWorkingCivilian(ctx,role,x,377,58,time);ctx.textAlign='center';ctx.fillStyle='#38301f';ctx.font='17px Georgia';ctx.fillText(role[0].toUpperCase()+role.slice(1),x,260);ctx.fillStyle='#fbefd1';ctx.font='13px Georgia';ctx.fillText('Map scale',x,417);}ctx.textAlign='left';};
  window.artReady=Promise.all(Object.keys(art.CIVILIAN_WORK).map(role=>new Promise(done=>{const check=()=>{const c=document.createElement('canvas').getContext('2d');if(art.drawWorkingCivilian(c,role,0,0,58,0))done();else setTimeout(check,30);};check();})));await artReady;drawPoses(0);
 });
 const rolePixels=await page.evaluate(async()=>{const a=await import('./civilian-art.mjs');return Object.keys(a.CIVILIAN_WORK).map(role=>{const c=document.createElement('canvas');c.width=100;c.height=100;const x=c.getContext('2d');const results=new Set();for(let i=0;i<16;i++){x.clearRect(0,0,100,100);a.drawWorkingCivilian(x,role,50,90,58,i*a.CIVILIAN_WORK[role].beat);results.add(c.toDataURL());}return {role,distinct:results.size};});});console.log(JSON.stringify(rolePixels));assert.ok(rolePixels.every(r=>r.distinct===6));
 for(const time of [0,400,900,1500]){await page.evaluate(t=>drawPoses(t),time);await page.locator('#work-gallery').screenshot({path:out+`/poses-${time}.png`});}
 const video=await page.evaluate(async()=>{const chunks=[],rec=new MediaRecorder(gallery.captureStream(10),{mimeType:'video/webm'});rec.ondataavailable=e=>chunks.push(e.data);const ended=new Promise(r=>rec.onstop=r);rec.start();const start=performance.now();await new Promise(done=>{function tick(t){drawPoses(t-start);if(t-start<5200)requestAnimationFrame(tick);else done();}requestAnimationFrame(tick);});rec.stop();await ended;const bytes=new Uint8Array(await new Blob(chunks,{type:'video/webm'}).arrayBuffer());return btoa(Array.from(bytes,b=>String.fromCharCode(b)).join(''));});await writeFile(out+'/work-cycles.webm',Buffer.from(video,'base64'));
 await page.evaluate(async()=>{const a=await import('./civilian-art.mjs');gallery.width=1100;gallery.height=1020;gallery.style.height='1020px';const c=gallery.getContext('2d');c.fillStyle='#efe1bb';c.fillRect(0,0,1100,1020);c.font='18px Georgia';c.fillStyle='#342d20';c.fillText('Work cycles · six key poses for every role',24,32);for(const [row,role] of Object.keys(a.CIVILIAN_WORK).entries()){c.font='16px Georgia';c.fillStyle='#342d20';c.fillText(role,24,76+row*188);for(let f=0;f<6;f++){const t=a.CIVILIAN_WORK[role].sequence.indexOf(f)*a.CIVILIAN_WORK[role].beat;a.drawWorkingCivilian(c,role,190+f*160,218+row*188,152,t);c.font='12px Georgia';c.fillText('Pose '+(f+1),170+f*160,238+row*188);}}});await page.locator('#work-gallery').screenshot({path:out+'/six-poses-each.png'});
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);console.log(JSON.stringify({rolePixels,realRoadOrder:true,cancelStopsMotion:true,reducedMotion:true,saveUnchangedDuringAnimation:true,errors,missing}));
}finally{await browser.close();}
