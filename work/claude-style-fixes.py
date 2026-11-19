from pathlib import Path
import re
p=Path('game/style.css');s=p.read_text(encoding='utf-8')
s=re.sub(r'(?<![\w-])\.civilian-portrait\{[^}]*\}', '',s)
s=re.sub(r'(?<![\w-])\.military-portrait\{[^}]*\}', '',s)
s+='''
.civilian-portrait{display:inline-block;width:64px;height:90px;flex:none;background:url('assets/atlas.png') no-repeat;background-size:384px 256px;background-position:calc(var(--portrait)* -64px) -28px;pointer-events:none}
.military-portrait{display:inline-block;flex:none;width:50px;height:100px;background:url('assets/military.png') no-repeat;background-size:300px 200px;background-position:calc(var(--unit-col)* -50px) calc(var(--unit-row)* -100px);pointer-events:none}
.ship-portrait{display:block;width:70px;height:80px;float:left;margin:0 10px 5px 0;background:url('assets/atlas.png') no-repeat;background-size:420px 280px;background-position:-280px -157px;pointer-events:none}.fleet-card::after{content:'';display:block;clear:both}.fleet-card{font:12px/1.5 system-ui}.fleet-card>button[data-action=selectShip]{font:600 15px Georgia,serif}
''';p.write_text(s,encoding='utf-8')
p=Path('game/app.mjs');s=p.read_text(encoding='utf-8').replace('for(const ship of ships)html+=`<div class="card">', 'for(const ship of ships)html+=`<div class="card fleet-card"><span class="ship-portrait" aria-hidden="true"></span>');p.write_text(s,encoding='utf-8')
