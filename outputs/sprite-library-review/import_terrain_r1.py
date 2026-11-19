from pathlib import Path
import json, shutil, hashlib
from PIL import Image
p=Path(__file__).resolve().parent
items=json.loads((p/'terrain-r1-import.json').read_text())
d=json.loads((p/'manifest.json').read_text(encoding='utf-8'))
folder=p/'revisions'/'terrain-r1'; folder.mkdir(parents=True,exist_ok=True)
for item in items:
 sid=item['id']+'-r1'
 if any(s['id']==sid for s in d['sprites']): continue
 dst=folder/(sid+'.png'); shutil.copy2(item['path'],dst)
 with Image.open(dst) as im: w,h=im.size; im.verify()
 rel=dst.relative_to(p).as_posix(); sheet=max(s['id'] for s in d['sheets'])+1
 d['sheets'].append(dict(id=sheet,title=item['name'],path=rel,width=w,height=h,spriteCount=1,sha256=hashlib.sha256(dst.read_bytes()).hexdigest()))
 d['sprites'].append(dict(id=sid,number=int(item['id']),name=item['name']+' — revision 1',category='Terrain revisions',sheet=sheet,image=rel,sheetWidth=w,sheetHeight=h,cell=[0,0,w,h],preview=[0,0,w,h],variant=True,relatedId=item['id'],status='Awaiting review',revision=1))
d['sprites'].sort(key=lambda s:(s['number'],s['id']))
assert len({s['id'] for s in d['sprites']})==len(d['sprites'])
(p/'manifest.json').write_text(json.dumps(d,indent=2,ensure_ascii=False),encoding='utf-8')
(p/'catalog.js').write_text('window.SPRITE_LIBRARY = '+json.dumps(d,ensure_ascii=False)+';',encoding='utf-8')
(folder/'PROMPTS.txt').write_text('Built-in image generation. Original artwork preserved. Review library only; no game integration.\n\n'+'\n\n'.join(x['id']+': '+x['prompt'] for x in items),encoding='utf-8')
h=(p/'index.html').read_text(encoding='utf-8').replace('97 original sprites, 2 alternatives and 11 new plains variations.','97 original sprites, 2 alternatives, 11 plains variations and 4 terrain revisions.')
(p/'index.html').write_text(h,encoding='utf-8')
j=(p/'library.js').read_text(encoding='utf-8').replace('97 originals + 13 variants','97 originals + 17 variants')
(p/'library.js').write_text(j,encoding='utf-8')
print('Verified 4 new image files and unique catalog IDs. Total entries:',len(d['sprites']))
