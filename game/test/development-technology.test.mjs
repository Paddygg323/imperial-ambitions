import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {developmentTechnology,planningDevelopmentMaximum} from '../development-technology.mjs';
const audit=JSON.parse(fs.readFileSync(new URL('../../outputs/Native-development-technology-audit.json',import.meta.url)));
test('development technology and tile limits match101 original initial/effect/query configurations',()=>{
 assert.equal(audit.cases.length,101);
 for(const c of audit.cases){const levels=developmentTechnology({known:c.known});assert.deepEqual(levels,c.levels,c.known.join(','));
  for(let good=-1;good<28;good++)assert.deepEqual([0,15].map(picture=>planningDevelopmentMaximum({good,picture},levels)),c.maximum[good+1]);
 }
});
import {createGame,command} from '../engine.mjs';
import {maxDevelopment} from '../rules.mjs';
test('builder cannot develop an undiscovered crop and discovery unlocks its first level',()=>{
 const s=createGame(),n=s.nations.england,u=s.civilians.find(c=>c.owner==='england'&&c.type==='builder'),tile=s.tiles.find(t=>t.id===u.tile);
 Object.assign(tile,{resource:'sugarCane',terrain:15,level:0,prospected:true});n.known=n.known.filter(id=>!['0','14','24','43'].includes(id));
 assert.equal(maxDevelopment(n,tile),0);const snapshot=JSON.stringify(s);
 assert.throws(()=>command(s,'england',{type:'civilian',unit:u.id,job:'develop',tile:tile.id}),/Research is needed/);assert.equal(JSON.stringify(s),snapshot);
 n.known.push('0');assert.equal(maxDevelopment(n,tile),1);
 const next=command(s,'england',{type:'civilian',unit:u.id,job:'develop',tile:tile.id});assert.equal(next.civilians.find(c=>c.id===u.id).order.job,'develop');
 n.known.push('14');assert.equal(maxDevelopment(n,tile),2);
});
