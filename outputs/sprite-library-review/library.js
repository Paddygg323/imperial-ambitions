'use strict';
const lib = window.SPRITE_LIBRARY;
const $ = id => document.getElementById(id);
const ns = 'http://www.w3.org/2000/svg';
const storageKey = 'sprite-reference-review-m6afc4d27-v1';
let notes = {}, filtered = [], active = null, storageAvailable = true, clipNumber = 0;
try { notes = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch { storageAvailable = false; }
if (!notes || typeof notes !== 'object' || Array.isArray(notes)) notes = {};
const categories = [...new Set(lib.sprites.map(s => s.category))];
for (const name of categories) { const o = document.createElement('option'); o.textContent = name; $('category').append(o); }

function art(sprite, fullCell = false) {
  if(sprite.composite){
    const v=sprite.composite,svg=document.createElementNS(ns,'svg');
    svg.setAttribute('viewBox','0 0 1254 1254');svg.setAttribute('role','img');svg.setAttribute('aria-label',sprite.name);
    const base=document.createElementNS(ns,'image');base.setAttribute('href',v.base);base.setAttribute('width',1254);base.setAttribute('height',1254);svg.append(base);
    for(const target of v.placements??[v.target]){
      const crop=document.createElementNS(ns,'svg');crop.setAttribute('viewBox',v.ore.rect.join(' '));
      ['x','y','width','height'].forEach((key,i)=>crop.setAttribute(key,target[i]));
      const ore=document.createElementNS(ns,'image');ore.setAttribute('href',v.ore.image);ore.setAttribute('width',v.ore.size[0]);ore.setAttribute('height',v.ore.size[1]);crop.append(ore);svg.append(crop);
    }return svg;
  }
  const rect = fullCell ? sprite.cell : sprite.preview;
  const svg = document.createElementNS(ns,'svg');
  svg.setAttribute('viewBox',rect.join(' '));
  svg.setAttribute('role','img');
  svg.setAttribute('aria-label',`${sprite.id} ${sprite.name}`);
  const clipId = `sprite-region-${++clipNumber}`;
  const defs = document.createElementNS(ns,'defs');
  const clip = document.createElementNS(ns,'clipPath');
  clip.setAttribute('id',clipId);
  const box = document.createElementNS(ns,'rect');
  ['x','y','width','height'].forEach((key,i)=>box.setAttribute(key,rect[i]));
  clip.append(box); defs.append(clip); svg.append(defs);
  const image = document.createElementNS(ns,'image');
  image.setAttribute('href',sprite.image);
  image.setAttribute('width',sprite.sheetWidth);
  image.setAttribute('height',sprite.sheetHeight);
  image.setAttribute('clip-path',`url(#${clipId})`);
  svg.append(image);
  return svg;
}
function statusOf(s) { return s.approved ? 'Keep as supplied' : (notes[s.id]?.status || s.status || 'Awaiting review'); }
function render() {
  const query = $('search').value.trim().toLowerCase(), cat = $('category').value, mode = $('view').value;
  filtered = lib.sprites.filter(s => (!query || `${s.id} ${s.name}`.toLowerCase().includes(query)) && (!cat || cat===s.category) && (mode!=='alternatives'||s.variant) && (mode!=='marked'||statusOf(s)==='Needs change'));
  $('grid').replaceChildren();
  if (mode === 'sheets') {
    const ids = new Set(filtered.map(s=>s.sheet));
    for (const sheet of lib.sheets.filter(s=>ids.has(s.id))) {
      const card = document.createElement('a'); card.className='sprite-card sheet-card'; card.href=sheet.path; card.target='_blank'; card.rel='noopener';
      const img = document.createElement('img'); img.src=sheet.path; img.alt=sheet.title; img.loading='lazy';
      const info = document.createElement('div'); info.className='card-info'; info.textContent=`Sheet ${sheet.id} · ${sheet.title} · ${sheet.spriteCount} entries`;
      card.append(img,info); $('grid').append(card);
    }
    $('count').textContent=`${$('grid').children.length} original sheets`;
  } else {
    for (const s of filtered) {
      const card = document.createElement('button'); card.className='sprite-card'; card.dataset.id=s.id;
      const thumb = document.createElement('div'); thumb.className='thumb'; thumb.append(art(s));
      const info = document.createElement('div'); info.className='card-info';
      const title = document.createElement('div'); title.className='card-title';
      const id = document.createElement('span'); id.className='id'; id.textContent=s.id;
      const name = document.createElement('span'); name.className='name'; name.textContent=s.name;
      const meta = document.createElement('div'); meta.className='meta'; meta.textContent=s.category;
      title.append(id,name); info.append(title,meta);
      if (statusOf(s)!=='Awaiting review') { const mark=document.createElement('span'); mark.className='status'+(statusOf(s)==='Keep as supplied'?' kept':''); mark.textContent=statusOf(s); info.append(mark); }
      card.append(thumb,info); card.addEventListener('click',()=>open(s.id)); $('grid').append(card);
    }
    $('count').textContent=`${filtered.length} entries`;
  }
  $('empty').hidden=$('grid').children.length>0;
}
function redrawArt() {
  if (!active) return;
  const svg=art(active,$('caption').checked), rect=$('caption').checked?active.cell:active.preview;
  const zoom=$('zoom').value;
  $('art').classList.toggle('actual',zoom!=='fit');
  $('art').classList.toggle('crisp',$('pixels').checked);
  if(zoom!=='fit'){svg.style.width=`${rect[2]*Number(zoom)}px`;svg.style.height=`${rect[3]*Number(zoom)}px`;}
  else{svg.style.width='100%';svg.style.height='100%';}
  $('art').replaceChildren(svg);
}
function open(id) {
  active=lib.sprites.find(s=>s.id===id); if(!active)return;
  $('detail-title').textContent=`${active.id} · ${active.name}`;
  $('detail-category').textContent=active.category;
  $('source-info').textContent=`Source sheet ${active.sheet} · ${active.sheetWidth} × ${active.sheetHeight}px. ${active.variant?'Standalone alternative; sheet version retained.':'Original numbered artwork.'}`;
  $('source-link').href=active.image;
  $('review-status').value=statusOf(active); $('note').value=notes[id]?.note || '';
  $('save-status').textContent=storageAvailable?'Notes stay in this browser. Nothing is sent or published.':'Browser storage unavailable. Export your notes before closing.';
  const variants=lib.sprites.filter(s=>s.number===active.number);
  $('variant-links').replaceChildren();
  if(variants.length>1){const label=document.createElement('span');label.textContent='Compare versions:';$('variant-links').append(label);for(const s of variants){const b=document.createElement('button');b.textContent=s.id;b.className=s.id===id?'selected':'';b.addEventListener('click',()=>open(s.id));$('variant-links').append(b);}}
  const pos=filtered.findIndex(s=>s.id===id);
  $('position').textContent=pos<0?'Alternative version':`${pos+1} of ${filtered.length}`;
  $('previous').disabled=pos<=0; $('next').disabled=pos<0||pos===filtered.length-1;
  redrawArt();
  if(!$('detail').open)$('detail').showModal();
}
function saveNote(){if(!active)return;notes[active.id]={status:$('review-status').value,note:$('note').value,updated:new Date().toISOString()};try{localStorage.setItem(storageKey,JSON.stringify(notes));storageAvailable=true;$('save-status').textContent='Saved in this browser · not published';}catch{storageAvailable=false;$('save-status').textContent='Held in this session. Export notes before closing.';}render();}
for(const id of ['search','category','view'])$(id).addEventListener(id==='search'?'input':'change',render);
$('size').addEventListener('input',()=>document.documentElement.style.setProperty('--card-size',$('size').value+'px'));
for(const id of ['caption','pixels','zoom'])$(id).addEventListener('change',redrawArt);
$('close').addEventListener('click',()=>$('detail').close());
$('detail').addEventListener('click',event=>{if(event.target===$('detail')){const r=$('detail').getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)$('detail').close();}});
$('review-status').addEventListener('change',saveNote);$('note').addEventListener('input',saveNote);
for(const [id,step] of [['previous',-1],['next',1]])$(id).addEventListener('click',()=>{const i=filtered.findIndex(s=>s.id===active.id);if(filtered[i+step])open(filtered[i+step].id);});
$('export').addEventListener('click',()=>{const data={source:lib.sourceUrl,exported:new Date().toISOString(),reviewOnly:true,entries:Object.entries(notes).map(([id,value])=>({id,name:lib.sprites.find(s=>s.id===id)?.name,...value}))};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='sprite-review-notes.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
render();

