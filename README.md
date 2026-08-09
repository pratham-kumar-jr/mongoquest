# MongoQuest

Practise MongoDB queries in the browser. 110 questions across 12 topics, a
cheatsheet per topic, a live query runner, and progress saved to localStorage.

Everything runs client-side. [mingo](https://github.com/kofrasa/mingo) executes
the queries against in-memory collections. No server, no database, no build
tooling required to *use* it.

## Host it on GitHub Pages

`dist/index.html` is fully self-contained (mingo, the data, the questions, the
CSS and the app are all inlined, ~240 KB, works offline). Three small sidecar
files go next to it: `og.png` (the link-preview image), `robots.txt` and
`sitemap.xml`.

The site URL is already baked in as

```js
SITE: "https://pratham-kumar-jr.github.io/mongoquest/",   // site.config.js
```

so the repo must be named `mongoquest`. If you name it something else, change
that line and re-run `node build.js`. The canonical URL, `og:url` and the
JSON-LD all derive from it.

```bash
# new repo, project site  ->  https://pratham-kumar-jr.github.io/mongoquest/
git init
cp dist/index.html dist/og.png dist/robots.txt dist/sitemap.xml .
git add . && git commit -m "MongoQuest"
git remote add origin git@github.com:pratham-kumar-jr/mongoquest.git
git push -u origin main
```

Then **Settings → Pages → Source: Deploy from a branch → `main` / `root`**.

For a user site (`https://pratham-kumar-jr.github.io/`) push to the root of the
`pratham-kumar-jr.github.io` repo instead, and drop `/mongoquest/` from `SITE`.

Once it's live, submit the sitemap in
[Google Search Console](https://search.google.com/search-console).

## Working on it

```
vendor/            mingo.min.js (MIT), vendored so the build needs no install
src/data.js        the six collections
src/topics.js      topic list + per-topic cheatsheets
src/master.js      intro section for the full cheatsheet page
src/questions.js   the question bank
src/analytics.js   GA4 loader + event helpers
src/engine.js      mongo-shell emulator over mingo + answer comparison
src/editor.js      syntax highlighting, bracket matching, formatter
src/app.js         UI
src/styles.css
site.config.js     SITE / AUTHOR / GA_ID / TITLE (edit before deploying)
srcload.js         runs src/* in a vm so the Node scripts read the same data the page does
build.js           concatenates the above into dist/index.html + robots + sitemap
ogmake.js          renders dist/og.png (1200x630 share image)
verify.js          runs every reference solution in Node
browsertest.js     runs everything again in real Chromium + drives the UI
```

`ogmake.js` and `browsertest.js` need `npm i && npx playwright install chromium`. Set
`CHROMIUM_PATH` to override the browser Playwright picks.

```bash
node build.js         # -> dist/index.html  (no npm install needed)
node verify.js        # every solution runs  (no npm install needed)

npm install           # only for the browser test, pulls Playwright
node browsertest.js   # end-to-end in real Chromium
```

**There is no npm package here, and nothing to install to *use* this.**
`dist/index.html` has zero runtime dependencies; mingo is inlined into it.

npm is only a dev convenience:

| Task | Needs npm? |
|---|---|
| Open the app / deploy it | no |
| `node build.js` after editing `src/` | no, mingo is vendored in `vendor/` |
| `node verify.js` | no |
| `node browsertest.js` | yes, Playwright is a ~300 MB browser download |

To pull in a newer mingo:

```bash
npm run update-mingo    # fetches latest, re-vendors it, rebuilds
```

## Adding a question

There are no stored "expected outputs". The app runs **your** query and the
**reference solution** through the same engine and compares the results, so
adding a question is just:

```js
{ id: "c10", topic: "comparison", difficulty: "medium", coll: "restaurants",
  prompt: "Find restaurants with fewer than 20 seats.",
  hint: "$lt.",
  solution: `db.restaurants.find({ seats: { $lt: 20 } })` },
```

Set `ordered: true` when the result order is part of the answer (anything with
a `sort`). Otherwise results are compared as an unordered set, so any query
shape that produces the right documents is accepted.

Run `node build.js` and `node browsertest.js` afterwards.

## The editor

`src/editor.js` is a hand-rolled code editor: a `<textarea>` with a
syntax-highlighted `<pre>` painted underneath it. No CodeMirror, because the
app has to stay one self-contained offline file.

- Highlighting: `$operators` are purple and bold, so a missing `$` on
  `"$grades"` is visible.
- Rainbow brackets, 5 colours by nesting depth.
- Matching bracket: the pair around the caret gets a green box.
- Unmatched brackets: red box, plus a live count in the status bar.
- Auto-close `{ [ ( " ' \``, skip-over on the closing character, and backspace
  inside an empty pair deletes both.
- Smart Enter: pressing Enter between `{` and `}` opens an indented block,
  otherwise the previous line's indent is kept.
- Tab / Shift+Tab indents and outdents the selected block.
- Format (button, or Ctrl+Shift+F): one stage per line for pipelines, objects
  kept inline, value arrays like `[0, 6, 7]` left alone.
- Wrap toggle, line numbers, and a height that grows with the query.

Scrollbars are thin and hidden until you hover the pane, then fade in as a grey
thumb and turn green while you drag.

`browsertest.js` runs `MQEditor.format()` over all 110 reference solutions and
asserts each formatted version returns identical results.

## Analytics

In `site.config.js`:

```js
GA_ID: "G-XXXXXXXXXX",
```

Swap in your GA4 Measurement ID, re-run `node build.js` and re-deploy. That's the
whole setup.

While it says `G-XXXXXXXXXX`, analytics is completely off: no gtag.js
request, no `window.gtag`, no cookies. Visitors sending `Do Not Track` are
skipped even once an ID is set.

Because it's a single-page app, `send_page_view` is disabled and page views are
sent by hand, one per screen:

```
/topic/<topic-id>      /question/<question-id>      /cheatsheet      /data/<collection>
```

Custom events, all carrying `question_id` / `topic` / `difficulty` /
`collection` where they apply:

| Event | Fires when | Useful for |
|---|---|---|
| `question_attempt` | every Check, with `result` = correct / wrong / error | attempts-per-solve = real difficulty |
| `question_solved` | first correct answer only, with `revealed_first` | true completion rate |
| `query_run` | Run pressed, with `docs_returned` | how much people experiment |
| `query_error` | a query throws, with the first 90 chars of the message | which syntax trips people up |
| `solution_revealed` | Show solution, with `solved_already` | give-up rate per question |
| `topic_completed` | last question in a topic goes green | funnel by topic |
| `all_completed` | all 110 done | |
| `progress_reset` | Reset progress, with `solved_before` | |

Two useful reports: `question_attempt` with `result=wrong` grouped by
`question_id`, and `solution_revealed` before any correct attempt.

## SEO

Everything lives in the `<head>` of the generated file:

- `<title>`, a 153-character `description` (fits Google's snippet), `keywords`,
  `author`, `robots`, `canonical`, `theme-color`
- **Open Graph** + **Twitter** `summary_large_image` cards pointing at `og.png`
  (1200×630, generated by `ogmake.js`)
- **JSON-LD** with three nodes: `SoftwareApplication`, a `Person` for the author
  linked via `sameAs` to their LinkedIn, and a `LearningResource` listing all 12
  topics under `teaches`

Because the app renders itself with JavaScript, `<main>` would be empty to any
crawler that doesn't execute JS, and most social crawlers don't. So the
build inlines a static `<main>` containing the `<h1>`, an intro line and the 12
topics as a `<ul>`, generated from `src/topics.js` so it can't drift. The app
overwrites it on first render, and the browser test asserts both that it's in
the source *and* that it's gone after boot.

To regenerate the share image after changing the copy:

```bash
node ogmake.js     # -> dist/og.png
```

## Supported shell syntax

```js
db.<coll>.find(filter, projection).sort({}).skip(n).limit(n)
db.<coll>.findOne(filter, projection)
db.<coll>.countDocuments(filter)      // and .count()
db.<coll>.distinct(field, filter)
db.<coll>.aggregate([ ...stages ])
ISODate("2024-01-01")
```

## Known limits

- mingo covers the read path only: no writes, no indexes, no `explain()`.
- `$text` search and geospatial operators are not supported.
- The datasets are deliberately tiny (12–24 documents) so you can read them and
  reason about what the answer *should* be. Browse them in the app under
  **Browse the data**.

## Licence

mingo is MIT (bundled). The rest is yours to do whatever you like with.
