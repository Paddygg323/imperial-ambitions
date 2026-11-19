import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {nextIndustrialOutput} from '../industrial-output.mjs';
import {createGame,finishTurnEconomy,saveGame,loadGame} from '../engine.mjs';
test('industrial output matches372 original smoothing evaluations',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-industrial-output-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,372);
 for(const c of audit.cases)assert.equal(nextIndustrialOutput(c.previous,c.made),c.result,JSON.stringify(c));
});
test('campaign GDP records completed manufacturing and persists through reload',()=>{
 let s=createGame();const n=s.nations.england;
 n.gdp=10;n.stock.timber=4;n.orders.production.lumber=4;
 n.workers=Array.from({length:10},(_,i)=>({id:'gdp-worker-'+i,type:'peasant',fit:true}));
 s.turnPhase='combat';s=finishTurnEconomy(s);
 const report=s.reports.find(r=>r.nation==='england'&&r.kind==='production'&&r.recipe==='lumber');
 assert.equal(report.made,2);assert.equal(s.nations.england.gdp,nextIndustrialOutput(10,2));
 s=loadGame(saveGame(s));assert.equal(s.nations.england.gdp,8);
 s.nations.england.orders.production.lumber=0;s.turnPhase='combat';s=finishTurnEconomy(s);
 assert.equal(s.nations.england.gdp,6,'idle production decays despite resource deliveries');
});

