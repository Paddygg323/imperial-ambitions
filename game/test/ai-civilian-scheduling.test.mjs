import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,command,saveGame,loadGame} from '../engine.mjs';
import {planEconomy} from '../ai.mjs';
function run(s){const actions=[];s=planEconomy(s,'france',(state,id,a)=>{const next=command(state,id,a);actions.push(a);return next;});return {s,actions};}
test('live civilian stage follows funded research and manufacturing commitments',()=>{
 const {s,actions}=run(createGame({preferenceSeed:123}));
 const first=actions.findIndex(a=>a.type==='civilian');assert.ok(first>=0);
 assert.ok(actions.slice(0,first).some(a=>a.type==='production'));
 assert.ok(actions.slice(0,first).some(a=>a.type==='researchFunding'&&a.amount>0));
 assert.ok(actions.slice(first).every(a=>a.type==='civilian'||a.type==='tradeOrder'));
 assert.ok(!actions.slice(first).some(a=>a.type==='production'||a.type.startsWith('research')));
 assert.ok(s.civilians.some(c=>c.owner==='france'&&c.order));
});
test('saved civilian idling skips new orders without stopping research or erasing existing work',()=>{
 let s=run(createGame()).s;const orders=structuredClone(s.civilians.filter(c=>c.owner==='france').map(c=>c.order));
 s.civilianIdling=true;s=loadGame(saveGame(s));assert.equal(s.civilianIdling,true);
 const result=run(s);assert.ok(!result.actions.some(a=>a.type==='civilian'));
 assert.ok(result.actions.some(a=>a.type==='production'));
 assert.ok(result.s.nations.france.projects.some(p=>p.funding>0));
 assert.deepEqual(result.s.civilians.filter(c=>c.owner==='france').map(c=>c.order),orders);
 const next=createGame({civilianIdling:true});next.turn=1;assert.ok(run(next).actions.some(a=>a.type==='civilian'));
});
test('legacy saves retain normal civilian scheduling and malformed idling settings are rejected',()=>{
 const s=createGame();delete s.civilianIdling;assert.ok(run(loadGame(saveGame(s))).actions.some(a=>a.type==='civilian'));
 for(const value of [null,1,'false']){assert.throws(()=>createGame({civilianIdling:value}),/idling/);s.civilianIdling=value;assert.throws(()=>saveGame(s),/idling/);}
});
