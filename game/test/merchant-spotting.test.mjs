import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHIPS} from '../rules.mjs';
import {merchantSpotting} from '../merchant-spotting.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-merchant-spotting-audit.json',import.meta.url),'utf8'));
const type=id=>Object.keys(SHIPS).find(k=>SHIPS[k].nativeId===id);
test('merchant spotting matches native research, blockade, speed, damage and escort branches',()=>{
 assert.equal(audit.cases.length,2160);
 for(const c of audit.cases){const draws=[];const result=merchantSpotting({raiders:[{type:type(c.raider),hp:c.hp}],merchants:[{type:type(c.merchant)}],escortCount:c.escorts,blockade:c.order===6||c.order===11,nation:{known:c.effect===65?['54']:[]}},()=>{draws.push(c.roll);return c.roll;});
  assert.deepEqual({...result,draws},{spotted:c.spotted,threshold:c.threshold>=32768?c.threshold-65536:c.threshold,draws:c.draws},JSON.stringify(c));
 }
});
