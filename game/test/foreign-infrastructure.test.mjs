import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,command,finishTurnEconomy,saveGame,loadGame} from '../engine.mjs';
import {neighbourIds} from '../world.mjs';
import {transportLink,setTransportLink} from '../transport-links.mjs';
import {transport} from '../economy.mjs';
import {canBuildPort} from '../port-construction.mjs';
const finish=s=>finishTurnEconomy({...s,turnPhase:'combat'});
function fixture(){
 const s=createGame(),n=s.nations.england;n.embassies=['scotland'];n.stock.lumber=30;n.stock.castIron=30;
 const capital=s.tiles.find(t=>t.id===s.minors.scotland.capital);
 let from,t,ore;
 outer:for(const a of s.tiles.filter(q=>q.owner==='scotland'&&neighbourIds(capital).includes(q.id)))for(const b of s.tiles.filter(q=>q.owner==='scotland'&&neighbourIds(a).includes(q.id)))for(const c of s.tiles.filter(q=>q.owner==='scotland'&&neighbourIds(b).includes(q.id))){
  if(c.id!==capital.id&&c.id!==a.id&&!neighbourIds(capital).includes(c.id)&&!neighbourIds(a).includes(c.id)){from=a;t=b;ore=c;break outer;}
 }
 assert.ok(ore,'road-extension fixture');
 ore.resource='iron';ore.level=1;ore.purchasedBy='england';ore.terrain=8;ore.port=false;ore.road=false;s.transportLinks={};setTransportLink(s,capital.id,from.id,'road');
 const u=s.civilians.find(c=>c.owner==='england'&&c.type==='engineer');u.tile=from.id;
 return {s,from,t,u,ore};
}
test('foreign road costs materials and delivers purchased ore into minor economy after completion',()=>{
 let {s,from,t,u,ore}=fixture();
 assert.equal(transport(s,'scotland').rows.find(r=>r.tile===ore.id)?.delivered??0,0);
 s=command(s,'england',{type:'civilian',unit:u.id,job:'road',tile:t.id});
 assert.equal(s.nations.england.stock.lumber,29);assert.equal(s.nations.england.stock.castIron,29);
 const turns=s.civilians.find(c=>c.id===u.id).order.remaining;
 for(let i=0;i<turns;i++)s=finish(loadGame(saveGame(s)));
 assert.equal(transportLink(s,from,t),'road');
 assert.ok(transport(s,'scotland').rows.some(r=>r.tile===ore.id&&r.delivered===1));
 assert.ok(!transport(s,'england').rows.some(r=>r.tile===ore.id));
});
test('foreign infrastructure requires diplomatic access, rejects Great Powers, and rechecks road origin',()=>{
 const {s,t,u,from}=fixture(),action={type:'civilian',unit:u.id,job:'road',tile:t.id};
 s.nations.england.embassies=[];assert.throws(()=>command(s,'england',action),/embassy/);
 s.nations.england.embassies=['scotland'];s.wars=[['england','scotland']];assert.throws(()=>command(s,'england',action),/embassy/);
 s.wars=[];let next=command(s,'england',action);
 next.tiles.find(q=>q.id===from.id).owner='france';
 for(let i=0;i<4;i++)next=finish(next);
 assert.equal(transportLink(next,from,t),null);
 t.owner='france';assert.throws(()=>command(s,'england',action),/embassy/);
});
test('foreign port uses existing terrain rules and completes with sovereignty unchanged',()=>{
 let {s,u}=fixture();const t=s.tiles.find(t=>t.owner==='scotland'&&!t.port&&canBuildPort(s,t));assert.ok(t);
 u.tile=t.id;s=command(s,'england',{type:'civilian',unit:u.id,job:'port',tile:t.id});
 assert.equal(s.nations.england.stock.lumber,25);assert.equal(s.nations.england.stock.castIron,25);
 s=finish(s);assert.equal(s.tiles.find(q=>q.id===t.id).port,false);
 s=finish(loadGame(saveGame(s)));assert.equal(s.tiles.find(q=>q.id===t.id).port,true);
 assert.equal(s.tiles.find(q=>q.id===t.id).owner,'scotland');
});

