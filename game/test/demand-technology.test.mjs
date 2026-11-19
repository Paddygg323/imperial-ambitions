import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {demandTechnologyLevels,campaignDemandTechnology} from '../demand-technology.mjs';
import {initialDemand} from '../demand-initial.mjs';
test('demand military and fortification queries match49 original effect configurations',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-demand-technology-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,49);
 for(const {known,...expected} of audit.cases)assert.deepEqual(demandTechnologyLevels({known}),expected);
});
test('forecast sees funded artillery research and distinguishes fortification from transport',()=>{
 const n={id:'england',known:['7'],projects:[],alive:true},s={player:'england',nations:{england:n}};
 assert.deepEqual(campaignDemandTechnology(s,'england'),{militaryLevel:0,fortificationLevel:1,eta:{33:99,34:99,35:99}});
 n.projects=[{tech:'59',funding:400,progress:.99}];assert.equal(campaignDemandTechnology(s,'england').eta[33],1);
 n.projects[0].funding=0;n.projects[0].progress=.1;assert.equal(campaignDemandTechnology(s,'england').eta[33],99);
 n.known.push('59','68');const input=campaignDemandTechnology(s,'england');assert.equal(input.militaryLevel,33);assert.equal(input.fortificationLevel,2);assert.equal(input.eta[33],0);
 const demand=initialDemand({...input,needs:Array(28).fill(0),turn:0,factor:0,civilians:Array(3).fill({nativeType:1,status:0})});
 assert.equal(demand[16],2,'modern forts require steel in the third engineer allowance');
});
