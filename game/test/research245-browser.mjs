import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/paddy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const output='outputs/visual-review/research245';await mkdir(output,{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1448,height:1080}}),errors=[],missing=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{const u=new URL(route.request().url()),file=resolve('game',u.pathname.slice(6));try{await route.fulfill({body:await readFile(file),contentType:file.endsWith('.png')?'image/png':file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});}catch{missing.push(file);await route.fulfill({status:404,body:''});}});
 await page.goto('https://appassets.androidplatform.net/game/index.html?native=1');await page.locator('#startupStatus').waitFor({state:'detached'});
 await page.evaluate(async()=>{const {createGame,saveGame}=await import('./engine.mjs');const s=createGame({transportModel:'ports'});s.nations.france.known.push('10');s.nations.england.cash=30000;s.nations.england.known.push('12');s.nations.england.consulates=['italy'];s.nations.england.embassies=['italy'];localStorage.setItem('imp2-rebuild-v3',saveGame(s));});await page.reload();await page.locator('#startupStatus').waitFor({state:'detached'});

 const saved=()=>page.evaluate(()=>localStorage.getItem('imp2-rebuild-v3'));
 await page.locator('[data-panel=research]').click();const before=await saved();
 assert.equal(await page.locator('.research-vacancy').count(),3);
 for(const group of ['Gathering','Army','Finance','Industry','Navy','Show all']){await page.locator('.research-categories').getByRole('button',{name:group,exact:true}).click();assert.equal(await saved(),before);}
 await page.getByRole('button',{name:'All technologies',exact:true}).click();
 await page.locator('#researchSearch').fill('Horse Artillery');assert.ok(await page.locator('.research-entry').count()>=1);
 await page.locator('.research-entry').filter({has:page.getByText('Horse Artillery',{exact:true})}).getByRole('button',{name:'Set goal',exact:true}).click();assert.ok(JSON.parse(await saved()).nations.england.goal);
 await page.getByRole('button',{name:'Available',exact:true}).click();
 await page.locator('#researchSearch').fill('Saw Mill');
 await page.locator('.research-entry').getByRole('button',{name:'Research',exact:true}).click();
 let state=JSON.parse(await saved()),p=state.nations.england.projects[0];assert.equal(p.tech,'9');assert.equal(p.funding,100);
 await page.locator('.research-project').getByRole('button',{name:'+',exact:true}).click();assert.equal(JSON.parse(await saved()).nations.england.projects[0].funding,200);
 await page.locator('.research-project').getByRole('button',{name:'−',exact:true}).click();assert.equal(JSON.parse(await saved()).nations.england.projects[0].funding,100);
 const ordered=await saved();await page.reload();await page.locator('#startupStatus').waitFor({state:'detached'});await page.locator('[data-panel=research]').click();assert.equal(await saved(),ordered);
 assert.ok(await page.locator('.knowledge-flags').count()>0);await page.screenshot({path:output+'/desktop.png'});
 for(const width of [412,360,915]){await page.setViewportSize({width,height:width===915?412:915});await page.locator('#panel').evaluate(e=>e.scrollTop=0);await page.screenshot({path:output+'/projects-'+width+'.png'});await page.locator('.research-catalogue').scrollIntoViewIfNeeded();await page.screenshot({path:output+'/catalogue-'+width+'.png'});assert.ok(await page.locator('#panel').evaluate(e=>e.scrollWidth<=e.clientWidth+2));}
 assert.equal(await saved(),ordered);assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
 console.log('PASS: research categories/search/goal, base funding, increase/decrease, reload preservation, slots and desktop/360/412/915 layouts. Isolated Chromium campaign.');
}finally{await browser.close();}

