from pathlib import Path
p=Path('game/map.mjs');s=p.read_text(encoding='utf-8-sig')
s="import {TERRAIN_SURFACES,groundPatterns,drawBiome} from './terrain-art.mjs';\n"+s
s=s.replace('desertPattern=null;','desertPattern=null,groundPaint=null;',1)
pos=" const oceanArt=new Image();"
s=s.replace(pos," const groundArt=new Image();groundArt.src=new URL('./assets/royal-ground.png',import.meta.url).href;groundArt.onload=()=>{groundPaint=null;draw();};\n const biomes=new Image();biomes.src=new URL('./assets/royal-biomes.png',import.meta.url).href;biomes.onload=()=>draw();\n"+pos)
a=s.index('  const terrainIndex=');b=s.index('  ctx.restore();',a)
s=s[:a]+'''  const family=TERRAIN_SURFACES[t.terrain];
  if(family===4&&desert.complete&&desert.naturalWidth){
   desertPattern??=ctx.createPattern(desert,'repeat');
   desertPattern.setTransform(new DOMMatrix().translate(w/2-cx*scale,h/2-cy*scale).scale(scale*5/desert.naturalWidth));
   ctx.globalAlpha=.55;ctx.fillStyle=desertPattern;ctx.fill();
  }else if(groundArt.complete&&groundArt.naturalWidth){
   groundPaint??=groundPatterns(ctx,groundArt);const pattern=groundPaint[family];
   pattern.setTransform(new DOMMatrix().translate(w/2-cx*scale,h/2-cy*scale).scale(scale*5/groundArt.naturalWidth));
   ctx.globalAlpha=family===2?.46:family===3?.4:.28;ctx.fillStyle=pattern;ctx.fill();
  }
'''+s[b:]
a=s.index('    if([6,7,8].includes(t.terrain)');b=s.index('    if(t.terrain===13)',a)
s=s[:a]+'''    if([6,7,8].includes(t.terrain))drawBiome(ctx,biomes,t.terrain-6,x,y,scale);
    if(t.terrain===9)drawBiome(ctx,biomes,5,x,y,scale);
'''+s[b:]
a=s.index("    else if(resource==='timber'||[12,14].includes(t.terrain))");b=s.index("    else if(resource==='grain')",a)
s=s[:a]+"    else if(resource==='timber'||[12,14].includes(t.terrain)){drawBiome(ctx,biomes,t.terrain===14?4:3,x,y,scale);}\n"+s[b:]
# Remove obsolete terrain textures from the active renderer.
s='\n'.join(l for l in s.split('\n') if not any(token in l for token in ['const meadow=new Image();','const ground=new Image();','const relief=new Image();']))
p.write_text(s,encoding='utf-8')
p=Path('game/sw.js');s=p.read_text().replace('3-246','3-247');s=s.replace("FILES.push(...TRADE_FILES", "FILES.push('terrain-art.mjs','assets/royal-ground.png','assets/royal-biomes.png');\nFILES.push(...TRADE_FILES");p.write_text(s)
p=Path('android/src/main/AndroidManifest.xml');p.write_text(p.read_text().replace('versionCode="246"','versionCode="247"').replace('0.2.46-dev','0.2.47-dev'))
