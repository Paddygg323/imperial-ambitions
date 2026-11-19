import {resetOriginalMapTiles} from '../../map-tile-reset.mjs';
import {resetOriginalMapProvinces} from '../../map-province-reset.mjs';
import {pathToFileURL} from 'node:url';
export function provinceFixture(n){
 const tiles=resetOriginalMapTiles(new Uint8Array(6480*40)),provinces=resetOriginalMapProvinces(new Uint8Array(152*212)),tv=new DataView(tiles.buffer),pv=new DataView(provinces.buffer);
 for(let i=0;i<6480;i++)tiles[i*40]=5;
 for(let id=0;id<8;id++){
  const x0=20+(id%4)*4,y0=20+Math.floor(id/4)*4;
  for(let y=0;y<4;y++)for(let x=0;x<4;x++){
   const tile=(y0+y)*108+x0+x,p=tile*40;
   tiles[p]=[0,1,2,3,4,6,7][(tile+n)%7];tiles[p+4]=id+(n%2?12:0);tiles[p+20]=(tile+n)%29-1;tiles[p+21]=2;tiles[p+13]=63;
   tv.setInt16(p+22,id,true);
  }
  if((id+n)%3===0){const town=(y0+1)*108+x0+1;pv.setInt16(id*212+68,town,true);tiles[town*40+28]=34;tiles[town*40+21]=14;}
 }
 return {tiles,provinces,randomState:(n*7907+1)>>>0};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify(Array.from({length:24},(_,n)=>{const s=provinceFixture(n);return {n,seed:s.randomState,noWrap:!!(n%2),tiles:Buffer.from(s.tiles).toString('hex'),provinces:Buffer.from(s.provinces).toString('hex')};})));
