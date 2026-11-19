import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {stockResourcePriority} from '../resource-priority-stock.mjs';
test('stock priority stage matches3500 original executions without getter stubs',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-resource-priority-stock-audit.json',import.meta.url)));assert.equal(audit.cases.length,3500);
 for(const c of audit.cases)assert.equal(stockResourcePriority(c),c.result,JSON.stringify(c));
});
test('raw source resources and reserved manufactured/substitute stocks remain distinct',()=>{
 const c={good:1,base:4,gdp:0,stock:Array(28).fill(4),reserved:Array(28).fill(0),demand:Array(28).fill(0)};
 assert.equal(stockResourcePriority(c),1);c.reserved[1]=4;assert.equal(stockResourcePriority(c),1,'timber uses raw warehouse stock');
 c.good=12;c.reserved[12]=4;assert.equal(stockResourcePriority(c),2,'lumber uses available stock after reservations');
 c.good=0;c.stock[0]=0;c.stock[6]=4;assert.equal(stockResourcePriority(c),1);
 c.reserved[6]=4;assert.equal(stockResourcePriority(c),2,'wool counts only unreserved substitute cotton');
});
