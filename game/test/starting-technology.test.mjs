import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {startingTechnology} from '../starting-technology.mjs';
import {createGame,command,saveGame,loadGame} from '../engine.mjs';
import {maxDevelopment,availableTech} from '../rules.mjs';
const native=JSON.parse(readFileSync(new URL('../../outputs/Native-starting-technology-audit.json',import.meta.url)));
test('all50 starting farm and technology grant combinations match native selection',()=>{
 assert.equal(native.cases.length,50);for(const c of native.cases)assert.deepEqual(startingTechnology(c),c.known);
 assert.throws(()=>startingTechnology({agriculture:5}));
});
test('normal start permits grain and cattle upgrades and subsequent research without duplicate grants',()=>{
 const s=createGame(),n=s.nations.england;
 for(const nation of Object.values(s.nations))assert.deepEqual(nation.known,['8','11']);
 assert.equal(maxDevelopment(n,{resource:'grain'}),2);assert.equal(maxDevelopment(n,{resource:'meat'}),2);
 assert.ok(availableTech(n).some(t=>t.id==='26'));assert.ok(!availableTech(n).some(t=>t.id==='8'));
 assert.throws(()=>command(s,'england',{type:'researchStart',tech:'8'}));
 const copy=loadGame(saveGame(s));assert.deepEqual(copy.nations.england.known,['8','11']);
 copy.nations.england.known=[];delete copy.agricultureDifficulty;delete copy.technologyDifficulty;
 assert.deepEqual(loadGame(saveGame(copy)).nations.england.known,[]);
});
test('native mirrored AI starting grants are independent of cash and warehouse choices',()=>{
 const s=createGame({agricultureDifficulty:4,technologyDifficulty:4});
 assert.deepEqual(s.nations.england.known,[]);
 assert.deepEqual(s.nations.france.known,['8','11','26','38','7','12','22','10','27']);
 assert.equal(s.nations.england.cash,12000);assert.equal(s.nations.england.stock.iron,20);
});
