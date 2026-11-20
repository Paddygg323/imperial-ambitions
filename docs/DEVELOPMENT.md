# One main source

`Paddygg323/imperial-ambitions` is the main source for the game, sprite library,
Android app and deployment code. Paddy's working checkout is:

`C:/Users/paddy/Documents/Codex/2026-11-19/imperial-ambitions`

The previous `2026-10-05/imperialism-ii-phone` folder is retained as an archive and
local toolchain store. Do not edit its duplicate game or sprite library.

## Playing and editing locally

Double-click `Play Imperial Ambitions.cmd` or run `npm run play`. It fast-forwards
from GitHub when the main checkout is clean, starts the game from this checkout,
and opens `http://127.0.0.1:8774/`. Existing browser saves keep the same origin.
Uncommitted work, experimental branches, conflicts and offline access never cause
the launcher to reset or overwrite local work. Refresh the game to see local file
edits; an already-open game is not forcibly reloaded mid-turn.

`Open Sprite Library.cmd` opens the library from this same checkout at port 8790.
For development without a Git pull, `npm start` serves the current local files.

## Saving changes and automatic web publication

Commit and push completed changes, or open a pull request from a design branch.
Edits become shared when pushed; merely saving a file is not a GitHub upload.
Changes merged into `main` run `.github/workflows/publish-game.yml`. The workflow
runs the tests and asset checks, exports only the runtime to `dist`, verifies that
publication boundary, then publishes it to `Paddygg323/imperial-ambitions-web`.
Failed checks leave the previous public build in place. Branches and pull requests
are checked but do not publish.

The owner made the source repository public on 20 November 2026. Anyone can clone
the full project. Contributors without collaborator write access should fork it,
push a design branch to their own fork and open a pull request against this `main`.
Public visibility does not give visitors permission to push to the owner's repo.

The separate deployment repository still contains only the playable files that
browsers need, not the designer library, references, tests, SDKs, keys or development
notes. Its deployment key has write access only to that mirror and is encrypted in
this source repository's Actions secrets. Fork pull requests do not publish.

GitHub Pages serves the mirror. The existing public play URL uses the small
`deploy/proxy-worker.mjs` adapter so users keep the same URL and saved campaigns.
No GitHub credential is present in that adapter. Site source is a deployment copy
of that file, not a second place to develop the game. Changes to the adapter itself
require a Sites deployment; routine game/art updates require only the main push.

The CI result and `build-info.json` identify the deployed source commit. Hosting
can take several minutes after a push. Reopen/refresh to load the update; an active
campaign is not reloaded automatically while a player is issuing orders.

## Android

`npm run android:apk` and `npm run android:bundle` build from this checkout's game
and Android source. Local SDK/key paths may be configured in ignored
`work/android-local.json`, with environment variables taking precedence. Paddy's
existing development signing identity is retained locally and never committed.
An installed offline Android app still needs a newly built APK installed to receive
updates. Pushing to GitHub does not silently replace an installed application.

## Checks

- `npm test`: gameplay tests.
- `npm run check:assets`: sprite-library and runtime mappings.
- `npm run build:web`: produce a local runtime-only build.
- `npm run test:delivery`: check the build boundary, server and stable-origin proxy.
- `npm run test:smoke`: isolated desktop/phone browser startup.

The appearance is still a development work in progress. Passing checks is not
owner approval of the art or an app-store release certification.
