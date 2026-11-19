import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {resourceConnection} from '../resource-connection.mjs';
const audit=JSON.parse(fs.readFileSync(new URL('../../outputs/Native-resource-connection-audit.json',import.meta.url)));
test('connection lookup matches 300 actual original executions including owner exclusion and tie order',()=>{
 assert.equal(audit.cases.length,300);
 for(const c of audit.cases){const nodes=c.nodes.map(n=>({...n,neighbors:c.neighbors}));assert.deepEqual(resourceConnection(nodes,0),c.result);assert.deepEqual(resourceConnection(nodes,0,nodes.map(n=>n.capacity)),c.result);}
});
