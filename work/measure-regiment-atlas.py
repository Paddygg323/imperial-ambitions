"""Analyse alpha bounds only; never edits the generated bitmap."""
from PIL import Image
import json
from pathlib import Path
im = Image.open('game/assets/royal-regiments.png')
alpha = im.getchannel('A')
rects = []
for lo, hi in [(0,240),(240,474),(474,710),(710,943),(943,1145)]:
    runs=[];start=None
    for x in range(im.width+1):
        on=x<im.width and max(alpha.crop((x,lo,x+1,hi)).get_flattened_data())>32
        if on and start is None:start=x
        if not on and start is not None:
            if x-start>4:runs.append((start,x))
            start=None
    assert len(runs)==6
    for left,right in runs:
        mask=alpha.crop((left,lo,right,hi)).point(lambda a:255 if a>32 else 0)
        _,top,_,bottom=mask.getbbox()
        rects.append([max(0,left-4),max(0,lo+top-4),right-left+8,bottom-top+8])
print(json.dumps({'width':im.width,'height':im.height,'rects':rects},indent=2))
Path('work/royal243-atlas-bounds.json').write_text(json.dumps(rects),encoding='utf-8')
