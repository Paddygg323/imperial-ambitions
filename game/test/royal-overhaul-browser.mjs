import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/paddy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
await mkdir('outputs/visual-review/royal244',{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1448,height:1080}}),errors=[],missing=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{const u=new URL(route.request().url()),file=resolve('game',u.pathname.slice(6));try{await route.fulfill({body:await readFile(file),contentType:file.endsWith('.png')?'image/png':file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});}catch{missing.push(u.pathname);await route.fulfill({status:404,body:''});}});
 await page.goto('https://appassets.androidplatform.net/game/index.html?native=1');await page.locator('#startupStatus').waitFor({state:'detached'});await page.waitForFunction(()=>document.querySelector('#heading').textContent.includes('1500'));
 await page.evaluate(async()=>{const {createGame,saveGame}=await import('./engine.mjs');localStorage.setItem('imp2-rebuild-v3',saveGame(createGame({transportModel:'ports'})));});await page.reload();await page.waitForTimeout(800);
 const saved=()=>page.evaluate(()=>localStorage.getItem('imp2-rebuild-v3')),before=await saved();
 const shot=async name=>{await page.waitForTimeout(180);await page.screenshot({path:'outputs/visual-review/royal244/'+name+'.png'});};
 const open=async panel=>page.locator('#navigation [data-panel='+panel+']').click();
 await open('civilians');await page.locator('.civilian-row').filter({hasText:'Engineer'}).getByRole('button',{name:'Select',exact:true}).click();await shot('engineer-desktop');
 assert.match(await page.locator('#cabinetPortrait').innerText(),/Road/);assert.match(await page.locator('#cabinetPortrait').innerText(),/Fort III/);
 // A minimap drag changes the camera image, but never issues orders or changes save data.
 const initial=await page.locator('#map').evaluate(c=>c.toDataURL()),mini=await page.locator('#minimap').boundingBox();await page.mouse.move(mini.x+mini.width*.72,mini.y+mini.height*.4);await page.mouse.down();await page.mouse.move(mini.x+mini.width*.85,mini.y+mini.height*.6,{steps:5});await page.mouse.up();
 assert.notEqual(await page.locator('#map').evaluate(c=>c.toDataURL()),initial);assert.equal(await saved(),before);
 await page.locator('#home').click();
 for(const name of ['industry','transport','research','trade','diplomacy','army','navy','reports']){await open(name);if(name==='diplomacy'){assert.equal(await page.locator('.overture-palette button').count(),7);assert.equal(await page.locator('.relations-ledger').count(),0);assert.equal(await page.locator('.diplomacy-atlas svg.political-map').count(),1);}await shot(name+'-desktop');assert.ok(await page.locator('#panel').evaluate(e=>e.scrollWidth<=e.clientWidth+2),name+' width');await page.locator('#closePanel').click();}
 await page.locator('#nationView').click();await shot('nation-desktop');await page.locator('#strategic').click();await shot('world-desktop');
 for(const size of [{width:412,height:915},{width:915,height:412},{width:360,height:800}]){
  await page.setViewportSize(size);await page.locator('#home').click();await open('civilians');await page.locator('.civilian-row').filter({hasText:'Engineer'}).getByRole('button',{name:'Select',exact:true}).click();await shot('map-'+size.width);
  assert.ok((await page.locator('#map').boundingBox()).height>150);
  const bounds=await page.evaluate(()=>{const h=document.querySelector('#app>header').getBoundingClientRect(),s=document.querySelector('#summary').getBoundingClientRect(),m=document.querySelector('.map-area').getBoundingClientRect();return {headerBottom:h.bottom,summaryTop:s.top,summaryBottom:s.bottom,mapTop:m.top,summaryHeight:s.height};});
  assert.ok(bounds.summaryHeight>=25&&bounds.headerBottom<=bounds.summaryTop+1&&bounds.summaryBottom<=bounds.mapTop+1,'economy summary remains visible between header and map');
  await page.locator('.mobile-materials').filter({visible:true}).count().then(async count=>{if(count){await page.locator('.mobile-materials').click();assert.match(await page.locator('#panelBody').innerText(),/Construction costs/);await shot('costs-'+size.width);await page.locator('#closePanel').click();}});
  for(const name of ['research','industry','diplomacy']){await open(name);await shot(name+'-'+size.width);assert.ok(await page.locator('#panel').evaluate(e=>e.scrollWidth<=e.clientWidth+2),name+' '+size.width);await page.locator('#closePanel').click();}
  await page.locator('#mapOnly').click();assert.equal(await page.locator('#commandCabinet').isVisible(),false);await page.locator('#map').click({position:{x:50,y:60}});assert.equal(await page.locator('#commandCabinet').isVisible(),true);
 }
 assert.equal(await saved(),before,'UI exploration must not mutate the campaign');assert.deepEqual(errors,[]);assert.deepEqual(missing.filter(p=>p.endsWith('.png')),[]);
 console.log('PASS: minimap pan; illustrated costs; eight desktop menus; 412/360 portrait and 915 landscape; map-only; save unchanged; no missing artwork or browser errors.');
}finally{await browser.close();}

