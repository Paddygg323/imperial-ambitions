from pathlib import Path
import json,shutil,hashlib
from PIL import Image
p=Path(__file__).resolve().parent
items=json.loads((p/'grain-import.json').read_text())
d=json.loads((p/'manifest.json').read_text(encoding='utf-8'))
folder=p/'revisions'/'010-grain-r1'; folder.mkdir(parents=True,exist_ok=True)
for x in items:
 level=x['id']; sid=f'010-level-{level}'; name='Grain — undeveloped' if level==0 else f'Grain farm — level {level}'
 if any(s['id']==sid for s in d['sprites']): continue
 dst=folder/(sid+'.png'); shutil.copy2(x['path'],dst)
 with Image.open(dst) as im: w,h=im.size; im.verify()
 rel=dst.relative_to(p).as_posix(); sheet=max(s['id'] for s in d['sheets'])+1
 d['sheets'].append(dict(id=sheet,title=name,path=rel,width=w,height=h,spriteCount=1,sha256=hashlib.sha256(dst.read_bytes()).hexdigest()))
 d['sprites'].append(dict(id=sid,number=10,name=name,category='Grain development',sheet=sheet,image=rel,sheetWidth=w,sheetHeight=h,cell=[0,0,w,h],preview=[0,0,w,h],variant=True,relatedId='010',status='Awaiting review',revision=1,developmentLevel=level))
d['sprites'].sort(key=lambda s:(s['number'],s['id']))
assert len({s['id'] for s in d['sprites']})==len(d['sprites'])
(p/'manifest.json').write_text(json.dumps(d,indent=2,ensure_ascii=False),encoding='utf-8')
(p/'catalog.js').write_text('window.SPRITE_LIBRARY = '+json.dumps(d,ensure_ascii=False)+';',encoding='utf-8')
(folder/'PROMPTS.txt').write_text('Built-in image generation. Review only. Levels 2–4 are proposed progression; original 010 preserved.\n\n'+'\n\n'.join(str(x['id'])+': '+x['prompt'] for x in items),encoding='utf-8')
h=(p/'index.html').read_text(encoding='utf-8').replace('97 original sprites, 2 alternatives, 11 plains variations and 4 terrain revisions.','97 original sprites plus reviewed alternatives and terrain development stages.')
(p/'index.html').write_text(h,encoding='utf-8')
j=(p/'library.js').read_text(encoding='utf-8').replace('97 originals + 17 variants','97 originals + 22 variants')
(p/'library.js').write_text(j,encoding='utf-8')
print('Five grain development images verified and added. Total:',len(d['sprites']))
