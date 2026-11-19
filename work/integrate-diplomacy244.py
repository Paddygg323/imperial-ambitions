from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=root/'game/app.mjs';s=p.read_text()
s="import {diplomacyScreen,diplomaticChoice} from './diplomacy-screen.mjs';\nimport {powerRankings} from './power-rankings.mjs';\n"+s
s=s.replace("let diplomacyCountry='france',diplomacyRegion='europe';", "let diplomacyCountry='france',diplomacyRegion='world';\nconst diplomacyUI={mode:'treaties',action:null,policy:100,amount:1000,repeat:false,mapView:'political',receipt:null};")
start=s.index("  html=diplomacyMap(state,diplomacyCountry,diplomacyRegion)")
end=s.index("  if(state.pendingDiplomacy)html+=",start)
s=s[:start]+"  html='';\n"+s[end:]
start=s.index("  if(diplomacyCountry===state.player)html+=")
end=s.index(" }else if(currentPanel==='army'){",start)
s=s[:start]+'''  html+=diplomacyScreen(state,{...diplomacyUI,country:diplomacyCountry,region:diplomacyRegion});
  html+=`<p class="diplomacy-score">Old World control: ${totals.counts[state.player]} / ${totals.required} provinces required to win.</p>`;
 }else if(currentPanel==='rankings'){
  $('panelTitle').textContent='Power rankings';html=powerRankings(state);
'''+s[end:]
s=s.replace("const news=relevantNews(state);html=`<h3>News from around the world · ${state.year}</h3>`+researchWarning();", "const news=relevantNews(state);html=button('Power rankings','panel',{name:'rankings'})+`<h3>News from around the world · ${state.year}</h3>`+researchWarning();")
s=s.replace("case 'diplomacyCountry':diplomacyCountry=a.id;renderPanel();break;",'''case 'diplomacyCountry':{
  diplomacyCountry=a.id;const choice=diplomaticChoice(state,a.id,diplomacyUI);
  if(choice.command){issue(choice.command);diplomacyUI.receipt=choice.message;}
  else diplomacyUI.receipt=choice.reason??null;
  renderPanel();break;}
 case 'diplomacyMode':diplomacyUI.mode=a.mode;diplomacyUI.action=null;diplomacyUI.receipt=null;renderPanel();break;
 case 'diplomacyAction':diplomacyUI.action=a.action;diplomacyUI.receipt=null;renderPanel();break;
 case 'diplomacyPolicy':diplomacyUI.policy=a.policy;diplomacyUI.receipt=null;renderPanel();break;
 case 'diplomacyAmount':diplomacyUI.amount=a.amount;diplomacyUI.receipt=null;renderPanel();break;
 case 'diplomacyRepeat':diplomacyUI.repeat=!diplomacyUI.repeat;renderPanel();break;
 case 'diplomacyMapView':diplomacyUI.mapView=a.view;if(['partners','information','grants'].includes(diplomacyUI.mode))diplomacyUI.mode='information';diplomacyUI.action=null;diplomacyUI.receipt=null;renderPanel();break;
 case 'diplomacyCancel':issue(a);diplomacyUI.receipt=a.type==='diplomaticGrant'?'Grant rescinded. Any reserved money was refunded.':'Diplomatic order rescinded.';renderPanel();break;''')
# Clear armed actions when leaving/reopening diplomacy to avoid accidental offers.
s=s.replace("function openPanel(name){fleetPlanning=false;", "function openPanel(name){if(name==='diplomacy'&&currentPanel!=='diplomacy'){diplomacyUI.action=null;diplomacyUI.mode='treaties';diplomacyUI.receipt=null;}fleetPlanning=false;")
p.write_text(s,encoding='utf-8')
p=root/'game/sw.js';s=p.read_text().replace("rebuild-3-243","rebuild-3-244");s+="\nFILES.push('diplomacy-screen.mjs','diplomatic-aid.mjs','power-rankings.mjs');\n";p.write_text(s)
p=root/'android/src/main/AndroidManifest.xml';s=p.read_text().replace('versionCode="243"','versionCode="244"').replace('0.2.43-dev','0.2.44-dev');p.write_text(s)
print('Connected action-first diplomacy, rankings and persistent diplomatic aid')
