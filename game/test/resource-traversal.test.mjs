import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {traceResourceNetworks} from '../resource-traversal.mjs';
test('full resource traversal matches400 native cyclic, bottleneck, foreign-owner and multi-root cases',()=>{
 const data=JSON.parse(readFileSync(new URL('../../outputs/Native-resource-traversal-audit.json',import.meta.url)));
 assert.equal(data.cases.length,400);
 for(const [index,c] of data.cases.entries()){
  const {contributions,...actual}=traceResourceNetworks(c.nodes,c.roots,c.provinces);
  assert.deepEqual(actual,{totals:c.totals,used:c.used,capacity:c.capacity},`native case ${index}`);
  const credited=c.roots.map(()=>Array(28).fill(0));
  for(const r of contributions){assert.equal(r.root,c.roots[r.network]);credited[r.network][r.good]+=r.quantity;}
  assert.deepEqual(credited,c.totals,`provenance conservation case ${index}`);
 }
});
test('long road chains do not depend on the JavaScript call-stack limit',()=>{
 const nodes=Array.from({length:10000},(_,i)=>({owner:0,good:20,development:1,neighbors:[i<9999?i+1:-1,-1,-1,i?i-1:-1,-1,-1],edges:[i<9999?1:0,0,0,i?1:0,0,0]}));
 const result=traceResourceNetworks(nodes,[0]);assert.equal(result.totals[0][20],10000);assert.equal(result.used.reduce((a,b)=>a+b,0),10000);
});

test('root fishing includes shared coastal water in each native port record',()=>{
 const data=JSON.parse(readFileSync(new URL('../../outputs/Native-resource-traversal-audit.json',import.meta.url))),c=data.cases[201];
 assert.deepEqual(c.roots,[0,4]);assert.equal(c.nodes[3].land,false);
 assert.ok(c.nodes[0].neighbors.includes(3)&&c.nodes[4].neighbors.includes(3));
 const result=traceResourceNetworks(c.nodes,c.roots,c.provinces);
 assert.deepEqual(result.totals.map(g=>g[21]),[5,4]);
});
