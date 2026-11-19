import {provinceFixture} from './province-fixtures.mjs';
import {generateOriginalProvinces} from '../../map-provinces.mjs';
import {pathToFileURL} from 'node:url';
export function relocationFixture(n){
 const s=provinceFixture(n);generateOriginalProvinces(s,!!(n%2));
 const id=n%8,pv=new DataView(s.provinces.buffer),old=pv.getInt16(id*212+68,true);
 const tile=n%3===0?old:pv.getInt16(id*212+124+((n%3)+5)*2,true);
 if(n%4===0)pv.setInt16(id*212+68,-1,true);
 return {...s,id,tile,noWrap:!!(n%2)};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify(Array.from({length:24},(_,n)=>{const s=relocationFixture(n);return {n,id:s.id,tile:s.tile,noWrap:s.noWrap,tiles:Buffer.from(s.tiles).toString('hex'),provinces:Buffer.from(s.provinces).toString('hex')};})));
