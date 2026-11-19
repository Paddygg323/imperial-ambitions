from pathlib import Path
p=Path('game/map.mjs');s=p.read_text(encoding='utf-8-sig')
s="import {surfaceSites,surfacePatch,readSurfaceTextures,seaTextureStrength,drawTown} from './landscape-art.mjs';\n"+s
s=s.replace('groundPaint=null;','groundPaint=null,surfaceTextures=null;',1)
s=s.replace("groundArt.onload=()=>{groundPaint=null;draw();}","groundArt.onload=()=>{surfaceTextures=null;terrainCache.clear();draw();}")
s=s.replace("desert.onload=()=>{desertPattern=null;draw();}","desert.onload=()=>{surfaceTextures=null;terrainCache.clear();draw();}")
s=s.replace(" const biomes=new Image();"," const townArt=new Image();townArt.src=new URL('./assets/royal-towns.png',import.meta.url).href;townArt.onload=()=>draw();\n const biomes=new Image();")
a=s.index(' function detail(');b=s.index(' function constrainCamera()',a)
s=s[:a]+''' function detail(t,x,y,s,ix){
  const ids=new Set([t.id,...neighbourIds(t)]);for(const id of [...ids]){const q=ix.get(id);if(q)for(const next of neighbourIds(q))ids.add(next);}
  const tiles=[...ids].map(id=>ix.get(id)).filter(q=>q&&visible(s,s.player,q));
  const key=tiles.map(q=>q.id+':'+q.terrain).join('|');let patch=terrainCache.get(key);
  if(!surfaceTextures&&groundArt.complete&&groundArt.naturalWidth&&desert.complete&&desert.naturalWidth)surfaceTextures=readSurfaceTextures(groundArt,desert);
  if(!patch){const pixels=surfacePatch(point(t),surfaceSites(tiles,colors),surfaceTextures??[]);patch=document.createElement('canvas');patch.width=patch.height=pixels.size;patch.getContext('2d').putImageData(new ImageData(pixels.data,pixels.size,pixels.size),0,0);terrainCache.set(key,patch);if(terrainCache.size>2000)terrainCache.delete(terrainCache.keys().next().value);}
  ctx.save();hex(x,y,scale*.579);ctx.clip();ctx.drawImage(patch,x-scale*.6,y-scale*.6,scale*1.2,scale*1.2);ctx.restore();
 }
'''+s[b:]
s=s.replace("if(t.terrain===13){sprite(9,x,y+scale*.38,scale*1.02,scale*.97);}","if(t.terrain===13){drawTown(ctx,townArt,s,t,x,y,scale);}")
s=s.replace("ctx.strokeStyle='#354b2b88';ctx.lineWidth=scale>=66?1.1:.75;","ctx.strokeStyle=planningCivilian()?'#354b2b55':'#354b2b16';ctx.lineWidth=scale>=66?.65:.4;")
s=s.replace("ctx.fill();if(z.id===selected)","ctx.fill();if(!atlas&&!frontier){ctx.globalAlpha=1-seaTextureStrength(scale);ctx.fillStyle='#28628a';ctx.fill();ctx.globalAlpha=1;}if(z.id===selected)")
p.write_text(s)
p=Path('game/sw.js');s=p.read_text().replace('3-247','3-248').replace("FILES.push('terrain-art.mjs'","FILES.push('landscape-art.mjs','assets/royal-towns.png','terrain-art.mjs'");p.write_text(s)
p=Path('android/src/main/AndroidManifest.xml');p.write_text(p.read_text().replace('versionCode="247"','versionCode="248"').replace('0.2.47-dev','0.2.48-dev'))
p=Path('game/app.mjs');s=p.read_text().replace("${t.townLevel?'Large town':'Town'}", "${t.townLevel||Object.values(state.nations).some(n=>n.capital===t.id)?'Large town':'Small town'}");p.write_text(s)
