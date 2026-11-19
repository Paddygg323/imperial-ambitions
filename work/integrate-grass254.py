from pathlib import Path
from PIL import Image
import json,shutil
root=Path(__file__).resolve().parents[1];rev=root/'outputs/sprite-library-review/revisions/shared-grass-sheep-r254'
gen=json.loads((root/'work/grass254-generation.json').read_text())
shutil.copy2(gen['path'],rev/'grass.png');(rev/'grass.png.prompt.txt').write_text(gen['prompt'],encoding='utf-8')
shutil.copy2(rev/'grass.png',root/'game/assets/reviewed/254-grass.png')
path=root/'game/reviewed-sprite-data.mjs';data=json.loads(path.read_text().split(' = ',1)[1].strip().rstrip(';'))
data['grass-surface']={'file':'assets/reviewed/254-grass.png','rect':[0,0,*Image.open(rev/'grass.png').size],'kind':'texture'}
path.write_text('export const SPRITES = '+json.dumps(data,indent=2)+';\n',encoding='utf-8')
print('Continuous grass texture copied with its exact generation prompt.')
