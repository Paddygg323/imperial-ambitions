import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {relocationFixture} from './fixtures/town-relocation-fixtures.mjs';
import {relocateOriginalTown} from '../map-town-relocation.mjs';
test('town relocation matches complete original tile and province mutations',()=>{
 const fixture=JSON.parse(readFileSync(new URL('../../outputs/Native-town-relocation.json',import.meta.url))),hash=b=>createHash('sha256').update(b).digest('hex');
 for(const c of fixture.cases){const s=relocationFixture(c.n);relocateOriginalTown(s,c.id,c.tile,c.noWrap);assert.equal(hash(s.tiles),c.tilesHash,`tiles ${c.n}`);assert.equal(hash(s.provinces),c.provincesHash,`province ${c.n}`);}
});
