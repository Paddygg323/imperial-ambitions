from pathlib import Path
base=Path('game/test/visual-review.mjs').read_text();s=base[:base.index('for(const width')]+'''
const result=await page.evaluate(async()=>{const {createGame}=await import('./engine.mjs'),{createMap}=await import('./map.mjs'),{seaName}=await import('./map-markers.mjs');const s=createGame();s.nations[s.player].seenSea=[];const old=document.querySelector('#map'),canvas=old.cloneNode();old.replaceWith(canvas);const ctx=canvas.getContext('2d'),labels=[],text=ctx.fillText.bind(ctx);ctx.fillText=(label,x,y,...rest)=>{labels.push({label,x,y});return text(label,x,y,...rest);};const map=createMap(canvas,()=>s,()=>{});map.focus(s.tiles.find(t=>t.x<10).id);map.zoom(6/54);await new Promise(r=>setTimeout(r,300));labels.length=0;map.draw();const v=map.viewport(),edge=(60-v.cx)*v.scale+v.width/2,names=new Set(s.seas.zones.map(z=>seaName(s,z)));return {leaks:labels.filter(l=>names.has(l.label)&&l.x<edge-1),v};});
assert.deepEqual(result.leaks,[],'Unseen western fragments must not receive eastern sea labels');
assert.ok(result.v.cx>=0&&result.v.cx<=108&&result.v.cy>=0&&result.v.cy<=53);
await page.screenshot({path:'outputs/visual-review/uncharted-west.png'});assert.deepEqual(errors,[]);console.log('PASS: no eastern sea labels leak into unseen western map; bounded camera.');
}finally{await browser.close();}
''';Path('game/test/map-fog-browser.mjs').write_text(s,encoding='utf-8')
