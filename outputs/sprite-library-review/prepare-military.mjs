import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {ARMY,nameOf} from '../../game/rules.mjs';
import {MILITARY_TYPES,MILITARY_ATLAS,MILITARY_RECTS,militaryPortrait,battleFormation} from '../../game/military-art.mjs';

// The review always comes from the live renderer, never the older reference set.
export async function prepareMilitary(){
 const root=fileURLToPath(new URL('../../',import.meta.url)),out=resolve(root,'outputs/sprite-library-review/current-military');
 await mkdir(out,{recursive:true});
 const categories=['Light infantry','Heavy infantry','Ranged infantry','Archers','Command','Light cavalry','Heavy cavalry','Firearm cavalry','Mobile artillery','Siege artillery'];
 const atlas=await readFile(resolve(root,'game/assets/royal-regiments.png'));
 await writeFile(resolve(out,'regiments.png'),atlas);
 await copyFile(resolve(root,'game/assets/landscape/grass.png'),resolve(out,'grass.png'));
 const {version}=JSON.parse(await readFile(resolve(root,'package.json'),'utf8'));
 const data={version,sha256:createHash('sha256').update(atlas).digest('hex'),atlas:MILITARY_ATLAS,
  units:MILITARY_TYPES.map((type,index)=>({type,name:nameOf(type),number:index+1,category:categories[ARMY[type].category],rect:MILITARY_RECTS[index],portrait:militaryPortrait(type),formation:battleFormation(type)}))};
 await writeFile(resolve(out,'catalog.json'),JSON.stringify(data,null,2)+'\n');
 const wanted=s=>s==='.military-portrait'||s==='.military-paint'||s==='.formation-figure'||s==='.battle-tile .formation-figure .military-portrait'||/^\.battle-(view|formation)/.test(s)&&/\.battle-formation|\.formation-\d/.test(s);
 const rules=[];
 for(const name of ['battle-view.css','campaign-polish.css']){
  const css=await readFile(resolve(root,'game',name),'utf8');
  for(const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)){
   const selectors=match[1].trim().split(',').map(s=>s.trim()).filter(wanted);
   if(selectors.length)rules.push(selectors.join(',')+'{'+match[2].replaceAll("url('assets/royal-regiments.png')","url('regiments.png')")+'}');
  }
 }
 await writeFile(resolve(out,'renderer.css'),'/* Extracted from the current game renderer; regenerate with npm run sprites. */\n'+rules.join('\n')+'\n');
 return data;
}
