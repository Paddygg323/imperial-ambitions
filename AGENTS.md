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
- Only `npm run build:web` output may be published. Never publish the repository
  root, designer references, campaign saves, SDKs, keys or private credentials.
- Preserve the public play URL and browser save origin. Android updates are built
  from this checkout, with the existing local signing identity, and installed only
  when requested. Never uninstall the player's app to resolve a signing mismatch.
- Keep personal machine configuration in ignored `work/` files. Historical `work/`
  migration scripts are not a normal build process.

See README.md, docs/DESIGNER-HANDOVER.md and docs/DEVELOPMENT.md.
