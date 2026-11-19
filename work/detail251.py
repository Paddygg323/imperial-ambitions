from pathlib import Path
p=Path('game/battle-view.mjs');s=p.read_text(encoding='utf8').replace("{ARMY,nameOf}","{ARMY,NATIONS,nameOf}").replace('onFinish=()=>{},automated=false','onFinish=()=>{},automated=false,nationColors={}')
s=s.replace('   const canAttack=', "   const nationColor=nationColors[occupant?.owner]??NATIONS.find(n=>n[0]===occupant?.owner)?.[2]??'#b8a878';\n   const safeColor=/^#[0-9a-f]{3,8}$/i.test(nationColor)?nationColor:'#b8a878';\n   const canAttack=")
s=s.replace('--ground-tone:${(tile*17%7)/100}', '--ground-tone:${(tile*17%7)/100};--nation-color:${safeColor}')
s=s.replace("${occupant?(isOwn?'friendly':'hostile'):''}","${occupant?(isOwn?'friendly':'hostile'):''} ${occupant?.done?'spent':''} ${occupant?.state===1?'broken':''}")
p.write_text(s,encoding='utf8')
p=Path('game/app.mjs');s=p.read_text(encoding='utf8').replace("{battle:b,player:automated?b.attacker:state.player,automated,","{battle:b,player:automated?b.attacker:state.player,automated,nationColors:Object.fromEntries(Object.entries({...state.minors,...state.nations}).map(([id,n])=>[id,n.color])),");p.write_text(s,encoding='utf8')
p=Path('game/map-art249.mjs');s=p.read_text(encoding='utf8').replace('height=width*bh/bw','height=width*bh/bw*(1+Math.max(0,fort-1)*.085)');s=s.replace('ctx.restore();ctx.drawImage(image,sx+l,sy+top,bw,bh,x-width/2,y-height*.62,width,height);','ctx.restore();ctx.save();ctx.translate(x,y);ctx.scale(((t.x??0)*7+(t.y??0))%2?-1:1,1);ctx.drawImage(image,sx+l,sy+top,bw,bh,-width/2,-height*.62,width,height);ctx.restore();');p.write_text(s,encoding='utf8')
p=Path('game/battle-view.css');s=p.read_text(encoding='utf8');s+='''
/* Painted battlefield: units stand on the landscape, not coloured cards. */
.battle-board{background-color:#8b9a65;background-image:linear-gradient(#8895558c,#a1a56a70),url('assets/royal-ground.png');background-size:auto,1100px 1100px}
.battle-view .battle-tile{border:0;background:transparent;box-shadow:none;isolation:isolate}
.battle-cell{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible;z-index:0;fill:transparent;stroke:#35452b30;stroke-width:.7}
.battle-view .battle-tile.friendly,.battle-view .battle-tile.hostile{border:0;background:none;box-shadow:none}
.battle-view .battle-tile.reachable:not(.friendly):not(.hostile){background:none}
.battle-tile.reachable .battle-cell{fill:#a4d3d633;stroke:#c9e4d578;stroke-width:1.3}
.battle-view .battle-tile.selected{box-shadow:none}
.battle-tile.selected .battle-cell{fill:#ffe29a20;stroke:#ffe6a4;stroke-width:3}
.battle-view .battle-tile.target{outline:none}
.battle-tile.target .battle-cell{stroke:#f3c16e;stroke-width:3;stroke-dasharray:7 3}
.battle-formation{position:absolute;inset:0 0 9px;pointer-events:none;z-index:2;filter:drop-shadow(1px 2px 1px #26311e65)}
.battle-formation::before{content:'';position:absolute;left:12%;right:12%;bottom:9%;height:17%;background:#39452635;border-radius:50%;filter:blur(2px)}
.formation-figure{position:absolute;transform:translate(-50%,-50%)}
.battle-tile .formation-figure .military-portrait{inset:0;width:100%;height:100%}
.battle-pennant{position:absolute;right:5%;top:3%;width:19%;height:19%;background:var(--nation-color);border:1px solid #f3dfaa;clip-path:polygon(0 0,100% 0,78% 50%,100% 100%,0 100%);z-index:4;filter:drop-shadow(0 1px 1px #000)}
.battle-tile.spent .battle-formation{opacity:.7;filter:saturate(.6)}
.battle-tile.broken .battle-pennant{transform:rotate(20deg)}
.battle-tile .unit-caption{position:absolute;bottom:5px;margin:0;background:#233122b8;font:8px Georgia,serif;padding:0 3px;border-radius:2px;line-height:10px}
.battle-tile i{height:3px;width:65%;bottom:1px;border-radius:1px;box-shadow:0 1px 1px #293623}
.battle-view .battle-tile.terrain-1:not(.friendly):not(.hostile),.battle-view .battle-tile.terrain-2:not(.friendly):not(.hostile){background:none}
.battle-tile.terrain-1 .battle-cell{fill:#3b542d28}.battle-tile.terrain-2 .battle-cell{fill:#293e2a38}.battle-tile.terrain-3 .battle-cell{fill:#c0b17c30}
.battle-board.overview .unit-caption{display:none}.battle-board.overview .battle-formation{bottom:3px}.battle-board.overview .battle-tile i{height:2px}
.battle-view .battle-tile.wall:not(.friendly):not(.hostile){background:repeating-linear-gradient(0deg,#aaa083 0 6px,#766f5d 7px 8px);border:2px ridge #d7c8a0;box-shadow:2px 3px 2px #3b40294d}
''';p.write_text(s,encoding='utf8')
