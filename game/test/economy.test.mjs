import {setTransportLink,transportLink,validTransportLinks} from '../transport-links.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,command,resolveTurn,transport,labour,saveGame,loadGame} from '../engine.mjs';
import {TECHS,goalPath,maxDevelopment,RECIPES} from '../rules.mjs';
import {emptyGoods,feed,deliver,settleTransportInterception,transportLinkCapacity} from '../economy.mjs';
import {readFileSync} from 'node:fs';
import {domesticShipments,checkDomesticShipments} from '../transport-routes.mjs';
import {europe,neighbourIds} from '../world.mjs';
import {planEconomy} from '../ai.mjs';
import {ARMY,SHIPS} from '../rules.mjs';

function fixture(){
 const s=createGame({simpleFood:true});s.nations={england:s.nations.england};s.player='england';
 s.minors={};s.tiles=[];for(let y=0;y<5;y++)for(let x=0;x<8;x++)s.tiles.push({id:`${x},${y}`,x,y,owner:'england',province:x<4?'home':'remote',terrain:0,mineral:0,resource:null,prospected:true,level:0,road:false,rail:false,port:false,townLevel:0,river:false});
 // Two isolated economy-test provinces are not a fully conquered Old World.
 s.provinces=[{id:'home',town:'1,2',owner:'england',capital:true,old:false},{id:'remote',town:'6,2',owner:'england',capital:false,old:false}];
 const n=s.nations.england;n.known=[];n.workers=Array.from({length:6},(_,i)=>({id:'fixture-worker'+i,type:'peasant',fit:true,diet:i%2?'meat':'grain'}));n.capital='1,2';n.stock=emptyGoods();Object.assign(n.stock,{lumber:40,castIron:40,fabric:20,grain:80,meat:80,fish:80});
 s.civilians=s.civilians.filter(u=>u.owner==='england');for(const c of s.civilians)c.tile=n.capital;
 s.ships=s.ships.filter(u=>u.owner==='england').slice(0,1);s.armies=[];return s;
}
const tile=(s,id)=>s.tiles.find(t=>t.id===id);
const civ=(s,type)=>s.civilians.find(u=>u.type===type);
const doCiv=(s,type,job,target)=>command(s,'england',{type:'civilian',unit:civ(s,type).id,job,tile:target});
test('route capacity matches25 native transitions including exhausted links',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-transport-link-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,25);
 for(const c of audit.cases)assert.equal(transportLinkCapacity(c.incoming,c.edge),c.capacity);
});

test('railway beyond a road retains the bottleneck until the full route is upgraded',()=>{
 const s=fixture();for(const x of [2,3])tile(s,`${x},2`).road=true;
 tile(s,'4,2').rail=true;Object.assign(tile(s,'5,2'),{resource:'iron',level:4});
 const limited=transport(s,'england');assert.equal(limited.incoming.iron,1);
 for(const x of [2,3])tile(s,`${x},2`).rail=true;
 assert.equal(transport(s,'england').incoming.iron,4);
});

test('port behind a road bottleneck can supplement land deliveries with allocated sea cargo',()=>{
 const s=fixture();for(const x of [2,3,4])tile(s,`${x},2`).road=true;
 tile(s,'4,2').port=true;Object.assign(tile(s,'5,2'),{resource:'iron',level:4});
 s.nations.england.orders.transport.iron=3;
 const row=transport(s,'england').rows.find(r=>r.good==='iron');
 assert.equal(row.landDelivered,1);assert.equal(row.seaDelivered,3);assert.equal(row.delivered,4);
 s.nations.england.orders.transport.iron=0;
 assert.equal(transport(s,'england').incoming.iron,1);
});

test('audited Europe has original ownership, 83 provinces and 1 town per province',()=>{
 assert.equal(europe.tiles.length,1161);assert.equal(europe.provinces.length,83);
 for(const p of europe.provinces)assert.equal(europe.tiles.filter(t=>t.province===p.id&&t.terrain===13).length,1);
 assert.equal(europe.provinces.filter(p=>p.owner==='england').length,8);
 const game=createGame();assert.ok(game.tiles.filter(t=>game.provinces.find(p=>p.id===t.province).old).every(t=>t.prospected),'Historical Europe needs no prospecting');
 assert.ok(game.tiles.some(t=>t.owner==='england'&&t.resource==='iron'&&t.prospected));
});
test('114 original entries form an acyclic prerequisite graph',()=>{
 assert.equal(Object.keys(TECHS).length,114);assert.equal(Object.values(TECHS).filter(t=>!t.discovery).length,107);
 function visit(id,stack=[]){assert.ok(!stack.includes(id),`Cycle: ${stack} -> ${id}`);for(const p of TECHS[id].requires){assert.ok(TECHS[p]);visit(p,[...stack,id]);}}
 for(const id of Object.keys(TECHS))visit(id);
 const road=goalPath('45');for(const id of ['9','8','30','7'])assert.ok(road.has(id));
});
test('developed remote resources cannot appear in warehouse without a connection',()=>{
 let s=fixture();Object.assign(tile(s,'6,2'),{resource:'iron',level:1});
 assert.equal(transport(s,'england').incoming.iron,0);s=resolveTurn(s);assert.equal(s.nations.england.stock.iron,0);
});
test('builder takes two turns and does not manufacture a road',()=>{
 let s=fixture();Object.assign(tile(s,'6,2'),{resource:'iron'});s=doCiv(s,'builder','develop','6,2');
 assert.equal(s.nations.england.stock.lumber,39);assert.equal(tile(s,'6,2').level,0);
 s=resolveTurn(s);assert.equal(tile(s,'6,2').level,0);s=resolveTurn(s);assert.equal(tile(s,'6,2').level,1);
 assert.equal(tile(s,'6,2').road,false);assert.equal(transport(s,'england').incoming.iron,0);
});
test('development ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ road chain ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ deliveries ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ manufacturing uses only prior stock',()=>{
 let s=fixture();Object.assign(tile(s,'5,2'),{resource:'iron',level:1});
 for(const x of [2,3,4]){s=doCiv(s,'engineer','road',`${x},2`);s=resolveTurn(s);}
 assert.equal(transport(s,'england').incoming.iron,1);assert.equal(s.nations.england.stock.iron,0,'new road was not productive in its completion turn');
 assert.throws(()=>command(s,'england',{type:'production',recipe:'castIron',quantity:1}),/Not enough iron/);
 s=resolveTurn(resolveTurn(s));assert.equal(s.nations.england.stock.iron,2);
 const before=s.nations.england.stock.castIron;s=command(s,'england',{type:'production',recipe:'castIron',quantity:1});s=resolveTurn(s);
 assert.equal(s.nations.england.stock.castIron,before+1);assert.equal(s.nations.england.stock.iron,1);
});
test('losing the middle province breaks downstream roads immediately',()=>{
 const s=fixture();for(const x of [2,3,4,5])tile(s,`${x},2`).road=true;Object.assign(tile(s,'6,2'),{resource:'timber',level:1});
 assert.equal(transport(s,'england').incoming.timber,1);tile(s,'3,2').owner='france';assert.equal(transport(s,'england').incoming.timber,0);
});
test('primitive roads cap output; Road Construction doubles throughput, not production',()=>{
 const s=fixture();for(const x of [2,3,4])tile(s,`${x},2`).road=true;Object.assign(tile(s,'5,2'),{resource:'iron',level:3});
 assert.equal(transport(s,'england').incoming.iron,1);s.nations.england.known.push('45');assert.equal(transport(s,'england').incoming.iron,2);assert.equal(tile(s,'5,2').level,3);
});
test('remote ports need explicit shipping allocation and a home ship',()=>{
 const s=fixture();tile(s,'6,2').port=true;Object.assign(tile(s,'7,2'),{resource:'timber',level:4});
 assert.equal(transport(s,'england').incoming.timber,0);s.nations.england.orders.transport.timber=4;
 assert.equal(transport(s,'england').incoming.timber,3);s.ships[0].location='sea';assert.equal(transport(s,'england').incoming.timber,0);
});
test('fish requires a port catchment; water shared by ports is counted once',()=>{
 const s=fixture();tile(s,'2,2').river=true;tile(s,'3,2').port=true;s.nations.england.orders.transport.fish=20;
 assert.equal(transport(s,'england').incoming.fish,1);
});
test('each material uses two resources and two labour',()=>{
 let s=fixture();s.nations.england.stock.timber=20;
 s=command(s,'england',{type:'production',recipe:'lumber',quantity:3});
 assert.throws(()=>command(s,'england',{type:'production',recipe:'paper',quantity:1}),/labour/);
 const before=s.nations.england.stock.lumber;s=resolveTurn(s);assert.equal(s.nations.england.stock.timber,14);assert.equal(s.nations.england.stock.lumber,before+3);
});
test('recruitment consumes fabric and recruits next turn, never generates free labour immediately',()=>{
 let s=fixture();const n=s.nations.england;const count=n.workers.length;s=command(s,'england',{type:'recruitWorker',quantity:2});
 assert.equal(s.nations.england.stock.fabric,n.stock.fabric-4);assert.equal(s.nations.england.workers.length,count);
 s=resolveTurn(s);assert.equal(s.nations.england.workers.length,count+2);assert.equal(labour(s.nations.england),count+2);
});
test('luxury starvation makes apprentices idle while they still consume food',()=>{
 const s=fixture(),n=s.nations.england;n.workers[0].type='apprentice';const before=n.stock.grain+n.stock.meat+n.stock.fish;
 const report=[];feed(s,'england',report);assert.equal(n.workers[0].fit,false);assert.equal(n.workers.length,6);
 assert.equal(before-n.stock.grain-n.stock.meat-n.stock.fish,7);assert.equal(labour(n),5);
});
test('balanced food affects fitness but wrong food does not kill workers',()=>{
 const s=fixture(),n=s.nations.england;n.simpleFood=false;n.stock.grain=100;n.stock.meat=0;n.stock.fish=0;feed(s,'england',[]);
 assert.equal(n.workers.length,6);assert.ok(labour(n)<6);assert.ok(labour(n)>0);
});
test('complete food shortage removes consumers rather than allowing unlimited recruitment',()=>{
 const s=fixture(),n=s.nations.england;n.stock.grain=n.stock.meat=n.stock.fish=0;feed(s,'england',[]);assert.equal(n.workers.length,0);assert.equal(s.ships.length,0);
});
test('coal and higher development are gated by discoveries',()=>{
 const s=fixture(),n=s.nations.england;assert.equal(maxDevelopment(n,{resource:'coal',terrain:7}),0);n.known.push('29');assert.equal(maxDevelopment(n,{resource:'coal',terrain:7}),1);
});
test('technology goal does not unlock prerequisites or take a research slot',()=>{
 const s=command(fixture(),'england',{type:'researchGoal',tech:'59'});assert.equal(s.nations.england.projects.length,0);
 assert.throws(()=>command(s,'england',{type:'researchStart',tech:'59'}),/Prerequisites/);
});
test('three project limit; University fourth slot; zero funding makes no progress',()=>{
 let s=fixture();for(const tech of ['7','8','9']){
  s=command(s,'england',{type:'researchStart',tech});
  // New projects now start funded; explicitly test the zero-funding case.
  s=command(s,'england',{type:'researchFunding',tech,amount:0});
 }
 assert.throws(()=>command(s,'england',{type:'researchStart',tech:'10'}),/slots/);s=resolveTurn(s);
 assert.equal(s.nations.england.projects[0].investment,0);s.nations.england.known.push('56');s=command(s,'england',{type:'researchStart',tech:'10'});assert.equal(s.nations.england.projects.length,4);
});
test('save roundtrip retains unfinished construction, allocations and research',()=>{
 let s=fixture();tile(s,'5,2').resource='grain';s=doCiv(s,'builder','develop','5,2');s=command(s,'england',{type:'researchStart',tech:'8'});
 s=command(s,'england',{type:'researchFunding',tech:'8',amount:100});assert.deepEqual(loadGame(saveGame(s)),s);
 assert.deepEqual(resolveTurn(loadGame(saveGame(s))),resolveTurn(s));
});
test('invalid command is atomic; input state remains untouched',()=>{
 const s=fixture(),before=JSON.stringify(s);assert.throws(()=>doCiv(s,'builder','road','2,2'),/Engineer/);assert.equal(JSON.stringify(s),before);
});
test('separate 3-timber provinces do not pool into a town bonus',()=>{
 const s=fixture(),n=s.nations.england;n.known.push('60');tile(s,'6,2').port=true;tile(s,'6,2').townLevel=1;
 Object.assign(tile(s,'5,2'),{resource:'timber',level:3});Object.assign(tile(s,'2,2'),{resource:'timber',level:3});n.orders.transport.timber=20;n.orders.transport.lumber=20;
 assert.equal(transport(s,'england').incoming.lumber,0);
});
test('native recruitment removes an available worker and charges the original Culverin cost',()=>{
 let s=fixture();s.nations.england.stock.bronze=4;const before=s.nations.england.workers.length;
 s=command(s,'england',{type:'recruitUnit',kind:'army',unit:'culverin'});
 assert.equal(s.nations.england.workers.length,before-1);assert.equal(s.nations.england.stock.bronze,0);assert.equal(s.nations.england.stock.fabric,19);
 assert.equal(s.armies.length,0);s=resolveTurn(s);assert.equal(s.armies[0].type,'culverin');assert.equal(s.armies[0].province,'home');
 assert.equal(ARMY.culverin.range,5);
});
test('Fluyte construction needs technology and creates four real cargo holds next turn',()=>{
 let s=fixture();assert.throws(()=>command(s,'england',{type:'recruitUnit',kind:'ship',unit:'fluyte'}),/unavailable/);
 s.nations.england.known.push('10');const n=structuredClone(s.nations.england);
 s=command(s,'england',{type:'recruitUnit',kind:'ship',unit:'fluyte'});
 assert.equal(s.nations.england.stock.lumber,n.stock.lumber-6);assert.equal(s.nations.england.stock.castIron,n.stock.castIron-2);assert.equal(s.nations.england.stock.fabric,n.stock.fabric-2);
 s=resolveTurn(s);assert.equal(s.ships.find(u=>u.type==='fluyte').cargo,4);assert.equal(SHIPS.fluyte.hull,35);
});
test('training consumes the prior worker, cash and paper and obeys the technology gate',()=>{
 let s=fixture();s.nations.england.stock.paper=5;
 assert.throws(()=>command(s,'england',{type:'trainWorker',worker:'apprentice'}),/technology/);
 s.nations.england.known.push('23');s.nations.england.stock.sugar=3;const cash=s.nations.england.cash;
 s=command(s,'england',{type:'trainWorker',worker:'apprentice'});assert.equal(s.nations.england.workers.length,5);assert.equal(s.nations.england.cash,cash-100);assert.equal(s.nations.england.stock.paper,4);
 s=resolveTurn(s);assert.equal(s.nations.england.workers.length,6);assert.equal(labour(s.nations.england),9);
});
test('40-turn original-Europe economy regression: secure iron before spending the seed construction stock',()=>{
 let s=createGame();s.nations={england:s.nations.england};s.civilians=s.civilians.filter(c=>c.owner==='england');s.ships=s.ships.filter(c=>c.owner==='england');
 let deaths=0,made=0;
 for(let i=0;i<40;i++){s=planEconomy(s,'england',command);s=resolveTurn(s);for(const r of s.reports){if(r.kind==='food')deaths+=r.starved;if(r.kind==='production'&&r.recipe==='castIron')made+=r.made;}}
 const incoming=transport(s,'england').incoming;
 assert.equal(deaths,0);assert.ok(s.nations.england.workers.length>=10);assert.ok(incoming.iron>=1);assert.ok(incoming.timber>=2);assert.ok(made>=10);
 assert.ok(incoming.grain+incoming.meat+incoming.fish>=s.nations.england.workers.length+1);
});

for(const outcome of ['lost','canc'])test(`domestic ${outcome} settlement removes only the sea portion of a mixed road/port delivery`,()=>{
 const s=fixture(),n=s.nations.england;
 for(const x of [2,3,4])tile(s,`${x},2`).road=true;
 tile(s,'6,2').port=true;Object.assign(tile(s,'5,2'),{resource:'iron',level:4});
 n.orders.transport.iron=3;
 const network=transport(s,'england'),row=network.rows.find(r=>r.good==='iron');
 assert.equal(row.landDelivered,1);assert.equal(row.seaDelivered,3);
 assert.equal(network.incoming.iron,4);
 const reserved=network.cargoUsed;
 assert.equal(settleTransportInterception(network,[row],outcome).iron,3);
 assert.equal(row.delivered,1);assert.equal(network.incoming.iron,1);
 assert.equal(network.cargoUsed,reserved-3);assert.equal(network.cargoFree,3);
 assert.equal(settleTransportInterception(network,[row],outcome).iron,0);
 const report=[];deliver(n,network,report);
 assert.equal(n.stock.iron,1);assert.equal(report[0].goods.iron,1);
 assert.equal(transport(s,'england').incoming.iron,4,'loss affects this shipment, not permanent production');
});
test('transport settlement preserves safe shipments and rejects foreign rows before changing deliveries',()=>{
 const s=fixture();tile(s,'6,2').port=true;Object.assign(tile(s,'7,2'),{resource:'timber',level:4});s.nations.england.orders.transport.timber=3;
 const network=transport(s,'england'),row=network.rows.find(r=>r.good==='timber');
 const before=structuredClone(network);
 assert.equal(settleTransportInterception(network,[row],'okay').timber,0);assert.deepEqual(network,before);
 assert.throws(()=>settleTransportInterception(network,[row,{...row}],'lost'),/Invalid transport shipment/);
 assert.deepEqual(network,before);
 assert.throws(()=>settleTransportInterception(network,[row,row],'lost'),/Invalid transport shipment/);
 assert.deepEqual(network,before);
});

test('domestic port shipments group tile yields and stop after interception at the source',()=>{
 const s=fixture(),n=s.nations.england;
 tile(s,'6,2').port=true;
 Object.assign(tile(s,'7,2'),{resource:'timber',level:1});
 Object.assign(tile(s,'6,3'),{resource:'timber',level:1});
 n.orders.transport.timber=2;
 const network=transport(s,'england'),shipments=domesticShipments(s,'england',network);
 assert.equal(shipments.length,1);assert.equal(shipments[0].quantity,2);
 assert.equal(shipments[0].sourcePort,'6,2');assert.equal(shipments[0].destinationPort,n.capital);
 assert.equal(shipments[0].rows.length,2);
 const cash=n.cash,seen=[];
 checkDomesticShipments(s,'england',network,(cargo,checkpoint)=>{seen.push(checkpoint.port);return 'lost';});
 assert.deepEqual(seen,['6,2']);assert.equal(network.incoming.timber,0);
 deliver(n,network,[]);assert.equal(n.stock.timber,0);assert.equal(n.cash,cash);
 assert.equal(domesticShipments(s,'england',network).length,0);
});
test('domestic shipment checks capital after safe departure; isolated ports keep separate losses',()=>{
 const s=fixture(),n=s.nations.england;
 tile(s,'6,0').port=true;tile(s,'6,4').port=true;
 Object.assign(tile(s,'7,0'),{resource:'timber',level:1});
 Object.assign(tile(s,'7,4'),{resource:'timber',level:1});
 n.orders.transport.timber=2;
 const network=transport(s,'england'),seen=[];
 assert.equal(domesticShipments(s,'england',network).length,2);
 checkDomesticShipments(s,'england',network,(cargo,checkpoint)=>{
  seen.push([cargo.sourcePort,checkpoint.port]);
  return cargo.sourcePort==='6,0'&&checkpoint.port===n.capital?'lost':'okay';
 });
 assert.deepEqual(seen,[['6,0','6,0'],['6,0',n.capital],['6,4','6,4'],['6,4',n.capital]]);
 assert.equal(network.incoming.timber,1);deliver(n,network,[]);assert.equal(n.stock.timber,1);
});
test('domestic source port follows the current road connection after ownership loss',()=>{
 const s=fixture(),n=s.nations.england;
 tile(s,'6,2').port=true;Object.assign(tile(s,'7,2'),{resource:'iron',level:1});n.orders.transport.iron=1;
 assert.equal(domesticShipments(s,'england',transport(s,'england'))[0].sourcePort,'6,2');
 tile(s,'6,2').owner='france';
 assert.equal(domesticShipments(s,'england',transport(s,'england')).length,0);
});
test('AI connects iron beyond eight road steps while preserving the material purchasing budget',()=>{
 const s=createGame(),n=s.nations.france;s.player='england';s.minors={};s.tiles=[];
 for(let x=0;x<15;x++)s.tiles.push({id:`${x},2`,x,y:2,owner:'france',province:'fr',terrain:0,mineral:0,resource:x===1?'timber':x===14?'iron':null,prospected:true,level:x===1?2:0,road:false,rail:false,port:false,townLevel:0,river:false});
 s.tiles.push({id:'30,2',x:30,y:2,owner:'england',province:'en',terrain:0,mineral:0,resource:null,prospected:true,level:0,road:false,rail:false,port:false,townLevel:0,river:false});
 n.capital='0,2';s.nations.england.capital='30,2';s.nations={france:n,england:s.nations.england};s.provinces=[{id:'fr',town:'0,2',owner:'france',old:false},{id:'en',town:'30,2',owner:'england',old:false}];
 s.civilians=s.civilians.filter(c=>c.owner==='france');for(const c of s.civilians)c.tile='0,2';s.armies=[];s.ships=[];
 const planned=planEconomy(s,'france',command),engineer=planned.civilians.find(c=>c.type==='engineer');
 assert.ok(engineer.order,'far iron must not disappear from road planning');assert.equal(engineer.order.job,'road');assert.equal(engineer.order.tile,'1,2');
 const empty=structuredClone(s);empty.nations.france.stock.castIron=0;empty.nations.france.stock.lumber=0;
 const shopping=planEconomy(empty,'france',command);assert.ok(shopping.nations.france.orders.trade.bids.includes('castIron'));assert.ok(shopping.nations.france.orders.trade.bids.includes('lumber'));
});
test('AI offers manufactured surplus above its construction reserve instead of an unreachable production target',()=>{
 const s=createGame(),n=s.nations.france;
 const province=s.tiles.find(t=>t.id===n.capital).province;
 s.armies.push(...[0,1].map(i=>({id:'guard'+i,owner:'france',type:'pikeman',province,hp:100,order:null})));
 n.stock.lumber=8;n.stock.castIron=8;n.stock.fabric=8;
 const next=planEconomy(s,'france',command),offers=next.nations.france.orders.trade.offers;
 assert.ok((offers.lumber??0)>0);assert.ok((offers.castIron??0)>0);
 for(const good of ['lumber','castIron','fabric'])if(offers[good])assert.ok(next.nations.france.stock[good]-offers[good]>=4);
});

test('AI trade preserves six construction goods until a capital garrison is provided',()=>{
 const s=createGame(),n=s.nations.france;s.armies=[];
 for(const c of s.civilians)c.sleep=true;
 for(const good of ['lumber','castIron','fabric'])n.stock[good]=6;
 const next=planEconomy(s,'france',command);
 for(const good of ['lumber','castIron','fabric'])assert.equal(next.nations.france.orders.trade.offers[good]??0,0);
 const province=s.tiles.find(t=>t.id===n.capital).province;
 s.armies.push(...[0,1].map(i=>({id:'guard'+i,owner:'france',type:'pikeman',province,hp:100,order:null})));
 const defended=planEconomy(s,'france',command);
 assert.ok(defended.nations.france.orders.trade.offers.lumber>0);
});


test('adjacent independent routes stay separate until an engineer builds their connecting edge',()=>{
 let s=fixture();s.transportLinks={};
 setTransportLink(s,'1,2','2,2','road');setTransportLink(s,'2,2','3,2','road');
 setTransportLink(s,'4,2','5,2','road');Object.assign(tile(s,'6,2'),{resource:'iron',level:1});
 assert.equal(transport(s,'england').incoming.iron,0);
 assert.ok(transport(s,'england').land.has('4,2'));
 assert.ok(!transport(s,'england').landNodes.has('4,2'),'collection catchment is not a connected construction root');
 civ(s,'engineer').tile='3,2';s=doCiv(s,'engineer','road','4,2');
 assert.equal(transport(s,'england').incoming.iron,0,'unfinished connection delivers nothing');
 s=resolveTurn(s);assert.equal(transport(s,'england').incoming.iron,1);
 s=loadGame(saveGame(s));assert.equal(transport(s,'england').incoming.iron,1);
 assert.equal(transportLink(s,tile(s,'3,2'),tile(s,'4,2')),'road');
});
test('rail upgrades are per edge and preserve a road bottleneck',()=>{
 const s=fixture();s.transportLinks={};
 for(let x=1;x<5;x++)setTransportLink(s,`${x},2`,`${x+1},2`,'road');
 Object.assign(tile(s,'6,2'),{resource:'iron',level:4});
 setTransportLink(s,'4,2','5,2','rail');assert.equal(transport(s,'england').incoming.iron,1);
 assert.equal(transportLink(s,tile(s,'3,2'),tile(s,'4,2')),'road');
 for(let x=1;x<4;x++)setTransportLink(s,`${x},2`,`${x+1},2`,'rail');
 assert.equal(transport(s,'england').incoming.iron,4);
});
test('legacy roads migrate without connecting a newly built adjacent branch',()=>{
 const s=fixture();tile(s,'2,2').road=true;
 setTransportLink(s,'3,2','4,2','road');
 assert.equal(transportLink(s,tile(s,'1,2'),tile(s,'2,2')),'road');
 assert.equal(transportLink(s,tile(s,'2,2'),tile(s,'3,2')),null);
 assert.equal(validTransportLinks(loadGame(saveGame(s))),true);
 s.transportLinks['1,2|6,2']='road';assert.equal(validTransportLinks(s),false);
 assert.throws(()=>loadGame(JSON.stringify(s)));
});

test('live transport matches original recursive collection on32 complete hex layouts',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-network-collection-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,32);
 for(const [i,c] of audit.cases.entries()){
  const s=fixture();s.transportLinks={};s.tiles=c.nodes.map(n=>({id:`${n.x},${n.y}`,x:n.x,y:n.y,owner:'england',province:'home',terrain:0,prospected:true,resource:n.level?'iron':null,level:n.level,road:false,rail:false,port:false}));
  s.nations.england.capital=s.tiles[c.root].id;s.nations.england.known=c.roadCapacity===2?['45']:[];
  for(const [a,,b,kind] of c.edges)if(kind)setTransportLink(s,s.tiles[a].id,s.tiles[b].id,kind);
  const net=transport(s,'england');assert.equal(net.incoming.iron,c.quantity,`native scenario ${i}`);
  for(const row of net.rows)assert.equal(row.delivered,c.collected[s.tiles.findIndex(t=>t.id===row.tile)],`scenario ${i} tile ${row.tile}`);
 }
});

test('upgraded town adds transported material without duplicating paper or consuming timber',()=>{
 const s=fixture();s.transportLinks={};
 for(let x=1;x<6;x++)setTransportLink(s,`${x},2`,`${x+1},2`,'rail');
 tile(s,'6,2').townLevel=1;
 for(const id of ['4,1','5,1'])Object.assign(tile(s,id),{resource:'timber',level:4});
 const net=transport(s,'england');assert.equal(net.incoming.timber,8);assert.equal(net.incoming.lumber,2);assert.equal(net.incoming.paper,0);
 assert.equal(s.nations.england.known.includes('60'),false,'an already upgraded town does not need the new owner to re-research its construction technology');
});

test('Builder upgrades a connected provincial town in two paid turns and adds deliveries',()=>{
 let s=fixture();s.transportLinks={};s.nations.england.known=['60'];
 for(let x=1;x<6;x++)setTransportLink(s,`${x},2`,`${x+1},2`,'rail');
 for(const id of ['4,1','5,1'])Object.assign(tile(s,id),{resource:'timber',level:4});
 s=doCiv(s,'builder','upgradeTown','6,2');assert.equal(s.nations.england.stock.lumber,38);assert.equal(s.nations.england.stock.castIron,38);
 assert.equal(civ(s,'builder').order.remaining,2);assert.equal(transport(s,'england').incoming.lumber,0);
 s=resolveTurn(s);assert.equal(tile(s,'6,2').townLevel,0);s=loadGame(saveGame(s));
 s=resolveTurn(s);assert.equal(tile(s,'6,2').townLevel,1);assert.equal(transport(s,'england').incoming.lumber,2);
 assert.throws(()=>doCiv(s,'builder','upgradeTown','6,2'),/already upgraded/);
});
test('town upgrade requires technology, a connected town, correct civilian and affordable stock',()=>{
 const s=fixture();assert.throws(()=>doCiv(s,'builder','upgradeTown','6,2'),/Bureaucracy/);
 s.nations.england.known=['60'];assert.throws(()=>doCiv(s,'builder','upgradeTown','6,2'),/road or rail/);
 setTransportLink(s,'5,2','6,2','road');
 assert.throws(()=>doCiv(s,'engineer','upgradeTown','6,2'),/Builder/);
 assert.throws(()=>doCiv(s,'builder','upgradeTown','1,2'),/Capital/);
 assert.throws(()=>doCiv(s,'builder','upgradeTown','5,2'),/provincial town/);
 s.nations.england.stock.lumber=1;assert.throws(()=>doCiv(s,'builder','upgradeTown','6,2'));
 assert.equal(civ(s,'builder').order,null);assert.equal(s.nations.england.stock.castIron,40);
});
test('lost town cancels pending upgrade and keeps the captured town small',()=>{
 let s=fixture();s.nations.england.known=['60'];setTransportLink(s,'5,2','6,2','road');s=doCiv(s,'builder','upgradeTown','6,2');
 tile(s,'6,2').owner='minor';s=resolveTurn(resolveTurn(s));assert.equal(tile(s,'6,2').townLevel,0);assert.equal(civ(s,'builder').order,null);
});

test('AI uses the same paid town-upgrade order once immediate resource development is satisfied',()=>{
 const s=fixture();s.transportLinks={};s.nations.england.known=['60'];
 for(let x=1;x<6;x++)setTransportLink(s,`${x},2`,`${x+1},2`,'rail');
 for(const id of ['4,1','5,1'])Object.assign(tile(s,id),{resource:'timber',level:4});
 const next=planEconomy(s,'england',command);assert.equal(civ(next,'builder').order.job,'upgradeTown');assert.equal(civ(next,'builder').order.tile,'6,2');
});

test('AI food planning respects actual diets rather than total food or an even split',async()=>{
 const {foodNeeds}=await import('../economy.mjs');
 const s=fixture(),n=s.nations.england;n.simpleFood=false;s.ships=[];s.armies=[];
 for(const w of n.workers)w.diet='grain';
 Object.assign(tile(s,'1,2'),{resource:'grain',level:4});Object.assign(tile(s,'2,2'),{resource:'meat',level:4});
 assert.deepEqual(foodNeeds(s,'england'),{grain:6,protein:0,total:6});
 const blocked=planEconomy(s,'england',command);
 assert.equal(blocked.construction.filter(c=>c.kind==='worker').length,0,'abundant protein cannot support another grain eater');
 Object.assign(tile(s,'1,1'),{resource:'grain',level:4});
 const supported=planEconomy(s,'england',command);
 assert.equal(supported.construction.filter(c=>c.kind==='worker').length,1);
 const reports=[];n.stock.grain=6;n.stock.meat=0;n.stock.fish=0;feed(s,'england',reports);
 assert.equal(reports[0].sick,0);assert.equal(reports[0].starved,0);
});


test('AI connects and develops a nationally surveyed mine, delivering iron for manufacturing',()=>{
 let s=fixture();const target='5,2';Object.assign(tile(s,target),{resource:'iron',terrain:8,mineral:4,prospected:false});
 s.nations.england.revealed=s.tiles.map(t=>t.id);
 // Until the Explorer finishes, neither construction planner may act on it.
 const before=[];planEconomy(s,'england',(state,id,a)=>{if(a.type==='civilian')before.push(a);return command(state,id,a);});
 assert.ok(!before.some(a=>a.job==='road'||a.job==='develop'));
 s=resolveTurn(doCiv(s,'explorer','prospect',target));
 assert.ok(s.nations.england.prospected.includes(target));assert.equal(tile(s,target).prospected,false);
 const actions=[];
 for(let i=0;i<12;i++){
  s=planEconomy(s,'england',(state,id,a)=>{const next=command(state,id,a);if(a.type==='civilian')actions.push(a);return next;});
  s=resolveTurn(loadGame(saveGame(s)));
 }
 assert.ok(actions.some(a=>a.job==='road'));assert.ok(actions.some(a=>a.job==='develop'&&a.tile===target));
 assert.equal(tile(s,target).level,1);assert.equal(transport(s,'england').incoming.iron,1);
 assert.ok(s.nations.england.stock.iron>=2);
 for(const recipe of Object.keys(RECIPES))s=command(s,'england',{type:'production',recipe,quantity:0});
 const stock={...s.nations.england.stock};s=command(s,'england',{type:'production',recipe:'castIron',quantity:1});
 s=resolveTurn(s);
 assert.equal(s.nations.england.stock.castIron,stock.castIron+1);
 assert.equal(s.nations.england.stock.iron,stock.iron-2+1);
});


test('AI steel technology drives coal connection, development, deliveries and real steel production',()=>{
 let s=fixture(),n=s.nations.england;
 Object.assign(tile(s,'0,2'),{resource:'iron',level:1});
 Object.assign(tile(s,'1,1'),{resource:'timber',level:1});
 Object.assign(tile(s,'1,3'),{resource:'timber',level:1});
 Object.assign(tile(s,'5,2'),{resource:'coal',terrain:8,mineral:5});
 n.known=[];n.stock.iron=20;
 const locked=[];planEconomy(s,'england',(state,id,a)=>{const next=command(state,id,a);locked.push(a);return next;});
 assert.ok(!locked.some(a=>a.type==='civilian'&&['develop','road'].includes(a.job)));
 assert.ok(!locked.some(a=>a.type==='production'&&a.recipe==='steel'&&a.quantity>0));
 n.known.push('29','66');const actions=[];let madeSteel=false;
 for(let i=0;i<20;i++){
  s=planEconomy(s,'england',(state,id,a)=>{const next=command(state,id,a);actions.push(a);return next;});
  const planned=s.nations.england.orders.production.steel,prior={...s.nations.england.stock};
  s=resolveTurn(loadGame(saveGame(s)));
  if(planned){assert.ok(prior.iron>=planned&&prior.coal>=planned);assert.equal(s.nations.england.stock.steel,prior.steel+planned);madeSteel=true;}
 }
 assert.ok(actions.some(a=>a.type==='civilian'&&a.job==='road'));
 assert.ok(actions.some(a=>a.type==='civilian'&&a.job==='develop'&&a.tile==='5,2'));
 assert.equal(transport(s,'england').incoming.coal,1);assert.ok(madeSteel);
 assert.ok(s.nations.england.stock.steel>=4);
});


test('AI develops both bronze ores and manufactures from their delivered stock',()=>{
 let s=fixture();Object.assign(tile(s,'0,2'),{resource:'iron',level:1});
 Object.assign(tile(s,'1,1'),{resource:'timber',level:1});Object.assign(tile(s,'1,3'),{resource:'timber',level:1});
 Object.assign(tile(s,'0,1'),{resource:'copper',terrain:8,mineral:3});
 Object.assign(tile(s,'0,3'),{resource:'tin',terrain:8,mineral:2});
 let manufactured=false;
 for(let i=0;i<16;i++){
  s=planEconomy(s,'england',command);
  const q=s.nations.england.orders.production.bronze,prior={...s.nations.england.stock};
  s=resolveTurn(loadGame(saveGame(s)));
  if(q){assert.ok(prior.copper>=q&&prior.tin>=q);assert.equal(s.nations.england.stock.bronze,prior.bronze+q);manufactured=true;}
 }
 assert.ok(manufactured);assert.equal(transport(s,'england').incoming.copper,1);assert.equal(transport(s,'england').incoming.tin,1);
});
test('Coal Mining alone develops an exportable coal supply without unlocking steel',()=>{
 let s=fixture();s.nations.england.known=['29'];
 Object.assign(tile(s,'0,2'),{resource:'iron',level:1});Object.assign(tile(s,'1,1'),{resource:'timber',level:1});Object.assign(tile(s,'1,3'),{resource:'timber',level:1});
 Object.assign(tile(s,'5,2'),{resource:'coal',terrain:8,mineral:5});
 for(let i=0;i<20;i++){s=planEconomy(s,'england',command);assert.equal(s.nations.england.orders.production.steel,0);s=resolveTurn(loadGame(saveGame(s)));}
 assert.equal(transport(s,'england').incoming.coal,1);assert.ok(s.nations.england.stock.coal>6);assert.equal(s.nations.england.stock.steel,0);
});


test('horse supply requires an engineer connection and builder development before paid artillery recruitment',()=>{
 let s=fixture();s.nations.england.known=[...goalPath('59')];
 Object.assign(tile(s,'0,2'),{resource:'iron',level:1});
 Object.assign(tile(s,'1,1'),{resource:'timber',level:1});Object.assign(tile(s,'1,3'),{resource:'timber',level:1});
 Object.assign(tile(s,'6,2'),{resource:'horses',terrain:3,level:0});
 s.nations.england.stock.bronze=4;
 assert.equal(transport(s,'england').incoming.horses,0);
 assert.throws(()=>command(s,'england',{type:'recruitUnit',kind:'army',unit:'horseArtillery'}));
 const orders=[];let firstDevelop=-1,firstDelivery=-1;
 for(let i=0;i<30&&s.nations.england.stock.horses<3;i++){
  s=planEconomy(s,'england',(state,id,a)=>{const next=command(state,id,a);if(a.type==='civilian')orders.push(a);return next;});
  const before=s.nations.england.stock.horses;
  s=resolveTurn(loadGame(saveGame(s)));
  if(tile(s,'6,2').level===1&&firstDevelop<0)firstDevelop=i;
  if(s.nations.england.stock.horses>before&&firstDelivery<0)firstDelivery=i;
 }
 assert.ok(orders.some(a=>a.job==='road'),'engineer builds a connection');
 assert.ok(orders.some(a=>a.job==='develop'&&a.tile==='6,2'),'builder develops the ranch');
 assert.ok(firstDelivery>firstDevelop,'new works supply the following turn');
 assert.equal(tile(s,'6,2').level,1);assert.equal(maxDevelopment(s.nations.england,tile(s,'6,2')),1);
 assert.equal(transport(s,'england').incoming.horses,1);assert.ok(s.nations.england.stock.horses>=3);
 s=command(s,'england',{type:'clearProduction'});
 const prior={...s.nations.england.stock},workers=s.nations.england.workers.length;
 s=command(s,'england',{type:'recruitUnit',kind:'army',unit:'horseArtillery'});
 assert.equal(s.nations.england.stock.horses,prior.horses-3);assert.equal(s.nations.england.stock.bronze,prior.bronze-4);
 assert.equal(s.nations.england.workers.length,workers-1);
 assert.ok(!s.armies.some(u=>u.type==='horseArtillery'));
 s=resolveTurn(loadGame(saveGame(s)));assert.ok(s.armies.some(u=>u.type==='horseArtillery'));
});
