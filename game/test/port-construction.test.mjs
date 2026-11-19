import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import europe from '../data/europe.mjs';
import {canBuildPort} from '../port-construction.mjs';
import {createGame,command,resolveTurn,saveGame,loadGame} from '../engine.mjs';
import {portExit} from '../river-routes.mjs';
import {conquerProvince} from '../conquest.mjs';
test('Engineer port sites match all1161native historical mask decisions',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-engineer-port-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,1161);const s={tiles:europe.tiles},ix=new Map(s.tiles.map(t=>[t.id,t]));
 for(const c of audit.cases)assert.equal(canBuildPort(s,ix.get(c.id),ix),c.eligible,c.id);
});

function fixture(){const s=createGame();s.nations.england.stock.lumber=20;s.nations.england.stock.castIron=20;return s;}
function order(s,t){const u=s.civilians.find(c=>c.owner==='england'&&c.type==='engineer');u.tile=t.id;return command(s,'england',{type:'civilian',unit:u.id,job:'port',tile:t.id});}
test('valid port consumes materials once, finishes after two turns and survives reload',()=>{
 let s=fixture();const t=s.tiles.find(t=>t.owner==='england'&&!t.port&&canBuildPort(s,t));assert.ok(t);
 s=order(s,t);assert.equal(s.nations.england.stock.lumber,15);assert.equal(s.nations.england.stock.castIron,15);
 const second={...s.civilians.find(c=>c.owner==='england'&&c.type==='engineer'),id:'second',order:null};s.civilians.push(second);
 assert.throws(()=>command(s,'england',{type:'civilian',unit:second.id,job:'port',tile:t.id}),/Another Engineer/);
 s=resolveTurn(s);assert.equal(s.tiles.find(q=>q.id===t.id).port,false);
 s=resolveTurn(loadGame(saveGame(s)));assert.equal(s.tiles.find(q=>q.id===t.id).port,true);
 const completed=s.tiles.find(q=>q.id===t.id),exit=portExit(s,completed,{restricted:false})?.id??null;
 assert.equal(completed.transportSeaTile,exit);
 s=loadGame(saveGame(s));assert.equal(s.tiles.find(q=>q.id===t.id).transportSeaTile,exit);
 conquerProvince(s,t.province,'france');
 assert.equal(s.tiles.find(q=>q.id===t.id).transportSeaTile,exit,'conquest retains physical port exit');
 assert.equal(loadGame(saveGame(s)).tiles.find(q=>q.id===t.id).transportSeaTile,exit);
});

test('stored port endpoints reject nonexistent sea tiles and preserve unknown legacy exits',()=>{
 const s=fixture(),home=s.tiles.find(t=>t.id===s.nations.england.capital);
 delete home.transportSeaTile;
 assert.equal(loadGame(saveGame(s)).tiles.find(t=>t.id===home.id).transportSeaTile,undefined);
 home.transportSeaTile='invalid';assert.throws(()=>saveGame(s),/stored port exit/);
 home.transportSeaTile=home.id;assert.throws(()=>saveGame(s),/stored port exit/);
});
test('engineer rejects swamp, unusable rivers and foreign river routes without charging',()=>{
 for(const mode of ['swamp','blocked','foreign']){
  const s=fixture();let t;
  if(mode==='swamp'){t=s.tiles.find(t=>t.owner==='england'&&!t.port&&canBuildPort(s,t));t.terrain=9;}
  else {const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-historical-rivers-audit.json',import.meta.url)));
   const candidates=audit.rivers.filter(r=>r.owner!==255&&r.foreignRouteResult===(mode==='foreign'?1:255));
   t=candidates.map(r=>s.tiles.find(t=>t.id===`${r.x},${r.y}`)).find(q=>!canBuildPort(s,q));assert.ok(t);
   // Play as the tile's current nation, retaining the actual foreign route.
   const id=t.owner;s.player=id;s.nations[id]={...s.nations.england,id};s.civilians=[{id:'engineer',owner:id,type:'engineer',tile:t.id,order:null}];
  }
  const id=t.owner,u=s.civilians.find(c=>c.owner===id&&c.type==='engineer');u.tile=t.id;t.port=false;
  const stock=structuredClone(s.nations[id].stock);
  assert.throws(()=>command(s,id,{type:'civilian',unit:u.id,job:'port',tile:t.id}),/suitable terrain/);
  assert.deepEqual(s.nations[id].stock,stock);
 }
});
