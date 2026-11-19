import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createGame,command,saveGame,loadGame,beginTurn} from '../engine.mjs';
import {issueGrants,issuePacts,renewGrants,hasPact,grantEligibility,pactEligibility} from '../diplomatic-aid.mjs';
import {issueDeclarations} from '../diplomacy.mjs';
import {tradeRelation} from '../trade-relations.mjs';
import {diplomaticChoice} from '../diplomacy-screen.mjs';
import {powerRankings,RANKING_METRICS} from '../power-rankings.mjs';
const setup=()=>{const s=createGame();s.nations.england.cash=100000;s.nations.england.embassies=['italy'];s.nations.england.consulates=['italy'];return s;};
test('native-backed grant amounts and pact gains, with clamping',async()=>{
 const audit=JSON.parse(await readFile(new URL('../../outputs/Native-diplomacy244-reference.json',import.meta.url)));
 for(const row of audit.grants){let s=setup();s.relations.england.italy=s.relations.italy.england=row.prior;const before=s.minors.italy.cash??0;
  s=command(s,'england',{type:'diplomaticGrant',target:'italy',amount:row.amount});assert.equal(s.nations.england.cash,100000-row.amount);issueGrants(s);
  assert.equal(tradeRelation(s,'england','italy'),row.relationship);assert.equal(s.minors.italy.cash,before+row.cashDelivered);assert.equal(s.diplomaticGrants.length,0);assert.equal(saveGame(loadGame(saveGame(s))),saveGame(s));
 }
 for(const row of audit.pacts){let s=setup();s.relations.england.italy=s.relations.italy.england=row.prior;s=command(s,'england',{type:'offerPact',target:'italy'});issuePacts(s);assert.equal(tradeRelation(s,'england','italy'),row.afterPact);assert.ok(hasPact(s,'england','italy'));s=command(s,'england',{type:'declareWar',target:'italy'});issueDeclarations(s);assert.equal(tradeRelation(s,'england','italy'),row.afterDeclaration);assert.equal(hasPact(s,'england','italy'),false);}
});
test('cancel, replace, reload and repeat grants do not duplicate cash or relations',()=>{
 let s=setup(),before=tradeRelation(s,'england','italy');s=command(s,'england',{type:'diplomaticGrant',target:'italy',amount:1000,repeat:true});
 s=loadGame(saveGame(s));s=command(s,'england',{type:'diplomaticGrant',target:'italy',amount:3000});assert.equal(s.nations.england.cash,97000);
 s=command(s,'england',{type:'diplomaticGrant',target:'italy',cancel:true});assert.equal(s.nations.england.cash,100000);assert.equal(tradeRelation(s,'england','italy'),before);
 s=command(s,'england',{type:'diplomaticGrant',target:'italy',amount:1000,repeat:true});issueGrants(s);const received=s.minors.italy.cash;issueGrants(s);assert.equal(s.minors.italy.cash,received);
 renewGrants(s);renewGrants(s);assert.equal(s.nations.england.cash,98000);s=command(loadGame(saveGame(s)),'england',{type:'diplomaticGrant',target:'italy',cancel:true});assert.equal(s.nations.england.cash,99000);
});
test('eligibility, insufficient funds, war refund and pending pact rescind',()=>{
 let s=setup();assert.match(grantEligibility(s,'england','switzerland'),/embassy/);assert.match(pactEligibility(s,'england','france'),/minor/);
 assert.throws(()=>command(s,'england',{type:'diplomaticGrant',target:'italy',amount:500}),/listed/);
 s.nations.england.cash=0;s.nations.england.finance.credit=0;assert.throws(()=>command(s,'england',{type:'diplomaticGrant',target:'italy',amount:1000}),/money/);
 s=setup();s=command(s,'england',{type:'diplomaticGrant',target:'italy',amount:1000});s=command(s,'england',{type:'declareWar',target:'italy'});issueDeclarations(s);issueGrants(s);assert.equal(s.nations.england.cash,100000);assert.equal(s.diplomaticGrants.length,0);
 s=setup();s=command(s,'england',{type:'offerPact',target:'italy'});assert.throws(()=>command(s,'england',{type:'offerPact',target:'italy'}),/pending/);s=command(loadGame(saveGame(s)),'england',{type:'offerPact',target:'italy',cancel:true});issuePacts(s);assert.equal(hasPact(s,'england','italy'),false);
});
test('recurring grants stop without overdrawing and old saves stay unchanged',()=>{
 const s=setup(),bytes=saveGame(s);assert.equal(saveGame(loadGame(bytes)),bytes);
 let next=command(s,'england',{type:'diplomaticGrant',target:'italy',amount:1000,repeat:true});issueGrants(next);next.nations.england.cash=0;next.nations.england.finance.credit=0;renewGrants(next);assert.equal(next.diplomaticGrants.length,0);assert.equal(next.nations.england.cash,0);
});
test('pending office refund and full diplomatic phase settle aid exactly once',()=>{
 let s=setup();s=command(s,'england',{type:'diplomaticOffice',target:'switzerland',office:'consulate'});assert.equal(s.nations.england.cash,99500);s=command(s,'england',{type:'cancelDiplomaticOffice',target:'switzerland'});assert.equal(s.nations.england.cash,100000);
 s=command(s,'england',{type:'offerPact',target:'italy'});s=command(s,'england',{type:'diplomaticGrant',target:'italy',amount:1000});const r=tradeRelation(s,'england','italy');
 s=beginTurn(s);assert.ok(s.market);assert.equal(tradeRelation(s,'england','italy'),Math.min(255,r+12));const saved=saveGame(s);assert.equal(saveGame(beginTurn(loadGame(saved))),saved);
});
test('new save fields reject malformed policies and rankings never display raw scores',()=>{
 const s=setup();s.diplomaticGrants=[{nation:'england',target:'italy',amount:1234,repeat:false,reserved:true}];assert.throws(()=>saveGame(s),/diplomatic aid/);delete s.diplomaticGrants;
 s.pacts=[['england','france']];assert.throws(()=>saveGame(s),/diplomatic aid/);delete s.pacts;
 assert.equal(RANKING_METRICS.length,8);const html=powerRankings(s);assert.equal((html.match(/class="ranking-chart"/g)??[]).length,8);assert.doesNotMatch(html,/aria-valuenow|15<|50<|fielded military rating/);
 const before=saveGame(s);assert.ok(diplomaticChoice(s,'italy',{mode:'treaties',action:'pact'}).command);powerRankings(s);assert.equal(saveGame(s),before);
});
