import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {computerAllianceResponse,allianceAcceptancePlan,recordAllianceTreaty} from '../alliance-offer-response.mjs';import {NATIONS} from '../rules.mjs';
test('incoming alliance dispatcher matches12 original reciprocal/treaty/evaluation paths',()=>{
 const a=JSON.parse(readFileSync(new URL('../../outputs/Native-alliance-offer-dispatch-audit.json',import.meta.url),'utf8'));
 for(const c of a.cases){const s={nations:{france:{alive:true},england:{alive:true}},wars:c.treaty===6?[['france','england']]:[],alliances:c.treaty===2?[['france','england']]:[]};let evaluated=0;
  const r=computerAllianceResponse(s,'france','england',{reciprocal:c.reciprocal,evaluate:()=>{evaluated++;return {accepted:c.decision};}});
  assert.equal(r.accepted,c.calls.some(x=>x.kind==='accept'));assert.equal(evaluated,c.calls.filter(x=>x.kind==='evaluate').length);
 }
});
test('accepted alliance joins only missing Great Power wars in256 original effect sequences including absent enemies',()=>{
 const a=JSON.parse(readFileSync(new URL('../../outputs/Native-alliance-acceptance-effects-audit.json',import.meta.url),'utf8')),ids=[...NATIONS.map(([id])=>id),'scotland'];
 for(const c of a.cases){const s={nations:Object.fromEntries(NATIONS.map(([id],i)=>[id,{alive:i!==c.absent}])),wars:c.wars.map(p=>p.map(i=>ids[i]))};const before=JSON.stringify(s),r=allianceAcceptancePlan(s,'france','england');
  assert.deepEqual(r.alliance,c.calls.find(x=>x.kind==='treaty').args.slice(0,2).map(i=>ids[i]));
  assert.deepEqual(r.declarations,c.calls.filter(x=>x.kind==='warOrder').map(x=>({nation:'france',target:ids[x.args[0]],supporting:ids[x.args[2]]})));
  assert.equal(JSON.stringify(s),before);
 }
});

test('alliance treaty preserves relations and trade policies in88 original transitions',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-alliance-settlement-audit.json',import.meta.url),'utf8')),ids=NATIONS.map(([id])=>id);
 for(const c of audit.cases){const a=ids[c.a],b=ids[c.b],s={nations:{[a]:{alive:true,tradePolicies:{[b]:75}},[b]:{alive:true,tradePolicies:{[a]:300}}},relations:{[a]:{[b]:c.prior},[b]:{[a]:c.prior}},wars:[]};
  const nations=structuredClone(s.nations);assert.equal(recordAllianceTreaty(s,a,b),true);
  assert.equal(c.treaty,2);assert.deepEqual(s.alliances,[[a,b]]);assert.equal(s.relations[a][b],c.relation);assert.equal(s.relations[b][a],c.reverse);
  assert.deepEqual(c.policies,[]);assert.deepEqual(s.nations,nations);assert.equal(recordAllianceTreaty(s,b,a),false);assert.equal(s.alliances.length,1);
 }
});
test('treaty refuses war, absent parties and self alliance without modifying state',()=>{
 for(const [a,b,alive,wars] of [['france','england',true,[['france','england']]],['france','england',false,[]],['france','france',true,[]]]){
  const s={nations:{france:{alive:true},england:{alive}},wars},before=JSON.stringify(s);
  assert.throws(()=>recordAllianceTreaty(s,a,b),/Alliance requires/);assert.equal(JSON.stringify(s),before);
 }
});
