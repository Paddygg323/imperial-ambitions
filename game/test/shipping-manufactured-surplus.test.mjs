import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {shippingManufacturedSurplus} from '../shipping-manufactured-surplus.mjs';
test('raw-material surplus adjustment matches336 original executions for all28 goods',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-shipping-manufactured-surplus-audit.json',import.meta.url)));assert.equal(audit.cases.length,336);
 for(const c of audit.cases)assert.equal(shippingManufacturedSurplus(c),c.surplus,JSON.stringify(c));
});
test('iron uses lower steel surplus only above30 coal with steel unlocked',()=>{
 const c={good:4,steel:true,stock:Array(28).fill(0),demand:Array(28).fill(0)};
 c.stock[15]=20;c.stock[16]=9;c.stock[5]=30;assert.equal(shippingManufacturedSurplus(c),20);
 c.stock[5]=31;assert.equal(shippingManufacturedSurplus(c),4);
 c.steel=false;assert.equal(shippingManufacturedSurplus(c),20);
 c.good=2;c.stock[14]=9;c.demand[14]=2;assert.equal(shippingManufacturedSurplus(c),2);
 c.demand[14]=10;assert.equal(shippingManufacturedSurplus(c),0);
});
