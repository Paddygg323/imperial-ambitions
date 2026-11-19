import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {selectAllianceCandidate,compareAllianceCandidates,allianceCandidateList} from '../alliance-candidate-selection.mjs';
test('alliance candidate selection matches 720 original executed scans',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-alliance-candidate-selection-audit.json',import.meta.url),'utf8'));
 assert.equal(audit.cases.length,720);
 for(const c of audit.cases){
  const actual=selectAllianceCandidate({...c,human:c.human?[0,1,2,3,4,5]:[]});
  assert.deepEqual(actual===null?[]:[[actual,302]],c.offers,JSON.stringify(c));
 }
});
test('human cooldown does not substitute a lower ranked AI candidate',()=>{
 assert.equal(selectAllianceCandidate({own:1,turn:2,ranked:[2,3],human:[3]}),null);
 assert.equal(selectAllianceCandidate({own:1,turn:7,ranked:[2,3],human:[3]}),3);
 assert.equal(selectAllianceCandidate({own:1,turn:2,ranked:[]}),null);
});
test('relationship ranking matches 2304 original comparator calls including equal records',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-alliance-ranking-audit.json',import.meta.url),'utf8'));
 assert.equal(audit.cases.length,2304);
 for(const c of audit.cases)assert.equal(compareAllianceCandidates(c),c.result,JSON.stringify(c));
});
test('candidate eligibility and insertion order match 648 native lists',()=>{
 const {cases}=JSON.parse(readFileSync(new URL('../../outputs/Native-alliance-candidate-list-audit.json',import.meta.url),'utf8'));
 assert.equal(cases.length,648);
 for(const c of cases)assert.deepEqual(allianceCandidateList(c),c.result,JSON.stringify(c));
});
