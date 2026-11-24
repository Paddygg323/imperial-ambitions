import {createGame} from '/game/engine.mjs';
import {diplomacyMap,envoyPortrait,countryName} from '/game/diplomacy-map.mjs';
import {mountDiplomacyViewport} from '/game/diplomacy-viewport.mjs';
import {nationEmblem} from '/game/heraldry.mjs';
import {majorPowerRelations} from '/game/diplomacy-info.mjs';
import {royalIcon} from '/game/royal-ui.mjs';

// Isolated synthetic campaign: no storage, game dispatch or network mutations.
const game=createGame(),params=new URLSearchParams(location.search);
const state={design:['a','b','c'].includes(params.get('design'))?params.get('design'):'a',selected:'france',amount:3000,repeat:false,view:'political',relationsOpen:false};
const view={position:1};let cleanup;
const money=n=>'$'+n.toLocaleString('en-US');

function grantArt(amount){
 const id='grant-'+amount,coin=(x,y)=>`<g stroke="#795023" stroke-width=".7"><path d="M${x-5} ${y}v2a5 2 0 0 0 10 0v-2" fill="#b88332"/><ellipse cx="${x}" cy="${y}" rx="5" ry="2" fill="url(#${id}-gold)"/></g>`;
 let art;
 if(amount<5000){
  const purse=(x,y,scale)=>`<g transform="translate(${x} ${y}) scale(${scale})"><path d="m-8-17 4 9c-10 7-14 18-9 25 4 6 23 7 28 0 5-7 0-18-10-25l4-9-7 2-4-3-6 3Z" fill="url(#${id}-leather)" stroke="#5e391b" stroke-width="1.6"/><path d="M-5-7h10m-9 1-4 19m13-18 5 17" fill="none" stroke="#e8ba66" stroke-width="1.6"/><path d="m-6-8 4 2 9-2" fill="none" stroke="#ffe6a5" stroke-width="2"/><circle cx="1" cy="8" r="5" fill="#9c4629" stroke="#f1cb7a"/><path d="m-2 8 2 2 4-5" fill="none" stroke="#f6dd99"/></g>`;
  art=amount===1000?purse(34,35,.9)+coin(48,53):purse(45,32,.7)+purse(29,39,.9)+coin(48,54)+coin(54,51);
 }else{
  art=`<g stroke="#64401f" stroke-width="1.2" stroke-linejoin="round"><path d="m14 33 14-9 31 8-12 10Z" fill="#ae7940"/><path d="m14 33 33 9v19l-33-9Z" fill="url(#${id}-wood)"/><path d="m47 42 12-10v19l-12 10Z" fill="#6a3e24"/><path d="m20 35 5 1v19l-5-1Zm19 5 4 1v19l-4-1Z" fill="url(#${id}-gold)"/><path d="m14 43 33 9m-33-4 33 9" opacity=".4"/>`;
  art+=amount===5000?`<path d="M14 33v-7q16-13 33 1v15Z" fill="url(#${id}-wood)"/><path d="m47 27 12-9v14L47 42Z" fill="#6a3e24"/><path d="m14 26 14-9q16-7 31 1l-12 9q-17-13-33-1Z" fill="#b68b51"/><path d="M20 23v12l5 1V22m14 2v16l4 1V25" fill="none" stroke="#d9b064" stroke-width="3"/>`:`<path d="m15 29-4-15 14-8 30 9 4 15-12 5Z" fill="url(#${id}-wood)"/><path d="m15 29 32 6 12-5-31-8Z" fill="#312a20"/><path d="m17 12 4 14m20-8 4 14" stroke="#e0b966" stroke-width="3"/>`;
  art+=`<path d="m31 41 6 2v8l-6-2Z" fill="#e1bc6c"/><circle cx="34" cy="46" r="1" fill="#47371f"/></g>`;
  if(amount===10000)art+=coin(24,31)+coin(36,33)+coin(45,34)+coin(31,30)+coin(39,30)+coin(52,59)+coin(58,56);
 }
 return `<svg class="grant-art" viewBox="0 0 72 72" aria-hidden="true"><defs><linearGradient id="${id}-gold" x2=".5" y2="1"><stop stop-color="#ffedb1"/><stop offset=".5" stop-color="#d6a24c"/><stop offset="1" stop-color="#8d5f2c"/></linearGradient><linearGradient id="${id}-leather" x2="1" y2=".6"><stop stop-color="#edc176"/><stop offset=".45" stop-color="#bb853b"/><stop offset="1" stop-color="#7b4f27"/></linearGradient><linearGradient id="${id}-wood" x2="0" y2="1"><stop stop-color="#bf8649"/><stop offset="1" stop-color="#794624"/></linearGradient></defs><circle class="selection-ring" cx="36" cy="36" r="35" fill="none" stroke="#e2b65f" stroke-width="2"/><circle cx="36" cy="36" r="32" fill="#0d3544" stroke="url(#${id}-gold)" stroke-width="3"/><circle cx="36" cy="36" r="28" fill="none" stroke="#a88549" stroke-width=".6" stroke-dasharray="1 3"/>${art}<g class="selected-tick"><circle cx="60" cy="59" r="8" fill="#f0d08b" stroke="#63451e"/><path d="m56 59 3 3 5-6" stroke="#543d20" fill="none" stroke-width="2"/></g></svg>`;
}
function amounts(){return `<fieldset class="grant-amounts"><legend>Choose a grant</legend><div class="amounts">${[1000,3000,5000,10000].map(amount=>`<button class="amount" data-amount="${amount}" aria-label="${money(amount)}" aria-pressed="${state.amount===amount}">${grantArt(amount)}<span>${money(amount)}</span></button>`).join('')}</div></fieldset>`;}
function recurring(){return `<div class="recurring"><div class="recurring-control"><span>Recurring grant</span><button role="switch" data-repeat aria-checked="${state.repeat}" aria-label="Recurring grant"><span class="toggle-track"><span class="toggle-word">${state.repeat?'On':'Off'}</span><span class="toggle-knob"></span></span></button></div><p>${state.repeat?'Give this amount every turn':'Give this amount once'}</p></div>`;}
function relations(){
 const markers=majorPowerRelations(game,state.selected).sort((a,b)=>a.position-b.position),lanes=[];
 for(const m of markers){let row=lanes.findIndex(last=>m.position-last>14);if(row<0)row=lanes.length;lanes[row]=m.position;m.row=row;}
 return `<details class="relations-disclosure" ${state.relationsOpen?'open':''}><summary>Relations with major powers</summary><div class="relations-chart" style="--rows:${lanes.length}"><div class="relation-scale"></div>${markers.map(m=>`<span class="relation-marker" style="left:${m.position}%;--row:${m.row}" title="${m.name}: ${m.description}" aria-label="${m.name}: ${m.description}">${nationEmblem(m.id,m.color)}</span>`).join('')}</div><div class="relation-labels"><span>Hostile</span><span>Warm</span></div></details>`;
}
function recipient(){return `<section class="recipient"><div class="nation-identity"><div class="portrait">${envoyPortrait(state.selected)}</div><div class="nation-name"><small>Selected nation</small><h2>${nationEmblem(state.selected,game.nations[state.selected]?.color)}${countryName(game,state.selected)}</h2></div></div>${relations()}</section>`;}
function map(){const tools=`<div class="map-views" aria-label="Map view">${[['political','Political control'],['relations','Relations'],['partners','Trade partners']].map(([value,label])=>`<button data-view="${value}" aria-pressed="${state.view===value}">${label}</button>`).join('')}</div>`;return `<section class="map-frame">${diplomacyMap(game,state.selected,{view:state.view,tools})}</section>`;}
function hint(){return `<p class="order-hint">Choose an amount, then tap a nation on the map</p>`;}
function header(){return `<header class="royal-header"><div class="empire">${nationEmblem('england',game.nations.england.color)}<span>England<small>${game.year??1500}</small></span></div><h1>Diplomacy</h1><div class="treasury"><small>Treasury</small><span>${money(game.nations.england.money??game.nations.england.cash??12000)}</span></div></header><nav class="diplomacy-tabs" aria-label="Diplomacy sections">${[['Treaties','diplomacy'],['Subsidies','trade'],['Grants','reports'],['Info','help']].map(([name,icon])=>`<button ${name==='Grants'?'aria-current="page"':'disabled title="Grants design preview"'}>${royalIcon(icon)}<span>${name}</span></button>`).join('')}</nav>`;}
function composition(){
 if(state.design==='a')return `<div class="composition composition-a"><aside class="cabinet paper"><h2 class="panel-title">Royal grants</h2>${recipient()}${amounts()}${recurring()}${hint()}</aside>${map()}</div>`;
 if(state.design==='b')return `<div class="composition composition-b">${map()}<section class="command-bar paper">${recipient()}${amounts()}${recurring()}${hint()}</section></div>`;
 return `<div class="composition composition-c"><section class="dispatch paper">${recipient()}${amounts()}${recurring()}${hint()}</section>${map()}</div>`;
}
function render(focus){
 cleanup?.();document.body.dataset.design=state.design;
 document.querySelector('#app').innerHTML=`<div class="page-frame">${header()}${composition()}</div>`;
 for(const b of document.querySelectorAll('button[data-design]'))b.setAttribute('aria-pressed',String(b.dataset.design===state.design));
 const directory=document.querySelector('.atlas-directory'),key=directory.querySelector('.atlas-key'),details=document.createElement('details');details.className='country-directory';details.innerHTML='<summary>Choose a nation</summary>';details.append(key);directory.replaceWith(details);
 cleanup=mountDiplomacyViewport(document.querySelector('.map-frame'),view);
 document.querySelector('.relations-disclosure').addEventListener('toggle',e=>state.relationsOpen=e.currentTarget.open);
 if(focus)document.querySelector(focus)?.focus({preventScroll:true});
}
document.addEventListener('click',e=>{
 const b=e.target.closest('button,[data-action="diplomacyCountry"]');if(!b)return;
 if(b.dataset.design){state.design=b.dataset.design;state.relationsOpen=false;history.replaceState(null,'','?design='+state.design);render();return;}
 if(b.dataset.amount){state.amount=Number(b.dataset.amount);render(`[data-amount="${state.amount}"]`);return;}
 if(b.hasAttribute('data-repeat')){state.repeat=!state.repeat;render('[data-repeat]');return;}
 if(b.dataset.view){state.view=b.dataset.view;render(`[data-view="${state.view}"]`);return;}
 if(b.dataset.action==='diplomacyCountry'){state.selected=JSON.parse(b.dataset.args).id;view.focus=state.selected;render();}
});
document.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)&&e.target.matches('.atlas-country')){e.preventDefault();e.target.dispatchEvent(new MouseEvent('click',{bubbles:true}));}});
render();

