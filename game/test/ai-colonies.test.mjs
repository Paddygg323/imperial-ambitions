import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,command,saveGame,loadGame} from '../engine.mjs';
import {provinceAdjacency} from '../world.mjs';
import {militaryController} from '../province-control.mjs';
import {campaignObjective} from '../ai-campaign.mjs';
import {planMilitary} from '../ai-military.mjs';
import {invasionObjective} from '../ai-invasion.mjs';
import {overseasSupplyObjective} from '../ai-overseas-supply.mjs';
function fixture(){
 let s=createGame({transportModel:'ports'});const adj=provinceAdjacency(s);
 const target=s.provinces.find(p=>!p.old&&[...adj[p.id]].some(id=>{const q=s.provinces.find(p=>p.id===id);return !q.old&&q.owner!==p.owner;}));
 const source=s.provinces.find(p=>adj[target.id].has(p.id)&&!p.old&&p.owner!==target.owner);
 s.minors[source.owner].colonyOf='france';s.minors[target.owner].colonyOf='england';
 for(const p of s.provinces)if(p.owner==='england'||p.owner===target.owner)p.fort=4;target.fort=0;
 s.wars=[['france','england']];const capital=s.tiles.find(t=>t.id===s.nations.france.capital).province;
 s.armies=Array.from({length:10},(_,i)=>({id:'colonial-army-'+i,owner:'france',province:i<2?capital:source.id,type:'pikeman',hp:100,experience:0,order:null}));
 s.construction=[];s=loadGame(saveGame(s));return {s,source:s.provinces.find(p=>p.id===source.id),target:s.provinces.find(p=>p.id===target.id)};
}
test('AI selects an enemy colony on its colonial border and issues a legal land attack after reload',()=>{
 const {s,source,target}=fixture();assert.equal(campaignObjective(s,'france')?.id,target.id);assert.equal(invasionObjective(s,'france'),null,'no invasion fleet needed across a controlled land border');
 const next=planMilitary(s,'france',command);const attackers=next.armies.filter(u=>u.order?.job==='attack');assert.ok(attackers.length>=4,'send a viable force while retaining border garrisons');assert.ok(attackers.every(u=>u.province===source.id&&u.order.province===target.id));
 assert.equal(next.provinces.find(p=>p.id===source.id).owner,source.owner);assert.equal(next.provinces.find(p=>p.id===target.id).owner,target.owner);assert.deepEqual(loadGame(saveGame(next)),next);
});
test('AI crop acquisition does not treat own or neutral foreign colonies as independent tribes',()=>{
 const {s,source,target}=fixture();s.wars=[];s.nations.france.known.push('23');
 for(const p of [source,target]){const tile=s.tiles.find(t=>t.province===p.id);tile.resource='sugarCane';tile.prospected=true;s.nations.france.revealed.push(tile.id);assert.equal(overseasSupplyObjective(s,'france',new Set([p.id])),null);}
 delete s.minors[target.owner].colonyOf;assert.equal(overseasSupplyObjective(s,'france',new Set([target.id]))?.id,target.id);
});
test('changing colony parent invalidates the old AI land-front assumption',()=>{
 const {s,source,target}=fixture();s.minors[source.owner].colonyOf='spain';assert.equal(militaryController(s,source),'spain');
 assert.notEqual(campaignObjective(s,'france')?.id,target.id,'uncharted distant colony is no longer a French border objective');
});

