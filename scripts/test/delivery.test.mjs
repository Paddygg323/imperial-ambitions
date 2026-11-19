import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
const {createStaticServer}=createRequire(import.meta.url)('../static-server.cjs');
test('publication contains the game and excludes private project and test files',async()=>{
 const build=JSON.parse(await readFile('dist/build-info.json','utf8'));
 assert.match(build.revision,/^[a-f0-9]{40}$/);assert.ok(build.files>300);
 for(const file of Object.keys(build.hashes))assert.ok(!/(^|\/)(test|outputs|docs|android|work|\.git)(\/|$)|\.(keystore|pem|key|cjs|py)$/.test(file),file);
 const top=await readdir('dist');assert.ok(top.includes('index.html'));assert.ok(!top.includes('README.md'));
 const sw=await readFile('dist/sw.js','utf8');assert.ok(sw.includes(build.revision.slice(0,12)));
 assert.ok(sw.includes('FILES.push(...['),'new assets are included in the published offline cache');
});
test('preview serves canonical bytes uncached and cannot expose the parent project',async()=>{
 const server=createStaticServer({root:resolve('game'),project:'imperial-ambitions'});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url='http://127.0.0.1:'+server.address().port;
 try{
  const identity=await (await fetch(url+'/__project')).json();assert.equal(identity.sourceRoot,resolve('game'));
  const page=await fetch(url+'/');assert.equal(page.headers.get('cache-control'),'no-store');assert.equal(await page.text(),await readFile('game/index.html','utf8'));
  assert.notEqual((await fetch(url+'/%2e%2e%5cREADME.md')).status,200);
  assert.equal((await fetch(url+'/',{method:'POST'})).status,405);
 }finally{await new Promise(r=>server.close(r));}
});
