import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,saveGame,loadGame} from '../engine.mjs';
import {openMarket,nextOffer,acceptOffer} from '../trade.mjs';
import {campaignDealPrice} from '../campaign-deal-price.mjs';
import {readFileSync} from 'node:fs';

test('native price updates retain the previous value for every captured case',()=>{
 const {cases}=JSON.parse(readFileSync(new URL('../../outputs/Native-market-price-audit.json',import.meta.url),'utf8'));
 assert.equal(cases.length,288);for(const c of cases)assert.equal(c.savedPrevious,c.previous);
});
test('market retains prior prices once per turn and across save/reload',()=>{
 let s=createGame({transportModel:'ports',preferenceSeed:123});
 const first=openMarket(s);const prior={...s.previousMarketPrices},current={...s.prices};
 assert.ok(Object.keys(prior).length);s.market=first;s=loadGame(saveGame(s));
 openMarket(s);assert.deepEqual(s.previousMarketPrices,prior);assert.deepEqual(s.prices,current);
 delete s.market;s.turn++;openMarket(s);assert.deepEqual(s.previousMarketPrices,current);
 s.previousMarketPrices.timber=-1;assert.throws(()=>loadGame(JSON.stringify(s)),/previous market prices/);
});
test('colony price adapter uses lower import and higher export price, not subsidy or rival preference',()=>{
 const s=createGame(),tribe=Object.keys(s.minors).find(id=>s.provinces.some(p=>!p.old&&p.owner===id));
 s.minors[tribe].colonyOf='england';s.previousMarketPrices={timber:80,fabric:120};s.nations.england.tradePolicies={[tribe]:75};
 assert.equal(campaignDealPrice(s,{buyer:'england',seller:tribe,good:'timber',world:100}),80);
 assert.equal(campaignDealPrice(s,{buyer:tribe,seller:'england',good:'fabric',world:100}),120);
 assert.equal(campaignDealPrice(s,{buyer:'france',seller:tribe,good:'timber',world:100}),100);
 s.wars=[['england',tribe]];assert.equal(campaignDealPrice(s,{buyer:'england',seller:tribe,good:'timber',world:100}),-1);
});
test('explicit colony fixture pays actual prior-price import and persists cash/cargo without domestic delivery',()=>{
 let s=createGame(),tribe=Object.keys(s.minors).find(id=>s.provinces.some(p=>!p.old&&p.owner===id)),m=s.minors[tribe];
 // Colony acquisition is not yet enabled: this is a price/payment adapter fixture.
 m.colonyOf='england';m.exportStock={timber:2};s.previousMarketPrices={timber:80};
 s.market={offers:[{seller:tribe,good:'timber',quantity:2,price:100,buyers:['england'],buyerIndex:0}],index:0,cargo:{england:2},deals:[],inTransit:[],stopped:{}};
 const cash=s.nations.england.cash,minorCash=m.cash,stock=s.nations.england.stock.timber;
 s=loadGame(saveGame(s));assert.equal(nextOffer(s,s.market).price,80);acceptOffer(s,s.market,'england',1);
 assert.equal(s.nations.england.cash,cash-80);assert.equal(s.minors[tribe].cash,minorCash+80);
 assert.equal(s.nations.england.stock.timber,stock);assert.equal(s.market.inTransit[0].unitPrice,80);assert.equal(s.market.cargo.england,1);
 assert.equal(loadGame(saveGame(s)).minors[tribe].colonyOf,'england');
});

test('a conquered colony capital clears its parent marker before save/reload',async()=>{
 const {conquerProvince}=await import('../conquest.mjs');
 let s=createGame();const tribe=Object.keys(s.minors).find(id=>s.provinces.some(p=>!p.old&&p.owner===id));
 s.minors[tribe].colonyOf='england';const province=s.tiles.find(t=>t.id===s.minors[tribe].capital).province;
 conquerProvince(s,province,'france');assert.equal(s.minors[tribe].colonyOf,undefined);
 s=loadGame(saveGame(s));assert.equal(s.minors[tribe].alive,false);
});
