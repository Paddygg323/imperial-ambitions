import test from 'node:test';import assert from 'node:assert/strict';
import {generateHistoricalWorld} from '../map-historical-world.mjs';import {finalizeOriginalMapPictures} from '../map-picture-finalization.mjs';import {convertOriginalMapToGameplay} from '../map-gameplay-conversion.mjs';import {NATIVE_GOODS} from '../resource-categories.mjs';import europe from '../data/europe.mjs';
test('raw map conversion preserves historical identity, resources, towns and original sea IDs',()=>{
 for(const seed of ['England','Pixel','Timber']){
  const raw=generateHistoricalWorld([...Buffer.from(seed)],{timeSeed:1});raw.seaDecorationTile=-1;finalizeOriginalMapPictures(raw);const before=raw.tiles.slice(),world=convertOriginalMapToGameplay(raw),ix=new Map(world.tiles.map(t=>[t.id,t]));
  assert.deepEqual(raw.tiles,before);assert.equal(world.tiles.length+Object.keys(world.seas.cellZones).length,6480);
  for(const t of europe.tiles){const actual=ix.get(t.id);assert.equal(actual.owner,t.owner);assert.equal(actual.province,t.province);}
  for(const p of europe.provinces){const actual=world.provinces.find(q=>q.id===p.id);assert.equal(actual.name,p.name);assert.equal(actual.town,p.town);assert.equal(actual.capital,p.capital);}
  for(const t of world.tiles){const p=(t.y*108+t.x)*40;assert.equal(t.resource,t.terrain===13?null:NATIVE_GOODS[raw.tiles[p+20]]??null);assert.equal(t.riverCode,raw.tiles[p+2]);}
  for(const z of world.seas.zones){assert.ok(z.cells.length);for(const id of z.cells){const [x,y]=id.split(',').map(Number);assert.equal(z.id,`sea${raw.tiles[(y*108+x)*40+4]-22}`);}for(const other of z.adjacent)assert.ok(world.seas.zones.find(q=>q.id===other).adjacent.includes(z.id));}
  for(const p of world.provinces)assert.equal(ix.get(p.town).province,p.id);
 }
});
