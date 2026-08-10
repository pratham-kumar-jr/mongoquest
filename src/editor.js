/* MongoQuest code editor: a textarea with a syntax-highlighted layer painted underneath it. */
(function (global) {
  "use strict";

  var INDENT = "  ";
  var OUTDENT_RE = new RegExp("^ {1," + INDENT.length + "}");
  var MIN_ROWS = 7;
  var MAX_ROWS = 26;
  var BRACKET_COLORS = 5;

  /* Row height and padding come from the stylesheet, which changes them per
     breakpoint, so they can never drift out of sync with the painted layer. */
  function metrics(ta) {
    var cs = getComputedStyle(ta);
    return {
      row: parseFloat(cs.lineHeight) || 22,
      chrome: (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0)
    };
  }

  var KEYWORDS = { "true": 1, "false": 1, "null": 1, "undefined": 1, "new": 1, "NaN": 1, "Infinity": 1 };
  var FUNCS = {
    find: 1, findOne: 1, aggregate: 1, countDocuments: 1, count: 1, distinct: 1,
    sort: 1, limit: 1, skip: 1, toArray: 1, pretty: 1, forEach: 1, map: 1,
    ISODate: 1, ObjectId: 1, Date: 1, NumberInt: 1, NumberLong: 1, NumberDecimal: 1
  };
  var OPEN = { "{": "}", "[": "]", "(": ")" };
  var CLOSE = { "}": "{", "]": "[", ")": "(" };
  var PAIRS = { "{": "}", "[": "]", "(": ")", '"': '"', "'": "'", "`": "`" };

  function tokenize(src) {
    var toks = [], i = 0, n = src.length, prev = null;

    function push(t, s, e, extra) {
      var tok = { t: t, s: s, e: e };
      if (extra) for (var k in extra) tok[k] = extra[k];
      toks.push(tok);
      if (t !== "ws" && t !== "com") prev = tok;
      return tok;
    }
    function regexOk() {
      if (!prev) return true;
      if (prev.t === "id" || prev.t === "num" || prev.t === "str" || prev.t === "re") return false;
      if (prev.t === "br" && CLOSE[src.slice(prev.s, prev.e)]) return false;
      return true;
    }

    while (i < n) {
      var c = src[i], j;

      if (c === " " || c === "\t" || c === "\n" || c === "\r") {
        j = i; while (j < n && /\s/.test(src[j])) j++;
        push("ws", i, j); i = j; continue;
      }
      if (c === "/" && src[i + 1] === "/") {
        j = src.indexOf("\n", i); if (j < 0) j = n;
        push("com", i, j); i = j; continue;
      }
      if (c === "/" && src[i + 1] === "*") {
        j = src.indexOf("*/", i + 2); j = j < 0 ? n : j + 2;
        push("com", i, j); i = j; continue;
      }
      if (c === '"' || c === "'" || c === "`") {
        j = i + 1;
        while (j < n) {
          if (src[j] === "\\") { j += 2; continue; }
          if (src[j] === c) { j++; break; }
          if (src[j] === "\n" && c !== "`") break;
          j++;
        }
        push("str", i, j); i = j; continue;
      }
      if (c === "/" && regexOk()) {
        j = i + 1; var cls = false, closed = false;
        while (j < n) {
          if (src[j] === "\\") { j += 2; continue; }
          if (src[j] === "[") cls = true;
          else if (src[j] === "]") cls = false;
          else if (src[j] === "/" && !cls) { j++; closed = true; break; }
          else if (src[j] === "\n") break;
          j++;
        }
        if (closed) { while (j < n && /[a-z]/.test(src[j])) j++; push("re", i, j); i = j; continue; }
      }
      if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(src[i + 1] || ""))) {
        j = i; while (j < n && /[0-9.eE+\-x_a-fA-F]/.test(src[j])) {
          if ((src[j] === "+" || src[j] === "-") && !/[eE]/.test(src[j - 1])) break;
          j++;
        }
        push("num", i, j); i = j; continue;
      }
      if (/[A-Za-z_$]/.test(c)) {
        j = i; while (j < n && /[A-Za-z0-9_$]/.test(src[j])) j++;
        var w = src.slice(i, j);
        var t = w.charAt(0) === "$" ? "op" : KEYWORDS[w] ? "kw" : FUNCS[w] ? "fn" : w === "db" ? "db" : "id";
        push(t, i, j); i = j; continue;
      }
      if (OPEN[c] || CLOSE[c]) { push("br", i, i + 1); i++; continue; }
      push("punc", i, i + 1); i++;
    }

    /* second pass: property keys, and bracket depth + matching */
    var stack = [], depth = 0;
    for (var k = 0; k < toks.length; k++) {
      var tk = toks[k];
      if (tk.t === "br") {
        var ch = src.slice(tk.s, tk.e);
        if (OPEN[ch]) { tk.depth = depth++; stack.push(k); }
        else {
          var open = stack.pop();
          if (open === undefined || src[toks[open].s] !== CLOSE[ch]) { tk.bad = true; if (open !== undefined) toks[open].bad = true; }
          else { toks[open].match = k; tk.match = open; }
          depth = Math.max(0, depth - 1);
          tk.depth = depth;
        }
        continue;
      }
      if (tk.t === "id" || tk.t === "str" || tk.t === "op" || tk.t === "fn" || tk.t === "kw") {
        var m = k + 1;
        while (m < toks.length && (toks[m].t === "ws" || toks[m].t === "com")) m++;
        if (m < toks.length && toks[m].t === "punc" && src[toks[m].s] === ":") {
          if (tk.t !== "op") tk.t = "key";
        }
      }
    }
    for (var q = 0; q < stack.length; q++) toks[stack[q]].bad = true;

    return toks;
  }

  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function highlight(src, toks, matchPair) {
    var out = "", a = matchPair ? matchPair[0] : -1, b = matchPair ? matchPair[1] : -1;
    for (var i = 0; i < toks.length; i++) {
      var tk = toks[i], txt = esc(src.slice(tk.s, tk.e));
      if (tk.t === "ws") { out += txt; continue; }
      var cls = "t-" + tk.t;
      if (tk.t === "br") {
        cls += " d" + ((tk.depth || 0) % BRACKET_COLORS);
        if (tk.bad) cls += " t-bad";
        if (tk.s === a || tk.s === b) cls += " t-match";
      }
      out += '<span class="' + cls + '">' + txt + "</span>";
    }
    return out + "\n";
  }

  /* Only square brackets create indentation. A pipeline gets one stage per
     line, and each stage object stays on its own single line. That is the
     layout that makes a long aggregate readable. */
  function format(src) {
    var toks = tokenize(src), out = "", stack = [], atLineStart = true;
    var pad = function (d) { return new Array(d + 1).join(INDENT); };
    function arrDepth() {
      var d = 0;
      for (var i = 0; i < stack.length; i++) if (stack[i].ch === "[" && stack[i].broke) d++;
      return d;
    }
    function top() { return stack[stack.length - 1] || {}; }
    function write(s) { out += s; atLineStart = false; }
    function newline(d) { out = out.replace(/[ \t]+$/, ""); out += "\n" + pad(d); atLineStart = true; }

    for (var i = 0; i < toks.length; i++) {
      var tk = toks[i];
      if (tk.t === "ws") continue;
      var txt = src.slice(tk.s, tk.e);
      var next = null;
      for (var j = i + 1; j < toks.length; j++) { if (toks[j].t !== "ws") { next = toks[j]; break; } }
      var nextTxt = next ? src.slice(next.s, next.e) : "";

      if (tk.t === "br" && OPEN[txt]) {
        // an array only breaks onto multiple lines when it holds objects,
        // i.e. it is a pipeline. [0, 6, 7] stays inline.
        var broke = txt === "[" && nextTxt === "{";
        write(txt); stack.push({ ch: txt, broke: broke });
        if (broke) newline(arrDepth());
        else if (txt === "{" && nextTxt !== "}") write(" ");
        continue;
      }
      if (tk.t === "br" && CLOSE[txt]) {
        var frame = stack.pop() || {};
        if (txt === "]") { if (frame.broke && !atLineStart) newline(arrDepth()); write(txt); }
        else if (txt === "}") { write((out.slice(-1) === "{" ? "" : " ") + txt); }
        else write(txt);
        continue;
      }
      if (tk.t === "punc" && txt === ",") {
        write(",");
        if (top().ch === "[" && top().broke) newline(arrDepth()); else write(" ");
        continue;
      }
      if (tk.t === "punc" && txt === ":") { write(": "); continue; }
      write(txt);
    }
    return out.replace(/[ \t]+$/gm, "").replace(/\n{3,}/g, "\n\n").trim();
  }

  function mount(host, initial, opts) {
    opts = opts || {};
    host.innerHTML =
      '<div class="ed-bar">' +
      '<span class="ed-lang">mongo shell · JavaScript</span>' +
      '<span class="ed-sp"></span>' +
      '<button class="ed-act" data-act="fmt" title="Format (Ctrl+Shift+F)">Format</button>' +
      '<button class="ed-act" data-act="wrap" title="Toggle line wrap">Wrap</button>' +
      '<span class="ed-stat" data-stat></span>' +
      '</div>' +
      '<div class="ed-body">' +
      '<div class="ed-gut" data-gut></div>' +
      '<div class="ed-scroll">' +
      '<pre class="ed-hl" data-hl aria-hidden="true"><code></code></pre>' +
      '<textarea class="ed-ta" data-ta spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off" wrap="off"></textarea>' +
      '</div></div>';

    var ta = host.querySelector("[data-ta]");
    var hl = host.querySelector("[data-hl] code");
    var gut = host.querySelector("[data-gut]");
    var stat = host.querySelector("[data-stat]");
    var scroll = host.querySelector(".ed-scroll");
    ta.value = initial || "";

    /* Touch screens start wrapped: scrolling a query sideways with a thumb to
       read the half of it that is off screen is not workable. */
    if (global.matchMedia && global.matchMedia("(hover:none)").matches) {
      host.classList.add("wrapped");
      ta.setAttribute("wrap", "soft");
      host.querySelector('[data-act="wrap"]').classList.add("on");
    }

    var api = {
      get value() { return ta.value; },
      set value(v) { ta.value = v; paint(); },
      focus: function () { ta.focus(); },
      el: ta
    };

    function caretPair() {
      if (ta.selectionStart !== ta.selectionEnd) return null;
      var pos = ta.selectionStart, src = ta.value, toks = api._toks;
      for (var i = 0; i < toks.length; i++) {
        var tk = toks[i];
        if (tk.t !== "br") continue;
        if (tk.s === pos || tk.s === pos - 1) {
          if (tk.match !== undefined) return [tk.s, toks[tk.match].s];
          return [tk.s, -1];
        }
      }
      return null;
    }

    function paint() {
      var src = ta.value;
      var toks = tokenize(src);
      api._toks = toks;
      hl.innerHTML = highlight(src, toks, caretPair());

      var lines = src.split("\n").length;
      var g = "";
      for (var i = 1; i <= lines; i++) g += i + "\n";
      gut.textContent = g;

      var m = metrics(ta);
      var rows = Math.min(Math.max(lines + 1, MIN_ROWS), MAX_ROWS);
      scroll.style.height = (rows * m.row + m.chrome) + "px";

      var unbalanced = toks.filter(function (t) { return t.t === "br" && t.bad; }).length;
      stat.textContent = unbalanced ? unbalanced + " unmatched bracket" + (unbalanced > 1 ? "s" : "") : "";
      stat.className = "ed-stat" + (unbalanced ? " bad" : "");
    }

    function sync() {
      hl.parentNode.scrollTop = ta.scrollTop;
      hl.parentNode.scrollLeft = ta.scrollLeft;
      gut.scrollTop = ta.scrollTop;
    }

    function setVal(v, caret) {
      ta.value = v;
      if (caret !== undefined) ta.selectionStart = ta.selectionEnd = caret;
      paint();
      if (opts.onChange) opts.onChange(v);
    }

    function lineStart(v, pos) { var i = v.lastIndexOf("\n", pos - 1); return i + 1; }
    function indentOf(v, pos) {
      var s = lineStart(v, pos), m = /^[ \t]*/.exec(v.slice(s))[0];
      return m;
    }

    ta.addEventListener("input", function () { paint(); if (opts.onChange) opts.onChange(ta.value); });
    ta.addEventListener("scroll", sync);
    ta.addEventListener("click", paint);
    ta.addEventListener("keyup", function (e) {
      if (e.key.indexOf("Arrow") === 0 || e.key === "Home" || e.key === "End") paint();
    });

    ta.addEventListener("keydown", function (e) {
      var v = ta.value, s = ta.selectionStart, en = ta.selectionEnd, ch = e.key;

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (ch === "F" || ch === "f")) {
        e.preventDefault(); setVal(format(ta.value), null); return;
      }
      if ((e.ctrlKey || e.metaKey) && ch === "Enter") { e.preventDefault(); if (opts.onSubmit) opts.onSubmit(); return; }
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      /* Tab: indent / outdent, block-aware */
      if (ch === "Tab") {
        e.preventDefault();
        if (s === en && !e.shiftKey) { setVal(v.slice(0, s) + INDENT + v.slice(en), s + INDENT.length); return; }
        var a = lineStart(v, s), b = v.indexOf("\n", en); if (b < 0) b = v.length;
        var block = v.slice(a, b).split("\n");
        var changed = block.map(function (l) {
          return e.shiftKey ? l.replace(OUTDENT_RE, "") : INDENT + l;
        });
        var nv = v.slice(0, a) + changed.join("\n") + v.slice(b);
        ta.value = nv;
        ta.selectionStart = a; ta.selectionEnd = a + changed.join("\n").length;
        paint(); if (opts.onChange) opts.onChange(nv);
        return;
      }

      /* Enter: keep indent, and open a block when between a pair */
      if (ch === "Enter" && s === en) {
        var ind = indentOf(v, s);
        var before = v.charAt(s - 1), after = v.charAt(s);
        if (OPEN[before] && after === OPEN[before]) {
          e.preventDefault();
          var ins = "\n" + ind + INDENT + "\n" + ind;
          setVal(v.slice(0, s) + ins + v.slice(en), s + 1 + ind.length + INDENT.length);
          return;
        }
        if (OPEN[before]) {
          e.preventDefault();
          setVal(v.slice(0, s) + "\n" + ind + INDENT + v.slice(en), s + 1 + ind.length + INDENT.length);
          return;
        }
        e.preventDefault();
        setVal(v.slice(0, s) + "\n" + ind + v.slice(en), s + 1 + ind.length);
        return;
      }

      /* auto-close pairs */
      if (PAIRS[ch] && s === en) {
        var nx = v.charAt(s);
        if (ch === '"' || ch === "'" || ch === "`") {
          if (nx === ch) { e.preventDefault(); ta.selectionStart = ta.selectionEnd = s + 1; paint(); return; }
          if (/[A-Za-z0-9_$]/.test(nx)) return;
        }
        e.preventDefault();
        setVal(v.slice(0, s) + ch + PAIRS[ch] + v.slice(en), s + 1);
        return;
      }
      if (CLOSE[ch] && s === en && v.charAt(s) === ch) {
        e.preventDefault(); ta.selectionStart = ta.selectionEnd = s + 1; paint(); return;
      }

      /* backspace inside an empty pair deletes both */
      if (ch === "Backspace" && s === en && s > 0) {
        var bch = v.charAt(s - 1), ach = v.charAt(s);
        if (PAIRS[bch] === ach) { e.preventDefault(); setVal(v.slice(0, s - 1) + v.slice(s + 1), s - 1); return; }
      }
    });

    host.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]");
      if (!b) return;
      if (b.dataset.act === "fmt") { setVal(format(ta.value), null); ta.focus(); }
      if (b.dataset.act === "wrap") {
        var on = host.classList.toggle("wrapped");
        ta.setAttribute("wrap", on ? "soft" : "off");
        b.classList.toggle("on", on);
        paint();
      }
    });

    document.addEventListener("selectionchange", function () {
      if (document.activeElement === ta) paint();
    });

    paint();
    return api;
  }

  global.MQEditor = { mount: mount, format: format, tokenize: tokenize };
})(typeof window !== "undefined" ? window : globalThis);
