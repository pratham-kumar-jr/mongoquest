# MongoQuest

Practise MongoDB queries in the browser. 110 questions across 12 topics, a
cheatsheet for each, and a runner that checks your answer.

https://pratham-kumar-jr.github.io/mongoquest/

Everything is client side. Queries go through
[mingo](https://github.com/kofrasa/mingo) against in-memory collections, so
there's no server and nothing to sign up for.

## Build

```bash
node build.js      # -> index.html
node verify.js     # runs all 110 reference solutions
```

Neither needs `npm install`; mingo is vendored in `vendor/`.

`index.html` is the entire app in one file, about 240 KB, and works offline.
`og.png`, `robots.txt` and `sitemap.xml` sit beside it.

The build writes to the repo root because Pages only serves from root or
`/docs`, and root means nothing has to be copied anywhere.

## Deploy

Set `SITE` in `site.config.js` to wherever it's hosted, then:

```bash
node build.js
git add . && git commit -m "deploy" && git push
```

For Pages: Settings > Pages > Deploy from a branch > `main` / root.

`SITE` feeds the canonical URL, `og:url` and the JSON-LD, and the repo name in a
Pages URL is case sensitive, so it has to match exactly.

## Files

```
src/data.js        the six collections
src/topics.js      topics + per-topic cheatsheets
src/master.js      intro for the full cheatsheet page
src/questions.js   the question bank
src/engine.js      mongo shell emulator over mingo, plus answer comparison
src/editor.js      highlighting, bracket matching, formatter
src/analytics.js   GA4
src/app.js         UI
site.config.js     SITE / AUTHOR / GA_ID / TITLE
srcload.js         loads src/* in a vm for the Node scripts
build.js           inlines everything into index.html
verify.js          every reference solution, in Node
browsertest.js     the same again in Chromium, plus the UI
ogmake.js          og.png
```

`browsertest.js` and `ogmake.js` need `npm i && npx playwright install chromium`.
`CHROMIUM_PATH` overrides which browser Playwright uses.

## Adding a question

Nothing stores an expected output. Your query and the reference solution both
run through the engine and the results are compared, so any query that produces
the right documents passes.

```js
{ id: "c10", topic: "comparison", difficulty: "medium", coll: "restaurants",
  prompt: "Find restaurants with fewer than 20 seats.",
  hint: "$lt.",
  solution: `db.restaurants.find({ seats: { $lt: 20 } })` },
```

Add `ordered: true` if the order matters, i.e. anything with a `sort`. Then
rebuild and run `browsertest.js`.

## Analytics

Drop your GA4 ID into `site.config.js` and rebuild. Left as `G-XXXXXXXXXX`
nothing loads at all: no request, no `window.gtag`, no cookies. Once an ID is
set, visitors sending Do Not Track are still skipped.

Page views are sent by hand since it's a single page app (`/topic/<id>`,
`/question/<id>`, `/cheatsheet`, `/data/<collection>`), alongside events for
attempts, solves, runs, query errors, revealed solutions, completed topics and
resets. Most carry `question_id`, `topic`, `difficulty` and `collection`.

## What the engine supports

```js
db.<coll>.find(filter, projection).sort({}).skip(n).limit(n)
db.<coll>.findOne(filter, projection)
db.<coll>.countDocuments(filter)      // and .count()
db.<coll>.distinct(field, filter)
db.<coll>.aggregate([ ...stages ])
ISODate("2024-01-01")
```

Read path only. No writes, no indexes, no `explain()`, no `$text` or geo
operators. The collections are 12 to 24 documents each so you can actually read
them and work out the answer yourself.

## Licence

mingo is MIT and bundled. The rest, do what you like with.
