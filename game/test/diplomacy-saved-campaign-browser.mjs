import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const browser=await chromium.launch({headless:true,...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{})});
try{
 await mkdir('work/diplomacy-menu-review',{recursive:true});
 const page=await browser.newPage({viewport:{width:1448,height:1080}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{const u=new URL(route.request().url()),file=resolve('game',u.pathname.slice(6));try{await route.fulfill({body:await readFile(file),contentType:file.endsWith('.png')?'image/png':file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});}catch{await route.fulfill({status:404,body:''});}});
 await page.goto('https://appassets.androidplatform.net/game/index.html?native=1');await page.locator('#startupStatus').waitFor({state:'detached'});
 const bytes=await readFile(process.env.DIPLOMACY_SAVE_FIXTURE||'outputs/campaign-backups/England-1538-before-further-work-20261117.json','utf8');
 await page.evaluate(json=>localStorage.setItem('imp2-rebuild-v3',json),bytes);await page.reload();await page.locator('#startupStatus').waitFor({state:'detached'});
 assert.match(await page.locator('#heading').innerText(),/1538/);
 await page.locator('[data-panel=diplomacy]').click();await page.screenshot({path:'work/diplomacy-menu-review/england-1538-diplomacy.png'});
 assert.equal(await page.getByRole('button',{name:'Power rankings',exact:true}).count(),0);
 assert.equal(await page.evaluate(()=>localStorage.getItem('imp2-rebuild-v3')),bytes,'Viewing diplomacy must leave the existing saved campaign byte-identical');
 assert.deepEqual(errors,[]);console.log('PASS: isolated copy of England1538 opens the updated diplomacy menu without any saved-data changes. Original backup and live campaign untouched.');
}finally{await browser.close();}
