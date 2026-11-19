from pathlib import Path
p=Path('game/test/visual-orders-browser.mjs');s=p.read_text();key="assert.deepEqual(errors,[]);console.log(";i=s.index(key)
s=s[:i]+'''// Foreign knowledge uses actual countries, excludes our own, and leaves research controls usable.
await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('imp2-rebuild-v3'));s.nations.france.known.push('7');localStorage.setItem('imp2-rebuild-v3',JSON.stringify(s));});
await page.reload();await page.waitForFunction(()=>document.querySelector('#heading').textContent.includes('1500'));
await page.locator('[data-panel=research]').tap();
const mine=page.locator('.technology-card').filter({hasText:'Mine Engineering'});assert.ok(await mine.locator('.knowledge-flag[aria-label^="France"]').count());assert.equal(await mine.locator('.knowledge-flag[aria-label^="England"]').count(),0);
await mine.getByRole('button',{name:'Research',exact:true}).tap();
assert.ok(JSON.parse(await saved()).nations.england.projects.some(p=>p.tech==='7'));
await page.screenshot({path:'outputs/visual-review/research-active-flags.png'});
'''+s[i:];p.write_text(s)
