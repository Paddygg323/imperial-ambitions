import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {setupRichesDeals,RICHES_DEAL_ORDER} from '../riches-deals.mjs';
test('riches setup matches16 complete native runs and1308 generated records',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-riches-setup-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,16);let count=0;
 for(const c of audit.cases){
  const input=c.contributions.map(x=>({...x,base:[50,100,200,300,400][x.good-23]}));
  assert.deepEqual(setupRichesDeals(c.status,input),c.records);count+=c.records.length;
 }
 assert.equal(count,1308);assert.deepEqual(RICHES_DEAL_ORDER,[27,26,25,24,23]);
});
