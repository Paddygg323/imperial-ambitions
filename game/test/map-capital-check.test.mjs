import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {originalCapitalSitesAvailable} from '../map-capital-check.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-map-capital-check.json',import.meta.url)));
test('capital-site validation matches64 native checks and RNG effects',()=>{
 assert.equal(audit.cases.length,64);
 assert.ok(audit.cases.some(c=>c.accepted));assert.ok(audit.cases.some(c=>!c.accepted));
 for(const c of audit.cases){
  const tiles=new Uint8Array(6480*40),n=c.n;
  for(let i=0;i<6480;i++){tiles[i*40]=5;tiles[i*40+4]=n%8===0?255:22;}
  for(let nation=0;nation<22;nation++){
   if(n%8===1&&nation<12)continue;
   const x=2+(nation%11)*9,y=10+Math.trunc(nation/11)*20;
   for(let dy=0;dy<3;dy++)for(let dx=0;dx<3;dx++){
    const p=((y+dy)*108+x+dx)*40;tiles[p]=n%8>=4?0:[0,1,2,3,4,6,7,0][(Math.trunc(n/8)+nation)%8];tiles[p+4]=nation;
   }
  }
  const before=tiles.slice(),state={tiles,randomState:c.seed};
  assert.equal(originalCapitalSitesAvailable(state,c.historical,c.noWrap),c.accepted,`accept ${n}`);
  assert.equal(state.randomState,c.randomState,`RNG ${n}`);assert.deepEqual(tiles,before);
 }
});
