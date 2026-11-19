import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,command,resolveTurn,saveGame,loadGame} from '../engine.mjs';
import {explorerOrder} from '../ai-explorers.mjs';import {revealCoast} from '../overseas.mjs';
function fixture(){const s=createGame();const id='england',unit=s.civilians.find(c=>c.owner===id&&c.type==='explorer');return {s,id,unit};}
test('completed national surveys are skipped even when the base tile remains unprospected',()=>{
 const {s,id,unit}=fixture(),owned=s.tiles.filter(t=>t.owner===id),[a,b]=owned;
 for(const t of [a,b])Object.assign(t,{terrain:8,prospected:false});
 s.nations[id].prospected=owned.filter(t=>t!==b).map(t=>t.id);
 assert.equal(explorerOrder(s,id,unit).tile,b.id);
 s.nations[id].prospected.push(b.id);assert.equal(explorerOrder(s,id,unit),null);
});
test('ship revelation enables legal overseas scouting, persists and reveals new terrain on resolution',()=>{
 const {s,id,unit}=fixture();s.nations[id].prospected=s.tiles.filter(t=>t.owner===id).map(t=>t.id);
 const old=new Set(s.provinces.filter(p=>p.old).map(p=>p.id)),overseas=new Set(s.tiles.filter(t=>!old.has(t.province)).map(t=>t.id));
 assert.equal(explorerOrder(s,id,unit),null);
 revealCoast(s,id,s.seas.zones.find(z=>z.coast.some(t=>overseas.has(t))).id);
 const order=explorerOrder(s,id,unit);assert.ok(order);assert.ok(s.nations[id].revealed.includes(order.tile));
 const before=s.nations[id].revealed.length;const next=resolveTurn(loadGame(saveGame(command(s,id,order))));
 assert.ok(next.nations[id].prospected.includes(order.tile));assert.ok(next.nations[id].revealed.length>before);
 const after=explorerOrder(next,id,next.civilians.find(c=>c.id===unit.id));assert.notEqual(after?.tile,order.tile);
});
test('unrevealed resources and rival Great Power land cannot steer or receive an explorer order',()=>{
 const {s,id,unit}=fixture();s.nations[id].prospected=s.tiles.filter(t=>t.owner===id).map(t=>t.id);
 const hidden=s.tiles.find(t=>!s.nations[id].revealed.includes(t.id));hidden.resource='gold';
 assert.equal(explorerOrder(s,id,unit),null);
 s.nations[id].revealed.push(hidden.id);hidden.owner='france';assert.equal(explorerOrder(s,id,unit),null);
});
