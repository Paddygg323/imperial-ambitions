import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
import {root,syncMain} from './sync.mjs';
const sprites=process.argv.includes('--sprites');
if(!process.argv.includes('--no-sync'))syncMain();
const sourceRoot=resolve(root,sprites?'outputs/sprite-library-review':'game');
const url='http://127.0.0.1:'+(sprites?8790:8774)+'/';
async function probe(){try{return await (await fetch(url+'__project',{signal:AbortSignal.timeout(1200)})).json();}catch{return null;}}
let state=await probe();
if(!state){
 const child=spawn(process.execPath,[resolve(sourceRoot,sprites?'serve.cjs':'server.cjs')],{cwd:root,detached:true,windowsHide:true,stdio:'ignore'});child.unref();
 for(let i=0;i<40&&!state;i++){await new Promise(r=>setTimeout(r,200));state=await probe();}
}
if(!state||resolve(state.sourceRoot??'').toLowerCase()!==sourceRoot.toLowerCase())throw Error('The preview port is occupied or the correct repository server could not start. No existing process was stopped.');
console.log('Serving the GitHub working copy: '+sourceRoot+'\n'+url);
if(!process.argv.includes('--no-open')){
 const command=process.platform==='win32'?['cmd.exe',['/c','start','',url]]:process.platform==='darwin'?['open',[url]]:['xdg-open',[url]];
 const child=spawn(command[0],command[1],{detached:true,windowsHide:true,stdio:'ignore'});child.unref();
}
