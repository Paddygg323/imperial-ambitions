import test from 'node:test';
import assert from 'node:assert/strict';
import {campaignZoneOccupants} from '../campaign-zone-occupants.mjs';
import {endangeredTransportPort} from '../port-danger.mjs';
function fixture(){return {seas:{zones:[{id:'sea0'},{id:'sea1'}]},tiles:[{id:'1,1'},{id:'2,2'}],nations:{england:{capital:'1,1'},portugal:{capital:'2,2'}},ships:[{owner:'england',location:'home'},{owner:'portugal',location:'home'}]};}
test('home ships of different countries occupy distinct ports, never adjacent sea',()=>{
 const s=fixture(),before=JSON.stringify(s);
 assert.deepEqual(campaignZoneOccupants(s),{sea0:0,sea1:0,'port:1,1':2,'port:2,2':16});
 assert.equal(JSON.stringify(s),before);
 s.ships[1].location='sea0';
 let masks=campaignZoneOccupants(s);
 assert.equal(endangeredTransportPort({enemies:16,portMask:masks.sea0,capitalMask:masks.sea1}),true);
 s.ships[1].location='port:1,1';
 masks=campaignZoneOccupants(s);
 assert.equal(masks['port:1,1'],18);
 assert.equal(endangeredTransportPort({enemies:16,portMask:masks.sea0,capitalMask:masks.sea1}),false);
});
test('capture changes the country bit without changing the physical port',()=>{
 const s=fixture();s.ships[1]={owner:'england',location:'port:2,2'};
 assert.equal(campaignZoneOccupants(s)['port:2,2'],2);
 s.ships[1].location='sea99';assert.throws(()=>campaignZoneOccupants(s),/Invalid ship zone/);
 s.ships[1].location='port:9,9';assert.throws(()=>campaignZoneOccupants(s),/Unknown ship port/);
});
