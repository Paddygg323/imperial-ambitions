from pathlib import Path
p=Path('game/test/art251-browser.mjs');s=p.read_text(encoding='utf8');anchor="await page.setViewportSize({width:1000,height:650});"
s=s.replace(anchor,"""await page.setViewportSize({width:1448,height:1000});
await page.evaluate(async()=>{const {neighbourIds}=await import('./world.mjs');const {setTransportLink}=await import('./transport-links.mjs');const s=window.fixture,ix=new Map(s.tiles.map(t=>[t.id,t]));for(const t of s.tiles.filter(t=>t.owner==='england'))for(const id of neighbourIds(t)){const q=ix.get(id);if(q?.owner==='england'&&t.id<q.id&&(t.y===q.y||t.x%3===0))setTransportLink(s,t.id,q.id,t.y<20?'rail':'road');}window.testMap.focus(s.nations.england.capital);});
await page.screenshot({path:out+'/roads-fixture.png'});
"""+anchor)
anchor="}finally{await browser.close();}"
s=s.replace(anchor,"""
await page.setViewportSize({width:1448,height:1000});
await page.evaluate(async()=>{
 const {createBattle}=await import('./battle.mjs'),{mountBattle}=await import('./battle-view.mjs');
 document.querySelectorAll('link[rel=stylesheet]').forEach(n=>n.remove());const css=document.createElement('link');css.rel='stylesheet';css.href='./battle-view.css';document.head.append(css);document.body.style.margin='0';document.body.innerHTML='<main id="battle"></main>';
 const types=['pikeman','musketeer','knight','general','bowman','culverin','hussar','guard'],forces={};for(const owner of ['england','france'])forces[owner]=types.map((type,i)=>({owner,type,id:owner+i,hp:100}));
 const b=createBattle({attacker:'england',defender:'france',province:'visual-fixture',nations:{england:{known:[]},france:{known:[]}},forces,activeWidth:17,cells:Array.from({length:464},()=>({terrain:0}))});
 Object.assign(b,{phase:'combat',activeSide:0,round:1,ready:[true,true]});for(const u of b.units){const i=types.indexOf(u.type);u.tile=(5+Math.floor(i/2)*2)*29+(u.side?11:3)+(i%2)*2;b.cells[u.tile].unit=u.id;}
 window.battleView=mountBattle(document.querySelector('#battle'),{battle:b,player:'england'});window.battleBefore=JSON.stringify(battleView.getState());
});
await page.waitForTimeout(500);await page.screenshot({path:out+'/battle-desktop.png'});
await page.setViewportSize({width:412,height:915});await page.locator('[data-do=focus]').click();await page.screenshot({path:out+'/battle-phone.png'});
assert.equal(await page.evaluate(()=>JSON.stringify(battleView.getState())===window.battleBefore),true);assert.deepEqual(errors,[]);
}finally{await browser.close();}""")
p.write_text(s,encoding='utf8')
