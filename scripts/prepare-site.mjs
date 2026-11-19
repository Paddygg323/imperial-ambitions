// Copies the canonical adapter into an already-opened Sites deployment checkout.
// Sites credentials, packaging and deployment remain owned by the Sites helper.
import {readFile,writeFile,mkdir,rm,cp,realpath,lstat} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
import {root} from './sync.mjs';
const checkout=await realpath(process.argv[2]||'.');
const manifestPath=resolve(checkout,'.openai/hosting.json');
const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
if(manifest.project_id!=='appgprj_6afcc3b78e2c8191b7011d8d184a4ed9')throw Error('This is not the existing public play Site.');
const dist=resolve(checkout,'dist');
if(relative(checkout,dist)!=='dist')throw Error('Invalid deployment output path.');
try{if((await lstat(dist)).isSymbolicLink())throw Error('Refusing linked deployment output.');}catch(e){if(e.code!=='ENOENT')throw e;}
// Old artifacts are retained in the Site's Git history and live deployment.
await rm(dist,{recursive:true,force:true});
delete manifest.static;
await writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');
await mkdir(resolve(checkout,'worker'),{recursive:true});
await mkdir(resolve(dist,'server'),{recursive:true});
await mkdir(resolve(dist,'.openai'),{recursive:true});
await cp(resolve(root,'deploy/proxy-worker.mjs'),resolve(checkout,'worker/index.mjs'));
await cp(resolve(root,'deploy/proxy-worker.mjs'),resolve(dist,'server/index.js'));
await cp(manifestPath,resolve(dist,'.openai/hosting.json'));
await writeFile(resolve(checkout,'README.md'),'# Generated Imperial Ambitions play adapter\n\nCanonical source: https://github.com/Paddygg323/imperial-ambitions, deploy/proxy-worker.mjs.\nThe game is published automatically to the public runtime mirror. Do not edit game source in this deployment checkout.\n');
console.log('Prepared the existing play URL adapter from the main Git checkout.');
