from pathlib import Path
p=Path('game/test/battle-theme-browser.mjs');s=p.read_text(encoding='utf8').replace("const css=document.createElement('link');css.rel='stylesheet';css.href='./battle-view.css';document.head.append(css);",'');p.write_text(s,encoding='utf8')
