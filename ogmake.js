/* Renders dist/og.png, the social preview card. */
const { chromium } = require("playwright");
const { AUTHOR } = require("./site.config");
const { loadSrc } = require("./srcload");

const WIDTH = 1200;
const HEIGHT = 630;
const { TOPICS, QUESTIONS } = loadSrc(["src/topics.js", "src/questions.js"], ["TOPICS", "QUESTIONS"]);

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0}
body{width:${WIDTH}px;height:${HEIGHT}px;background:#0e1116;color:#e6edf3;
  font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  display:flex;flex-direction:column;justify-content:center;padding:0 76px;position:relative;overflow:hidden}
.glow{position:absolute;width:760px;height:760px;border-radius:50%;right:-260px;top:-240px;
  background:radial-gradient(circle,rgba(0,237,100,.18),transparent 62%)}
.leaf{font-size:60px;line-height:1}
h1{font-size:74px;letter-spacing:-2.4px;margin:16px 0 0;font-weight:800}
h1 span{color:#00ed64}
p{font-size:27px;color:#9aa7b4;margin:18px 0 0;max-width:840px;line-height:1.45}
.chips{display:flex;gap:11px;margin-top:34px;flex-wrap:wrap;max-width:900px}
.chip{border:1px solid #252d38;background:#151a21;border-radius:99px;padding:8px 17px;font-size:19px;color:#9aa7b4}
.chip b{color:#c79bff;font-weight:600;font-family:ui-monospace,Menlo,monospace}
.code{position:absolute;right:76px;top:78px;font-family:ui-monospace,Menlo,Consolas,monospace;
  font-size:19px;color:#5b6675;text-align:right;line-height:1.7}
.code i{color:#c79bff;font-style:normal}.code s{color:#a5e887;text-decoration:none}
.foot{position:absolute;left:76px;bottom:56px;font-size:19px;color:#6b7785}
.foot b{color:#9aa7b4;font-weight:600}
</style></head><body>
<div class="glow"></div>
<div class="leaf">🍃</div>
<h1>Mongo<span>Quest</span></h1>
<p>${QUESTIONS.length} hands-on MongoDB query exercises, per-topic cheatsheets, and a runner that checks your answer – all in the browser.</p>
<div class="chips">
  <div class="chip"><b>find()</b></div><div class="chip"><b>$elemMatch</b></div>
  <div class="chip"><b>$group</b></div><div class="chip"><b>$unwind</b></div>
  <div class="chip"><b>$lookup</b></div><div class="chip">${TOPICS.length} topics</div><div class="chip">no signup</div>
</div>
<div class="code">db.restaurants.aggregate([<br>&nbsp;&nbsp;{ <i>$unwind</i>: <s>"$grades"</s> },<br>&nbsp;&nbsp;{ <i>$group</i>: { _id: <s>"$grades.grade"</s> } }<br>])</div>
<div class="foot">Built by <b>${AUTHOR.name}</b></div>
</body></html>`;
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const p = await b.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
  await p.setContent(html);
  await p.waitForTimeout(300);
  await p.screenshot({ path: "dist/og.png" });
  await b.close();
})();
