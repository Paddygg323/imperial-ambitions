from pathlib import Path
import shutil
root=Path(__file__).resolve().parents[1]
source=root/'game';dest=root/'sites/public-playtest/dist'
count=0
for file in source.rglob('*'):
    if not file.is_file() or 'test' in file.relative_to(source).parts:continue
    if file.suffix not in ['.mjs','.js','.html','.css','.svg','.png','.json','.webmanifest']:continue
    target=dest/file.relative_to(source);target.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(file,target);count+=1
for name in ['index.html','boot.js','manifest.webmanifest']:
    p=dest/name;text=p.read_text(encoding='utf-8')
    for before,after in [('Imperialism II · Phone rebuild','Imperial Ambitions · Playtest'),('IMPERIALISM II · DEVELOPMENT BUILD','IMPERIAL AMBITIONS · PLAYTEST'),('Imperialism II','Imperial Ambitions')]:
        text=text.replace(before,after)
    p.write_text(text,encoding='utf-8')
assert 'rebuild-3-254' in (dest/'sw.js').read_text()
print('Staged',count,'game files.')
