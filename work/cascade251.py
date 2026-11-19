from pathlib import Path
p=Path('game/royal.css');s=p.read_text(encoding='utf8');start=s.index('.battle-cell{');end=s.index('/* Compact landscape',start)
s=s[:start]+'''.battle-cell path{fill:inherit;stroke:inherit;stroke-width:inherit}
.battle-tile .military-portrait{filter:saturate(1.06)}
.battle-tile>small{position:relative;background:#39492488;border-radius:2px;padding:1px 3px}
.battle-tile.terrain-4 .battle-cell{fill:#505548d0}.battle-tile.terrain-5 .battle-cell{stroke-dasharray:3 3}
.battle-tile.wall .battle-cell{fill:#93866b;stroke:#e4d4ab;stroke-width:2}.battle-tile.breach .battle-cell{fill:#8c795840;stroke:#ddd1a2;stroke-dasharray:4 3}
.battle-tile .wall-label{font:10px Georgia;text-shadow:0 1px #000}.battle-board .battle-tile:focus-visible .battle-cell{stroke:#fff5bc;stroke-width:3}
@media(prefers-reduced-motion:no-preference){.battle-tile.selected .battle-cell{animation:battle-selection 1.8s ease-in-out infinite}@keyframes battle-selection{50%{filter:drop-shadow(0 0 3px #ffdf8c)}}}
'''+s[end:];p.write_text(s,encoding='utf8')
p=Path('game/test/art251-browser.mjs');s=p.read_text(encoding='utf8').replace("document.querySelectorAll('link[rel=stylesheet]').forEach(n=>n.remove());const css=document.createElement('link');css.rel='stylesheet';css.href='./battle-view.css';document.head.append(css);",'');s=s.replace("assert.equal(await page.evaluate(()=>JSON.stringify(battleView.getState())===window.battleBefore),true);", "assert.equal(await page.evaluate(()=>JSON.stringify(battleView.getState())===window.battleBefore),true);\nassert.equal(await page.locator('.battle-tile.friendly:not(.selected) .battle-cell path').first().evaluate(el=>getComputedStyle(el).fill),'rgba(0, 0, 0, 0)');");p.write_text(s,encoding='utf8')
