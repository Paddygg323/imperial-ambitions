import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {startingCash} from '../starting-cash.mjs';
import {createGame,saveGame,loadGame} from '../engine.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-starting-cash-audit.json',import.meta.url)));
test('starting treasury matches all original human difficulty and AI branches',()=>{
 assert.equal(audit.cases.length,10);
 for(const c of audit.cases)assert.equal(startingCash(c),c.cash);
 assert.equal(startingCash(),12000);
 assert.throws(()=>startingCash({difficulty:5}));
});
test('cash setting is independent and loading never replenishes treasury',()=>{
 for(let difficulty=0;difficulty<5;difficulty++){
  const s=createGame({cashDifficulty:difficulty,resourceDifficulty:2,creditDifficulty:2});
  assert.equal(s.nations.england.cash,startingCash({difficulty}));
  assert.equal(s.nations.france.cash,12000);assert.equal(s.nations.england.stock.iron,20);
  s.nations.england.cash=731;assert.equal(loadGame(saveGame(s)).nations.england.cash,731);
  delete s.cashDifficulty;assert.equal(loadGame(saveGame(s)).nations.england.cash,731);
 }
 assert.throws(()=>createGame({cashDifficulty:5}),/cash difficulty/);
});
