import {createBattle as createCompleteBattle} from '../battle.mjs';
// Wall arithmetic fixtures deliberately isolate walls from automatic guns.
function createBattle({fortLevel=0,...options}){return addFortification(createCompleteBattle(options),fortLevel);}
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {addFortification,canCrossWall,damageWall,intactWall} from '../fort.mjs';
const field=activeWidth=>({width:29,height:16,activeWidth,cells:Array.from({length:464},()=>({terrain:0,unit:null}))});
test('fort layout and section health match original LoadMap across widths and levels',()=>{
 const reference=JSON.parse(fs.readFileSync(new URL('./native-fort-map-reference.json',import.meta.url)));
 for(const c of reference.cases){
  const b=addFortification(field(c.width),c.code?c.code-1:0);
  assert.deepEqual(b.cells.flatMap((cell,tile)=>cell.fort?[tile]:[]),c.wallTiles);
  assert.deepEqual(b.fortification?.segments??Array(9).fill(0),c.segments);
 }
});
test('only defenders use intact gates; breaching a section opens both of its rows',()=>{
 for(const level of [1,2,3]){
  const b=addFortification(field(23),level),column=b.fortification.column;
  for(let row=1;row<16;row++){
   const tile=row*29+column;
   assert.equal(canCrossWall(b,tile,0),false);
   assert.equal(canCrossWall(b,tile,1),[5,7,9].includes(row));
  }
  const target=6*29+column,health=b.fortification.segments[3];
  const damaged=damageWall(b,target,health-1);assert.equal(intactWall(damaged,target),true);
  const breached=damageWall(JSON.parse(JSON.stringify(damaged)),target,10);
  assert.equal(intactWall(breached,target),false);assert.equal(canCrossWall(breached,7*29+column,0),true);
  assert.equal(intactWall(breached,8*29+column),true);assert.equal(b.fortification.segments[3],health);
 }
});
test('invalid fort construction and attacks are rejected without altering state',()=>{
 const b=field(17),snapshot=structuredClone(b);
 assert.throws(()=>addFortification(b,4),/level/);assert.throws(()=>damageWall(b,32,10),/not a fort/);
 const fort=addFortification(b,1);assert.throws(()=>addFortification(fort,1),/already/);
 assert.throws(()=>damageWall(fort,40,-1),/damage/);assert.deepEqual(b,snapshot);
});

test('retreat routes respect intact walls, defender gates and attacker breaches',async()=>{
 const {retreatDistances}=await import('../battlefield.mjs');
 let b=addFortification(field(29),1);const column=b.fortification.column,inside=8*29+column+2;
 assert.equal(retreatDistances(b,0).has(inside),false);
 assert.equal(retreatDistances(b,1).has(8*29+column-2),true);
 b=damageWall(b,8*29+column,150);
 assert.equal(retreatDistances(b,0).has(inside),true);
});

test('fort protection and artillery wall damage match original FireOn cases',async()=>{
 const {fortifiedDamage,artilleryWallDamage}=await import('../tactical.mjs');
 const {ARMY}=await import('../rules.mjs');
 const names=Object.fromEntries(Object.entries(ARMY).map(([key,d])=>[d.nativeId,key]));
 const reference=JSON.parse(fs.readFileSync(new URL('./native-fort-fire-reference.json',import.meta.url)));
 for(const c of reference.cases){
  const attacker={type:names[c.attacker],hp:c.hp,medals:c.medals};
  if(c.wallTarget){
   if(ARMY[attacker.type].category<8)continue; // Native routine bypasses target legality.
   assert.equal(artilleryWallDamage(attacker),c.wallDamage[0][1],JSON.stringify(c));
  }else{
   const actual=fortifiedDamage(attacker,{type:names[c.defender]},{level:c.fortCode-1,attackerSide:c.attackerSide,intact:!c.breached});
   assert.deepEqual(actual,{physicalLoss:c.args[3],effectiveLoss:c.args[4],wallDamage:c.wallDamage[0]?.[1]??0},JSON.stringify(c));
  }
 }
 assert.throws(()=>artilleryWallDamage({type:'bowman',hp:100,medals:0}),/Only artillery/);
});

test('fort intersections and firing frontage match 216 original geometry cases',async()=>{
 const {fortCrossing,fortAllowsShot}=await import('../fort.mjs');
 const reference=JSON.parse(fs.readFileSync(new URL('./native-fort-line-reference.json',import.meta.url)));
 for(const c of reference.cases){
  const b=addFortification(field(c.width),1);if(c.breached)b.fortification.segments.fill(0);
  if(c.crossing!==null)assert.equal(fortCrossing(b,c.source,c.target),c.crossing,JSON.stringify(c));
  assert.equal(fortAllowsShot(b,c.source,c.target,{artillery:!c.smallArms}),c.allowed,JSON.stringify(c));
 }
});

test('siege commands bombard a section over turns and open it for movement',async()=>{
 const {battleCommand,openFieldPaths}=await import('../battle.mjs');
 let b=createBattle({province:'fort',attacker:'england',defender:'france',nations:{england:{known:[]},france:{known:[]}},forces:{england:[{id:'gun',owner:'england',type:'siegeGun',hp:100}],france:[{id:'guard',owner:'france',type:'pikeman',hp:100}]},activeWidth:29,cells:field(29).cells,fortLevel:1});
 Object.assign(b,{phase:'combat',activeSide:0,round:1});
 Object.assign(b.units[0],{tile:8*29+21,moveLeft:2});Object.assign(b.units[1],{tile:8*29+26});
 for(const u of b.units)b.cells[u.tile].unit=u.id;
 const wall=8*29+23;assert.equal(openFieldPaths(b,'gun').has(wall),false);
 let shots=0;
 while(intactWall(b,wall)&&shots++<17){
  b=battleCommand(b,'england',{type:'bombard',unit:'gun',tile:wall});
  assert.equal(b.units[0].fireReady,false);assert.equal(b.units[0].done,true);
  assert.throws(()=>battleCommand(b,'england',{type:'bombard',unit:'gun',tile:wall}),/available/);
  b=battleCommand(b,'england',{type:'endTurn'});b=battleCommand(b,'france',{type:'endTurn'});
  b=JSON.parse(JSON.stringify(b));
 }
 assert.ok(shots<17);assert.equal(intactWall(b,wall),false);assert.equal(b.fortification.segments[4],0);
 assert.equal(openFieldPaths(b,'gun').has(wall),true);
 b=battleCommand(b,'england',{type:'move',unit:'gun',tile:wall});assert.equal(b.units[0].tile,wall);
 assert.ok(b.log.some(e=>e.kind==='wallDamage'));assert.equal(b.units[1].hp,100);
});

test('battle targeting blocks sheltered troops and prevents ranged fire while engaged',async()=>{
 const {attackRegiment,canTargetRegiment}=await import('../battle.mjs');
 let b=createBattle({province:'fort',attacker:'england',defender:'france',nations:{england:{known:[]},france:{known:[]}},forces:{england:[{id:'a',owner:'england',type:'arquebusier',hp:100}],france:[{id:'d',owner:'france',type:'pikeman',hp:100}]},activeWidth:29,cells:field(29).cells,fortLevel:1});
 b.phase='combat';b.units[0].tile=8*29+22;b.units[1].tile=8*29+25;for(const u of b.units)b.cells[u.tile].unit=u.id;
 assert.equal(canTargetRegiment(b,...b.units),false);assert.throws(()=>attackRegiment(b,'a','d'),/wall blocks/);
 b.units[0].type='culverin';assert.equal(canTargetRegiment(b,...b.units),true);
 const shot=attackRegiment(b,'a','d');assert.ok(shot.fortification.segments[4]<150);assert.ok(shot.units[1].hp<100);
 const enemy={...b.units[1],id:'near',tile:8*29+21};b.units.push(enemy);b.cells[enemy.tile].unit=enemy.id;
 assert.equal(canTargetRegiment(b,b.units[0],b.units[1]),false);
 assert.throws(()=>attackRegiment(b,'a','d'),/adjacent enemy/);
});

test('bombardment targeting excludes hidden rows, occupied walls and unavailable guns',async()=>{
 const {canBombardWall,battleCommand}=await import('../battle.mjs');
 const b=createBattle({province:'fort',attacker:'england',defender:'france',nations:{england:{known:[]},france:{known:[]}},forces:{england:[{id:'gun',owner:'england',type:'culverin',hp:100}],france:[{id:'guard',owner:'france',type:'pikeman',hp:100}]},activeWidth:29,cells:field(29).cells,fortLevel:1});
 Object.assign(b,{phase:'combat',activeSide:0,round:1});
 const gun=b.units[0],wall=255;gun.tile=253;b.cells[253].unit=gun.id;
 assert.equal(canBombardWall(b,gun,wall),true);
 for(const changes of [{done:true},{fireReady:false},{movedThisTurn:true},{type:'pikeman'},{tile:null},{state:1}])assert.equal(canBombardWall(b,{...gun,...changes},wall),false);
 for(const tile of [-1,23,464,253,1.5])assert.equal(canBombardWall(b,gun,tile),false);
 const occupied=structuredClone(b);occupied.units[1].tile=wall;occupied.cells[wall].unit='guard';
 assert.equal(canBombardWall(occupied,occupied.units[0],wall),false);
 assert.throws(()=>battleCommand(occupied,'england',{type:'bombard',unit:'gun',tile:wall}),/unoccupied intact wall/);
 const engaged=structuredClone(b);engaged.units[1].tile=252;engaged.cells[252].unit='guard';
 assert.equal(canBombardWall(engaged,engaged.units[0],wall),false);
});
