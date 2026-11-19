import test from 'node:test';import assert from 'node:assert/strict';
import {roadEdges,segmentCrossing} from '../landscape-detail.mjs';
test('road art uses each actual surveyed link once and does not alter transport',()=>{
 const a={id:'2,2',x:2,y:2},b={id:'3,2',x:3,y:2},c={id:'4,2',x:4,y:2};
 const s={tiles:[c,b,a],transportLinks:{'2,2|3,2':'road','3,2|4,2':'rail'}};
 const before=JSON.stringify(s),ix=new Map(s.tiles.map(t=>[t.id,t]));
 assert.deepEqual(roadEdges(s,ix,()=>true).map(e=>e.kind).sort(),['rail','road']);
 assert.equal(roadEdges(s,ix,t=>t!==c).length,1);assert.equal(JSON.stringify(s),before);
});
test('bridge intersections reject parallel lines and non-crossing segments',()=>{
 const a={x:0,y:0},b={x:10,y:0};
 assert.deepEqual(segmentCrossing(a,b,{x:5,y:-5},{x:5,y:5}),{x:5,y:0});
 assert.equal(segmentCrossing(a,b,{x:0,y:1},{x:10,y:1}),null);
 assert.equal(segmentCrossing(a,b,{x:15,y:-5},{x:15,y:5}),null);
});
