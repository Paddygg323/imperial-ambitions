from pathlib import Path
p=Path('game/app.mjs');s=p.read_text()
s=s.replace("${button('Choose on map','planFleet')}${button('View destination','viewSea')}${button('Sail selected ships','sailFleet')}","${button('Choose on map','planFleet',{},!moves.length)}${button('View destination','viewSea',{},!moves.length)}${button('Sail selected ships','sailFleet',{},!moves.length)}")
s=s.replace('<h3>Fleet orders</h3><label>',"<h3>Fleet orders</h3>${selectedShips.some(s=>s.order)?'<p>Mission assigned. Cancel it before giving a new sailing order.</p>'+button('Cancel selected missions','cancelFleet'):''}<label>")
s=s.replace("case 'planFleet':", "case 'cancelFleet':issue({type:'fleet',ships:fleetSelection,job:'cancel'});break;\n case 'planFleet':")
s=s.replace("ship.location.replace('sea','Sea ')","seaName(state,state.seas.zones.find(z=>z.id===ship.location)??{id:ship.location,cells:[],coast:[]})")
s=s.replace(":ship.order.destination)):''}",":(state.seas.zones.find(z=>z.id===ship.order.destination)?seaName(state,state.seas.zones.find(z=>z.id===ship.order.destination)):ship.order.destination))):''}")
# Put warehouse behind a compact ledger summary so manufacturing is immediately usable.
s=s.replace("+stockPanel();", "+'<details class=\"warehouse-ledger\"><summary>Warehouse · available materials</summary>'+stockPanel()+'</details>';")
p.write_text(s)
p=Path('game/map.mjs');s=p.read_text().replace("const s=getState(),ix=new Map(s.tiles.map(t=>[t.id,t]));ctx.clearRect", "const s=getState(),ix=new Map(s.tiles.map(t=>[t.id,t])),seaLabels=[];ctx.clearRect")
s=s.replace("ctx.fillText(seaName(s,z),p.x,p.y-22);", "seaLabels.push({name:seaName(s,z),x:p.x,y:p.y-22});")
s=s.replace("  if(scale>=20)for(const c", "  ctx.save();ctx.fillStyle='#d3ded0d0';ctx.strokeStyle='#344f60';ctx.lineWidth=2;ctx.font='italic 11px Georgia';ctx.textAlign='center';for(const label of seaLabels){ctx.strokeText(label.name,label.x,label.y);ctx.fillText(label.name,label.x,label.y);}ctx.restore();\n  if(scale>=20)for(const c")
p.write_text(s)
p=Path('game/style.css');p.write_text(p.read_text()+'''
/* Shared ledger treatment for every management screen. */
.dialog-head h2{font-size:22px}.dialog-head{padding:7px 10px}#panelBody{padding:9px 10px 20px}
#panelBody>h3{border-bottom:1px solid #b69a5866;padding-bottom:5px}
#panelBody .row{box-shadow:none;border-left-width:2px;padding:7px;margin:4px 0}
#panelBody .card>p{font-size:12px;line-height:1.4;margin:6px 0}
#panelBody[data-view=industry] .stock{grid-template-columns:repeat(3,minmax(0,1fr))}
.warehouse-ledger{border:1px solid #b6a278;padding:0 8px;background:#d8c69b55}.warehouse-ledger>summary{min-height:44px;padding-top:12px}
#panelBody[data-view=trade]>.card{display:flex;align-items:center;flex-wrap:wrap;gap:4px}#panelBody[data-view=trade]>.card .actions{margin:0;flex-basis:100%}
#panelBody[data-view=transport] table{font-variant-numeric:tabular-nums}#panelBody[data-view=reports]>p{padding:8px 5px;border-bottom:1px solid #b6a27866}
''')
