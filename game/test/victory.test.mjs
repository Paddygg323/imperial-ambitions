import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,beginTurn,resolveTurn,saveGame,loadGame,command} from '../engine.mjs';
import {victoryTotals,checkCampaignVictory} from '../victory.mjs';
function control(s,count,owner='england'){
 const old=s.provinces.filter(p=>p.old);for(const [i,p] of old.entries())p.owner=i<count?owner:'minorFixture';
 for(const t of s.tiles)t.owner=s.provinces.find(p=>p.id===t.province)?.owner??t.owner;
}
test('historical Europe needs 42 of 83; overseas holdings and anarchy do not count',()=>{
 const s=createGame();control(s,41);for(const p of s.provinces.filter(p=>!p.old))p.owner='england';
 assert.equal(victoryTotals(s).total,83);assert.equal(victoryTotals(s).required,42);assert.equal(victoryTotals(s).counts.england,41);
 assert.equal(checkCampaignVictory(s),null);control(s,42);s.provinces.find(p=>p.old&&p.owner==='england').anarchy=true;
 assert.equal(checkCampaignVictory(s),null);
});
test('victory is checked at end turn before trade, AI spending or production, and persists',()=>{
 let s=createGame();control(s,42);assert.equal(s.outcome,undefined);
 const before=structuredClone(s);s=beginTurn(s);
 assert.equal(s.outcome.status,'victory');assert.equal(s.winner,'england');assert.equal(s.market,undefined);
 assert.equal(s.turn,0);assert.equal(s.year,1500);assert.deepEqual(s.nations,before.nations);
 assert.equal(before.outcome,undefined);assert.equal(s.outcome.controlled,42);
 const restored=loadGame(saveGame(s));assert.deepEqual(restored.outcome,s.outcome);
 assert.throws(()=>beginTurn(restored),/Campaign has ended/);
 assert.throws(()=>command(restored,'england',{type:'recruitWorker',quantity:1}),/cannot issue/);
 const count=s.reports.length;checkCampaignVictory(s);assert.equal(s.reports.length,count);
});
test('rival majority is player defeat; direct turn resolution uses the same victory check',()=>{
 const s=createGame();control(s,42,'france');const done=resolveTurn(s);
 assert.equal(done.outcome.status,'defeat');assert.equal(done.outcome.reason,'oldWorldMajority');assert.equal(done.winner,'france');assert.equal(done.market,undefined);
});
test('dead nations cannot win and capital-loss defeat is never overwritten',()=>{
 const s=createGame();control(s,60,'france');s.nations.france.alive=false;assert.equal(checkCampaignVictory(s),null);
 s.outcome={status:'defeat',reason:'capitalLost'};control(s,60);assert.equal(checkCampaignVictory(s).reason,'capitalLost');assert.equal(s.winner,null);
});
