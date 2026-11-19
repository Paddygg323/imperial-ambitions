import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)('C:/Users/paddy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const out='outputs/visual-review/art249';await mkdir(out,{recursive:true});
try{const page=await browser.newPage({viewport:{width:1448,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',async r=>{const file=resolve('game',new URL(r.request().url()).pathname.slice(6));try{await r.fulfill({body:await readFile(file),contentType:file.endsWith('.png')?'image/png':file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});}catch{await r.fulfill({status:404,body:''});}});
await page.goto('https://appassets.androidplatform.net/game/index.html?native=1');await page.locator('#startupStatus').waitFor({state:'detached'});
await page.evaluate(async()=>{const {createMap}=await import('./map.mjs');const {createGame}=await import('./engine.mjs');const s=createGame(),capital=s.tiles.find(t=>t.id===s.nations[s.player].capital);const old=document.querySelector('#map'),canvas=old.cloneNode();old.replaceWith(canvas);window.fixture=s;window.before=JSON.stringify(s);window.testMap=createMap(canvas,()=>s,()=>{});window.testMap.focus(capital.id);});
await page.waitForTimeout(600);await page.screenshot({path:out+'/local.png'});
await page.evaluate(()=>window.testMap.fitNation());await page.screenshot({path:out+'/nation.png'});
await page.setViewportSize({width:412,height:915});await page.evaluate(()=>window.testMap.focus(window.fixture.nations[window.fixture.player].capital));await page.waitForTimeout(300);await page.screenshot({path:out+'/phone.png'});
assert.ok(await page.evaluate(()=>JSON.stringify(window.fixture)===window.before));assert.deepEqual(errors,[]);console.log('PASS all-terrain renderer local/nation/phone; fixture state unchanged; no JS errors. Synthetic terrain fixture, not user campaign.');
await page.setViewportSize({width:1000,height:650});
await page.evaluate(async()=>{const {drawFortifiedTown,drawRural}=await import('./map-art249.mjs');const load=src=>new Promise(resolve=>{const im=new Image();im.onload=()=>resolve(im);im.src=src;});const [town,rural]=await Promise.all([load('assets/towns-forts.png'),load('assets/rural-landscape.png')]);const c=document.createElement('canvas');c.width=1000;c.height=650;document.body.replaceChildren(c);const x=c.getContext('2d');x.fillStyle='#91a45b';x.fillRect(0,0,1000,650);x.fillStyle='#172f25';x.font='20px Georgia';x.fillText('Town size and fortification — normal map scale',28,32);for(let row=0;row<2;row++)for(let fort=0;fort<4;fort++){const t={id:'a',province:'p',townLevel:row},s={nations:{},provinces:[{id:'p',fort}]};drawFortifiedTown(x,town,s,t,135+fort*235,120+row*150,78);x.fillText((row?'Large':'Small')+' · '+(fort?'Fort '+fort:'Unfortified'),45+fort*235,170+row*150);}const labels=['Cattle herd','Undeveloped grain','Cultivated grain','Mountain ridge'];for(let i=0;i<4;i++){drawRural(x,rural,i,135+i*235,480,78);x.fillText(labels[i],45+i*235,550);}});
await page.screenshot({path:out+'/gallery.png'});
}finally{await browser.close();}



