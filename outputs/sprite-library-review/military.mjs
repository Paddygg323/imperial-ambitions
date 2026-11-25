const $=id=>document.getElementById(id),key='imperial-ambitions-military-review-v1';
let notes={},data,active,storage=true;
try{notes=JSON.parse(localStorage.getItem(key)||'{}');if(!notes||Array.isArray(notes)||typeof notes!=='object')notes={};}catch{storage=false;}
const safe=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function directory(){
 const query=$('search').value.trim().toLowerCase();
 $('units').innerHTML=data.units.filter(u=>(u.name+' '+u.category+' '+u.number).toLowerCase().includes(query)).map(u=>`<button data-unit="${u.type}" aria-current="${u.type===active?.type}" data-status="${safe(notes[u.type]?.status||'Awaiting review')}"><span>${String(u.number).padStart(2,'0')}</span>${safe(u.name)}</button>`).join('');
}
function show(type){
 active=data.units.find(u=>u.type===type)||data.units[0];
 $('name').textContent=active.name;$('category').textContent=active.category;$('position').textContent=active.number+' / '+data.units.length;
 $('portrait').innerHTML=active.portrait;$('roster').innerHTML=active.portrait;$('formation').innerHTML=active.formation;$('overview').innerHTML=active.formation;
 $('dimensions').textContent=active.rect[2]+' × '+active.rect[3]+' source pixels';
 $('status').value=notes[active.type]?.status||'Awaiting review';$('note').value=notes[active.type]?.note||'';
 $('previous').disabled=active.number===1;$('next').disabled=active.number===data.units.length;
 history.replaceState(null,'','#'+active.type);directory();
 $('saved').textContent=storage?'Notes stay in this browser. Reviewing does not change the game.':'Browser storage is unavailable. Export your notes before closing.';
}
function save(){notes[active.type]={status:$('status').value,note:$('note').value};try{localStorage.setItem(key,JSON.stringify(notes));$('saved').textContent='Review note saved in this browser.';}catch{storage=false;$('saved').textContent='Could not save locally. Use Export review notes before closing.';}directory();}
$('units').addEventListener('click',e=>{const b=e.target.closest('[data-unit]');if(b)show(b.dataset.unit);});
$('search').addEventListener('input',directory);
$('previous').onclick=()=>show(data.units[active.number-2]?.type);$('next').onclick=()=>show(data.units[active.number]?.type);
document.querySelectorAll('[data-background]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-background]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('portrait').className='paint-stage '+b.dataset.background;});
$('status').onchange=save;$('note').oninput=save;
$('export').onclick=()=>{const blob=new Blob([JSON.stringify({version:data.version,atlasSha256:data.sha256,units:data.units.map(u=>({type:u.type,name:u.name,...notes[u.type]}))},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='army-art-review.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
document.addEventListener('keydown',e=>{if(e.target.matches('input,textarea,select')||e.altKey||e.ctrlKey||e.metaKey)return;if(e.key==='ArrowRight'&&active.number<data.units.length){e.preventDefault();$('next').click();}if(e.key==='ArrowLeft'&&active.number>1){e.preventDefault();$('previous').click();}});
try{const response=await fetch('current-military/catalog.json',{cache:'no-store'});if(!response.ok)throw Error('The military catalog could not load.');data=await response.json();const img=new Image();img.src='current-military/regiments.png';await img.decode();$('build').textContent='Current game artwork · v'+data.version+' · '+data.units.length+' units';show(location.hash.slice(1));}catch(e){$('error').hidden=false;$('error').textContent=e.message+' Restart the sprite library and reload this page.';}
