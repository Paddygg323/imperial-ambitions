import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,command,beginTurn,resolveTurn,transport,saveGame,loadGame} from '../engine.mjs';
import {issueMinorJoins} from '../minor-join-offers.mjs';
import {victoryTotals} from '../victory.mjs';
function fixture(){
 const s=createGame({transportModel:'ports'});const target='scotland';
 s.nations.england.embassies=[target];
 s.relations??={};s.relations[target]??={};
 for(const id of Object.keys(s.nations)){s.relations[id]??={};s.relations[id][target]=s.relations[target][id]=id==='england'?250:90;}
 return s;
}
test('free queued invitation survives reload and annexes at diplomacy, preserving forces and infrastructure',()=>{
 let s=fixture();const target='scotland',before=structuredClone(s),cash=s.nations.england.cash;
 const provinces=s.provinces.filter(p=>p.owner===target),tiles=s.tiles.filter(t=>t.owner===target),army=s.armies.filter(u=>u.owner===target);
 assert.ok(provinces.length&&army.length);
 s=command(s,'england',{type:'offerMinorJoin',target});assert.equal(s.nations.england.cash,cash);assert.equal(s.provinces.find(p=>p.id===provinces[0].id).owner,target);
 s=beginTurn(loadGame(saveGame(s)));
 assert.ok(provinces.every(p=>s.provinces.find(q=>q.id===p.id).owner==='england'));
 assert.ok(tiles.every(t=>{const after=s.tiles.find(q=>q.id===t.id);return after.owner==='england'&&after.level===t.level&&after.road===t.road&&after.port===t.port;}));
 for(const u of army){const actual=s.armies.find(a=>a.id===u.id);assert.equal(actual.owner,'england');assert.equal(actual.hp,u.hp);assert.equal(actual.type,u.type);}
 assert.equal(s.minors[target].joinedBy,'england');assert.equal(s.minors[target].alive,false);
 assert.equal(victoryTotals(s).counts.england,victoryTotals(before).counts.england+provinces.length);
 const capital=before.minors[target].capital;assert.ok(s.nations.england.transportRoots.includes(capital));assert.equal(s.nations.england.transportAssignments[capital].automatic,false);
 assert.deepEqual(issueMinorJoins(s),[]);s=loadGame(saveGame(s));assert.equal(s.minors[target].joinedBy,'england');
});
test('close rival blocks joining; cancellation and invalid invitations do not spend or transfer',()=>{
 let s=fixture();s.relations.scotland.france=245;s.relations.france.scotland=245;
 s=command(s,'england',{type:'offerMinorJoin',target:'scotland'});const reports=issueMinorJoins(s);assert.equal(reports[0].accepted,false);assert.notEqual(s.minors.scotland.alive,false);
 s=command(s,'england',{type:'offerMinorJoin',target:'scotland'});s=command(s,'england',{type:'offerMinorJoin',target:'scotland',cancel:true});assert.deepEqual(issueMinorJoins(s),[]);
 for(const target of ['france','missing','ireland'])assert.throws(()=>command(s,'england',{type:'offerMinorJoin',target}));
 s.minorJoinOffers=[{nation:'england',target:'scotland'},{nation:'england',target:'scotland'}];assert.throws(()=>loadGame(JSON.stringify(s)),/minor invitations/);
});
test('third-party wars do not silently transfer land or create unapproved declarations',()=>{
 let s=fixture();s.wars=[['france','scotland']];s=command(s,'england',{type:'offerMinorJoin',target:'scotland'});
 assert.match(issueMinorJoins(s)[0].text,/protection negotiations/);assert.notEqual(s.minors.scotland.alive,false);assert.deepEqual(s.wars,[['france','scotland']]);
});

test('annexed timber is allocated to shipping, delivered, and manufactured after reload',()=>{
 // Isolated economy fixture: remove English output to identify the acquired
 // Scottish timber. Supplied food and two timber authorize the standing order.
 let s=fixture();for(const [id,n] of Object.entries(s.nations))if(id!=='england')n.alive=false;
 for(const t of s.tiles)if(t.owner==='england')t.level=0;
 s=command(s,'england',{type:'offerMinorJoin',target:'scotland'});issueMinorJoins(s);
 assert.equal(transport(s,'england').incoming.timber,0);
 s=command(s,'england',{type:'transport',good:'timber',quantity:1});assert.equal(transport(s,'england').incoming.timber,1);
 s.nations.england.stock.timber=2;s.nations.england.stock.grain=100;s.nations.england.stock.meat=100;
 const lumber=s.nations.england.stock.lumber;
 s=command(s,'england',{type:'production',recipe:'lumber',quantity:1});s=resolveTurn(loadGame(saveGame(s)));
 const delivered=s.reports.find(r=>r.nation==='england'&&r.kind==='deliveries');
 assert.equal(delivered.goods.timber,1);assert.ok(delivered.rows.some(r=>r.sourcePort==='77,13'&&r.good==='timber'&&r.seaDelivered===1));
 assert.equal(s.reports.find(r=>r.nation==='england'&&r.kind==='production'&&r.recipe==='lumber').made,1);
 assert.equal(s.nations.england.stock.timber,1);assert.equal(s.nations.england.stock.lumber,lumber+1);
});
