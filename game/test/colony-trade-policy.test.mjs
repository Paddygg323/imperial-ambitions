import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {colonyTradePolicies} from '../colony-trade-policy.mjs';

test('colony trade policies match 288 native updates across all 22 countries',()=>{
 const {cases}=JSON.parse(readFileSync(new URL('../../outputs/Native-colony-boycotts-audit.json',import.meta.url),'utf8'));
 assert.equal(cases.length,288);
 for(const c of cases)assert.deepEqual(colonyTradePolicies(c),c.policies,JSON.stringify(c));
});

test('colonies share boycott flags while the own-country exception does not override war',()=>{
 const flags={wars:[3],boycotts:[2,12]};
 const a=colonyTradePolicies({minor:12,...flags}),b=colonyTradePolicies({minor:16,...flags});
 assert.equal(a[2][1],300);assert.equal(b[2][1],300);
 assert.equal(a[3][1],300);assert.equal(b[3][1],300);
 assert.equal(a[12][1],100);assert.equal(b[12][1],300);
 assert.equal(colonyTradePolicies({minor:12,wars:[12],boycotts:[]})[12][1],300);
 assert.equal(a[1][1],100);
});
