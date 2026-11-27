import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH);
const {createStaticServer}=require('./static-server.cjs');
const server=createStaticServer({root:process.cwd()+'/game',project:'ship-art-test'});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,channel:'chrome'});
const out='outputs/visual-review/ships266';await mkdir(out,{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1100,height:850},deviceScaleFactor:2});
 const errors=[],failed=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push(r.url());});
 await page.goto('http://127.0.0.1:'+server.address().port+'/');
 await page.locator('#startupStatus').waitFor({state:'detached'});
 await page.screenshot({path:out+'/game-desktop.png'});
 await page.evaluate(async()=>{
  const {createGame}=await import('./engine.mjs'),{createMap}=await import('./map.mjs');
  const {SHIP_ATLAS,drawShipSprite}=await import('./ship-art.mjs');
  window.shipProof={state:createGame(),selected:['proof'],atlas:SHIP_ATLAS,drawShipSprite,draws:[]};
  const proof=window.shipProof;proof.image=new Image();proof.image.src=SHIP_ATLAS.url;await proof.image.decode();
  const old=CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage=function(image,...args){if(image?.src?.endsWith('/assets/naval/ships.png'))proof.draws.push(args);return old.call(this,image,...args);};
  document.body.innerHTML='<canvas id="proof" style="width:100vw;height:100vh;display:block"></canvas>';
  document.body.style.cssText='margin:0;overflow:hidden';
  proof.state.ships=[{id:'proof',type:'carrack',owner:proof.state.player,location:'home',order:null}];
  proof.map=createMap(document.querySelector('#proof'),()=>proof.state,()=>{}, {selectedShips:()=>proof.selected});
  await proof.map.ready;proof.map.focus('84,22');
 });
 const types=await page.evaluate(()=>Object.keys(shipProof.atlas.frames));
 for(const type of types){
  const result=await page.evaluate(type=>{const p=shipProof;p.state.ships[0].type=type;const before=JSON.stringify(p.state);p.draws=[];p.map.draw();return {draw:p.draws.at(-1)?.slice(0,4),rect:p.atlas.frames[type].rect,unchanged:before===JSON.stringify(p.state)};},type);
  assert.deepEqual(result.draw,result.rect);assert(result.unchanged);
  if(['carrack','fluyte','galleon','shipOfTheLine'].includes(type))await page.screenshot({path:out+'/map-'+type+'.png'});
 }
 await page.evaluate(()=>{shipProof.state.ships[0].type='fluyte';shipProof.map.draw();});
 await page.setViewportSize({width:412,height:915});await page.waitForTimeout(120);await page.screenshot({path:out+'/map-phone.png'});
 await page.evaluate(()=>shipProof.map.fit());await page.screenshot({path:out+'/map-strategic.png'});
 await page.setViewportSize({width:1100,height:850});
 await page.evaluate(()=>{
  document.body.innerHTML='<canvas id="contact" width="2200" height="1600" style="width:1100px;height:800px"></canvas>';
  const c=document.querySelector('#contact').getContext('2d');c.scale(2,2);c.fillStyle='#345572';c.fillRect(0,0,1100,800);
  const p=shipProof;Object.keys(p.atlas.frames).forEach((type,i)=>{const x=140+i%4*270,y=150+Math.floor(i/4)*250;
   p.drawShipSprite(c,p.image,type,x,y,160,'#ca3e35');
   p.drawShipSprite(c,p.image,type,x-45,y+80,62,'#ca3e35');p.drawShipSprite(c,p.image,type,x+45,y+80,44,'#ca3e35');
   c.fillStyle='#fff1cb';c.textAlign='center';c.font='16px Georgia';c.fillText(type,x,y+22);
  });
 });
 await page.screenshot({path:out+'/runtime-ships.png'});
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 await writeFile(out+'/checks.json',JSON.stringify({version:'0.2.66',classesRendered:types,mainMapAtlasVerified:true,stateUnchanged:true,viewports:['1100x850 @2x','412x915 @2x'],errors,failed},null,2)+'\n');
 console.log('PASS: twelve real main-map ship classes, unchanged state, desktop/phone/strategic views and full-game loading.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
