import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {minorBids,minorPurchase,minorTradeThresholds,minorTurnSubsidy,addMinorSubsidy,minorExportQuantity} from '../minor-trade.mjs';
const native=JSON.parse(readFileSync(new URL('../../outputs/Native-minor-bids-audit.json',import.meta.url)));
const income=JSON.parse(readFileSync(new URL('../../outputs/Native-minor-income-audit.json',import.meta.url)));
const exportsAudit=JSON.parse(readFileSync(new URL('../../outputs/Native-minor-exports-audit.json',import.meta.url)));
test('minor export quantity includes all computed networks, matching20 native cases',()=>{
 assert.equal(exportsAudit.cases.length,20);
 for(const c of exportsAudit.cases)assert.equal(minorExportQuantity(c.records),c.quantity);
 assert.throws(()=>minorExportQuantity([{quantity:-1}]));
});
test('minor per-turn subsidy matches all17 eligibility counts and accumulates treasury',()=>{
 for(const c of income.allocations)assert.equal(minorTurnSubsidy(c.eligibleCount),c.amount);
 for(const c of income.updates){const match=income.allocations.find(a=>a.amount===c.amount);assert.equal(addMinorSubsidy(c.cash,match.eligibleCount),c.nextCash);}
 assert.equal(addMinorSubsidy(5000,16),5200);assert.throws(()=>minorTurnSubsidy(17));
});
test('minor price thresholds match all70 possible starting bands and maximum native draw',()=>{
 assert.equal(native.thresholds.length,71);
 for(const c of native.thresholds)assert.deepEqual(minorTradeThresholds(c.random),{low:c.low,high:c.high});
});
test('minor goods selection and bounded per-good budgets match36 native executions',()=>{
 assert.equal(native.cases.length,36);
 for(const c of native.cases){assert.deepEqual(minorBids(c),{selected:c.selected,budgets:c.budgets});assert.ok(c.budgets.reduce((a,b)=>a+b,0)<=c.cash);}
});
test('minor acceptance obeys its commodity budget across21 native purchase replies',()=>{
 assert.equal(native.purchases.length,21);
 for(const c of native.purchases)assert.deepEqual(minorPurchase(c),c.result);
 assert.deepEqual(minorPurchase({budget:249,quantity:3,price:250}),{quantity:0,stop:true});
 assert.equal(minorPurchase({budget:0,quantity:3,price:250}),null);
});
test('disabled goods and above-threshold goods are excluded; empty middle band is not an invented buyer',()=>{
 const c=native.cases.find(c=>c.enabled.includes(false));const result=minorBids(c);
 for(const i of result.selected)assert.ok(c.enabled[i]&&c.prices[i]<=c.high);
 assert.deepEqual(minorBids({...c,enabled:Array(9).fill(false)}),{selected:[],budgets:Array(9).fill(0)});
 assert.throws(()=>minorBids({...c,cash:-1}),/inputs/);
});

test('empty middle price band preserves cheap bids and skips unavailable random choice',()=>{
 const base={cash:900,enabled:Array(9).fill(true),low:150,high:300,random:1};
 assert.deepEqual(minorBids({...base,prices:Array(9).fill(400)}),{selected:[],budgets:Array(9).fill(0)});
 assert.deepEqual(minorBids({...base,prices:Array(9).fill(100)}),{selected:[0,1,2,3,4,5,6,7,8],budgets:Array(9).fill(100)});
});
