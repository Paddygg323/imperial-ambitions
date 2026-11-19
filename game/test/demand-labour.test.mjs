import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {scaleDemandByLabour} from '../demand-labour.mjs';
test('demand labour scaling matches330 original cases including zero demand',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-demand-labour-audit.json',import.meta.url)));
 assert.deepEqual(audit.weights,[1,4,6,8]);assert.equal(audit.cases.length,330);
 for(const c of audit.cases)assert.deepEqual(scaleDemandByLabour(c),c.result,JSON.stringify(c));
});
