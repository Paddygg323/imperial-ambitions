import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import europe from '../data/europe.mjs';
import {createGame,loadGame,saveGame} from '../engine.mjs';
test('historical map uses original108-column sampling and all130 native river codes',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-historical-rivers-audit.json',import.meta.url)));
 assert.equal(europe.width,108);assert.equal(europe.tiles.length,1161);assert.equal(europe.provinces.length,83);
 assert.ok(europe.tiles.every(t=>t.x<108));assert.equal(audit.rivers.length,130);
 const native=new Map(audit.rivers.map(r=>[`${r.x},${r.y}`,r]));
 for(const t of europe.tiles){assert.equal(t.riverCode,native.get(t.id)?.code??0);assert.equal(t.river,t.riverCode!==0);}
 assert.equal(europe.tiles.filter(t=>t.river).length,115);assert.equal(europe.waterRivers.length,15);
 assert.deepEqual(europe.waterRivers,audit.rivers.filter(r=>r.owner===255));
 const s=createGame(),loaded=loadGame(saveGame(s));
 // Newly generated worlds consume their own RNG before picture finalization;
 // valid river variants need not equal this fixed reference run's pictures.
 for(const t of s.tiles)assert.equal(loaded.tiles.find(q=>q.id===t.id).riverCode,t.riverCode);
 for(const t of europe.tiles)assert.equal(loaded.tiles.find(q=>q.id===t.id).river,t.river);
});
