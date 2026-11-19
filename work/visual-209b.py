from pathlib import Path
p=Path('game/map.mjs');s=p.read_text().replace('onBackground=()=>{},onMapTap','onBackground=()=>{},onSea=()=>false,onMapTap');s=s.replace('else onBackground();','else {let sea=null,dist=scale*.6;for(const [id,zone] of Object.entries(getState().seas?.cellZones??{})){const [tx,ty]=id.split(\',\').map(Number),p=screen({x:tx,y:ty}),d=Math.hypot(p.x-x,p.y-y);if(d<dist&&(tx>=60||getState().nations[getState().player].seenSea?.includes(zone))){dist=d;sea=zone;}}if(!sea||!onSea(sea))onBackground();}');p.write_text(s)
p=Path('game/app.mjs');s=p.read_text();s=s.replace("const map=createMap", "let fleetPlanning=false,plannedDestination=null;\nfunction pickFleetDestination(destination){const ships=state.ships.filter(s=>fleetSelection.includes(s.id)&&s.owner===state.player);if(!fleetMoves(state,ships).some(m=>m.zone===destination)){toast('Destination out of range or unavailable. Choose a reachable sea or your port.');return true;}plannedDestination=destination;fleetPlanning=false;openPanel('navy');return true;}\nconst map=createMap")
s=s.replace('(id,unit,regiments,ships)=>{selected=id;', "(id,unit,regiments,ships)=>{if(fleetPlanning){pickFleetDestination(id===state.nations[state.player].capital?'home':'port:'+id);return;}selected=id;")
s=s.replace('onBackground:()=>document.body', 'onSea:zone=>fleetPlanning?pickFleetDestination(zone):false,onBackground:()=>document.body')
s=s.replace("if(name==='army')civilian=null;currentPanel", "fleetPlanning=false;if(name==='army'||name==='navy')civilian=null;currentPanel")
s=s.replace('style="--flag:${state.nations[n.id].color}"></span>', 'style="--flag:${state.nations[n.id].color}">${n.spy?\'<sup>s</sup>\':\'\'}</span>')
s=s.replace('${esc(m.label)} · ${m.distance} zones', "${esc(state.seas.zones.some(z=>z.id===m.zone)?seaName(state,state.seas.zones.find(z=>z.id===m.zone)):m.label)} · ${m.distance} seas")
s=s.replace('<option value="${m.zone}">','<option value="${m.zone}" ${m.zone===plannedDestination?\'selected\':\'\'}>')
s=s.replace("${button('View destination','viewSea')}","${button('Choose on map','planFleet')}${button('View destination','viewSea')}")
s=s.replace("case 'sailFleet':", "case 'planFleet':closePanel();civilian=null;fleetPlanning=true;map.fitNation();toast('Tap a sea or your port to choose a destination. No order until you confirm sailing.');break;\n case 'sailFleet':")
# Move the mission controls ahead of the roster so they remain visible on a phone.
s=s.replace("  html+='<details><summary>Naval missions", "  const orderStart=html.indexOf('<h3>Fleet orders</h3>');if(orderStart>=0){const orderEnd=html.length;html=html.slice(orderStart,orderEnd)+html.slice(0,orderStart);}\n  html+='<details><summary>Naval missions")
# Remove unnecessary vertical space; summary and order action share a row.
s=s.replace('<summary>Benefits and prerequisites</summary>','<summary>Details</summary>')
p.write_text(s)
p=Path('game/style.css');p.write_text(p.read_text()+'''
.technology-card{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:start;gap:3px;padding:7px}
.technology-card>b{grid-column:1/-1;min-height:40px;font-size:13px;padding-top:10px}
.technology-card details{margin:0;min-width:0}.technology-card summary{display:flex;align-items:center;padding:0;min-height:44px}
.technology-card details[open]{grid-column:1/-1;grid-row:3}.technology-card details p{font:12px/1.4 Georgia}
.technology-card>button{font-size:11px;padding:5px;min-width:0}
.knowledge-flag sup{font:bold 8px system-ui;color:#fff;text-shadow:0 1px #000}
#panelBody[data-panel=research]>.research-funding{font-size:11px;padding:4px 7px}
#panelBody[data-panel=research]>.research-funding p:not(:first-child){display:none}
''')
