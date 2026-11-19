from pathlib import Path
from PIL import Image
import json,shutil
root=Path(__file__).resolve().parents[1];lib=root/'outputs/sprite-library-review'
rev=lib/'revisions/shared-grass-sheep-r254';rev.mkdir(exist_ok=True)
generation=json.loads((root/'work/sprite254-generation.json').read_text())
shutil.copy2(generation['path'],rev/'sheep.png')
(rev/'sheep.png.prompt.txt').write_text(generation['prompt'],encoding='utf-8')
im=Image.open(rev/'sheep.png');assert im.mode=='RGBA'
bbox=im.getchannel('A').point(lambda a:255 if a>128 else 0).getbbox()
rect=[bbox[0],bbox[1],bbox[2]-bbox[0],bbox[3]-bbox[1]]
shutil.copy2(rev/'sheep.png',root/'game/assets/reviewed/254-sheep.png')
path=root/'game/reviewed-sprite-data.mjs';data=json.loads(path.read_text().split(' = ',1)[1].strip().rstrip(';'))
data['sheep-overlay']={'file':'assets/reviewed/254-sheep.png','rect':rect,'kind':'overlay'}
path.write_text('export const SPRITES = '+json.dumps(data,indent=2)+';\n',encoding='utf-8')
path=lib/'manifest.json';shutil.copy2(path,lib/'archive/manifest-before-shared-grass254.json')
m=json.loads(path.read_text(encoding='utf-8'));by={s['id']:s for s in m['sprites']}
s=by['012'];hills=by['003-r1']
s.update(revision=1,status='Updated',approved=False,
    composite={'base':hills['image'],'ore':{'image':'revisions/shared-grass-sheep-r254/sheep.png','rect':rect,'size':list(im.size)},
    'placements':[[450,380,160,125],[730,490,160,125],[340,640,160,125],[600,700,160,125],[770,830,160,125]]},
    cell=[0,0,1254,1254],preview=[0,0,1254,1254])
m['integrationStatus']='Runtime 254: continuous shared grass at all land edges; normal hills plus separate sheep overlay.'
path.write_text(json.dumps(m,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
(lib/'catalog.js').write_text('window.SPRITE_LIBRARY = '+json.dumps(m,ensure_ascii=False)+';\n',encoding='utf-8')
print('Sheep overlay copied, source preserved and library updated:',rect)
