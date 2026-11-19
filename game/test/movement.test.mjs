import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {openFieldPaths} from '../battle.mjs';
import {tacticalMoveAllowance,tacticalMovementPaths} from '../battlefield.mjs';

test('only broken levy gain doubled movement; emplacements stay immobile',()=>{
 assert.equal(tacticalMoveAllowance({type:'levy',state:0}),3);
 assert.equal(tacticalMoveAllowance({type:'levy',state:1}),6);
 assert.equal(tacticalMoveAllowance({type:'caliverman',state:1}),4);
 assert.equal(tacticalMoveAllowance({type:'pikeman',state:1}),3);
 assert.equal(tacticalMoveAllowance({type:'royalArtillery',state:1,emplaced:true}),0);
});

test('terrain movement costs and full-allowance first steps match native maps',()=>{
 const reference=JSON.parse(fs.readFileSync(new URL('./native-terrain-movement-reference.json',import.meta.url)));
 for(const c of reference.cases){
  const u={id:'mover',type:c.type,side:0,state:c.state??0,tile:210,moveLeft:c.remaining/10};
  const b={width:29,height:16,activeWidth:17,cells:Array.from({length:464},(_,tile)=>({terrain:Array.isArray(c.terrain)?c.terrain[tile]:c.terrain,unit:null})),units:[u]};
  b.cells[u.tile].unit=u.id;
  assert.deepEqual(Object.fromEntries(tacticalMovementPaths(b,u).costs),c.costs,JSON.stringify({type:c.type,terrain:c.terrain,remaining:c.remaining}));
 }
});

test('open terrain reachable cells and costs match original occupied-neighbour movement maps',()=>{
 const reference=JSON.parse(fs.readFileSync(new URL('./native-movement-reference.json',import.meta.url)));
 for(const c of reference.cases){
  const units=[{id:'mover',type:'pikeman',side:c.side,state:0,tile:c.start,moveLeft:c.remaining/10},...c.enemies.map((e,i)=>({id:'e'+i,tile:e.tile,side:e.side??1-c.side,state:e.state}))];
  const b={width:29,height:16,activeWidth:17,cells:Array.from({length:464},()=>({terrain:0,unit:null})),units};
  for(const u of units)b.cells[u.tile].unit=u.id;
  const actual=Object.fromEntries([...openFieldPaths(b,'mover')].map(([tile,path])=>[tile,(path.length-1)*10]));
  assert.deepEqual(actual,c.costs,JSON.stringify({side:c.side,enemies:c.enemies}));
 }
});
