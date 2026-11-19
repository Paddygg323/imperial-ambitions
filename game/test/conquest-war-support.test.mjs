import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,saveGame,loadGame} from '../engine.mjs';
import {conquerProvince} from '../conquest.mjs';
import {issueDeclarations} from '../diplomacy.mjs';
import {warSupportEvent} from '../war-support.mjs';
function fixture(){const s=createGame();for(const n of Object.values(s.nations))if(n.ministers)n.warSupport=.5;return s;}
test('conquest applies native winner/loser and established-war effects once through reload',()=>{
 let s=fixture();s.turn=3;s.declarations=[{nation:'france',target:'spain'},{nation:'holland',target:'spain'}];issueDeclarations(s);s.turn=4;
 const target=s.provinces.find(p=>p.owner==='spain'&&p.town!==s.nations.spain.capital);
 conquerProvince(s,target.id,'france');
 assert.equal(s.nations.france.warSupport,warSupportEvent(warSupportEvent(.5,1,2),1,5));
 assert.equal(s.nations.spain.warSupport,warSupportEvent(.5,0,3));
 assert.equal(s.nations.holland.warSupport,warSupportEvent(.5,3,5));
 assert.equal(s.nations.portugal.warSupport,.5);
 const before=Object.values(s.nations).map(n=>n.warSupport);s=loadGame(saveGame(s));assert.deepEqual(Object.values(s.nations).map(n=>n.warSupport),before);
 assert.throws(()=>conquerProvince(s,target.id,'france'));assert.deepEqual(Object.values(s.nations).map(n=>n.warSupport),before);
});
test('new war excludes established-war modifier; capital loss applies before elimination',()=>{
 const s=fixture();s.declarations=[{nation:'france',target:'spain'},{nation:'holland',target:'spain'}];issueDeclarations(s);
 const target=s.provinces.find(p=>p.town===s.nations.spain.capital);conquerProvince(s,target.id,'france');
 assert.equal(s.nations.france.warSupport,warSupportEvent(.5,1,2));assert.equal(s.nations.holland.warSupport,.5);
 assert.equal(s.nations.spain.warSupport,warSupportEvent(.5,0,3));assert.equal(s.nations.spain.alive,false);
});
test('minor conquest only boosts AI conqueror; human and unknown legacy war dates are not fabricated',()=>{
 const s=fixture(),minor=s.provinces.find(p=>p.owner==='scotland');conquerProvince(s,minor.id,'france');
 assert.equal(s.nations.france.warSupport,warSupportEvent(.5,1,2));assert.equal(s.nations.spain.warSupport,.5);
 s.wars=[['england','spain'],['holland','spain']];const target=s.provinces.find(p=>p.owner==='spain');conquerProvince(s,target.id,'england');
 assert.equal(s.nations.england.warSupport,undefined);assert.equal(s.nations.holland.warSupport,.5);assert.equal(s.warDates,undefined);
});
