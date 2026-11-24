import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/paddy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
 const page=await browser.newPage({viewport:{width:412,height:915},isMobile:true,hasTouch:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{const u=new URL(route.request().url()),file=resolve('game',u.pathname.slice(6));try{await route.fulfill({body:await readFile(file),contentType:file.endsWith('.png')?'image/png':file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});}catch{await route.fulfill({status:404,body:''});}});
 await page.goto('https://appassets.androidplatform.net/game/index.html?native=1');
 await page.evaluate(async()=>{
  const {createGame,command,resolveTurn,saveGame}=await import('./engine.mjs'),{provinceAdjacency}=await import('./world.mjs'),{startLandBattle}=await import('./campaign-battle.mjs');
  let s=createGame({transportModel:'ports'});const adj=provinceAdjacency(s),source=s.provinces.find(p=>p.owner==='england'&&[...adj[p.id]].some(id=>s.provinces.find(q=>q.id===id).owner!=='england')),target=s.provinces.find(p=>p.owner!=='england'&&adj[source.id].has(p.id));target.fort=0;s.wars=[['england',target.owner]];
  s.armies=[{id:'review-attacker',owner:'england',province:source.id,type:'pikeman',hp:100,experience:0,order:null},{id:'review-defender',owner:target.owner,province:target.id,type:'pikeman',hp:100,experience:0,order:null}];
  s=command(s,'england',{type:'army',units:['review-attacker'],job:'attack',province:target.id});s.market={complete:true,deals:[],inTransit:[],diplomacy:[]};s=startLandBattle(resolveTurn(s));localStorage.setItem('imp2-rebuild-v3',saveGame(s));
 });
 await page.reload();await page.locator('[data-unit=review-attacker]').tap();await page.locator('.battle-tile.reachable').first().tap();
 const deployed=await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')).activeLandBattle.battle.units.find(u=>u.id==='review-attacker').tile);assert.notEqual(deployed,null);
 await mkdir('work/polish265/campaign-battle',{recursive:true});
 for(const viewport of [{width:412,height:915},{width:915,height:412},{width:1448,height:1080}]){
  await page.setViewportSize(viewport);await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.ok((await page.locator('.battle-viewport').boundingBox()).height>=150);const layout=await page.evaluate(()=>{const b=s=>document.querySelector(s).getBoundingClientRect(),v=b('.battle-viewport'),d=b('.battle-detail'),t=b('.battle-detail strong'),r=b('.battle-roster');return {viewportRight:v.right,detailLeft:d.left,viewportBottom:v.bottom,detailTop:d.top,detailBottom:d.bottom,textTop:t.top,textBottom:t.bottom,rosterTop:r.top}});assert.ok((layout.viewportBottom<=layout.detailTop+1||layout.viewportRight<=layout.detailLeft+1)&&layout.textTop>=layout.detailTop&&layout.textBottom<=layout.detailBottom&&layout.detailBottom<=layout.rosterTop+1,'unit detail cannot overlap the board or roster');await page.screenshot({path:'work/polish265/campaign-battle/battle-'+viewport.width+'.png'});
 }
 await page.setViewportSize({width:412,height:915});await page.reload();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')).activeLandBattle.battle.units.find(u=>u.id==='review-attacker').tile),deployed);
 await page.locator('[data-do=ready]').tap();await page.locator('[data-do="retreat"]:enabled').waitFor();await page.locator('[data-do=retreat]').tap();await page.locator('#continueCampaign:not([hidden])').waitFor({timeout:45000});
 await page.reload();await page.locator('#continueCampaign').tap();await page.locator('#campaignBattle').waitFor({state:'hidden'});assert.equal(await page.locator('#app').evaluate(e=>e.inert),false);assert.deepEqual(errors,[]);
 console.log('PASS: actual campaign battle deployment, saved tile/reload, three viewports, retreat/result/reload and return to campaign; no browser errors.');
}finally{await browser.close();}

