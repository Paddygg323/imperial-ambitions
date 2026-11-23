import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewedSpriteKey,reviewedDepositKey,landBlendAlpha,containedSpriteAlpha,featureFrame,DEPOSIT_SCALE,DEPOSIT_WIDTH,DEPOSIT_HEIGHT} from '../reviewed-sprites.mjs';
test('tin is hidden until prospecting and each development level selects its approved art',()=>{
 const t={terrain:9,resource:'tin',x:4,y:4,level:0};assert.equal(reviewedSpriteKey(t,null),'005');assert.equal(reviewedSpriteKey(t,'tin'),'005');
 assert.equal(reviewedDepositKey(t,null),null);assert.equal(reviewedDepositKey(t,'tin'),'ore-tin');
 for(let level=1;level<=4;level++)assert.equal(reviewedSpriteKey({...t,level},'tin'),`019-level${level}`);
});
test('deposit overlays preserve underlying terrain and conceal undiscovered resources',()=>{
 for(const resource of ['iron','copper','coal']){
  const t={terrain:8,resource,x:1,y:1,level:0};
  assert.equal(reviewedSpriteKey(t,resource),'004');
  assert.equal(reviewedDepositKey(t,null),null);
  assert.equal(reviewedDepositKey(t,resource),'ore-'+resource);
 }
 assert.equal(reviewedDepositKey({level:2},'tin'),null);
 assert.equal(DEPOSIT_SCALE,.85);
 assert.ok(Math.abs(DEPOSIT_WIDTH/(1.1*634/900)-.85)<1e-12);
 assert.ok(Math.abs(DEPOSIT_HEIGHT/(1.272*380/980)-.85)<1e-12);
});
test('grain progression and flowerless majority are deterministic without modifying state',()=>{
 const t={terrain:4,x:4,y:4};for(let level=0;level<=4;level++)assert.equal(reviewedSpriteKey({...t,level},'grain'),`010-level-${level}`);
 let flower=0;for(let y=0;y<100;y++)for(let x=0;x<100;x++)if(reviewedSpriteKey({terrain:0,x,y},null).includes('flower'))flower++;
 assert.ok(flower>0&&flower<500);assert.deepEqual(t,{terrain:4,x:4,y:4});
});
test('sheep use exactly the same terrain layer as bare hills',()=>{
 for(const terrain of [6,7]){
  const t={terrain,x:5,y:8,level:0};
  assert.equal(reviewedSpriteKey(t,'wool'),reviewedSpriteKey(t,null));
  assert.equal(reviewedSpriteKey(t,'wool'),'003-r1');
 }
});
test('every land edge exposes shared grass while the terrain centre remains opaque',()=>{
 // Shared edges of the game hex in the prepared sprite coordinate system.
 for(let i=0;i<6;i++){
  const angle=(i*60-30)*Math.PI/180;
  const next=(i*60+30)*Math.PI/180;
  for(let n=0;n<=10;n++){
   const t=n/10,u=(Math.cos(angle)*(1-t)+Math.cos(next)*t)*.57735/.55;
   const v=(Math.sin(angle)*(1-t)+Math.sin(next)*t)*.57735/.636;
   assert.equal(landBlendAlpha(u,v),0);
  }
 }
 assert.equal(landBlendAlpha(0,0),1);
});

test('transparent subjects fit every hex edge without losing their silhouettes',()=>{
 const width=71,height=83,pixels=new Uint8ClampedArray(width*height*4);
 const points=[[3,4],[66,17],[12,72],[64,76],[50,9],[22,40]];
 for(const [x,y] of points)pixels[(y*width+x)*4+3]=255;
 const before=pixels.slice(),frame=featureFrame(pixels,width,height);
 for(const scale of [20,35,78,110])for(const [x,y] of points){
  const size=scale*.88/frame.extent,dx=Math.abs((x+.5-frame.x)*size)+size/2,dy=Math.abs((y+.5-frame.y)*size)+size/2;
  assert.ok(dx<scale/2,'complete pixel inside vertical sides');
  assert.ok(dx+Math.sqrt(3)*dy<scale,'complete pixel inside diagonal sides');
 }
 assert.deepEqual(pixels,before,'measuring must never erase source pixels');
 const empty=featureFrame(new Uint8ClampedArray(16),2,2);assert.ok(empty.extent>0);
});

test('resource masking preserves opaque subjects near the rim and removes sheet framing',()=>{
 // These positions were partially erased by the former .045-wide fade.
 for(const [u,v] of [[.93,0],[0,.93],[.5,.68]])assert.equal(containedSpriteAlpha(u,v),1);
 assert.equal(containedSpriteAlpha(1,0),0);
 assert.equal(containedSpriteAlpha(.94,0,.935),0,'gold presentation frame is excluded');
 assert.equal(containedSpriteAlpha(.92,0,.935),1,'nearby plants and animals are retained');
});
