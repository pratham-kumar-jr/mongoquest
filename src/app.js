/* MongoQuest UI */
(function () {
  "use strict";

  var STORE_KEY = "mongoquest.v1";
  var DEFAULT_COLL = "restaurants";
  var TOAST_MS = 2200;
  var ERR_MAX = 90;
  /* Private-use char: fences out code blocks during markdown rendering without
     colliding with anything a cheatsheet can contain. */
  var CODE_MARK = "\uE000";
  var BLOCK_ONE = new RegExp("^" + CODE_MARK + "BLOCK\\d+" + CODE_MARK + "$");
  var BLOCK_ALL = new RegExp(CODE_MARK + "BLOCK(\\d+)" + CODE_MARK, "g");

  var state = load();
  var view = { name: "topic", topic: TOPICS[0].id, qid: null, tab: "out", coll: DEFAULT_COLL };
  var lastRun = null;
  var editor = null;

  /* A starting skeleton so long pipelines aren't typed from a blank line.
     Derived from the topic only – it gives nothing away that the topic name
     and the question text don't already say. */
  function skeleton(q) {
    if (q.topic.indexOf("agg-") === 0) {
      return "db." + q.coll + ".aggregate([\n  \n])";
    }
    return "db." + q.coll + ".find()";
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      var s = raw ? JSON.parse(raw) : {};
      return { progress: s.progress || {}, drafts: s.drafts || {}, revealed: s.revealed || {} };
    } catch (e) {
      return { progress: {}, drafts: {}, revealed: {} };
    }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  var esc = function (s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  };
  function qsForTopic(t) { return QUESTIONS.filter(function (q) { return q.topic === t; }); }
  function topicById(id) { return TOPICS.filter(function (t) { return t.id === id; })[0]; }
  function qById(id) { return QUESTIONS.filter(function (q) { return q.id === id; })[0]; }
  function solvedIn(t) {
    return qsForTopic(t).filter(function (q) { return state.progress[q.id] === "solved"; }).length;
  }
  function inlineMd(s) {
    return esc(s)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[\s(])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  }

  function md(src) {
    var blocks = [], i = 0;
    src = src.replace(/```([a-z]*)\n([\s\S]*?)```/g, function (_, lang, code) {
      blocks.push('<pre><code>' + esc(code.replace(/\n$/, "")) + '</code></pre>');
      return CODE_MARK + "BLOCK" + (blocks.length - 1) + CODE_MARK;
    });

    var lines = src.split("\n"), out = [], listBuf = null, tableBuf = null;

    function flushList() { if (listBuf) { out.push("<ul>" + listBuf.join("") + "</ul>"); listBuf = null; } }
    function flushTable() {
      if (!tableBuf) return;
      var rows = tableBuf.filter(function (r) { return !/^\s*\|[\s:|-]+\|\s*$/.test(r); });
      var html = "<table>";
      rows.forEach(function (r, idx) {
        var cells = r.trim().replace(/^\|/, "").replace(/\|$/, "").split("|");
        var tag = idx === 0 ? "th" : "td";
        html += "<tr>" + cells.map(function (c) { return "<" + tag + ">" + inlineMd(c.trim()) + "</" + tag + ">"; }).join("") + "</tr>";
      });
      out.push(html + "</table>");
      tableBuf = null;
    }

    for (i = 0; i < lines.length; i++) {
      var ln = lines[i];
      if (/^\s*\|.*\|\s*$/.test(ln)) { flushList(); (tableBuf = tableBuf || []).push(ln); continue; }
      flushTable();
      if (/^###\s+/.test(ln)) { flushList(); out.push("<h3>" + inlineMd(ln.replace(/^###\s+/, "")) + "</h3>"); continue; }
      if (/^##\s+/.test(ln)) { flushList(); out.push("<h2>" + inlineMd(ln.replace(/^##\s+/, "")) + "</h2>"); continue; }
      if (/^>\s?/.test(ln)) { flushList(); out.push("<blockquote>" + inlineMd(ln.replace(/^>\s?/, "")) + "</blockquote>"); continue; }
      if (/^\s*[-*]\s+/.test(ln)) { (listBuf = listBuf || []).push("<li>" + inlineMd(ln.replace(/^\s*[-*]\s+/, "")) + "</li>"); continue; }
      flushList();
      if (BLOCK_ONE.test(ln.trim())) { out.push(ln.trim()); continue; }
      if (ln.trim() === "") continue;
      out.push("<p>" + inlineMd(ln) + "</p>");
    }
    flushList(); flushTable();

    return out.join("\n").replace(BLOCK_ALL, function (_, n) { return blocks[Number(n)]; });
  }

  function renderSide() {
    var total = QUESTIONS.length;
    var done = QUESTIONS.filter(function (q) { return state.progress[q.id] === "solved"; }).length;
    document.getElementById("obar").style.width = (total ? (done / total) * 100 : 0) + "%";
    document.getElementById("otxt").textContent = done + " / " + total;

    var h = '<div class="side-label">Topics</div>';
    TOPICS.forEach(function (t) {
      var qs = qsForTopic(t.id), s = solvedIn(t.id);
      var pct = qs.length ? (s / qs.length) * 100 : 0;
      var cls = "tnav" + (view.name === "topic" && view.topic === t.id ? " active" : "") + (s === qs.length && qs.length ? " done" : "");
      h += '<button class="' + cls + '" data-topic="' + t.id + '">' +
        '<span class="ic">' + t.icon + '</span><span class="tn">' + esc(t.name) + '</span>' +
        '<span class="cnt">' + s + '/' + qs.length + '</span></button>' +
        '<div class="minibar"><i style="width:' + pct + '%"></i></div>';
    });
    h += '<div class="side-label">Reference</div>' +
      '<button class="tnav" data-nav="sheet"><span class="ic">▤</span><span class="tn">Full cheatsheet</span></button>' +
      '<button class="tnav" data-nav="data"><span class="ic">⛁</span><span class="tn">Browse the data</span></button>' +
      '<button class="tnav" data-nav="reset"><span class="ic">↺</span><span class="tn">Reset progress</span></button>' +
      '<div class="side-foot">' +
      '<a href="' + AUTHOR.linkedin + '" target="_blank" rel="noopener me author" data-credit>' +
      'Built by <b>' + esc(AUTHOR.name) + '</b>' +
      '<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path fill="currentColor" d="M6.94 5a2 2 0 1 1-4-.002 2 2 0 0 1 4 .002zM7 8.48H3V21h4V8.48zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91l.04-1.68z"/></svg>' +
      '</a></div>';
    document.getElementById("side").innerHTML = h;
  }

  function renderTopic() {
    var t = topicById(view.topic), qs = qsForTopic(t.id);
    var h = '<div class="wrap">' +
      '<h1>' + esc(t.name) + '</h1>' +
      '<p class="sub">' + esc(t.blurb) + ' &nbsp;·&nbsp; ' + solvedIn(t.id) + ' of ' + qs.length + ' solved</p>' +
      '<div class="card"><div class="sheet">' + md(t.sheet) + '</div></div>' +
      '<h2>Questions</h2>';
    qs.forEach(function (q, i) {
      var st = state.progress[q.id] || "";
      h += '<button class="qrow ' + st + '" data-q="' + q.id + '">' +
        '<span class="st">' + (st === "solved" ? "✓" : st === "attempted" ? "•" : "") + '</span>' +
        '<span class="qt"><span class="qp">' + (i + 1) + '. ' + inlineMd(q.prompt) + '</span>' +
        '<span class="qm"><span class="pill ' + q.difficulty + '">' + q.difficulty + '</span>' +
        '<span class="pill coll">' + q.coll + '</span></span></span></button>';
    });
    h += "</div>";
    document.getElementById("main").innerHTML = h;
  }

  function renderQuestion() {
    var q = qById(view.qid), t = topicById(q.topic);
    var draft = state.drafts[q.id] !== undefined ? state.drafts[q.id] : skeleton(q);
    var revealed = !!state.revealed[q.id];
    var idx = qsForTopic(q.topic).map(function (x) { return x.id; }).indexOf(q.id);

    var h = '<div class="wrap">' +
      '<button class="crumb" data-topic="' + t.id + '">← ' + esc(t.name) + '</button>' +
      '<div class="meta"><span class="pill ' + q.difficulty + '">' + q.difficulty + '</span>' +
      '<span class="pill coll">db.' + q.coll + '</span>' +
      '<span style="color:var(--fg3);font-size:12.5px">Question ' + (idx + 1) + ' of ' + qsForTopic(q.topic).length + '</span></div>' +
      '<div class="prompt">' + inlineMd(q.prompt) + '</div>' +
      '<details class="hint"><summary>Show hint</summary><div class="hb">' + inlineMd(q.hint) + '</div></details>' +
      '<div class="ed-shell" id="edhost"></div>' +
      '<div class="actions">' +
      '<button class="btn" id="btnRun">Run</button>' +
      '<button class="btn primary" id="btnCheck">Check answer</button>' +
      '<span class="kbd">Ctrl</span><span class="kbd">↵</span>' +
      '<span style="flex:1"></span>' +
      '<button class="btn ghost sm" id="btnSol">' + (revealed ? "Hide" : "Show") + ' solution</button>' +
      '<button class="btn ghost sm" id="btnClear">Clear</button>' +
      '</div>' +
      '<div id="verdict"></div>' +
      (revealed ? '<div class="card"><div class="sheet"><h3>Reference solution</h3>' + md("```js\n" + q.solution + "\n```") + '</div></div>' : "") +
      '<div class="tabs">' +
      '<button class="tab ' + (view.tab === "out" ? "active" : "") + '" data-tab="out">Your output</button>' +
      '<button class="tab ' + (view.tab === "exp" ? "active" : "") + '" data-tab="exp">Expected output</button>' +
      '<button class="tab ' + (view.tab === "coll" ? "active" : "") + '" data-tab="coll">db.' + q.coll + '</button>' +
      '</div><pre class="out" id="out"></pre>' +
      '<div style="display:flex;gap:8px;margin-top:20px">' +
      (idx > 0 ? '<button class="btn sm" data-q="' + qsForTopic(q.topic)[idx - 1].id + '">← Previous</button>' : "") +
      (idx < qsForTopic(q.topic).length - 1 ? '<button class="btn sm" data-q="' + qsForTopic(q.topic)[idx + 1].id + '">Next →</button>' : "") +
      '</div></div>';

    document.getElementById("main").innerHTML = h;
    renderOut();

    editor = MQEditor.mount(document.getElementById("edhost"), draft, {
      onChange: function (v) { state.drafts[q.id] = v; save(); },
      onSubmit: doCheck
    });

    document.getElementById("btnRun").onclick = doRun;
    document.getElementById("btnCheck").onclick = doCheck;
    document.getElementById("btnClear").onclick = function () {
      editor.value = skeleton(q); state.drafts[q.id] = editor.value; save(); editor.focus();
    };
    document.getElementById("btnSol").onclick = function () {
      state.revealed[q.id] = !state.revealed[q.id];
      if (state.revealed[q.id]) track("solution_revealed", { solved_already: state.progress[q.id] === "solved" });
      save(); renderQuestion();
    };
    Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (b) {
      b.onclick = function () { view.tab = b.dataset.tab; renderQuestion(); };
    });
    editor.focus();
    editor.el.selectionStart = editor.el.selectionEnd = editor.value.length;
  }

  function renderOut() {
    var pre = document.getElementById("out");
    if (!pre) return;
    var q = qById(view.qid);
    if (view.tab === "coll") {
      pre.textContent = MQEngine.render({ kind: "docs", value: DATASETS[q.coll] });
      return;
    }
    if (view.tab === "exp") {
      if (!state.revealed[q.id] && state.progress[q.id] !== "solved") {
        pre.innerHTML = '<span class="c">// Hidden until you solve it – or click "Show solution".</span>';
        return;
      }
      try { pre.textContent = MQEngine.render(MQEngine.run(q.solution, DATASETS)); }
      catch (e) { pre.textContent = "// solution error: " + e.message; }
      return;
    }
    if (!lastRun || lastRun.qid !== q.id) {
      pre.innerHTML = '<span class="c">// Run your query to see the output here.</span>';
      return;
    }
    pre.textContent = lastRun.text;
  }

  function verdict(kind, icon, msg) {
    var el = document.getElementById("verdict");
    if (el) el.innerHTML = '<div class="verdict ' + kind + '"><span class="vi">' + icon + '</span><span>' + msg + '</span></div>';
  }

  function doRun() {
    var q = qById(view.qid), code = editor.value;
    view.tab = "out";
    try {
      var res = MQEngine.run(code, DATASETS);
      lastRun = { qid: q.id, res: res, text: MQEngine.render(res) };
      track("query_run", { docs_returned: res.kind === "docs" ? res.value.length : 1 });
      verdict("err", "▸", "Query ran. " + (res.kind === "docs" ? res.value.length + " document(s) returned." : "Result shown below.") + " Hit <b>Check answer</b> when you think it's right.");
    } catch (e) {
      lastRun = { qid: q.id, res: null, text: "// " + e.message };
      track("query_error", { error_message: String(e.message).slice(0, ERR_MAX), phase: "run" });
      verdict("err", "⚠", esc(e.message));
    }
    syncTabs();
    renderOut();
  }

  function doCheck() {
    var q = qById(view.qid), code = editor.value;
    view.tab = "out";
    var res;
    try {
      res = MQEngine.run(code, DATASETS);
    } catch (e) {
      lastRun = { qid: q.id, res: null, text: "// " + e.message };
      mark(q.id, "attempted");
      track("question_attempt", { result: "error" });
      track("query_error", { error_message: String(e.message).slice(0, ERR_MAX), phase: "check" });
      verdict("err", "⚠", esc(e.message));
      syncTabs(); renderOut(); renderSide();
      return;
    }
    lastRun = { qid: q.id, res: res, text: MQEngine.render(res) };

    var expected;
    try { expected = MQEngine.run(q.solution, DATASETS); }
    catch (e) { verdict("err", "⚠", "The reference solution failed to run – that's a bug in the question bank."); return; }

    var r = MQEngine.compare(res, expected, !!q.ordered);
    if (r.ok) {
      var wasNew = state.progress[q.id] !== "solved";
      mark(q.id, "solved");
      track("question_attempt", { result: "correct" });
      if (wasNew) {
        track("question_solved", { revealed_first: !!state.revealed[q.id] });
        if (solvedIn(q.topic) === qsForTopic(q.topic).length) MQA.event("topic_completed", { topic: q.topic });
        var done = QUESTIONS.filter(function (x) { return state.progress[x.id] === "solved"; }).length;
        if (done === QUESTIONS.length) MQA.event("all_completed", {});
      }
      verdict("ok", "✓", "Correct." + (q.ordered ? " Order matched too." : ""));
      toast("Solved · " + (solvedIn(q.topic)) + "/" + qsForTopic(q.topic).length + " in " + topicById(q.topic).name);
    } else {
      mark(q.id, "attempted");
      track("question_attempt", { result: "wrong", reason: String(r.reason).slice(0, ERR_MAX) });
      verdict("no", "✗", esc(r.reason));
    }
    syncTabs(); renderOut(); renderSide();
  }

  function syncTabs() {
    Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (b) {
      b.classList.toggle("active", b.dataset.tab === view.tab);
    });
  }

  function mark(id, st) {
    if (state.progress[id] === "solved" && st === "attempted") return;
    state.progress[id] = st; save();
  }

  function renderSheet() {
    var h = '<div class="wrap"><h1>The complete cheatsheet</h1>' +
      '<p class="sub">Every topic sheet, in one page. Ctrl+F is your friend. Ctrl+P prints it cleanly.</p>' +
      '<div class="card"><div class="sheet">' + md(MASTER_INTRO);
    TOPICS.forEach(function (t) {
      h += '<h2>' + t.icon + "  " + esc(t.name) + "</h2>" + md(t.sheet);
    });
    h += "</div></div></div>";
    document.getElementById("main").innerHTML = h;
  }

  function renderData() {
    var names = Object.keys(DATASETS);
    if (names.indexOf(view.coll) < 0) view.coll = names[0];
    var h = '<div class="wrap"><h1>The data</h1>' +
      '<p class="sub">Six small collections. Everything you practise on lives here – read it, it makes the questions obvious.</p>' +
      '<div class="colltabs">';
    names.forEach(function (n) {
      h += '<button class="colltab ' + (n === view.coll ? "active" : "") + '" data-coll="' + n + '">' + n + ' <span style="opacity:.6">(' + DATASETS[n].length + ')</span></button>';
    });
    h += '</div><pre class="out" style="border-radius:10px;border-top:1px solid var(--line);max-height:none">' +
      esc(MQEngine.render({ kind: "docs", value: DATASETS[view.coll] })) + "</pre></div>";
    document.getElementById("main").innerHTML = h;
  }

  var toastTimer;
  function toast(msg) {
    var el = document.getElementById("toast");
    el.textContent = msg; el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, TOAST_MS);
  }

  function track(name, extra) {
    var q = view.qid ? qById(view.qid) : null;
    var base = q ? { question_id: q.id, topic: q.topic, difficulty: q.difficulty, collection: q.coll } : {};
    if (extra) for (var k in extra) base[k] = extra[k];
    MQA.event(name, base);
  }

  function trackPage() {
    if (view.name === "topic") MQA.page("/topic/" + view.topic, topicById(view.topic).name);
    else if (view.name === "q") MQA.page("/question/" + view.qid, "Q " + view.qid + " – " + topicById(qById(view.qid).topic).name);
    else if (view.name === "sheet") MQA.page("/cheatsheet", "Full cheatsheet");
    else if (view.name === "data") MQA.page("/data/" + view.coll, "Data – " + view.coll);
  }

  function render() {
    renderSide();
    if (view.name === "topic") renderTopic();
    else if (view.name === "q") renderQuestion();
    else if (view.name === "sheet") renderSheet();
    else if (view.name === "data") renderData();
    trackPage();
    document.getElementById("main").scrollTop = 0;
    document.getElementById("side").classList.remove("open");
  }

  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-topic],[data-q],[data-nav],[data-coll],[data-credit]");
    if (!el) return;
    if (el.hasAttribute("data-credit")) { MQA.event("credit_click", {}); return; }
    if (el.dataset.q) { view.name = "q"; view.qid = el.dataset.q; view.tab = "out"; lastRun = null; render(); return; }
    if (el.dataset.topic) { view.name = "topic"; view.topic = el.dataset.topic; render(); return; }
    if (el.dataset.coll) { view.coll = el.dataset.coll; renderData(); return; }
    var n = el.dataset.nav;
    if (n === "sheet") { view.name = "sheet"; render(); }
    else if (n === "data") { view.name = "data"; render(); }
    else if (n === "reset") {
      if (confirm("Clear all progress and saved drafts?")) {
        MQA.event("progress_reset", { solved_before: QUESTIONS.filter(function (x) { return state.progress[x.id] === "solved"; }).length });
        state = { progress: {}, drafts: {}, revealed: {} }; save(); lastRun = null; render();
        toast("Progress cleared");
      }
    }
  });

  document.getElementById("menu").onclick = function () {
    document.getElementById("side").classList.toggle("open");
  };

  render();
})();
