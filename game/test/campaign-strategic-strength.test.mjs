import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {campaignStrategicStrength} from '../campaign-strategic-strength.mjs';
import {createGame} from '../engine.mjs';
const types=['peasant','apprentice','journeyman','master'];
test('campaign material and worker adapter matches all360 native reinforcement captures',()=>{
 for(const kind of ['army','navy']){
  const data=JSON.parse(readFileSync(new URL(`../../outputs/Native-${kind}-reinforcement-audit.json`,import.meta.url)));
  assert.equal(data.fpuControlWord,0x23f);
  for(const c of data.cases){
   const goods=kind==='army'?['fabric','bronze','steel','wool','cotton']:['fabric','lumber','bronze','steel','wool','cotton'];
   const s={nations:{england:{stock:Object.fromEntries(goods.map((g,i)=>[g,c.quantities[i]])),workers:c.workers.flatMap((n,i)=>Array.from({length:n},()=>({type:types[i],fit:false})))}},armies:[],ships:[]};
   assert.equal(campaignStrategicStrength(s,'england',{recruitmentLimit:c.limit})[kind+'Potential'],c.result);
  }
 }
});
test('campaign strength isolates owned units and warehouse stock and requires the missing food estimate',()=>{
 const s=createGame();s.nations.england.stock={fabric:10,bronze:40,steel:100,lumber:100,wool:6,cotton:0};s.nations.england.workers=Array.from({length:6},()=>({type:'peasant',fit:true}));
 s.armies=[{owner:'england',type:'pikeman',hp:1,experience:0}];s.ships=[];
 assert.throws(()=>campaignStrategicStrength(s,'england'),/Verified recruitment limit/);
 const before=campaignStrategicStrength(s,'england',{recruitmentLimit:10});
 assert.equal(before.armyPotential,150);assert.equal(before.navyPotential,250);
 s.armies[0].hp=100;s.armies[0].experience=100;s.armies.push({owner:'france',type:'pikeman'});
 s.nations.england.workers.forEach(w=>w.fit=false);s.nations.england.orders.production={steel:999};
 assert.deepEqual(campaignStrategicStrength(s,'england',{recruitmentLimit:10}),before);
 s.nations.england.stock.steel=0;assert.ok(campaignStrategicStrength(s,'england',{recruitmentLimit:10}).border<before.border);
});
