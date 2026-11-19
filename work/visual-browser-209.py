from pathlib import Path
p=Path('game/test/visual-orders-browser.mjs');base=Path('game/test/visual-review.mjs').read_text();s=base[:base.index('for(const width')]+'''
const saved=()=>page.evaluate(()=>localStorage.getItem('imp2-rebuild-v3'));
const before=await saved();
await page.locator('#mapOnly').tap();assert.ok(await page.locator('body').evaluate(e=>e.classList.contains('map-only')));
assert.ok((await page.locator('#map').boundingBox()).height>=900);
await page.touchscreen.tap(200,400);assert.ok(!await page.locator('body').evaluate(e=>e.classList.contains('map-only')));assert.equal(await saved(),before);
// Direct tap on the Thames sea exit, relative to London at local focus.
let box=await page.locator('#map').boundingBox();
await page.touchscreen.tap(box.x+box.width/2+108,box.y+box.height/2-2*54*.866);
assert.equal(await page.locator('#panelTitle').innerText(),'Navy');assert.ok(await page.locator('[data-action=selectShip]').filter({hasText:'✓'}).count()>0);
await page.getByRole('button',{name:'Choose on map',exact:true}).tap();
assert.equal(await page.locator('#panel').evaluate(e=>e.open),false);
// Home camera gives a reproducible nearby sea target; choose the home exit sea.
await page.locator('#home').tap();box=await page.locator('#map').boundingBox();
await page.touchscreen.tap(box.x+box.width/2+108,box.y+box.height/2-2*54*.866);
assert.equal(await page.locator('#panelTitle').innerText(),'Navy');
assert.equal(await saved(),before,'Choosing a destination does not issue an order');
await page.getByRole('button',{name:'Sail selected ships',exact:true}).tap();
const after=JSON.parse(await saved());assert.ok(after.ships.filter(s=>s.owner==='england').every(s=>s.order?.job==='sail'));
await page.screenshot({path:'outputs/visual-review/fleet-orders.png'});
await page.locator('#closePanel').tap();await page.locator('[data-panel=research]').tap();
const cards=await page.locator('.technology-card').count();assert.ok(cards>=8);
assert.ok(await page.locator('.technology-card').first().getByRole('button',{name:'Research',exact:true}).isEnabled());
await page.locator('.technology-card').first().locator('summary').tap();assert.match(await page.locator('.technology-card').first().innerText(),/Requires:/);
assert.deepEqual(errors,[]);console.log('PASS: map-only restoration preserves save; direct sea fleet selection, map destination confirmation then real sailing order; compact research retains prerequisites.');
}finally{await browser.close();}
''';p.write_text(s)
