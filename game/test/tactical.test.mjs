import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {artilleryWallDamage,fortifiedDamage,terrainDamage,usesMelee,armorVulnerability,applyTacticalDamage,effectiveAttack,openFieldDamage} from '../tactical.mjs';
import {ARMY} from '../rules.mjs';
const native=JSON.parse(fs.readFileSync(new URL('./native-tactical-reference.json',import.meta.url)));

test('terrain and fort protection compose with original troop and wall damage',()=>{
 const ref=JSON.parse(fs.readFileSync(new URL('./native-terrain-fort-reference.json',import.meta.url)));
 for(const c of ref.cases){
  const a={type:'siegeGun',hp:c.hp,medals:c.medals};
  if(c.wallTarget)assert.equal(artilleryWallDamage(a,false,c.terrain),c.wallDamage[0][1]);
  else{
   const r=fortifiedDamage(a,{type:'caliverman'},{level:c.fortCode-1,attackerSide:0,attackerTerrain:c.terrain,defenderTerrain:c.defenderTerrain});
   assert.equal(r.physicalLoss,c.args[3]);assert.equal(r.effectiveLoss,c.args[4]);assert.equal(r.wallDamage,c.wallDamage[0][1]);
  }
 }
});

test('terrain attack penalties and defender cover match original FireOn',()=>{
 const reference=JSON.parse(fs.readFileSync(new URL('./native-terrain-fire-reference.json',import.meta.url)));
 const names=Object.fromEntries(Object.entries(ARMY).map(([k,v])=>[v.nativeId,k]));
 for(const c of reference.cases){
  const a={type:names[c.attacker],hp:100,medals:0},d={type:names[c.defender]};
  assert.deepEqual(terrainDamage(a,d,{melee:c.adjacent,attackerTerrain:c.attackerTerrain,defenderTerrain:c.defenderTerrain}),{physicalLoss:c.args[3],effectiveLoss:c.args[4]},JSON.stringify(c));
 }
});

test('weapon choice and damage against broken regiments match original FireOn',()=>{
 const reference=JSON.parse(fs.readFileSync(new URL('./native-broken-fire-reference.json',import.meta.url)));
 const names=Object.fromEntries(Object.entries(ARMY).map(([k,v])=>[v.nativeId,k]));
 for(const c of reference.cases){
  const a={type:names[c.attacker],hp:100,medals:0},d={type:names[c.defender],state:c.defenderState};
  const melee=usesMelee(a,d,{adjacent:c.adjacent});
  assert.equal(melee,Boolean(c.args[6]),JSON.stringify(c));
  assert.deepEqual(openFieldDamage(a,d,{melee}),{physicalLoss:c.args[3],effectiveLoss:c.args[4]},JSON.stringify(c));
 }
});
test('open-field attacks match captured original FireOn results across regiment types',()=>{
 const reference=JSON.parse(fs.readFileSync(new URL('./native-fire-reference.json',import.meta.url)));
 const names=Object.fromEntries(Object.entries(ARMY).map(([k,v])=>[v.nativeId,k]));
 for(const c of reference.cases){
  const result=openFieldDamage({type:names[c.attacker],hp:c.hp,medals:c.medals},{type:names[c.defender]},{melee:c.adjacent});
  assert.deepEqual(result,{physicalLoss:c.args[3],effectiveLoss:c.args[4]},JSON.stringify(c));
 }
});
test('armor vulnerability matches the original routine for all 30 regiment types',()=>{
 for(const c of native.armorCases)assert.ok(Math.abs(armorVulnerability(c.unit)-c.multiplier)<1e-7,c.unit);
 // Original manual example: defence 7 receives half the damage of defence 5.
 assert.equal(armorVulnerability('sharpshooter'),armorVulnerability('pikeman')/2);
});
test('physical and effective strength losses match isolated native damage cases',()=>{
 for(const c of native.damageCases){
  const input={hp:c.hp,effective:c.effective,state:0};const copy=structuredClone(input);
  assert.deepEqual(applyTacticalDamage(input,c.physicalLoss,c.effectiveLoss),c.result);
  assert.deepEqual(input,copy);
 }
});
test('morale can break a living regiment and physical destruction takes precedence',()=>{
 assert.deepEqual(applyTacticalDamage({hp:100,effective:100,state:0},25,100),{hp:75,effective:0,state:1});
 assert.deepEqual(applyTacticalDamage({hp:20,effective:20,state:0},20,20),{hp:0,effective:0,state:3});
 assert.equal(effectiveAttack(10,50,2),6);
 assert.equal(effectiveAttack(10,0,4),0);
});

test('rally morale and broken-unit thresholds match 364 original routine cases',async()=>{
 const {rallyRegiment}=await import('../tactical.mjs');
 const reference=JSON.parse(fs.readFileSync(new URL('./native-rally-reference.json',import.meta.url)));
 for(const c of reference.cases){
  const unit={hp:c.hp,effective:c.effective,state:c.state},before=structuredClone(unit);
  const result=c.side===1?unit:rallyRegiment(unit,c.medals,c.roll);
  assert.deepEqual(result,c.result,JSON.stringify(c));assert.deepEqual(unit,before);
 }
});

test('general protection matches native FireOn and uses the best active general only',()=>{
 const reference=JSON.parse(fs.readFileSync(new URL('./native-general-fire-reference.json',import.meta.url)));
 const names=Object.fromEntries(Object.entries(ARMY).map(([k,v])=>[v.nativeId,k]));
 for(const c of reference.cases){
  const result=openFieldDamage({type:names[c.attacker],hp:c.hp,medals:c.medals},{type:names[c.defender]},{melee:c.adjacent,generals:c.generals.map(g=>({state:0,...g}))});
  assert.deepEqual(result,{physicalLoss:c.args[3],effectiveLoss:c.args[4]},JSON.stringify(c));
 }
});

test('post-move surrender decisions match original FleeUnit cases',async()=>{
 const {fleesOrSurrenders}=await import('../tactical.mjs');
 const reference=JSON.parse(fs.readFileSync(new URL('./native-flee-reference.json',import.meta.url)));
 const names=Object.fromEntries(Object.entries(ARMY).map(([k,v])=>[v.nativeId,k]));
 for(const c of reference.cases){
  const result=fleesOrSurrenders({type:names[c.unit],hp:c.hp,state:1},[{type:names[c.enemy],hp:c.enemyHp,state:0,distance:c.near?1:14}],{moved:c.moved,roll:c.roll});
  assert.equal(result,c.result.state===3?'surrendered':'fleeing',JSON.stringify(c));
 }
 // Broken enemies do not apply pursuit pressure; blocked troops still surrender.
 assert.equal(fleesOrSurrenders({type:'arquebusier',hp:50,state:1},[{type:'siegeGun',hp:100,state:1,distance:1}],{moved:true,roll:32767}),'fleeing');
});
