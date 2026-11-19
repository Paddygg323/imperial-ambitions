import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/paddy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{const page=await browser.newPage({viewport:{width:412,height:915},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',async route=>{const u=new URL(route.request().url());try{const file=resolve('game',u.pathname.slice(6));const body=await readFile(file);await route.fulfill({body,contentType:file.endsWith('.png')?'image/png':file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});}catch{await route.fulfill({status:404,body:''});}});
await page.goto('https://appassets.androidplatform.net/game/index.html?native=1');await page.waitForFunction(()=>document.querySelector('#heading').textContent.includes('1500'));await page.waitForTimeout(600);await mkdir('outputs/visual-review',{recursive:true});



await page.screenshot({path:'outputs/visual-review/refresh238-local-phone.png'});
for(const view of ['research','industry','diplomacy','army','navy']){
 await page.locator('[data-panel='+view+']').tap();await page.screenshot({path:'outputs/visual-review/refresh238-'+view+'-phone.png'});
 assert.ok(await page.locator('#panel').evaluate(e=>e.scrollWidth<=e.clientWidth+2),'No horizontal overflow: '+view);await page.locator('#closePanel').tap();
}
await page.locator('#nationView').tap();await page.screenshot({path:'outputs/visual-review/refresh238-nation-phone.png'});
await page.locator('#strategic').tap();await page.screenshot({path:'outputs/visual-review/refresh238-world-phone.png'});
await page.locator('#home').tap();await page.locator('#zoomIn').tap();await page.locator('#zoomIn').tap();await page.screenshot({path:'outputs/visual-review/refresh238-detail-phone.png'});
await page.setViewportSize({width:1280,height:900});await page.locator('#home').click();await page.screenshot({path:'outputs/visual-review/refresh238-local-desktop.png'});
for(const view of ['research','industry','diplomacy']){await page.locator('[data-panel='+view+']').click();await page.screenshot({path:'outputs/visual-review/refresh238-'+view+'-desktop.png'});assert.ok(await page.locator('#panel').evaluate(e=>e.scrollWidth<=e.clientWidth+2));await page.locator('#closePanel').click();}
assert.deepEqual(errors,[]);console.log('PASS: five phone menus, three desktop menus, local/detail/nation/world map views; no page errors or horizontal menu overflow.');
}finally{await browser.close();}
