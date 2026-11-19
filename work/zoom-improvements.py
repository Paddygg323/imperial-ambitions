from pathlib import Path
p=Path('game/map.mjs');s=p.read_text(encoding='utf-8');a=s.index(' function fit(){');b=s.index(' function hex(',a)
s=s[:a]+''' function fitTiles(tiles){if(!tiles.length)return;const xs=tiles.map(t=>point(t).x),ys=tiles.map(t=>point(t).y);cx=(Math.min(...xs)+Math.max(...xs))/2;cy=(Math.min(...ys)+Math.max(...ys))/2;scale=Math.min(110,(w-28)/(Math.max(...xs)-Math.min(...xs)+2),(h-90)/(Math.max(...ys)-Math.min(...ys)+2));draw();}
 function fit(){fitTiles(getState().tiles);}
 function fitNation(){const s=getState();fitTiles(s.tiles.filter(t=>t.owner===s.player));}
 function zoomAt(f,x=w/2,y=h/2){const old=scale,next=Math.max(2,Math.min(110,scale*f));cx+=(x-w/2)*(1/old-1/next);cy+=(y-h/2)*(1/old-1/next);scale=next;draw();}
''' +s[b:]
s=s.replace('detail(t,x,y);hex','if(scale>=20)detail(t,x,y);hex')
s=s.replace('if(scale>=12)for(const p of s.provinces){','if(scale>=12)for(const p of s.provinces){if(scale<26&&!p.capital)continue;')
s=s.replace('sprite(index,dx,y+8,35,52);', 'sprite(index,dx,y+8,Math.min(45,scale*.65),Math.min(67,scale*.96));')
s=s.replace("   sprite(10,x,y+10,", "   if(scale<20){ctx.fillStyle=s.nations[s.player].color;ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill();continue;}\n   sprite(10,x,y+10,")
old="if(pinch>0)scale=Math.max(5,Math.min(85,scale*d/pinch));pinch=d;dragged=true;"
new="if(pinch>0){const r=canvas.getBoundingClientRect();zoomAt(d/pinch,(a.x+b.x)/2-r.left,(a.y+b.y)/2-r.top);}pinch=d;dragged=true;"
assert old in s;s=s.replace(old,new)
s=s.replace("scale=Math.max(5,Math.min(85,scale*(e.deltaY>0?.9:1.1)));draw();", "const r=canvas.getBoundingClientRect();zoomAt(e.deltaY>0?.9:1.1,e.clientX-r.left,e.clientY-r.top);")
s=s.replace('return {draw,focus,fit,focusSea', 'return {draw,focus,fit,fitNation,focusSea')
s=s.replace('zoom(f){scale=Math.max(5,Math.min(85,scale*f));draw();}', 'zoom(f){zoomAt(f);}');p.write_text(s,encoding='utf-8')
p=Path('game/index.html');s=p.read_text(encoding='utf-8').replace('<button id="strategic">World</button>', '<button id="nationView" aria-label="Show your whole nation">Nation</button><button id="strategic">World</button>');p.write_text(s,encoding='utf-8')
p=Path('game/app.mjs');s=p.read_text(encoding='utf-8').replace("$('strategic').onclick=()=>map.fit();", "$('strategic').onclick=()=>map.fit();$('nationView').onclick=()=>map.fitNation();");p.write_text(s,encoding='utf-8')
p=Path('game/style.css');p.write_text(p.read_text(encoding='utf-8')+'\n.map-controls button{min-height:44px}.map-controls{max-width:calc(100% - 16px)}@media(max-width:360px){.map-controls button{padding:5px 8px;font-size:12px}}\n',encoding='utf-8')
