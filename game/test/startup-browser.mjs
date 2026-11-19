import {createRequire} from 'node:module';import {readFile} from 'node:fs/promises';import {resolve} from 'node:path';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/paddy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
 for(const mode of ['supported','unsupported','missing']){
  const page=await browser.newPage({viewport:{width:412,height:915}});
  await page.route('**/*',async route=>{const file=resolve('game',new URL(route.request().url()).pathname.slice(6));try{if(mode==='missing'&&file.endsWith('app.mjs'))throw Error('missing');await route.fulfill({body:await readFile(file),contentType:/\.(mjs|js)$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':'text/html'});}catch{await route.fulfill({status:404,body:''});}});
  if(mode!=='supported')await page.addInitScript(mode=>{localStorage.setItem('imp2-rebuild-v3','player original');if(mode==='unsupported')window.structuredClone=undefined;},mode);
  await page.goto('https://appassets.androidplatform.net/game/index.html?native=1');
  if(mode==='supported'){await page.locator('#startupStatus').waitFor({state:'detached'});assert.ok(await page.locator('#cabinetPortrait h2').isVisible());}
  else{await page.locator('#startupStatus[role=alert]').waitFor();assert.match(await page.locator('#startupStatus').innerText(),/could not open/);assert.equal(await page.evaluate(()=>localStorage.getItem('imp2-rebuild-v3')),'player original');if(mode==='unsupported')assert.match(await page.locator('#startupStatus').innerText(),/WebView/);}
  await page.close();
 }
 console.log('PASS: compatible runtime opens normally; unsupported WebView and missing module show recovery guidance without overwriting saved campaigns.');
}finally{await browser.close();}
