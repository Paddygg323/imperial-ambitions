package com.paddy.imperialism.rebuild;

import android.app.Activity;
import android.app.AlertDialog;
import android.os.Bundle;
import android.view.WindowInsets;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Collections;

/** Offline host for the independent JavaScript engine; no Windows runtime. */
public final class MainActivity extends Activity {
 private WebView game;
 private String pendingExport;
 private android.webkit.ValueCallback<android.net.Uri[]> pendingImport;
 private static final int EXPORT=1,IMPORT=2;
 private android.util.AtomicFile exportFile(){return new android.util.AtomicFile(new java.io.File(getFilesDir(),"pending-save-export.json"));}
 private boolean stageExport(String json){
  android.util.AtomicFile file=exportFile();java.io.FileOutputStream stream=null;
  try{stream=file.startWrite();stream.write(json.getBytes(java.nio.charset.StandardCharsets.UTF_8));file.finishWrite(stream);return true;}
  catch(IOException e){if(stream!=null)file.failWrite(stream);android.widget.Toast.makeText(this,"Could not prepare export; your automatic save is unchanged",android.widget.Toast.LENGTH_LONG).show();return false;}
 }
 public final class SaveBridge {
  private android.util.AtomicFile campaignFile(String key){
   if(key==null||!key.matches(java.util.regex.Pattern.quote(SavePolicy.SLOT)+"(?:-previous|-recovery-[0-9]+(?:-copy)*)?"))throw new IllegalArgumentException("Invalid save slot");
   java.io.File folder=new java.io.File(getFilesDir(),"campaigns");
   if(!folder.isDirectory()&&!folder.mkdirs())throw new IllegalStateException("Save folder unavailable");
   return new android.util.AtomicFile(new java.io.File(folder,key+".json"));
  }
  @android.webkit.JavascriptInterface public synchronized String readSave(String key){
   android.util.AtomicFile file=campaignFile(key);
   try{return new String(file.readFully(),java.nio.charset.StandardCharsets.UTF_8);}
   catch(java.io.FileNotFoundException e){if(file.getBaseFile().exists()||new java.io.File(file.getBaseFile()+".bak").exists())throw new IllegalStateException("Could not read the saved campaign",e);return null;}
   catch(IOException e){throw new IllegalStateException("Could not read the saved campaign",e);}
  }
  @android.webkit.JavascriptInterface public synchronized boolean writeSave(String key,String json){
   if(json==null||json.length()>SavePolicy.MAX_BYTES)return false;
   byte[] bytes=json.getBytes(java.nio.charset.StandardCharsets.UTF_8);if(bytes.length>SavePolicy.MAX_BYTES)return false;
   android.util.AtomicFile file=campaignFile(key);java.io.FileOutputStream stream=null;
   try{stream=file.startWrite();stream.write(bytes);file.finishWrite(stream);return true;}
   catch(IOException e){if(stream!=null)file.failWrite(stream);return false;}
  }
  // Quarantine bytes without reading them: a disk read failure must not force
  // recovery to overwrite the only original. Roll back any partial rename.
  @android.webkit.JavascriptInterface public synchronized String archiveSave(String key,String target){
   if(target==null||!target.startsWith(SavePolicy.SLOT+"-recovery-"))throw new IllegalArgumentException("Invalid recovery slot");
   java.io.File from=campaignFile(key).getBaseFile(),to=campaignFile(target).getBaseFile();
   String[] suffixes={"",".bak",".new"};java.util.ArrayList<Integer> moved=new java.util.ArrayList<>();
   for(String suffix:suffixes)if(new java.io.File(to+suffix).exists())return "failed";
   for(int i=0;i<suffixes.length;i++){
    java.io.File source=new java.io.File(from+suffixes[i]);if(!source.exists())continue;
    if(!source.renameTo(new java.io.File(to+suffixes[i]))){
     for(int j=moved.size()-1;j>=0;j--){int n=moved.get(j);new java.io.File(to+suffixes[n]).renameTo(new java.io.File(from+suffixes[n]));}
     return "failed";
    }
    moved.add(i);
   }
   return moved.isEmpty()?"missing":"archived";
  }
  @android.webkit.JavascriptInterface public void exportSave(String json,String name){
   if(json==null||json.length()>SavePolicy.MAX_BYTES||json.getBytes(java.nio.charset.StandardCharsets.UTF_8).length>SavePolicy.MAX_BYTES){runOnUiThread(()->android.widget.Toast.makeText(MainActivity.this,"This save could not be exported because it is empty or exceeds the supported 8 MB size. Your automatic save is unchanged.",android.widget.Toast.LENGTH_LONG).show());return;}
   runOnUiThread(()->{
    if(pendingExport!=null)return;
    // Keep the export outside the Activity so process recreation in the
    // system document picker cannot silently produce an empty file.
    if(!stageExport(json))return;
    pendingExport=json;
    android.content.Intent pick=new android.content.Intent(android.content.Intent.ACTION_CREATE_DOCUMENT);
    pick.addCategory(android.content.Intent.CATEGORY_OPENABLE);pick.setType("application/json");
    pick.putExtra(android.content.Intent.EXTRA_TITLE,name==null?"Imperialism-save.json":name.replaceAll("[^A-Za-z0-9._-]","_"));
    try{startActivityForResult(pick,EXPORT);}catch(android.content.ActivityNotFoundException e){pendingExport=null;exportFile().delete();android.widget.Toast.makeText(MainActivity.this,"No document picker is available",android.widget.Toast.LENGTH_LONG).show();}
   });
  }
 }
 private static final String HOST="appassets.androidplatform.net";
 @Override public void onCreate(Bundle saved){
  super.onCreate(saved);
  FrameLayout root=new FrameLayout(this);root.setBackgroundColor(0xff182021);
  root.setOnApplyWindowInsetsListener((v,insets)->{
   if(android.os.Build.VERSION.SDK_INT>=30){
    android.graphics.Insets i=insets.getInsets(WindowInsets.Type.systemBars()|WindowInsets.Type.displayCutout());
    v.setPadding(i.left,i.top,i.right,i.bottom);
   }else v.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());
   return insets;
  });
  game=new WebView(this);root.addView(game,new FrameLayout.LayoutParams(-1,-1));setContentView(root);
  WebSettings settings=game.getSettings();settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);
  settings.setAllowFileAccess(false);settings.setAllowContentAccess(true);settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
  settings.setJavaScriptCanOpenWindowsAutomatically(false);settings.setSupportMultipleWindows(false);
  game.addJavascriptInterface(new SaveBridge(),"AndroidGame");
  game.setWebChromeClient(new android.webkit.WebChromeClient(){
   @Override public boolean onShowFileChooser(WebView view,android.webkit.ValueCallback<android.net.Uri[]> callback,FileChooserParams params){
    if(pendingImport!=null)pendingImport.onReceiveValue(null);pendingImport=callback;
    android.content.Intent pick=new android.content.Intent(android.content.Intent.ACTION_OPEN_DOCUMENT);
    pick.addCategory(android.content.Intent.CATEGORY_OPENABLE);pick.setType("application/json");
    try{startActivityForResult(pick,IMPORT);}catch(android.content.ActivityNotFoundException e){pendingImport.onReceiveValue(null);pendingImport=null;}
    return true;
   }
  });
  game.setWebViewClient(new WebViewClient(){
   @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){return true;}
   @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request){
    android.net.Uri uri=request.getUrl();String path=uri.getPath();
    if(!"https".equals(uri.getScheme())||!HOST.equals(uri.getHost())||path==null||!path.startsWith("/game/")||path.contains(".."))return missing();
    String asset=path.substring(1);
    if(asset.endsWith("/"))asset+="index.html";
    String mime=asset.endsWith(".png")?"image/png":asset.endsWith(".mjs")||asset.endsWith(".js")?"text/javascript":asset.endsWith(".css")?"text/css":asset.endsWith(".svg")?"image/svg+xml":asset.endsWith(".json")||asset.endsWith(".webmanifest")?"application/json":"text/html";
    try{return new WebResourceResponse(mime,"UTF-8",200,"OK",Collections.singletonMap("Cache-Control","no-store"),getAssets().open(asset));}
    catch(IOException e){return missing();}
   }
  });
  // Atomic private files hold the campaign; WebView storage is a compatibility cache.
  game.loadUrl("https://"+HOST+"/game/index.html?native=1");
  if(android.os.Build.VERSION.SDK_INT>=33){
   getOnBackInvokedDispatcher().registerOnBackInvokedCallback(android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT,this::handleBack);
  }
 }
 private static WebResourceResponse missing(){return new WebResourceResponse("text/plain","UTF-8",404,"Not Found",Collections.emptyMap(),new ByteArrayInputStream(new byte[0]));}
 @Override protected void onActivityResult(int request,int result,android.content.Intent data){
  super.onActivityResult(request,result,data);
  android.net.Uri uri=result==RESULT_OK&&data!=null?data.getData():null;
  if(request==IMPORT){
   if(pendingImport!=null){pendingImport.onReceiveValue(uri==null?null:new android.net.Uri[]{uri});pendingImport=null;}
   else if(uri!=null)android.widget.Toast.makeText(this,"Android restarted the game during import. Please choose the save again; your campaign is unchanged.",android.widget.Toast.LENGTH_LONG).show();
  }
  if(request==EXPORT){
   if(uri!=null){
    byte[] exported=null;
    try{exported=exportFile().readFully();}catch(IOException e){android.widget.Toast.makeText(this,"Export interrupted; your automatic save is unchanged. Please export again.",android.widget.Toast.LENGTH_LONG).show();}
    if(exported!=null){
    try(java.io.OutputStream out=getContentResolver().openOutputStream(uri,"wt")){
     if(out==null)throw new IOException("No document stream");out.write(exported);
     android.widget.Toast.makeText(this,"Save exported",android.widget.Toast.LENGTH_SHORT).show();
    }catch(IOException e){android.widget.Toast.makeText(this,"Export failed; your automatic save is still on this device",android.widget.Toast.LENGTH_LONG).show();}
    }
   }
   pendingExport=null;exportFile().delete();
  }
 }
 @Override public void onBackPressed(){
  handleBack();
 }
 private void handleBack(){
  game.evaluateJavascript("(()=>{const d=document.querySelector('dialog[open]');if(!d)return false;const e=new Event('cancel',{cancelable:true});if(!d.dispatchEvent(e))return false;d.close();return true;})()",closed->{
   if(!"true".equals(closed))new AlertDialog.Builder(this).setMessage("Leave the game? Your stored campaign files will be kept on this device.").setPositiveButton("Leave",(d,w)->finish()).setNegativeButton("Stay",null).show();
  });
 }
 @Override protected void onPause(){super.onPause();game.onPause();}
 @Override protected void onResume(){super.onResume();if(game!=null)game.onResume();}
 @Override protected void onDestroy(){if(game!=null){game.stopLoading();game.destroy();}super.onDestroy();}
}
