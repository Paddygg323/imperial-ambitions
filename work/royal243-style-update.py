from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
base="display:inline-block;flex:none;width:72px;height:72px;background-image:url('assets/royal-regiments.png');background-size:600% 500%;background-position:calc(var(--unit-col)*20%) calc(var(--unit-row)*25%);background-repeat:no-repeat;pointer-events:none"
tile="position:absolute;left:0;right:auto;bottom:7px;width:100%;height:100%;background-size:600% 500%;background-position:calc(var(--unit-col)*20%) calc(var(--unit-row)*25%);z-index:1"
roster="display:block;width:44px;height:44px;margin:auto;background-size:600% 500%;background-position:calc(var(--unit-col)*20%) calc(var(--unit-row)*25%)"
for name in ['style.css','battle-view.css']:
 p=root/'game'/name
 seen=set()
 def rule(m):
  selector,body=m.group(1),m.group(2)
  key=selector.strip()
  replacement={'.military-portrait':base,'.battle-tile .military-portrait':tile,'.battle-roster .military-portrait':roster}.get(key)
  if replacement is None:return m.group(0)
  if key in seen:return ''
  seen.add(key)
  return selector+'{'+replacement+'}'
 text=re.sub(r'([^{}]+)\{([^{}]*)\}',rule,p.read_text(encoding='utf-8'))
 p.write_text(text,encoding='utf-8')
assert 'assets/military.png' not in (root/'game/battle-view.css').read_text(encoding='utf-8')
