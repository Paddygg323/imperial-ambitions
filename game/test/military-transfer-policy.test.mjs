import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {keepTransferredMilitary} from '../military-transfer-policy.mjs';

test('military transfer decision matches 72 original loop executions',()=>{
 const {cases}=JSON.parse(readFileSync(new URL('../../outputs/Native-military-transfer-audit.json',import.meta.url),'utf8'));
 assert.equal(cases.length,72);
 for(const c of cases){
  assert.equal(keepTransferredMilitary(c),c.transferred,JSON.stringify(c));
  assert.equal(c.destroyed,!c.transferred);
  assert.equal(c.owner,c.transferred?1:12);
  assert.equal(c.status,c.transferred?0:7);
 }
});
