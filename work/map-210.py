from pathlib import Path
import json
root=Path('.')
strings=json.loads(Path('work/rebuild/strings.json').read_text(encoding='utf-8'))
words=[strings[str(k)] for k in range(40001,40038)]
Path('game/data/sea-name-words.mjs').write_text('// Original English sea-name vocabulary, string resources40001–40037.\nexport default '+json.dumps(words)+';\n',encoding='utf-8')
p=Path('game/map-markers.mjs');s=p.read_text();s="import seaWords from './data/sea-name-words.mjs';\n"+s;a=s.index(' if(state.provinces.some');b=s.index('\n}\nexport function drawTent',a)
s=s[:a]+''' // Reuse the original naming vocabulary and templates (strings39941–39956).
 // Stable assignment for rebuild saves; not a claim of native random-sequence parity.
 const index=Math.max(0,Number(zone.id.replace('sea',''))||0);
 const word=seaWords[index%seaWords.length];
 const forms=[w=>`${w} Sea`,w=>`${w} Ocean`,w=>`Gulf of ${w}`,w=>`${w} Bay`,w=>`${w} Channel`];
 return forms[Math.floor(index/seaWords.length)%forms.length](word);'''+s[b:];p.write_text(s,encoding='utf-8')
p=Path('game/map.mjs');s=p.read_text();s=s.replace('Math.min(32,scale*.55)','Math.min(18,scale*.30)')
# Per-cell visibility, not any eastern cell making the entire cross-edge region visible.
s=s.replace("for(const id of z.cells){const [tx,ty]=id.split(',').map(Number);const p=screen", "for(const id of z.cells){const [tx,ty]=id.split(',').map(Number);if(tx<60&&!seen.has(z.id))continue;const p=screen")
s=s.replace("const candidates=z.cells.map(id=>", "const candidates=z.cells.filter(id=>Number(id.split(',')[0])>=60||seen.has(z.id)).map(id=>")
s=s.replace("seaLabels.push({name:seaName(s,z),x:p.x,y:p.y-22});", "if(p.x>=0&&p.x<=w&&p.y>=0&&p.y<=h&&(tx>=60||seen.has(z.id)))seaLabels.push({name:seaName(s,z),x:p.x,y:p.y-22});")
# Distinguish unexplored world from water, with a visible chart boundary.
s=s.replace('ctx.fillStyle=ocean;ctx.fillRect(0,0,w,h);',"ctx.fillStyle='#1e343d';ctx.fillRect(0,0,w,h);const chart=screen({x:0,y:0});ctx.fillStyle='#8f9d97';ctx.fillRect(chart.x-scale*.6,chart.y-scale*.6,109*scale,61*.866*scale);")
s=s.replace("if(z.id===selected){hex", "hex(p.x,p.y,scale*.58);ctx.fillStyle=ocean;ctx.fill();if(z.id===selected){hex")
# Camera remains a bounded chart, never an endless blue plane.
s=s.replace(' function draw(){', ''' function constrainCamera(){
  const min=Math.min(w/110,h/54);scale=Math.max(min,scale);
  const halfX=w/(2*scale),halfY=h/(2*scale);
  cx=halfX>54?53.5:Math.max(halfX-.6,Math.min(107.6-halfX,cx));
  cy=halfY>26?25.5:Math.max(halfY-.6,Math.min(52.2-halfY,cy));
 }
 function draw(){''')
s=s.replace('if(!w||!h)return;const s=', 'if(!w||!h)return;constrainCamera();const s=')
p.write_text(s,encoding='utf-8')
p=Path('game/sw.js');s=p.read_text().replace('imperialism-rebuild-3-209','imperialism-rebuild-3-210').replace("const FILES=[", "const FILES=['data/sea-name-words.mjs',");p.write_text(s,encoding='utf-8')
