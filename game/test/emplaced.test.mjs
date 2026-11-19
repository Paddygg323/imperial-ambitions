import {addFortification} from '../fort.mjs';
import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createBattle,battleCommand,openFieldPaths,canTargetRegiment,attackRegiment} from '../battle.mjs';
import {installEmplacedGuns,regimentRange} from '../emplaced.mjs';
import {stepBattleAI} from '../battle-ai.mjs';
function fixture(level=1){return addFortification(createBattle({province:'fort',attacker:'england',defender:'france',forces:{england:[{id:'a',owner:'england',type:'pikeman',hp:100}],france:Array.from({length:12},(_,i)=>({id:'d'+i,owner:'france',type:'pikeman',hp:100}))},nations:{england:{known:[]},france:{known:[]}},activeWidth:29,cells:Array.from({length:464},()=>({terrain:0}))}),level);}
test('fort level supplies guns independently of research quality and mobile cap',()=>{
 for(const level of [1,2,3])for(const [known,type] of [[[],'royalArtillery'],[['64'],'heavyArtillery'],[['97'],'siegeGun']]){
  const source=fixture(level),snapshot=structuredClone(source);
  let b=installEmplacedGuns(source,{known},[255,197,313].slice(0,level));
  assert.deepEqual(source,snapshot);assert.equal(b.units.filter(u=>u.emplaced).length,level);
  for(const u of b.units.filter(u=>u.emplaced))assert.equal(u.type,type);
  while(!b.ready[1])b=stepBattleAI(b,'france');
  assert.equal(b.units.filter(u=>u.side===1&&u.tile!==null&&!u.emplaced).length,10);
  assert.equal(b.units.filter(u=>u.emplaced&&u.tile!==null).length,level);
  assert.equal(b.units.filter(u=>u.side===1&&u.tile===null).length,2);
 }
});
test('emplaced guns cannot redeploy or move, and receive extra firing range',()=>{
 let b=installEmplacedGuns(fixture(),{known:[]},[255]);const gun=b.units.at(-1);
 assert.throws(()=>battleCommand(b,'france',{type:'undeploy',unit:gun.id}),/cannot be redeployed/);
 assert.throws(()=>battleCommand(b,'france',{type:'deploy',unit:gun.id,tile:256}),/cannot be redeployed/);
 Object.assign(b,{phase:'combat',activeSide:1,round:1});
 Object.assign(b.units[0],{tile:246});b.cells[246].unit='a';
 assert.equal(regimentRange(gun),9);assert.equal(canTargetRegiment(b,gun,b.units[0]),true);
 assert.equal(canTargetRegiment(b,{...gun,emplaced:false},b.units[0]),false);
 assert.equal(openFieldPaths(b,gun.id).size,0);
 assert.throws(()=>battleCommand(b,'france',{type:'move',unit:gun.id,tile:256}));
 const shot=attackRegiment(JSON.parse(JSON.stringify(b)),gun.id,'a');assert.ok(shot.units[0].hp<100);
});
test('invalid emplacement layouts are rejected atomically',()=>{
 const b=fixture(2),snapshot=structuredClone(b);
 for(const tiles of [[255],[255,255],[0,255],[249,255],[255,464]])assert.throws(()=>installEmplacedGuns(b,{known:[]},tiles));
 assert.deepEqual(b,snapshot);
 const installed=installEmplacedGuns(b,{known:[]},[255,313]);
 assert.throws(()=>installEmplacedGuns(installed,{known:[]},[197,371]),/once/);
});

test('automatic emplacements match captured original layouts and defend an empty fort',()=>{
 const ref=JSON.parse(fs.readFileSync(new URL('./native-emplacement-layout-reference.json',import.meta.url)));
 for(const width of [17,23,29])for(const level of [1,2,3]){
  const b=createBattle({province:'fort',attacker:'england',defender:'france',forces:{england:[{id:'a',owner:'england',type:'pikeman',hp:100}],france:[]},nations:{england:{known:[]},france:{known:['64']}},activeWidth:width,fortLevel:level,cells:Array.from({length:464},()=>({terrain:0}))});
  assert.deepEqual(b.units.filter(u=>u.emplaced).map(u=>u.tile),ref.cases.filter(c=>c.width===width&&c.index<level).map(c=>c.tile));
  const ready=battleCommand(b,'france',{type:'ready'});assert.equal(ready.ready[1],true);
 }
});

test('automatically armed forts fight to an outcome without mobile defenders',()=>{
 for(const level of [1,2,3]){
  let b=createBattle({province:'fort',attacker:'england',defender:'france',forces:{england:['horseArtillery','horseArtillery','arquebusier'].map((type,i)=>({id:'a'+i,owner:'england',type,hp:100})),france:[]},nations:{england:{known:[]},france:{known:[]}},activeWidth:29,fortLevel:level,cells:Array.from({length:464},()=>({terrain:0}))});
  for(const owner of ['england','france'])while(b.phase==='deployment'&&!b.ready[owner==='england'?0:1])b=stepBattleAI(b,owner);
  let steps=0;
  while(b.phase!=='finished'&&steps++<1500)b=stepBattleAI(JSON.parse(JSON.stringify(b)),b.activeSide===0?'england':'france');
  assert.equal(b.phase,'finished',JSON.stringify({level,steps,round:b.round}));
  assert.ok(b.log.some(e=>e.kind==='attack'&&e.unit.startsWith('fort:')));
  for(const gun of b.units.filter(u=>u.emplaced))assert.ok(gun.tile===null||[314,82,372].includes(gun.tile));
 }
});

test('breaking an emplaced gun collapses its front wall section immediately',()=>{
 let b=createBattle({province:'fort',attacker:'england',defender:'france',forces:{england:[{id:'a',owner:'england',type:'horseArtillery',hp:100}],france:[]},nations:{england:{known:[]},france:{known:[]}},activeWidth:29,fortLevel:3,cells:Array.from({length:464},()=>({terrain:0}))});
 Object.assign(b,{phase:'combat',activeSide:0,round:1});
 b.units[0].tile=311;b.cells[311].unit='a';const gun=b.units.find(u=>u.emplaced);gun.effective=1;
 const before=structuredClone(b),after=attackRegiment(b,'a',gun.id);
 assert.equal(after.units.find(u=>u.id===gun.id).state,1);
 assert.equal(after.fortification.segments[5],0);assert.equal(after.fortification.segments[4],300);
 assert.deepEqual(b,before);assert.ok(after.log.some(e=>e.source==='emplacementLost'));
});
