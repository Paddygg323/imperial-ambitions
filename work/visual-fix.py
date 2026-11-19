from pathlib import Path
p=Path('game/map.mjs');s=p.read_text(encoding='utf-8').replace("symbols[resource]??'◆'","(symbols[resource]??'◆')+'\\uFE0E'");p.write_text(s,encoding='utf-8')
p=Path('game/style.css');s=p.read_text(encoding='utf-8');s=s.replace("content:'⚒'","content:'⚒\\FE0E'").replace("content:'⚙'","content:'⚙\\FE0E'").replace("content:'⚖'","content:'⚖\\FE0E'").replace("content:'⚔'","content:'⚔\\FE0E'").replace("content:'⚓'","content:'⚓\\FE0E'").replace("content:'⚜'","content:'⚜\\FE0E'");p.write_text(s,encoding='utf-8')

