import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,command,saveGame,loadGame} from '../engine.mjs';
import {planMilitary} from '../ai-military.mjs';import {planEconomy} from '../ai.mjs';
import {armyUpgradeReserve,planArmyUpgrades} from '../ai-army-upgrades.mjs';import {ARMY,TECHS} from '../rules.mjs';
function fixture(){const s=createGame(),n=s.nations.france;n.known=Object.keys(TECHS);for(const g of Object.keys(n.stock))n.stock[g]=100;
 const province=s.tiles.find(t=>t.id===n.capital).province;s.armies=[];
 for(let i=0;i<3;i++)s.armies.push({id:'veteran'+i,owner:'france',province,type:'levy',hp:100,experience:i,order:null});return s;}
test('military AI upgrades veterans with real materials, preserves workforce and limits per-turn spending',()=>{
 const s=fixture(),n=s.nations.france,workers=structuredClone(n.workers),quote=ARMY.sharpshooter.cost.goods;
 const end=loadGame(saveGame(planMilitary(s,'france',command)));
 assert.equal(end.armies.filter(u=>u.type==='sharpshooter').length,2);
 assert.equal(end.armies.find(u=>u.id==='veteran0').type,'levy');
 for(const [g,q] of Object.entries(n.stock))assert.equal(end.nations.france.stock[g],q-2*(quote[g]??0));
 assert.deepEqual(end.nations.france.workers,workers);assert.equal(end.armies.find(u=>u.id==='veteran2').experience,2);
});
test('AI retains construction seed supplies and leaves injured, ordered and human armies alone',()=>{
 const s=fixture(),n=s.nations.france;assert.ok(armyUpgradeReserve(s,'france').fabric>=ARMY.sharpshooter.cost.goods.fabric+4);
 for(const g of Object.keys(n.stock))n.stock[g]=0;for(const [g,q] of Object.entries(ARMY.sharpshooter.cost.goods))n.stock[g]=q;
 assert.equal(planArmyUpgrades(s,'france',command),s);
 for(const g of Object.keys(n.stock))n.stock[g]=100;
 s.armies[0].hp=20;s.armies[1].order={job:'deploy',province:s.armies[1].province};s.armies[2].owner='england';
 assert.equal(planArmyUpgrades(s,'france',command),s);assert.equal(planArmyUpgrades(s,'england',command),s);
});
test('economy earmarks upgrade materials instead of exporting below their cost',()=>{
 const s=fixture();s.civilians=[];const need=armyUpgradeReserve(s,'france');
 const end=planEconomy(s,'france',command),n=end.nations.france;
 for(const [g,q] of Object.entries(need))assert.ok(n.stock[g]-(n.orders.trade.offers[g]??0)>=q);
});
test('large artillery upgrades keep importing coal beyond the ordinary steel buffer',()=>{
 const s=fixture();s.civilians=[];s.armies=s.armies.slice(0,1);s.armies[0].type='culverin';
 s.nations.france.stock.steel=10;s.nations.france.stock.coal=0;
 assert.equal(armyUpgradeReserve(s,'france').steel,20);
 const end=planEconomy(s,'france',command);assert.ok(end.nations.france.orders.trade.bids.includes('coal'));
});
test('upgrade planning clears multiple stale unaffordable manufacturing orders atomically',()=>{
 const s=fixture(),n=s.nations.france;n.stock.wool=0;n.stock.timber=0;
 n.orders.production.woolFabric=4;n.orders.production.lumber=4;
 const end=planArmyUpgrades(s,'france',command);
 assert.equal(end.armies.filter(u=>u.type==='sharpshooter').length,2);
 assert.ok(Object.values(end.nations.france.orders.production).every(q=>q===0));
 assert.equal(end.nations.france.stock.wool,0);assert.equal(end.nations.france.stock.timber,0);
});

test('colonial veterans upgrade through real commands while their province stays economically independent',()=>{
 let s=fixture();const colony=s.provinces.find(p=>!p.old);s.minors[colony.owner].colonyOf='france';
 for(const u of s.armies)u.province=colony.id;
 s=loadGame(saveGame(s));const before=structuredClone(s.nations.france.stock),workers=structuredClone(s.nations.france.workers);
 const end=loadGame(saveGame(planArmyUpgrades(s,'france',command)));
 assert.equal(end.armies.filter(u=>u.type==='sharpshooter').length,2);assert.equal(end.provinces.find(p=>p.id===colony.id).owner,colony.owner);
 assert.deepEqual(end.nations.france.workers,workers);
 for(const [good,cost] of Object.entries(ARMY.sharpshooter.cost.goods))assert.equal(end.nations.france.stock[good],before[good]-2*cost);
 s.minors[colony.owner].colonyOf='spain';assert.deepEqual(armyUpgradeReserve(s,'france'),{});
});
