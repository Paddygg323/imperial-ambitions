import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/paddy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
 const page=await browser.newPage({viewport:{width:412,height:915},isMobile:true,hasTouch:true}),errors=[],key='imp2-rebuild-v3';
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{const file=resolve('game',new URL(route.request().url()).pathname.slice(6));try{await route.fulfill({body:await readFile(file),contentType:file.endsWith('.png')?'image/png':file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});}catch{await route.fulfill({status:404,body:''});}});
 await page.addInitScript(()=>{window.AndroidGame={exportSave:(json,name)=>{window.recoveryExport={json,name};}};});
 await page.goto('https://appassets.androidplatform.net/game/index.html?native=1');
 const original=await page.evaluate(async key=>{const {createGame,saveGame}=await import('./engine.mjs');const s=createGame();s.nations.england.cash=12345;const raw=saveGame(s);localStorage.setItem(key+'-previous',raw);localStorage.setItem(key,'{"schema":3,"broken":');return raw;},key);
 await page.reload();await page.locator('#saveRecovery[open]').waitFor();
 await page.keyboard.press('Escape');assert.ok(await page.locator('#saveRecovery').evaluate(d=>d.open));
 const back=await readFile('android/src/main/java/com/paddy/imperialism/rebuild/MainActivity.java','utf8');const code=back.match(/game\.evaluateJavascript\("([^"]+)"/)[1];assert.equal(await page.evaluate(code),false,'blocked recovery requests the native Leave/Stay prompt');assert.ok(await page.locator('#saveRecovery').evaluate(d=>d.open));
 assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),'{"schema":3,"broken":');
 await page.locator('[data-recovery=export]').tap();assert.equal((await page.evaluate(()=>window.recoveryExport)).json,'{"schema":3,"broken":');
 await page.locator('[data-recovery=import]').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{}')});await page.waitForFunction(()=>document.querySelector('.recovery-error').textContent.includes('could not be loaded'));assert.match(await page.locator('.recovery-error').innerText(),/could not be loaded/);
 await page.locator('[data-recovery=previous]').tap();await page.locator('#saveRecovery').waitFor({state:'detached'});
 assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),original);
 assert.equal(await page.evaluate(key=>Object.keys(localStorage).filter(k=>k.startsWith(key+'-recovery-')).map(k=>localStorage.getItem(k)),key).then(a=>a[0]),'{"schema":3,"broken":');
 await page.reload();assert.equal(await page.locator('#saveRecovery').count(),0);assert.match(await page.locator('.summary').innerText(),/12,345/);
 // With no previous turn, a valid imported campaign is still recoverable.
 await page.evaluate(key=>{localStorage.removeItem(key+'-previous');localStorage.setItem(key,'unreadable original');},key);await page.reload();
 assert.ok(await page.locator('[data-recovery=previous]').isDisabled());
 await page.locator('[data-recovery=import]').setInputFiles({name:'restored.json',mimeType:'application/json',buffer:Buffer.from(original)});await page.locator('#saveRecovery').waitFor({state:'detached'});
 assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),original);assert.ok(await page.evaluate(key=>Object.keys(localStorage).filter(k=>k.startsWith(key+'-recovery-')).some(k=>localStorage.getItem(k)==='unreadable original'),key));
 assert.deepEqual(errors,[]);console.log('PASS: unreadable save preserved; recovery cannot be dismissed by Escape/Android Back; raw export; invalid import rejected; previous turn and valid import restore with original recovery copies retained.');
}finally{await browser.close();}
