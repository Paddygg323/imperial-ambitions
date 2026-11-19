import {readdir,readFile,writeFile,mkdir,rm,lstat} from 'node:fs/promises';
import {resolve,relative,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root=fileURLToPath(new URL('../',import.meta.url));
const game=resolve(root,'game'),dist=resolve(root,'dist');
// This is the publication boundary: only game runtime files, never the repo root.
const extensions=new Set(['.html','.css','.mjs','.js','.json','.webmanifest','.svg','.png','.jpg','.jpeg','.webp','.gif','.woff','.woff2','.ogg','.mp3','.wav']);
async function collect(dir){
 const result=[];
 for(const entry of await readdir(dir,{withFileTypes:true})){
  if(entry.name.startsWith('.')||['test','node_modules'].includes(entry.name))continue;
  const path=resolve(dir,entry.name);
  if(entry.isSymbolicLink())throw Error('Publication refuses symbolic links: '+relative(game,path));
  if(entry.isDirectory())result.push(...await collect(path));
  else if(extensions.has(extname(path)))result.push(relative(game,path).replaceAll('\\','/'));
 }return result.sort();
}
const git=spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8',windowsHide:true});
if(git.status!==0)throw Error('Build must run from the canonical Git checkout.');
const revision=git.stdout.trim();
const status=spawnSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8',windowsHide:true});
const dirty=!!status.stdout.trim();
if(process.argv.includes('--release')&&dirty)throw Error('Release builds require a clean committed checkout.');
if(relative(root,dist)!=='dist')throw Error('Unexpected output directory.');
try{if((await lstat(dist)).isSymbolicLink())throw Error('Refusing to replace a linked output directory.');}catch(e){if(e.code!=='ENOENT')throw e;}
await rm(dist,{recursive:true,force:true});await mkdir(dist,{recursive:true});
const paths=await collect(game),hashes={};
for(const name of paths){
 let bytes=await readFile(resolve(game,name));
 if(name==='sw.js'){
  let source=bytes.toString('utf8').replace(/const CACHE='[^']+';/,"const CACHE='imperialism-rebuild-git-"+revision.slice(0,12)+"';");
  source=source.replace("self.addEventListener('install'",'FILES.push(...'+JSON.stringify(paths.filter(p=>p!=='sw.js'))+');\nself.addEventListener(\'install\'');
  bytes=Buffer.from(source);
 }
 const target=resolve(dist,name);await mkdir(resolve(target,'..'),{recursive:true});await writeFile(target,bytes);
 hashes[name]=createHash('sha256').update(bytes).digest('hex');
}
await writeFile(resolve(dist,'.nojekyll'),'');
const info={revision,dirty,files:paths.length,source:'game/',hashes};
await writeFile(resolve(dist,'build-info.json'),JSON.stringify(info,null,2)+'\n');
console.log(JSON.stringify({directory:'dist',revision,dirty,runtimeFiles:paths.length}));
