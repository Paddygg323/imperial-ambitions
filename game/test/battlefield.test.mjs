import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {tacticalNeighbours,tacticalDistance,deploymentTiles} from '../battlefield.mjs';
test('all 464 tactical hexes match native neighbour order and boundary exclusions',()=>{
 const ref=JSON.parse(fs.readFileSync(new URL('./native-tactical-grid.json',import.meta.url)));
 ref.neighbours.forEach((expected,tile)=>assert.deepEqual(tacticalNeighbours(tile),expected,String(tile)));
});
test('tactical routes never wrap across a map edge and distance is symmetric',()=>{
 assert.ok(tacticalDistance(28,29)>20);
 for(const from of [0,28,29,232,463])for(const to of [0,15,116,462])assert.equal(tacticalDistance(from,to),tacticalDistance(to,from));
});
test('deployment respects side, occupied cells, impassable terrain and first row',()=>{
 const b={cells:Array.from({length:464},()=>({terrain:0,unit:null}))};
 b.cells[32].terrain=4;b.cells[33].unit='regiment';
 const attack=deploymentTiles(b,0),defend=deploymentTiles(b,1);
 assert.ok(attack.includes(34));assert.ok(!attack.includes(32));assert.ok(!attack.includes(33));assert.ok(!attack.includes(4));
 assert.ok(attack.every(t=>t%29>=3&&t%29<=5));assert.ok(defend.every(t=>t%29>=12&&t%29<=14));
 assert.equal(attack.some(t=>defend.includes(t)),false);
});

test('retreat maps lead to each sides exit and cannot cross an occupied barrier',async()=>{
 const {retreatDistances}=await import('../battlefield.mjs');
 const b={width:29,height:16,activeWidth:29,cells:Array.from({length:464},()=>({terrain:0,unit:null}))};
 assert.equal(retreatDistances(b,0).get(29*8),0);
 assert.equal(retreatDistances(b,1).get(29*8+28),0);
 assert.ok(retreatDistances(b,0).get(29*8+5)<retreatDistances(b,0).get(29*8+20));
 for(let y=0;y<16;y++)b.cells[y*29+10].unit='block'+y;
 const left=retreatDistances(b,0),right=retreatDistances(b,1);
 assert.equal(left.has(29*8+20),false);assert.equal(right.has(29*8+5),false);
 b.cells[29*8+10].unit=null;
 assert.ok(retreatDistances(b,0).has(29*8+20));
 b.cells[29*8+10].terrain=4;
 assert.equal(retreatDistances(b,0).has(29*8+20),false);
});
