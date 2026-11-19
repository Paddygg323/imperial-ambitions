import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,command,saveGame,loadGame,beginTurn} from '../engine.mjs';
import {campaignObjective,planCampaignDeclaration} from '../ai-campaign.mjs';
import {planMilitary} from '../ai-military.mjs';import {provinceAdjacency} from '../world.mjs';import {TECHS} from '../rules.mjs';import {atWar} from '../diplomacy.mjs';
function fixture(){const s=createGame(),n=s.nations.france;n.known=Object.keys(TECHS);n.cash=10000;n.workers=Array.from({length:16},(_,i)=>({id:'w'+i,type:'peasant',fit:true,diet:'grain'}));s.armies=[];
 const p=campaignObjective(s,'france');assert.ok(p);const adj=provinceAdjacency(s),source=s.provinces.find(q=>q.owner==='france'&&adj[q.id].has(p.id)).id,capital=s.tiles.find(t=>t.id===n.capital).province;
 for(let i=0;i<8;i++)s.armies.push({id:'a'+i,owner:'france',province:source,type:i<6?'musketeer':'royalArtillery',hp:100,experience:0,order:null});
 if(capital!==source)for(let i=0;i<2;i++)s.armies.push({id:'guard'+i,owner:'france',province:capital,type:'musketeer',hp:100,experience:0,order:null});
 return {s,p,source,capital};}
test('prepared campaign queues a real declaration, persists it, and starts war only at diplomacy boundary',()=>{
 const {s,p}=fixture();const queued=planCampaignDeclaration(s,'france',command);
 assert.deepEqual(queued.declarations,[{nation:'france',target:p.owner}]);assert.equal(atWar(queued,'france',p.owner),false);
 assert.equal(planCampaignDeclaration(queued,'france',command),queued);
 assert.ok(!planMilitary(queued,'france',command).armies.some(u=>u.order?.job==='attack'));
 const end=beginTurn(loadGame(saveGame(queued)));assert.ok(atWar(end,'france',p.owner));
 assert.ok(end.market.diplomacy.some(r=>r.aggressor==='france'&&r.target===p.owner));
 assert.ok(end.armies.some(u=>u.owner==='france'&&u.order?.job==='attack'));
});
test('campaign will not declare with weak guns, damaged force, empty treasury, or another unfinished war',()=>{
 for(const condition of ['guns','health','cash','war']){const {s}=fixture();
  if(condition==='guns')for(const u of s.armies)if(u.type==='royalArtillery')u.type='culverin';
  if(condition==='health')for(const u of s.armies)u.hp=30;
  if(condition==='cash')s.nations.france.cash=0;
  if(condition==='war')s.wars=[['france','england']];
  assert.equal(planCampaignDeclaration(s,'france',command),s,condition);assert.equal((s.declarations??[]).length,0);
 }
 const {s}=fixture();assert.equal(campaignObjective(s,s.player),null);assert.equal(planCampaignDeclaration(s,s.player,command),s);
});
test('peacetime target gathers a force through ordinary paid military recruitment without issuing attacks',()=>{
 const {s,p,capital}=fixture();s.armies=s.armies.filter(u=>u.province===capital).slice(0,2);
 for(const g of Object.keys(s.nations.france.stock))s.nations.france.stock[g]=100;
 for(const [i,t] of s.tiles.filter(t=>t.owner==='france').entries())Object.assign(t,{resource:i%2?'grain':'meat',level:4,rail:true,prospected:true});
 const end=planMilitary(s,'france',command);assert.ok(end.construction.some(c=>c.owner==='france'&&c.kind==='army'));
 assert.ok(end.nations.france.workers.length<s.nations.france.workers.length);assert.ok(!end.armies.some(u=>u.order?.job==='attack'));
 assert.equal(end.provinces.find(q=>q.id===p.id).owner,p.owner);
});

test('sea-separated campaign requires charted passage and spare healthy transport before declaring',async()=>{
 const {SHIPS}=await import('../rules.mjs');const s=createGame(),n=s.nations.sweden;n.known=Object.keys(TECHS);n.cash=10000;
 n.workers=Array.from({length:16},(_,i)=>({id:'sw'+i,type:'peasant',fit:true,diet:i%2?'grain':'meat'}));n.seenSea=s.seas.zones.map(z=>z.id);
 const p=campaignObjective(s,'sweden');assert.ok(p);const adj=provinceAdjacency(s);assert.ok(!s.provinces.some(q=>q.owner==='sweden'&&adj[q.id]?.has(p.id)));
 const capital=s.tiles.find(t=>t.id===n.capital).province;
 s.armies=Array.from({length:8},(_,i)=>({id:'sw-army'+i,owner:'sweden',province:capital,type:i<6?'musketeer':'royalArtillery',hp:100,experience:0,order:null}));
 s.ships=Array.from({length:3},(_,i)=>({id:'sw-ship'+i,owner:'sweden',type:'indiaman',cargo:SHIPS.indiaman.cargo,hp:SHIPS.indiaman.hull,location:'home',order:null}));
 assert.deepEqual(planCampaignDeclaration(s,'sweden',command).declarations,[{nation:'sweden',target:p.owner}]);
 const uncharted=structuredClone(s);uncharted.nations.sweden.seenSea=[];assert.equal(planCampaignDeclaration(uncharted,'sweden',command),uncharted);
 const short=structuredClone(s);short.ships=short.ships.slice(0,1);assert.equal(planCampaignDeclaration(short,'sweden',command),short);
 const damaged=structuredClone(s);for(const u of damaged.ships)u.hp=1;assert.equal(planCampaignDeclaration(damaged,'sweden',command),damaged);
});
