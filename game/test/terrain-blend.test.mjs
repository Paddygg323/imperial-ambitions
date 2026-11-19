import test from 'node:test';
import assert from 'node:assert/strict';
import {terrainPixels} from '../terrain-blend.mjs';
test('three-way terrain junction has the same colour from either adjoining tile',()=>{
 const a=terrainPixels('#88aa66',[{dx:1,dy:0,color:'#999080'},{dx:.5,dy:-.866,color:'#668866'}]);
 const b=terrainPixels('#999080',[{dx:-1,dy:0,color:'#88aa66'},{dx:-.5,dy:-.866,color:'#668866'}]);
 assert.deepEqual(a.shades[0],b.shades[4]);
});
test('terrain interpolation is independent of neighbour draw order and preserves flat land',()=>{
 const neighbours=[{dx:1,dy:0,color:'#999080'},{dx:.5,dy:-.866,color:'#668866'}];
 assert.deepEqual(terrainPixels('#88aa66',neighbours).data,terrainPixels('#88aa66',[...neighbours].reverse()).data);
 const {data}=terrainPixels('#88aa66',[]);for(let k=0;k<data.length;k+=4)if(data[k+3])assert.deepEqual([...data.slice(k,k+3)],[136,170,102]);
});
