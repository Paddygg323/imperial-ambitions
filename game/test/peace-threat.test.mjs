import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {peaceThreat} from '../peace-threat.mjs';
test('peace threat matches 288 original executions across both strength branches',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-peace-threat-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,288);
 for(const c of audit.cases){
  const scale=c.adjacent?1:1.7;
  const got=peaceThreat({own:c.own*scale,opponent:c.enemy*scale,ownOtherEnemies:c.ownOther?[c.ownOther*scale]:[],opponentOtherEnemies:c.enemyOther?[c.enemyOther*scale]:[],opponentOldWorldProvinces:c.count,totalOldWorldProvinces:c.total});
  assert.equal(got,Math.fround(c.result),JSON.stringify({...c,got}));
 }
});
test('other wars change pressure on each side; province modifier requires another enemy',()=>{
 const base={own:10,opponent:20,totalOldWorldProvinces:100,opponentOldWorldProvinces:95};
 assert.equal(peaceThreat(base),2);
 assert.equal(peaceThreat({...base,ownOtherEnemies:[20]}),Math.fround(0.6));
 assert.equal(peaceThreat({...base,opponentOtherEnemies:[20]}),1);
});


