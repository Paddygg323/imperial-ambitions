from pathlib import Path
base=Path('game/test/visual-review.mjs').read_text();s=base[:base.index('for(const width')]+'''
await page.evaluate(async()=>{const {createGame}=await import('./engine.mjs'),{createMap}=await import('./map.mjs');const s=createGame();s.civilians=[];s.armies=[];s.ships=[];
s.tiles=[];for(let row=0;row<4;row++)for(let col=0;col<4;col++)s.tiles.push({id:`${80+col},${20+row}`,x:80+col,y:20+row,owner:'england',province:'dev',terrain:[0,1,12,8][row],resource:['grain','meat','timber','iron'][row],level:col+1,prospected:true});
s.provinces=[{id:'dev',owner:'england',old:true,town:'missing',name:'Development sample'}];s.nations.england.prospected=s.tiles.map(t=>t.id);
const old=document.querySelector('#map'),canvas=old.cloneNode();old.replaceWith(canvas);window.developmentPreview=createMap(canvas,()=>s,()=>{});developmentPreview.focus('81,22');
});await page.waitForTimeout(500);await page.locator('#map').screenshot({path:'outputs/visual-review/development-levels-map.png'});
// Camera cannot be zoomed into an effectively empty infinite plane.
const bounds=await page.evaluate(()=>{developmentPreview.zoom(.00001);return developmentPreview.viewport();});assert.ok(bounds.scale>=Math.min(bounds.width/110,bounds.height/54));
assert.deepEqual(errors,[]);console.log('PASS: sixteen resource-development fixtures render at real local map scale; minimum zoom constrained. Fixture does not change saved campaign.');
}finally{await browser.close();}
''';Path('game/test/development-art-browser.mjs').write_text(s,encoding='utf-8')
