import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {planningProductivity,PLANNING_TECH_TARGETS,campaignPlanningTechnology} from '../planning-technology.mjs';
import {technologyResourceTarget} from '../resource-priority-technology.mjs';
test('planning productivity and ETA request tables match original constructors and117 effect configurations',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-planning-technology-audit.json',import.meta.url)));
 assert.deepEqual(PLANNING_TECH_TARGETS,audit.targets);assert.equal(audit.cases.length,117);
 for(const c of audit.cases){const {known,...expected}=c;assert.deepEqual(planningProductivity({known}),expected,JSON.stringify(known));}
});
test('campaign luxury priorities see only the correct current or approaching research',()=>{
 const n={id:'england',known:[],projects:[],alive:true};const s={player:'england',nations:{england:n}};
 let input=campaignPlanningTechnology(s,'england');assert.equal(input.manufacturingEtas[7],99);assert.equal(input.workerEtas[7],99);
 n.projects=[{tech:'13',funding:400,progress:.49},{tech:'23',funding:400,progress:.49}];
 input=campaignPlanningTechnology(s,'england');assert.equal(input.manufacturingEtas[7],1);assert.equal(input.workerEtas[7],1);assert.equal(input.manufacturingEtas[8],99);
 const target=good=>technologyResourceTarget({good,resourceLevel:input.resourceLevels[good],manufacturingLevel:input.manufacturingLevels[good+10],workerLevel:input.workerLevel,manufacturingEta:input.manufacturingEtas[good],workerEta:input.workerEtas[good]});
 assert.deepEqual(target(7),{base:4,luxuryReady:true});assert.deepEqual(target(8),{base:-1,luxuryReady:false});
 n.projects[1].funding=0;assert.equal(campaignPlanningTechnology(s,'england').workerEtas[7],99);
 n.known=['13','23'];input=campaignPlanningTechnology(s,'england');assert.equal(input.manufacturingEtas[7],0);assert.equal(input.workerEtas[7],0);assert.equal(input.workerLevel,1);assert.equal(input.manufacturingLevels[17],1);
});
