from pathlib import Path
import json, shutil, hashlib
from PIL import Image
p=Path(__file__).resolve().parent
items=json.loads((p/'plains-import.json').read_text())
d=json.loads((p/'manifest.json').read_text(encoding='utf-8'))
folder=p/'revisions'/'001-plains-r1'
folder.mkdir(parents=True,exist_ok=True)
for item in items:
 i=item['i']; sid='001-default' if i==0 else f'001-flower-{i:02d}'
 dst=folder/(sid+'.png'); shutil.copy2(item['path'],dst)
 with Image.open(dst) as im: w,h=im.size; im.verify()
 rel=dst.relative_to(p).as_posix(); sheet=11+i
 d['sheets'].append(dict(id=sheet,title=sid,path=rel,width=w,height=h,spriteCount=1,sha256=hashlib.sha256(dst.read_bytes()).hexdigest()))
 d['sprites'].append(dict(id=sid,number=1,name='Plains — flowerless default' if i==0 else f'Plains — flower variation {i:02d}',category='Plains variations',sheet=sheet,image=rel,sheetWidth=w,sheetHeight=h,cell=[0,0,w,h],preview=[0,0,w,h],variant=True,relatedId='001',status='Awaiting review',revision=1))
d['sprites'].sort(key=lambda s:(s['number'],s['id']))
d['plainsPlacement']={'status':'Design instruction only; not implemented in game','default':'001-default','rule':'Most plains use flowerless artwork. Restrict flowers to a few specific local areas, forming occasional small irregular clusters. Vary floral artwork within clusters; never scatter flowers uniformly over the whole map. No floral variant may exceed original 001 flower coverage.'}
(p/'manifest.json').write_text(json.dumps(d,indent=2,ensure_ascii=False),encoding='utf-8')
(p/'catalog.js').write_text('window.SPRITE_LIBRARY = '+json.dumps(d,ensure_ascii=False)+';',encoding='utf-8')
(folder/'PROMPTS-AND-USAGE.txt').write_text('Built-in image generation. Reference: originals/01-terrain.png, tile 001 only. Preserve pixel-art grass, palette and hex shape. No text; cream backdrop.\n\n'+'\n'.join(f"{x['i']:02d}: {x['spec']}" for x in items)+'\n\n'+d['plainsPlacement']['rule']+'\nReview only. Game unchanged.',encoding='utf-8')
print('Added 11 plains variants; original retained. Total entries:',len(d['sprites']))
