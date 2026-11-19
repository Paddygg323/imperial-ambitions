# Android setup

The browser game is the easiest route for design work: `npm start` needs only Node.js.

The Android shell embeds this project's own offline HTML/JavaScript game. The existing build scripts currently target Windows and require:

- JDK 17; set `JAVA_HOME` to its installation directory.
- Android SDK with platform 36 and build-tools 36.0.0; set `IMP_ANDROID_SDK`.
- Python 3.
- For AAB builds, bundletool 1.18.3; set `IMP_BUNDLETOOL` to its JAR.

Build a local development APK from the repository root:

```powershell
python -X utf8 android/scripts/build.py
```

Build and validate an unsigned AAB:

```powershell
python -X utf8 android/scripts/bundle.py
```

The scripts create local ignored staging files under `work/` and output packages under `outputs/`. Development signing uses a locally generated development key; no signing key is in Git.

Do not install over a player's existing package without a save backup and their approval. A fresh clone generates a different development signing key, so it cannot silently update an existing differently signed installation.

`build-test.py` creates a disposable instrumentation runner. Its default runner refuses physical-device use. `stage-validation.py` is a historical isolated-device workflow and must be reviewed before use.

SDKs, JDKs, bundletool, emulator images and compiled packages are intentionally not checked into Git.
