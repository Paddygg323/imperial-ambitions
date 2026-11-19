import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {generateHistoricalWorld} from '../map-historical-world.mjs';import {finalizeOriginalMapPictures} from '../map-picture-finalization.mjs';
test('ordered picture finalization matches four complete native map passes',()=>{
 const fixture=JSON.parse(readFileSync(new URL('../../outputs/Native-map-picture-finalization.json',import.meta.url)));
 for(const c of fixture.cases){const s=generateHistoricalWorld([...Buffer.from(c.name)],{timeSeed:1});s.seaDecorationTile=-1;finalizeOriginalMapPictures(s);assert.equal(createHash('sha256').update(s.tiles).digest('hex'),c.sha256,c.name);assert.equal(s.randomState,c.randomState);assert.equal(s.seaDecorationTile,c.seaDecorationTile);}
});
