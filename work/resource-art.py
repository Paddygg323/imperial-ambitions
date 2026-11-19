from pathlib import Path
p=Path('game/map.mjs');s=p.read_text(encoding='utf-8');s=s.replace(" const art=new Image();", " const resources=new Image();resources.src=new URL('./assets/resources.png',import.meta.url).href;resources.onload=()=>draw();\n const art=new Image();")
s=s.replace(' function detail(t,x,y){', ''' function resourceSprite(resource,x,y){const index=({meat:0,wool:1,horses:2,cotton:3,sugarCane:4,tobacco:5,spices:6,furs:7,iron:8,tin:8,copper:9,coal:10,fish:11})[resource];if(index===undefined||!resources.complete||!resources.naturalWidth)return false;ctx.drawImage(resources,index%6*256,Math.floor(index/6)*512+140,256,300,x-scale*.36,y-scale*.35,scale*.72,scale*.66);return true;}
 function detail(t,x,y){''')
s=s.replace("    else if(resource){\n", "    else if(resource&&!resourceSprite(resource,x,y)){\n")
p.write_text(s,encoding='utf-8')
p=Path('game/sw.js');s=p.read_text(encoding='utf-8').replace("'assets/atlas.png',","'assets/atlas.png','assets/resources.png',");p.write_text(s,encoding='utf-8')
