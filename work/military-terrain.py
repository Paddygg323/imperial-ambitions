from pathlib import Path
p=Path('game/app.mjs');s=p.read_text(encoding='utf-8');s="import {militaryPortrait} from './military-art.mjs';\n"+s;s=s.replace('html+=`<div class="card">${button((armySelection', 'html+=`<div class="card regiment-card">${militaryPortrait(u.type)}${button((armySelection');p.write_text(s,encoding='utf-8')
p=Path('game/battle-view.mjs');s=p.read_text(encoding='utf-8');s="import {militaryPortrait} from './military-art.mjs';\n"+s;s=s.replace('<span>${escape(abbreviation(occupant.type))}</span>', '${militaryPortrait(occupant.type)}<span class="unit-caption">${escape(abbreviation(occupant.type))}</span>');s=s.replace('${escape(nameOf(u.type))}<small>', '${militaryPortrait(u.type)}${escape(nameOf(u.type))}<small>');p.write_text(s,encoding='utf-8')
p=Path('game/map.mjs');s=p.read_text(encoding='utf-8');s=s.replace(' const resources=new Image();', " const ground=new Image();ground.src=new URL('./assets/terrain.png',import.meta.url).href;ground.onload=()=>draw();\n const resources=new Image();")
a=s.index('  for(let j=0;j<22;j++)');b=s.index('  ctx.restore();',a)
s=s[:a]+'''  const terrainIndex=[0,9,1,1,9,10,2,3,4,5,6,7,8,0,1,10,10,7][t.terrain]??0;
  if(ground.complete&&ground.naturalWidth){const sx=(terrainIndex%6)*256+((t.x*19+t.y*7)%96),sy=Math.floor(terrainIndex/6)*512+((t.x*13+t.y*23)%352);ctx.drawImage(ground,sx,sy,160,160,x-scale*.58,y-scale*.58,scale*1.16,scale*1.16);}
''' + s[b:]
# detail changes the current canvas path; restore it before political fill/stroke.
s=s.replace("detail(t,x,y);ctx.strokeStyle", "detail(t,x,y);hex(x,y,scale*.576);ctx.strokeStyle")
p.write_text(s,encoding='utf-8')
p=Path('game/sw.js');s=p.read_text(encoding='utf-8').replace('3-200','3-201').replace("const FILES=[", "const FILES=['military-art.mjs','assets/military.png','assets/terrain.png',");p.write_text(s,encoding='utf-8')
css='''
.military-portrait{display:inline-block;flex:none;width:64px;height:90px;background-image:url('assets/military.png');background-size:384px 256px;background-position:calc(var(--unit-col)* -64px) calc(var(--unit-row)* -128px -20px);background-repeat:no-repeat;pointer-events:none}
.regiment-card>.military-portrait{float:left;margin-right:12px}.regiment-card::after{content:'';display:block;clear:both}
'''
p=Path('game/style.css');p.write_text(p.read_text(encoding='utf-8')+css,encoding='utf-8')
p=Path('game/battle-view.css');s=p.read_text(encoding='utf-8');s+=css+'''
.battle-view .battle-tile.friendly,.battle-view .battle-tile.hostile{background-image:none}.battle-view .battle-tile{overflow:visible}.battle-tile .military-portrait{position:absolute;inset:auto 0 8px;width:100%;height:95%;background-size:600% 200%;background-position:calc(var(--unit-col)*20%) calc(var(--unit-row)*100%);z-index:1}.battle-tile .unit-caption{position:relative;z-index:2;align-self:end;margin-top:27px;font-size:9px;color:white;background:#102832b8;padding:0 2px;line-height:11px}.battle-tile i{position:absolute;bottom:1px;z-index:3}.battle-roster .military-portrait{display:block;width:42px;height:48px;margin:auto;background-size:252px 168px;background-position:calc(var(--unit-col)* -42px) calc(var(--unit-row)* -84px -14px)}
.battle-board{background-image:url('assets/terrain.png');background-size:1536px 1024px;background-position:0 0}
''';p.write_text(s,encoding='utf-8')
