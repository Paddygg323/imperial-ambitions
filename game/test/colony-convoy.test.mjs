import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,loadGame,saveGame,resolveTurn} from '../engine.mjs';
import {createConvoyInterceptor} from '../campaign-merchant.mjs';
import {blockadeTarget} from '../navy.mjs';
import {portSeas} from '../overseas.mjs';
function fixture(){
 let s=createGame({transportModel:'ports'});const minor=Object.values(s.minors).find(m=>s.provinces.some(p=>!p.old&&p.owner===m.id)&&portSeas(s,m.capital).length);minor.colonyOf='england';
 const port=minor.capital,zone=portSeas(s,port)[0];s.nations.france.revealed.push(port);s.wars=[['france','england']];s.navalSeed=0;
 s.ships=[{id:'neutral-escort',owner:'portugal',type:'carrack',hp:25,location:'home',order:null},...Array.from({length:10},(_,i)=>({id:'raider'+i,owner:'france',type:'ironclad',hp:60,location:zone,order:{job:'blockade',port,fleet:'blockade'}}))];
 s=loadGame(saveGame(s));const fleets=[{owner:'france',port,zone,code:6,ids:s.ships.filter(u=>u.owner==='france').map(u=>u.id),aggression:2}],rosters={portugal:{ids:['neutral-escort'],cargo:3}};
 const cargo={seller:minor.id,buyer:'portugal',carrier:'portugal',good:'sugarCane',quantity:3,unitPrice:40},checkpoint={nation:minor.id,port,sea:zone};
 return {s,minor:s.minors[minor.id],port,zone,intercept:()=>createConvoyInterceptor(s,fleets,rosters,()=>{throw Error('Neutral cargo must not enter hostile naval combat');})(cargo,checkpoint)};
}
test('legal blockade of enemy colony turns back neutral convoy after reload',()=>{const f=fixture();assert.equal(blockadeTarget(f.s,'france',f.port,f.zone).id,f.port);assert.equal(f.intercept(),'canc');assert.ok(f.s.reports.some(r=>r.kind==='neutralTradeCancelled'));assert.equal(f.s.ships.length,11);});
test('war with tribe alone does not substitute for war with colonial parent',()=>{const f=fixture();f.s.wars=[['france',f.minor.id]];assert.equal(f.intercept(),'okay');});
test('independent minor blockade still uses its own war',()=>{const f=fixture();delete f.minor.colonyOf;f.s.wars=[['france',f.minor.id]];assert.equal(f.intercept(),'canc');});
test('captured colony retains prior checkpoint war semantics pending native transit audit',()=>{const f=fixture(),tile=f.s.tiles.find(t=>t.id===f.port),p=f.s.provinces.find(p=>p.id===tile.province);p.owner='england';tile.owner='england';assert.equal(f.intercept(),'okay');});
test('new parent re-evaluates blockade hostility without stale English authority',()=>{const f=fixture();f.minor.colonyOf='spain';assert.equal(f.intercept(),'okay');});
test('dead parent or anarchy falls back to minor authority consistently with military control',()=>{for(const change of ['dead','anarchy']){const f=fixture();if(change==='dead')f.s.nations.england.alive=false;else f.s.provinces.find(p=>p.id===f.s.tiles.find(t=>t.id===f.port).province).anarchy=true;assert.equal(f.intercept(),'okay');}});

test('real turn cancels colonial neutral delivery without confiscating cargo or damaging escorts',()=>{const f=fixture(),before=f.s.nations.portugal.stock.sugarCane;f.minor.exportStock={...f.minor.stock};f.minor.cash+=120;f.s.nations.portugal.cash-=120;f.s.tradeDeliveries=[{seller:f.minor.id,buyer:'portugal',carrier:'portugal',good:'sugarCane',quantity:3,unitPrice:40}];f.s.market={complete:true,deals:[],inTransit:[],diplomacy:[]};const end=resolveTurn(f.s);assert.ok(end.reports.some(r=>r.kind==='neutralTradeCancelled'));assert.ok(end.reports.some(r=>r.kind==='tradeInterception'&&r.outcome==='canc'&&r.total===120));assert.equal(end.nations.portugal.stock.sugarCane,before);assert.equal(end.ships.find(u=>u.id==='neutral-escort').hp,25);assert.deepEqual(end.tradeDeliveries,[]);assert.deepEqual(loadGame(saveGame(end)),end);});
