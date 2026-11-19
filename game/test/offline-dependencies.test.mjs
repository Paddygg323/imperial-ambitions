import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

test('offline installation submits no duplicate requests to Cache.addAll',async()=>{
 const handlers={};let cached;
 vm.runInNewContext(readFileSync(new URL('../sw.js',import.meta.url),'utf8'),{
  self:{addEventListener(type,handler){handlers[type]=handler;}},
  caches:{async open(){return {async addAll(files){cached=files;assert.equal(new Set(files).size,files.length);}};}}
 });
 let installation;handlers.install({waitUntil(p){installation=p;}});await installation;
 assert.ok(cached.length>100);
});

test('offline install precaches the complete reachable game module graph',()=>{
 const root=fileURLToPath(new URL('../',import.meta.url));
 const files=vm.runInNewContext(readFileSync(resolve(root,'sw.js'),'utf8')+'\nFILES',{self:{addEventListener(){}}});
 const cached=new Set(files.map(f=>resolve(root,f))),visited=new Set();
 function visit(path){
  if(visited.has(path))return;visited.add(path);
  assert.ok(existsSync(path),`Missing source ${path}`);
  assert.ok(cached.has(path),`Not precached: ${path}`);
  const source=readFileSync(path,'utf8');
  for(const match of source.matchAll(/(?:from\s*|import\s*\(\s*|import\s*)['"](\.[^'"]+\.mjs)['"]/g))visit(resolve(dirname(path),match[1]));
 }
 visit(resolve(root,'app.mjs'));assert.ok(visited.size>100);
});
