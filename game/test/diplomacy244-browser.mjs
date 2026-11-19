import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/paddy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const output='outputs/visual-review/diplomacy244';await mkdir(output,{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1448,height:1080}}),errors=[],missing=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{const u=new URL(route.request().url()),file=resolve('game',u.pathname.slice(6));try{await route.fulfill({body:await readFile(file),contentType:file.endsWith('.png')?'image/png':file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});}catch{missing.push(file);await route.fulfill({status:404,body:''});}});
 await page.goto('https://appassets.androidplatform.net/game/index.html?native=1');await page.locator('#startupStatus').waitFor({state:'detached'});
 await page.evaluate(async()=>{const {createGame,saveGame}=await import('./engine.mjs');const s=createGame({transportModel:'ports'});s.nations.england.cash=30000;s.nations.england.known.push('12');s.nations.england.consulates=['italy'];s.nations.england.embassies=['italy'];localStorage.setItem('imp2-rebuild-v3',saveGame(s));});await page.reload();await page.locator('#startupStatus').waitFor({state:'detached'});
 const saved=()=>page.evaluate(()=>localStorage.getItem('imp2-rebuild-v3')),state=async()=>JSON.parse(await saved());
 const panel=()=>page.locator('#panel');
 const open=()=>page.locator('[data-panel=diplomacy]').click();
 const mode=label=>page.locator('.diplomacy-tools').getByRole('button',{name:label,exact:true}).click();
 const action=label=>page.locator('.overture-palette').getByRole('button',{name:label}).click();
 const country=id=>page.locator(`svg [data-action=diplomacyCountry][data-args='{"id":"${id}"}']`);
 const clickCountry=async id=>{const g=country(id);await g.scrollIntoViewIfNeeded();const point=await g.evaluate(g=>{const p=g.querySelector('path'),v=p.getAttribute('d').split('Z')[0].match(/-?\d+(?:\.\d+)?/g).map(Number),q=new DOMPoint(v.filter((_,i)=>i%2===0).reduce((a,x)=>a+x,0)/6,v.filter((_,i)=>i%2===1).reduce((a,x)=>a+x,0)/6).matrixTransform(p.getScreenCTM());return {x:q.x,y:q.y};});await page.mouse.click(point.x,point.y);};
 const shot=async name=>{await page.waitForTimeout(150);await page.screenshot({path:`${output}/${name}.png`});};
 await open();const initial=await saved();assert.equal(await page.locator('.political-map').count(),1);assert.equal(await page.locator('.relations-ledger').count(),0);
 await action('Alliance');assert.equal(await saved(),initial);await clickCountry('france');assert.ok((await state()).allianceOffers.some(o=>o.target==='france'));assert.match(await page.locator('.diplomatic-feedback').innerText(),/Response at turn end/);
 const pending=await saved();await clickCountry('portugal');assert.equal(await saved(),pending,'Sending an offer disarms subsequent country taps');
 await page.setViewportSize({width:360,height:800});await page.getByRole('button',{name:'Europe',exact:true}).click();
 const marker=page.getByRole('button',{name:'Review pending orders for france',exact:true});
 await page.waitForFunction(()=>{const r=document.querySelector('.diplomatic-marker-hit').getBoundingClientRect();return r.width>=43.9&&r.height>=43.9;});
 await marker.locator('.diplomatic-marker-hit').click({position:{x:3,y:3}});assert.equal(await saved(),pending);
 await page.setViewportSize({width:1448,height:1080});
 await page.getByRole('button',{name:'Rescind alliance offer',exact:true}).click();assert.equal((await state()).allianceOffers.length,0);
 await mode('Treaties');
 await action('Trade consulate');await clickCountry('switzerland');assert.equal((await state()).nations.england.cash,29500);assert.equal((await state()).diplomaticOffices[0].target,'switzerland');await page.getByRole('button',{name:'Rescind office · refund',exact:true}).click();assert.equal((await state()).nations.england.cash,30000);
 await action('Non-aggression pact');await clickCountry('italy');assert.equal((await state()).pactOffers[0].target,'italy');await page.getByRole('button',{name:'Rescind pact offer',exact:true}).click();
 await mode('Grants');await page.getByRole('button',{name:'$3,000',exact:true}).click();await page.getByRole('button',{name:'One-off grant',exact:true}).click();const grantBefore=await saved();await clickCountry('switzerland');assert.equal(await saved(),grantBefore);assert.match(await page.locator('.diplomatic-feedback').innerText(),/embassy/);
 await clickCountry('italy');assert.equal((await state()).nations.england.cash,27000);assert.equal((await state()).diplomaticGrants[0].repeat,true);const sentGrant=await saved();await clickCountry('france');assert.equal(await saved(),sentGrant,'Grant sends only once per selected overture');await shot('grants-desktop');await page.reload();await page.locator('#startupStatus').waitFor({state:'detached'});await open();await mode('Information');await clickCountry('italy');await page.getByRole('button',{name:'Rescind grant',exact:true}).click();assert.equal((await state()).nations.england.cash,30000);
 await mode('Trade subsidies');await page.getByRole('button',{name:'25% subsidy',exact:true}).click();await clickCountry('italy');assert.equal((await state()).nations.england.tradePolicies.italy,75);const sentPolicy=await saved();await clickCountry('france');assert.equal(await saved(),sentPolicy,'Subsidy selection disarms after the recipient is set');
 await mode('Favoured partners');await clickCountry('italy');assert.match(await page.locator('.favoured-partner').innerText(),/Favoured trade partner:/);await shot('partners-desktop');
 await mode('Treaties');await action('Embassy');await shot('treaties-desktop');
 await page.getByRole('button',{name:'Power rankings',exact:true}).click();assert.equal(await page.locator('.ranking-chart').count(),8);assert.equal(await page.locator('[aria-valuenow]').count(),0);await shot('rankings-desktop');await page.locator('#closePanel').click();
 for(const width of [412,360,915]){
  await page.setViewportSize({width,height:width===915?412:915});await open();await page.getByRole('button',{name:'Europe',exact:true}).click();await action('Trade consulate');await panel().evaluate(e=>e.scrollTop=0);const before=await saved();await shot('treaties-'+width);
  assert.ok(await panel().evaluate(e=>e.scrollWidth<=e.clientWidth+2));assert.ok(await page.locator('#panelBody').evaluate(e=>e.scrollWidth<=e.clientWidth+2));
  assert.ok(await page.locator('.diplomacy-tools button span').evaluateAll(spans=>spans.every(s=>{const r=s.getBoundingClientRect(),b=s.closest('button').getBoundingClientRect();return r.left>=b.left&&r.right<=b.right&&r.bottom<=b.bottom;})),'all five mode labels fit');
  for(const label of ['Grants','Favoured partners','Information']){await mode(label);if(label!=='Grants'){await country('italy').focus();await page.keyboard.press('Enter');}assert.equal(await saved(),before);await shot(label.toLowerCase().replaceAll(' ','-')+'-'+width);}
  await page.getByRole('button',{name:'Power rankings',exact:true}).click();assert.equal(await page.locator('.ranking-chart').count(),8);await shot('rankings-'+width);await page.locator('#closePanel').click();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
 console.log('PASS: treaty-first map offers/cancel, office refund, pact, grants/reload/refund, subsidy, favoured partners, eight nonnumeric rankings, keyboard, 360/412/915/1448 layouts');
}finally{await browser.close();}
