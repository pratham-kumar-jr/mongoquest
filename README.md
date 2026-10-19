# MongoQuest has moved to DBQuest
**The live site is https://dbquest.in** – same exercises, new home.

This repository used to hold the MongoQuest app. It now contains only a redirect
page. Development continues in the `dbquest` repository; the old code is in this
repo's git history before the redirect commit.

## What `index.html` does

Visitors to https://pratham-kumar-jr.github.io/mongoquest/ see a short notice
and are sent to https://dbquest.in/ after five seconds, or at once via "Go now". Saved progress is carried across: the page
reads the old `mongoquest.v1` localStorage, packs progress, revealed flags and
up to 30 KB of editor drafts into the URL fragment as `#migrate=<base64>`, and dbquest.in imports it before
its first render. localStorage is origin-scoped, so this hop is the only way the
data gets there. Fragments never reach a server.

On load the page sends one `bridge_redirect` event to the shared GA4 property
as a beacon; the countdown never waits on it. Visitors with Do Not Track or
blocked analytics get the same countdown without the tag; without JavaScript the
links still point at dbquest.in, though progress cannot be read.

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
