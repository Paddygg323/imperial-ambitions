import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {startingStock} from '../starting-stock.mjs';
import {createGame,saveGame,loadGame} from '../engine.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-starting-stock-audit.json',import.meta.url)));
test('all 28 goods match original human and AI warehouse setup across five resource settings',()=>{
 for(const c of audit.cases)assert.deepEqual(startingStock(c),c.stock);
});
test('new campaigns use native normal warehouse quantities; reload preserves actual remaining stocks',()=>{
 const s=createGame();for(const [id,n] of Object.entries(s.nations))assert.deepEqual(n.stock,startingStock({human:id===s.player}));
 assert.equal(s.nations.england.stock.iron,20);assert.equal(s.nations.england.stock.castIron,8);
 s.nations.england.stock.iron=7;const copy=loadGame(saveGame(s));assert.equal(copy.nations.england.stock.iron,7);
 delete s.resourceDifficulty;assert.equal(loadGame(saveGame(s)).nations.england.stock.iron,7);
});
test('resource setting is independent of credit and original hard-setting AI bonuses are applied',()=>{
 const s=createGame({resourceDifficulty:4,creditDifficulty:0});assert.equal(s.nations.england.stock.iron,12);assert.equal(s.nations.france.stock.iron,20);assert.equal(s.nations.france.stock.castIron,13);
 assert.throws(()=>createGame({resourceDifficulty:5}),/resource difficulty/);
});
test('original workforce initializer gives four peasants, with recruitment adding real next-turn labour',async()=>{
 const {STARTING_WORKERS}=await import('../starting-stock.mjs');
 const {command,resolveTurn,labour}=await import('../engine.mjs');
 assert.deepEqual(STARTING_WORKERS,{peasant:4,apprentice:0,journeyman:0,master:0});
 for(const c of audit.cases)assert.deepEqual(c.workers,[4,0,0,0]);
 let s=createGame({simpleFood:true});for(const n of Object.values(s.nations))assert.equal(n.workers.length,4);
 assert.equal(labour(s.nations.england),4);
 s=command(s,'england',{type:'production',recipe:'lumber',quantity:2});
 assert.throws(()=>command(s,'england',{type:'production',recipe:'lumber',quantity:3}),/labour/);
 s=command(s,'england',{type:'recruitWorker',quantity:1});assert.equal(s.nations.england.workers.length,4);
 s.market={complete:true,deals:[],inTransit:[],diplomacy:[]};const end=resolveTurn(s);
 assert.equal(end.nations.england.workers.length,5);assert.equal(labour(end.nations.england),5);
 assert.equal(loadGame(saveGame(end)).nations.england.workers.length,5);
});
