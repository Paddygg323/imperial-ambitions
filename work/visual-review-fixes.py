from pathlib import Path
p=Path('game/app.mjs');s=p.read_text(encoding='utf-8');s=s.replace('<div class="card regiment-card">${militaryPortrait(u.type)}${button(', '<div class="card regiment-card">${militaryPortrait(u.type)}<div class="regiment-info">${button(')
s=s.replace("${u.order?button('Cancel order','cancelArmy',{id:u.id}):''}</div>`;}","${u.order?button('Cancel order','cancelArmy',{id:u.id}):''}</div></div>`;}")
p.write_text(s,encoding='utf-8')
p=Path('game/style.css');s=p.read_text(encoding='utf-8');s+='''
/* Stable portrait column keeps stats from wrapping underneath the figure. */
.regiment-card{display:grid;grid-template-columns:60px minmax(0,1fr);gap:10px;align-items:start}.regiment-card>.military-portrait{float:none;margin:0;justify-self:center}.regiment-card::after{display:none}.regiment-info{min-width:0;font:12px/1.5 system-ui,sans-serif}.regiment-info p{margin:6px 0}.regiment-info>button[data-action=selectRegiment]{font:600 15px Georgia,serif;width:100%;text-align:left}.regiment-info>button{margin:2px 3px 2px 0}.muted,small{color:#5b513d}.tabs button.selected{box-shadow:inset 0 -3px #dcc17e}
''';p.write_text(s,encoding='utf-8')
p=Path('game/map.mjs');s=p.read_text(encoding='utf-8');s=s.replace("x=p.x+(location==='home'?scale*.35:0),y=p.y+10;", "inPort=location==='home'||location.startsWith('port:'),x=p.x+(inPort?scale*.67:0),y=p.y+(inPort?scale*.44:10);")
s=s.replace("sprite(10,x,y+10,Math.max(30,scale*.85),Math.max(28,scale*.78));", "sprite(10,x,y+10,Math.max(26,scale*.67),Math.max(24,scale*.61));")
p.write_text(s,encoding='utf-8')
p=Path('game/sw.js');s=p.read_text(encoding='utf-8').replace('3-201','3-202');p.write_text(s,encoding='utf-8')
