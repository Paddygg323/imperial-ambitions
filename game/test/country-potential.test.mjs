import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {countryItemPotential} from '../country-potential.mjs';
test('country potential matches original aggregation across home, flags and food goods', () => {
  const audit = JSON.parse(readFileSync(new URL('../../outputs/Native-country-potential-audit.json', import.meta.url)));
  assert.equal(audit.cases.length,1248);
  for (const c of audit.cases) assert.equal(countryItemPotential(c.records,c.home),c.result,JSON.stringify(c));
});
