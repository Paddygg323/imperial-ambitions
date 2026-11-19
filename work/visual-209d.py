from pathlib import Path
p=Path('game/app.mjs');s=p.read_text().replace("pickFleetDestination(id===state.nations[state.player].capital?'home':'port:'+id)","pickFleetDestination(state.seas?.cellZones[id]??(id===state.nations[state.player].capital?'home':'port:'+id))");p.write_text(s)
p=Path('game/map-markers.mjs');s=p.read_text().replace(" if(zone.name)return zone.name;", " if(zone.name)return zone.name;\n if(state.provinces.some(p=>p.name==='London'&&p.town==='82,23')&&zone.cells.includes('84,21'))return 'Southern North Sea';");p.write_text(s)
p=Path('game/map.mjs');s=p.read_text().replace('if(working)drawCivilianWork','if(working&&c.order.job!==\'move\')drawCivilianWork');p.write_text(s)
