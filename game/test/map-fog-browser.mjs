import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/paddy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{const page=await browser.newPage({viewport:{width:412,height:915},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',async route=>{const u=new URL(route.request().url());try{const file=resolve('game',u.pathname.slice(6));const body=await readFile(file);await route.fulfill({body,contentType:file.endsWith('.png')?'image/png':file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});}catch{await route.fulfill({status:404,body:''});}});
await page.goto('https://appassets.androidplatform.net/game/index.html?native=1');await page.waitForFunction(()=>document.querySelector('#heading').textContent.includes('1500'));await page.waitForTimeout(600);await mkdir('outputs/visual-review',{recursive:true});

const result=await page.evaluate(async()=>{const {createGame}=await import('./engine.mjs'),{createMap}=await import('./map.mjs'),{seaName}=await import('./map-markers.mjs');const s=createGame();s.nations[s.player].seenSea=[];const old=document.querySelector('#map'),canvas=old.cloneNode();old.replaceWith(canvas);const ctx=canvas.getContext('2d'),labels=[],text=ctx.fillText.bind(ctx);ctx.fillText=(label,x,y,...rest)=>{labels.push({label,x,y});return text(label,x,y,...rest);};const map=createMap(canvas,()=>s,()=>{});map.focus(s.tiles.find(t=>t.x<10).id);map.zoom(6/map.viewport().scale);await new Promise(r=>setTimeout(r,300));labels.length=0;map.draw();const v=map.viewport(),edge=(60-v.cx)*v.scale+v.width/2,names=new Set(s.seas.zones.map(z=>seaName(s,z)));return {leaks:labels.filter(l=>names.has(l.label)&&l.x<edge-1),v};});
assert.deepEqual(result.leaks,[],'Unseen western fragments must not receive eastern sea labels');
assert.ok(result.v.cx>=0&&result.v.cx<=108&&result.v.cy>=0&&result.v.cy<=53);
await page.screenshot({path:'outputs/visual-review/uncharted-west.png'});assert.deepEqual(errors,[]);console.log('PASS: no eastern sea labels leak into unseen western map; bounded camera.');
}finally{await browser.close();}
