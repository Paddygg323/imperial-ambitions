import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {allianceProposalDecision} from '../alliance-proposal-decision.mjs';
test('proposal decisions match1296 original executions with own, allied and strongest-power ratings',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-alliance-proposal-decision-audit.json',import.meta.url),'utf8'));
 const strength=x=>({border:x,nonborder:x*1.3});
 for(const c of audit.cases){const r=allianceProposalDecision({own:strength(c.own),allies:c.ally?[strength(c.ally)]:[],active:[c.own,c.other,c.ally,0,0,0].map(strength),relation:c.relation,counter:c.counter,threshold:Math.fround(c.threshold),blocked:c.blocked});assert.equal(r.accepted,c.accepted,JSON.stringify({c,r}));}
});
