import test from 'node:test';import assert from 'node:assert/strict';
import {campaignDevelopmentFactor} from '../campaign-development-factor.mjs';
test('development demand follows eligible improvements and research, not connected output',()=>{
 const s={nations:{england:{known:['36']}},tiles:[{owner:'england',resource:'timber',level:2},{owner:'england',resource:'horses',level:0},{owner:'england',resource:'sugarCane',level:0}]};
 const before=JSON.stringify(s);assert.equal(campaignDevelopmentFactor(s,'england'),8);assert.equal(JSON.stringify(s),before);
 s.tiles.push({owner:'minor0',resource:'timber',level:0});assert.equal(campaignDevelopmentFactor(s,'england'),8);
 s.tiles[3].purchasedBy='england';assert.equal(campaignDevelopmentFactor(s,'england'),2,'cheaper purchased timber replaces expensive owned timber');
 s.nations.england.known.push('0');assert.equal(campaignDevelopmentFactor(s,'england'),Math.fround(8/3),'discovery makes sugar cane an eligible improvement');
});
