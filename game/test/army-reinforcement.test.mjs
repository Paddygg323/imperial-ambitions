import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {armyReinforcementPotential} from '../army-reinforcement.mjs';
test('army reinforcement potential matches180 native material/workforce/limit cases',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-army-reinforcement-audit.json',import.meta.url)));
 assert.equal(audit.fpuControlWord,0x23f);
 assert.equal(audit.cases.length,180);
 for(const c of audit.cases)assert.equal(armyReinforcementPotential(c),c.result,JSON.stringify(c));
 assert.equal(armyReinforcementPotential({hasCity:false}),audit.noCity);
});
