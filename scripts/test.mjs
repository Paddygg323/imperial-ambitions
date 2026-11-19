import {readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
const files=(await readdir('game/test')).filter(f=>f.endsWith('.test.mjs')).sort().map(f=>'game/test/'+f);
console.log('Running '+files.length+' unit-test files');
const result=spawnSync(process.execPath,['--test','--test-concurrency=2',...files],{stdio:'inherit'});
if(result.error)console.error(result.error);
process.exit(result.status??1);
