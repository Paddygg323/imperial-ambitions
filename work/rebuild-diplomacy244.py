from pathlib import Path
import shutil
root=Path(__file__).resolve().parents[1]
backup=root/'work/diplomacy244-before';backup.mkdir(exist_ok=True)
for name in ['app.mjs','diplomacy-map.mjs','royal.css','sw.js','engine.mjs','diplomacy.mjs','land-attack.mjs']:
 p=root/'game'/name
 if not (backup/name).exists():shutil.copy2(p,backup/name)
p=root/'game/diplomacy-map.mjs';s=p.read_text()
s=s.replace("import {strategicRegimentRating,strategicNavyRating} from './strategic-strength.mjs';", "import {campaignFavouredPartner} from './campaign-external-resources.mjs';")
s=s.replace("export function diplomacyMap(s,selected,region='world'){", "export function diplomacyMap(s,selected,region='world',options={}){")
s=s.replace("let html=relationsLedger(s,selected,countries)+'<section class=\"diplomacy-atlas\"><div class=\"atlas-heading\"><span>THE WORLD & ITS POWERS</span><small>Select a country on the chart</small></div><div class=\"atlas-tabs\">';", "let html='<section class=\"diplomacy-atlas\"><div class=\"atlas-tabs\" aria-label=\"Map region\">';")
s=s.replace('<div class=atlas-pair><section><div class=atlas-mode-label>Political control</div>', '<div class=atlas-mode-label>'+"${({relations:'Relations with '+esc(countryName(s,s.player)),partners:'Favoured trade partners'})[options.view]??'Political control'}"+'</div>')
s=s.replace("const name=countryName(s,id),color=s.nations[id]?.color??(independentNewWorld(s,id)?'#a98c61':'#c8bf93');", "const name=countryName(s,id),r=tradeRelation(s,s.player,id),partner=s.nations[id]?null:campaignFavouredPartner(s,id),base=s.nations[id]?.color??(independentNewWorld(s,id)?'#a98c61':'#c8bf93'),color=options.view==='relations'?(id===s.player?'#bf873b':atWar(s,s.player,id)?'#b84e35':r>=170?'#4b864f':r>=100?'#9ba759':'#c3a35e'):options.view==='partners'&&!s.nations[id]?(s.nations[partner]?.color??'#c8bf93'):base,reason=options.eligibility?.[id],marker=options.markers?.[id];")
s=s.replace("${id===selected?'chosen':''}\"><title>${esc(name)}</title>", "${id===selected?'chosen':''} ${reason?'unavailable':''}\"${reason?` aria-description=\"${esc(reason)}\"`:''}><title>${esc(name)}${reason?' — '+esc(reason):''}${options.view==='partners'&&!s.nations[id]?' — Favoured partner: '+esc(partner?countryName(s,partner):'None'):''}</title>")
s=s.replace('${countryLabel(s,id,group)}</g>', '${countryLabel(s,id,group)}${marker?countryMarker(group,marker):\'\'}</g>')
start=s.index(" html+='</svg></section>';const political=")
end=s.index('\n for(const id of countries)',start)
s=s[:start]+" html+='</svg><p class=\"atlas-caption\">'+esc(options.hint??'Select a nation to view its information')+'</p><div class=\"atlas-key\" aria-label=\"Countries\">';"+s[end:]
start=s.index(" return html+'</div><div class=\"relations-legend\"")
end=s.index('\nexport function envoyPortrait',start)
s=s[:start]+''' return html+'</div>'+(options.view==='relations'?'<div class="relations-legend"><span>Hostile</span><i class="relation-spectrum"></i><span>Warm</span></div>':'')+'</section>';
}
function countryMarker(group,label){const x=group.tiles.reduce((a,t)=>a+t.x,0)/group.tiles.length,y=group.tiles.reduce((a,t)=>a+t.y,0)/group.tiles.length,t=[...group.tiles].sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0];return `<g class="diplomatic-marker" pointer-events="none"><title>${esc(label)}</title><rect x="${t.x-8}" y="${t.y+5}" width="16" height="18" rx="2" fill="#ffe4a3" stroke="#80501a"/><path d="M${t.x-5} ${t.y+10}h10m-10 4h10m-10 4h7" stroke="#80501a"/></g>`;}
''' +s[end:]
p.write_text(s,encoding='utf-8')
print('Replaced comparison ledger and paired atlas with a single interactive map')
