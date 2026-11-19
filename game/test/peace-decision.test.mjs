import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {considerPeace} from '../peace-decision.mjs';
test('peace acceptance and broken alliances match756 original decisions',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-peace-decision-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,756);
 for(const c of audit.cases)assert.deepEqual(considerPeace({...c,alliesAtWar:c.alliedWar?1:0}),{accepted:c.accepted,brokenAlliances:c.brokenAlliances},JSON.stringify(c));
});
test('peace thresholds are strict and do not abandon allies without extra pressure',()=>{
 assert.equal(considerPeace({threat:1,factor:1,accept:1,force:1}).accepted,false);
 assert.equal(considerPeace({threat:1.5,factor:1,accept:1,force:1}).accepted,true);
 assert.equal(considerPeace({threat:1.5,factor:1,accept:1,force:1,alliesAtWar:1}).accepted,false);
 assert.deepEqual(considerPeace({threat:3,factor:1,accept:1,force:1,alliesAtWar:2}),{accepted:true,brokenAlliances:2});
});
