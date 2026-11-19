import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {navyReinforcementPotential} from '../navy-reinforcement.mjs';
test('navy reinforcement matches180 native material/workforce/limit cases',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-navy-reinforcement-audit.json',import.meta.url)));
 assert.equal(audit.fpuControlWord,0x23f);
 assert.equal(audit.cases.length,180);
 for(const c of audit.cases)assert.equal(navyReinforcementPotential(c),c.result,JSON.stringify(c));
 assert.equal(navyReinforcementPotential({hasCity:false}),audit.noCity);
});
