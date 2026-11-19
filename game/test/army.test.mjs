import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,command,resolveTurn,saveGame,loadGame} from '../engine.mjs';
import {resolveArmies} from '../army.mjs';
function fixture(){const s=createGame({simpleFood:true});s.nations={england:s.nations.england};s.ships=[];s.armies=[];s.civilians=s.civilians.filter(c=>c.owner==='england');return s;}
function recruit(s){return resolveTurn(command(s,'england',{type:'recruitUnit',kind:'army',unit:'pikeman'}));}
test('recruited regiment redeploys to a distant owned province at turn resolution',()=>{
 let s=recruit(fixture());const u=s.armies[0],target=s.provinces.find(p=>p.owner==='england'&&p.id!==u.province);
 const stock=structuredClone(s.nations.england.stock),workers=s.nations.england.workers.length;
 s=command(s,'england',{type:'army',units:[u.id],job:'deploy',province:target.id});
 assert.equal(s.armies[0].province,u.province);assert.deepEqual(s.nations.england.stock,stock);assert.equal(s.nations.england.workers.length,workers);
 s=resolveTurn(loadGame(saveGame(s)));assert.equal(s.armies[0].province,target.id);assert.equal(s.armies[0].order,null);
});
test('owned overseas redeployment needs no ship and does not conquer foreign land',()=>{
 let s=recruit(fixture());const u=s.armies[0],p=s.provinces.find(p=>!p.old);
 assert.throws(()=>command(s,'england',{type:'army',units:[u.id],job:'deploy',province:p.id}),/owned province/);
 p.owner='england';for(const t of s.tiles.filter(t=>t.province===p.id))t.owner='england';
 s=command(s,'england',{type:'army',units:[u.id],job:'deploy',province:p.id});s=resolveTurn(s);
 assert.equal(s.armies[0].province,p.id);assert.equal(s.ships.length,0);
});
test('mixed ownership and duplicate regiment selection cannot issue partial orders',()=>{
 const s=recruit(fixture()),u=s.armies[0];s.armies.push({...u,id:'enemy',owner:'france'});
 for(const units of [[u.id,'enemy'],[u.id,u.id],[]])assert.throws(()=>command(s,'england',{type:'army',units,job:'defend'}));
 assert.equal(s.armies[0].order,null);
});
test('done clears next turn while defend persists until explicitly woken',()=>{
 let s=recruit(fixture()),id=s.armies[0].id;
 s=command(s,'england',{type:'army',units:[id],job:'done'});s=resolveTurn(s);assert.equal(s.armies[0].order,null);assert.equal(s.armies[0].defending,false);
 s=command(s,'england',{type:'army',units:[id],job:'defend'});s=resolveTurn(s);assert.equal(s.armies[0].defending,true);
 s=command(s,'england',{type:'army',units:[id],job:'wake'});assert.equal(s.armies[0].defending,false);
});
test('cancelled or invalidated redeployment retains the original garrison',()=>{
 let s=recruit(fixture()),u=s.armies[0],p=s.provinces.find(p=>p.owner==='england'&&p.id!==u.province);
 s=command(s,'england',{type:'army',units:[u.id],job:'deploy',province:p.id});
 let cancelled=command(s,'england',{type:'army',units:[u.id],job:'cancel'});resolveArmies(cancelled);assert.equal(cancelled.armies[0].province,u.province);
 s.provinces.find(x=>x.id===p.id).owner='france';resolveArmies(s);assert.equal(s.armies[0].province,u.province);assert.match(s.reports.at(-1).text,/cancelled/);
});
