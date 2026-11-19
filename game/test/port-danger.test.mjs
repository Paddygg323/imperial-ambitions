import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {endangeredTransportPort} from '../port-danger.mjs';
import {orderedTransportNetworks} from '../network-order.mjs';
test('port danger matches1536 native treaty and zone-mask decisions',()=>{
 const data=JSON.parse(readFileSync(new URL('../../outputs/Native-port-danger-audit.json',import.meta.url)));
 assert.equal(data.cases.length,1536);
 for(const c of data.cases)assert.equal(endangeredTransportPort({...c,present:c.missing<0?63:63&~(1<<c.missing)}),c.endangered,JSON.stringify(c));
});
test('endangered ports move behind safe routes while the capital stays first',()=>{
 const danger=Number(endangeredTransportPort({enemies:2,portMask:2,capitalMask:0}));
 assert.deepEqual(orderedTransportNetworks([{root:0,flag:0},{root:1,flag:danger},{root:2,flag:0}],0),[0,2,1]);
 assert.equal(endangeredTransportPort({enemies:2,portMask:4,capitalMask:0}),false,'neutral presence is not hostile');
 assert.equal(endangeredTransportPort({enemies:2,portMask:0,capitalMask:2}),true,'capital-zone threat can endanger the route');
});
