import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,saveGame,loadGame,transport} from '../engine.mjs';
import {conquerProvince} from '../conquest.mjs';
import {prepareMinorBuyers} from '../trade-parties.mjs';
import {diplomaticCountries} from '../diplomacy.mjs';
import {campaignExternalResources} from '../campaign-external-resources.mjs';
import {campaignPlanningContext} from '../campaign-planning-context.mjs';
import {INITIAL_PRICES} from '../trade.mjs';

for(const old of [true,false])test(`${old?'Old World minor':'tribe'} capital loss ends production and diplomacy but leaves defensive anarchy`,()=>{
 const s=createGame({transportModel:'ports'});
 const m=Object.values(s.minors).find(m=>s.provinces.some(p=>p.owner===m.id&&p.old===old)&&s.provinces.filter(p=>p.owner===m.id).length>1);
 assert.ok(m);const capital=s.tiles.find(t=>t.id===m.capital),rest=s.provinces.find(p=>p.owner===m.id&&p.id!==capital.province);
 const claim=s.tiles.find(t=>t.province===rest.id&&t.resource);assert.ok(claim);claim.purchasedBy='france';
 s.armies.push({id:'surviving-minor',owner:m.id,type:'pikeman',province:rest.id,hp:75,experience:2,order:{job:'attack',province:capital.province}});
 conquerProvince(s,capital.province,'england');
 assert.equal(m.alive,false);assert.equal(rest.owner,m.id);assert.equal(rest.anarchy,true);
 const garrison=s.armies.find(u=>u.id==='surviving-minor');assert.equal(garrison.hp,75);assert.equal(garrison.order,null);assert.equal(garrison.defending,true);
 assert.ok(Object.values(transport(s,m.id).incoming).every(q=>q===0));
 assert.ok(!prepareMinorBuyers(s,INITIAL_PRICES).some(n=>n.id===m.id));assert.ok(!diplomaticCountries(s).includes(m.id));
 const external=campaignExternalResources(s,'france');
 assert.ok(external.input.countries.filter(c=>!c.present).length>0);
 const context=campaignPlanningContext(s,'france');assert.equal(context.transport.connections[claim.id].capacity,0);
 const restored=loadGame(saveGame(s));assert.equal(restored.minors[m.id].alive,false);assert.equal(restored.tiles.find(t=>t.id===claim.id).purchasedBy,'france');
 assert.ok(Object.values(transport(restored,m.id).incoming).every(q=>q===0));
});

test('older phone saves repair minor capital elimination once without annexation or replayed rewards',()=>{
 const s=createGame({transportModel:'ports'}),m=s.minors.ireland,capital=s.tiles.find(t=>t.id===m.capital);
 conquerProvince(s,capital.province,'england');
 delete m.alive;for(const p of s.provinces)if(p.owner===m.id)p.anarchy=false;
 const before={cash:s.nations.england.cash,reports:structuredClone(s.reports),support:s.nations.england.warSupport};
 const repaired=loadGame(saveGame(s));assert.equal(repaired.minors.ireland.alive,false);
 assert.ok(repaired.provinces.filter(p=>p.owner==='ireland').every(p=>p.anarchy));
 assert.equal(repaired.nations.england.cash,before.cash);assert.equal(repaired.nations.england.warSupport,before.support);assert.deepEqual(repaired.reports,before.reports);
 assert.equal(saveGame(loadGame(saveGame(repaired))),saveGame(repaired));
});
