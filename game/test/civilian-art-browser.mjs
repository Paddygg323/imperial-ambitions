import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/paddy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{const page=await browser.newPage({viewport:{width:412,height:915},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',async route=>{const u=new URL(route.request().url());try{const file=resolve('game',u.pathname.slice(6));const body=await readFile(file);await route.fulfill({body,contentType:file.endsWith('.png')?'image/png':file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});}catch{await route.fulfill({status:404,body:''});}});
await page.goto('https://appassets.androidplatform.net/game/index.html?native=1');await page.waitForFunction(()=>document.querySelector('#heading').textContent.includes('1500'));await page.waitForTimeout(600);await mkdir('outputs/visual-review',{recursive:true});

await page.evaluate(async()=>{const {drawCivilianWork}=await import('./map-markers.mjs');const art=new Image();art.src='./assets/atlas.png';await art.decode();const canvas=document.createElement('canvas');canvas.width=390;canvas.height=200;canvas.style='position:fixed;inset:0;background:#b0b080;z-index:9999;width:390px;height:200px';document.body.append(canvas);window.workArt=canvas;window.paintWork=phase=>{const c=canvas.getContext('2d');c.fillStyle='#a9ad80';c.fillRect(0,0,390,200);for(const [i,type] of ['builder','engineer','explorer'].entries()){const x=65+i*130,y=125;c.drawImage(art,i*256,115,256,355,x-20,y-58,40,58);drawCivilianWork(c,type,x,y-8,phase,54);c.fillStyle='#293d32';c.font='15px Georgia';c.textAlign='center';c.fillText(type,x,165);}};paintWork(0);});
const first=await page.evaluate(()=>workArt.toDataURL());await page.evaluate(()=>paintWork(1));assert.notEqual(await page.evaluate(()=>workArt.toDataURL()),first);
await page.locator('canvas').last().screenshot({path:'outputs/visual-review/civilian-distinct-work.png'});assert.deepEqual(errors,[]);console.log('PASS: distinct hammer, drafting paper and telescope artwork renders and changes pose without simulation state.');
}finally{await browser.close();}
