/* MongoQuest GA4. Loads nothing and sends nothing until GA_ID is a real
   measurement ID, and skips browsers sending Do Not Track. */
(function (global) {
  "use strict";

  var GA_ID_RE = /^G-[A-Z0-9]{6,}$/;
  /* The placeholder matches GA_ID_RE, so it needs its own check. Mirrors site.config.js. */
  var GA_PLACEHOLDER = "G-XXXXXXXXXX";

  var id = global.GA_ID;
  var configured = typeof id === "string" && GA_ID_RE.test(id) && id !== GA_PLACEHOLDER;
  var dnt = global.navigator &&
    (global.navigator.doNotTrack === "1" || global.doNotTrack === "1" || global.navigator.msDoNotTrack === "1");
  var live = configured && !dnt;

  if (live) {
    global.dataLayer = global.dataLayer || [];
    global.gtag = function () { global.dataLayer.push(arguments); };
    global.gtag("js", new Date());
    // page_view is sent by hand so the SPA reports one per screen
    global.gtag("config", id, { send_page_view: false });

    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
    document.head.appendChild(s);
  }

  function send(name, params) {
    if (!live) return;
    try { global.gtag("event", name, params || {}); } catch (e) {}
  }

  var lastPath = null;
  function page(path, title) {
    if (path === lastPath) return;
    lastPath = path;
    if (!live) return;
    try {
      global.gtag("event", "page_view", {
        page_title: title,
        page_path: path,
        page_location: location.origin + location.pathname + "#" + path.replace(/^\//, "")
      });
    } catch (e) {}
  }

  global.MQA = {
    enabled: live,
    configured: configured,
    page: page,
    event: send
  };
})(typeof window !== "undefined" ? window : globalThis);
