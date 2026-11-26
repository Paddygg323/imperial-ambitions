const root='revisions/artillery-generations-v2/',key='imperial-ambitions-artillery-generations-v2';
let catalog,current,atlas,notes={},mode='proposed',images=new Map(),storage=true;
try{notes=JSON.parse(localStorage.getItem(key)||'{}');if(!notes||Array.isArray(notes)||typeof notes!=='object')notes={};}catch{storage=false;}
const safe=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=id=>document.getElementById(id);
function paint(canvas,u){
 const context=canvas.getContext('2d'),size=Number(canvas.dataset.size),dpr=Math.min(devicePixelRatio||1,2);
 canvas.width=size*dpr;canvas.height=size*dpr;canvas.style.width=size+'px';canvas.style.height=size+'px';context.scale(dpr,dpr);context.clearRect(0,0,size,size);
 let im,rect;
 if(mode==='current'){im=atlas;rect=current.units.find(x=>x.type===u.type).rect;}else{im=images.get(u.type);const [l,t,r,b]=u.crop,p=12;rect=[Math.max(0,l-p),Math.max(0,t-p),Math.min(im.width,r+p)-Math.max(0,l-p),Math.min(im.height,b+p)-Math.max(0,t-p)];}
 const [x,y,w,h]=rect,scale=size*.92/Math.max(w,h);context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';context.drawImage(im,x,y,w,h,(size-w*scale)/2,(size-h*scale)/2,w*scale,h*scale);
}
function repaint(){document.querySelectorAll('canvas').forEach(c=>paint(c,catalog.units.find(u=>u.type===c.dataset.type)));}
function persist(type,card){notes[type]={status:card.querySelector('select').value,note:card.querySelector('textarea').value};try{localStorage.setItem(key,JSON.stringify(notes));$('saved').textContent='Draft review saved in this browser.';}catch{storage=false;$('saved').textContent='Could not save locally. Export your notes before closing.';}}
function render(){
 for(const branch of ['mobile','heavy'])$(branch).innerHTML=catalog.units.filter(u=>u.branch===branch).map(u=>`<article class="card" id="${u.type}"><h3>${u.name}</h3><p class="era">Technology era ${u.era}</p><p class="description">${u.description}</p><div class="large"><canvas data-type="${u.type}" data-size="210" role="img" aria-label="${u.name} enlarged design"></canvas></div><div class="samples">${[80,36].map(size=>`<div class="sample"><div class="canvas-holder"><canvas data-type="${u.type}" data-size="${size}" role="img" aria-label="${u.name} at ${size} pixels"></canvas></div><span>${size}px</span></div>`).join('')}</div><a class="asset-link" href="${root+u.file}" target="_blank" rel="noopener">Open full-size new artwork ↗</a><label for="status-${u.type}">Your review</label><select id="status-${u.type}"><option>Awaiting review</option><option>Keep this direction</option><option>Needs changes</option></select><label for="note-${u.type}">Changes to make</label><textarea id="note-${u.type}" rows="2" placeholder="Silhouette, technology, proportions…">${safe(notes[u.type]?.note||'')}</textarea></article>`).join('');
 for(const u of catalog.units){const card=$(u.type);card.querySelector('select').value=notes[u.type]?.status||'Awaiting review';card.querySelector('select').onchange=()=>persist(u.type,card);card.querySelector('textarea').oninput=()=>persist(u.type,card);}repaint();
 if(!storage)$('saved').textContent='Browser storage is unavailable. Export your notes before closing.';
}
document.querySelectorAll('[data-background]').forEach(b=>b.onclick=()=>{document.querySelector('main').className=b.dataset.background;document.querySelectorAll('[data-background]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;document.querySelectorAll('[data-mode]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));repaint();});
$('export').onclick=()=>{const blob=new Blob([JSON.stringify({revision:catalog.revision,status:catalog.status,units:catalog.units.map(u=>({type:u.type,name:u.name,...notes[u.type]}))},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='artillery-generations-review.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
try{
 const responses=await Promise.all([fetch(root+'catalog.json',{cache:'no-store'}),fetch('current-military/catalog.json',{cache:'no-store'})]);if(responses.some(r=>!r.ok))throw Error('Could not load the artillery catalog.');
 [catalog,current]=await Promise.all(responses.map(r=>r.json()));
 atlas=new Image();atlas.src='current-military/regiments.png';
 await Promise.all([atlas.decode(),...catalog.units.map(async u=>{const img=new Image();img.src=root+u.file;await img.decode();images.set(u.type,img);})]);render();
}catch(e){$('error').hidden=false;$('error').textContent=e.message;}
