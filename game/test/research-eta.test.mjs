import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {researchEta} from '../research-eta.mjs';
import {estimatedResearchTurns,technologyResearchTurns} from '../research.mjs';
test('research ETA matches500 original executions across slots and funding states',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-research-eta-audit.json',import.meta.url)));
 assert.equal(audit.threshold,.5);assert.equal(audit.cases.length,500);
 for(const c of audit.cases)assert.equal(researchEta(c),c.result,JSON.stringify(c));
});
test('campaign ETA uses original float boundary and distinguishes known/inactive research',()=>{
 const p={tech:'106',funding:700,progress:.1};
 const n={id:'england',known:[],projects:[p],alive:true};
 const s={player:'england',nations:{england:n}};
 assert.equal(estimatedResearchTurns(s,n,p),21);
 assert.equal(technologyResearchTurns(s,n,'106'),21);
 assert.equal(technologyResearchTurns(s,n,'59'),99);
 n.known.push('59');assert.equal(technologyResearchTurns(s,n,'59'),0);
 p.funding=0;assert.equal(estimatedResearchTurns(s,n,p),null);
 assert.equal(technologyResearchTurns(s,n,'106'),99);
});
