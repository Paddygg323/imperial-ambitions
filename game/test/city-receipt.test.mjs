import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cityReceipt} from '../city-receipt.mjs';

test('city receipt matches 480 unchanged original executions, including successive deliveries',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-city-receipt-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,160);
 for(const c of audit.cases){
  let state={stock:c.stock,outstanding:c.outstanding};
  c.deliveries.forEach((delivery,i)=>{
   const input=structuredClone({...state,delivery});
   state=cityReceipt(input);
   assert.deepEqual(state,c.results[i]);
   assert.deepEqual(input,{...(i?c.results[i-1]:{stock:c.stock,outstanding:c.outstanding}),delivery});
  });
 }
});

test('receipt first pays its outstanding deduction and only then adds stock',()=>{
 const stock=Array(28).fill(0),outstanding=Array(28).fill(0),delivery=Array(28).fill(0);
 stock[12]=7;outstanding[12]=5;delivery[12]=3;
 const first=cityReceipt({stock,outstanding,delivery});
 assert.equal(first.stock[12],7);assert.equal(first.outstanding[12],2);
 const second=cityReceipt({...first,delivery});
 assert.equal(second.stock[12],8);assert.equal(second.outstanding[12],0);
 assert.throws(()=>cityReceipt({stock:[],outstanding,delivery}));
});
