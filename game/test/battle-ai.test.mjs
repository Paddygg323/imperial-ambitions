import test from 'node:test';
import assert from 'node:assert/strict';
import {createBattle,battleCommand} from '../battle.mjs';
import {chooseBattleAction,stepBattleAI} from '../battle-ai.mjs';
function battle(typesA,typesD,seed=1){
 const forces={};for(const [owner,types] of [['england',typesA],['france',typesD]])forces[owner]=types.map((type,i)=>({id:owner+i,owner,type,hp:100,medals:type==='general'?2:0}));
 return createBattle({province:'test',attacker:'england',defender:'france',forces,nations:{england:{known:[]},france:{known:[]}},activeWidth:29,seed,cells:Array.from({length:464},()=>({terrain:0}))});
}
function deploy(b){for(const owner of ['england','france'])while(b.phase==='deployment'&&!b.ready[owner==='england'?0:1])b=stepBattleAI(b,owner);return b;}

test('mixed-terrain battles play through deployment, weighted movement and combat to a result',()=>{
 for(const seed of [1,2,3]){
  let b=battle(['regular','caliverman','horseArtillery'],['pikeman','arquebusier','bowman'],seed);
  for(let tile=0;tile<b.cells.length;tile++)b.cells[tile].terrain=(tile*13+Math.floor(tile/29)*7+seed)%4;
  // A barrier with gaps forces navigation rather than a straight-line march.
  for(let y=2;y<15;y++)if(y!==7&&y!==11)b.cells[y*29+14].terrain=4;
  b=deploy(b);let steps=0;
  while(b.phase!=='finished'&&steps++<900){
   b=JSON.parse(JSON.stringify(b));
   b=stepBattleAI(b,b.activeSide===0?'england':'france');
   for(const u of b.units)if(u.tile!==null)assert.notEqual(b.cells[u.tile].terrain,4);
  }
  assert.equal(b.phase,'finished',JSON.stringify({seed,steps,round:b.round}));
  assert.ok(b.log.some(e=>e.kind==='attack'));
 }
});
test('AI respects human handover and deployment limits without deleting reserves',()=>{
 let b=battle(Array(14).fill('pikeman'),['pikeman']);b=deploy(b);
 assert.equal(b.units.filter(u=>u.side===0&&u.tile===null).length,4);
 const before=structuredClone(b);assert.equal(stepBattleAI(b,'france'),b);assert.deepEqual(b,before);
 assert.throws(()=>chooseBattleAction(b,'spain'),/not part/);
});
test('mixed-arms AI battles reach outcomes using legal commands and survive save/load',()=>{
 for(const [a,d] of [
  [['pikeman'],['pikeman']],
  [['arquebusier','pikeman'],['pikeman','pikeman']],
  [['horseArtillery','hussar','general'],['culverin','regular','general']],
  [['guard','carbineCavalry'],['sharpshooter','lightArtillery']]
 ]){
  let b=deploy(battle(a,d));let steps=0;
  while(b.phase!=='finished'&&steps++<700){
   b=JSON.parse(JSON.stringify(b));const nation=b.activeSide===0?'england':'france',before=structuredClone(b);
   const action=chooseBattleAction(b,nation);assert.ok(action);assert.deepEqual(b,before);
   b=battleCommand(b,nation,action);
  }
  assert.equal(b.phase,'finished',JSON.stringify({a,d,round:b.round,steps}));
  assert.ok(b.log.some(e=>e.kind==='attack'));assert.equal(b.units.length,a.length+d.length);
  for(const u of b.units){assert.ok(u.hp>=0&&u.hp<=100);if(u.tile!==null)assert.equal(b.cells[u.tile].unit,u.id);}
 }
});

test('AI rallies adjacent damaged allies and never changes the input state',()=>{
 let b=deploy(battle(['general','pikeman'],['pikeman']));
 const general=b.units.find(u=>u.type==='general'),ally=b.units.find(u=>u.id==='england1');
 // Put the damaged ally next to its general, preserving occupancy.
 b.cells[ally.tile].unit=null;ally.tile=general.tile+1;b.cells[ally.tile].unit=ally.id;ally.effective=20;
 const snapshot=structuredClone(b),action=chooseBattleAction(b,'england');
 assert.deepEqual(action,{type:'rally',unit:general.id});assert.deepEqual(b,snapshot);
 const r=stepBattleAI(b,'england');assert.ok(r.units.find(u=>u.id===ally.id).effective>20);
});

test('siege AI completes fortified mixed-arms battles through legal persisted commands',async()=>{
 const {addFortification}=await import('../fort.mjs');
 for(const level of [1,2,3]){
  let b=deploy(addFortification(battle(['siegeGun','regular','regular'],['arquebusier','pikeman']),level));
  let steps=0;
  while(b.phase!=='finished'&&steps++<1000){
   b=JSON.parse(JSON.stringify(b));const before=structuredClone(b);
   const action=chooseBattleAction(b,b.activeSide===0?'england':'france');assert.deepEqual(b,before);
   b=battleCommand(b,b.activeSide===0?'england':'france',action);
  }
  assert.equal(b.phase,'finished',JSON.stringify({level,steps,round:b.round}));
  assert.ok(b.log.some(e=>e.kind==='attack'));assert.equal(b.units.length,5);
  for(const u of b.units)if(u.tile!==null)assert.equal(b.cells[u.tile].unit,u.id);
 }
});

test('attacking siege AI bombards an intact section when no enemy is exposed',async()=>{
 const {addFortification}=await import('../fort.mjs');
 let b=addFortification(battle(['culverin'],['pikeman']),1);
 Object.assign(b,{phase:'combat',activeSide:0,round:1});
 Object.assign(b.units[0],{tile:253,moveLeft:2});Object.assign(b.units[1],{tile:346});
 for(const u of b.units)b.cells[u.tile].unit=u.id;
 const action=chooseBattleAction(b,'england');assert.equal(action.type,'bombard');
 const after=battleCommand(b,'england',action);assert.ok(after.fortification.segments.some(h=>h<150));
 assert.equal(after.units[0].fireReady,false);
});

test('infantry siege AI routes around an intact wall to a distant breach',async()=>{
 const {addFortification,damageWall}=await import('../fort.mjs');
 let b=damageWall(addFortification(battle(['pikeman'],['pikeman']),1),4*29+23,150);
 Object.assign(b,{phase:'combat',activeSide:0,round:1});
 Object.assign(b.units[0],{tile:253,moveLeft:2});Object.assign(b.units[1],{tile:258});
 for(const u of b.units)b.cells[u.tile].unit=u.id;
 let attacked=false;
 for(let step=0;step<100&&b.phase==='combat';step++){
  if(b.activeSide===1){b=battleCommand(b,'france',{type:'endTurn'});continue;}
  const action=chooseBattleAction(b,'england');
  b=battleCommand(b,'england',action);
  if(action.type==='attack'){attacked=true;break;}
 }
 assert.equal(attacked,true);assert.ok(b.units[0].tile%29>=23);
 assert.equal(b.fortification.segments[4],150);
});
test('siege focus skips an occupied central wall and retains a shared legal breach target',async()=>{
 const {addFortification}=await import('../fort.mjs');const {siegeBreachTile}=await import('../battle-ai.mjs');
 let b=addFortification(battle(['siegeGun','royalArtillery'],['pikeman']),1);
 const center=Math.floor(b.height/2)*b.width+b.fortification.column;assert.equal(siegeBreachTile(b),center);
 const defender=b.units.find(u=>u.side===1);defender.tile=center;b.cells[center].unit=defender.id;
 const before=structuredClone(b),focus=siegeBreachTile(b);assert.notEqual(focus,center);assert.ok(b.cells[focus].fort);assert.ok(!b.cells[focus].unit);assert.deepEqual(b,before);
 Object.assign(b,{phase:'combat',activeSide:0,round:1});let col=2;
 for(const u of b.units.filter(u=>u.side===0)){u.tile=8*29+col++;u.moveLeft=3;b.cells[u.tile].unit=u.id;}
 const action=chooseBattleAction(b,'england');assert.equal(action.type,'move');const after=battleCommand(b,'england',action);assert.notEqual(after.units.find(u=>u.id===action.unit).tile,b.units.find(u=>u.id===action.unit).tile);
});
test('an attacker without surviving guns retreats from an intact fort through normal movement',async()=>{
 const {addFortification}=await import('../fort.mjs');let b=deploy(addFortification(battle(['pikeman'],['pikeman']),1));
 assert.deepEqual(chooseBattleAction(b,'england'),{type:'retreat'});const before=b.units[0].tile;
 b=stepBattleAI(b,'england');assert.equal(b.retreating[0],true);assert.equal(b.units[0].tile,before,'retreat does not remove units immediately');
 let steps=0;while(b.phase!=='finished'&&steps++<100)b=stepBattleAI(JSON.parse(JSON.stringify(b)),b.activeSide===0?'england':'france');
 assert.equal(b.phase,'finished');assert.equal(b.winner,'france');
});

test('manual light-artillery assault draws fort fire with infantry before three guns advance',()=>{
 for(const activeWidth of [17,29])for(const seed of [1,2,3]){
  let b=createBattle({province:'manual-diversion',attacker:'england',defender:'france',forces:{england:['musketeer','horseArtillery','horseArtillery','horseArtillery'].map((type,i)=>({id:'manual'+i,owner:'england',type,hp:100,experience:0})),france:[]},nations:{england:{known:[]},france:{known:[]}},activeWidth,seed,fortLevel:1,cells:Array.from({length:464},()=>({terrain:0}))});
  b=deploy(b);let steps=0;
  while(b.phase!=='finished'&&steps++<500){b=JSON.parse(JSON.stringify(b));b=stepBattleAI(b,b.activeSide===0?'england':'france');}
  assert.equal(b.phase,'finished');assert.equal(b.winner,'england');
  assert.equal(b.log.find(e=>e.kind==='opportunity')?.target,'manual0','infantry must draw the first opportunity shot');
  assert.ok(b.log.some(e=>e.kind==='attack'&&['manual1','manual2','manual3'].includes(e.attacker??e.unit)),'light artillery fires through normal commands');
 }
});
