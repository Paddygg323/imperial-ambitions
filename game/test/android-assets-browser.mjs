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

 await page.goto('https://appassets.androidplatform.net/game/index.html?native=1');await page.locator('#menu').tap();

 await page.locator('[data-action="export"]').tap();const exported=await page.evaluate(()=>window.savedExport);

 assert.ok(exported);const save=JSON.parse(exported.json);assert.equal(save.schema,3);assert.match(exported.name,/\.json$/);
 assert.equal(save.transportModel,'ports');

 assert.equal(save.mapProvenance.generator,'original-stages-v1');
 assert.equal(save.tiles.length+Object.keys(save.seas.cellZones).length,108*60);
 assert.ok(save.provinces.some(p=>!p.old));
 const startingSeas=await page.evaluate(async state=>{const {shipSea}=await import('./navy.mjs');return state.ships.map(ship=>shipSea(state,ship));},save);
 for(const zone of startingSeas)assert.ok(save.seas.zones.some(z=>z.id===zone),'Every starting home fleet must have access to a generated sea zone');
 const minorExits=await page.evaluate(async state=>{const {portSeas}=await import('./overseas.mjs');return Object.values(state.minors).map(m=>({id:m.id,exits:portSeas(state,m.capital)}));},save);
 assert.equal(minorExits.length,16);for(const m of minorExits)assert.ok(m.exits.length,`Packaged minor capital ${m.id} must reach sea`);
 save.nations.england.cash=4321;

 await page.locator('#importSave').setInputFiles({name:'roundtrip.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(save))});

 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')).nations.england.cash===4321);

 await page.reload();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')).nations.england.cash),4321);

 await page.locator('[data-panel="diplomacy"]').tap();

 await page.getByRole('button',{name:'Trade subsidies',exact:true}).tap();
 await page.getByRole('button',{name:'25% subsidy',exact:true}).tap();
 await page.locator('.country-key').filter({hasText:'Portugal'}).tap();
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')).nations.england.tradePolicies.portugal),75);
 await page.reload();await page.locator('[data-panel="diplomacy"]').tap();
 await page.getByRole('button',{name:'Information',exact:true}).tap();
 await page.locator('.country-key').filter({hasText:'Portugal'}).tap();
 assert.match(await page.locator('#panelBody').innerText(),/Trade terms: 25% subsidy/);
 await page.getByRole('button',{name:'Treaties',exact:true}).tap();
 await page.locator('.overture-palette button').filter({hasText:'Trade consulate'}).tap();
 await page.locator('.country-key').filter({hasText:'Ireland'}).tap();

 const offices=await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')));

 assert.equal(offices.nations.england.cash,3821);assert.equal(offices.diplomaticOffices.length,1);

 assert.equal(offices.diplomaticOffices[0].office,'consulate');assert.match(await page.locator('#panelBody').innerText(),/Trade consulate opens next turn/);

 await page.reload();await page.locator('[data-panel="diplomacy"]').tap();

 await page.locator('.country-key').filter({hasText:'Ireland'}).tap();
 assert.match(await page.locator('#panelBody').innerText(),/Trade consulate opens next turn/);

 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);

 await page.getByText('Trade consulate opens next turn.',{exact:true}).scrollIntoViewIfNeeded();

 await page.screenshot({path:'work/rebuild-v2/phone-diplomatic-office.png'});

 assert.equal(await page.evaluate(async()=> (await navigator.serviceWorker.getRegistrations()).length),0);

 await page.evaluate(async()=>{

  const {createGame,saveGame}=await import('./engine.mjs');const {setTransportLink}=await import('./transport-links.mjs');const {neighbourIds}=await import('./world.mjs');

  const s=createGame({transportModel:"ports"}),n=s.nations.england,p=s.provinces.find(p=>p.owner==='england'&&!p.capital),t=s.tiles.find(t=>t.id===p.town),q=s.tiles.find(q=>q.owner==='england'&&neighbourIds(t).includes(q.id));

  n.known.push('60');n.stock.lumber=40;n.stock.castIron=40;setTransportLink(s,t.id,q.id,'road');

  s.civilians.find(c=>c.owner==='england'&&c.type==='builder').tile=t.id;

  localStorage.setItem('imp2-rebuild-v3',saveGame(s));

 });

 await page.reload();await page.locator('[data-panel="civilians"]').tap();

 await page.locator('#panelBody .row').filter({hasText:'Builder'}).getByRole('button',{name:'Select',exact:true}).tap();

 await page.getByRole('button',{name:'Upgrade town · 2 lumber + 2 cast iron · 2 turns',exact:true}).tap();

 const upgraded=await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')));

 assert.equal(upgraded.nations.england.stock.lumber,38);assert.equal(upgraded.nations.england.stock.castIron,38);

 assert.equal(upgraded.civilians.find(c=>c.owner==='england'&&c.type==='builder').order.job,'upgradeTown');

 await page.waitForFunction(()=>document.querySelector('#selection').innerText.includes('Explorer ready'));
 await page.locator('[data-panel="civilians"]').tap();
 await page.locator('#panelBody .row').filter({hasText:'Builder'}).getByRole('button',{name:'Select',exact:true}).tap();
 assert.match(await page.locator('#selection').innerText(),/2 turn\(s\) remaining/);

 await page.screenshot({path:'work/rebuild-v2/phone-town-upgrade.png'});

 await page.evaluate(async()=>{
  const {createGame,saveGame}=await import('./engine.mjs');const {openMarket,setTradeOrder,nextOffer}=await import('./trade.mjs');
  const s=createGame({transportModel:"ports"});for(const n of Object.values(s.nations))n.orders.trade={bids:[],offers:{}};
  setTradeOrder(s,'england',{good:'timber',bid:true});s.market=openMarket(s);const offer=nextOffer(s,s.market);
  if(!offer||!s.minors[offer.seller])throw Error('Missing real minor export');
  window.exportSeller=s.minors[offer.seller].name;localStorage.setItem('imp2-rebuild-v3',saveGame(s));
 });
 await page.reload();assert.match(await page.locator('#panelBody').innerText(),/Timber from/);
 await page.locator('#dealQuantity').fill('1');await page.locator('[data-action="acceptTrade"]').tap();
 const traded=await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')));
 const deals=traded.market?.deals??traded.reports.filter(r=>r.kind==='trade');
 assert.ok(deals.some(d=>d.buyer==='england'&&traded.minors[d.seller]&&d.good==='timber'&&d.quantity===1));
 await page.evaluate(async()=>{
  const {createGame,saveGame}=await import('./engine.mjs');const {TECHS}=await import('./rules.mjs');
  const s=createGame({transportModel:"ports"}),n=s.nations.england;n.known=Object.keys(TECHS);for(const g of Object.keys(n.stock))n.stock[g]=100;
  s.armies=[];s.armies.push({id:'upgrade-touch',owner:'england',type:'levy',hp:61,experience:3,order:null,province:s.tiles.find(t=>t.id===n.capital).province});
  localStorage.setItem('imp2-rebuild-v3',saveGame(s));
 });
 await page.reload();await page.locator('[data-panel="army"]').tap();
 const upgradeButton=page.locator('[data-action="upgradeArmy"]');assert.match(await upgradeButton.innerText(),/Sharpshooter/);
 await upgradeButton.tap();
 const veteran=await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')).armies.find(u=>u.id==='upgrade-touch'));
 assert.equal(veteran.type,'sharpshooter');assert.equal(veteran.hp,61);assert.equal(veteran.experience,3);
 assert.equal(await page.locator('[data-action="upgradeArmy"]').count(),0);
 await page.screenshot({path:'work/rebuild-v2/phone-army-upgrade.png'});
 await page.evaluate(async()=>{const {createGame,saveGame}=await import('./engine.mjs');localStorage.setItem('imp2-rebuild-v3',saveGame(createGame({transportModel:"ports"})));});

 await page.reload();await page.locator('[data-panel="navy"]').tap();

 assert.equal(await page.locator('[data-action="selectShip"]').count(),3);

 assert.equal(await page.getByRole('button',{name:'Defending - reactivate',exact:true}).count(),2);

 await page.getByRole('button',{name:'Defending - reactivate',exact:true}).first().tap();

 assert.equal(await page.getByRole('button',{name:'Defending - reactivate',exact:true}).count(),1);

 await page.getByRole('button',{name:'Defend',exact:true}).first().tap();

 await page.reload();await page.locator('[data-panel="navy"]').tap();

 assert.equal(await page.getByRole('button',{name:'Defending - reactivate',exact:true}).count(),2);

 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);

 await page.screenshot({path:'work/rebuild-v2/phone-starting-fleet.png'});

 await page.locator('#closePanel').tap();await page.locator('[data-panel="army"]').tap();

 assert.equal(await page.locator('[data-action="selectRegiment"]').count(),3);

 assert.equal(await page.getByText('Defending',{exact:true}).count(),3);

 await page.getByRole('button',{name:'Arquebusier',exact:true}).tap();

 await page.getByRole('button',{name:'Wake',exact:true}).tap();

 const openingArmy=await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')).armies.filter(u=>u.owner==='england'));

 assert.equal(openingArmy.filter(u=>u.defending).length,2);

 await page.reload();await page.locator('[data-panel="army"]').tap();

 assert.equal(await page.getByText('Defending',{exact:true}).count(),2);

 await page.screenshot({path:'work/rebuild-v2/phone-starting-army.png'});



 const remote=await page.evaluate(async()=>{
  const {createGame,saveGame}=await import('./engine.mjs');const {conquerProvince}=await import('./conquest.mjs');
  const s=createGame({transportModel:'ports'}),remote=s.nations.france.capital;
  conquerProvince(s,s.tiles.find(t=>t.id===remote).province,'england');for(const t of s.tiles)t.level=0;
  const port=s.tiles.find(t=>t.id===remote);port.resource='timber';port.level=4;port.prospected=true;
  s.ships=s.ships.filter(u=>u.owner==='england').slice(0,1);s.ships[0].cargo=2;
  localStorage.setItem('imp2-rebuild-v3',saveGame(s));return remote;
 });
 await page.reload();await page.locator('[data-panel="transport"]').tap();
 const timber=page.locator('#panelBody .transport-good').filter({hasText:'Timber'});
 await timber.getByRole('button',{name:'+',exact:true}).tap();
 await timber.getByRole('button',{name:'+',exact:true}).tap();
 assert.equal(await timber.getByRole('button',{name:'+',exact:true}).isDisabled(),true);
 assert.equal(await page.evaluate(root=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')).nations.england.transportAssignments[root].assigned[1],remote),2);
 await page.reload();await page.locator('[data-panel="transport"]').tap();
 assert.match(await page.locator('#panelBody').innerText(),/Where your supplies come from/);
 assert.match(await timber.innerText(),/2 \/ 4/);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.waitForTimeout(500); // Let the browser's transient touch highlight fade before visual capture.
 await page.screenshot({path:'work/rebuild-v2/phone-port-transport.png'});
 const colony=await page.evaluate(async()=>{
  const {createGame,saveGame}=await import('./engine.mjs');const s=createGame({transportModel:'ports'});
  const p=s.provinces.find(p=>!p.old);s.minors[p.owner].colonyOf='england';
  localStorage.setItem('imp2-rebuild-v3',saveGame(s));return {province:p.id,owner:p.owner};
 });
 await page.reload();await page.locator('[data-panel="army"]').tap();
 await page.locator('[data-action="selectRegiment"]').first().tap();
 await page.locator('#armyDestination').selectOption(colony.province);
 await page.getByRole('button',{name:'Redeploy selected',exact:true}).tap();
 await page.reload();
 const colonialOrder=await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')));
 assert.ok(colonialOrder.armies.some(u=>u.owner==='england'&&u.order?.job==='deploy'&&u.order.province===colony.province));
 assert.equal(colonialOrder.provinces.find(p=>p.id===colony.province).owner,colony.owner);
 assert.deepEqual(errors,[]);console.log('Packaged Android-origin campaigns: save roundtrip, diplomacy, upgrades, fleet/army and port controls, plus colonial redeployment touch order/reload pass at412x915. Colony ownership supplied as explicit fixture; Chromium, not Android WebView.');

}finally{await browser?.close();}

