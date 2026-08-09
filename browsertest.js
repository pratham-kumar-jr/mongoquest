/* Real-browser verification: load index.html in Chromium and
   (1) run every reference solution through the page's own engine,
   (2) drive the UI end to end. */
const { chromium } = require("playwright");
const path = require("path");

(async () => {
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });

  await page.goto("file://" + path.join(__dirname, "index.html"));
  await page.waitForSelector(".tnav");

  /* ---- 1. every solution runs, and validates against itself ---- */
  const res = await page.evaluate(() => {
    const out = { total: QUESTIONS.length, bad: [], empty: [], counts: {} };
    for (const q of QUESTIONS) {
      let r;
      try { r = MQEngine.run(q.solution, DATASETS); }
      catch (e) { out.bad.push([q.id, "RUN " + e.message]); continue; }
      const n = r.kind === "docs" ? r.value.length : 1;
      out.counts[q.id] = n;
      if (r.kind === "docs" && r.value.length === 0) out.empty.push(q.id);
      const c = MQEngine.compare(r, r, !!q.ordered);
      if (!c.ok) out.bad.push([q.id, "SELF " + c.reason]);
      // rendering must not throw
      try { MQEngine.render(r); } catch (e) { out.bad.push([q.id, "RENDER " + e.message]); }
    }
    return out;
  });

  /* ---- 2. a wrong answer must be rejected, ordered questions must care ---- */
  const neg = await page.evaluate(() => {
    const bad = [];
    const sample = QUESTIONS.filter(q => q.coll === "restaurants").slice(0, 40);
    for (const q of sample) {
      const exp = MQEngine.run(q.solution, DATASETS);
      const wrong = MQEngine.run("db.restaurants.find({ borough: 'Nowhere' })", DATASETS);
      if (MQEngine.compare(wrong, exp, !!q.ordered).ok && !(exp.kind === "docs" && exp.value.length === 0)) {
        bad.push(q.id + " accepted an empty wrong answer");
      }
    }
    // an order-sensitive question must reject the reversed result
    for (const q of QUESTIONS.filter(q => q.ordered)) {
      const exp = MQEngine.run(q.solution, DATASETS);
      if (exp.kind !== "docs" || exp.value.length < 2) continue;
      const rev = { kind: "docs", value: exp.value.slice().reverse() };
      if (MQEngine.compare(rev, exp, true).ok) {
        const a = JSON.stringify(exp.value), b = JSON.stringify(rev.value);
        if (a !== b) bad.push(q.id + " ordered check did not reject reversed output");
      }
    }
    return bad;
  });

  /* ---- 2b. formatting every solution must not change its result ---- */
  const fmtSafe = await page.evaluate(() => {
    const bad = [];
    for (const q of QUESTIONS) {
      let f;
      try { f = MQEditor.format(q.solution); }
      catch (e) { bad.push(q.id + " format threw: " + e.message); continue; }
      if (MQEditor.format(f) !== f) bad.push(q.id + " format is not idempotent");
      let a, b;
      try { a = MQEngine.run(q.solution, DATASETS); b = MQEngine.run(f, DATASETS); }
      catch (e) { bad.push(q.id + " formatted query failed to run: " + e.message); continue; }
      if (!MQEngine.compare(b, a, true).ok) bad.push(q.id + " formatted query returned something different");
    }
    return bad;
  });

  /* ---- 3. UI smoke: solve one, see it persist ---- */
  await page.click('[data-topic="basics"]');
  await page.click('[data-q="b3"]');
  await page.fill(".ed-ta", 'db.restaurants.find({}, { name: 1, borough: 1, cuisine: 1, _id: 0 })');
  await page.click("#btnCheck");
  await page.waitForSelector(".verdict.ok");
  const okText = await page.textContent(".verdict.ok");

  await page.fill(".ed-ta", 'db.restaurants.find({})');
  await page.click("#btnCheck");
  await page.waitForSelector(".verdict.no");
  const noText = await page.textContent(".verdict.no");

  await page.fill(".ed-ta", 'db.restaurants.find({');
  await page.click("#btnCheck");
  await page.waitForSelector(".verdict.err");

  // progress survives reload
  await page.reload();
  await page.waitForSelector(".tnav");
  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem("mongoquest.v1")).progress.b3);

  // cheatsheet + data browser render
  await page.click('[data-nav="sheet"]');
  const sheetH2 = await page.$$eval(".sheet h2", (n) => n.length);
  await page.click('[data-nav="data"]');
  await page.click('[data-coll="movies"]');
  const dataLen = (await page.textContent("pre.out")).length;

  /* ---- 4. editor: highlighting, bracket matching, typing aids ---- */
  await page.click('[data-topic="agg-unwind"]');
  await page.click('[data-q="u1"]');

  // skeleton prefill for aggregation questions
  const skel = await page.inputValue(".ed-ta");

  // highlighting actually tokenises
  await page.fill(".ed-ta", 'db.restaurants.aggregate([{ $unwind: "$grades" }])');
  const tokens = await page.evaluate(() => ({
    op: [...document.querySelectorAll(".t-op")].map(n => n.textContent),
    str: [...document.querySelectorAll(".t-str")].map(n => n.textContent),
    db: [...document.querySelectorAll(".t-db")].map(n => n.textContent),
    fn: [...document.querySelectorAll(".t-fn")].map(n => n.textContent),
    depths: [...document.querySelectorAll(".t-br")].map(n => n.className)
  }));

  // matching-bracket highlight: put the caret right after the opening [
  await page.evaluate(() => {
    const ta = document.querySelector(".ed-ta");
    const i = ta.value.indexOf("[");
    ta.focus(); ta.selectionStart = ta.selectionEnd = i + 1;
    ta.dispatchEvent(new Event("click", { bubbles: true }));
  });
  const matched = await page.$$eval(".t-match", n => n.map(x => x.textContent));

  // unmatched brackets are flagged, with a count in the status bar
  await page.fill(".ed-ta", 'db.restaurants.aggregate([{ $unwind: "$grades" }');
  const bad = await page.$$eval(".t-bad", n => n.length);
  const badMsg = await page.textContent(".ed-stat");

  // the exact query the user pasted -> should flag the missing brace
  await page.fill(".ed-ta", `db.restaurants.aggregate([
{$unwind:"grades"},
{_group:{_id:{name:"$name",grade:"$grades.garde"},
        {count:{$sum:1}},
{$project:{_id:"$grades.grade",count:count}}])`);
  const pastedBad = await page.textContent(".ed-stat");

  // auto-close pairs
  await page.fill(".ed-ta", "");
  await page.click(".ed-ta");
  await page.keyboard.type("db.x.find({");
  const autoClosed = await page.inputValue(".ed-ta");

  // Enter between a pair opens a block and indents
  await page.keyboard.press("Enter");
  const blocked = await page.inputValue(".ed-ta");

  // typing the closing brace skips over instead of duplicating
  await page.fill(".ed-ta", "");
  await page.click(".ed-ta");
  await page.keyboard.type("find({})");
  const skipOver = await page.inputValue(".ed-ta");

  // backspace inside an empty pair removes both
  await page.fill(".ed-ta", "");
  await page.click(".ed-ta");
  await page.keyboard.type("a(");
  await page.keyboard.press("Backspace");
  const pairDeleted = await page.inputValue(".ed-ta");

  // formatter turns a one-liner into a readable pipeline
  await page.fill(".ed-ta", 'db.restaurants.aggregate([{$unwind:"$grades"},{$group:{_id:"$grades.grade",count:{$sum:1}}}])');
  await page.click('[data-act="fmt"]');
  const formatted = await page.inputValue(".ed-ta");

  // ...and the formatted version still solves the question
  await page.click("#btnCheck");
  await page.waitForSelector(".verdict.ok, .verdict.no");
  const fmtVerdict = await page.$eval(".verdict", n => n.className);

  // line numbers track the line count
  const gutter = await page.textContent(".ed-gut");

  /* ---- 5. analytics: silent when unset, wired up when configured ----
     Both variants are generated from the built file, so the assertions hold
     whatever GA_ID site.config.js currently carries. */
  const fs = require("fs");
  const built = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  const withId = (id) => built.replace(/var GA_ID = "[^"]*"/, 'var GA_ID = "' + id + '"');
  const variant = (name, id) => {
    const f = path.join(__dirname, name);
    fs.writeFileSync(f, withId(id));
    return f;
  };
  const offFile = variant("_gaoff.html", "G-XXXXXXXXXX");

  const p0 = await browser.newPage();
  const gaReqsDefault = [];
  p0.on("request", r => { if (/googletagmanager|google-analytics/.test(r.url())) gaReqsDefault.push(r.url()); });
  await p0.goto("file://" + offFile);
  await p0.waitForSelector(".tnav");
  const gaOff = await p0.evaluate(() => ({ configured: MQA.configured, enabled: MQA.enabled, hasGtag: typeof window.gtag }));
  await p0.close();
  fs.unlinkSync(offFile);

  /* never phone home from a test run */
  await page.route(/googletagmanager|google-analytics/, (route) =>
    route.fulfill({ status: 200, contentType: "application/javascript", body: "" }));
  await page.goto("file://" + path.join(__dirname, "index.html"));
  await page.waitForSelector(".tnav");
  await page.click('[data-topic="basics"]');
  await page.click('[data-q="b1"]');
  await page.click("#btnCheck");
  await page.waitForTimeout(150);

  // scrollbar styling reaches the scrollable panes
  const sb = await page.evaluate(() => {
    const m = getComputedStyle(document.getElementById("main"));
    const css = [...document.styleSheets].flatMap(s => { try { return [...s.cssRules].map(r => r.cssText); } catch (e) { return []; } }).join("\n");
    return {
      scrollbarWidth: m.scrollbarWidth || m.getPropertyValue("scrollbar-width"),
      hasWebkitRule: /::-webkit-scrollbar-thumb/.test(css),
      hasHoverRule: /:hover::-webkit-scrollbar-thumb/.test(css),
      mainScrolls: document.getElementById("main").scrollHeight > document.getElementById("main").clientHeight
    };
  });

  /* now the same file with a real-looking measurement ID */
  const onFile = variant("_gatest.html", "G-TEST123456");

  const p2 = await browser.newPage();
  const gaReqs = [];
  await p2.route(/googletagmanager/, (route) => { gaReqs.push(route.request().url()); route.abort(); });
  await p2.goto("file://" + onFile);
  await p2.waitForSelector(".tnav");
  await p2.click('[data-topic="agg-group"]');
  await p2.click('[data-q="p1"]');
  await p2.fill(".ed-ta", 'db.restaurants.aggregate([{ $group: { _id: "$borough", count: { $sum: 1 } } }])');
  await p2.click("#btnCheck");
  await p2.fill(".ed-ta", 'db.restaurants.find({');
  await p2.click("#btnCheck");
  await p2.click("#btnSol");
  await p2.waitForTimeout(150);
  const gaOn = await p2.evaluate(() => ({
    enabled: MQA.enabled,
    events: window.dataLayer.filter(a => a[0] === "event").map(a => [a[1], a[2] && (a[2].page_path || a[2].result || a[2].phase || "")]),
    configCall: window.dataLayer.some(a => a[0] === "config")
  }));
  await p2.close();
  fs.unlinkSync(onFile);

  /* ---- 6. SEO metadata + author credit ---- */
  const seo = await page.evaluate(() => {
    const meta = (sel) => (document.querySelector(sel) || {}).content;
    let ld = null, ldErr = null;
    try { ld = JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent); }
    catch (e) { ldErr = e.message; }
    const person = ld && ld["@graph"].find(n => n["@type"] === "Person");
    const app = ld && ld["@graph"].find(n => n["@type"] === "SoftwareApplication");
    const credit = document.querySelector("[data-credit]");
    return {
      title: document.title,
      descLen: (meta('meta[name="description"]') || "").length,
      canonical: !!document.querySelector('link[rel="canonical"]'),
      og: ["og:title", "og:description", "og:url", "og:image", "og:type"].filter(p => document.querySelector('meta[property="' + p + '"]')).length,
      twitter: ["twitter:card", "twitter:title", "twitter:image"].filter(n => document.querySelector('meta[name="' + n + '"]')).length,
      ldErr: ldErr,
      ldTypes: ld ? ld["@graph"].map(n => n["@type"]) : [],
      author: person && person.name,
      authorSameAs: person && person.sameAs,
      appAuthorLinked: !!(app && app.author && app.author["@id"] === (person && person["@id"])),
      teaches: ld ? (ld["@graph"].find(n => n["@type"] === "LearningResource") || {}).teaches.length : 0,
      creditText: credit && credit.textContent.trim(),
      creditHref: credit && credit.getAttribute("href"),
      creditRel: credit && credit.getAttribute("rel"),
      creditTarget: credit && credit.getAttribute("target"),
      bootGone: !/Topics covered/.test(document.getElementById("main").innerHTML),
      lang: document.documentElement.lang
    };
  });

  // the static boot content must exist in the file crawlers download
  const rawHtml = require("fs").readFileSync(path.join(__dirname, "index.html"), "utf8");
  const seoStatic = {
    bootInSource: /Topics covered/.test(rawHtml),
    topicsListed: (rawHtml.match(/<li><b>/g) || []).length,
    noscript: /<noscript>/.test(rawHtml),
    placeholders: (rawHtml.match(/YOUR-GITHUB-USERNAME/g) || []).length
  };
  const sidecars = ["robots.txt", "sitemap.xml", "og.png"].filter(f => require("fs").existsSync(path.join(__dirname, f)));

  await page.setViewportSize({ width: 390, height: 800 });
  await page.click("#menu");
  const sideOpen = await page.$eval("#side", (n) => n.classList.contains("open"));

  await browser.close();

  console.log("questions:", res.total);
  console.log("failures:", res.bad.length ? JSON.stringify(res.bad, null, 1) : "none");
  console.log("empty results:", res.empty.join(", ") || "none");
  console.log("negative-test problems:", neg.length ? neg : "none");
  console.log("format-safety over all solutions:", fmtSafe.length ? fmtSafe : "none");
  console.log("correct verdict:", JSON.stringify(okText.trim()));
  console.log("wrong verdict:", JSON.stringify(noText.trim()));
  console.log("b3 persisted as:", persisted);
  console.log("cheatsheet sections:", sheetH2, "| data view chars:", dataLen, "| mobile menu:", sideOpen);
  console.log("\n--- editor ---");
  console.log("skeleton prefill:", JSON.stringify(skel));
  console.log("tokens $op:", tokens.op, "str:", tokens.str, "db:", tokens.db, "fn:", tokens.fn);
  console.log("bracket depth classes:", tokens.depths.join(" | "));
  console.log("matched pair highlighted:", matched);
  console.log("unmatched flagged:", bad, "status:", JSON.stringify(badMsg));
  console.log("user's pasted query status:", JSON.stringify(pastedBad));
  console.log("auto-close:", JSON.stringify(autoClosed));
  console.log("smart Enter:", JSON.stringify(blocked));
  console.log("skip-over close:", JSON.stringify(skipOver));
  console.log("pair backspace:", JSON.stringify(pairDeleted));
  console.log("formatted:\n" + formatted);
  console.log("verdict after format:", fmtVerdict);
  console.log("gutter:", JSON.stringify(gutter));
  console.log("\n--- scrollbars ---");
  console.log(sb);
  console.log("\n--- analytics ---");
  console.log("shipped GA_ID:", (built.match(/var GA_ID = "([^"]*)"/) || [])[1]);
  console.log("unset:", gaOff, "| network calls made:", gaReqsDefault.length);
  console.log("configured -> enabled:", gaOn.enabled, "| gtag config sent:", gaOn.configCall, "| script requested:", gaReqs.length > 0);
  console.log("events:", JSON.stringify(gaOn.events));
  console.log("\n--- seo ---");
  console.log(seo);
  console.log("static:", seoStatic, "| sidecar files:", sidecars);
  console.log("page errors:", errors.length ? errors : "none");

  const fatal = res.bad.length || neg.length || fmtSafe.length || errors.length || persisted !== "solved"
    || gaOff.enabled || gaOff.configured || gaReqsDefault.length
    || !gaOn.enabled || !gaOn.configCall
    || !sb.hasWebkitRule || !sb.hasHoverRule
    || seo.ldErr || seo.og < 5 || seo.twitter < 3 || !seo.canonical
    || !seo.appAuthorLinked || !seo.bootGone || !seoStatic.bootInSource
    || seo.creditHref !== "https://www.linkedin.com/in/pratham-kumar-jr/"
    || sidecars.length !== 3;
  process.exit(fatal ? 1 : 0);
})();
