import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {markOriginalInlandSeas,originalHasDateLine,originalAllNationsCoastal} from '../map-zone-coasts.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-map-coasts.json',import.meta.url)));
test('inland filling and coast/date checks match180 whole original executions',()=>{
 assert.equal(audit.cases.length,180);
 for(const [i,c] of audit.cases.entries()){
  const state=structuredClone(c.before);
  assert.equal(originalHasDateLine(state.owners),c.initialDate,`initial date ${i}`);
  assert.equal(originalAllNationsCoastal(state.owners,c.noWrap,c.beforeGridByte),c.initialCoasts,`initial coast ${i}`);
  assert.equal(markOriginalInlandSeas(state,c.noWrap),c.remaining,`remaining ${i}`);
  assert.deepEqual(state,c.after,`state ${i}`);
  assert.equal(originalHasDateLine(state.owners),c.date,`date ${i}`);
  assert.equal(originalAllNationsCoastal(state.owners,c.noWrap,c.beforeGridByte),c.coasts,`coast ${i}`);
 }
});
