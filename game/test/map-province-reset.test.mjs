import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {resetOriginalMapProvinces} from '../map-province-reset.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-map-province-reset.json',import.meta.url)));
test('province data initialization matches native defaults on four dirty buffers',()=>{
 assert.equal(audit.cases.length,4);
 for(const c of audit.cases){
  const data=Uint8Array.from({length:152*212},(_,i)=>(i*c.seed+c.seed)&255);resetOriginalMapProvinces(data);
  assert.equal(createHash('sha256').update(data).digest('hex'),c.sha256);
 }
});
