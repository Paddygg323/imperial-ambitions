import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {civilianIdling,civilianIdlingForPreset,campaignCivilianIdling} from '../civilian-idling.mjs';
import {createGame,saveGame,loadGame} from '../engine.mjs';
test('70 original civilian-idling gates and five preset initializations',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-civilian-idling-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,70);
 for(const c of audit.cases)assert.equal(civilianIdling(c),c.idle,JSON.stringify(c));
 assert.deepEqual([0,1,2,3,4].map(civilianIdlingForPreset),audit.presets);
});
test('campaign gate counts unfit skilled workers, excludes military and reads saved workforce',()=>{
 let s=createGame();s.turn=3;s.nations.france.workers=[{...s.nations.france.workers[0],type:'journeyman',fit:false}];
 s=loadGame(saveGame(s));const before=JSON.stringify(s);
 assert.equal(campaignCivilianIdling(s,'france',{enabled:true}),true);
 assert.equal(campaignCivilianIdling(s,'france',{enabled:false}),false);
 assert.equal(JSON.stringify(s),before);
 s.nations.france.workers[0].type='peasant';assert.equal(campaignCivilianIdling(s,'france',{enabled:true}),false);
 s.turn=5;assert.equal(campaignCivilianIdling(s,'france',{enabled:true}),true);
 assert.throws(()=>campaignCivilianIdling(s,'france'),/setting/);
 assert.throws(()=>campaignCivilianIdling(s,'england',{enabled:true}),/AI nation/);
});
