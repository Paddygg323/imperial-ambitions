import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {townProduction,provinceResources} from '../town-production.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-town-production-audit.json',import.meta.url)));
test('town production matches34 original executions including pooled fibre and iron priority',()=>{
 assert.equal(audit.cases.length,34);
 for(const c of audit.cases)assert.deepEqual(townProduction(c.resources,c),c.output);
});
test('province bonuses do not pool separate towns or consume their raw resources',()=>{
 const a={timber:3},b={timber:3};assert.equal(townProduction(a).lumber,0);assert.equal(townProduction(b).lumber,0);
 const province={timber:8,iron:12,coal:4,wool:3,cotton:1};const before=structuredClone(province);
 const result=townProduction(province,{steel:true});assert.equal(result.lumber,2);assert.equal(result.paper,0);assert.equal(result.fabric,1);assert.equal(result.steel,2);assert.equal(result.castIron,2);assert.deepEqual(province,before);
});

test('province totals match native resource levels independently of transport and ownership',()=>{
 const reference=JSON.parse(readFileSync(new URL('../../outputs/Native-province-resources-audit.json',import.meta.url)));
 const names=['wool','timber','tin','copper','iron','coal','cotton','sugarCane','tobacco','furs'];
 assert.equal(reference.cases.length,6);
 for(const c of reference.cases){
  const tiles=c.tiles.map(t=>({...t,resource:names[t.resource]??null,province:'a'}));
  tiles.push({province:'b',resource:'timber',level:4});
  const totals=provinceResources(tiles,'a');
  names.forEach((g,i)=>assert.equal(totals[g],c.totals[i],`${c.mode} ${g}`));
 }
});
test('town bonus counts disconnected developments but only connected output is delivered',async()=>{
 const {createGame}=await import('../engine.mjs');const {transport}=await import('../economy.mjs');
 const s=createGame();s.transportLinks={};s.nations.england.capital='10,10';
 const tile=(x,y,province,resource=null,level=0)=>({id:`${x},${y}`,x,y,province,owner:'england',terrain:1,resource,level,prospected:true,port:false});
 s.tiles=[tile(10,10,'capital'),{...tile(11,10,'town'),townLevel:1},tile(20,20,'town','timber',4),tile(21,20,'other','timber',3)];
 s.provinces=[{id:'capital',old:true},{id:'town',old:true},{id:'other',old:true}];
 let result=transport(s,'england');assert.equal(result.incoming.timber,0);assert.equal(result.incoming.lumber,1);
 const town=s.tiles[1];Object.assign(town,{id:'30,30',x:30,y:30});
 result=transport(s,'england');assert.equal(result.incoming.lumber,0);
 const bonus=result.rows.find(r=>r.good==='lumber');assert.equal(bonus.produced,1);assert.equal(bonus.delivered,0);assert.equal(bonus.reason,'No connection');
});
