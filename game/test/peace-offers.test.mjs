import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,command,saveGame,loadGame,beginTurn} from '../engine.mjs';
import {atWar} from '../diplomacy.mjs';
test('player Great Power offer persists, can be cancelled, and settles once at end turn',()=>{
 let s=createGame({transportModel:'ports'});s.wars=[['england','france']];s.nations.france.warSupport=Math.fround(.0001);
 const original=JSON.stringify(s);s=command(s,'england',{type:'offerPeace',target:'france'});
 assert.ok(atWar(s,'england','france'));assert.equal(JSON.parse(original).peaceOffers,undefined);
 const cancelled=command(s,'england',{type:'offerPeace',target:'france',cancel:true});assert.deepEqual(cancelled.peaceOffers,[]);assert.ok(atWar(cancelled,'england','france'));
 s=loadGame(saveGame(s));assert.deepEqual(s.peaceOffers,[{nation:'england',target:'france'}]);
 s=beginTurn(s);assert.equal(atWar(s,'england','france'),false);assert.deepEqual(s.peaceOffers,[]);
 assert.equal(s.market.diplomacy.filter(r=>r.peace&&r.target==='france').length,2);
 const again=beginTurn(loadGame(saveGame(s)));assert.deepEqual(again.market.diplomacy,s.market.diplomacy);
});
test('a rejected public offer reports refusal and retains the war after reload',()=>{
 let s=createGame({transportModel:'ports'});s.wars=[['england','france']];s.nations.france.warSupport=1;
 s.armies=s.armies.filter(u=>u.owner!=='england');s.ships=s.ships.filter(u=>u.owner!=='england');
 for(const good of Object.keys(s.nations.england.stock))s.nations.england.stock[good]=0;
 s=command(s,'england',{type:'offerPeace',target:'france'});s=beginTurn(loadGame(saveGame(s)));
 assert.ok(atWar(s,'england','france'));assert.equal(s.market.diplomacy.filter(r=>r.peaceRejected).length,2);assert.deepEqual(s.peaceOffers,[]);
});
test('Great Power offers reject unknown saved planning and never auto-accept for the human',()=>{
 const s=createGame({transportModel:'ports'});s.wars=[['england','france']];delete s.nations.england.interiorPlanning;
 assert.throws(()=>command(s,'england',{type:'offerPeace',target:'france'}),/Interior planning/);
 assert.throws(()=>command(s,'france',{type:'offerPeace',target:'england'}),/Human peace response/);
 assert.equal(s.peaceOffers,undefined);
});
