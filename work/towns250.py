from pathlib import Path
from PIL import Image
import json,re
im=Image.open('game/assets/towns-forts.png')
w,h=im.size
bounds=[]
for row in range(2):
 for col in range(4):
  x,y=col*w//4,row*h//2
  cell=im.crop((x,y,(col+1)*w//4,(row+1)*h//2))
  bounds.append(cell.getchannel('A').point(lambda v:255 if v>40 else 0).getbbox())
p=Path('game/map-art249.mjs');s=p.read_text(encoding='utf8');s=re.sub(r'const townBounds=.*?;', 'const townBounds='+json.dumps(bounds)+';',s);p.write_text(s,encoding='utf8')
p=Path('game/sw.js');p.write_text(p.read_text(encoding='utf8').replace('rebuild-3-249','rebuild-3-250'),encoding='utf8')
p=Path('android/src/main/AndroidManifest.xml');p.write_text(p.read_text(encoding='utf8').replace('versionCode="249"','versionCode="250"').replace('0.2.49','0.2.50'),encoding='utf8')
p=Path('game/test/art249-browser.mjs');s=p.read_text(encoding='utf8').replace('visual-review/art249','visual-review/art250');Path('game/test/art250-browser.mjs').write_text(s,encoding='utf8')
print(im.size,bounds)
