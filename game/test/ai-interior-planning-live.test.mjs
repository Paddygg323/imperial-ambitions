import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,command,saveGame,loadGame} from '../engine.mjs';
import {planEconomy} from '../ai.mjs';
import {campaignShippingPlan} from '../campaign-shipping-plan.mjs';
import {conquerProvince} from '../conquest.mjs';

test('live AI replaces initial planning after economic orders and the next forecast consumes saved totals',()=>{
 const original=createGame({transportModel:'ports'}),before=JSON.stringify(original);
 assert.ok(original.nations.france.interiorPlanning.tiles.every(q=>q===0));
 const planned=planEconomy(original,'france',command),n=planned.nations.france;
 assert.equal(JSON.stringify(original),before);
 assert.ok(n.interiorPlanning.tiles.some(q=>q>0));
 assert.ok(n.interiorPlanning.unused.some(q=>q>0)||n.interiorPlanning.undeveloped.some(q=>q>0));
 const restored=loadGame(saveGame(planned));
 assert.deepEqual(restored.nations.france.interiorPlanning,n.interiorPlanning);
 const forecast=campaignShippingPlan(restored,'france').forecast.reinforcement.input;
 assert.deepEqual(forecast.undeveloped,[n.interiorPlanning.undeveloped[20],n.interiorPlanning.undeveloped[22]]);
 assert.deepEqual(forecast.unused,[n.interiorPlanning.unused[20],n.interiorPlanning.unused[22]]);
});

test('native civilian idling retains preceding planning history rather than refreshing it early',()=>{
 const s=createGame({transportModel:'ports'});s.civilianIdling=true;s.turn=0;
 s.nations.france.interiorPlanning.unused[20]=3;
 const before=structuredClone(s.nations.france.interiorPlanning);
 const planned=planEconomy(s,'france',command);
 assert.deepEqual(planned.nations.france.interiorPlanning,before);
 assert.ok(planned.nations.france.shippingPriorities.length===28,'Economic forecast still runs before the idling gate');
});

test('AI planning handles a purchased claim left in anarchy after a minor capital falls',()=>{
 let s=createGame({transportModel:'ports'});const m=s.minors.ireland,cap=s.tiles.find(t=>t.id===m.capital);
 const claim=s.tiles.find(t=>t.owner===m.id&&t.province!==cap.province&&t.resource);claim.purchasedBy='france';
 conquerProvince(s,cap.province,'england');s=loadGame(saveGame(s));
 const planned=planEconomy(s,'france',command);
 assert.equal(planned.minors.ireland.alive,false);
 assert.ok(planned.nations.france.interiorPlanning.tiles.some(q=>q>0));
 assert.equal(planned.tiles.find(t=>t.id===claim.id).owner,'ireland');
});
