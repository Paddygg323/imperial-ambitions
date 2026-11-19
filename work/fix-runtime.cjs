const fs=require('fs');const root='C:/Users/paddy/OneDrive/Desktop/IMP 2 Phone/src/winlator-app-main/';
function edit(p,a,b){let s=fs.readFileSync(root+p,'utf8');if(!s.includes(a))throw Error(p);fs.writeFileSync(root+p,s.replace(a,b));}
edit('app/src/main/java/com/winlator/XServerDisplayActivity.java','        renderer.setFullscreen(false);','        // Phone camera uses an aspect-preserving guest viewport.');
edit('app/src/main/java/com/winlator/renderer/GLRenderer.java','            fullscreen = !fullscreen;','            fullscreen = phoneCamera == null && !fullscreen;');
edit('app/src/main/java/com/winlator/core/FileUtils.java','"com.winlator.FileProvider"','activity.getPackageName()+".FileProvider"');
edit('app/src/main/java/com/winlator/phone/PhoneTouchView.java','    @Override protected void onDetachedFromWindow()', '    @Override protected void onWindowVisibilityChanged(int visibility) { if(visibility!=VISIBLE) releaseDrag(); super.onWindowVisibilityChanged(visibility); }\n    @Override protected void onDetachedFromWindow()');
