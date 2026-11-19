from pathlib import Path
p=Path('game/map.mjs');s=p.read_text()
s=s.replace("import {militarySprite} from './military-art.mjs';","import {fleetAnchor,seaName,drawTent,drawCivilianWork} from './map-markers.mjs';")
s=s.replace('planningCivilian=()=>false}={}', 'planningCivilian=()=>false,onBackground=()=>{},onMapTap=()=>false}={}')
s=s.replace('armyHits=[];', 'armyHits=[],fleetHits=[];',1).replace('civilianHits=[];armyHits=[];if','civilianHits=[];armyHits=[];fleetHits=[];if')
a=s.index('    for(const id of z.cells)');b=s.index('\n   }\n  }',a)
s=s[:a]+'''    const known=z.cells.some(id=>Number(id.split(',')[0])>=60)||seen.has(z.id);if(!known)continue;
    for(const id of z.cells){const [tx,ty]=id.split(',').map(Number);const p=screen({x:tx,y:ty});if(p.x< -scale||p.y< -scale||p.x>w+scale||p.y>h+scale)continue;
     if(z.id===selected){hex(p.x,p.y,scale*.58);ctx.fillStyle='#99bab118';ctx.fill();}
     for(let d=0;d<6;d++){const nid=riverNeighbor({x:tx,y:ty},d),other=s.seas.cellZones[nid];if(!other||other===z.id)continue;const [nx,ny]=nid.split(',').map(Number),q=screen({x:nx,y:ny}),dx=q.x-p.x,dy=q.y-p.y,len=Math.hypot(dx,dy),mx=(p.x+q.x)/2,my=(p.y+q.y)/2;
      ctx.beginPath();ctx.moveTo(mx-dy/len*scale*.288,my+dx/len*scale*.288);ctx.lineTo(mx+dy/len*scale*.288,my-dx/len*scale*.288);ctx.strokeStyle='#ccdbcf35';ctx.lineWidth=.8;ctx.stroke();}
    }
    const [tx,ty]=z.center.split(',').map(Number);if(scale>=6){const p=screen({x:tx,y:ty});ctx.fillStyle='#d3ded0b0';ctx.font='italic 11px Georgia';ctx.textAlign='center';ctx.fillText(seaName(s,z),p.x,p.y-22);}
''' +s[b:]
a=s.index('   if(working){ctx.strokeStyle=');b=s.index("   ctx.fillStyle=c.order?",a)
s=s[:a]+"   if(working)drawCivilianWork(ctx,c.type,dx,y,reducedMotion.matches?0:phase,scale);\n"+s[b:]
a=s.index('   const height=Math.min(76');b=s.index('   armyHits.push',a)
s=s[:a]+"   drawTent(ctx,x,y-8,Math.min(32,scale*.55),s.nations[s.player].color,units.length);\n"+s[b:]
a=s.index("   const key=location==='home'?");b=s.index('   if(scale<20)',a)
s=s[:a]+"   const key=fleetAnchor(s,location);if(!key)continue;\n   const [tx,ty]=key.split(',').map(Number),p=screen({x:tx,y:ty}),x=p.x,y=p.y;\n   fleetHits.push({tile:key,ships:ships.map(ship=>ship.id),x,y});\n"+s[b:]
s=s.replace("const hits=[...civilianHits", "if(onMapTap())return;const hits=[...(!planningCivilian()?fleetHits.filter(f=>Math.abs(f.x-x)<22&&Math.abs(f.y-y)<24):[]),...civilianHits")
s=s.replace('onSelect(hit.tile,hit.id??null,hit.units);','onSelect(hit.tile,hit.id??null,hit.units,hit.ships);')
s=s.replace('if(best){selected=best.id;onSelect(best.id);draw();}}});','if(best){selected=best.id;onSelect(best.id);draw();}else onBackground();}});')
p.write_text(s)
p=Path('game/app.mjs');s=p.read_text();s="import {seaName} from './map-markers.mjs';\n"+s
s=s.replace('(id,unit,regiments)=>{selected=id;',"(id,unit,regiments,ships)=>{selected=id;if(ships){fleetSelection=ships;civilian=null;openPanel('navy');return;}")
s=s.replace('{planningCivilian:()=>!!civilian});',"{planningCivilian:()=>!!civilian,onBackground:()=>document.body.classList.toggle('map-only'),onMapTap:()=>{if(document.body.classList.contains('map-only')){document.body.classList.remove('map-only');return true;}return false;}});\n$('mapOnly').onclick=()=>document.body.classList.toggle('map-only');")
a=s.index('function foreignKnowledge(');b=s.index('\n',a)
s=s[:a]+'''function foreignKnowledge(tech){const sources=technologySources(state,nation(),tech);return '<span class="knowledge-flags" aria-label="Known abroad">'+sources.map(n=>`<span class="knowledge-flag" role="img" aria-label="${esc(n.name)}${n.spy?' · spy assistance':''}" title="${esc(n.name)}${n.spy?' · spy assistance':''}" style="--flag:${state.nations[n.id].color}"></span>`).join('')+'</span>'; }
'''+s[b:]
s=s.replace(" $('panelBody').innerHTML=html;"," $('panelBody').dataset.panel=currentPanel;\n $('panelBody').innerHTML=html;")
s=s.replace("  for(const t of list)html+=`<div class=\"card\"><b", "  html+='<div class=\"technology-grid\">';\n  for(const t of list)html+=`<div class=\"card technology-card\">${foreignKnowledge(t.id)}<b")
s=s.replace('${esc(t.description)}</p>${foreignKnowledge(t.id)}<p>Requires:', '${esc(t.description)}</p><p>Requires:')
s=s.replace("  if(!list.length)html+='<p>No technologies in this view.</p>';", "  html+='</div>';\n  if(!list.length)html+='<p>No technologies in this view.</p>';")
s=s.replace('About ${turns} turns if fully funded; discoveries can be earlier or later', '~${turns} turns · estimate')
s=s.replace("  html='<p>Select ships together to form a fleet. Its range is limited by its slowest ship. Ships leaving the home fleet stop carrying trade and resources this turn. Defending ships stay available for manual orders; at home they still carry goods.</p>';", "  html='<p class=\"fleet-heading\">Fleet roster · '+selectedShips.length+' selected</p><p class=\"muted\">Select ships, then choose a destination and mission. Movement is measured in seas; the slowest ship sets fleet speed.</p><div class=\"fleet-roster\">';")
s=s.replace('  if(selectedShips.length){', "  html+='</div>';\n  if(selectedShips.length){",1)
s=s.replace("  html+='<p class=\"notice\">Idle fleets", "  html+='<details><summary>Naval missions and supply</summary><p class=\"notice\">Idle fleets")
s=s.replace('Neutral blockade cancellation remains in development.</p>\';','Neutral blockade cancellation remains in development.</p></details>\';')
p.write_text(s)
p=Path('game/index.html');s=p.read_text().replace('<button id="home">','<button id="mapOnly" aria-label="Hide interfaces">Map only</button><button id="home">');p.write_text(s)
p=Path('game/style.css');p.write_text(p.read_text()+'''
/* Compact parchment research ledger and uncluttered cartography. */
body.map-only #app>header,body.map-only #summary,body.map-only #selection,body.map-only #navigation,body.map-only .map-controls{display:none}
body.map-only #app{display:flex}body.map-only .map-area{flex:1;min-height:100%}
body.map-only .map-caption{font-size:0}body.map-only .map-caption:after{content:'Tap to restore controls · drag or pinch to explore';font-size:11px}
.map-controls{flex-wrap:wrap;max-width:calc(100% - 16px);justify-content:flex-end}.map-controls button{padding:5px 7px}
.technology-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
.technology-card{margin:0;padding:8px;position:relative;min-width:0}.technology-card>b{display:block;font-size:14px;line-height:1.2;padding-top:13px;min-height:46px}
.technology-card summary{font:11px/1.3 system-ui;min-height:44px}.technology-card>button{width:100%;font-size:12px}
.knowledge-flags{display:flex;gap:3px;justify-content:flex-end;min-height:11px}.knowledge-flag{display:inline-block;width:14px;height:9px;background:var(--flag);border:1px solid #463b28;box-shadow:-2px 2px #76654166}
.technology-card .knowledge-flags{position:absolute;right:7px;top:7px}
#panelBody[data-panel=research]>.card{padding:7px;margin:5px 0}#panelBody[data-panel=research]>.card p{font:11px/1.3 system-ui;margin:4px 0}
#panelBody[data-panel=research] h3{font-size:15px}.research-funding p{margin:3px 0}
#panelBody[data-panel=navy] .fleet-card{padding:8px;margin:4px 0}#panelBody[data-panel=navy] .fleet-card p{font:11px/1.35 system-ui;margin:4px 0}
.fleet-heading{font-weight:bold;border-bottom:1px solid #a9915e;padding-bottom:6px}
@media(min-width:600px){.technology-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
''')
