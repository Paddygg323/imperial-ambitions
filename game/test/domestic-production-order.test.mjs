import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {createGame,finishTurnEconomy,saveGame,loadGame} from '../engine.mjs';
test('domestic timber feeds standing manufacture in the same economy phase, including after reload',()=>{
 let s=createGame();s.civilians=[];s.armies=[];s.ships=[];s.construction=[];
 for(const [id,n] of Object.entries(s.nations)){n.alive=id==='england';n.orders.production={};}
 const n=s.nations.england;
 for(const t of s.tiles.filter(t=>t.owner==='england'))t.level=0;
 const capital=s.tiles.find(t=>t.id===n.capital);capital.resource='timber';capital.level=2;capital.prospected=true;
 n.stock.timber=0;n.stock.lumber=0;n.stock.grain=100;n.stock.meat=100;n.orders.production={lumber:1};
 s=loadGame(saveGame(s));s.turnPhase='combat';const result=finishTurnEconomy(s);
 assert.equal(result.nations.england.stock.timber,0);assert.equal(result.nations.england.stock.lumber,1);
 const reports=result.reports.filter(r=>r.nation==='england');
 assert.ok(reports.findIndex(r=>r.kind==='deliveries')<reports.findIndex(r=>r.kind==='production'));
 assert.equal(reports.find(r=>r.kind==='production'&&r.recipe==='lumber').made,1);
 assert.ok(reports.findIndex(r=>r.kind==='deliveries')<reports.findIndex(r=>r.kind==='finance'));
 assert.ok(reports.findIndex(r=>r.kind==='finance')<reports.findIndex(r=>r.kind==='production'));
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-economy-schedule-audit.json',import.meta.url)));
 for(const c of audit.cases)for(const id of new Set(c.calls.map(x=>x.nation))){const stages=c.calls.filter(x=>x.nation===id).map(x=>x.stage);assert.ok(stages.indexOf('deliverDomestic')<stages.indexOf('accrueInterest'));assert.ok(stages.indexOf('accrueInterest')<stages.indexOf('startCityProduction'));}
});

test('forced sale preserves production inputs and cannot sell output not yet manufactured',()=>{
 let s=createGame();s.civilians=[];s.armies=[];s.ships=[];s.construction=[];
 for(const [id,n] of Object.entries(s.nations)){n.alive=id==='england';n.orders.production={};}
 const n=s.nations.england;for(const t of s.tiles)t.level=0;
 for(const g in n.stock)n.stock[g]=0;
 n.cash=-1000;n.finance.stage=4;n.stock.timber=2;n.stock.fabric=1;n.stock.grain=100;n.stock.meat=100;n.orders.production={lumber:1};
 s=loadGame(saveGame(s));s.turnPhase='combat';const result=finishTurnEconomy(s),after=result.nations.england;
 assert.equal(after.stock.fabric,0);assert.equal(after.stock.timber,0);assert.equal(after.stock.lumber,1);
 assert.equal(result.reports.find(r=>r.nation==='england'&&r.kind==='finance').receipts,62);
 assert.equal(result.reports.find(r=>r.nation==='england'&&r.kind==='production').made,1);
});

test('bankruptcy ends manufacturing before outstanding production can run',()=>{
 let s=createGame();s.civilians=[];s.armies=[];s.ships=[];s.construction=[];
 for(const [id,n] of Object.entries(s.nations)){n.alive=id==='england';n.orders.production={};}
 const n=s.nations.england;for(const t of s.tiles)t.level=0;
 n.cash=-10000;n.finance.stage=5;n.stock.timber=2;n.stock.lumber=0;n.orders.production={lumber:1};
 s=loadGame(saveGame(s));s.turnPhase='combat';const result=finishTurnEconomy(s);
 assert.equal(result.outcome.reason,'bankruptcy');assert.equal(result.nations.england.stock.lumber,0);
 assert.equal(result.reports.some(r=>r.nation==='england'&&r.kind==='production'),false);
 assert.equal(loadGame(saveGame(result)).outcome.reason,'bankruptcy');
});
