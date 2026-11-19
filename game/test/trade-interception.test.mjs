import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {settleTradeInterception,deliverTrade} from '../trade.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-trade-interception-settlement-audit.json',import.meta.url),'utf8'));
test('intercepted purchase settlement matches native cash and stock adjustments and cannot deliver twice',()=>{
 assert.equal(audit.cases.length,18);
 for(const c of audit.cases){const cargo={seller:'a',buyer:'b',good:'lumber',quantity:c.quantity,unitPrice:c.price};const s={nations:{a:{alive:true,cash:10000,stock:{lumber:100}},b:{alive:true,cash:10000,stock:{lumber:100}}},tradeDeliveries:[cargo],reports:[]};
  settleTradeInterception(s,cargo,c.outcome);
  assert.deepEqual(['a','b'].map(id=>s.nations[id].cash-10000),c.cash);assert.deepEqual(['a','b'].map(id=>s.nations[id].stock.lumber-100),c.stock);
  assert.throws(()=>settleTradeInterception(s,cargo,c.outcome),/no longer pending/);assert.equal(s.reports.length,2);
  const reloaded=JSON.parse(JSON.stringify(s));deliverTrade(reloaded,'b',[]);assert.deepEqual(reloaded.nations,s.nations);
 }
});

test('interception debt survives real save/load without erasing the loss or restoring delivery',async()=>{
 const {createGame,saveGame,loadGame}=await import('../engine.mjs');const s=createGame();s.nations.england.cash=10;
 const cargo={seller:'england',buyer:'portugal',good:'lumber',quantity:1,unitPrice:100};s.tradeDeliveries=[cargo];
 settleTradeInterception(s,cargo,'lost');assert.equal(s.nations.england.cash,-90);
 const loaded=loadGame(saveGame(s));assert.equal(loaded.nations.england.cash,-90);assert.deepEqual(loaded.tradeDeliveries,[]);
 for(const value of [NaN,Infinity,-100000001,0.5]){loaded.nations.england.cash=value;assert.throws(()=>saveGame(loaded),/Invalid nation/);}
});
