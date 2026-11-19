import test from 'node:test';import assert from 'node:assert/strict';
import {generateHistoricalWorld} from '../map-historical-world.mjs';
import {historicalGenerationRecords} from '../map-historical-records.mjs';
import {adjacentOriginalFineTile} from '../map-zone-smoothing.mjs';
test('ordinary seeded worlds finish with valid towns, resources and sea coverage',()=>{
 const history=historicalGenerationRecords();let retries=0;
 for(const name of ['England','Portugal','Pixel','Family','1500','Empire','Iron','Timber','Atlantic','London','Lisbon','New World']){
  const s=generateHistoricalWorld([...Buffer.from(name)],{timeSeed:1});assert.ok(s.accepted,`${name}: ${JSON.stringify(s.attempts)}`);retries+=s.attempts.length-1;
  const pv=new DataView(s.provinces.buffer),tv=new DataView(s.tiles.buffer);
  let towns=0;
  for(let id=0;id<152;id++){
   const p=id*212,count=s.provinces[p+4];if(!count)continue;
   const town=pv.getInt16(p+68,true);assert.ok(town>=0&&town<6480);assert.equal(tv.getInt16(town*40+22,true),id);assert.ok(s.tiles[town*40+28]&2);towns++;
   const neighbors=Array.from({length:6},(_,d)=>adjacentOriginalFineTile(town,d));
   assert.ok(neighbors.includes(pv.getInt16(p+120,true)));assert.ok(neighbors.includes(pv.getInt16(p+122,true)));
  }
  assert.ok(towns>100);
  for(let i=0;i<6480;i++){
   const p=i*40;if(history[p]!==5){assert.equal(s.tiles[p+4],history[p+4]);if(history[p+21]!==14)assert.equal(s.tiles[p+20],history[p+20]);}
   if(s.tiles[p]===5)assert.ok(s.tiles[p+4]>=22&&s.tiles[p+4]<22+s.seaCount);
   assert.ok(s.tiles[p+20]===255||s.tiles[p+20]<28);
  }
 }
 assert.ok(retries>0,'exercise rejection and regeneration');
});
test('historical world retries are deterministic and bounded',()=>{
 const seed=[80,105,120,101,108],a=generateHistoricalWorld(seed,{timeSeed:1}),b=generateHistoricalWorld(seed,{timeSeed:1});assert.deepEqual(a,b);
 const limited=generateHistoricalWorld(seed,{timeSeed:1,maxAttempts:1});assert.equal(limited.attempts.length,1);
 if(!limited.accepted)assert.equal(limited.stage,'attempt-limit');
});
