import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {receiveMaterial} from '../material-debt.mjs';import {NATIVE_GOODS} from '../resource-categories.mjs';
import {createGame,saveGame,loadGame} from '../engine.mjs';
import {settleDomesticBattleCargo} from '../campaign-transport.mjs';import {settleMerchantBattleCargo} from '../merchant-battle-cargo.mjs';
test('captured-goods debt repayment matches 552 unchanged original calls',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-captured-material-debt-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,552);
 for(const c of audit.cases){const good=NATIVE_GOODS[c.good],n={stock:{[good]:c.stock},materialDebt:{[good]:c.debt}};
  receiveMaterial(n,good,c.quantity);assert.equal(n.stock[good],c.resultStock);assert.equal(n.materialDebt[good],c.resultDebt);}
});
test('both domestic and trade captures repay persisted raider debt before adding surplus',()=>{
 for(const trade of [false,true]){
  let s=createGame();s.nations.france.materialDebt={lumber:3};s.nations.france.stock.lumber=0;
  s=loadGame(saveGame(s));const cargo={seller:'portugal',buyer:'england',good:'lumber',quantity:8,unitPrice:40};
  if(trade)s.tradeDeliveries=[cargo];
  const result=(trade?settleMerchantBattleCargo:settleDomesticBattleCargo)(s,cargo,{raider:'france',initialCargo:6,survivingCargo:1},()=>5);
  assert.equal(result.captured,4);assert.equal(s.nations.france.materialDebt.lumber,0);assert.equal(s.nations.france.stock.lumber,1);
  assert.equal(loadGame(saveGame(s)).nations.france.stock.lumber,1);
 }
});
