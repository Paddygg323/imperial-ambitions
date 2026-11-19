import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {generateHistoricalMapAttempt} from '../map-historical-attempt.mjs';
import {indexOriginalProvinceTiles} from '../map-province-tiles.mjs';
import {describeOriginalProvince} from '../map-province-neighbors.mjs';
import {selectOriginalTownSite} from '../map-town-selection.mjs';
import {adjacentOriginalFineTile} from '../map-zone-smoothing.mjs';
import {historicalGenerationRecords} from '../map-historical-records.mjs';
const historical=historicalGenerationRecords();
test('assembled accepted maps retain historical ownership and valid land/sea identifiers',()=>{
 let accepted=0,rejected=0;
 for(let seed=1;seed<=12;seed++){
  const before=historical.slice(),result=generateHistoricalMapAttempt(seed,historical);
  assert.deepEqual(historical,before,'reference map is immutable');
  if(!result.accepted){rejected++;assert.ok(['coasts','inland-seas','date-line','continent-drift','province-capacity','ocean-coverage','capital-sites'].includes(result.stage));continue;}
  accepted++;const nations=new Set(),seas=new Set(),view=new DataView(result.tiles.buffer),pv=new DataView(result.provinces.buffer);
  for(let i=0;i<6480;i++){
   const p=i*40,owner=result.tiles[p+4];
   if(historical[p]!==5){assert.notEqual(result.tiles[p],5);assert.equal(owner,historical[p+4],`Europe owner tile${i}`);}
   if(result.tiles[p]===5){assert.ok(owner>=22&&owner<22+result.seaCount);seas.add(owner-22);}
   else{
    nations.add(owner);const province=view.getInt16(p+22,true);
    assert.ok(owner<22&&province>=0&&province<152);assert.equal(result.provinces[province*212],owner);
    if(historical[p+21]===14)assert.equal(pv.getInt16(province*212+68,true),i,'historical town restored');
    if(owner>=12)assert.equal(pv.getInt16(province*212+68,true),-1,'overseas town awaits placement');
   }
  }
  assert.equal(seas.size,result.seaCount);for(let n=12;n<22;n++)assert.ok(nations.has(n),`tribe${n} present`);
  indexOriginalProvinceTiles(result.tiles,result.provinces);
  let indexed=0;
  for(let province=0;province<152;province++){
   const count=result.provinces[province*212+4];indexed+=count;
   for(let j=0;j<count;j++)assert.equal(view.getInt16(pv.getInt16(province*212+124+j*2,true)*40+22,true),province);
   const members=Array.from({length:count},(_,j)=>pv.getInt16(province*212+124+j*2,true));
   const interior=describeOriginalProvince(result.tiles,result.provinces,province);
   const expectedInterior=members.filter(tile=>Array.from({length:6},(_,d)=>adjacentOriginalFineTile(tile,d)).every(next=>next<0||[-1,province].includes(view.getInt16(next*40+22,true))));
   assert.deepEqual(interior,expectedInterior,'interior candidates exclude foreign province borders');
   for(let resource=0;resource<28;resource++)assert.equal(result.provinces[province*212+8+resource],members.filter(tile=>result.tiles[tile*40+20]===resource).length,'resource accounting');
   if(count&&pv.getInt16(province*212+68,true)===-1){
    const selected=selectOriginalTownSite(result,members,interior);
    assert.ok(members.includes(selected),'town remains inside its province');
    if(interior.length)assert.ok(interior.includes(selected),'town prefers interior');
    if(interior.some(tile=>result.tiles[tile*40]===0))assert.equal(result.tiles[selected*40],0,'town prefers flat interior');
   }
  }
  assert.equal(indexed,6480-[...Array(6480).keys()].filter(i=>result.tiles[i*40]===5).length);
 }
 assert.ok(accepted>0);assert.ok(rejected>0);
});
