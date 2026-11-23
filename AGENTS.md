# Main project

This Git checkout is the authoritative Imperial Ambitions phone/browser project.
Remote: https://github.com/Paddygg323/imperial-ambitions

- Edit game code, Android source and the sprite library here. Do not develop in the
  former `2026-10-05/imperialism-ii-phone` copy or a Sites deployment checkout.
- Fetch and inspect incoming work before editing. Never discard somebody else's
  uncommitted changes, force-push main, or overwrite a designer's work.
- The owner authorized completed changes to be committed/pushed to this repository
  and automatic public browser publication after checks pass on main. Use branches
  for unfinished experiments; only main is the release source.
- Run checks relevant to the change and inspect artwork in the real game. Keep
  gameplay unchanged for visual-only requests. The owner has not accepted the
  overall visual quality and this is not a store-ready game.
- The owner made the source repository public on 20 November 2026. Public source
  access does not grant write access; outside contributors can fork and open PRs.
- Only `npm run build:web` output may be deployed to the playable website. Never
  serve the repository root or designer references as website files. Keep campaign
  saves, SDKs, signing keys and private credentials out of Git and deployments.
- Preserve the public play URL and browser save origin. Android updates are built
  from this checkout, with the existing local signing identity, and installed only
  when requested. Never uninstall the player's app to resolve a signing mismatch.
- Keep personal machine configuration in ignored `work/` files. Historical `work/`
  migration scripts are not a normal build process.

See README.md, docs/DESIGNER-HANDOVER.md and docs/DEVELOPMENT.md.
Keep docs/DEVELOPMENT-BACKLOG.md current: items 1–10 are owner requests and
items 11–20 are suggestions for review. Recording an item is not completing it;
retain stable item numbers and attach implementation/verification evidence.
