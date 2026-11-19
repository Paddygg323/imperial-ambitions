from pathlib import Path
p=Path('game/map.mjs');s=p.read_text();s=s.replace(' const terrainCache=new Map();'," const terrainCache=new Map();\n const sites=new Image();sites.src=new URL('./assets/resource-sites.png',import.meta.url).href;sites.onload=()=>draw();")
s=s.replace('function resourceSprite(resource,x,y){const index=', '''function resourceSprite(resource,x,y,factor=1){
  const natural=({grain:0,cotton:1,sugarCane:2,tobacco:3,spices:4,furs:5,iron:6,tin:6,copper:7,coal:8,gold:6,silver:6,gems:6,diamonds:6})[resource];
  if(natural!==undefined&&sites.complete&&sites.naturalWidth){const cw=sites.naturalWidth/3,ch=sites.naturalHeight/3,size=scale*.68*factor;ctx.save();ctx.filter='saturate(.86) contrast(.96)';ctx.drawImage(sites,natural%3*cw,Math.floor(natural/3)*ch,cw,ch,x-size/2,y-size*.43,size,size);ctx.restore();return true;}
  const index=''')
s=s.replace("if(resource)sprite(11,x+scale*.15,y+scale*.35,scale*.55,scale*.5);", "if(resource)resourceSprite(resource,x+scale*.17,y+scale*.23,.65);")
s=s.replace("else if(resource==='grain'){sprite(8,x,y+scale*.27,scale*.69,scale*.46);}", "else if(resource==='grain'){resourceSprite(resource,x,y);}")
p.write_text(s,encoding='utf-8')
p=Path('game/sw.js');s=p.read_text().replace("const FILES=[", "const FILES=['assets/resource-sites.png',");p.write_text(s,encoding='utf-8')
