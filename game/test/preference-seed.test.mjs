import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,saveGame,loadGame} from '../engine.mjs';
import {campaignExternalResources} from '../campaign-external-resources.mjs';
test('preference seed is independent of mutable RNG and survives saves',()=>{
 const s=createGame({seed:1500,preferenceSeed:123456});
 const before=campaignExternalResources(s,'england');s.seed=987654;
 assert.deepEqual(campaignExternalResources(s,'england'),before);
 assert.equal(loadGame(saveGame(s)).preferenceSeed,123456);
 const now=Math.floor(Date.now()/1000),fresh=createGame();assert.ok(fresh.preferenceSeed>=now&&fresh.preferenceSeed<=Math.floor(Date.now()/1000));
});
test('legacy seeds remain unknown; invalid seeds are rejected',()=>{
 const s=createGame();delete s.preferenceSeed;const old=loadGame(saveGame(s));
 assert.equal(old.preferenceSeed,undefined);assert.throws(()=>campaignExternalResources(old,'england'),/seed/);
 for(const value of [-1,0x100000000,.5,'123',null]){s.preferenceSeed=value;assert.throws(()=>saveGame(s),/preference seed/);assert.throws(()=>createGame({preferenceSeed:value}),/preference seed/);}
});
