import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {merchantWithdrawal} from '../merchant-withdrawal.mjs';
test('merchant withdrawal matches native signed strength and aggression thresholds',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-merchant-withdrawal-audit.json',import.meta.url),'utf8'));
 assert.equal(audit.cases.length,252);
 for(const c of audit.cases)assert.equal(merchantWithdrawal(c.raiders,c.escorts,c.aggression),c.withdraw,JSON.stringify(c));
});
test('merchant withdrawal uses a strict threshold and does not roll for escape',()=>{
 assert.equal(merchantWithdrawal(199,100,0),true);assert.equal(merchantWithdrawal(200,100,0),false);
 assert.equal(merchantWithdrawal(99,100,1),true);assert.equal(merchantWithdrawal(100,100,1),false);
 assert.equal(merchantWithdrawal(49,100,2),true);assert.equal(merchantWithdrawal(50,100,2),false);
 assert.throws(()=>merchantWithdrawal(1,2,3),/Invalid/);
});

test('neutral blockade cancellation requires strictly more than three times escort strength',async()=>{
 const {neutralBlockadeOverwhelms}=await import('../merchant-withdrawal.mjs');
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-neutral-blockade-audit.json',import.meta.url),'utf8'));
 assert.ok(audit.cases.length>=30);for(const c of audit.cases)assert.equal(neutralBlockadeOverwhelms(c.raiders,c.escorts),c.cancel,JSON.stringify(c));
});
