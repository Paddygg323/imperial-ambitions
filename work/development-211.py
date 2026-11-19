from pathlib import Path
p=Path('game/map.mjs');s=p.read_text();s="import {drawCultivation,drawDevelopment} from './development-art.mjs';\n"+s;s=s.replace(' const terrainCache=new Map();'," const terrainCache=new Map();\n const development=new Image();development.src=new URL('./assets/development.png',import.meta.url).href;development.onload=()=>draw();")
s=s.replace("const resource=prospected(s,s.player,t)?t.resource:null;", "const resource=prospected(s,s.player,t)?t.resource:null;\n    drawCultivation(ctx,t,resource,x,y,scale);")
a=s.index('    if(t.level){ctx.fillStyle=');b=s.index('\n',a);s=s[:a]+"    drawDevelopment(ctx,development,t,resource,x,y,scale);"+s[b:]
p.write_text(s,encoding='utf-8')
p=Path('game/index.html');s=p.read_text().replace('Drag to pan · pinch to zoom · tap tiles or units','Drag to pan · pinch to zoom · grey chart is unexplored');p.write_text(s,encoding='utf-8')
p=Path('game/sw.js');s=p.read_text().replace('imperialism-rebuild-3-210','imperialism-rebuild-3-211').replace('const FILES=[',"const FILES=['development-art.mjs','assets/development.png',");p.write_text(s,encoding='utf-8')
