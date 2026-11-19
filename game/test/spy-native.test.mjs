import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {spyDanger,nativeSpyGuard,spyDetected,nativeSpyPresent} from '../spy-native.mjs';
const audit=name=>JSON.parse(readFileSync(new URL('../../outputs/'+name,import.meta.url)));
test('spy danger and detection threshold match1736 original executable fragment cases',()=>{
 const a=audit('Native-spy-detection-audit.json');assert.equal(a.base.length+a.garrison.length+a.rolls.length,1736);
 for(const c of a.base)assert.equal(spyDanger({greatPower:c.owner<6,war:c.war,counterspy:c.counterspy}),c.danger);
 for(const c of a.garrison)assert.equal(nativeSpyGuard(c.status,c.sameProvince),c.increment);
 for(const c of a.rolls)assert.equal(spyDetected(c.danger,c.roll),c.caught);
});
test('country and province spy presence match600 complete native query executions',()=>{
 const a=audit('Native-spy-presence-audit.json');assert.equal(a.cases.length,600);
 for(const c of a.cases)assert.equal(nativeSpyPresent(c.units,c.target,tile=>tile+(c.mode==='province'?100:0)),c.result);
});
