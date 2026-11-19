import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
export const root=fileURLToPath(new URL('../',import.meta.url));
export function syncMain(){
 const env={...process.env,GIT_TERMINAL_PROMPT:'0',GCM_INTERACTIVE:'never'};
 const run=(...args)=>spawnSync('git',args,{cwd:root,env,encoding:'utf8',windowsHide:true,timeout:120000});
 const status=run('status','--porcelain');
 if(status.status!==0){console.warn('Git is unavailable; using the current working files.');return false;}
 if(status.stdout.trim()){console.log('Local edits are present: keeping them and skipping the pull.');return false;}
 if(run('branch','--show-current').stdout.trim()!=='main'){console.log('Working on a branch: launching its files without switching branches.');return false;}
 const result=run('pull','--ff-only','origin','main');
 if(result.status!==0){console.warn('Could not fast-forward from GitHub. Local files are preserved; launching the current checkout.');return false;}
 console.log(result.stdout.trim()||'Up to date with GitHub.');return true;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1])syncMain();
