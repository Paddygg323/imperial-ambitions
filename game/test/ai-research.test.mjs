import test from 'node:test';
import assert from 'node:assert/strict';
import {researchBudget} from '../ai-research.mjs';
import {createGame,command} from '../engine.mjs';
import {planEconomy} from '../ai.mjs';
import {fundingStep} from '../research.mjs';
test('small budgets fund affordable whole steps, with goal-path priority',()=>{
 const projects=[{tech:'39'},{tech:'46'}];
 assert.deepEqual(researchBudget(projects,200),{'39':200,'46':0});
 assert.deepEqual(researchBudget(projects,300,new Set(['46'])),{'39':0,'46':300});
 assert.deepEqual(researchBudget(projects,200,new Set(['46'])),{'39':200,'46':0});
 for(let budget=-200;budget<=4000;budget+=17){const funding=researchBudget(projects,budget);
  assert.ok(Object.values(funding).reduce((a,b)=>a+b,0)<=Math.max(0,budget));
  for(const [id,q] of Object.entries(funding)){assert.equal(q%fundingStep(id),0);assert.ok(q<=3*fundingStep(id));}
 }
});
test('live economy planner funds one project when equal sharing would leave every project idle',()=>{
 const s=createGame(),n=s.nations.england;s.civilians=[];n.cash=1350;n.stock.fabric=0;
 n.known.push('0','1');n.projects=[{tech:'14',funding:0,investment:0,progress:0},{tech:'16',funding:0,investment:0,progress:0}];
 const next=planEconomy(s,'england',command);
 assert.equal(next.nations.england.projects.filter(p=>p.funding===100).length,1);
 assert.equal(next.nations.england.projects.reduce((sum,p)=>sum+p.funding,0),100);
});

test('live planner releases old funding commitments before redistributing a smaller budget',()=>{
 const s=createGame(),n=s.nations.england;s.civilians=[];n.cash=1350;n.stock.fabric=0;
 n.known.push('0','1');n.goal='14';n.projects=[{tech:'14',funding:300,investment:0,progress:0},{tech:'16',funding:300,investment:0,progress:0}];
 const next=planEconomy(s,'england',command).nations.england;
 assert.equal(next.projects.find(p=>p.tech==='14').funding,100);
 assert.equal(next.projects.reduce((sum,p)=>sum+p.funding,0),100);
});
