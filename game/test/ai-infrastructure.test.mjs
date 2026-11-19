import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,command,finishTurnEconomy,saveGame,loadGame} from '../engine.mjs';
import {infrastructureOrder} from '../ai-infrastructure.mjs';
import {planTransport} from '../ai-transport.mjs';
import {transport} from '../economy.mjs';
import {canBuildPort} from '../port-construction.mjs';
function fixture(){
 const s=createGame(),n=s.nations.france;
 // Choose an actual port-capable holding; the first generated province may
 // be inland. Evaluate eligibility after the intended ownership transfer.
 const p=s.provinces.find(p=>{
  if(p.old)return false;
  const index=new Map(s.tiles.map(t=>[t.id,t.province===p.id?{...t,owner:'france'}:t]));
  return [...index.values()].some(t=>t.province===p.id&&canBuildPort(s,t,index));
 });assert.ok(p);p.owner='france';
 const tiles=s.tiles.filter(t=>t.province===p.id);
 for(const t of tiles){t.owner='france';t.port=false;t.road=false;t.rail=false;t.resource=null;t.level=0;n.revealed.push(t.id);}
 const site=tiles.find(t=>canBuildPort(s,t));assert.ok(site);site.resource='timber';site.level=2;site.prospected=true;
 n.stock.lumber=20;n.stock.castIron=20;
 const u=s.civilians.find(c=>c.owner==='france'&&c.type==='engineer');
 return {s,n,u,site,tiles};
}
const finish=s=>finishTurnEconomy({...loadGame(saveGame(s)),turnPhase:'combat'});
test('engineer establishes an isolated holding port with real deployment, cost and delivery',()=>{
 let {s,u,site}=fixture();const score=t=>t.id===site.id?10:0;
 assert.equal(transport(s,'france').rows.find(r=>r.tile===site.id).delivered,0);
 let order=infrastructureOrder(s,'france',u,score);assert.equal(order.job,'move');
 s=finish(command(s,'france',order));u=s.civilians.find(c=>c.id===u.id);
 order=infrastructureOrder(s,'france',u,score);assert.equal(order.job,'port');
 const before=s.nations.france.stock.lumber;
 s=command(s,'france',order);assert.equal(s.nations.france.stock.lumber,before-5);
 s=finish(s);s=finish(s);assert.ok(s.tiles.find(t=>t.id===order.tile).port);
 s=planTransport(s,'france',command);
 assert.equal(transport(s,'france').rows.find(r=>r.tile===site.id).delivered,2);
});
test('no port order for hidden resources, insufficient materials or duplicate component work',()=>{
 const {s,n,u,site}=fixture(),score=t=>t.id===site.id?10:0;
 n.stock.lumber=4;assert.equal(infrastructureOrder(s,'france',u,score),null);
 n.stock.lumber=20;site.terrain=8;site.prospected=false;n.prospected=[];assert.equal(infrastructureOrder(s,'france',u,score),null);
 site.prospected=true;s.civilians.push({...u,id:'busy',order:{job:'port',tile:site.id,remaining:2}});
 assert.equal(infrastructureOrder(s,'france',u,score),null);
});


test('engineer extends an existing overseas port road network to an inland resource',()=>{
 let {s,u,site,tiles}=fixture();site.port=true;site.resource=null;site.level=0;
 const distant=tiles.filter(t=>!transport(s,'france').sea.has(t.id)).sort((a,b)=>Math.hypot(b.x-site.x,b.y-site.y)-Math.hypot(a.x-site.x,a.y-site.y))[0];
 assert.ok(distant);distant.resource='timber';distant.level=1;distant.prospected=true;
 const score=t=>t.id===distant.id?20:0;let roads=0;
 for(let turn=0;turn<30&&!transport(s,'france').sea.has(distant.id);turn++){
  u=s.civilians.find(c=>c.id===u.id);
  if(!u.order){const order=infrastructureOrder(s,'france',u,score);assert.ok(order);assert.notEqual(order.job,'port');
   if(order.job==='road')roads++;
   s=command(s,'france',order);
  }
  s=finish(s);
 }
 assert.ok(roads>0);assert.ok(transport(s,'france').sea.has(distant.id));
 s=planTransport(s,'france',command);
 assert.equal(transport(s,'france').rows.find(r=>r.tile===distant.id).delivered,1);
});
