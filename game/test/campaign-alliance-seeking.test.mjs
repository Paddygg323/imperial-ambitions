import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,beginTurn,command,loadGame,saveGame} from '../engine.mjs';
import {computerAlliancePlans} from '../campaign-alliance-seeking.mjs';
test('seeking adapter respects human cadence, conflict filtering and never plans for player',()=>{
 const s=createGame({transportModel:'ports',preferenceSeed:123});
 const strengths=Object.fromEntries(Object.keys(s.nations).map(id=>[id,{border:id==='england'?100:1,nonborder:id==='england'?100:1}]));
 s.relations.france.england=255;
 const before=saveGame(s),plans=computerAlliancePlans(s,{strengths});
 assert.ok(plans.some(p=>p.nation==='france'&&p.target==='england'));assert.ok(plans.every(p=>p.nation!=='england'));assert.equal(saveGame(s),before);
 s.turn=1;assert.ok(!computerAlliancePlans(s,{strengths}).some(p=>p.nation==='france'));
 s.turn=0;s.wars=[['england','spain']];assert.ok(!computerAlliancePlans(s,{strengths}).some(p=>p.nation==='france'&&p.target==='england'));
});
test('actual military forecast causes a saved human offer once, with explicit rejection',()=>{
 let s=createGame({transportModel:'ports',preferenceSeed:123});
 // Purpose-built military imbalance, not evidence of campaign play or recruitment.
 const template=s.armies.find(a=>a.owner==='england');
 s.armies=s.armies.filter(a=>a.owner!=='france');
 for(let i=0;i<24;i++)s.armies.push({...template,id:`seek-test-${i}`,type:'regular',hp:100});
 s.relations.france.england=255;
 const cash=s.nations.england.cash,stock=structuredClone(s.nations.england.stock);
 s=beginTurn(s);assert.ok(s.incomingAlliances.some(o=>o.proposer==='france'));assert.equal(s.market,undefined);
 const paused=saveGame(s);assert.equal(saveGame(beginTurn(loadGame(paused))),paused);
 assert.equal(s.nations.england.cash,cash);assert.deepEqual(s.nations.england.stock,stock);
 for(const offer of [...s.incomingAlliances])s=command(s,'england',{type:'respondAlliance',proposer:offer.proposer,accept:false});
 assert.throws(()=>command(s,'england',{type:'respondAlliance',proposer:'france',accept:false}),/No pending/);
 s=beginTurn(loadGame(saveGame(s)));assert.ok(s.market);assert.equal(s.incomingAlliances.length,0);
 assert.equal(s.market.diplomacy.filter(r=>r.nation==='england'&&r.proposer==='france'&&r.allianceRejected).length,1);
});
