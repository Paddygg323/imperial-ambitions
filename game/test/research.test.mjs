import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {researchGain,fundingStep} from '../research.mjs';
import {TECHS} from '../rules.mjs';
const reference=JSON.parse(readFileSync(new URL('./native-research-reference.json',import.meta.url)));
test('research gain matches all 59 isolated original-executable cases',()=>{
 for(const c of reference.cases)assert.ok(Math.abs(researchGain(c)-c.gain)<1e-7,JSON.stringify(c));
});
test('original research funding steps scale with technology division',()=>{
 assert.equal(fundingStep('7'),100);assert.equal(fundingStep('45'),300);
});
test('native prerequisites retain the links missing from manual transcription',()=>{
 assert.deepEqual(TECHS['34'].requires,['10','19']);
 assert.deepEqual(TECHS['107'].requires,['84','101']);
 assert.deepEqual(TECHS['110'].requires,['51','96']);
});
test('foreign discoveries diffuse slowly; spying accelerates but caps at two sources',()=>{
 const options={division:1,fundingLevel:0};
 assert.equal(researchGain(options),0);
 assert.ok(researchGain({...options,known:1})>0);
 assert.ok(researchGain({...options,known:1,spies:1})>researchGain({...options,known:1}));
 assert.equal(researchGain({...options,known:6,spies:6}),researchGain({...options,known:2,spies:2}));
});

test('research never refunds money or removes investment when treasury is negative',async()=>{
 const {createGame,finishTurnEconomy,saveGame,loadGame}=await import('../engine.mjs');
 const {availableTech}=await import('../rules.mjs');
 for(const cash of [-10001,-100,-1,0]){
  let s=createGame();const n=s.nations.england,tech=availableTech(n).find(t=>!t.discovery).id;
  n.cash=cash;n.finance.credit=0;n.projects=[{tech,funding:fundingStep(tech)*2,investment:10,progress:0}];
  s.turnPhase='combat';s=finishTurnEconomy(loadGame(saveGame(s)));
  assert.equal(s.nations.england.cash+s.nations.england.finance.interest,cash);assert.equal(s.nations.england.projects[0].investment,10);assert.equal(s.nations.england.projects[0].progress,0);
  assert.ok(s.reports.some(r=>r.nation==='england'&&r.kind==='research'&&r.text.includes('$0 funded')));
  assert.doesNotThrow(()=>loadGame(saveGame(s)));
 }
});

test('funding can be reduced under debt even while other projects exceed available credit',async()=>{
 const {createGame,command}=await import('../engine.mjs');const {availableTech}=await import('../rules.mjs');
 let s=createGame();const techs=availableTech(s.nations.england).filter(t=>!t.discovery).slice(0,2);
 for(const t of techs){s=command(s,'england',{type:'researchStart',tech:t.id});s=command(s,'england',{type:'researchFunding',tech:t.id,amount:fundingStep(t.id)*2});}
 s.nations.england.cash=-1000;
 const before=structuredClone(s);assert.throws(()=>command(s,'england',{type:'researchFunding',tech:techs[0].id,amount:fundingStep(techs[0].id)*3}),/Treasury/);assert.deepEqual(s,before);
 for(const t of techs)s=command(s,'england',{type:'researchFunding',tech:t.id,amount:0});
 assert.ok(s.nations.england.projects.every(p=>p.funding===0));
});


test('research reports retain actual funding and investment, including completed and underfunded projects',async()=>{
 const {createGame,finishTurnEconomy,saveGame,loadGame}=await import('../engine.mjs');
 const {availableTech}=await import('../rules.mjs');
 for(const [cash,progress,expected,complete] of [[50,0,0,false],[150,0,100,false],[500,.5,200,true]]){
  let s=createGame({preferenceSeed:123}),n=s.nations.england;
  const tech=availableTech(n).find(t=>t.division===1).id;
  n.cash=cash;n.finance.credit=0;n.projects=[{tech,funding:200,investment:40,progress}];
  s.turnPhase='combat';s=finishTurnEconomy(loadGame(saveGame(s)));
  const r=s.reports.find(r=>r.nation==='england'&&r.kind==='research'&&r.tech===tech);
  assert.equal(r.plannedFunding,200);assert.equal(r.funded,expected);assert.equal(r.investment,40+expected);assert.equal(r.completed,complete);
  assert.equal(s.nations.england.cash,cash-expected);
  assert.equal(s.nations.england.known.includes(tech),complete);
  assert.deepEqual(loadGame(saveGame(s)).reports.find(x=>x.nation==='england'&&x.kind==='research'),r);
 }
});
