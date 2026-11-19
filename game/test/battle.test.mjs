import test from 'node:test';
import assert from 'node:assert/strict';
import {createBattle,battleCommand,deploymentLimit,attackOpenField,openFieldPaths} from '../battle.mjs';
import {openFieldDamage} from '../tactical.mjs';
import {deploymentTiles} from '../battlefield.mjs';
import {tacticalDistance} from '../battlefield.mjs';
function fixture(known=[]){
 const nations={england:{known},france:{known:[]}},forces={};
 for(const owner of Object.keys(nations))forces[owner]=Array.from({length:14},(_,i)=>({id:owner+i,owner,type:'pikeman',hp:80,experience:3}));
 return createBattle({province:'e1',attacker:'england',defender:'france',nations,forces,activeWidth:17,cells:Array.from({length:464},()=>({terrain:0}))});
}
function combatFixture({type='pikeman',targetType='pikeman',targetHp=80,distance=1}={}){
 const b=fixture();b.phase='combat';b.activeSide=0;b.round=1;b.units=b.units.filter(u=>u.id==='england0'||u.id==='france0');
 const [a,d]=b.units;a.type=type;d.type=targetType;d.hp=d.effective=targetHp;a.tile=100;d.tile=100+distance;b.cells[a.tile].unit=a.id;b.cells[d.tile].unit=d.id;return b;
}
test('melee retaliation uses surviving health and cannot be made by a broken defender',()=>{
 const b=combatFixture(),result=attackOpenField(b,'england0','france0');
 assert.equal(result.log.length,2);assert.equal(result.log[1].counter,true);
 const initial= openFieldDamage(b.units[0],b.units[1],{melee:true});
 const reply=openFieldDamage({...b.units[1],hp:80-initial.physicalLoss},b.units[0],{melee:true});
 assert.equal(result.units[0].hp,80-reply.physicalLoss);assert.equal(b.log.length,0);
 const broken=attackOpenField(combatFixture({targetHp:5}),'england0','france0');assert.equal(broken.log.length,1);
});
test('ranged fire consumes the shot without a melee counterattack',()=>{
 const b=combatFixture({type:'arquebusier',distance:3});const r=attackOpenField(b,'england0','france0');
 assert.equal(r.log.length,1);assert.equal(r.units[0].hp,80);assert.equal(r.units[0].fireReady,false);
 assert.throws(()=>attackOpenField(r,'england0','france0'),/already fired/);
});
test('adjacent broken targets receive the stronger weapon without retaliation',()=>{
 for(const type of ['arquebusier','pikeman']){
  const b=combatFixture({type});b.units[1].state=1;b.units[1].effective=0;
  const r=attackOpenField(JSON.parse(JSON.stringify(b)),'england0','france0');
  const melee=type==='pikeman',loss=openFieldDamage(b.units[0],b.units[1],{melee});
  assert.equal(r.log.length,1);assert.equal(r.log[0].melee,melee);
  assert.equal(r.units[1].hp,Math.max(0,b.units[1].hp-loss.physicalLoss));
  assert.equal(r.units[0].hp,b.units[0].hp);assert.equal(r.units[0].fireReady,false);
  assert.equal(b.units[0].fireReady,true);
 }
});
test('combat rejects range, friendly targets and unaudited fort terrain atomically',()=>{
 const b=combatFixture({type:'arquebusier',distance:5});assert.throws(()=>attackOpenField(b,'england0','france0'),/range/);
 assert.throws(()=>attackOpenField(b,'england0','england0'),/enemy/);
 const c=combatFixture();c.cells[100].fort=1;assert.throws(()=>attackOpenField(c,'england0','france0'),/open-field/);assert.equal(c.units[0].hp,80);
});
test('deployment cap preserves excess troops as reserves and Nationalism increases it',()=>{
 for(const [known,cap] of [[[],10],[['95'],12]]){
  let b=fixture(known);
  for(let i=0;i<cap;i++)b=battleCommand(b,'england',{type:'deploy',unit:'england'+i,tile:deploymentTiles(b,0)[0]});
  assert.throws(()=>battleCommand(b,'england',{type:'deploy',unit:'england'+cap,tile:deploymentTiles(b,0)[0]}),/limit/);
  assert.equal(b.units.filter(u=>u.side===0&&u.tile===null).length,14-cap);
 }
 assert.equal(deploymentLimit({known:[]},[{type:'general',medals:2},{type:'general',medals:3}]),13);
});
test('individual placement, repositioning and undeployment retain regiment health and identity',()=>{
 let b=fixture();b=battleCommand(b,'england',{type:'deploy',unit:'england0',tile:32});
 b=battleCommand(b,'england',{type:'deploy',unit:'england0',tile:33});assert.equal(b.cells[32].unit,null);assert.equal(b.cells[33].unit,'england0');
 b=JSON.parse(JSON.stringify(b));b=battleCommand(b,'england',{type:'undeploy',unit:'england0'});
 assert.equal(b.units[0].tile,null);assert.equal(b.units[0].hp,80);assert.equal(b.units[0].experience,3);
});
test('foreign, blocked and occupied deployment is atomic',()=>{
 let b=fixture();b.cells[32].terrain=4;const before=structuredClone(b);
 for(const action of [{type:'deploy',unit:'france0',tile:33},{type:'deploy',unit:'england0',tile:32},{type:'deploy',unit:'england0',tile:41}])assert.throws(()=>battleCommand(b,'england',action));
 assert.deepEqual(b,before);b=battleCommand(b,'england',{type:'deploy',unit:'england0',tile:33});
 assert.throws(()=>battleCommand(b,'england',{type:'deploy',unit:'england1',tile:33}),/unoccupied/);
});
test('both sides must finish deployment before the attacker receives the first turn',()=>{
 let b=fixture();assert.throws(()=>battleCommand(b,'england',{type:'ready'}),/at least/);
 b=battleCommand(b,'england',{type:'deploy',unit:'england0',tile:32});b=battleCommand(b,'england',{type:'ready'});
 assert.equal(b.phase,'deployment');assert.throws(()=>battleCommand(b,'england',{type:'undeploy',unit:'england0'}),/finished/);
 b=battleCommand(b,'france',{type:'deploy',unit:'france0',tile:41});b=battleCommand(b,'france',{type:'ready'});
 assert.equal(b.phase,'combat');assert.equal(b.activeSide,0);assert.equal(b.round,1);
});
test('movement consumes allowance, respects occupancy, and can provoke reserved fire',()=>{
 let b=combatFixture({targetType:'arquebusier',distance:3});b.units[0].moveLeft=3;
 assert.equal(openFieldPaths(b,'england0').has(103),false);
 const r=battleCommand(b,'england',{type:'move',unit:'england0',tile:101});
 assert.equal(r.units[0].tile,101);assert.equal(r.units[0].moveLeft,2);assert.ok(r.units[0].hp<80);
 assert.equal(r.units[1].fireReady,false);assert.ok(r.log.some(e=>e.kind==='opportunity'));
 assert.equal(b.units[0].tile,100);
});
test('done preserves reserved fire; end turn offers unused enemy fire and hands over',()=>{
 let b=combatFixture({targetType:'arquebusier',distance:3});b=battleCommand(b,'england',{type:'done',unit:'england0'});
 assert.equal(b.units[0].fireReady,true);
 assert.throws(()=>battleCommand(b,'england',{type:'attack',unit:'england0',target:'france0'}),/available/);
 b=battleCommand(b,'england',{type:'endTurn'});assert.equal(b.activeSide,1);assert.ok(b.units[0].hp<80);
 assert.equal(b.units[1].fireReady,true);assert.equal(b.units[1].moveLeft,2);
 assert.throws(()=>battleCommand(b,'england',{type:'endTurn'}),/Wait/);
});
test('deployment, advancing, melee turns and outcome run as one serialized battle',()=>{
 let b=fixture();b=battleCommand(b,'england',{type:'deploy',unit:'england0',tile:32});b=battleCommand(b,'england',{type:'ready'});
 b=battleCommand(b,'france',{type:'deploy',unit:'france0',tile:41});b=battleCommand(b,'france',{type:'ready'});
 for(let i=0;i<40&&b.phase!=='finished';i++){
  b=JSON.parse(JSON.stringify(b));const side=b.activeSide,nation=side===0?'england':'france';
  let unit=b.units.find(u=>u.side===side&&u.tile!==null&&u.state===0),enemy=b.units.find(u=>u.side!==side&&u.tile!==null&&u.state===0);
  if(!unit||!enemy){b=battleCommand(b,nation,{type:'endTurn'});continue;}
  const distance=()=>tacticalDistance(unit.tile,enemy.tile);
  if(distance()>1){
   const moves=[...openFieldPaths(b,unit.id).keys()].sort((a,c)=>tacticalDistance(a,enemy.tile)-tacticalDistance(c,enemy.tile));
   if(moves[0]!==unit.tile)b=battleCommand(b,nation,{type:'move',unit:unit.id,tile:moves[0]});
   unit=b.units.find(u=>u.id===unit.id);enemy=b.units.find(u=>u.id===enemy.id);
  }
  if(b.phase==='combat'&&distance()===1)b=battleCommand(b,nation,{type:'attack',unit:unit.id,target:enemy.id});
  if(b.phase==='combat')b=battleCommand(b,nation,{type:'endTurn'});
 }
 assert.equal(b.phase,'finished');assert.ok(['england','france'].includes(b.winner));
 assert.equal(b.units.filter(u=>u.tile===null&&u.state===0).length,26);assert.ok(b.log.some(e=>e.kind==='attack'));assert.equal(b.log.at(-1).kind,'outcome');
});

test('heavy artillery cannot move and fire on its turn; light artillery can',()=>{
 for(const type of ['culverin','royalArtillery','heavyArtillery','siegeGun','horseArtillery','lightArtillery','fieldArtillery']){
  let b=combatFixture({type,targetHp:100,distance:4});b.units[0].moveLeft=2;
  b=battleCommand(b,'england',{type:'move',unit:'england0',tile:101});
  assert.equal(b.units[0].movedThisTurn,true);
  b=JSON.parse(JSON.stringify(b));const before=structuredClone(b);
  const heavy=['culverin','royalArtillery','heavyArtillery','siegeGun'].includes(type);
  if(heavy){
   assert.throws(()=>battleCommand(b,'england',{type:'attack',unit:'england0',target:'france0'}),/heavy artillery has moved/);
   assert.deepEqual(b,before);assert.equal(b.units[0].fireReady,true);
  }else{
   const r=battleCommand(b,'england',{type:'attack',unit:'england0',target:'france0'});
   assert.ok(r.units[1].hp<100);assert.equal(r.units[0].fireReady,false);assert.equal(r.units[0].done,true);
  }
 }
});

test('moved heavy artillery attracts only end-turn fire and reserves its own shot for the enemy turn',()=>{
 let b=combatFixture({type:'culverin',targetType:'arquebusier',targetHp:100,distance:4});
 b.units[0].moveLeft=2;
 b=battleCommand(b,'england',{type:'move',unit:'england0',tile:101});
 assert.equal(b.log.length,0);assert.equal(b.units[1].fireReady,true);
 b=battleCommand(b,'england',{type:'endTurn'});
 assert.equal(b.log.filter(e=>e.kind==='opportunity').length,1);
 assert.equal(b.units[0].fireReady,true);assert.equal(b.activeSide,1);
 // A surviving gun which moved last turn still participates in reserved fire.
 b=battleCommand(b,'france',{type:'endTurn'});
 assert.ok(b.log.some(e=>e.kind==='opportunity'&&e.unit==='england0'));
 if(b.phase==='combat'){
  assert.equal(b.activeSide,0);assert.equal(b.units[0].movedThisTurn,false);
 }
});

test('general rallies only adjacent allies, preserves casualties and ends its action',()=>{
 let b=combatFixture({type:'general',distance:5});b.units[0].medals=2;
 for(const [id,tile,side,state,effective] of [['ally',101,0,0,20],['broken',99,0,1,0],['enemy',129,1,0,10],['distant',104,0,0,10]]){
  b.units.push({id,owner:side===0?'england':'france',type:'pikeman',side,tile,hp:57,effective,state,medals:0,fireReady:true});b.cells[tile].unit=id;
 }
 const before=structuredClone(b),r=battleCommand(b,'england',{type:'rally',unit:'england0'});
 assert.equal(r.units.find(u=>u.id==='ally').effective,45);
 assert.equal(r.units.find(u=>u.id==='ally').hp,57);
 assert.equal(r.units.find(u=>u.id==='enemy').effective,10);
 assert.equal(r.units.find(u=>u.id==='distant').effective,10);
 assert.equal(r.units[0].done,true);
 assert.deepEqual(b,before);
 assert.throws(()=>battleCommand(r,'england',{type:'rally',unit:'england0'}),/available/);
 assert.deepEqual(battleCommand(JSON.parse(JSON.stringify(b)),'england',{type:'rally',unit:'england0'}),r);
 assert.throws(()=>battleCommand(b,'england',{type:'rally',unit:'ally'}),/Only a general/);
});

test('deployed friendly generals protect morale, then rally survivors during their turn',()=>{
 const initial=combatFixture({type:'arquebusier',distance:3,targetHp:100});
 const baseline=attackOpenField(initial,'england0','france0');
 const make=(side,state,tile)=>{
  const b=structuredClone(initial),g={id:'general',owner:side===0?'england':'france',type:'general',side,tile,hp:100,effective:100,state,medals:4,fireReady:true};
  b.units.push(g);if(tile!==null)b.cells[tile].unit=g.id;return b;
 };
 // An opposing general, an undeployed reserve, or a broken general provides no protection.
 for(const b of [make(0,0,99),make(1,0,null),make(1,1,104)]){
  const r=attackOpenField(b,'england0','france0');assert.equal(r.units[1].effective,baseline.units[1].effective);
 }
 let b=make(1,0,104);b=battleCommand(b,'england',{type:'attack',unit:'england0',target:'france0'});
 assert.equal(b.units[1].hp,baseline.units[1].hp);assert.ok(b.units[1].effective>baseline.units[1].effective);
 const physical=b.units[1].hp;b=battleCommand(b,'england',{type:'endTurn'});
 b=battleCommand(JSON.parse(JSON.stringify(b)),'france',{type:'rally',unit:'general'});
 assert.equal(b.units[1].hp,physical);assert.equal(b.units[1].effective,physical);
 assert.ok(b.log.some(e=>e.kind==='rally'&&e.target==='france0'));
});

test('broken troops retreat and escape with surviving health instead of ending battle immediately',()=>{
 let b=combatFixture({distance:5});b.activeWidth=29;const d=b.units[1];d.state=1;d.effective=0;
 const hp=d.hp;b=battleCommand(b,'england',{type:'endTurn'});
 assert.equal(b.phase,'combat');assert.notEqual(b.units[1].tile,105);assert.equal(b.units[1].hp,hp);
 for(let i=0;i<20&&b.phase==='combat';i++)b=battleCommand(JSON.parse(JSON.stringify(b)),b.activeSide===0?'england':'france',{type:'endTurn'});
 assert.equal(b.phase,'finished');assert.equal(b.winner,'england');assert.equal(b.units[1].escaped,true);
 assert.equal(b.units[1].hp,hp);assert.equal(b.units[1].tile,null);assert.ok(b.log.some(e=>e.kind==='escaped'));
});

test('a surrounded broken regiment surrenders and is removed from battlefield occupancy',()=>{
 let b=combatFixture({distance:5});b.activeWidth=29;const d=b.units[1];d.state=1;d.effective=0;
 // Friendly blockers prevent movement without creating additional enemy fire.
 for(const tile of [76,77,104,106,134,135]){
  const id='block'+tile;b.units.push({id,type:'pikeman',owner:'france',side:1,tile,hp:100,effective:100,state:0,medals:0});b.cells[tile].unit=id;
 }
 b=battleCommand(b,'england',{type:'endTurn'});
 assert.equal(b.units[1].surrendered,true);assert.equal(b.units[1].hp,0);assert.equal(b.cells[105].unit,null);
 assert.ok(b.log.some(e=>e.kind==='surrendered'&&e.unit==='france0'));
});


test('voluntary retreat moves to the edge without healing, teleporting or disabling enemy fire',async()=>{
 const {chooseBattleAction}=await import('../battle-ai.mjs');
 let b=combatFixture({targetType:'arquebusier',targetHp:100,distance:2});b.units[0].moveLeft=10;
 const hp=b.units[0].hp;b=battleCommand(b,'england',{type:'retreat'});
 assert.equal(b.phase,'combat');assert.equal(b.units[0].tile,100);assert.equal(b.units[0].hp,hp);assert.equal(b.units[0].state,0);
 assert.throws(()=>battleCommand(b,'england',{type:'withdraw',unit:'england0'}),/exit first/);
 const action=chooseBattleAction(b,'england');assert.equal(action.type,'move');
 b=battleCommand(b,'england',action);assert.ok(b.log.some(e=>e.kind==='opportunity'));assert.ok(b.units[0].hp<hp);
 let peaceful=combatFixture({distance:5,targetHp:100});peaceful.units[0].moveLeft=2;
 peaceful=battleCommand(peaceful,'england',{type:'retreat'});
 for(let i=0;i<100&&peaceful.phase!=='finished';i++){
  peaceful=JSON.parse(JSON.stringify(peaceful));
  peaceful=battleCommand(peaceful,peaceful.activeSide===0?'england':'france',peaceful.activeSide===0?chooseBattleAction(peaceful,'england'):{type:'endTurn'});
 }
 assert.equal(peaceful.phase,'finished');assert.equal(peaceful.winner,'france');assert.equal(peaceful.units[0].escaped,true);assert.equal(peaceful.units[0].hp,hp);
});
