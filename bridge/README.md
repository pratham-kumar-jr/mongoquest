# Moving MongoQuest to dbquest.in

Two phases, both in this repo. The new app lives in the `dbquest` repo and is
served by Cloudflare at https://dbquest.in/.

## Phase A (live now): banner with a manual button

`src/moveout.js` adds a banner above the header. The button carries the
visitor's progress to the new origin in the URL fragment as
`#migrate=<base64 { p: progress, r: revealed }>`, which `src/migrate.js` on
dbquest.in imports before its first render. localStorage is origin-scoped, so
this hop is the only way the data gets across. Fragments never reach a server.

The click sends one `migrate_click` GA4 event (`had_progress`, `solved`) as a
beacon, waits for it at most 400 ms, then navigates.

## Phase B (after testing): automatic redirect

Copy `bridge/index.html` over the root `index.html`, commit, push. It reads the
same localStorage, builds the same fragment, sends a `bridge_redirect` event and
calls `location.replace`. Delete nothing else; the repo stays as an archive.
Until the swap, the bridge is also reachable at `/mongoquest/bridge/` for a live
test of the automatic flow.

## Rules

- Never set a custom domain on this repo. GitHub's own redirect would fire before
  any script runs and visitors would arrive without their progress.
- Local test: serve this repo on one port and `dbquest` on another, then open
  `http://localhost:8080/?to=http://localhost:8081/`. The `?to=` override only
  works on localhost or file://.
