import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {victoryDecision,nextBattleSide} from '../battle-victory.mjs';
import {battleCommand,createBattle} from '../battle.mjs';

test('side transition and forced checks match native Cycle boundaries',()=>{
 const ref=JSON.parse(fs.readFileSync(new URL('./native-turn-transition-reference.json',import.meta.url)));
 for(const c of ref.cases)assert.deepEqual(nextBattleSide(c.beforeSide,c.beforeCounter),{side:c.afterSide,counter:c.afterCounter,forcedVictoryCheck:c.forcedVictoryCheck});
});

function stalemate(){
 const forces={england:[{id:'a',owner:'england',type:'pikeman',hp:100}],france:[{id:'d',owner:'france',type:'pikeman',hp:100}]};
 let b=createBattle({province:'test',attacker:'england',defender:'france',forces,nations:{england:{known:[]},france:{known:[]}},activeWidth:29,cells:Array.from({length:464},(_,t)=>({terrain:t%29===14?4:0}))});
 b=battleCommand(b,'england',{type:'deploy',unit:'a',tile:235});
 b=battleCommand(b,'france',{type:'deploy',unit:'d',tile:256});
 b=battleCommand(b,'england',{type:'ready'});return battleCommand(b,'france',{type:'ready'});
}
test('saved unreachable armies terminate after the original side-turn limit without casualties',()=>{
 let b=stalemate();assert.equal(b.sideTurnCounter,1);
 for(let counter=2;counter<=35;counter++){
  b=battleCommand(JSON.parse(JSON.stringify(b)),b.activeSide===0?'england':'france',{type:'endTurn'});
  assert.equal(b.phase,'combat');assert.equal(b.sideTurnCounter,counter);
 }
 b=battleCommand(b,'england',{type:'endTurn'});
 assert.equal(b.phase,'finished');assert.equal(b.winner,'france');assert.equal(b.outcomeReason,'timeLimit');
 assert.ok(b.units.every(u=>u.hp===100));assert.equal(b.sideTurnCounter,36);
});

test('combat victory checks at counter35 favour defence even after its last regiment falls',()=>{
 let b=stalemate();b.sideTurnCounter=35;b.round=18;
 const [a,d]=b.units;b.cells[d.tile].unit=null;d.tile=a.tile+1;b.cells[d.tile].unit=d.id;d.hp=d.effective=1;
 b=battleCommand(b,'england',{type:'attack',unit:'a',target:'d'});
 assert.equal(b.units[1].state,3);assert.equal(b.winner,'france');assert.equal(b.outcomeReason,'timeLimit');
});

test('victory decision matches original counter and army-presence boundaries',()=>{
 const ref=JSON.parse(fs.readFileSync(new URL('./native-victory-boundary-reference.json',import.meta.url)));
 for(const c of ref.cases)assert.equal(victoryDecision(c),c.result,JSON.stringify(c));
 assert.throws(()=>victoryDecision({attackerPresent:true,defenderPresent:true,sideTurnCounter:-1}),/Invalid/);
});

test('mutual elimination awards defence without restoring or deleting regiments',()=>{
 const forces={england:[{id:'a',owner:'england',type:'pikeman',hp:100}],france:[{id:'d',owner:'france',type:'pikeman',hp:100}]};
 let b=createBattle({province:'test',attacker:'england',defender:'france',forces,nations:{england:{known:[]},france:{known:[]}},activeWidth:17,cells:Array.from({length:464},()=>({terrain:0}))});
 b.phase='combat';b.activeSide=0;b.round=1;
 for(const u of b.units){u.state=3;u.hp=0;u.tile=null;u.fireReady=false;}
 b=battleCommand(JSON.parse(JSON.stringify(b)),'england',{type:'endTurn'});
 assert.equal(b.phase,'finished');assert.equal(b.winner,'france');
 assert.equal(b.units.length,2);assert.ok(b.units.every(u=>u.hp===0&&u.state===3));
});
