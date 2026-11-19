import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,command,resolveTurn,saveGame,loadGame} from '../engine.mjs';import {goalPath,TECHS} from '../rules.mjs';
import {nextResearchGoal} from '../ai-research-goals.mjs';import {planEconomy} from '../ai.mjs';import {planMilitary} from '../ai-military.mjs';
function fixture(){const s=createGame(),n=s.nations.france;n.known=[...new Set([...goalPath('45'),...goalPath('48')])].filter(t=>t!=='48');n.goal='45';n.cash=20000;s.civilians=[];s.armies=[];for(const g of Object.keys(n.stock))n.stock[g]=100;
 const province=s.tiles.find(t=>t.id===n.capital).province;s.armies.push({id:'veteran',owner:'france',province,type:'arquebusier',hp:100,experience:2,order:null});return s;}
test('completed goals advance toward army technology, then capacity/steel; human goals remain unchanged',()=>{
 const s=fixture(),n=s.nations.france;assert.equal(nextResearchGoal(s,'france'),'48');
 n.goal='48';assert.equal(nextResearchGoal(s,'france'),'48');n.known.push('48');assert.equal(nextResearchGoal(s,'france'),'56');
 n.known.push('56');assert.equal(nextResearchGoal(s,'france'),'66');n.known.push('66');assert.equal(nextResearchGoal(s,'france'),'83');
 s.nations.england.goal='45';assert.equal(nextResearchGoal(s,'england'),'45');
 n.known=Object.keys(TECHS);assert.equal(nextResearchGoal(s,'france'),null);
});
test('goal selection preserves existing investments and funds the available military goal',()=>{
 const s=fixture();s.nations.france.projects=[{tech:'10',funding:0,investment:123,progress:.2}];
 const end=planEconomy(s,'france',command);assert.equal(end.nations.france.goal,'48');
 assert.ok(end.nations.france.projects.some(p=>p.tech==='48'&&p.funding>0));
 assert.equal(end.nations.france.projects.find(p=>p.tech==='10').investment,123);
});
test('funded research completes through normal turns and enables a paid veteran upgrade',()=>{
 let s=fixture();let turns=0;
 while(!s.nations.france.known.includes('48')&&turns<40){
  s=planEconomy(s,'france',command);s.market={complete:true,deals:[],inTransit:[],diplomacy:[]};s=resolveTurn(loadGame(saveGame(s)));turns++;
 }
 assert.ok(s.nations.france.known.includes('48'),'research failed to complete');
 assert.equal(s.armies.find(u=>u.id==='veteran').type,'arquebusier');
 const stock={...s.nations.france.stock};s=planMilitary(s,'france',command);
 assert.equal(s.armies.find(u=>u.id==='veteran').type,'musketeer');assert.equal(s.armies.find(u=>u.id==='veteran').experience,2);
 assert.ok(s.nations.france.stock.bronze<stock.bronze);
});
test('fortified-border war redirects research to a usable artillery upgrade without deleting projects',()=>{
 const s=fixture(),n=s.nations.france;n.goal='83';s.wars=[['france','spain']];
 s.armies.push({id:'siege-gun',owner:'france',province:s.armies[0].province,type:'culverin',hp:100,experience:0,order:null});
 n.projects=[{tech:'10',funding:0,investment:123,progress:.2}];
 assert.equal(nextResearchGoal(s,'france'),'53');const end=planEconomy(s,'france',command);
 assert.equal(end.nations.france.goal,'53');assert.equal(end.nations.france.projects.find(p=>p.tech==='10').investment,123);
 s.wars=[];assert.equal(nextResearchGoal(s,'france'),'83');
});


test('siege research can choose the nearer light-artillery route before owning guns',()=>{
 const s=fixture(),n=s.nations.france;s.wars=[['france','spain']];
 for(const p of s.provinces)p.fort=1;
 n.known=[...new Set([...n.known,...goalPath('59')])].filter(k=>k!=='59');n.goal='83';
 assert.ok(!s.armies.some(u=>u.owner==='france'&&u.type.toLowerCase().includes('artillery')));
 assert.equal(nextResearchGoal(s,'france'),'59');
 const funded=planEconomy(s,'france',command);assert.equal(funded.nations.france.goal,'59');
 assert.ok(funded.nations.france.projects.some(p=>p.tech==='59'&&p.funding>0));
 assert.ok(!funded.nations.france.known.includes('59'),'selecting and funding is not a free unlock');
 n.known.push('59');assert.equal(nextResearchGoal(s,'france'),'83','usable light guns no longer force a heavy siege goal');
 for(const p of s.provinces)p.fort=2;
 assert.notEqual(nextResearchGoal(s,'france'),'59','stronger forts require stronger artillery');
});
