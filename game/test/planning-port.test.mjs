import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {planningPortSite} from '../planning-port.mjs';
const audit=JSON.parse(fs.readFileSync(new URL('../../outputs/Native-planning-port-audit.json',import.meta.url)));
test('planning port sites match384 actual nested original queries',()=>{
 assert.equal(audit.cases.length,384);for(const c of audit.cases)assert.equal(planningPortSite(c),c.eligible,JSON.stringify(c));
});
