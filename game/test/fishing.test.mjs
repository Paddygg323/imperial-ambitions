import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fishSources} from '../fishing.mjs';
import {riverNeighbor} from '../river-routes.mjs';
test('fish sources match16native network captures including roads and foreign rivers',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-fish-network-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,16);
 for(const c of audit.cases){
  const root={id:'10,10',x:10,y:10,owner:0,river:c.ownRiver},ix=new Map([[root.id,root]]);
  for(let d=0;d<6;d++){const n=c.nodes[d+1],id=riverNeighbor(root,d);if(!n.water){const [x,y]=id.split(',').map(Number);ix.set(id,{id,x,y,owner:n.owner??0,river:n.river??false});}}
  assert.equal(fishSources(root,ix).length,c.fish,`${c.road} ${c.ownRiver} ${c.kind}`);
 }
});
test('map edges cannot supply fish from nonexistent water tiles',()=>{
 const root={id:'0,0',x:0,y:0,owner:'england',river:false};
 const ix=new Map([[root.id,root],['1,0',{owner:'england'}],['0,1',{owner:'england'}]]);
 assert.deepEqual(fishSources(root,ix),[]);
 ix.delete('1,0');assert.deepEqual(fishSources(root,ix),['1,0']);
});
