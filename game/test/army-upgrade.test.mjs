import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {armyUpgradeTo,armyUpgrade} from '../army-upgrade.mjs';
import {createGame,command,saveGame,loadGame} from '../engine.mjs';import {TECHS} from '../rules.mjs';
test('regiment upgrade target/material quotes match104 native cases',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-army-upgrade-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,104);assert.equal(audit.mutations.length,208);
 for(const c of audit.cases)assert.deepEqual(armyUpgradeTo(c.source,c.available),c.target?{type:c.target,goods:c.goods}:null);
});
test('live regiment upgrade spends target materials, preserves veteran identity and workers, and saves',()=>{
 let s=createGame();const n=s.nations.england;n.known=Object.keys(TECHS);for(const g of Object.keys(n.stock))n.stock[g]=100;
 const u=addUnit(s);Object.assign(u,{type:'levy',hp:61,experience:3,name:'Veterans',order:{job:'defend'},defending:true});
 const quote=armyUpgrade(n,u);assert.equal(quote.type,'sharpshooter');const before=structuredClone(u),stock={...n.stock},workers=structuredClone(n.workers);
 s=loadGame(saveGame(command(s,'england',{type:'upgradeArmy',unit:u.id})));
 assert.deepEqual(s.armies.find(x=>x.id===u.id),{...before,type:quote.type});assert.deepEqual(s.nations.england.workers,workers);
 for(const [g,q] of Object.entries(stock))assert.equal(s.nations.england.stock[g],q-(quote.goods[g]??0));
 assert.throws(()=>command(s,'england',{type:'upgradeArmy',unit:u.id}),/No researched/);
});
test('upgrade rejects absent research, foreign regiments and insufficient materials without partial payment',()=>{
 const s=createGame(),n=s.nations.england,u=addUnit(s);u.type='levy';n.known=[];
 assert.throws(()=>command(s,'england',{type:'upgradeArmy',unit:u.id}),/No researched/);
 n.known=Object.keys(TECHS);for(const g of Object.keys(n.stock))n.stock[g]=0;const before=saveGame(s);
 assert.throws(()=>command(s,'england',{type:'upgradeArmy',unit:u.id}),/Not enough/);assert.equal(saveGame(s),before);
 assert.throws(()=>command(s,'france',{type:'upgradeArmy',unit:u.id}),/not owned/);
});

function addUnit(s){const u={id:'veteran',owner:'england',type:'levy',hp:100,experience:0,order:null,province:s.tiles.find(t=>t.id===s.nations.england.capital).province};s.armies.push(u);return u;}