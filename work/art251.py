from pathlib import Path
p=Path('game/map.mjs');s=p.read_text(encoding='utf8');s="import {drawRoadNetwork} from './landscape-detail.mjs';\n"+s
start=s.index('   if(!atlas&&(t.road||t.rail))')
end=s.index('   if(scale>=20){',start)
s=s[:start]+'''  }
  // Complete the ground before transport and silhouettes, so neighbouring
  // terrain patches never erase a road or the foot of a town.
  if(!atlas)drawRoadNetwork(ctx,s,ix,screen,t=>visible(s,s.player,t),scale);
  for(const t of s.tiles){const {x,y}=screen(t);if(x< -scale||y< -scale||x>w+scale||y>h+scale||!visible(s,s.player,t))continue;
'''+s[end:]
s=s.replace("'#82a842','#98ac4b','#8dab46','#a2b05a','#b0ae57','#7fa345','#90a45b'","'#869c50','#96a65b','#8fa45a','#a1ac67','#b0ad68','#829d55','#90a465'")
s=s.replace("planningCivilian()?'#354b2b55':'#354b2b16'","planningCivilian()?'#354b2b38':'#354b2b0a'")
s=s.replace('drawBiome(ctx,biomes,t.terrain-6,x,y,scale)','drawBiome(ctx,biomes,t.terrain-6,x,y,scale,t.x*31+t.y*17)').replace('drawBiome(ctx,biomes,5,x,y,scale)','drawBiome(ctx,biomes,5,x,y,scale,t.x*31+t.y*17)').replace('drawBiome(ctx,biomes,t.terrain===14?4:3,x,y,scale)','drawBiome(ctx,biomes,t.terrain===14?4:3,x,y,scale,t.x*31+t.y*17)')
p.write_text(s,encoding='utf8')
p=Path('game/landscape-art.mjs');s=p.read_text(encoding='utf8').replace('Math.min(.85,(scale-24)/64)','Math.min(.34,(scale-24)/160)').replace('[.28,.28,.46,.55,.55]','[.23,.25,.38,.45,.48]').replace('mirror(x/2.5)','mirror((x+y*.17)/5.3)').replace('mirror(y/2.5)','mirror((y-x*.13)/5.3)');p.write_text(s,encoding='utf8')
p=Path('game/terrain-art.mjs');s=p.read_text(encoding='utf8').replace('index,x,y,scale){','index,x,y,scale,seed=0){').replace('ctx.save();ctx.globalAlpha=index===0?.85:1;ctx.drawImage(image,','ctx.save();ctx.translate(x,y);ctx.scale(seed%2?-1:1,1);ctx.globalAlpha=index===0?.78:1;ctx.drawImage(image,').replace('x-width/2,y-height*.52,width,height','-width/2,-height*.52,width,height');p.write_text(s,encoding='utf8')
p=Path('game/map-art249.mjs');s=p.read_text(encoding='utf8').replace('ctx.drawImage(image,sx+l',"ctx.save();ctx.fillStyle='#393c2927';ctx.beginPath();ctx.ellipse(x,y+height*.24,width*.47,height*.12,0,0,Math.PI*2);ctx.fill();ctx.restore();ctx.drawImage(image,sx+l");p.write_text(s,encoding='utf8')
