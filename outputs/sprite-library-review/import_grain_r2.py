from pathlib import Path
import json, shutil, hashlib
from PIL import Image
p=Path(__file__).resolve().parent
d=json.loads((p/'manifest.json').read_text(encoding='utf-8'))
items=json.loads((p/'grain-r2-import.json').read_text(encoding='utf-8'))
folder=p/'revisions'/'010-grain-r2'
folder.mkdir(parents=True,exist_ok=True)
backup=folder/'manifest-before.json'
if not backup.exists(): shutil.copy2(p/'manifest.json',backup)
for x in items:
 sid=f"010-level-{x['id']}"
 dst=folder/(sid+'.png')
 shutil.copy2(x['path'],dst)
 with Image.open(dst) as im:
  w,h=im.size
  im.verify()
 rel=dst.relative_to(p).as_posix()
 sheet=next((s for s in d['sheets'] if s['path']==rel),None)
 if sheet is None:
  sheet={'id':max(s['id'] for s in d['sheets'])+1}
  d['sheets'].append(sheet)
 sprite=next(s for s in d['sprites'] if s['id']==sid)
 sheet.update(title=sprite['name']+' rectangular revision',path=rel,width=w,height=h,spriteCount=1,sha256=hashlib.sha256(dst.read_bytes()).hexdigest())
 sprite.update(sheet=sheet['id'],image=rel,sheetWidth=w,sheetHeight=h,cell=[0,0,w,h],preview=[0,0,w,h],revision=2,status='Awaiting review')
assert len({s['id'] for s in d['sprites']})==len(d['sprites'])
for s in d['sprites']: assert (p/s['image']).exists(),s['id']
(p/'manifest.json').write_text(json.dumps(d,indent=2,ensure_ascii=False),encoding='utf-8')
(p/'catalog.js').write_text('window.SPRITE_LIBRARY = '+json.dumps(d,ensure_ascii=False)+';',encoding='utf-8')
(folder/'PROMPTS.txt').write_text('Built-in image generation. Library only; no game changes. Previous revision retained in 010-grain-r1.\n\n'+'\n\n'.join(str(x['id'])+': '+x['prompt'] for x in items),encoding='utf-8')
(folder/'SHA256SUMS.txt').write_text('\n'.join(hashlib.sha256(f.read_bytes()).hexdigest()+'  '+f.name for f in sorted(folder.glob('*.png')))+'\n',encoding='utf-8')
print('Verified and replaced all five grain library entries; prior images preserved.')
