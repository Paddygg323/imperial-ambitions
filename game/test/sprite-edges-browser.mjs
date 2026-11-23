import {createRequire} from 'node:module';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const out='outputs/visual-review/tile-edges/'+(process.argv[2]||'before');await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{})});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1280}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{const path=new URL(route.request().url()).pathname;try{const f=resolve('game',path.slice(1));await route.fulfill({body:await readFile(f),contentType:f.endsWith('.mjs')?'text/javascript':f.endsWith('.png')?'image/png':'text/html'});}catch{await route.fulfill({body:'<html><body></body></html>'});}});
 await page.goto('https://sprite-test.invalid/');
 const stats=await page.evaluate(async()=>{
  const {createReviewedSprites}=await import('./reviewed-sprites.mjs'),{SPRITES}=await import('./reviewed-sprite-data.mjs');
  const art=createReviewedSprites(()=>{});await art.ready;window.auditArt=art;window.auditSpecs=SPRITES;
  let checks=0,maxLostAlpha=0;const failures=[];
  for(const [key,spec] of Object.entries(SPRITES)){
   if(spec.kind==='texture'||key==='002')continue;
   for(const scale of [26,35,78,110]){
    const c=document.createElement('canvas');c.width=c.height=300;const ctx=c.getContext('2d'),x=150,y=150;
    const render=()=>spec.kind==='overlay'?(key==='sheep-overlay'?art.drawSheep(ctx,'wool',x,y,scale):art.drawDeposit(ctx,{level:0},key.slice(4),x,y,scale)):art.draw(ctx,key,x,y,scale);
    render();const full=ctx.getImageData(0,0,300,300).data;ctx.clearRect(0,0,300,300);
    ctx.save();ctx.beginPath();for(let i=0;i<6;i++){const a=(i*60-30)*Math.PI/180;ctx.lineTo(x+Math.cos(a)*scale*.57735,y+Math.sin(a)*scale*.57735);}ctx.closePath();ctx.clip();render();ctx.restore();
    const clipped=ctx.getImageData(0,0,300,300).data;let originalAlpha=0,lostAlpha=0,opaquePixelsLost=0;
    for(let i=3;i<full.length;i+=4){originalAlpha+=full[i];lostAlpha+=Math.max(0,full[i]-clipped[i]);if(full[i]>=250&&clipped[i]<245)opaquePixelsLost++;}
    // At the smallest scale, fractional edge pixels can meet the canvas clip's
    // antialiasing. Permit at most 0.2% alpha loss, and no opaque artwork loss.
    const loss=lostAlpha/Math.max(1,originalAlpha);if(loss>.002||opaquePixelsLost)failures.push({key,scale,loss,opaquePixelsLost});
    maxLostAlpha=Math.max(maxLostAlpha,loss);checks++;
   }
  }
  return {count:art.tiles.size,errors:art.errors,checks,maxLostAlpha,failures};
 });
 assert.equal(stats.count,51);assert.deepEqual(stats.errors,[]);assert.deepEqual(stats.failures,[]);
 for(let group=0;group<5;group++){
  await page.evaluate(group=>{
   const keys=Object.keys(auditSpecs).filter(k=>k!=='grass-surface');
   const c=document.createElement('canvas');c.width=1440;c.height=1280;document.body.style.margin='0';document.body.replaceChildren(c);const ctx=c.getContext('2d');ctx.fillStyle='#e7dec8';ctx.fillRect(0,0,c.width,c.height);
   const pattern=auditArt.grassPattern(ctx);pattern.setTransform(new DOMMatrix().scale(.6));
   for(let n=0;n<12;n++){
    const key=keys[group*12+n];if(!key)continue;const x=180+n%4*360,y=150+Math.floor(n/4)*380,scale=220;
    const render=(px,py,size)=>auditSpecs[key].kind==='overlay'?(key==='sheep-overlay'?auditArt.drawSheep(ctx,'wool',px,py,size):auditArt.drawDeposit(ctx,{level:0},key.slice(4),px,py,size)):auditArt.draw(ctx,key,px,py,size);
    ctx.save();ctx.beginPath();for(let i=0;i<6;i++){const a=(i*60-30)*Math.PI/180;ctx.lineTo(x+Math.cos(a)*scale*.57735,y+Math.sin(a)*scale*.57735);}ctx.closePath();ctx.clip();ctx.fillStyle=pattern;ctx.fill();render(x,y,scale);ctx.restore();
    ctx.fillStyle='#213927';ctx.font='20px Georgia';ctx.textAlign='center';ctx.fillText(key,x,y+155);
    render(x,y+225,78);
   }
  },group);await page.screenshot({path:out+'/sheet-'+group+'.png'});
 }
 await page.evaluate(async()=>{
  const c=document.createElement('canvas');c.width=1440;c.height=1150;document.body.replaceChildren(c);const ctx=c.getContext('2d');ctx.fillStyle='#e7dec8';ctx.fillRect(0,0,c.width,c.height);
  for(const [i,key] of ['008','009','013','014','016','017'].entries()){
   const s=auditSpecs[key],im=new Image();im.src=s.file;await im.decode();const [sx,sy,sw,sh]=s.rect;
   ctx.drawImage(im,sx,sy,sw,sh,(i%3)*480,Math.floor(i/3)*550,480,480*sh/sw);
   ctx.font='24px Georgia';ctx.fillStyle='#213927';ctx.fillText(key,(i%3)*480+200,Math.floor(i/3)*550+490);
  }
 });await page.screenshot({path:out+'/source-crops.png'});
 assert.deepEqual(errors,[]);await writeFile(out+'/load-check.json',JSON.stringify(stats,null,2));console.log(JSON.stringify(stats));
}finally{await browser.close();}
