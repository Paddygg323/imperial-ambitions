from pathlib import Path
p=Path('game/map.mjs');s=p.read_text(encoding='utf-8').replace("'âš“'","'⚓\\uFE0E'")
s=s.replace('selected=null,w=0,h=0','selected=null,w=0,h=0,civilianHits=[]')
s=s.replace('  if(!w||!h)return;','  civilianHits=[];if(!w||!h)return;')
s=s.replace("   sprite(index,dx,y+8,35,52);", "   civilianHits.push({id:c.id,tile:c.tile,x:dx,y:y-18});sprite(index,dx,y+8,35,52);")
s=s.replace("let best=null,d=scale*.6;", "const hit=civilianHits.slice().reverse().find(c=>Math.abs(c.x-x)<18&&Math.abs(c.y-y)<26);if(hit){selected=hit.tile;onSelect(hit.tile,hit.id);draw();return;}let best=null,d=scale*.6;")
p.write_text(s,encoding='utf-8')
p=Path('game/app.mjs');s=p.read_text(encoding='utf-8').replace("()=>state,id=>{selected=id;renderSelection();}","()=>state,(id,unit)=>{selected=id;if(unit)civilian=unit;renderSelection();}");p.write_text(s,encoding='utf-8')
