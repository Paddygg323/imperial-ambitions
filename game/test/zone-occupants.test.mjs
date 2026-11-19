import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {zoneOccupantMasks} from '../zone-occupants.mjs';
import {endangeredTransportPort} from '../port-danger.mjs';
test('zone occupancy matches original clearing and complete ship-list traversal',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-zone-occupants-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,200);
 for(const c of audit.cases)assert.deepEqual(zoneOccupantMasks(c.zoneCount,c.ships),c.masks);
});
test('ship movement removes old threat; duplicate ships do not duplicate country bits',()=>{
 const ships=[{country:1,zone:0},{country:1,zone:0},{country:2,zone:1}];
 assert.deepEqual(zoneOccupantMasks(3,ships),[2,4,0]);
 for(const ship of ships)if(ship.country===1)ship.zone=2;
 const masks=zoneOccupantMasks(3,ships);
 assert.deepEqual(masks,[0,4,2]);
 assert.equal(endangeredTransportPort({enemies:2,portMask:masks[0],capitalMask:masks[1]}),false);
 assert.equal(endangeredTransportPort({enemies:2,portMask:masks[2],capitalMask:masks[1]}),true);
 assert.deepEqual(zoneOccupantMasks(3,[]),[0,0,0]);
 assert.throws(()=>zoneOccupantMasks(1,[{country:0,zone:1}]));
});
