import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,saveGame,loadGame} from '../engine.mjs';
import {campaignPlanningContext} from '../campaign-planning-context.mjs';
import {campaignResourcePlanning} from '../campaign-resource-planning.mjs';
import {setTransportLink} from '../transport-links.mjs';

test('purchased foreign resources use sovereign transport and stay outside the buyer domestic supply',()=>{
 let s=createGame({transportModel:'ports'});const minor=s.minors.scotland;
 const root=s.tiles.find(t=>t.id===minor.capital);
 const purchased=s.tiles.find(t=>t.owner===minor.id&&t.resource&&t.id!==root.id);
 assert.ok(purchased);purchased.purchasedBy='france';
 const before=JSON.stringify(s),context=campaignPlanningContext(s,'france');
 assert.ok(context.owners.includes('scotland'));
 assert.ok(context.transport.connections[purchased.id]);assert.ok(context.distances[purchased.id]);
 const result=campaignResourcePlanning(s,'france',{...context,priorities:Array(28).fill(1)});
 assert.ok(result.rows.some(r=>r.tile===purchased.id));
 assert.equal(s.tiles.find(t=>t.id===purchased.id).owner,'scotland');assert.equal(JSON.stringify(s),before);
 s=loadGame(saveGame(s));assert.deepEqual(campaignPlanningContext(s,'france'),context);
 delete s.tiles.find(t=>t.id===purchased.id).purchasedBy;
 assert.ok(!campaignPlanningContext(s,'france').owners.includes('scotland'));
});

test('foreign road improvements alter planning connections without crossing sovereign boundaries',()=>{
 const s=createGame({transportModel:'ports'}),minor=s.minors.scotland;
 minor.capital='10,10';minor.transportRoots=['10,10'];minor.transportAssignments={'10,10':{automatic:true,assigned:Array(28).fill(0)}};
 const tile=(x,owner='scotland')=>({id:`${x},10`,x,y:10,owner,province:'fixture',terrain:0,resource:x===13?'grain':null,level:0,prospected:true,port:x===10});
 // Preserve France's original map while giving the minor a small isolated chain.
 s.tiles=s.tiles.filter(t=>t.owner!=='scotland');s.tiles.push(...[10,11,12,13].map(x=>tile(x)));
 s.tiles.find(t=>t.id==='13,10').purchasedBy='france';s.transportLinks={};
 let context=campaignPlanningContext(s,'france');assert.equal(context.transport.connections['13,10'].capacity,0);
 setTransportLink(s,'10,10','11,10','road');setTransportLink(s,'11,10','12,10','road');
 context=campaignPlanningContext(s,'france');assert.equal(context.transport.connections['13,10'].capacity,1);
 s.nations.england.known.push('45');context=campaignPlanningContext(s,'france');assert.equal(context.transport.connections['13,10'].capacity,2);
 s.tiles.find(t=>t.id==='11,10').owner='england';context=campaignPlanningContext(s,'france');assert.equal(context.transport.connections['13,10'].capacity,0);
});
