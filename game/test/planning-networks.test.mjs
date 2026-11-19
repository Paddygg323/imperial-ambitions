import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {planningNetworks} from '../planning-networks.mjs';import {planningDistanceMaps} from '../planning-distance.mjs';
const audit=JSON.parse(fs.readFileSync(new URL('../../outputs/Native-planning-networks-audit.json',import.meta.url)));
test('network membership, capital lookup and province requests match80 original full scans',()=>{
 assert.equal(audit.cases.length,80);for(const c of audit.cases)assert.deepEqual(planningNetworks(c.nodes),c.result);
});
test('connected zero-capacity tile belongs to a network, isolated roads do not seed distances',()=>{
 const nodes=[
 {owner:0,province:0,flags:1,capacity:4,roadMask:1,neighbors:[1,-1,-1,-1,-1,-1]},
 {owner:0,province:0,flags:0,capacity:0,roadMask:0,neighbors:[2,-1,-1,0,-1,-1]},
 {owner:1,province:1,flags:0,capacity:0,roadMask:1,neighbors:[3,-1,-1,1,-1,-1]},
 {owner:1,province:1,flags:0,capacity:0,roadMask:8,neighbors:[-1,-1,-1,2,-1,-1]}];
 const result=planningNetworks(nodes);assert.deepEqual(result.networks,[1,1,0,0]);
 const distances=planningDistanceMaps(nodes.map((n,i)=>({...n,terrain:0,network:result.networks[i],portSite:false})));assert.deepEqual(distances.road,[1,1,0,0]);
});
test('native network IDs stop at254 and long connected roads avoid JavaScript stack overflow',()=>{
 const isolated=Array.from({length:260},()=>({owner:0,province:0,flags:4,capacity:4,roadMask:0,neighbors:Array(6).fill(-1)}));const result=planningNetworks(isolated);assert.equal(result.count,254);assert.deepEqual(result.networks.slice(254),Array(6).fill(0));
 const chain=Array.from({length:6480},(_,i)=>({owner:0,province:0,flags:0,capacity:1,roadMask:1,neighbors:[i<6479?i+1:-1,-1,-1,-1,-1,-1]}));assert.equal(planningNetworks(chain).count,1);
});
