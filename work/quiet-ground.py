from pathlib import Path
p=Path('game/map.mjs');s=p.read_text(encoding='utf-8').replace('if(ground.complete&&ground.naturalWidth){const sx=', 'if(ground.complete&&ground.naturalWidth){ctx.globalAlpha=.24;const sx=');p.write_text(s,encoding='utf-8')
css="\n.military-portrait{width:50px;height:100px;background-size:300px 200px;background-position:calc(var(--unit-col)* -50px) calc(var(--unit-row)* -100px)}\n"
p=Path('game/style.css');p.write_text(p.read_text(encoding='utf-8')+css,encoding='utf-8')
p=Path('game/battle-view.css');p.write_text(p.read_text(encoding='utf-8')+css+'''\n.battle-tile .military-portrait{left:12%;right:auto;bottom:7px;width:76%;height:150%;background-size:600% 200%;background-position:calc(var(--unit-col)*20%) calc(var(--unit-row)*100%)}.battle-roster .military-portrait{width:30px;height:60px;background-size:180px 120px;background-position:calc(var(--unit-col)* -30px) calc(var(--unit-row)* -60px)}.battle-board{background-image:linear-gradient(#9ca980d9,#9ca980d9),url('assets/terrain.png')}
''',encoding='utf-8')
