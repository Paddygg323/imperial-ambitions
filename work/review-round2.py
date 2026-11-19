from pathlib import Path
p=Path('game/map.mjs');s=p.read_text(encoding='utf-8');a=s.index('  if(scale>=12)for(const p of s.provinces)');b=s.index('  if(scale>=20)for(const c of s.civilians',a);labels=s[a:b];s=s[:a]+s[b:];needle=' }\n let pointers=';assert needle in s;s=s.replace(needle,labels+' }\n let pointers=',1)
s=s.replace("ctx.fillStyle='#243936';ctx.fillRect(a.x-scale,a.y-scale,b.x-a.x+scale,b.y-a.y+scale*2);", "const fog=ctx.createLinearGradient(a.x,a.y,b.x,b.y);fog.addColorStop(0,'#456575');fog.addColorStop(1,'#344f60');ctx.fillStyle=fog;ctx.fillRect(a.x-scale,a.y-scale,b.x-a.x+scale,b.y-a.y+scale*2);")
p.write_text(s,encoding='utf-8')
