from pathlib import Path
p=Path('game/style.css');s=p.read_text(encoding='utf-8');s += '\n.civilian-portrait{width:64px;height:90px;background-size:384px 256px;background-position:calc(var(--portrait)* -64px) -28px}\n';p.write_text(s,encoding='utf-8')
