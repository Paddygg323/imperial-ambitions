import {createRequire} from 'node:module';

import assert from 'node:assert/strict';

import {readFile} from 'node:fs/promises';

import {resolve} from 'node:path';

const require=createRequire(import.meta.url),{chromium}=require('C:/Users/paddy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

let browser;

try{

 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});

 const page=await browser.newPage({viewport:{width:412,height:915},isMobile:true,hasTouch:true}),errors=[];

 page.on('pageerror',e=>errors.push(e.message));

 await page.route('**/*',async route=>{

  const url=new URL(route.request().url());if(url.host!=='appassets.androidplatform.net'||!url.pathname.startsWith('/game/'))return route.abort();

  const relative=decodeURIComponent(url.pathname.slice(6));if(relative.includes('..'))return route.abort();

  try{const body=await readFile(resolve('work/rebuild-android/assets/game',relative));await route.fulfill({body,contentType:relative.endsWith('.mjs')||relative.endsWith('.js')?'text/javascript':relative.endsWith('.css')?'text/css':relative.endsWith('.svg')?'image/svg+xml':'text/html'});}catch{await route.fulfill({status:404,body:''});}

 });

 await page.addInitScript(()=>{window.AndroidGame={exportSave:(json,name)=>{window.savedExport={json,name};}};});

 await page.goto('https://appassets.androidplatform.net/game/index.html?native=1');
 await page.evaluate(async()=>{
  const {createGame,saveGame,beginTurn}=await import('./engine.mjs');
  const {campaignShippingPlan}=await import('./campaign-shipping-plan.mjs');
  const {recordWarDeclaration}=await import('./war-history.mjs');
  const s=createGame({transportModel:'ports',preferenceSeed:1500});
  for(const id of Object.keys(s.nations))s.nations[id]=campaignShippingPlan(s,id).nation;
  s.wars=[['england','france']];recordWarDeclaration(s,'england','france');
  s.turn=6;s.year=1512;s.nations.france.warSupport=Math.fround(.0001);
  const pending=saveGame(beginTurn(s));localStorage.setItem('imp2-rebuild-v3',pending);localStorage.setItem('incoming-peace-fixture',pending);
 });
 await page.reload();
 await page.getByRole('button',{name:'Reject peace',exact:true}).tap();
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')).wars.length),1);
 await page.reload();await page.getByRole('button',{name:'Continue turn',exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')).incomingPeace.length),0);
 await page.evaluate(()=>localStorage.setItem('imp2-rebuild-v3',localStorage.getItem('incoming-peace-fixture')));
 await page.reload();await page.getByRole('button',{name:'Accept peace',exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.screenshot({path:'work/rebuild-v2/phone-incoming-peace.png'});
 await page.getByRole('button',{name:'Accept peace',exact:true}).tap();
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')).wars.length),0);
 await page.reload();await page.getByRole('button',{name:'Continue turn',exact:true}).tap();
 const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')));
 assert.equal(after.pendingDiplomacy,undefined);assert.equal(after.incomingPeace.length,0);
 assert.ok(after.market||after.turn===7||after.turnPhase==='combat');
 assert.deepEqual(errors,[]);
 console.log('Packaged 412x915 touch: real AI incoming offer, rejection, acceptance, reload and continue-turn passed. Not physical Android.');
}finally{await browser?.close();}
