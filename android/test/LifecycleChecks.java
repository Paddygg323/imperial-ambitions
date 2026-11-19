package com.paddy.imperialism.rebuild.tests;

import android.app.Activity;
import android.app.Instrumentation;
import android.content.Intent;
import android.os.Bundle;
import android.webkit.WebView;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

/** Disposable emulator tests. Never run against the player's physical device. */
public final class LifecycleChecks extends Instrumentation {
 private Activity activity;private WebView web;private String mode;
 @Override public void onCreate(Bundle args){super.onCreate(args);mode=args.getString("mode","prepare");start();}
 private void require(boolean condition,String message){if(!condition)throw new AssertionError(message);}
 private boolean isForeground(){
  android.view.accessibility.AccessibilityNodeInfo root=getUiAutomation().getRootInActiveWindow();
  return root!=null&&getTargetContext().getPackageName().contentEquals(root.getPackageName()==null?"":root.getPackageName());
 }
 private void requireForeground(){require(isForeground(),"Validation stopped: another app is active. No input or screenshot is permitted.");}
 private String js(String code)throws Exception{
  requireForeground();
  CountDownLatch done=new CountDownLatch(1);AtomicReference<String> value=new AtomicReference<>();
  runOnMainSync(()->web.evaluateJavascript(code,v->{value.set(v);done.countDown();}));
  if(!done.await(60,TimeUnit.SECONDS))throw new AssertionError("JavaScript timed out: "+code);
  return value.get();
 }
 private void until(String code)throws Exception{for(int i=0;i<120;i++){if("true".equals(js(code)))return;Thread.sleep(250);}throw new AssertionError("Condition timed out: "+code);}
 private String snapshot()throws Exception{return js("(()=>{const s=localStorage.getItem('imp2-rebuild-v3');let h=0;for(let i=0;i<s.length;i++)h=(Math.imul(h,31)+s.charCodeAt(i))|0;return s.length+':'+h})()");}
 private void tapPoint(double cssX,double cssY)throws Exception{
  requireForeground();
  int[] location=new int[2];AtomicReference<Double> width=new AtomicReference<>();runOnMainSync(()->{web.getLocationOnScreen(location);width.set((double)web.getWidth());});
  double scale=width.get()/Double.parseDouble(js("innerWidth"));float x=(float)(location[0]+cssX*scale),y=(float)(location[1]+cssY*scale);long now=android.os.SystemClock.uptimeMillis();
  android.view.MotionEvent down=android.view.MotionEvent.obtain(now,now,android.view.MotionEvent.ACTION_DOWN,x,y,0),up=android.view.MotionEvent.obtain(now,now+80,android.view.MotionEvent.ACTION_UP,x,y,0);
  down.setSource(android.view.InputDevice.SOURCE_TOUCHSCREEN);up.setSource(android.view.InputDevice.SOURCE_TOUCHSCREEN);sendPointerSync(down);sendPointerSync(up);down.recycle();up.recycle();waitForIdleSync();
 }
 private void tapElement(String expression)throws Exception{
  js("("+expression+").scrollIntoView({block:'center'})");
  org.json.JSONObject b=new org.json.JSONObject(js("(()=>{const b=("+expression+").getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2}})()"));tapPoint(b.getDouble("x"),b.getDouble("y"));
 }
 private void backAndStay()throws Exception{
  requireForeground();
  sendKeyDownUpSync(android.view.KeyEvent.KEYCODE_BACK);boolean shown=false;
  for(int i=0;i<30;i++){android.view.accessibility.AccessibilityNodeInfo root=getUiAutomation().getRootInActiveWindow();if(root!=null&&!root.findAccessibilityNodeInfosByText("Leave the game?").isEmpty()){shown=true;break;}Thread.sleep(100);}
  require(shown,"Back did not offer a visible Leave/Stay prompt");screenshot(mode.equals("recoveryBack")?"recovery-exit.png":"market-exit.png");
  requireForeground();sendKeyDownUpSync(android.view.KeyEvent.KEYCODE_BACK);waitForIdleSync();
 }
 private void launch()throws Exception{
  runOnMainSync(()->WebView.setWebContentsDebuggingEnabled(true));
  Intent intent=new Intent().setClassName(getTargetContext(),"com.paddy.imperialism.rebuild.MainActivity").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
  activity=startActivitySync(intent);java.lang.reflect.Field field=activity.getClass().getDeclaredField("game");field.setAccessible(true);web=(WebView)field.get(activity);
  // Activity resume precedes the accessibility-window transition. Wait without
  // input/capture; never bring the app forward again if another app intervenes.
  for(int i=0;i<100&&!isForeground();i++)Thread.sleep(100);
  requireForeground();
  until("!!document.querySelector('#heading')&&document.querySelector('#heading').textContent.includes('1500')");
  until("!!document.querySelector('#cabinetPortrait h2')");
 }
 private void screenshot(String name)throws Exception{
  Thread.sleep(500); // Let the WebView compositor present the verified DOM state.
  requireForeground();
  android.graphics.Bitmap bitmap=getUiAutomation().takeScreenshot();require(bitmap!=null,"No screenshot");
  java.io.File file=new java.io.File(getTargetContext().getExternalFilesDir(null),name);
  try(java.io.FileOutputStream out=new java.io.FileOutputStream(file)){bitmap.compress(android.graphics.Bitmap.CompressFormat.PNG,100,out);}bitmap.recycle();
 }
 @Override public void onStart(){Bundle result=new Bundle();try{
  require(android.os.Build.FINGERPRINT.contains("generic")||android.os.Build.FINGERPRINT.contains("emulator")||android.os.Build.HARDWARE.equals("ranchu"),"Refusing to alter a physical phone");
  launch();
  if(mode.equals("prepare")){
   // A real funded research order through the shipped UI, not a state edit.
   js("document.querySelector('#navigation [data-panel=research]').click()");until("!!document.querySelector('[data-action=startResearch]')");
   js("document.querySelector('[data-action=startResearch]').click()");
   until("JSON.parse(localStorage.getItem('imp2-rebuild-v3')).nations.england.projects.length===1");
   require("true".equals(js("JSON.parse(localStorage.getItem('imp2-rebuild-v3')).nations.england.projects[0].funding>0")),"Research funding absent");
   sendKeyDownUpSync(android.view.KeyEvent.KEYCODE_BACK);until("!document.querySelector('#panel').open");
   js("localStorage.setItem('emulator-check-save',localStorage.getItem('imp2-rebuild-v3'))");
   screenshot("portrait.png");
   runOnMainSync(()->activity.setRequestedOrientation(android.content.pm.ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE));until("innerWidth>innerHeight");
   require("true".equals(js("document.documentElement.scrollWidth<=innerWidth")),"Landscape overflow");screenshot("landscape.png");
   runOnMainSync(()->activity.setRequestedOrientation(android.content.pm.ActivityInfo.SCREEN_ORIENTATION_PORTRAIT));until("innerHeight>innerWidth");
   js("document.querySelector('#navigation [data-panel=trade]').click()");until("!!document.querySelector('[data-action=tradeBid]')");
   for(String good:new String[]{"wood","iron","grain"})js("document.querySelectorAll('[data-action=tradeBid]').forEach(b=>{if(JSON.parse(b.dataset.args).good==='"+good+"')b.click()})");
   js("document.querySelector('#closePanel').click();document.querySelector('#endTurn').click();document.querySelector('[data-action=resolve]').click()");
   until("!!JSON.parse(localStorage.getItem('imp2-rebuild-v3')).market||!!JSON.parse(localStorage.getItem('imp2-rebuild-v3')).pendingDiplomacy");
   if("true".equals(js("!!JSON.parse(localStorage.getItem('imp2-rebuild-v3')).market"))){backAndStay();require("true".equals(js("document.querySelector('#panel').open")),"Back bypassed market");}
   js("localStorage.setItem('emulator-check-save',localStorage.getItem('imp2-rebuild-v3'))");
   // Stage the same file the native picker exports, then terminate the process
   // externally. The next test receives a simulated document-picker result.
   try(java.io.FileOutputStream out=new java.io.FileOutputStream(new java.io.File(getTargetContext().getFilesDir(),"expected-campaign.txt"))){out.write(snapshot().getBytes(java.nio.charset.StandardCharsets.UTF_8));out.getFD().sync();}
   java.lang.reflect.Method stage=activity.getClass().getDeclaredMethod("stageExport",String.class);stage.setAccessible(true);
   require(Boolean.TRUE.equals(stage.invoke(activity,"{\"emulatorExport\":242}")),"Could not stage pending export");
   result.putString("checks","API36 real WebView startup, funded research, native Back, rotation, market lock and staged export passed. Process restart check follows separately.");
  }else if(mode.equals("foregroundGuard")){
   // This branch is still protected by the emulator-only guard above.
   require(android.os.Build.FINGERPRINT.contains("generic")||android.os.Build.FINGERPRINT.contains("emulator")||android.os.Build.HARDWARE.equals("ranchu"),"Takeover fixture is emulator-only even in the isolated validation package");
   java.io.File unexpected=new java.io.File(getTargetContext().getExternalFilesDir(null),"must-not-capture.png");unexpected.delete();
   runOnMainSync(()->activity.startActivity(new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)));
   for(int i=0;i<100&&isForeground();i++)Thread.sleep(100);
   require(!isForeground(),"Emulator Home did not become active");
   boolean blockedJs=false,blockedTap=false,blockedCapture=false;
   try{js("localStorage.setItem('must-not-write','x')");}catch(AssertionError expected){blockedJs=true;}
   try{tapPoint(100,100);}catch(AssertionError expected){blockedTap=true;}
   try{screenshot("must-not-capture.png");}catch(AssertionError expected){blockedCapture=true;}
   require(blockedJs&&blockedTap&&blockedCapture&&!unexpected.exists(),"Foreground guard allowed a background operation");
   result.putString("checks","Emulator Home takeover blocks JavaScript, touchscreen input and screenshots before execution; no foreign-app image saved.");
  }else if(mode.equals("recoveryBack")){
   js("AndroidGame.writeSave('imp2-rebuild-v3','unreadable emulator fixture')");runOnMainSync(()->web.reload());until("!!document.querySelector('#saveRecovery[open]')");
   backAndStay();require("true".equals(js("document.querySelector('#saveRecovery').open")),"Back bypassed save recovery");require("\"unreadable emulator fixture\"".equals(js("AndroidGame.readSave('imp2-rebuild-v3')")),"Recovery altered original bytes");
   result.putString("checks","Android Back opens a visible Leave/Stay prompt during save recovery; cancelling the prompt preserves the recovery screen and original save.");
  }else if(mode.equals("touch")){
   // Inject Android touchscreen events, rather than invoking DOM click().
   tapElement("document.querySelector('#navigation [data-panel=civilians]')");until("!!document.querySelector('[data-action=selectCivilian]')");
   tapElement("Array.from(document.querySelectorAll('.civilian-row')).find(e=>e.textContent.includes('Engineer')).querySelector('[data-action=selectCivilian]')");until("!document.querySelector('#panel').open&&document.querySelector('#selection').textContent.includes('Engineer')");
   js("(async()=>{const {createGame}=await import('https://appassets.androidplatform.net/game/engine.mjs'),{neighbourIds}=await import('https://appassets.androidplatform.net/game/world.mjs'),{transportLink}=await import('https://appassets.androidplatform.net/game/transport-links.mjs'),{LOCAL_MAP_SCALE}=await import('https://appassets.androidplatform.net/game/map.mjs');const s=JSON.parse(localStorage.getItem('imp2-rebuild-v3'))??createGame({transportModel:'ports'}),u=s.civilians.find(c=>c.owner===s.player&&c.type==='engineer'),from=s.tiles.find(t=>t.id===u.tile),to=s.tiles.find(t=>t.owner===s.player&&neighbourIds(from).includes(t.id)&&!transportLink(s,from,t)&&!s.civilians.some(c=>c.tile===t.id)),b=document.querySelector('#map').getBoundingClientRect();window.touchRoad={id:u.id,tile:to.id,x:b.x+b.width/2+(to.x+(to.y%2)*.5-from.x-(from.y%2)*.5)*LOCAL_MAP_SCALE,y:b.y+b.height/2+(to.y-from.y)*Math.sqrt(3)/2*LOCAL_MAP_SCALE}})().catch(e=>window.touchRoadError=String(e))");until("!!window.touchRoad||!!window.touchRoadError");require("true".equals(js("!!window.touchRoad")),"Road fixture failed: "+js("window.touchRoadError"));
   org.json.JSONObject road=new org.json.JSONObject(js("window.touchRoad"));tapPoint(road.getDouble("x"),road.getDouble("y"));
   until("JSON.parse(localStorage.getItem('imp2-rebuild-v3')).civilians.find(c=>c.id===window.touchRoad.id).order?.job==='road'");
   tapElement("document.querySelector('[data-action=undoLastOrder]')");until("!JSON.parse(localStorage.getItem('imp2-rebuild-v3')).civilians.find(c=>c.id===window.touchRoad.id).order");
   tapElement("document.querySelector('#navigation [data-panel=research]')");until("!!document.querySelector('[data-action=startResearch]')");tapElement("document.querySelector('[data-action=startResearch]')");until("JSON.parse(localStorage.getItem('imp2-rebuild-v3')).nations.england.projects.length>0");
   result.putString("checks","Actual Android touchscreen taps selected an engineer, issued an adjacent road, rescinded it through Undo, and started funded research.");
  }else if(mode.equals("storage")){
   String key="imp2-rebuild-v3-recovery-242",target="imp2-rebuild-v3-recovery-243";
   java.io.File source=new java.io.File(getTargetContext().getFilesDir(),"campaigns/"+key+".json"),archived=new java.io.File(getTargetContext().getFilesDir(),"campaigns/"+target+".json");
   source.setReadable(true,false);source.delete();archived.setReadable(true,false);archived.delete();
   require("true".equals(js("AndroidGame.writeSave('"+key+"','broken original')")),"Native write failed");
   require(source.setReadable(false,false),"Cannot simulate unreadable file");
   require("true".equals(js("(()=>{try{AndroidGame.readSave('"+key+"');return false}catch(e){return true}})()")),"Unreadable existing file silently treated as missing");
   require("\"archived\"".equals(js("AndroidGame.archiveSave('"+key+"','"+target+"')")),"Cannot archive unreadable bytes");
   require(!source.exists()&&archived.exists(),"Original not preserved separately");archived.setReadable(true,false);
   require(new String(java.nio.file.Files.readAllBytes(archived.toPath()),java.nio.charset.StandardCharsets.UTF_8).equals("broken original"),"Original bytes changed");
   require("false".equals(js("AndroidGame.writeSave('"+key+"','\\u20ac'.repeat(2666667))")),"UTF-8 byte limit not enforced");
   require(!source.exists(),"Oversized write created a file");
   require("true".equals(js("(()=>{try{AndroidGame.writeSave('../escape','x');return false}catch(e){return true}})()")),"Save path validation bypassed");
   result.putString("checks","Native unreadable-file handling, byte-preserving quarantine, UTF-8 size rejection and path allowlist passed; primary campaign untouched.");
  }else{
   String expected=new String(java.nio.file.Files.readAllBytes(new java.io.File(getTargetContext().getFilesDir(),"expected-campaign.txt").toPath()),java.nio.charset.StandardCharsets.UTF_8);
   require(expected.equals(snapshot()),"Campaign changed across process restart: expected "+expected+", actual "+snapshot());
   java.io.File target=new java.io.File(getTargetContext().getFilesDir(),"emulator-export-result.json");
   java.lang.reflect.Method callback=activity.getClass().getDeclaredMethod("onActivityResult",int.class,int.class,Intent.class);callback.setAccessible(true);
   AtomicReference<Throwable> error=new AtomicReference<>();runOnMainSync(()->{try{callback.invoke(activity,1,Activity.RESULT_OK,new Intent().setData(android.net.Uri.fromFile(target)));}catch(Throwable t){error.set(t);}});
   if(error.get()!=null)throw new AssertionError(error.get());
   require(new String(java.nio.file.Files.readAllBytes(target.toPath()),java.nio.charset.StandardCharsets.UTF_8).equals("{\"emulatorExport\":242}"),"Export lost after process recreation");
   require(!new java.io.File(getTargetContext().getFilesDir(),"pending-save-export.json").exists(),"Pending export not cleaned up");
   screenshot("resumed.png");
   result.putString("checks","Campaign/market persisted across process death; pending native export completed from private disk data after Activity recreation. Picker-result delivery simulated; no physical Pixel tested.");
  }
  result.putString("result","PASS");finish(Activity.RESULT_OK,result);
 }catch(Throwable error){try{screenshot("failure.png");}catch(Throwable ignored){}result.putString("result","FAIL");result.putString("error",android.util.Log.getStackTraceString(error));finish(Activity.RESULT_CANCELED,result);}}
}
