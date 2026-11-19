from pathlib import Path
p=Path('game/map-markers.mjs');s=p.read_text().replace("ctx.restore();ctx.fillStyle='#263c32';ctx.fillRect(x-9,y+size*.4,18,12);ctx.fillStyle='#fff0ca';ctx.font='10px Georgia';ctx.textAlign='center';ctx.fillText(String(count),x,y+size*.4+6);", "ctx.restore();ctx.fillStyle='#eee3bc';ctx.strokeStyle='#394334';ctx.lineWidth=2;ctx.font='9px Georgia';ctx.textAlign='center';ctx.strokeText(String(count),x,y+size*.4+6);ctx.fillText(String(count),x,y+size*.4+6);");p.write_text(s,encoding='utf-8')
p=Path('game/map.mjs');s=p.read_text();marker='  for(const t of s.tiles){const {x,y}=screen(t);'
insert='''  // Quiet coastal shallows outside the shore, without exposing unseen land.
  ctx.save();ctx.lineCap='round';
  for(const t of s.tiles){if(!visible(s,s.player,t))continue;const p=screen(t);if(p.x< -scale||p.x>w+scale||p.y< -scale||p.y>h+scale)continue;
   for(let d=0;d<6;d++){const id=riverNeighbor(t,d);if(!id||ix.has(id))continue;const [tx,ty]=id.split(',').map(Number),q=screen({x:tx,y:ty}),dx=q.x-p.x,dy=q.y-p.y,len=Math.hypot(dx,dy),mx=(p.x+q.x)/2,my=(p.y+q.y)/2;
    ctx.beginPath();ctx.moveTo(mx-dy/len*scale*.29,my+dx/len*scale*.29);ctx.lineTo(mx+dy/len*scale*.29,my-dx/len*scale*.29);ctx.strokeStyle='#78958a40';ctx.lineWidth=Math.max(2,scale*.17);ctx.stroke();ctx.strokeStyle='#9eaf9650';ctx.lineWidth=Math.max(1,scale*.075);ctx.stroke();}
  }ctx.restore();
'''
assert marker in s;s=s.replace(marker,insert+marker,1)
p.write_text(s,encoding='utf-8')
