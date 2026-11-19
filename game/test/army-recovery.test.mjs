import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {recoveredArmyHealth} from '../army-recovery.mjs';
import {createGame,command,resolveTurn,saveGame,loadGame} from '../engine.mjs';
import {resolveArmies} from '../army.mjs';
test('stationary recovery matches300 executed native destination and health cases',()=>{
 const {cases}=JSON.parse(readFileSync(new URL('./native-army-recovery.json',import.meta.url)));
 assert.equal(cases.length,300);for(const c of cases)assert.equal(recoveredArmyHealth(c.hp,c.destination!==-1),c.result);
 assert.equal(recoveredArmyHealth(0),0);
});
function fixture(){const s=createGame();s.nations={england:s.nations.england};s.ships=[];s.civilians=[];s.construction=[];
 const province=s.provinces.find(p=>p.owner==='england').id;
 s.armies=[{id:'hurt',owner:'england',type:'pikeman',province,hp:31,experience:120,order:null}];return s;}
test('recovery survives saved consecutive turns without spending replacement workers or medals',()=>{
 let s=fixture();s.market={complete:true,deals:[],inTransit:[],diplomacy:[]};
 for(const hp of [51,71,91,100]){s=resolveTurn(loadGame(saveGame(s)));assert.equal(s.armies[0].hp,hp);assert.equal(s.armies[0].experience,120);s.market={complete:true,deals:[],inTransit:[],diplomacy:[]};}
});
test('redeployment skips recovery that turn; done and defend recover; dead entries never revive',()=>{
 for(const job of ['deploy','done','defend']){
  let s=fixture();const target=s.provinces.find(p=>p.owner==='england'&&p.id!==s.armies[0].province);
  s=command(s,'england',{type:'army',units:['hurt'],job,province:target.id});resolveArmies(s);
  assert.equal(s.armies[0].hp,job==='deploy'?31:51);resolveArmies(s);assert.equal(s.armies[0].hp,job==='deploy'?51:71);
 }
 const s=fixture();s.armies[0].hp=0;resolveArmies(s);assert.equal(s.armies[0].hp,0);
});
