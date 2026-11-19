import test from 'node:test';
import assert from 'node:assert/strict';
import worker,{serveGame} from '../../deploy/proxy-worker.mjs';
test('Worker entry point accepts the hosting environment separately from fetch',async(t)=>{
 t.mock.method(globalThis,'fetch',async()=>new Response('game'));
 const result=await worker.fetch(new Request('https://play.example/'),{},{});
 assert.equal(result.status,200);assert.equal(await result.text(),'game');
});
test('stable play origin serves modules without leaking cookies, auth or query data',async()=>{
 const result=await serveGame(new Request('https://play.example/app.mjs?private=ignored',{headers:{Cookie:'save=private',Authorization:'Bearer private'}}),async(url,options)=>{
  assert.equal(url,'https://paddygg323.github.io/imperial-ambitions-web/app.mjs');
  assert.equal(options.headers,undefined);return new Response('export const ready=true;');
 });
 assert.equal(result.status,200);assert.match(result.headers.get('Content-Type'),/javascript/);assert.equal(result.headers.get('Location'),null);assert.equal(result.headers.get('Set-Cookie'),null);
});
test('proxy refuses writes and private project paths and reports upstream failures',async()=>{
 const noFetch=()=>{throw Error('Unexpected fetch');};
 assert.equal((await serveGame(new Request('https://play.example/',{method:'POST'}),noFetch)).status,405);
 assert.equal((await serveGame(new Request('https://play.example/.git/config'),noFetch)).status,404);
 assert.equal((await serveGame(new Request('https://play.example/README.md'),noFetch)).status,404);
 assert.equal((await serveGame(new Request('https://play.example/'),async()=>{throw Error('offline');})).status,503);
});
