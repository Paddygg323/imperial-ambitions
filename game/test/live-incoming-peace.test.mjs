import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,beginTurn,resolveTurn,command,saveGame,loadGame} from '../engine.mjs';
import {campaignShippingPlan} from '../campaign-shipping-plan.mjs';
import {recordWarDeclaration} from '../war-history.mjs';
import {atWar} from '../diplomacy.mjs';
import {queueComputerPeaceOffers,issuePeaceOffers} from '../peace-offers.mjs';

function fixture(){
 const s=createGame({transportModel:'ports',preferenceSeed:1500});
 for(const id of Object.keys(s.nations))s.nations[id]=campaignShippingPlan(s,id).nation;
 s.wars=[['france','england']];recordWarDeclaration(s,'france','england');
 s.turn=6;s.year=1512;s.nations.france.warSupport=Math.fround(.0001);return s;
}
test('live AI peace pauses before market and production, survives reload, then resumes once after acceptance',()=>{
 const input=fixture(),before=JSON.stringify(input);let s=beginTurn(input);
 assert.equal(JSON.stringify(input),before);assert.equal(s.market,undefined);assert.equal(s.turn,6);
 assert.deepEqual(s.incomingPeace,[{proposer:'france',target:'england',turn:6}]);
 assert.ok(s.pendingDiplomacy);assert.ok(atWar(s,'france','england'));
 const snapshot=JSON.stringify(s);s=beginTurn(loadGame(saveGame(s)));assert.equal(JSON.stringify(s),snapshot);
 assert.throws(()=>resolveTurn(s),/pending peace/);
 assert.throws(()=>command(s,'england',{type:'offerPeace',target:'france'}),/pending peace/);
 s=command(s,'england',{type:'respondPeace',proposer:'france',accept:true});
 assert.equal(atWar(s,'france','england'),false);assert.equal(s.pendingDiplomacy.reports.filter(r=>r.peace).length,2);
 s=beginTurn(loadGame(saveGame(s)));assert.ok(s.market);assert.equal(s.pendingDiplomacy,undefined);
 assert.equal(s.market.diplomacy.filter(r=>r.peace).length,2);
 const market=JSON.stringify(s);assert.equal(JSON.stringify(beginTurn(loadGame(saveGame(s)))),market);
});
test('rejecting a live offer retains war without regenerating the same offer on resume',()=>{
 let s=beginTurn(fixture());s=command(s,'england',{type:'respondPeace',proposer:'france',accept:false});
 s=beginTurn(loadGame(saveGame(s)));assert.ok(s.market);assert.ok(atWar(s,'france','england'));
 assert.deepEqual(s.incomingPeace,[]);assert.equal(s.market.diplomacy.filter(r=>r.peaceRejected).length,2);
});
test('AI-to-AI offers settle without human acceptance and legacy dates are not invented',()=>{
 const s=fixture();s.wars=[['france','spain']];s.warDates={};recordWarDeclaration(s,'france','spain');s.turn=7;s.year=1514;
 s.nations.spain.warSupport=Math.fround(.0001);queueComputerPeaceOffers(s);
 assert.ok(s.peaceOffers.some(o=>o.nation==='france'&&o.target==='spain'));
 const reports=issuePeaceOffers(s);assert.equal(atWar(s,'france','spain'),false);assert.equal(s.incomingPeace,undefined);assert.ok(reports.some(r=>r.peace));
 const legacy=fixture();delete legacy.warDates;queueComputerPeaceOffers(legacy);assert.equal(legacy.peaceOffers,undefined);assert.equal(legacy.warDates,undefined);
});
test('invalid saved diplomacy boundaries cannot overlap market or combat',()=>{
 const s=fixture();
 for(const pending of [null,{turn:5,reports:[]},{turn:6,reports:null}]){s.pendingDiplomacy=pending;assert.throws(()=>saveGame(s),/pending diplomacy/);}
 s.pendingDiplomacy={turn:6,reports:[]};s.market={};assert.throws(()=>saveGame(s),/pending diplomacy/);
 delete s.market;s.turnPhase='combat';assert.throws(()=>saveGame(s),/pending diplomacy/);
});
