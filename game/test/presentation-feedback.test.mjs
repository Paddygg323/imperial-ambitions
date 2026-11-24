import test from 'node:test';
import assert from 'node:assert/strict';
import {battleVisualEvent} from '../battle-effects.mjs';
import {coverFrame} from '../battle-art.mjs';
import {civilianFrame,CIVILIAN_WORK} from '../civilian-art.mjs';
import {WORK_FRAMES} from '../civilian-frames.mjs';
test('visual feedback reads committed movement and actual losses without changing state',()=>{
 const before={units:[{id:'a',tile:31,hp:100},{id:'b',tile:33,hp:80}]},after=structuredClone(before);
 after.units[0].tile=32;after.units[1].hp=57;const a=structuredClone(before),b=structuredClone(after);
 assert.deepEqual(battleVisualEvent(before,after,{type:'move',unit:'a'}),{kind:'move',from:31,to:32});
 assert.deepEqual(battleVisualEvent(before,after,{type:'attack',unit:'a',target:'b'}),{kind:'attack',from:31,to:33,loss:23});
 assert.equal(battleVisualEvent(before,before,{type:'move',unit:'a'}),null);
 assert.equal(battleVisualEvent(before,after,{type:'endTurn'}),null);
 assert.deepEqual(before,a);assert.deepEqual(after,b);
});
test('terrain variations preserve forest, rough and impassable identities',()=>{
 for(let tile=0;tile<464;tile++){assert.ok([0,1,3].includes(coverFrame(1,tile)));assert.ok([0,2].includes(coverFrame(2,tile)));assert.equal(coverFrame(3,tile),4);assert.equal(coverFrame(4,tile),5);assert.equal(coverFrame(0,tile),null);}
 assert.equal(new Set(Array.from({length:29},(_,t)=>coverFrame(1,t))).size,3);
});
test('six distinct work poses keep anchors within sheets and freeze under reduced motion',()=>{
 for(const [role,cycle]of Object.entries(CIVILIAN_WORK)){
  assert.equal(new Set(cycle.sequence).size,6);
  for(let time=0;time<10000;time+=61){assert.ok(WORK_FRAMES[role][civilianFrame(role,time)]);assert.equal(civilianFrame(role,time,true),0);}
  for(const {rect:[x,y,w,h],anchor:[ax,ay]}of WORK_FRAMES[role]){assert.ok(x>=0&&y>=0&&x+w<=1536&&y+h<=1024);assert.ok(ax>0&&ax<w&&ay>0&&ay<h);}
 }
 assert.equal(civilianFrame('railBuilder',730),civilianFrame('engineer',730));
});
