from pathlib import Path
p=Path('game/military-art.mjs');s=p.read_text(encoding='utf8');s="import {ARMY} from './rules.mjs';\n"+s
s+='''
// Small painted formations share the actual regiment's portrait. Numbers of
// figures are an illustration convention, never a troop-count simulation.
export function battleFormation(type){
 const category=ARMY[type]?.category??0;
 const positions=category>=8||category===4?[[50,52,82]]:category>=5?[[35,39,61],[65,58,61]]:[[35,34,47],[66,42,47],[48,66,47]];
 return `<span class="battle-formation formation-${category}" aria-hidden="true">${positions.map(([x,y,size])=>`<span class="formation-figure" style="left:${x}%;top:${y}%;width:${size}%;height:${size}%">${militaryPortrait(type)}</span>`).join('')}</span>`;
}
''';p.write_text(s,encoding='utf8')
p=Path('game/battle-view.mjs');s=p.read_text(encoding='utf8').replace("import {militaryPortrait}","import {militaryPortrait,battleFormation}")
s=s.replace('selected=null,size=48','selected=null,size=64').replace("?48:20","?64:20").replace("size=48;render()","size=64;render()")
s=s.replace("${occupant?`${militaryPortrait(occupant.type)}", "${occupant?`${battleFormation(occupant.type)}<span class=\"battle-pennant\" aria-hidden=\"true\"></span>")
s=s.replace('class="battle-board" style=', 'class="battle-board ${size<48?\'overview\':\'local\'}" style=')
p.write_text(s,encoding='utf8')
