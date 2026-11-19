import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,command,finishTurnEconomy,saveGame,loadGame} from '../engine.mjs';
import {townUpgrade} from '../town-upgrade.mjs';
import {neighbourIds} from '../world.mjs';
import {setTransportLink} from '../transport-links.mjs';
import {transport} from '../economy.mjs';
import {openMarket} from '../trade.mjs';
const finish=s=>finishTurnEconomy({...s,turnPhase:'combat'});
function fixture(){
 const s=createGame(),n=s.nations.england;n.embassies=['scotland'];n.known.push('60');n.stock.lumber=30;n.stock.castIron=30;
 const p=s.provinces.find(p=>p.owner==='scotland'&&p.town!==s.minors.scotland.capital);
 const t=s.tiles.find(t=>t.id===p.town),a=s.tiles.find(q=>q.owner==='scotland'&&neighbourIds(t).includes(q.id));
 assert.ok(t&&a);s.minors.scotland.capital=a.id;s.transportLinks={};setTransportLink(s,a.id,t.id,'road');
 t.purchasedBy='england';t.townLevel=0;
 for(const q of s.tiles.filter(q=>q.province===p.id))if(q!==t){q.resource='timber';q.level=1;}
 const u=s.civilians.find(c=>c.owner==='england'&&c.type==='builder');
 return {s,t,u,p};
}
test('purchased foreign town upgrade pays once and adds manufactured trade output after reload',()=>{
 let {s,t,u}=fixture();const before=transport(s,'scotland').incoming.lumber??0;
 s=command(s,'england',{type:'civilian',unit:u.id,job:'upgradeTown',tile:t.id});
 assert.equal(s.nations.england.stock.lumber,28);assert.equal(s.nations.england.stock.castIron,28);
 s=finish(s);assert.equal(s.tiles.find(q=>q.id===t.id).townLevel,0);
 s=finish(loadGame(saveGame(s)));assert.equal(s.tiles.find(q=>q.id===t.id).townLevel,1);
 const output=transport(s,'scotland').incoming.lumber;assert.ok(output>before);
 assert.ok(!transport(s,'england').rows.some(r=>r.tile===t.id));
 openMarket(s);assert.equal(s.minors.scotland.exportStock.lumber,output);
 assert.ok(s.minors.scotland.exportForeign.england.lumber>0);
});
test('foreign town rejects missing claim, missing embassy, and minor capital',()=>{
 const {s,t,u}=fixture();delete t.purchasedBy;assert.throws(()=>townUpgrade(s,'england',u,t),/purchased/);
 t.purchasedBy='england';s.nations.england.embassies=[];assert.throws(()=>townUpgrade(s,'england',u,t),/purchased/);
 s.nations.england.embassies=['scotland'];s.minors.scotland.capital=t.id;assert.throws(()=>townUpgrade(s,'england',u,t),/Capital/);
});
test('loss of a purchased town cancels its pending upgrade',()=>{
 const {s,t,u}=fixture();let next=command(s,'england',{type:'civilian',unit:u.id,job:'upgradeTown',tile:t.id});
 next.tiles.find(q=>q.id===t.id).purchasedBy='france';next=finish(finish(next));
 assert.equal(next.tiles.find(q=>q.id===t.id).townLevel,0);
 assert.equal(next.civilians.find(c=>c.id===u.id).order,null);
});
