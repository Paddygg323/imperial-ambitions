# Imperial Ambitions

Standalone single-player strategy game for browsers and Android. **This repository is the main source of the game and sprite library**, starting from runtime **254**.

The source repository is public. Designers can clone it and run the full game.
If you do not have collaborator write access, fork the repository, work on a design
branch in your fork and open a pull request against this repository's `main`.

**The visual design is unfinished and the owner has rejected the current overall appearance.** This is a playable development build, not a store-ready release. The designer's task is to establish a coherent, professional sprite library and improve the presentation without changing the gameplay.

- [Play the current browser build](https://imperial-ambitions-playtest-paddy.paddygarrettb.chatgpt.site/)
- [Designer: start here](docs/DESIGNER-HANDOVER.md)
- [Architecture and asset integration](docs/ARCHITECTURE.md)
- [Latest terrain comparison](outputs/visual-review/sprites254/terrain-sheep.png)
- [Current live sprite-to-source mapping](docs/live-sprite-map.json)
- [Known limits and verification](docs/STATUS.md)
- [Main-source workflow and automatic publishing](docs/DEVELOPMENT.md)

## Run locally

Install Node.js 22 or newer. No dependencies or build step are needed to play:

On Windows, double-click **Play Imperial Ambitions.cmd**, or use `npm run play`.
This updates a clean main checkout from GitHub and launches the game from it.
To serve your current local edits without pulling:

```sh
npm start
```

Open **http://127.0.0.1:8774/**. Saves stay in the browser for this origin.

Open the sprite library in a second terminal:

```sh
npm run sprites
```

Open **http://127.0.0.1:8790/**. Its search, enlargement and comparison controls work locally. Review annotations stay in that browser; export them before sharing.

## Test

```sh
npm test
```

This runs the Node unit tests with bounded concurrency. Successful pushes to `main`
automatically publish the game-only browser build; branch edits do not publish.
For a portable browser smoke check:

```sh
npm install
npx playwright install chromium
npm run test:smoke
```

The smoke check uses a fresh isolated browser context. It does not use your campaign save. Set `CHROME_BIN` to an existing Chrome executable to avoid the browser download.

## Repository layout

| Path | Contents |
| --- | --- |
| `game/` | Browser game, rules, UI, rendering, runtime assets and tests |
| `android/` | Standalone Android WebView shell, build and instrumentation scripts |
| `outputs/sprite-library-review/` | Full source sprite library, originals, revisions, prompts, review UI and archives |
| `outputs/visual-review/` | Historical and current screenshots; folder names identify the build |
| `outputs/*.json`, `outputs/*.txt` | Historical implementation investigations, audits and validation reports |
| `docs/design-references/` | Owner-supplied style/reference images; separate from shipping artwork |
| `work/*.*` | Historical one-off development and import scripts, not the normal build |
| `scripts/` | Portable repository commands |

The runnable game source and all of its assets are included. SDKs, dependency caches, signing keys, compiled packages, deployment credentials and personal campaign saves are excluded. The original Windows game, PC hotseat mod and rejected emulator/wrapper prototype are separate projects and are not bundled.

## Android

See [Android setup](docs/ANDROID.md). The Java shell hosts this project's own offline game; it does not emulate or wrap the Windows executable.

## Working agreement

Use a branch and keep a before/after screenshot with each visual change. Preserve sprite IDs and gameplay data. Do not treat older gallery approval flags or previous assistant praise as current acceptance: the owner explicitly wants further design work.

No open-source license has been selected. See [source and asset notes](docs/PROVENANCE.md).
