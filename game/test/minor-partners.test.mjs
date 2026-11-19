import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,saveGame,loadGame} from '../engine.mjs';
import {campaignFavouredPartner} from '../campaign-external-resources.mjs';
import {recordTradeRelation,recordWarRelations,tradeRelation} from '../trade-relations.mjs';
test('minor preferences follow offices and subsidies independently and survive reload',()=>{
 const s=createGame({transportModel:'ports',preferenceSeed:123});
 assert.equal(campaignFavouredPartner(s,'ireland'),null);
 s.nations.england.consulates=['ireland'];s.nations.england.tradePolicies={ireland:75};
 assert.equal(campaignFavouredPartner(s,'ireland'),'england');assert.equal(campaignFavouredPartner(s,'denmark'),null);
 assert.equal(campaignFavouredPartner(loadGame(saveGame(s)),'ireland'),'england');
 s.nations.france.consulates=['ireland'];s.nations.france.tradePolicies={ireland:50};
 assert.equal(campaignFavouredPartner(s,'ireland'),'france');
});
test('equal 86 scores after Cherokee aggression remain independent bilateral relations',()=>{
 const s=createGame({preferenceSeed:123});recordWarRelations(s,'england','cherokee');
 assert.equal(tradeRelation(s,'england','ireland'),86);assert.equal(tradeRelation(s,'england','denmark'),86);
 s.nations.england.consulates=['ireland'];recordTradeRelation(s,'england','ireland');
 assert.equal(tradeRelation(s,'england','ireland'),87);assert.equal(tradeRelation(s,'ireland','england'),87);assert.equal(tradeRelation(s,'england','denmark'),86);
});
