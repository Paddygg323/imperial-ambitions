import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const out='work/visual-craft/'+(process.argv[2]||'final');await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{})}),metrics=[];
try{
 const page=await browser.newPage({viewport:{width:1448,height:1080}}),errors=[],missing=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{const path=new URL(route.request().url()).pathname,file=resolve('game',path.slice(6));try{await route.fulfill({body:await readFile(file),contentType:file.endsWith('.png')?'image/png':file.endsWith('.mjs')||file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':'text/html'});}catch{missing.push(path);await route.fulfill({status:404,body:''});}});
 await page.goto('https://appassets.androidplatform.net/game/index.html?native=1');await page.locator('#startupStatus').waitFor({state:'detached'});
 await page.evaluate(async()=>{const {createGame,saveGame}=await import('./engine.mjs');localStorage.setItem('imp2-rebuild-v3',saveGame(createGame({transportModel:'ports'})));});await page.reload();await page.locator('#startupStatus').waitFor({state:'detached'});await page.waitForTimeout(1500);
 const initial=await page.evaluate(()=>localStorage.getItem('imp2-rebuild-v3'));
 const shot=async name=>{await page.waitForTimeout(100);await page.screenshot({path:out+'/'+name+'.png'});metrics.push({name,...await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,modalOverflow:document.querySelector('#panel').open&&document.querySelector('#panel').scrollWidth>document.querySelector('#panel').clientWidth+2,tinyText:[...document.querySelectorAll('#panelBody button,#panelBody small')].filter(e=>e.getBoundingClientRect().height&&parseFloat(getComputedStyle(e).fontSize)<11).length}))});};
 for(const size of [{width:1448,height:1080},{width:412,height:915},{width:915,height:412},{width:360,height:800}]){
  await page.setViewportSize(size);await page.locator('#home').click();await shot('map-'+size.width);
  for(const name of ['civilians','industry','transport','research','trade','diplomacy','army','navy','reports']){
   await page.locator('#navigation [data-panel='+name+']').click();await shot(name+'-'+size.width);
   if(name==='industry'&&size.width!==915){for(const tab of ['Workers','Recruitment']){await page.getByRole('button',{name:tab,exact:true}).click();await shot(tab.toLowerCase()+'-'+size.width);}await page.getByRole('button',{name:'Workshops',exact:true}).click();}
   if(name==='diplomacy'&&size.width!==915){for(const tab of ['Grants','Information']){await page.locator('.diplomacy-tools').getByRole('button',{name:tab,exact:true}).click();await shot('diplomacy-'+tab.toLowerCase()+'-'+size.width);}}
   await page.locator('#closePanel').click();
  }
  await page.locator('#nationView').click();await shot('nation-'+size.width);await page.locator('#strategic').click();await shot('world-'+size.width);
 }
 const same=initial===await page.evaluate(()=>localStorage.getItem('imp2-rebuild-v3'));
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);assert.equal(same,true);assert.deepEqual(metrics.filter(m=>m.overflow||m.modalOverflow),[]);
 await writeFile(out+'/metrics.json',JSON.stringify({metrics,errors,missing,saveUnchanged:same},null,2));console.log(JSON.stringify({screens:metrics.length,errors,missing,saveUnchanged:same,overflow:metrics.filter(m=>m.overflow||m.modalOverflow)}));
}finally{await browser.close();}

