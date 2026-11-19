import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,command,finishTurnEconomy,loadGame,saveGame} from '../engine.mjs';
import {spyInCountry,spyInProvince,scoutedGarrison,resolveSpies} from '../espionage.mjs';
import {projectGain} from '../research.mjs';
function fixture(){const s=createGame(),t=s.tiles.find(t=>t.id===s.nations.france.capital);s.armies=[];s.civilians.push({id:'test-spy',owner:'england',type:'spy',tile:s.nations.england.capital,order:null});return {s,t};}
test('spy work activates after a saved turn, scouts garrison and boosts only researched foreign knowledge',()=>{
 let {s,t}=fixture();s.nations.france.known.push('7');const p={tech:'7',funding:0,progress:0},base=projectGain(s,s.nations.england,p);
 s.armies.push({id:'guard',owner:'france',type:'levy',province:t.province,hp:80,experience:1,order:null});
 assert.equal(scoutedGarrison(s,'england',t.province),null);
 s=command(s,'england',{type:'civilian',unit:'test-spy',job:'spy',tile:t.id});
 assert.equal(spyInCountry(s,'england','france'),false);
 s=finishTurnEconomy({...loadGame(saveGame(s)),turnPhase:'combat'});
 assert.equal(spyInCountry(s,'england','france'),true);assert.ok(spyInProvince(s,'england',t.province));
 assert.ok(projectGain(s,s.nations.england,p)>base);
 assert.deepEqual(scoutedGarrison(s,'england',t.province),[{type:'levy',hp:80,experience:1}]);
 assert.equal(s.civilians.find(u=>u.id==='test-spy').order.job,'spy');
 const next=command(s,'england',{type:'cancelCivilian',unit:'test-spy'});
 assert.ok(spyInCountry(next,'england','france'),'native completed-assignment snapshot survives cancelling orders');
});
test('detection removes a spy and its benefits, while home counterespionage increases risk',()=>{
 const {s,t}=fixture(),u=s.civilians.find(u=>u.id==='test-spy');u.tile=t.id;u.spyAssignment=t.id;u.order={job:'spy',tile:t.id,remaining:1};
 const safe=structuredClone(s);resolveSpies(safe,()=>2);assert.ok(spyInCountry(safe,'england','france'));
 s.civilians.push({id:'counter',type:'spy',owner:'france',tile:t.id,spyAssignment:t.id,order:{job:'spy',tile:t.id,remaining:1}});
 resolveSpies(s,()=>2);assert.ok(!s.civilians.some(u=>u.id==='test-spy'));assert.ok(s.civilians.some(u=>u.id==='counter'));
 assert.equal(spyInCountry(s,'england','france'),false);assert.equal(scoutedGarrison(s,'england',t.province),null);
 assert.ok(s.reports.some(r=>r.nation==='england'&&r.kind==='spy'));assert.doesNotThrow(()=>loadGame(saveGame(s)));
});
test('a legacy static spies list grants no free research and corrupt assignment fails loading',()=>{
 const {s}=fixture(),p={tech:'7',funding:0};s.nations.france.known.push('7');const before=projectGain(s,s.nations.england,p);
 s.nations.england.spies=['france'];assert.equal(projectGain(s,s.nations.england,p),before);
 s.civilians.find(u=>u.id==='test-spy').spyAssignment='missing';assert.throws(()=>saveGame(s),/Invalid civilian/);
});


test('foreign technology knowledge identifies real spy sources without duplicating countries',async()=>{
 const {technologySources}=await import('../research.mjs');const {s,t}=fixture();s.nations.france.known.push('7');
 const source=()=>technologySources(s,s.nations.england,'7').find(n=>n.id==='france');
 assert.equal(source().spy,false);
 const u=s.civilians.find(u=>u.id==='test-spy');u.spyAssignment=t.id;s.civilians.push({...u,id:'second-spy'});
 assert.equal(source().spy,true);assert.equal(technologySources(s,s.nations.england,'7').filter(n=>n.id==='france').length,1);
 s.nations.france.alive=false;assert.equal(source(),undefined);
});
test('save rejects malformed spy missions but permits pending and completed snapshots',()=>{
 const {s,t}=fixture();const valid=command(s,'england',{type:'civilian',unit:'test-spy',job:'spy',tile:t.id});
 assert.doesNotThrow(()=>loadGame(saveGame(valid)));
 for(const patch of [{type:'builder'},{order:{job:'spy',tile:'missing',remaining:1}},{order:{job:'spy',tile:t.id,remaining:2}}]){
  const bad=structuredClone(valid);Object.assign(bad.civilians.find(u=>u.id==='test-spy'),patch);assert.throws(()=>saveGame(bad),/Invalid civilian/);
 }
});
