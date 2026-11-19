import test from 'node:test';import assert from 'node:assert/strict';import {createGame,command,saveGame,loadGame} from '../engine.mjs';import {availableTech,TECHS} from '../rules.mjs';import {fundingStep} from '../research.mjs';import {researchAttention,relevantNews,strengthWarnings} from '../news-priority.mjs';

test('campaign outcomes remain prominent news and suppress obsolete strength warnings',()=>{const s=createGame();s.outcome={status:'defeat',reason:'capitalLost'};s.reports=[{nation:'england',kind:'elimination',text:'England has been eliminated after losing its capital.'},{nation:'england',kind:'outcome',text:'France wins the game.'}];s.armies=s.armies.filter(u=>u.owner!=='england');assert.equal(relevantNews(s).important.length,2);assert.equal(relevantNews(s).routine.length,0);assert.deepEqual(strengthWarnings(s),[]);});
test('new research starts at base funding, persists, and is charged only at resolution',()=>{let s=createGame(),n=s.nations.england,tech=availableTech(n)[0].id,cash=n.cash;s=command(s,'england',{type:'researchStart',tech});assert.equal(s.nations.england.projects[0].funding,fundingStep(tech));assert.equal(s.nations.england.cash,cash);assert.equal(loadGame(saveGame(s)).nations.england.projects[0].funding,fundingStep(tech));s.nations.england.cash=0;s.nations.england.finance.credit=0;const next=availableTech(s.nations.england).find(t=>t.id!==tech).id;assert.throws(()=>command(s,'england',{type:'researchStart',tech:next}),/base research funding/);});
test('idle and unfunded researchers are separate; completed tree does not falsely warn',()=>{const s=createGame(),n=s.nations.england;assert.equal(researchAttention(n).idle,3);n.projects=[{tech:availableTech(n)[0].id,funding:0}];assert.deepEqual(researchAttention(n),{idle:2,unfunded:1});n.projects=[];n.known=Object.keys(TECHS);assert.deepEqual(researchAttention(n),{idle:0,unfunded:0});});
test('world news excludes routine unit activity and includes public foreign diplomacy once',()=>{
 const s={player:'england',nations:{england:{name:'England'},france:{name:'France'}},reports:[
 {nation:'england',kind:'army',recovered:20,text:'pikeman recovered health'},
 {nation:'england',kind:'civilian',text:'Work cancelled: province lost.'},
 {nation:'england',kind:'research',completed:true,text:'A discovery'},
 {nation:'england',kind:'event',text:'Rats in the grain store'},
 {nation:'france',kind:'diplomacy',allianceAccepted:true,text:'France and Spain allied'},
 {nation:'spain',kind:'diplomacy',allianceAccepted:true,text:'France and Spain allied'},
 {nation:'france',kind:'diplomacy',office:'consulate',text:'Trade consulate opened in Italy.'},
 {nation:'france',kind:'spy',text:'Private foreign spy report'},
 {nation:'france',kind:'diplomacy',allianceRejected:true,text:'Private rejected proposal'}]};
 const news=relevantNews(s);assert.equal(news.important.length,4);assert.equal(news.routine.length,2);assert.ok(news.important.some(r=>r.text==='France: Trade consulate opened in Italy.'));assert.ok(!news.important.some(r=>/recovered|cancelled|Private/.test(r.text)));
});
test('strength warning is strictly more than double, uses ratings and excludes merchant fleets',()=>{
 const s=createGame();s.armies=[{owner:'england',type:'pikeman',hp:100},...Array.from({length:2},()=>({owner:'france',type:'pikeman',hp:100}))];s.ships=[];
 assert.ok(!strengthWarnings(s).some(w=>w.domain==='military'));s.armies.push({owner:'france',type:'pikeman',hp:100});assert.deepEqual(strengthWarnings(s).find(w=>w.domain==='military').rivals,['france']);
 s.ships=[{owner:'france',type:'carrack',hp:100}];assert.ok(!strengthWarnings(s).some(w=>w.domain==='naval'));
 s.ships=[{owner:'france',type:'galleon',hp:100}];assert.ok(strengthWarnings(s).some(w=>w.domain==='naval'&&w.own===0));
 s.nations.france.alive=false;assert.equal(strengthWarnings(s).length,0);
});
