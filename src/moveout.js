/* "MongoQuest is now DBQuest" banner: a manual hand-off to the new origin.
   localStorage is origin-scoped, so progress travels in the URL fragment as
   #migrate=<base64 { p: progress, r: revealed }>, which src/migrate.js on
   dbquest.in imports before its first render. Fragments never reach a server.
   Phase 2 replaces this page with bridge/index.html, which does the same hop
   automatically. */
(function () {
  "use strict";

  var NEW = "https://dbquest.in/";
  var STORE_KEY = "mongoquest.v1";
  var MAX_WAIT_MS = 400;   /* how long we let analytics hold the navigation */

  /* Local testing: on localhost or file://, ?to=http://localhost:8081/ overrides the target. */
  var local = location.protocol === "file:" || /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  if (local) {
    var to = /[?&]to=([^&]+)/.exec(location.search);
    if (to) NEW = decodeURIComponent(to[1]);
  }

  function readOld() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return null;
      var s = JSON.parse(raw), p = s.progress || {}, solved = 0;
      for (var k in p) if (p[k] === "solved") solved++;
      return { p: p, r: s.revealed || {}, solved: solved };
    } catch (e) { return null; }
  }

  function targetUrl(old) {
    if (!old) return NEW;
    return NEW + "#migrate=" + encodeURIComponent(btoa(JSON.stringify({ p: old.p, r: old.r })));
  }

  var banner = document.getElementById("moveout");
  if (!banner) return;
  var btn = banner.querySelector("[data-moveout]");
  var txt = banner.querySelector("[data-moveout-text]");

  function paint() {
    var old = readOld(), n = old ? old.solved : 0;
    txt.textContent = n > 0
      ? "Take your " + n + " solved question" + (n === 1 ? "" : "s") + " with you."
      : "Same exercises, new home.";
    btn.textContent = n > 0 ? "Move my progress →" : "Go to dbquest.in →";
    btn.setAttribute("href", targetUrl(old));
  }
  paint();
  /* progress changes while the page is open: keep the link current */
  document.addEventListener("click", function () { setTimeout(paint, 0); });

  btn.addEventListener("click", function (e) {
    e.preventDefault();
    var old = readOld();
    var url = targetUrl(old);
    var gone = false;
    function go() { if (gone) return; gone = true; location.href = url; }
    var live = window.MQA && MQA.enabled && typeof window.gtag === "function";
    if (!live) return go();
    try {
      gtag("event", "migrate_click", {
        had_progress: !!old,
        solved: old ? old.solved : 0,
        transport_type: "beacon",
        event_callback: go
      });
    } catch (err) { return go(); }
    setTimeout(go, MAX_WAIT_MS);
  });
})();
