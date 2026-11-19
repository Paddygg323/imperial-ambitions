import test from 'node:test';import assert from 'node:assert/strict';
import {availableUnits} from '../unit-attention.mjs';
test('unit queue follows explorer, engineers, builders, armies, fleets and removes assigned units',()=>{
 const s={player:'england',civilians:['builder','engineer','explorer','engineer'].map((type,i)=>({id:String(i),owner:'england',type,tile:'1,1'})),armies:[{id:'army',owner:'england',province:'london'}],provinces:[{id:'london',town:'1,1'}],ships:[{id:'ship',owner:'england',location:'sea0'}]};
 assert.deepEqual(availableUnits(s).map(u=>u.id),['2','1','3','0','army','ship']);
 s.civilians[2].order={job:'prospect'};s.civilians[1].sleep=true;s.armies[0].defending=true;s.ships[0].order={job:'patrol'};
 assert.deepEqual(availableUnits(s).map(u=>u.id),['3','0']);
});

test('idle home trade fleet is not prompted, but sea ships remain available',()=>{
 const s={player:'england',civilians:[],armies:[],provinces:[],ships:[{id:'trader',owner:'england',location:'home'},{id:'exploring',owner:'england',location:'sea0'}]};
 assert.deepEqual(availableUnits(s).map(u=>u.id),['exploring']);
 assert.equal(s.ships[0].sleep,undefined,'attention policy must not change trade eligibility');
});
