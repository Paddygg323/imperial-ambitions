import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,command,beginTurn,saveGame,loadGame,transport} from '../engine.mjs';
import {conquerProvince} from '../conquest.mjs';
import {planLandAttack} from '../land-attack.mjs';
import {provinceAdjacency} from '../world.mjs';

test('capital capture eliminates country without annexing its other provinces or garrisons',()=>{
 const s=createGame(),capital=s.provinces.find(p=>p.town===s.nations.france.capital);
 const other=s.provinces.find(p=>p.owner==='france'&&p!==capital);
 s.armies.push({id:'survivor',owner:'france',province:other.id,type:'pikeman',hp:71,experience:25,order:{job:'attack',province:capital.id}});
 s.construction.push({owner:'france',kind:'army',type:'pikeman'});
 conquerProvince(s,capital.id,'england');
 assert.equal(s.nations.france.alive,false);assert.equal(capital.owner,'england');
 assert.equal(other.owner,'france');assert.equal(other.anarchy,true);
 const unit=s.armies.find(u=>u.id==='survivor');assert.equal(unit.hp,71);assert.equal(unit.order,null);assert.equal(unit.defending,true);
 assert.equal(s.construction.some(o=>o.owner==='france'),false);
 assert.ok(Object.values(transport(s,'france').incoming).every(q=>q===0));
 assert.equal(s.outcome,undefined,'AI defeat is not player victory');
 assert.throws(()=>command(s,'france',{type:'recruitWorker',quantity:1}),/cannot issue/);
 const restored=loadGame(saveGame(s));assert.equal(restored.nations.france.alive,false);assert.ok(restored.provinces.find(p=>p.id===other.id).anarchy);
 const next=beginTurn(restored);assert.ok(next.market.offers.every(o=>o.seller!=='france'&&!o.buyers.includes('france')));
});
test('anarchic provinces can be attacked at peace and retain their defending garrison',()=>{
 const s=createGame(),capital=s.provinces.find(p=>p.town===s.nations.france.capital);
 conquerProvince(s,capital.id,'england');
 const adj=provinceAdjacency(s),target=s.provinces.find(p=>p.anarchy&&adj[capital.id].has(p.id));assert.ok(target);
 s.armies=[{id:'a',owner:'england',province:capital.id,type:'pikeman',hp:100,experience:0,order:null},{id:'d',owner:'france',province:target.id,type:'pikeman',hp:65,experience:0,order:null}];
 const attack=planLandAttack(s,'england',['a'],target.id);assert.deepEqual(attack.defenders,['d']);
 conquerProvince(s,target.id,'england');assert.equal(target.anarchy,false);assert.equal(target.owner,'england');
});
test('losing player capital persists defeat and prevents further campaign turns',()=>{
 const s=createGame(),capital=s.provinces.find(p=>p.town===s.nations.england.capital);
 conquerProvince(s,capital.id,'france');const restored=loadGame(saveGame(s));
 assert.equal(restored.outcome.status,'defeat');assert.equal(restored.outcome.reason,'capitalLost');
 assert.throws(()=>beginTurn(restored),/Campaign has ended/);
 assert.throws(()=>command(restored,'france',{type:'declareWar',target:'spain'}),/cannot issue/);
});

test('conquest clears purchased claims only in captured province and survives reload',()=>{
 const s=createGame(),p=s.provinces.find(p=>p.owner==='scotland')??s.provinces.find(p=>!s.nations[p.owner]);
 const captured=s.tiles.filter(t=>t.province===p.id),outside=s.tiles.find(t=>t.province!==p.id);
 for(const [i,t] of captured.entries())t.purchasedBy=i%2?'france':'england';
 outside.purchasedBy='france';p.investors=['france'];
 conquerProvince(s,p.id,'england');
 const restored=loadGame(saveGame(s));
 assert.ok(restored.tiles.filter(t=>t.province===p.id).every(t=>t.owner==='england'&&t.purchasedBy===undefined));
 assert.equal(restored.provinces.find(q=>q.id===p.id).investors,undefined);
 assert.equal(restored.tiles.find(t=>t.id===outside.id).purchasedBy,'france');
});
