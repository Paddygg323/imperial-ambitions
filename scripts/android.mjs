import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {root} from './sync.mjs';
import {resolve} from 'node:path';
let config={};try{config=JSON.parse(await readFile(resolve(root,'work/android-local.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
const env={...process.env};
for(const key of ['JAVA_HOME','IMP_ANDROID_TOOLCHAIN','IMP_ANDROID_SDK','IMP_BUNDLETOOL','IMP_DEVELOPMENT_KEYSTORE'])if(!env[key]&&config[key])env[key]=config[key];
const python=env.PYTHON_BIN||config.PYTHON_BIN||'python';
const script=process.argv.includes('--bundle')?'bundle.py':'build.py';
const result=spawnSync(python,['-X','utf8',resolve(root,'android/scripts',script)],{cwd:root,env,stdio:'inherit',windowsHide:true});
if(result.error)console.error(result.error.message);process.exit(result.status??1);
