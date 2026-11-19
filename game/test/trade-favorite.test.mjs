import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {favoriteTradePartner} from '../trade-favorite.mjs';
test('preferred trade partner matches500 complete original queries including ties',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-trade-favorite-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,500);
 for(const c of audit.cases)assert.equal(favoriteTradePartner(c),c.result,JSON.stringify(c));
});
