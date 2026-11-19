import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {strategicRegimentRating,strategicStrength,strategicShipRating,strategicNavyRating} from '../strategic-strength.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-strength-analysis-audit.json',import.meta.url)));
test('strategic regiment ratings match90 original cost-based evaluations',()=>{
 assert.equal(audit.ratings.length,90);for(const c of audit.ratings)assert.equal(strategicRegimentRating(c.unit),c.rating,JSON.stringify(c));
});
test('border and nonborder strength match240 original aggregate evaluations',()=>{
 assert.equal(audit.cases.length,240);for(const c of audit.cases)assert.deepEqual(strategicStrength(c),{border:c.border,nonborder:c.nonborder},JSON.stringify(c));
});

test('strategic naval ratings match original12 ship costs and54 ownership/category combinations',()=>{
 const naval=JSON.parse(readFileSync(new URL('../../outputs/Native-naval-strategic-rating-audit.json',import.meta.url)));
 assert.equal(naval.ratings.length,12);assert.equal(naval.cases.length,54);
 for(const c of naval.ratings)assert.equal(strategicShipRating(c.type),c.rating);
 for(const c of naval.cases)assert.equal(strategicNavyRating(c.fleet,c.nation),c.rating,JSON.stringify(c));
});
