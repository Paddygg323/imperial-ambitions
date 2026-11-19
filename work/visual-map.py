from pathlib import Path
p=Path('game/map.mjs');s=p.read_text();s=s.replace("const icons=", "const icons=")
s=s.replace(" const ctx=canvas.getContext('2d');", " const art=new Image();art.src=new URL('./assets/atlas.png',import.meta.url).href;art.onload=()=>draw();\n const ctx=canvas.getContext('2d');")
s=s.replace('let scale=38','let scale=52').replace('scale=42;draw();','scale=54;draw();')
s=s.replace(' function draw(){', ''' function sprite(index,x,y,width,height=width){if(!art.complete||!art.naturalWidth)return false;const col=index%6,row=Math.floor(index/6);ctx.drawImage(art,col*256,row?595:115,256,row?320:355,x-width/2,y-height,width,height);return true;}
 function detail(t,x,y){
  // Deterministic land texture; it never changes the gameplay tile or resource.
  ctx.save();hex(x,y,scale*.576);ctx.clip();
  for(let j=0;j<22;j++){const a=Math.sin(t.x*71+t.y*37+j*19)*43758.5453,b=Math.sin(t.x*23+t.y*91+j*13)*12587.71;ctx.fillStyle=j%2?'#f5e9ab18':'#203b211a';ctx.fillRect(x+((a-Math.floor(a))-.5)*scale,y+((b-Math.floor(b))-.5)*scale,2,1);}
  ctx.restore();
 }
 function draw(){''')
s=s.replace("ctx.fillStyle='#719da0'","ctx.fillStyle='#416c82'").replace("'#719da0';ctx.fill();","'#416c82';ctx.fill();")
s=s.replace("ctx.strokeStyle='#66755a60'","detail(t,x,y);ctx.strokeStyle='#66755a25'")
a=s.index("    if(t.terrain===13)");b=s.index("    if(t.level)",a)
s=s[:a]+'''    if(t.terrain===13){sprite(9,x,y+scale*.28,scale*.93,scale*.88);}
    else if([7,8].includes(t.terrain)){sprite(7,x,y+scale*.26,scale*.95,scale*.85);if(resource)sprite(11,x+scale*.15,y+scale*.35,scale*.55,scale*.5);}
    else if(resource==='timber'||[12,14].includes(t.terrain)){sprite(6,x,y+scale*.30,scale*.98,scale*.9);}
    else if(resource==='grain'){sprite(8,x,y+scale*.27,scale*.85,scale*.58);}
    else if(resource){
     const symbols={meat:'♉',fish:'≈',wool:'♈',horses:'♞',cotton:'✿',sugarCane:'♧',tobacco:'❧',furs:'♜',spices:'✾',gold:'◆',silver:'◆',gems:'♦',diamonds:'♦',iron:'◆',copper:'◆',tin:'◆',coal:'◆'};
     ctx.font=`${Math.max(15,scale*.39)}px Georgia`;ctx.fillStyle=resource==='gold'?'#cfaa3c':'#3f4d30';ctx.fillText(symbols[resource]??'◆',x,y);
    }
''' + s[b:]
a=s.index('  if(scale>=20)for(const c of s.civilians');b=s.index('  const fleets=',a)
s=s[:a]+'''  if(scale>=20)for(const c of s.civilians.filter(c=>c.owner===s.player)){const t=ix.get(c.tile);if(!t)continue;const {x,y}=screen(t),group=s.civilians.filter(u=>u.owner===s.player&&u.tile===c.tile),i=group.findIndex(u=>u.id===c.id),dx=x+(i-(group.length-1)/2)*22;
   const index=({builder:0,engineer:1,explorer:2,merchant:3,spy:4,railBuilder:1})[c.type]??0;
   ctx.fillStyle='#10231b70';ctx.beginPath();ctx.ellipse(dx,y+5,13,5,0,0,Math.PI*2);ctx.fill();
   sprite(index,dx,y+8,35,52);ctx.fillStyle=c.order?'#d0a448':'#b1ca91';ctx.beginPath();ctx.arc(dx+11,y-34,3,0,Math.PI*2);ctx.fill();
  }
''' +s[b:]
a=s.index("   ctx.fillStyle='#263d48';");b=s.index("   ctx.fillStyle='#fff4d5';",a)
s=s[:a]+"   sprite(10,x,y+10,Math.max(30,scale*.85),Math.max(28,scale*.78));\n"+s[b:]
p.write_text(s,encoding='utf-8')
p=Path('game/sw.js');s=p.read_text().replace('3-199','3-200').replace("const FILES=[", "const FILES=['assets/atlas.png',");p.write_text(s,encoding='utf-8')
p=Path('game/battle-view.css');p.write_text(p.read_text()+'''\n/* Match the campaign's brass and enamel instruments. */
.battle-view{background:#e6d5ac;color:#332d22;font-family:Georgia,serif}.battle-view header{background:linear-gradient(110deg,#142f35,#31595b);border-bottom:3px ridge #b69a58;color:#f2e3b8}.battle-view button{border-radius:2px;border-color:#aa935e;background:linear-gradient(#f8efcf,#d7c295);box-shadow:inset 0 1px #fff6d6}.battle-tools,.battle-actions,.battle-roster{background:#24494e;border-bottom:1px solid #b69a58}.battle-detail{background:linear-gradient(100deg,#f0e3c0,#d5bf91);border-top:3px ridge #b69a58}.battle-view .battle-tile.friendly,.battle-view .battle-tile.hostile{background-image:url('assets/atlas.png');background-size:600% 200%;background-position:100% 0%;background-repeat:no-repeat;text-shadow:0 1px 2px #000;font-weight:bold}.battle-view .battle-tile{border-radius:3px}.battle-board{background:repeating-linear-gradient(17deg,#788365 0px,#788365 9px,#748060 10px,#748060 18px)}
''',encoding='utf-8')
