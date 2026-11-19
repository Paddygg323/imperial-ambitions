import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {allianceConflictGate,allianceThreshold} from '../alliance-proposal-inputs.mjs';
test('alliance conflict gate matches320 original war/presence combinations',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-alliance-conflict-gate-audit.json',import.meta.url),'utf8'));
 for(const c of audit.cases)assert.equal(allianceConflictGate({proposer:0,recipient:1,wars:c.wars,present:Array.from({length:22},(_,i)=>i).filter(i=>i!==c.absent)}),c.blocked,JSON.stringify(c));
});
test('alliance proposal threshold matches35 original minister combinations',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-alliance-personality-audit.json',import.meta.url),'utf8'));
 for(const c of audit.cases)assert.equal(allianceThreshold(c.minister204,c.minister20c),c.threshold);
});
