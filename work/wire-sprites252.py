from pathlib import Path
import json
r=Path(__file__).resolve().parents[1];p=r/'game/map.mjs';s=p.read_text(encoding='utf-8')
s="import {createReviewedSprites,reviewedSpriteKey,ownsResourceArtwork,ownsDevelopmentArtwork} from './reviewed-sprites.mjs';\n"+s
s=s.replace(' const terrainCache=new Map();'," const reviewed=createReviewedSprites(()=>{terrainCache.clear();draw();});\n const terrainCache=new Map();")
old=' function detail(t,x,y,s,ix){'
s=s.replace(old,old+"\n  const keyArt=reviewedSpriteKey(t,prospected(s,s.player,t)?t.resource:null);\n  if(reviewed.tiles.has(keyArt)){ctx.save();hex(x,y,scale*.579);ctx.clip();ctx.fillStyle='#7f9b27';ctx.fill();reviewed.draw(ctx,'001-default',x,y,scale);reviewed.draw(ctx,keyArt,x,y,scale);ctx.restore();return;}\n")
s=s.replace("    if(resource!=='grain')drawCultivation", "    const reviewedTile=reviewed.tiles.has(reviewedSpriteKey(t,resource));\n    if(!reviewedTile&&resource!=='grain')drawCultivation")
s=s.replace('    if(t.terrain===8)drawRural', '    if(!reviewedTile){if(t.terrain===8)drawRural')
s=s.replace("    if(t.terrain===9)drawBiome(ctx,biomes,5,x,y,scale,t.x*31+t.y*17);", "    if(t.terrain===9)drawBiome(ctx,biomes,5,x,y,scale,t.x*31+t.y*17);}")
s=s.replace("    else if([7,8].includes(t.terrain))", "    else if(reviewedTile&&ownsResourceArtwork(resource)){}\n    else if([7,8].includes(t.terrain))")
s=s.replace("    drawDevelopment(ctx,development,t,resource,x,y,scale,overseasDevelopment);", "    if(!reviewedTile||!ownsDevelopmentArtwork(resource))drawDevelopment(ctx,development,t,resource,x,y,scale,overseasDevelopment);")
# Don't repaint supplied forests with the legacy atlas if they have no delivery resource.
s=s.replace("else if(resource==='timber'||[12,14].includes(t.terrain)){drawBiome", "else if(!reviewedTile&&(resource==='timber'||[12,14].includes(t.terrain))){drawBiome")
p.write_text(s,encoding='utf-8')
p=r/'game/sw.js';s=p.read_text(encoding='utf-8').replace('rebuild-3-251','rebuild-3-252')
assets=['reviewed-sprites.mjs','reviewed-sprite-data.mjs']+['assets/reviewed/'+p.name for p in (r/'game/assets/reviewed').glob('*.png')]
s=s.replace("self.addEventListener('install'",'FILES.push(...'+json.dumps(assets)+");\nself.addEventListener('install'")
p.write_text(s,encoding='utf-8')
p=r/'android/src/main/AndroidManifest.xml';s=p.read_text(encoding='utf-8').replace('versionCode="251"','versionCode="252"').replace('0.2.51','0.2.52');p.write_text(s,encoding='utf-8')
