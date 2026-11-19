import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {developmentFactor} from '../development-factor.mjs';
test('development forecast multiplier matches200 full original tile scans',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-development-factor-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,200);assert.equal(audit.floor,1);
 for(const c of audit.cases)assert.equal(developmentFactor(c),c.result,JSON.stringify(c));
});
test('builder allowance follows cheapest eligible improvement per resource, not tile count',()=>{
 const tech=Array(28).fill(3),tile=(good,level,owner=0,secondary=-1)=>({good,level,owner,secondary});
 assert.equal(developmentFactor({tech,tiles:[]}),1);
 assert.equal(developmentFactor({tech,tiles:[tile(1,2)]}),8);
 assert.equal(developmentFactor({tech,tiles:[tile(1,2),tile(1,0),tile(1,0)]}),2);
 assert.equal(developmentFactor({tech,tiles:[tile(1,2,1),tile(1,0,1,0)]}),2);
 assert.equal(developmentFactor({tech:Array(28).fill(0),tiles:[tile(1,0)]}),1);
});
