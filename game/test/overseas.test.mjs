import test from 'node:test';
import assert from 'node:assert/strict';
import {europe,neighbourIds} from '../world.mjs';
import {generateSeas,seaDistance,revealCoast,revealInterior} from '../overseas.mjs';
import {createHistoricalGameplayMap} from '../map-new-game.mjs';
const full=createHistoricalGameplayMap(1500),world={tiles:full.tiles.filter(t=>!t.province.startsWith('e')),provinces:full.provinces.filter(p=>!p.old)},tiles=full.tiles,seas=full.seas;
test('seeded overseas geography preserves Europe and has one town per connected province',()=>{
 assert.deepEqual(createHistoricalGameplayMap(1500),full);
 assert.notDeepEqual(createHistoricalGameplayMap(1501).tiles,full.tiles);
 const ids=new Set(europe.tiles.map(t=>t.id));assert.ok(world.tiles.every(t=>!ids.has(t.id)));
 for(const p of world.provinces){const group=world.tiles.filter(t=>t.province===p.id),todo=new Map(group.map(t=>[t.id,t])),queue=[group[0]];todo.delete(group[0].id);
  while(queue.length)for(const id of neighbourIds(queue.shift()))if(todo.has(id)){queue.push(todo.get(id));todo.delete(id);}
  assert.equal(todo.size,0);assert.equal(group.filter(t=>t.terrain===13).length,1);assert.equal(p.old,false);
 }
 assert.ok(world.tiles.every(t=>!['grain','meat','wool'].includes(t.resource)),'Old World food and wool are not invented overseas');
});
test('sea zones never route across land and have symmetric adjacent routes',()=>{
 const land=new Set(tiles.map(t=>t.id));for(const z of seas.zones){assert.ok(z.cells.every(id=>!land.has(id)));for(const q of z.adjacent){assert.ok(seas.zones.find(s=>s.id===q).adjacent.includes(z.id));assert.equal(seaDistance(seas,z.id,q),1);}}
});
test('ship reveals coasts; explorer reveals neighbours; knowledge belongs to that nation',()=>{
 const s={tiles,provinces:[...europe.provinces,...world.provinces],seas,nations:{england:{},portugal:{}}};
 const z=seas.zones.find(z=>z.coast.some(id=>world.tiles.some(t=>t.id===id)));
 revealCoast(s,'england',z.id);const landing=z.coast.find(id=>world.tiles.some(t=>t.id===id));
 assert.ok(s.nations.england.revealed.includes(landing));assert.equal(s.nations.portugal.revealed,undefined);
 const hidden=world.tiles.find(t=>!s.nations.england.revealed.includes(t.id));assert.throws(()=>revealInterior(s,'england',hidden.id),/landing/);
 revealInterior(s,'england',landing);assert.ok(s.nations.england.prospected.includes(landing));
});

// The audited original raster reader samples 108 columns by 60 rows.
test('land and sea partition the original map bounds without an extra eastern channel',()=>{
 const land=new Set(tiles.map(t=>t.id)),water=Object.keys(seas.cellZones);
 assert.equal(land.size+water.length,108*60);
 for(let y=0;y<60;y++)for(let x=0;x<108;x++){
  const id=`${x},${y}`;assert.notEqual(land.has(id),Object.hasOwn(seas.cellZones,id));
 }
 assert.ok(water.every(id=>{const [x,y]=id.split(',').map(Number);return x>=0&&x<108&&y>=0&&y<60;}));
});

 test('existing saves retain serialized sea zones and fleet locations',async()=>{
 const {createGame,saveGame,loadGame}=await import('../engine.mjs');
 const s=createGame();s.seas=generateSeas(s.tiles,109,60);
 const edge=s.seas.cellZones['108,30'];assert.ok(edge);s.ships[0].location=edge;
 const loaded=loadGame(saveGame(s));
 assert.deepEqual(loaded.seas,s.seas);assert.equal(loaded.ships[0].location,edge);
 });
