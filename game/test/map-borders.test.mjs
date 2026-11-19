import test from 'node:test';
import assert from 'node:assert/strict';
import {provinceBorderEdges} from '../map-borders.mjs';

const land=(x,y,province,owner='england')=>({id:`${x},${y}`,x,y,province,owner});
const edges=(tiles,seen=tiles.map(t=>t.id))=>provinceBorderEdges(tiles,new Map(tiles.map(t=>[t.id,t])),new Set(seen));

test('province boundaries separate provinces, not resource tiles, and shared edges occur once',()=>{
 const tiles=[land(10,10,1),land(11,10,1),land(12,10,2)];
 const boundary=edges(tiles);
 assert.equal(boundary.length,1);
 assert.deepEqual(new Set([boundary[0].tile.id,boundary[0].other.id]),new Set(['11,10','12,10']));
 assert.equal(boundary[0].national,false);
});

test('province drawing never exposes hidden land or duplicates a coastline',()=>{
 const tiles=[land(10,10,1),land(11,10,2)];
 assert.deepEqual(edges(tiles,['10,10']),[]);
 assert.deepEqual(edges([tiles[0]]),[]);
 assert.deepEqual(edges(tiles,[]),[]);
 assert.equal(edges(tiles).length,1);
});

test('border colours follow current ownership after conquest without changing game data',()=>{
 const tiles=[land(10,10,1),land(11,10,2,'portugal')],original=structuredClone(tiles);
 assert.equal(edges(tiles)[0].national,true);
 assert.deepEqual(tiles,original);
 const conquered=tiles.map(t=>({...t,owner:'england'}));
 assert.equal(edges(conquered)[0].national,false);
 assert.equal(edges(conquered).length,1);
});
