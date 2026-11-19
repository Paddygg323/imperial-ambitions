import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {selectMinorPort} from '../minor-port-selection.mjs';
test('minor port selection matches108 native scenarios including capital and fallback precedence',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-minor-port-selection-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,108);
 for(const [i,c] of audit.cases.entries())assert.equal(selectMinorPort(c.candidates,{riverSetting:c.riverSetting}),c.selected,`native scenario ${i}`);
});

import {minorPortEligible} from '../minor-port-selection.mjs';
test('minor port eligibility matches160 native coastal and river branch scenarios',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-minor-port-eligibility-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,160);
 for(const [i,c] of audit.cases.entries()){
  const nodes=c.nodes.map((n,id)=>({...n,id,river:id===0&&c.river}));
  const neighbors=n=>c.adjacency[n.id].map(id=>id<0?null:nodes[id]);
  assert.equal(minorPortEligible(nodes[0],neighbors(nodes[0]),neighbors,{riverBlocked:c.riverBlocked}),c.eligible,`native scenario ${i}`);
 }
});
