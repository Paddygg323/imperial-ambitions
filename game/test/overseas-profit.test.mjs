import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {overseasProfit} from '../overseas-profit.mjs';
test('overseas profit matches300 original minor sales across six investors',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-overseas-profit-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,300);assert.equal(audit.constant,Math.fround(-1/255));
 for(const c of audit.cases){assert.equal(c.minorReceipt,c.sold*c.price);assert.deepEqual(c.foreign.map((foreign,i)=>overseasProfit({...c,foreign,relation:c.relations[i]})),c.profits,JSON.stringify(c));}
});
