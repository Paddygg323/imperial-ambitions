// Runs only in the trusted main-branch workflow. The key can write only to the
// public runtime mirror; it cannot read/write the private source repository.
import {mkdtemp,writeFile,cp,rm} from 'node:fs/promises';
import {join,resolve,relative} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {root} from './sync.mjs';
if(!process.env.WEB_DEPLOY_KEY)throw Error('Missing the runtime mirror deploy key.');
const temporary=await mkdtemp(join(tmpdir(),'imperial-web-publish-'));
const checkout=join(temporary,'checkout'),key=join(temporary,'deploy-key'),hosts=join(temporary,'known_hosts');
const quote=s=>"'"+s.replaceAll("'","'\\''")+"'";
try{
 await writeFile(key,process.env.WEB_DEPLOY_KEY.trim()+'\n',{mode:0o600});
 const response=await fetch('https://api.github.com/meta',{headers:{'User-Agent':'Imperial-Ambitions-publisher'}});
 if(!response.ok)throw Error('Could not obtain GitHub host keys.');
 const meta=await response.json();if(!meta.ssh_keys?.length)throw Error('GitHub returned no host keys.');
 await writeFile(hosts,meta.ssh_keys.map(k=>'github.com '+k).join('\n')+'\n');
 const env={...process.env,GIT_TERMINAL_PROMPT:'0',GIT_SSH_COMMAND:'ssh -i '+quote(key)+' -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile='+quote(hosts)};
 delete env.WEB_DEPLOY_KEY;
 function git(args,cwd=checkout){const r=spawnSync('git',args,{cwd,env,encoding:'utf8',windowsHide:true});if(r.status!==0)throw Error('Git '+args[0]+' failed: '+r.stderr);return r.stdout.trim();}
 git(['clone','git@github.com:Paddygg323/imperial-ambitions-web.git',checkout],temporary);
 git(['checkout','-B','main']);
 git(['rm','-r','--ignore-unmatch','.']);
 await cp(resolve(root,'dist'),checkout,{recursive:true});
 await writeFile(join(checkout,'README.md'),'# Imperial Ambitions web build\n\nGenerated playable game only. Edit the main private project, not this deployment mirror.\n');
 git(['add','.']);
 if(git(['status','--porcelain'])){
  git(['-c','user.name=Imperial Ambitions publisher','-c','user.email=publisher@users.noreply.github.com','commit','-m','Publish game from '+(process.env.GITHUB_SHA||'verified checkout')]);
  git(['push','origin','main']);
 }
 console.log('Published game-only mirror: '+git(['rev-parse','HEAD']));
}finally{
 if(relative(tmpdir(),temporary).startsWith('imperial-web-publish-'))await rm(temporary,{recursive:true,force:true});
}
