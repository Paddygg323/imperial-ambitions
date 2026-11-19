from pathlib import Path
import json, shutil, hashlib, struct
r=Path(__file__).resolve().parents[1]
lib=r/'outputs/sprite-library-review'; out=r/'game/assets/reviewed';out.mkdir(exist_ok=True)
m=json.loads((lib/'manifest.json').read_text(encoding='utf-8')); by={s['id']:s for s in m['sprites']}
ids=['001-default']+[f'001-flower-{i:02}' for i in range(1,11)]+['002','003-r1','004','005','006-r1','007','008','009','011','012','013','014','015-r4-4','016','017','018','019']+[f'010-level-{i}' for i in range(5)]+[f'019-level{i}' for i in range(1,5)]
files={}; sprites={}
def add(key,source,rect):
    if source not in files:
        p=lib/source; name=hashlib.sha256(source.encode()).hexdigest()[:10]+'.png';shutil.copy2(p,out/name);files[source]=name
    sprites[key]={'file':'assets/reviewed/'+files[source],'rect':rect}
for id in ids:
    s=by[id];add(id,s['image'],s['preview'])
# Most recent requested crop development sets; no rejected alternatives.
for i,rect in enumerate([[45,0,535,520],[620,0,535,520],[45,625,535,520],[620,625,535,520]],1):
    add(f'cotton-{i}','revisions/014-cotton-progression/levels-1-4-proposal.png',rect)
for i,rect in enumerate([[300,10,405,455],[830,10,405,455],[300,505,405,455],[830,505,405,455]],1):
    add(f'spices-{i}','revisions/015-development-r1/levels-1-4.png',rect)
(r/'game/reviewed-sprite-data.mjs').write_text('export const SPRITES = '+json.dumps(sprites,indent=2)+';\n',encoding='utf-8')
report={'runtime':252,'spriteCount':len(sprites),'sourceFiles':files,'scope':'Terrain and resources only. Units deferred. Source PNGs copied unchanged; canvas clips labels and presentation borders at runtime.'}
(r/'outputs/Sprite-252-manifest.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(len(sprites),'sprite mappings;',len(files),'unchanged source images')
