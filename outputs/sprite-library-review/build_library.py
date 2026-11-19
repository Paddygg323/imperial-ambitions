"""Index the supplied sheets without altering any source image pixels."""
from pathlib import Path
import hashlib
import json
import shutil
from PIL import Image

ROOT = Path(__file__).resolve().parent
SOURCE = 'https://chatgpt.com/s/m_6afc4d27d1f081919eddec91d085ab49'
DOWNLOADS = Path.home() / 'Downloads'

SHEETS = [
    (1, 'terrain', 'f7e36045-d4d5-439f-b119-9958817d9271', 5, 2, 1,
     ['Plains', 'Sea', 'Barren Hills', 'Mountains', 'Swamp', 'Desert', 'Tundra', 'Hardwood Forest', 'Scrub Forest', 'Grain Farm']),
    (2, 'resource-tiles', '11fe48e1-0284-4023-96be-7976c8d27cca', 3, 3, 11,
     ['Open Range / Cattle', 'Fertile Hills / Sheep', 'Horse Ranch', 'Cotton Plantation', 'Spice Orchard', 'Sugar Plantation', 'Tobacco Land', 'Fur-bearing Tundra', 'Tin in Swamp']),
    (3, 'resource-icons', '27086cf3-4726-4a16-8552-8d5655a6f938', 5, 4, 79,
     ['Wool', 'Timber', 'Tin', 'Copper', 'Iron Ore', 'Coal', 'Cotton', 'Sugar Cane', 'Tobacco', 'Fur', 'Horses', 'Grain', 'Fish', 'Livestock', 'Spices', 'Silver', 'Gold', 'Gems', 'Diamonds']),
    (4, 'ships', '6b5ae6b4-2409-4b08-bd84-cc4fd4bae950', 4, 3, 49,
     ['Carrack', 'Fluyte', 'Sloop', 'Galleon', 'Trader', 'Indiaman', 'Frigate', 'Ship-of-the-Line', 'Clipper', 'Merchant Steamship', 'Raider', 'Ironclad']),
    (5, 'cavalry-artillery', '4a324152-c88b-482d-a9fd-6bc6157823a8', 5, 3, 35,
     ['Hussars', 'Scouts', 'Knights', 'Lancers', 'Harquebusiers', 'Cuirassiers', 'Carbine Cavalry', 'Horse Artillery', 'Light Artillery', 'Field Artillery', 'Culverin', 'Royal Artillery', 'Heavy Artillery', 'Siege Artillery']),
    (6, 'civilians', 'd750c0aa-e479-418c-b789-9e415fea7585', 3, 2, 61,
     ['Explorer', 'Engineer', 'Builder', 'Merchant', 'Spy', 'Rail Builder']),
    (7, 'infrastructure', 'cb41f8eb-77bd-4673-87ab-43a0599d7131', 4, 3, 67,
     ['Road — straight', 'Road — bend', 'Road — junction', 'Rail — straight', 'Rail — bend', 'Rail — junction', 'Port', 'Provincial Town', 'Capital City', 'Fort — Level I', 'Fort — Level II', 'Fort — Level III']),
    (8, 'horse-artillery-alternative', 'a9326b53-d33b-4251-9507-2bb145733575', 1, 1, None, ['Horse Artillery — standalone alternative']),
    (9, 'infantry', '28370869-0936-4f2f-abb1-2af04f47da3f', 5, 3, 20,
     ['Peasant Levies', 'Calivermen', 'Skirmishers', 'Sharpshooters', 'Pikemen', 'Halberdiers', 'Regulars', 'Rifle Infantry', 'Arquebusiers', 'Musketeers', 'Grenadiers', 'Guards', 'Bowmen', 'Squires', 'Cossacks']),
    (10, 'pikeman-alternative', '69c7f382-0ae6-46d5-b019-594f7eab651d', 1, 1, None, ['Pikeman — standalone alternative']),
]

def category(number):
    if number <= 19: return 'Terrain & resource tiles'
    if number <= 34: return 'Infantry & early cavalry'
    if number <= 48: return 'Cavalry & artillery'
    if number <= 60: return 'Ships'
    if number <= 66: return 'Civilians'
    if number <= 78: return 'Roads, towns & forts'
    return 'Resource icons'

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    originals = ROOT / 'originals'
    originals.mkdir(exist_ok=True)
    sheets, sprites = [], []
    for order, name, filename, cols, rows, first, labels in SHEETS:
        src = DOWNLOADS / (filename + '.png')
        dst = originals / f'{order:02d}-{name}.png'
        if dst.exists() and digest(dst) != digest(src):
            raise RuntimeError(f'Existing original differs; refusing overwrite: {dst}')
        if not dst.exists(): shutil.copy2(src, dst)
        assert digest(src) == digest(dst)
        with Image.open(dst) as im:
            width, height = im.size
            im.verify()
        rel = dst.relative_to(ROOT).as_posix()
        sheets.append(dict(id=order, title=name.replace('-', ' ').title(), path=rel,
                           width=width, height=height, sha256=digest(dst), columns=cols, rows=rows,
                           galleryPosition=order, sourceUrl=SOURCE, spriteCount=len(labels)))
        for i, label in enumerate(labels):
            number = first + i if first is not None else (42 if order == 8 else 24)
            sid = f'{number:03d}' + ('-alt' if first is None else '')
            x0, y0 = round((i % cols) * width / cols), round((i // cols) * height / rows)
            x1, y1 = round((i % cols + 1) * width / cols), round((i // cols + 1) * height / rows)
            # View rectangles only. No generated cutouts, resampling, background removal or repainting.
            # The label-bearing cell is retained; the default art view hides its top caption.
            inset = 2 if first is not None else 0
            caption = round((y1-y0) * .125) if first is not None else 0
            sprites.append(dict(id=sid, number=number, name=label, category=category(number),
                sheet=order, image=rel, sheetWidth=width, sheetHeight=height,
                cell=[x0,y0,x1-x0,y1-y0], preview=[x0+inset,y0+caption,x1-x0-inset*2,y1-y0-caption-inset],
                variant=first is None, relatedId=f'{number:03d}' if first is None else None,
                status='Awaiting review', revision=0))
    sprites.sort(key=lambda s:(s['number'],s['variant']))
    assert {s['number'] for s in sprites if not s['variant']} == set(range(1,98))
    assert len(sprites) == 99 and len({s['id'] for s in sprites}) == 99
    manifest = dict(version=1, title='Sprite library — supplied reference set', sourceUrl=SOURCE,
        created='2026-11-18', integrationStatus='Review only — not installed in the game',
        note='Original PNG files preserved byte-for-byte. Rectangles are display-only atlas regions. Standalone alternatives are retained separately. Names reproduce sheet captions; they do not change gameplay or unit definitions.',
        sheets=sheets, sprites=sprites)
    body = json.dumps(manifest, ensure_ascii=False, indent=2)
    (ROOT/'manifest.json').write_text(body+'\n', encoding='utf-8')
    (ROOT/'catalog.js').write_text('window.SPRITE_LIBRARY = '+body+';\n', encoding='utf-8')
    (ROOT/'SHA256SUMS.txt').write_text(''.join(f"{s['sha256']}  {s['path']}\n" for s in sheets), encoding='utf-8')
    print(f'Indexed {len(sprites)} entries (97 numbered sprites + 2 alternatives) from {len(sheets)} unchanged originals.')

if __name__ == '__main__': main()
