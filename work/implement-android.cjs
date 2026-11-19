const fs=require('fs'),path=require('path');
const root='C:/Users/paddy/OneDrive/Desktop/IMP 2 Phone/src/winlator-app-main';
function write(p,s){fs.writeFileSync(path.join(root,p),s);}
function replace(p,a,b){const s=fs.readFileSync(path.join(root,p),'utf8');if(!s.includes(a))throw Error('Missing anchor '+p);write(p,s.replace(a,b));}
const pkg='app/src/main/java/com/winlator/phone/';
fs.mkdirSync(path.join(root,pkg),{recursive:true});
write(pkg+'PhoneViewport.java',`package com.winlator.phone;

/** Camera in guest pixels. Rendering and touch input share the same transform. */
public final class PhoneViewport {
    public static final class Snapshot {
        public final float zoom, offsetX, offsetY;
        Snapshot(float z, float x, float y) { zoom=z; offsetX=x; offsetY=y; }
    }
    private final int guestWidth, guestHeight;
    private float zoom=1, offsetX=0, offsetY=0;
    private float aspect=1, marginX=0, marginY=0;
    public PhoneViewport(int w,int h) {
        if(w<=0 || h<=0) throw new IllegalArgumentException("Invalid guest size");
        guestWidth=w; guestHeight=h;
    }
    public synchronized void resize(int w,int h) {
        aspect=Math.min((float)Math.max(1,w)/guestWidth,(float)Math.max(1,h)/guestHeight);
        marginX=(w-guestWidth*aspect)/2; marginY=(h-guestHeight*aspect)/2;
    }
    public synchronized Snapshot snapshot() { return new Snapshot(zoom,offsetX,offsetY); }
    public synchronized float[] guestPoint(float x,float y) {
        return new float[]{((x-marginX)/aspect+offsetX)/zoom,((y-marginY)/aspect+offsetY)/zoom};
    }
    public synchronized boolean inside(float x,float y) {
        return x>=marginX && y>=marginY && x<marginX+guestWidth*aspect && y<marginY+guestHeight*aspect;
    }
    public synchronized void scaleAt(float factor,float x,float y) {
        float[] before=guestPoint(x,y);
        zoom=Math.max(1,Math.min(4,zoom*factor));
        offsetX=before[0]*zoom-(x-marginX)/aspect;
        offsetY=before[1]*zoom-(y-marginY)/aspect;
        clamp();
    }
    public synchronized void pan(float dx,float dy) { offsetX-=dx/aspect; offsetY-=dy/aspect; clamp(); }
    public synchronized void fit() { zoom=1; offsetX=offsetY=0; }
    private void clamp() {
        offsetX=Math.max(0,Math.min(guestWidth*(zoom-1),offsetX));
        offsetY=Math.max(0,Math.min(guestHeight*(zoom-1),offsetY));
    }
}
`);
write(pkg+'PhoneTouchView.java',`package com.winlator.phone;

import android.content.Context;
import android.view.GestureDetector;
import android.view.MotionEvent;
import android.view.ScaleGestureDetector;
import android.view.View;
import com.winlator.widget.XServerView;
import com.winlator.xserver.Pointer;
import com.winlator.xserver.XServer;

/** Sends real guest pointer events; navigation gestures never submit game orders. */
public final class PhoneTouchView extends View {
    private final XServer server;
    private final XServerView display;
    private final PhoneViewport camera;
    private final GestureDetector taps;
    private final ScaleGestureDetector pinch;
    private boolean multi=false, dragging=false, dragMode=false;
    private float lastX,lastY;
    public PhoneTouchView(Context context,XServer server,XServerView display,PhoneViewport camera) {
        super(context); this.server=server; this.display=display; this.camera=camera;
        setContentDescription("Game: tap to select, hold for right click, pinch to zoom, two fingers to pan");
        taps=new GestureDetector(context,new GestureDetector.SimpleOnGestureListener() {
            @Override public boolean onDown(MotionEvent e) { return true; }
            @Override public boolean onSingleTapUp(MotionEvent e) {
                if(!multi && !dragMode && move(e.getX(),e.getY())) click(Pointer.Button.BUTTON_LEFT);
                return true;
            }
            @Override public void onLongPress(MotionEvent e) {
                if(!multi && !dragMode && move(e.getX(),e.getY())) click(Pointer.Button.BUTTON_RIGHT);
            }
        });
        pinch=new ScaleGestureDetector(context,new ScaleGestureDetector.SimpleOnScaleGestureListener() {
            @Override public boolean onScale(ScaleGestureDetector d) {
                camera.scaleAt(d.getScaleFactor(),d.getFocusX(),d.getFocusY()); render(); return true;
            }
        });
    }
    @Override protected void onSizeChanged(int w,int h,int ow,int oh) { camera.resize(w,h); render(); }
    public void setDragMode(boolean enabled) { releaseDrag(); dragMode=enabled; }
    public void fit() { camera.fit(); render(); }
    public void click(Pointer.Button button) {
        server.injectPointerButtonPress(button);
        postDelayed(()->server.injectPointerButtonRelease(button),50);
    }
    private boolean move(float x,float y) {
        if(!camera.inside(x,y)) return false;
        float[] p=camera.guestPoint(x,y);
        server.injectPointerMove(Math.max(0,Math.min(server.screenInfo.width-1,Math.round(p[0]))),
            Math.max(0,Math.min(server.screenInfo.height-1,Math.round(p[1]))));
        return true;
    }
    private void render() { server.getRenderer().setPhoneCamera(camera.snapshot()); display.requestRender(); }
    private void releaseDrag() { if(dragging) server.injectPointerButtonRelease(Pointer.Button.BUTTON_LEFT); dragging=false; }
    @Override protected void onDetachedFromWindow() { releaseDrag(); super.onDetachedFromWindow(); }
    @Override public boolean onTouchEvent(MotionEvent e) {
        int a=e.getActionMasked();
        if(a==MotionEvent.ACTION_DOWN) {
            multi=false;
            if(dragMode && move(e.getX(),e.getY())) { server.injectPointerButtonPress(Pointer.Button.BUTTON_LEFT); dragging=true; }
        }
        if(a==MotionEvent.ACTION_POINTER_DOWN) {
            multi=true; releaseDrag();
            MotionEvent cancel=MotionEvent.obtain(e); cancel.setAction(MotionEvent.ACTION_CANCEL); taps.onTouchEvent(cancel); cancel.recycle();
            lastX=(e.getX(0)+e.getX(1))/2; lastY=(e.getY(0)+e.getY(1))/2;
        }
        if(e.getPointerCount()>=2 && a==MotionEvent.ACTION_MOVE) {
            float x=(e.getX(0)+e.getX(1))/2,y=(e.getY(0)+e.getY(1))/2;
            camera.pan(x-lastX,y-lastY); lastX=x;lastY=y; render();
        }
        pinch.onTouchEvent(e);
        if(!multi) taps.onTouchEvent(e);
        if(dragging && a==MotionEvent.ACTION_MOVE) move(e.getX(),e.getY());
        if(a==MotionEvent.ACTION_UP || a==MotionEvent.ACTION_CANCEL) releaseDrag();
        return true;
    }
}
`);
write(pkg+'PhoneControls.java',`package com.winlator.phone;

import android.app.AlertDialog;
import android.content.Context;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import com.winlator.xserver.Pointer;

public final class PhoneControls {
    public static void attach(Context context,FrameLayout root,PhoneTouchView touch,Runnable menu) {
        float density=context.getResources().getDisplayMetrics().density;
        LinearLayout row=new LinearLayout(context); row.setOrientation(LinearLayout.HORIZONTAL);
        row.setBackgroundColor(0xe6222933);
        Button toggle=button(context,"Controls");
        LinearLayout tools=new LinearLayout(context); tools.setVisibility(View.GONE);
        toggle.setOnClickListener(v->tools.setVisibility(tools.getVisibility()==View.VISIBLE?View.GONE:View.VISIBLE));
        Button fit=button(context,"Fit"); fit.setOnClickListener(v->touch.fit());
        Button right=button(context,"Right click"); right.setOnClickListener(v->touch.click(Pointer.Button.BUTTON_RIGHT));
        Button drag=button(context,"Drag: off"); final boolean[] on={false};
        drag.setOnClickListener(v->{on[0]=!on[0];touch.setDragMode(on[0]);drag.setText(on[0]?"Drag: on":"Drag: off");});
        Button settings=button(context,"Menu"); settings.setOnClickListener(v->menu.run());
        Button help=button(context,"Help"); help.setOnClickListener(v->new AlertDialog.Builder(context)
            .setTitle("Phone controls").setMessage("Tap to select. Hold for right click. Pinch to zoom; move two fingers to pan. Drag mode holds the left mouse button during one-finger movement. Fit restores the whole screen. These controls operate the original game; the redesigned management screens are still in development.")
            .setPositiveButton("OK",null).show());
        row.addView(toggle); row.addView(tools);
        for(Button b:new Button[]{fit,right,drag,settings,help}) tools.addView(b);
        FrameLayout.LayoutParams p=new FrameLayout.LayoutParams(-2,(int)(56*density),Gravity.TOP|Gravity.START);
        root.addView(row,p);
    }
    private static Button button(Context c,String label) {
        Button b=new Button(c);b.setText(label); b.setTextSize(14);b.setMinHeight((int)(48*c.getResources().getDisplayMetrics().density));return b;
    }
}
`);
replace('app/src/main/java/com/winlator/renderer/GLRenderer.java','    private float magnifierZoom = 1.0f;',`    private float magnifierZoom = 1.0f;
    private volatile com.winlator.phone.PhoneViewport.Snapshot phoneCamera;
    public void setPhoneCamera(com.winlator.phone.PhoneViewport.Snapshot camera) { phoneCamera=camera; }
`);
replace('app/src/main/java/com/winlator/renderer/GLRenderer.java','        XForm.makeTransform(tmpXForm2, -pointerX, -pointerY, magnifierZoom, magnifierZoom, 0);',`        com.winlator.phone.PhoneViewport.Snapshot camera=phoneCamera;
        if(camera!=null) { magnifierZoom=camera.zoom; pointerX=camera.offsetX; pointerY=camera.offsetY; }
        XForm.makeTransform(tmpXForm2, -pointerX, -pointerY, magnifierZoom, magnifierZoom, 0);`);
replace('app/src/main/java/com/winlator/XServerDisplayActivity.java','        if (MainActivity.DEBUG_MODE) rootView.addView(AppUtils.createDebugMsgTextView(this));',`        // Android-first touch experiment; retains original guest simulation.
        renderer.setFullscreen(false);
        renderer.setCursorVisible(true);
        com.winlator.phone.PhoneViewport camera=new com.winlator.phone.PhoneViewport(xServer.screenInfo.width,xServer.screenInfo.height);
        com.winlator.phone.PhoneTouchView phoneTouch=new com.winlator.phone.PhoneTouchView(this,xServer,xServerView,camera);
        touchpadView.setVisibility(View.GONE);
        rootView.addView(phoneTouch,new FrameLayout.LayoutParams(-1,-1));
        com.winlator.phone.PhoneControls.attach(this,rootView,phoneTouch,()->drawerLayout.openDrawer(GravityCompat.START));
        if (MainActivity.DEBUG_MODE) rootView.addView(AppUtils.createDebugMsgTextView(this));`);
replace('app/build.gradle',"applicationId 'com.winlator'","applicationId 'org.imp2.phone'");
replace('app/src/main/AndroidManifest.xml','android:authorities="com.winlator.FileProvider"','android:authorities="${applicationId}.FileProvider"');
// Namespace is retained for JNI and resource references; app installs independently.
replace('app/src/main/res/values/strings.xml','<string name="app_name">Winlator</string>','<string name="app_name">IMP 2 Phone — test</string>');
console.log('Phone runtime touch integration written');
