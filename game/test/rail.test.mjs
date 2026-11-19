import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,command,resolveTurn,saveGame,loadGame,transport} from '../engine.mjs';
import {goalPath,CONSTRUCTION} from '../rules.mjs';
import {transportLinkKey} from '../transport-links.mjs';
function fixture(){
 const s=createGame({simpleFood:true}),n=s.nations.england;s.nations={england:n};
 s.minors={};s.tiles=Array.from({length:5},(_,x)=>({id:`${x},2`,x,y:2,province:'p',owner:'england',terrain:0,level:0,resource:null,prospected:true,road:true,rail:x===0,port:false,river:false}));
 s.provinces=[{id:'p',name:'Test',owner:'england',town:'0,2',old:false}];n.capital='0,2';n.known=[...new Set([...goalPath('65'),'65'])];
 n.revealed=s.tiles.map(t=>t.id);n.prospected=[...n.revealed];n.stock.lumber=30;n.stock.steel=30;n.stock.grain=100;
 s.civilians=[{id:'rail',owner:'england',type:'railBuilder',tile:'0,2',order:null}];s.ships=[];s.armies=[];
 return s;
}
const order=s=>command(s,'england',{type:'civilian',unit:'rail',job:'rail',tile:'1,2'});
test('rail uses native cost, follows roads automatically and survives reload',()=>{
 let s=fixture();assert.deepEqual(CONSTRUCTION[20].goods,{lumber:3,steel:3});s=order(s);
 assert.equal(s.nations.england.stock.steel,27);assert.equal(s.tiles[1].rail,false);
 s=resolveTurn(s);assert.ok(s.tiles[1].rail);assert.equal(s.civilians[0].tile,'2,2');assert.equal(s.civilians[0].order.tile,'2,2');
 assert.equal(s.nations.england.stock.steel,24);
 s=resolveTurn(loadGame(saveGame(s)));assert.ok(s.tiles[2].rail);assert.equal(s.civilians[0].order.tile,'3,2');
 s=command(s,'england',{type:'cancelCivilian',unit:'rail'});s=resolveTurn(s);assert.equal(s.tiles[3].rail,false);
});
test('rail stops at junctions and when materials run out',()=>{
 let s=fixture();s.tiles.push({...s.tiles[2],id:'1,3',x:1,y:3,rail:false});s=resolveTurn(order(s));
 assert.equal(s.civilians[0].order,null);assert.ok(s.reports.some(r=>r.text?.includes('junction')));
 s=fixture();s.nations.england.stock.steel=3;s=resolveTurn(order(s));assert.equal(s.civilians[0].order,null);
 assert.ok(s.tiles[1].rail);assert.ok(s.reports.some(r=>r.text?.includes('not enough unallocated')));
});
test('rail requires technology, adjacent existing road and raises transport capacity to four',()=>{
 const s=fixture();s.tiles[1].road=false;assert.throws(()=>order(s),/existing road/);s.tiles[1].road=true;
 s.nations.england.known=[];assert.throws(()=>order(s),/Early Steam Engine/);s.nations.england.known=['65'];
 assert.throws(()=>command(s,'england',{type:'civilian',unit:'rail',job:'rail',tile:'4,2'}),/adjacent/);
 s.tiles[3].resource='iron';s.tiles[3].level=4;
 const before=transport(s,'england').incoming.iron;
 let done=resolveTurn(order(s));done=resolveTurn(done);
 assert.equal(transport(done,'england').incoming.iron,4);assert.ok(before<4);
});


test('automatic rail moves forward but uses the prior tile duration as native code does',()=>{
 let s=fixture();s.tiles[1].terrain=8;s=order(s);s=resolveTurn(s);s=resolveTurn(s);s=resolveTurn(s);
 assert.equal(s.civilians[0].tile,'2,2');assert.equal(s.civilians[0].order.remaining,3);assert.equal(s.tiles[2].rail,false);
 s=resolveTurn(loadGame(saveGame(s)));assert.equal(s.tiles[2].rail,false);
 s=resolveTurn(s);assert.equal(s.tiles[2].rail,false);
 s=resolveTurn(s);assert.equal(s.tiles[2].rail,true);
});

function foreignFixture(){
 const s=fixture(),n=s.nations.england;
 s.minors.scotland={...createGame().minors.scotland,capital:'0,2',known:[...n.known]};
 n.capital='4,2';n.embassies=['scotland'];
 s.provinces[0].owner='scotland';for(const t of s.tiles)t.owner='scotland';
 return s;
}
test('foreign rail increases minor deliveries, continues and charges each link after reload',()=>{
 let s=foreignFixture();s.tiles[3].resource='iron';s.tiles[3].level=4;s.tiles[3].purchasedBy='england';
 const before=transport(s,'scotland').incoming.iron;
 s=resolveTurn(order(s));assert.equal(s.nations.england.stock.steel,24);
 s=resolveTurn(loadGame(saveGame(s)));
 assert.equal(transport(s,'scotland').incoming.iron,4);assert.ok(before<4);
 assert.equal(s.nations.england.stock.steel,21);
 assert.ok(s.tiles.every(t=>t.owner==='scotland'));
});
test('foreign rail rejects no embassy and stops after access is lost without further charges',()=>{
 let s=foreignFixture();s.nations.england.embassies=[];assert.throws(()=>order(s),/embassy/);
 s.nations.england.embassies=['scotland'];s=order(s);
 s.nations.england.embassies=[];s=resolveTurn(s);
 assert.equal(s.civilians[0].order,null);assert.equal(s.tiles[1].rail,false);
 assert.equal(s.nations.england.stock.steel,27);
});

test('Android port model: paid railway raises actual next-cycle ore deliveries and manufacturing after reload',()=>{
 // Isolated integration fixture on historical English tiles, not campaign
 // evidence: supplied technology/stocks, level-four mine and a single road.
 let s=createGame({transportModel:'ports',preferenceSeed:123,simpleFood:true}),n=s.nations.england;
 for(const [id,c] of Object.entries(s.nations))c.alive=id==='england';
 s.minors={};s.armies=[];s.ships=[];s.construction=[];
 for(const t of s.tiles)t.level=0;
 const path=['82,23','81,23','80,23','79,23'];s.transportLinks={};
 for(let i=0;i<path.length;i++){
  const t=s.tiles.find(t=>t.id===path[i]);assert.equal(t.owner,'england');
  t.terrain=0;t.road=true;t.rail=i===0;t.river=false;
  if(i)s.transportLinks[transportLinkKey(path[i-1],path[i])]='road';
 }
 const source=s.tiles.find(t=>t.id===path.at(-1));source.resource='iron';source.level=4;source.prospected=true;
 n.prospected.push(source.id);n.known=[...new Set([...goalPath('65'),'65'])];
 n.stock.steel=9;n.stock.lumber=9;n.stock.grain=100;n.stock.meat=100;n.stock.iron=4;
 s.civilians=[{id:'rail-port-test',owner:'england',type:'railBuilder',tile:path[0],order:null}];
 s=command(s,'england',{type:'production',recipe:'castIron',quantity:1});
 assert.equal(transport(s,'england').incoming.iron,2);
 s=command(s,'england',{type:'civilian',unit:'rail-port-test',job:'rail',tile:path[1]});
 assert.equal(s.nations.england.stock.steel,6);
 const results=[];
 for(let i=0;i<3;i++){
  if(i===2)s=command(s,'england',{type:'production',recipe:'castIron',quantity:2});
  s=resolveTurn(loadGame(saveGame(s)));
  const reports=s.reports.filter(r=>r.nation==='england');
  results.push({preview:transport(s,'england').incoming.iron,delivered:reports.find(r=>r.kind==='deliveries').goods.iron,made:reports.find(r=>r.kind==='production'&&r.recipe==='castIron').made,steel:s.nations.england.stock.steel});
 }
 assert.deepEqual(results,[{preview:2,delivered:2,made:1,steel:3},{preview:4,delivered:2,made:1,steel:0},{preview:4,delivered:4,made:2,steel:0}]);
 assert.equal(s.nations.england.stock.lumber,0);assert.equal(s.nations.england.stock.iron,4);
 assert.equal(s.civilians[0].order,null);assert.deepEqual(loadGame(saveGame(s)),s);
});

