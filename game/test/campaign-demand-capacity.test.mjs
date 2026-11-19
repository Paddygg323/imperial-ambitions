import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,saveGame,loadGame} from '../engine.mjs';
import {campaignDemandCapacity} from '../campaign-demand-capacity.mjs';
test('demand capacity combines minor supply, transport and saved city needs without granting labour or goods',()=>{
 let s=createGame();const n=s.nations.england,minor=Object.values(s.minors)[0];
 for(const nation of Object.values(s.nations)){nation.consulates=[];nation.embassies=[];s.relations[minor.id][nation.id]=90;}
 n.consulates=[minor.id];s.relations[minor.id].england=150;
 const tile=s.tiles.find(t=>s.provinces.find(p=>p.id===t.province)?.owner===minor.id&&t.resource);
 tile.resource='sugarCane';tile.level=4;tile.road=false;
 n.workers=['peasant','apprentice','apprentice','journeyman','master'].map((type,i)=>({id:`capacity${i}`,type,fit:false}));
 n.cityForecast.needs[12]=9;n.cityForecast.deductions[12]=2;
 const before=structuredClone(s),result=campaignDemandCapacity(s,'england',{seed:123});
 assert.ok(result.input.extraCrop[0]>=4);assert.equal(result.capacity,23);
 assert.deepEqual(result.input.cityLuxuryValues,[2,1,1]);assert.equal(result.needs[12],7);
 before.nations.england.cityForecast=structuredClone(n.cityForecast);assert.deepEqual(s,before,'only city needs cache changes');
 s=loadGame(saveGame(s));const next=campaignDemandCapacity(s,'england',{seed:123});
 assert.equal(next.needs[12],5);assert.equal(next.capacity,23);
});
test('missing original preference seed fails before changing city state',()=>{
 const s=createGame();delete s.preferenceSeed;const before=JSON.stringify(s);
 assert.throws(()=>campaignDemandCapacity(s,'england'),/seed/);assert.equal(JSON.stringify(s),before);
});
