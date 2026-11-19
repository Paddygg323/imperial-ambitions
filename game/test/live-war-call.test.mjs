import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,saveGame,loadGame} from '../engine.mjs';import {issueDeclarations,atWar} from '../diplomacy.mjs';
import {advanceWarCalls} from '../war-call-phase.mjs';import {campaignCallToWarDecision} from '../campaign-call-to-war-decision.mjs';
test('live computer ally uses campaign forecasts and resumes its saved call without granting resources',()=>{
 let s=createGame({transportModel:'ports'});s.alliances=[['france','spain']];s.declarations=[{nation:'sweden',target:'france'}];issueDeclarations(s);
 s=loadGame(saveGame(s));const expected=campaignCallToWarDecision(s,'spain','france','sweden',{defensive:true});
 const stores=Object.fromEntries(Object.entries(s.nations).map(([id,n])=>[id,{stock:structuredClone(n.stock),cash:n.cash,workers:structuredClone(n.workers)}]));
 const reports=advanceWarCalls(s);assert.equal(atWar(s,'spain','sweden'),expected.accepted);assert.equal(s.pendingWarCalls.length,0);
 assert.ok(reports.some(r=>r.warCall&&r.recipient==='spain'&&r.accepted===expected.accepted));
 for(const [id,n] of Object.entries(s.nations))assert.deepEqual({stock:n.stock,cash:n.cash,workers:n.workers},stores[id]);
 assert.deepEqual(loadGame(saveGame(s)).wars,s.wars);
 assert.deepEqual(advanceWarCalls(s),[]);
});
