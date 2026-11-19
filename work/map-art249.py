from pathlib import Path
p=Path('game/map.mjs');s=p.read_text(encoding='utf-8-sig');s="import {drawFortifiedTown,drawRural} from './map-art249.mjs';\n"+s
s=s.replace("'./assets/royal-towns.png'","'./assets/towns-forts.png'")
s=s.replace(' const townArt=new Image();'," const ruralArt=new Image();ruralArt.src=new URL('./assets/rural-landscape.png',import.meta.url).href;ruralArt.onload=()=>draw();\n const townArt=new Image();")
s=s.replace(' function resourceSprite(resource,x,y,factor=1){'," function resourceSprite(resource,x,y,factor=1){\n  if(resource==='meat'||resource==='grain')return drawRural(ctx,ruralArt,resource==='meat'?0:1,x,y,scale*factor);")
s=s.replace('    drawCultivation(ctx,t,resource,x,y,scale);',"    if(resource!=='grain')drawCultivation(ctx,t,resource,x,y,scale);")
s=s.replace('if([6,7,8].includes(t.terrain))drawBiome(ctx,biomes,t.terrain-6,x,y,scale);',"if(t.terrain===8)drawRural(ctx,ruralArt,3,x,y,scale);else if([6,7].includes(t.terrain))drawBiome(ctx,biomes,t.terrain-6,x,y,scale);")
s=s.replace('drawTown(ctx,townArt,s,t,x,y,scale)','drawFortifiedTown(ctx,townArt,s,t,x,y,scale)')
s=s.replace("else if(resource==='grain'){if(t.level<1)resourceSprite(resource,x,y);}","else if(resource==='grain'){drawRural(ctx,ruralArt,t.level>0?2:1,x,y,scale);}")
p.write_text(s,encoding='utf-8')
p=Path('game/sw.js');s=p.read_text().replace('3-248','3-249').replace("FILES.push('landscape-art.mjs'","FILES.push('map-art249.mjs','assets/towns-forts.png','assets/rural-landscape.png','landscape-art.mjs'");p.write_text(s,encoding='utf-8')
p=Path('android/src/main/AndroidManifest.xml');p.write_text(p.read_text().replace('versionCode="248"','versionCode="249"').replace('0.2.48-dev','0.2.49-dev'),encoding='utf-8')
