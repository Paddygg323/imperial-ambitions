import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import europe from '../data/europe.mjs';
import {riverRouteResult,riverExit,portExit} from '../river-routes.mjs';
test('live river access matches every original historical land river route',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-historical-rivers-audit.json',import.meta.url)));
 const s={tiles:europe.tiles},index=new Map(s.tiles.map(t=>[t.id,t]));let checked=0;
 for(const r of audit.rivers){if(r.owner===255)continue;const tile=index.get(`${r.x},${r.y}`);assert.equal(riverRouteResult(s,tile,index),r.foreignRouteResult,tile.id);checked++;}
 assert.equal(checked,115);
});

test('river access follows230 native routes after ownership changes',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-river-ownership-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,230);
 for(const mode of ['unified','split']){
  const s={tiles:europe.tiles.map(t=>({...t,owner:mode==='unified'||t.x<95?'a':'b'}))},index=new Map(s.tiles.map(t=>[t.id,t]));
  for(const c of audit.cases.filter(c=>c.mode===mode))assert.equal(riverRouteResult(s,index.get(c.id),index),c.result,`${mode} ${c.id}`);
 }
});

test('river exit matches the native sea endpoint and direction for all115 land rivers',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-river-exits-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,115);
 const s={tiles:europe.tiles},index=new Map(s.tiles.map(t=>[t.id,t]));
 for(const c of audit.cases){const actual=riverExit(s,index.get(c.id),index);assert.deepEqual(actual,c.exit===null?null:{id:c.exit,direction:c.direction},c.id);}
});

test('port exits match native coastal ordering, foreign adjacency and river fallback on2322 historical cases',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-port-exits-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,2322);
 const s={tiles:europe.tiles},index=new Map(s.tiles.map(t=>[t.id,t]));
 for(const c of audit.cases)assert.deepEqual(portExit(s,index.get(c.id),{index,restricted:c.restricted}),c.exit===null?null:{id:c.exit,direction:c.direction},`${c.id} restricted=${c.restricted}`);
});

test('live historical ports expose only the native selected exit sea zone',async()=>{
 const {createGame}=await import('../engine.mjs');const {portSeas}=await import('../overseas.mjs');
 const s=createGame(),audit=JSON.parse(readFileSync(new URL('../../outputs/Native-port-exits-audit.json',import.meta.url)));
 for(const c of audit.cases.filter(c=>c.restricted)){
  const zone=c.exit&&s.seas.cellZones[c.exit];assert.deepEqual(portSeas(s,c.id),zone?[zone]:[],c.id);
 }
});
test('legacy historical river codes migrate without relocating ships or changing resources',async()=>{
 const {createGame,saveGame,loadGame}=await import('../engine.mjs');
 const s=createGame();delete s.riverDataVersion;
 for(const t of s.tiles.filter(t=>t.river)){t.riverCode=1;}
 const before=JSON.parse(JSON.stringify({ships:s.ships,nations:s.nations,seas:s.seas}));
 const loaded=loadGame(saveGame(s));assert.equal(loaded.riverDataVersion,1);
 for(const t of europe.tiles)assert.equal(loaded.tiles.find(q=>q.id===t.id).riverCode,t.riverCode);
 assert.deepEqual({ships:loaded.ships,nations:loaded.nations,seas:loaded.seas},before);
 assert.deepEqual(loadGame(saveGame(loaded)),loaded);
});
test('river migration does not replace custom-map river data',async()=>{
 const {migrateHistoricalRivers}=await import('../world.mjs');
 const s={tiles:[{...europe.tiles.find(t=>t.river),riverCode:9}]};
 const before=structuredClone(s);migrateHistoricalRivers(s);assert.deepEqual(s,before);
});
