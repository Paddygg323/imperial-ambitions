from pathlib import Path
s=Path('game/test/visual-review.mjs').read_text(encoding='utf-8');a=s.index('for(const width');b=s.index('}finally{await browser.close();}')
s=s[:a]+'''for(const [name,button] of [['nation','nationView'],['world','strategic'],['local','home']]){await page.locator('#'+button).tap();await page.screenshot({path:`outputs/visual-review/zoom-${name}.png`});}
await page.locator('#zoomIn').tap();await page.locator('#zoomIn').tap();await page.screenshot({path:'outputs/visual-review/zoom-roads.png'});
const cdp=await page.context().newCDPSession(page);await page.locator('#home').tap();
await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:150,y:350,id:0},{x:250,y:350,id:1}]});
await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:110,y:350,id:0},{x:290,y:350,id:1}]});
await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.screenshot({path:'outputs/visual-review/zoom-pinch.png'});
// Verify anchored wheel zoom preserves the terrain under the pointer on an isolated map.
await page.evaluate(async()=>{const {createGame}=await import('./engine.mjs'),{createMap}=await import('./map.mjs');const s=createGame();const old=document.querySelector('#map'),canvas=old.cloneNode();old.replaceWith(canvas);window.zoomTestMap=createMap(canvas,()=>s,id=>window.zoomSelected=id);zoomTestMap.focus(s.nations[s.player].capital);});
const box=await page.locator('#map').boundingBox(),x=box.x+box.width*.65,y=box.y+box.height*.55;await page.mouse.click(x,y);const before=await page.evaluate(()=>zoomSelected);await page.mouse.move(x,y);await page.mouse.wheel(0,-200);await page.mouse.click(x,y);assert.equal(await page.evaluate(()=>zoomSelected),before,'Wheel zoom must preserve tile under pointer');
assert.deepEqual(errors,[]);console.log('PASS: Home/Nation/World, button zoom, two-finger CDP pinch without errors, anchored wheel tile selection. Screenshots for strategic/regional/local/road planning; not physical device pinch feel.');''' +s[b:];Path('game/test/zoom-browser.mjs').write_text(s,encoding='utf-8')
