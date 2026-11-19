import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,command,saveGame,loadGame} from '../engine.mjs';
import {queueIncomingPeace} from '../incoming-peace.mjs';
import {atWar} from '../diplomacy.mjs';
function fixture(){const s=createGame({transportModel:'ports'});s.wars=[['france','england']];return s;}
test('incoming offer persists without changing the war and explicit rejection does not change orders',()=>{
 let s=fixture();const n=structuredClone(s.nations),armies=structuredClone(s.armies);
 assert.equal(queueIncomingPeace(s,'france'),true);assert.equal(queueIncomingPeace(s,'france'),false);
 assert.deepEqual(s.nations,n);assert.deepEqual(s.armies,armies);s=loadGame(saveGame(s));
 assert.ok(atWar(s,'france','england'));const out=command(s,'england',{type:'respondPeace',proposer:'france',accept:false});
 assert.ok(atWar(out,'france','england'));assert.deepEqual(out.incomingPeace,[]);assert.deepEqual(out.armies,armies);
 assert.equal(s.incomingPeace.length,1);assert.equal(out.reports.filter(r=>r.peaceRejected).length,2);
 assert.throws(()=>command(out,'england',{type:'respondPeace',proposer:'france',accept:true}),/No pending/);
});
test('only an explicit human acceptance can end the war and break threatened human alliances',()=>{
 let s=fixture();s.wars.push(['france','portugal']);s.alliances=[['england','portugal']];queueIncomingPeace(s,'france');
 assert.throws(()=>command(s,'england',{type:'respondPeace',proposer:'france',accept:'true'}),/Explicit/);
 assert.throws(()=>command(s,'spain',{type:'respondPeace',proposer:'france',accept:true}),/Explicit/);
 s=command(loadGame(saveGame(s)),'england',{type:'respondPeace',proposer:'france',accept:true});
 assert.equal(atWar(s,'england','france'),false);assert.ok(atWar(s,'portugal','france'));assert.deepEqual(s.alliances,[]);
 assert.deepEqual(loadGame(saveGame(s)).incomingPeace,[]);assert.equal(s.reports.filter(r=>r.peace).length,2);
});
test('expired offers can be dismissed without replaying settlement; malformed saved offers are rejected',()=>{
 const s=fixture();queueIncomingPeace(s,'france');s.wars=[];
 const out=command(s,'england',{type:'respondPeace',proposer:'france',accept:true});assert.deepEqual(out.incomingPeace,[]);assert.ok(out.reports.at(-1).peaceExpired);
 for(const value of [[{proposer:'missing',target:'england',turn:0}],[{proposer:'france',target:'spain',turn:0}],[{proposer:'france',target:'england',turn:1}],null]){
  const bad=fixture();bad.incomingPeace=value;assert.throws(()=>saveGame(bad),/incoming peace/);
 }
});
