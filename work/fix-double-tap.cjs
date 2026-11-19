const fs=require('fs');
const root='C:/Users/paddy/OneDrive/Desktop/IMP 2 Phone/src/winlator-app-main/';
const file=root+'app/src/main/java/com/winlator/phone/PhoneTouchView.java';
let s=fs.readFileSync(file,'utf8');
s=s.replace('            @Override public void onLongPress(MotionEvent e) {',`            @Override public boolean onDoubleTapEvent(MotionEvent e) {
                if(e.getActionMasked()==MotionEvent.ACTION_UP && !multi && !dragMode && move(e.getX(),e.getY()))
                    click(Pointer.Button.BUTTON_LEFT);
                return true;
            }
            @Override public void onLongPress(MotionEvent e) {`);
s=s.replace('Pointer.Button.BUTTON_LEFT),50);','Pointer.Button.BUTTON_LEFT),32);');
s=s.replace('server.injectPointerButtonRelease(button),50);','server.injectPointerButtonRelease(button),32);');
fs.writeFileSync(file,s);
const help=root+'app/src/main/java/com/winlator/phone/PhoneControls.java';
fs.writeFileSync(help,fs.readFileSync(help,'utf8').replace('Tap to select. Hold for right click.','Tap to select; double-tap to open. Hold for right click.'));
const build=root+'build.gradle';fs.writeFileSync(build,fs.readFileSync(build,'utf8').replace('work/android-signed-build-output','work/android-final-build-output'));
console.log('Double-tap forwarding added');
