import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spendingLimit,availableTreasury,nextCredit,treasuryInterest} from '../finance.mjs';
const native=JSON.parse(readFileSync(new URL('../../outputs/Native-credit-arithmetic-audit.json',import.meta.url),'utf8'));
test('spending and available cash match original including debt, reservations and absent city',()=>{
 assert.equal(native.spending.length,210);
 for(const c of native.spending){assert.equal(spendingLimit(c),c.spending,JSON.stringify(c));assert.equal(availableTreasury(c),c.available,JSON.stringify(c));}
});
test('credit accumulator matches native income smoothing and technology effects',()=>{
 assert.equal(native.smoothing.length,75);
 for(const c of native.smoothing)assert.equal(nextCredit(c),c.nextCredit,JSON.stringify(c));
});
test('interest matches original upward rounding and positive treasury treatment',()=>{
 assert.equal(native.interest.length,35);
 for(const c of native.interest)assert.deepEqual(treasuryInterest(c),{interest:c.interest,nextCash:c.nextCash},JSON.stringify(c));
});

import {CREDIT_RULES,debtTransition} from '../finance.mjs';
const debtAudit=JSON.parse(readFileSync(new URL('../../outputs/Native-debt-state-audit.json',import.meta.url),'utf8'));
test('difficulty constants and debt transitions match native branch selection',()=>{
 assert.deepEqual(CREDIT_RULES,debtAudit.settings);assert.equal(debtAudit.cases.length,1050);
 for(const c of debtAudit.cases)assert.deepEqual(debtTransition(c),{nextRate:c.nextRate,nextStage:c.nextStage,consequence:c.consequence},JSON.stringify(c));
});
test('continued excessive borrowing escalates and repayment resets debt history',()=>{
 let state={cash:-101,limit:100,rate:10,stage:0,difficulty:2};const actions=[];
 for(let turn=0;turn<4;turn++){const r=debtTransition(state);state={...state,rate:r.nextRate,stage:r.nextStage};actions.push(r.consequence);}
 assert.deepEqual(actions,['overLimit','warning','forcedSale','bankruptcy']);
 assert.deepEqual(debtTransition({...state,cash:0}),{nextRate:13,nextStage:0,consequence:'none'});
});

import {forcedSale,FORCED_SALE_ORDER} from '../finance.mjs';
const saleAudit=JSON.parse(readFileSync(new URL('../../outputs/Native-forced-sale-audit.json',import.meta.url),'utf8'));
test('forced sales match native stock eligibility, order, whole-lot sales and receipts',()=>{
 assert.equal(saleAudit.cases.length,120);
 for(const c of saleAudit.cases)assert.deepEqual(forcedSale(c),{receipts:c.receipts,remaining:c.remaining},JSON.stringify(c));
});
test('reserved goods and excluded commodities survive liquidation; no second sale after debt cleared',()=>{
 const stock=Array(28).fill(0),reserved=Array(28).fill(0),market=Array(28).fill(5);
 stock[11]=10;reserved[11]=1;stock[14]=10;stock[15]=5;stock[20]=100;
 const result=forcedSale({cash:-1,stock,reserved,market});
 assert.equal(result.receipts,12);assert.equal(result.remaining[11],10);assert.equal(result.remaining[14],0);assert.equal(result.remaining[15],5);assert.equal(result.remaining[20],100);
 assert.deepEqual(forcedSale({cash:11,stock:result.remaining,reserved,market}),{receipts:0,remaining:result.remaining});assert.equal(stock[14],10);
});

import {initialCredit,creditIncome} from '../finance.mjs';
const incomeAudit=JSON.parse(readFileSync(new URL('../../outputs/Native-credit-income-audit.json',import.meta.url),'utf8'));
test('starting credit and rates match all five native difficulty indices',()=>{
 assert.equal(incomeAudit.initial.length,5);
 for(const {difficulty,...expected} of incomeAudit.initial)assert.deepEqual(initialCredit(difficulty),expected);
});
test('credit income matches native receipts aggregation, difficulty floors and scenario flags',()=>{
 assert.equal(incomeAudit.cases.length,120);
 for(const c of incomeAudit.cases)assert.equal(creditIncome(c),c.income,JSON.stringify(c));
});

import {creditTechnology} from '../finance.mjs';
const techAudit=JSON.parse(readFileSync(new URL('../../outputs/Native-credit-technology-audit.json',import.meta.url),'utf8'));
test('Money Lending and Banking credit effects match native install/query and do not stack',()=>{
 for(const c of techAudit.cases){
  const effect=creditTechnology({known:c.known});assert.equal(effect,c.effect);
  assert.equal(nextCredit({credit:100000,income:1000,effect}),[100000,110000,120000][effect]);
 }
});

import {settleFinance} from '../finance.mjs';
test('finance settlement charges interest after liquidation, and bankruptcy returns without another charge',()=>{
 const stock=Array(28).fill(0),reserved=Array(28).fill(0),market=Array(28).fill(100);
 stock[11]=2;
 const base={cash:-150,finance:{credit:10000,rate:10,stage:4,interest:9},difficulty:2,income:100,effect:0,stock,reserved,market};
 const result=settleFinance(base);
 assert.deepEqual(result.finance,{credit:10000,rate:11,stage:5,interest:11});assert.equal(result.cash,-111);assert.equal(result.receipts,50);assert.equal(result.stock[11],0);assert.equal(stock[11],2);
 const bankruptcy=settleFinance({...base,finance:{...base.finance,stage:5}});
 assert.equal(bankruptcy.consequence,'bankruptcy');assert.equal(bankruptcy.cash,-150);assert.equal(bankruptcy.finance.interest,9);assert.deepEqual(bankruptcy.stock,stock);
 const restored=settleFinance({...base,stock:stock.map((q,i)=>i===11?8:q)});
 assert.equal(restored.cash,50);assert.equal(restored.finance.interest,0);
});
test('credit growth is applied before classifying debt and repayment reduces the prior rate',()=>{
 const goods=Array(28).fill(0);
 const result=settleFinance({cash:-110,finance:{credit:10000,rate:10,stage:4,interest:0},difficulty:2,income:2000,effect:0,stock:goods,reserved:goods,market:goods});
 assert.equal(result.finance.credit,29000);assert.equal(result.finance.stage,1);assert.equal(result.consequence,'none');assert.equal(result.cash,-121);
 const repaid=settleFinance({cash:0,finance:result.finance,difficulty:2,income:100,effect:0,stock:goods,reserved:goods,market:goods});
 assert.equal(repaid.finance.rate,9);assert.equal(repaid.finance.stage,0);assert.equal(repaid.cash,0);
});
