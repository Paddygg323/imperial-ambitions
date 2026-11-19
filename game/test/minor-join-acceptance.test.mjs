import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {minorJoinAccepted} from '../minor-join-acceptance.mjs';

test('minor and tribal join decisions match 3072 original executable cases',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-minor-join-acceptance-audit.json',import.meta.url),'utf8'));
 assert.equal(audit.cases.length,3072);
 for(const c of audit.cases)assert.equal(minorJoinAccepted(c),c.accepted,JSON.stringify(c));
});

test('a third rival can block joining; absent rivals cannot; exactly ten points is sufficient',()=>{
 const c={proposer:1,relations:[240,250,240,240,240,240],present:[0,1,2,3,4,5]};
 assert.equal(minorJoinAccepted(c),true);
 c.relations[4]=241;assert.equal(minorJoinAccepted(c),false);
 c.present=c.present.filter(id=>id!==4);assert.equal(minorJoinAccepted(c),true);
 c.subject=101;assert.equal(minorJoinAccepted(c),false);
});
