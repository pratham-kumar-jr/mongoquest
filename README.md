# MongoQuest has moved to DBQuest
**The live site is https://dbquest.in** – same exercises, new home.

This repository used to hold the MongoQuest app. It now contains only a redirect
page. Development continues in the `dbquest` repository; the old code is in this
repo's git history before the redirect commit.

## What `index.html` does

Visitors to https://pratham-kumar-jr.github.io/mongoquest/ are sent to
https://dbquest.in/ automatically. Saved progress is carried across: the page
reads the old `mongoquest.v1` localStorage, packs progress and revealed flags
into the URL fragment as `#migrate=<base64>`, and dbquest.in imports it before
its first render. localStorage is origin-scoped, so this hop is the only way the
data gets there. Fragments never reach a server.

Before leaving, the page sends one `bridge_redirect` event to the shared GA4
property as a beacon and waits for it at most one second. Visitors with Do Not
Track, blocked analytics or no JavaScript are redirected at once or via the
fallback link.

The page carries `rel="canonical"` pointing at dbquest.in and is left
indexable, so the search signal this URL earned consolidates onto the new domain
instead of being discarded.

## Rules

- **Never set a custom domain on this repo.** GitHub's own redirect would fire
  before the script runs and visitors would arrive without their progress.
- Keep the file as a single self-contained page. There is no build step.

## Local test

Serve this folder on one port and `dbquest` on another, then open
`http://localhost:8080/?to=http://localhost:8081/`. The `?to=` override and the
analytics skip only apply on localhost or `file://`.
