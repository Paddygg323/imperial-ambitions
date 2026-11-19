import test from 'node:test';
import assert from 'node:assert/strict';
import {prospected} from '../world.mjs';
import {revealCoast,revealInterior} from '../overseas.mjs';
test('coastal crops are identifiable but minerals require a national survey',()=>{
 const crop={id:'1,1',x:1,y:1,terrain:15,resource:'sugarCane',province:'new',owner:'tribe',prospected:false};
 const mine={id:'2,1',x:2,y:1,terrain:8,resource:'gold',province:'new',owner:'tribe',prospected:false};
 const s={tiles:[crop,mine],provinces:[{id:'new',old:false}],nations:{england:{known:[],revealed:[],prospected:[]},portugal:{known:[],revealed:[],prospected:[]}},seas:{zones:[{id:'coast',coast:['1,1','2,1']}]}};
 revealCoast(s,'england','coast');
 assert.equal(prospected(s,'england',crop),true);
 assert.deepEqual(s.nations.england.known,['0']);
 assert.ok(!prospected(s,'england',mine));
 revealInterior(s,'england','2,1');
 assert.ok(prospected(s,'england',mine));
 assert.ok(s.nations.england.known.includes('3'));
 assert.ok(!prospected(s,'portugal',mine));
 assert.equal(mine.resource,'gold');
});
