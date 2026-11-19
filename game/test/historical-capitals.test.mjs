import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import europe from '../data/europe.mjs';
import {createGame,saveGame,loadGame} from '../engine.mjs';
import {tradeCheckpoints} from '../merchant-routes.mjs';
test('native imported capital marking covers all22countries, not only Great Powers',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-historical-capitals-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,88);
 for(const c of audit.cases){assert.equal(c.flags,c.town?(c.province===0?0x23:0x22):0);assert.equal(c.globalProvince,c.country*4+c.province);}
 for(const p of europe.provinces)assert.equal(p.historicalCapital,p.id.endsWith('-0'));
});
test('historical minor capitals drive development, ports and merchant endpoints',()=>{
 const s=createGame(),expected={ireland:'Dublin',scotland:'Edinburg',denmark:'Copenhagen',germany:'Hamburg',italy:'Florence',switzerland:'Bern'};
 for(const [id,name] of Object.entries(expected)){
  const p=s.provinces.find(p=>p.owner===id&&p.historicalCapital),m=s.minors[id];assert.equal(p.name,name);assert.equal(m.capital,p.town);
  assert.equal(s.tiles.find(t=>t.id===m.capital).port,true);
  assert.equal(tradeCheckpoints(s,{seller:id,buyer:'england'})[0].port,p.town);
 }
 const loaded=loadGame(saveGame(s));assert.deepEqual(loaded.minors,s.minors);
});
test('loading existing minor saves does not relocate their capitals',()=>{
 const s=createGame(),m=s.minors.scotland,p=s.provinces.find(p=>p.owner==='scotland'&&!p.historicalCapital);m.capital=p.town;
 assert.equal(loadGame(saveGame(s)).minors.scotland.capital,p.town);
});
