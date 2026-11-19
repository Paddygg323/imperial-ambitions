import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,command} from '../engine.mjs';import {civilianMapOrder,pendingAttackGroups} from '../map-orders.mjs';import {neighbourIds} from '../world.mjs';import {transportLink} from '../transport-links.mjs';
test('civilian map orders choose real road, development, exploration and spy commands',()=>{
 const s=createGame({transportModel:'ports'}),units=s.civilians.filter(u=>u.owner===s.player);
 const engineer=units.find(u=>u.type==='engineer'),from=s.tiles.find(t=>t.id===engineer.tile),road=s.tiles.find(t=>t.owner===s.player&&neighbourIds(from).includes(t.id)&&!transportLink(s,from,t));
 const roadOrder=civilianMapOrder(s,engineer.id,road.id);assert.equal(roadOrder.job,'road');assert.equal(command(s,s.player,roadOrder).civilians.find(u=>u.id===engineer.id).order.job,'road');
 const builder=units.find(u=>u.type==='builder'),resource=s.tiles.find(t=>t.owner===s.player&&t.resource&&t.level===0&&!s.provinces.some(p=>p.town===t.id));const build=civilianMapOrder(s,builder.id,resource.id);assert.equal(build.job,'develop');assert.equal(command(s,s.player,build).civilians.find(u=>u.id===builder.id).order.job,'develop');
 const explorer=units.find(u=>u.type==='explorer');assert.equal(command(s,s.player,civilianMapOrder(s,explorer.id,resource.id)).civilians.find(u=>u.id===explorer.id).order.job,'explore');
 s.civilians.push({id:'spy-test',owner:s.player,type:'spy',tile:from.id,order:null});const spy=civilianMapOrder(s,'spy-test',resource.id);assert.equal(spy.job,'spy');assert.equal(command(s,s.player,spy).civilians.find(u=>u.id==='spy-test').order.job,'spy');
});
test('attack arrow groups only your pending troops by source and destination',()=>{
 const s={player:'england',armies:[{id:'a',owner:'england',province:'London',order:{job:'attack',province:'Cherokee'}},{id:'b',owner:'england',province:'London',order:{job:'attack',province:'Cherokee'}},{id:'c',owner:'france',province:'Paris',order:{job:'attack',province:'London'}}]};const groups=pendingAttackGroups(s);assert.equal(groups.length,1);assert.deepEqual(groups[0].units.map(u=>u.id),['a','b']);assert.equal(groups[0].to,'Cherokee');
});
