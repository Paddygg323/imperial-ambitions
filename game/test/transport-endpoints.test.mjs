import test from 'node:test';
import assert from 'node:assert/strict';
import {domesticCheckpoints} from '../transport-routes.mjs';
test('domestic interception uses persisted sea endpoints after borders change',()=>{
 const s={tiles:[{id:'5,5',x:5,y:5,owner:'england',port:true,transportSeaTile:'4,5'},{id:'8,8',x:8,y:8,owner:'england',port:true,transportSeaTile:'8,7'}],seas:{cellZones:{'4,5':'sea0','8,7':'sea1'}}};
 const shipment={nation:'england',sourcePort:'5,5',destinationPort:'8,8'};
 assert.deepEqual(domesticCheckpoints(s,shipment).map(c=>c.sea),['sea0','sea1']);
 s.tiles.push({id:'3,5',x:3,y:5,owner:'france'});
 assert.deepEqual(domesticCheckpoints(s,shipment).map(c=>c.sea),['sea0','sea1']);
 s.tiles[0].transportSeaTile=null;
 assert.equal(domesticCheckpoints(s,shipment)[0].sea,undefined,'known absent endpoint is not replaced by a new route');
});
