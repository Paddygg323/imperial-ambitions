const fs = require('fs');
const path = require('path');
const {Readable} = require('stream');
const {pipeline} = require('stream/promises');
const root = 'C:/Users/paddy/OneDrive/Desktop/IMP 2 Phone/work/toolchain';
fs.mkdirSync(root, {recursive:true});
async function download(url, name) {
 const res = await fetch(url);
 if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
 await pipeline(Readable.fromWeb(res.body), fs.createWriteStream(path.join(root, name)));
 console.log(`${name}: downloaded`);
}
Promise.all([
 download('https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.20.1%2B1/OpenJDK17U-jdk_x64_windows_hotspot_17.0.20.1_1.zip', 'jdk.zip'),
 download('https://dl.google.com/android/repository/commandlinetools-win-16111833_latest.zip', 'android-tools.zip')
]).catch(e => {console.error(e); process.exitCode=1;});
