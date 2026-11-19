import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {battlefieldWidth,campaignBattlefield} from '../battle-map.mjs';
const reference=JSON.parse(readFileSync(new URL('./native-battlefield-width.json',import.meta.url)));
test('battlefield width matches 37 original regiment and emplacement cases',()=>{
 for(const c of reference.cases)assert.equal(battlefieldWidth([{type:c.type,emplaced:c.emplaced}]),c.width,JSON.stringify(c));
});
test('campaign maps account for upgraded fort guns without modifying campaign forces',()=>{
 const forces={england:[{type:'pikeman'}],france:[{type:'levy'}]},before=JSON.stringify(forces);
 const plain=campaignBattlefield(forces,{known:[]},0),fort=campaignBattlefield(forces,{known:['97']},3);
 assert.equal(plain.activeWidth,17);assert.equal(fort.activeWidth,battlefieldWidth([{type:'siegeGun',emplaced:true}]));
 assert.equal(fort.cells.length,464);assert.ok(fort.cells.every(c=>c.terrain===0));assert.equal(JSON.stringify(forces),before);
 fort.cells[0].terrain=2;assert.equal(fort.cells[1].terrain,0,'tiles are separate objects');
});
