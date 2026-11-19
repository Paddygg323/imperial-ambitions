from pathlib import Path
import json, shutil
from PIL import Image

root=Path(__file__).resolve().parents[1]
lib=root/'outputs/sprite-library-review'
rev=lib/'revisions/minerals-swamp-r253'
rev.mkdir(exist_ok=True)
generation=json.loads((root/'work/sprite253-generation.json').read_text())
assets={}
for key,item in generation.items():
    name=key.replace('253','')+'.png'
    shutil.copy2(item['path'],rev/name)
    (rev/(name+'.prompt.txt')).write_text(item['prompt'],encoding='utf-8')
    im=Image.open(rev/name)
    if key!='swamp253':
        assert im.mode=='RGBA' and im.getpixel((0,0))[3]<=2
        bbox=im.getchannel('A').point(lambda a:255 if a>128 else 0).getbbox()
        rect=[bbox[0],bbox[1],bbox[2]-bbox[0],bbox[3]-bbox[1]]
    else: rect=[0,0,*im.size]
    assets[key.replace('253','')]={'image':'revisions/minerals-swamp-r253/'+name,'rect':rect,'size':list(im.size)}
    shutil.copy2(rev/name,root/'game/assets/reviewed'/('253-'+name))

datafile=root/'game/reviewed-sprite-data.mjs'
data=json.loads(datafile.read_text().split(' = ',1)[1].strip().rstrip(';'))
data['005']={'file':'assets/reviewed/253-swamp.png','rect':assets['swamp']['rect'],'feather':.30}
for resource in ['tin','copper','iron','coal']:
    data['ore-'+resource]={'file':'assets/reviewed/253-'+resource+'.png','rect':assets[resource]['rect'],'kind':'overlay'}
for level in range(1,5):data['019-level'+str(level)]['feather']=.30
datafile.write_text('export const SPRITES = '+json.dumps(data,indent=2)+';\n',encoding='utf-8')

manifestfile=lib/'manifest.json'
shutil.copy2(manifestfile,lib/'archive/manifest-before-minerals-swamp253.json')
m=json.loads(manifestfile.read_text(encoding='utf-8'))
by={s['id']:s for s in m['sprites']}
s=by['005'];s.update(image=assets['swamp']['image'],cell=assets['swamp']['rect'],preview=assets['swamp']['rect'],sheetWidth=1254,sheetHeight=1254,revision=3,status='Updated',approved=False)
# Browser composites preserve unmodified source bitmaps while showing the actual
# same deposit footprint as the game. No baked swamp on mountain deposits.
for resource,id in [('tin','019'),('copper','082'),('iron','083'),('coal','084')]:
    s=by[id]
    background=by['005'] if resource=='tin' else by['004']
    s.update(image=assets[resource]['image'],cell=[0,0,1254,1254],preview=[0,0,1254,1254],sheetWidth=1536,sheetHeight=1024,revision=11 if resource=='tin' else 1,status='Updated',approved=False,
        composite={'base':background['image'],'baseSize':[background['sheetWidth'],background['sheetHeight']],'baseRect':background['preview'],'ore':assets[resource],'widthRatio':.85,'target':[347,479,529,317]})
    s['name']={'tin':'Tin in Swamp','copper':'Copper deposit','iron':'Iron deposit','coal':'Coal deposit'}[resource]
m['integrationStatus']='Terrain and resource sprites integrated in runtime 253; unit artwork still pending.'
manifestfile.write_text(json.dumps(m,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
(lib/'catalog.js').write_text('window.SPRITE_LIBRARY = '+json.dumps(m,ensure_ascii=False)+';\n',encoding='utf-8')
(root/'outputs/Sprite-253-manifest.json').write_text(json.dumps({'runtime':253,'assets':assets,'tinScale':.85,'notes':'Originals preserved; raw generated alpha overlays and swamp texture. Copper means the map deposit.'},indent=2),encoding='utf-8')
print('Copied 5 generated assets; library and runtime data updated.')
