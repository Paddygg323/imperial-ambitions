from pathlib import Path
p=Path('game/map.mjs');s=p.read_text().replace("hex(p.x,p.y,scale*.58);ctx.fillStyle=ocean", "hex(p.x,p.y,scale*.605);ctx.fillStyle=ocean")
mark="  ctx.save();ctx.fillStyle='#d3ded0d0';"
new="""  const unchartedSea=s.seas?.cellZones['28,28'],unchartedLand=ix.get('28,28');
  if(!(unchartedSea&&(s.nations[s.player].seenSea??[]).includes(unchartedSea))&&!(unchartedLand&&visible(s,s.player,unchartedLand))){const p=screen({x:28,y:28});ctx.save();ctx.fillStyle='#43594f';ctx.font='italic 14px Georgia';ctx.textAlign='center';ctx.fillText('Unexplored',p.x,p.y);ctx.restore();}
"""
assert mark in s;s=s.replace(mark,new+mark);p.write_text(s,encoding='utf-8')
