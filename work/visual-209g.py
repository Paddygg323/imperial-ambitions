from pathlib import Path
p=Path('game/map.mjs');s=p.read_text().replace('planningCivilian=()=>false,onBackground','planningCivilian=()=>false,planningFleet=()=>false,onBackground');s=s.replace('const hits=[...(!planningCivilian()', 'const hits=planningFleet()?[]:[...(!planningCivilian()');p.write_text(s)
p=Path('game/app.mjs');s=p.read_text().replace('let fleetPlanning=false,plannedDestination=null;', 'let fleetPlanning=false,plannedDestination=null,researchProjectsExpanded=false;');s=s.replace('planningCivilian:()=>!!civilian,onSea','planningCivilian:()=>!!civilian,planningFleet:()=>fleetPlanning,onSea')
a=s.index('function foreignKnowledge(');b=s.index('\n',a)
s=s[:a]+'''function foreignKnowledge(tech){const sources=technologySources(state,nation(),tech);if(!sources.length)return '';return `<button class="knowledge-flags" data-action="knowledgeFlags" data-args='${JSON.stringify({tech})}' aria-label="Identify countries that know this technology">`+sources.map(n=>`<span class="knowledge-flag" role="img" aria-label="${esc(n.name)}${n.spy?' · spy assistance':''}" style="--flag:${state.nations[n.id].color}">${n.spy?'<sup>s</sup>':''}</span>`).join('')+'</button>'; }
'''+s[b:]
s=s.replace("case 'researchView':researchView=a.view;", "case 'knowledgeFlags':toast('Known abroad: '+technologySources(state,nation(),a.tech).map(n=>n.name+(n.spy?' (spy assisting)':'')).join(', '));break;\n case 'toggleProjects':researchProjectsExpanded=!researchProjectsExpanded;renderPanel();break;\n case 'researchView':researchProjectsExpanded=false;researchView=a.view;")
s=s.replace("case 'startResearch':issue", "case 'startResearch':researchProjectsExpanded=true;issue")
s=s.replace('<h3>Active projects · ${n.projects.length}/${researchSlots(n)}</h3>`;', '<h3>Active projects · ${n.projects.length}/${researchSlots(n)}</h3>`+(n.projects.length?button(researchProjectsExpanded?\'Hide project funding\':\'Show project funding\',\'toggleProjects\'):\'\');')
s=s.replace('  for(const p of n.projects){const step=', '  if(researchProjectsExpanded)for(const p of n.projects){const step=')
s=s.replace('${esc(t.description)}</p><p>Requires:', '${esc(t.description)}</p><p>Funding adjusts in $${fundingStep(t.id)} steps per turn. Completion time varies.</p><p>Requires:')
p.write_text(s)
p=Path('game/style.css');p.write_text(p.read_text()+'''
button.knowledge-flags{min-width:44px;min-height:30px;padding:3px 2px;align-items:center;border:0;background:transparent;box-shadow:none}
.technology-card .knowledge-flags{top:0;right:5px}.technology-card:has(.knowledge-flags)>b{padding-top:22px;min-height:52px}
''')
p=Path('game/test/visual-orders-browser.mjs');s=p.read_text().replace("await mine.getByRole('button',{name:'Research',exact:true}).tap();", "await mine.locator('.knowledge-flags').tap();assert.match(await page.locator('#toast').innerText(),/Known abroad:.*France/);\nawait mine.getByRole('button',{name:'Research',exact:true}).tap();");p.write_text(s)
