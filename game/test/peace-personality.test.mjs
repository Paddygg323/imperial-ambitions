import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {peacePersonality} from '../peace-personality.mjs';
import {considerPeace} from '../peace-decision.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-peace-personality-audit.json',import.meta.url)));
test('peace personality getters match105 original executions at original CRT precision',()=>{
 assert.equal(audit.fpuControlWord,575);assert.equal(audit.cases.length,35);
 for(const c of audit.cases)assert.deepEqual(peacePersonality(c.minister204,c.minister20c),{seek:c.seek,accept:c.accept,force:c.force});
});
test('personality changes acceptance at the same pressure and retains the alliance threshold',()=>{
 const reluctant=peacePersonality(4,2),willing=peacePersonality(0,3);
 const decide=p=>considerPeace({war:true,threat:1.2,factor:1,accept:p.accept,force:p.force,alliesAtWar:0});
 assert.equal(decide(reluctant).accepted,false);assert.equal(decide(willing).accepted,true);
 assert.equal(considerPeace({war:true,threat:1.2,factor:1,accept:willing.accept,force:willing.force,alliesAtWar:1}).accepted,false);
 for(const ids of [[-1,0],[7,0],[0,5],[0,1.5]])assert.throws(()=>peacePersonality(...ids));
});

test('new AI foreign minister defaults to0 with the requested defence type in native constructors',async()=>{
 const {initialPeacePersonality}=await import('../peace-personality.mjs');
 const init=JSON.parse(readFileSync(new URL('../../outputs/Native-minister-initialization-audit.json',import.meta.url)));
 assert.equal(init.cases.length,5);
 for(const c of init.cases){assert.equal(c.foreign,0);assert.equal(c.defence,c.selected);assert.deepEqual(initialPeacePersonality(c.selected),peacePersonality(c.foreign,c.defence));}
});

test('historical AI country selection matches all64 native human/AI masks',async()=>{
 const {historicalMinisters}=await import('../peace-personality.mjs');
 const {NATIONS}=await import('../rules.mjs');
 const data=JSON.parse(readFileSync(new URL('../../outputs/Native-historical-ministers-audit.json',import.meta.url)));
 assert.equal(data.cases.length,64);
 for(const c of data.cases)for(let i=0;i<6;i++)if(c.types[i]===2){
  const actual=historicalMinisters(NATIONS[i][0]);assert.equal(actual.foreign,0);assert.equal(actual.defence,c.defence[i]);
 }
 assert.throws(()=>historicalMinisters('unknown'));
});
test('historical AI minister identities persist through campaign saves and reject corrupt IDs',async()=>{
 const {createGame,saveGame,loadGame}=await import('../engine.mjs');
 const {historicalMinisters}=await import('../peace-personality.mjs');
 const s=loadGame(saveGame(createGame()));
 for(const [id,n] of Object.entries(s.nations))if(id===s.player)assert.equal(n.ministers,undefined);else assert.deepEqual(n.ministers,historicalMinisters(id));
 const old=structuredClone(s);for(const n of Object.values(old.nations))delete n.ministers;assert.doesNotThrow(()=>loadGame(saveGame(old)));
 for(const ministers of [{foreign:7,defence:0},{foreign:0,defence:5},null]){const bad=structuredClone(s);bad.nations.france.ministers=ministers;assert.throws(()=>saveGame(bad),/ministers/);}
});
