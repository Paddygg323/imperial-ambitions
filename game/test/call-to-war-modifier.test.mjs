import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {callToWarModifier} from '../call-to-war-modifier.mjs';
test('relationship, turn and territorial modifiers match1152 original border/nonborder executions',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-call-to-war-modifier-audit.json',import.meta.url),'utf8'));
 for(const c of audit.cases)assert.equal(callToWarModifier(c),c.result,JSON.stringify(c));
});
