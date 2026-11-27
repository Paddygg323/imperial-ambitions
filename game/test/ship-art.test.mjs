import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {SHIP_ATLAS,fleetPortraitShip,shipSpriteLayout,shipSpriteHit} from '../ship-art.mjs';
import {SHIPS} from '../rules.mjs';

test('every ship class resolves to a distinct packed source with intact provenance',async()=>{
 assert.deepEqual(Object.keys(SHIP_ATLAS.frames).sort(),Object.keys(SHIPS).sort());
 const regions=[];
 for(const f of Object.values(SHIP_ATLAS.frames)){
  assert.equal(createHash('sha256').update(await readFile(new URL('../../'+f.source,import.meta.url))).digest('hex'),f.sha256);
  const [x,y,w,h]=f.rect;
  assert(x>=0&&y>=0&&w>0&&h>0&&x+w<=SHIP_ATLAS.width&&y+h<=SHIP_ATLAS.height);
  for(const [a,b,c,d]of regions)assert(x+w<=a||a+c<=x||y+h<=b||b+d<=y,'Overlapping ship art');
  regions.push(f.rect);
 }
});
test('ship art preserves aspect ratio and waterline across zoom without clipping',()=>{
 for(const type of Object.keys(SHIPS))for(const size of [44,62,92,130]){
  const {source:[,,sw,sh],destination:[x,y,w,h]}=shipSpriteLayout(type,200,180,size);
  assert(Math.abs(w/h-sw/sh)<1e-10);assert(Math.abs(x+w/2-200)<1e-10);
  assert(Math.abs(y+h-180)<1e-10);assert(h<=size*.94+1e-9);
 }
 assert.equal(shipSpriteLayout('unknown',0,0,100),null);
});
test('selected class wins in mixed fleets without altering ships, orders or array order',()=>{
 const ships=[{id:'a',type:'carrack',order:{job:'sail',destination:'sea2'}},{id:'b',type:'shipOfTheLine'},{id:'c',type:'fluyte'}];
 const before=JSON.stringify(ships);
 assert.equal(fleetPortraitShip(ships).id,'b');
 assert.equal(fleetPortraitShip(ships,['c']).id,'c');
 assert.equal(fleetPortraitShip(ships,['a','c']).id,'c');
 assert.equal(fleetPortraitShip(ships,['missing']).id,'b');
 assert.equal(fleetPortraitShip([]),null);
 assert.equal(JSON.stringify(ships),before);
});
test('tall sails remain clickable, and distant fleet markers keep their existing touch target',()=>{
 const bounds=shipSpriteLayout('shipOfTheLine',200,195,130).destination;
 const fleet={x:200,y:180,bounds};
 assert(shipSpriteHit(fleet,200,bounds[1]+3));
 assert(shipSpriteHit(fleet,200,180));
 assert(!shipSpriteHit(fleet,20,20));
 assert(shipSpriteHit({x:200,y:180},205,185));
});
