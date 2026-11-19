import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,command,resolveTurn,saveGame,loadGame} from '../engine.mjs';
import {canDeployCivilian} from '../civilian-access.mjs';
import {openDiplomaticOffices} from '../diplomacy.mjs';
function fixture(){const s=createGame();for(const n of Object.values(s.nations))n.orders.trade={bids:[],offers:{}};return s;}
test('consulate and embassy consume original costs, open next turn and grant builder access',()=>{
 let s=fixture();const target=s.provinces.find(p=>p.old&&!s.nations[p.owner]).owner;
 const tile=s.tiles.find(t=>t.owner===target),builder=s.civilians.find(c=>c.owner==='england'&&c.type==='builder');
 const before=s.nations.england.cash;
 assert.equal(canDeployCivilian(s,'england',builder,tile),false);
 s=command(s,'england',{type:'diplomaticOffice',office:'consulate',target});
 assert.equal(s.nations.england.cash,before-500);assert.equal(s.nations.england.consulates,undefined);
 assert.throws(()=>command(s,'england',{type:'diplomaticOffice',office:'consulate',target}),/pending/);
 s=resolveTurn(loadGame(saveGame(s)));assert.ok(s.nations.england.consulates.includes(target));
 assert.equal(canDeployCivilian(s,'england',builder,tile),false);
 assert.throws(()=>command(s,'england',{type:'diplomaticOffice',office:'embassy',target}),/Expertise/);
 s.nations.england.known.push('12');const cash=s.nations.england.cash;
 s=command(s,'england',{type:'diplomaticOffice',office:'embassy',target});assert.equal(s.nations.england.cash,cash-1000);
 assert.equal(canDeployCivilian(s,'england',builder,tile),false);
 s=resolveTurn(loadGame(saveGame(s)));assert.equal(canDeployCivilian(s,'england',builder,tile),true);
 assert.deepEqual(openDiplomaticOffices(s),[]);assert.equal(s.nations.england.embassies.length,1);
 assert.ok(s.reports.some(r=>r.nation==='england'&&r.office==='embassy'));
});
test('offices reject missing countries, Great Powers, war, unknown offices and insufficient treasury',()=>{
 const s=fixture(),target=s.provinces.find(p=>p.old&&!s.nations[p.owner]).owner;
 for(const country of ['missing','england','france'])assert.throws(()=>command(s,'england',{type:'diplomaticOffice',target:country,office:'consulate'}));
 assert.throws(()=>command(s,'england',{type:'diplomaticOffice',target,office:'castle'}));
 s.nations.england.cash=499;s.nations.england.finance.credit=0;
 assert.throws(()=>command(s,'england',{type:'diplomaticOffice',target,office:'consulate'}),/cash/);
 s.nations.england.cash=12000;s.wars=[['england',target]];
 assert.throws(()=>command(s,'england',{type:'diplomaticOffice',target,office:'consulate'}),/war/);
 assert.equal(s.diplomaticOffices,undefined);
});
test('saved pending offices reject malformed and duplicate records',()=>{
 const s=fixture(),target=s.provinces.find(p=>p.old&&!s.nations[p.owner]).owner;
 s.diplomaticOffices=[{nation:'england',target,office:'castle'}];assert.throws(()=>loadGame(JSON.stringify(s)),/office/);
 s.diplomaticOffices=[{nation:'england',target,office:'consulate'}];s.diplomaticOffices.push({...s.diplomaticOffices[0]});assert.throws(()=>loadGame(JSON.stringify(s)),/office/);
});
