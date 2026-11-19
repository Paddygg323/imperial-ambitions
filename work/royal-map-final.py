from pathlib import Path
p=Path('game/map.mjs')
s=p.read_text(encoding='utf-8')
s=s.replace("const colors=", "export const LOCAL_MAP_SCALE=78;\nconst colors=",1)
s=s.replace('scale=54;draw();','scale=LOCAL_MAP_SCALE;draw();')
s=s.replace("hex(x,y,scale*.576);if(scale>=66&&neighbourIds(t).every(id=>ix.has(id))){ctx.strokeStyle='#59684b35';ctx.lineWidth=.65;ctx.stroke();}","hex(x,y,scale*.576);")
s=s.replace("const cw=sites.naturalWidth/3,ch=sites.naturalHeight/3,size=scale*.68*factor", "const cw=sites.naturalWidth/3,ch=sites.naturalHeight/3,size=scale*.83*factor")
s=s.replace("width=scale*(plant?.55:.59),height=scale*(plant?.52:.54)", "width=scale*(plant?.76:.78),height=scale*(plant?.70:.69)")
s=s.replace("sprite(9,x,y+scale*.28,scale*.78,scale*.74)", "sprite(9,x,y+scale*.38,scale*1.02,scale*.97)")
s=s.replace("scale*.82*v,scale*.76*v", "scale*.98*v,scale*.91*v")
s=s.replace("sprite(10,x,y+10,Math.max(26,scale*.67),Math.max(24,scale*.61))", "sprite(10,x,y+15,Math.max(35,scale*.94),Math.max(33,scale*.86))")
s=s.replace("ctx.fillText(String(ships.length),x,y+17)", "ctx.fillText(String(ships.length),x,y+24)")
s=s.replace("  // Draw borders after terrain, with each nation's colour on its own side.", """  // A single continuous tile lattice is drawn after terrain patches, so adjacent
  // patches cannot erase an edge. It remains clipped to the natural coastline.
  if(!atlas&&scale>=30){ctx.save();ctx.strokeStyle='#354b2b88';ctx.lineWidth=scale>=66?1.1:.75;
   for(const t of s.tiles){if(!visible(s,s.player,t))continue;const p=screen(t);if(p.x< -scale||p.y< -scale||p.x>w+scale||p.y>h+scale)continue;hex(p.x,p.y,scale*.57735);ctx.stroke();}
   ctx.restore();}
  // Draw borders after terrain, with each nation's colour on its own side.""")
p.write_text(s,encoding='utf-8')
q=Path('game/test/direct-map-orders-browser.mjs');s=q.read_text(encoding='utf-8').replace('*54','*78').replace(',54*',',78*');q.write_text(s,encoding='utf-8')
q=Path('game/test/map-fog-browser.mjs');s=q.read_text(encoding='utf-8').replace('map.zoom(6/54)','map.zoom(6/map.viewport().scale)');q.write_text(s,encoding='utf-8')
