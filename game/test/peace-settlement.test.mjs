import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,saveGame,loadGame} from '../engine.mjs';
import {resolveComputerPeaceOffer} from '../peace-settlement.mjs';
import {atWar} from '../diplomacy.mjs';
import {tradeRelation} from '../trade-relations.mjs';
import {recordWarDeclaration} from '../war-history.mjs';
function fixture(){
 const s=createGame({transportModel:'ports'});s.wars=[['england','france'],['england','spain']];
 for(const [a,b] of s.wars)recordWarDeclaration(s,a,b);
 s.nations.france.warSupport=Math.fround(.0001);s.nations.england.tradePolicies={france:300,spain:300};
 return s;
}
test('accepted computer peace preserves territory, clears only bilateral hostilities, and survives reload',()=>{
 const s=fixture(),france=s.provinces.find(p=>p.owner==='france').id;
 const own=s.armies.find(u=>u.owner==='england');own.order={job:'attack',province:france};
 const other=s.armies.find(u=>u.owner==='france');other.order={job:'attack',province:s.provinces.find(p=>p.owner==='england').id};
 const keep=s.armies.find(u=>u.owner==='spain');keep.order={job:'attack',province:s.provinces.find(p=>p.owner==='england').id};
 const ship=s.ships.find(u=>u.owner==='england');ship.order={job:'beachhead',province:france};
 const before=JSON.stringify(s),result=resolveComputerPeaceOffer(s,'england','france');
 assert.equal(JSON.stringify(s),before);assert.equal(result.decision.accepted,true);
 const out=loadGame(saveGame(result.state));
 assert.equal(atWar(out,'england','france'),false);assert.equal(atWar(out,'england','spain'),true);
 assert.deepEqual(out.provinces,s.provinces);assert.equal(out.armies.find(u=>u.id===own.id).order,null);assert.equal(out.armies.find(u=>u.id===other.id).order,null);
 assert.deepEqual(out.armies.find(u=>u.id===keep.id).order,keep.order);assert.equal(out.ships.find(u=>u.id===ship.id).order,null);
 assert.equal(out.nations.england.tradePolicies.france,100);assert.equal(out.nations.england.tradePolicies.spain,300);
 assert.ok(tradeRelation(out,'england','france')>=50);assert.equal(out.warDates['england:france'],undefined);
 assert.equal(result.reports.filter(r=>r.peace).length,2);
 assert.throws(()=>resolveComputerPeaceOffer(out,'england','france'),/existing war/);
});
test('rejection retains wars and orders; human responses cannot be decided by the computer',()=>{
 const s=fixture();s.nations.france.warSupport=1;s.armies=s.armies.filter(u=>u.owner!=='england');s.ships=s.ships.filter(u=>u.owner!=='england');Object.keys(s.nations.england.stock).forEach(g=>s.nations.england.stock[g]=0);
 const result=resolveComputerPeaceOffer(s,'england','france');assert.equal(result.decision.accepted,false);assert.deepEqual(result.state,s);
 assert.ok(result.reports.every(r=>r.peaceRejected));assert.throws(()=>resolveComputerPeaceOffer(s,'france','england'),/Human peace response/);
});
test('recipient accepts separately from its allies and applies the audited alliance-break penalty',()=>{
 const s=fixture();s.wars.push(['england','portugal']);s.alliances=[['france','portugal'],['france','sweden']];
 s.relations.france.portugal=s.relations.portugal.france=200;
 const result=resolveComputerPeaceOffer(s,'england','france');assert.equal(result.decision.accepted,true);
 assert.deepEqual(result.state.alliances,[['france','sweden']]);assert.equal(atWar(result.state,'england','portugal'),true);
 assert.equal(tradeRelation(result.state,'france','portugal'),90);assert.equal(result.reports.filter(r=>r.allianceBroken).length,2);
});
