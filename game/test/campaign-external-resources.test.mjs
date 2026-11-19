import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,saveGame,loadGame} from '../engine.mjs';
import {campaignExternalResources} from '../campaign-external-resources.mjs';
import {NATIVE_GOODS} from '../resource-categories.mjs';
test('campaign external forecast follows offices, policy, ownership and development without deliveries',()=>{
 const s=createGame(),minor=Object.values(s.minors)[0],tile=s.tiles.find(t=>s.provinces.find(p=>p.id===t.province)?.owner===minor.id&&t.resource);
 assert.ok(tile);tile.level=3;tile.road=false;
 for(const n of Object.values(s.nations)){n.consulates=[];n.embassies=[];(s.relations[minor.id]??={})[n.id]=90;}
 assert.ok(campaignExternalResources(s,'england',{seed:123}).resources.every(v=>v===0));
 s.nations.england.consulates=[minor.id];s.relations[minor.id].england=150;
 const good=NATIVE_GOODS.indexOf(tile.resource),before=JSON.stringify(s);
 const result=campaignExternalResources(s,'england',{seed:123});assert.ok(result.resources[good]>=3);assert.equal(JSON.stringify(s),before);
 assert.deepEqual(campaignExternalResources(loadGame(saveGame(s)),'england',{seed:123}),result);
 s.nations.england.tradePolicies={[minor.id]:300};assert.ok(campaignExternalResources(s,'england',{seed:123}).resources.every(v=>v===0));
 s.nations.england.tradePolicies[minor.id]=100;
 for(const p of s.provinces)if(p.owner===minor.id)p.owner='england';
 assert.ok(campaignExternalResources(s,'england',{seed:123}).resources.every(v=>v===0));
 delete s.preferenceSeed;assert.throws(()=>campaignExternalResources(s,'england'),/seed/);
});
