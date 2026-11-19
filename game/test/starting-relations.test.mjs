import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {startingRelation} from '../starting-relations.mjs';
test('starting relations match15native484-entry matrices across difficulty, human status and original consortium predicate',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-starting-relations-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,15);
 for(const c of audit.cases)for(let a=0;a<22;a++)for(let b=0;b<22;b++)assert.equal(startingRelation(a,b,{humans:c.humans,powerDifficulty:c.difficulty,tribalDifficulty:c.difficulty}),c.relations[a][b],JSON.stringify({a,b,difficulty:c.difficulty,humans:c.humans}));
});

test('campaign trade relations initialize normally, preserve saved changes and reject corrupt data',async()=>{
 const {createGame,saveGame,loadGame}=await import('../engine.mjs');
 const s=createGame();assert.equal(s.relations.england.france,90);assert.equal(s.relations.england.england,255);
 s.relations.england.france=170;assert.equal(loadGame(saveGame(s)).relations.england.france,170);
 s.relations.england.france=256;assert.throws(()=>saveGame(s),/trade relations/);
 delete s.relations;const restored=loadGame(saveGame(s));assert.equal(restored.relations.england.france,90);
});

test('saved state includes the European minor consortium, not geographic adjacency',async()=>{
 const {createGame,saveGame,loadGame}=await import('../engine.mjs');
 const s=createGame();assert.equal(s.relations.ireland.switzerland,150);assert.equal(s.relations.ireland.aztecs,110);
 delete s.relations.ireland.switzerland;
 const restored=loadGame(saveGame(s));assert.equal(restored.relations.ireland.switzerland,150);
 assert.equal(restored.relations.ireland.england,90);
});
