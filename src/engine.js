/* MongoQuest query engine: a tiny mongo-shell emulator on top of mingo. */
(function (global) {
  "use strict";

  var mingo = global.mingo;

  /* Above these sizes, pretty-printing breaks a value across lines. */
  var INLINE_ARRAY_MAX = 8;
  var INLINE_KEYS_MAX = 3;

  function deepClone(v) {
    if (v === null || typeof v !== "object") return v;
    if (v instanceof Date) return new Date(v.getTime());
    if (v instanceof RegExp) return v;
    if (Array.isArray(v)) return v.map(deepClone);
    var out = {};
    for (var k in v) if (Object.prototype.hasOwnProperty.call(v, k)) out[k] = deepClone(v[k]);
    return out;
  }

  function resolvePath(doc, path) {
    var parts = path.split(".");
    var acc = [doc];
    for (var i = 0; i < parts.length; i++) {
      var next = [];
      for (var j = 0; j < acc.length; j++) {
        var cur = acc[j];
        if (cur === null || cur === undefined) continue;
        if (Array.isArray(cur)) {
          if (/^\d+$/.test(parts[i])) {
            next.push(cur[Number(parts[i])]);
          } else {
            for (var k = 0; k < cur.length; k++) {
              if (cur[k] && typeof cur[k] === "object") next.push(cur[k][parts[i]]);
            }
          }
        } else if (typeof cur === "object") {
          next.push(cur[parts[i]]);
        }
      }
      acc = next;
    }
    return acc.filter(function (v) { return v !== undefined; });
  }

  function canon(v) {
    if (v === null) return "null";
    if (v === undefined) return "undefined";
    if (v instanceof Date) return "Date(" + v.toISOString() + ")";
    if (v instanceof RegExp) return "RegExp(" + v.toString() + ")";
    var t = typeof v;
    if (t === "number") return "num(" + (Number.isInteger(v) ? v : Number(v.toFixed(9))) + ")";
    if (t === "string") return "str(" + v + ")";
    if (t === "boolean") return "bool(" + v + ")";
    if (Array.isArray(v)) return "[" + v.map(canon).join(",") + "]";
    var keys = Object.keys(v).sort();
    return "{" + keys.map(function (k) { return k + ":" + canon(v[k]); }).join(",") + "}";
  }

  function Cursor(docs, projection, opts) {
    this._docs = docs;
    this._proj = projection || null;
    this._sortSpec = null;
    this._skipN = 0;
    this._limitN = null;
    this._opts = opts;
  }
  Cursor.prototype.sort = function (spec) { this._sortSpec = spec; return this; };
  Cursor.prototype.skip = function (n) { this._skipN = n; return this; };
  Cursor.prototype.limit = function (n) { this._limitN = n; return this; };
  Cursor.prototype.project = function (p) { this._proj = p; return this; };
  Cursor.prototype.pretty = function () { return this; };
  Cursor.prototype.toArray = function () {
    var docs = this._docs;
    if (this._sortSpec) docs = new mingo.Aggregator([{ $sort: this._sortSpec }], this._opts).run(docs);
    if (this._skipN) docs = docs.slice(this._skipN);
    if (this._limitN !== null && this._limitN !== undefined) docs = docs.slice(0, this._limitN);
    if (this._proj) docs = new mingo.Query({}, this._opts).find(docs, this._proj).all();
    return docs;
  };
  Cursor.prototype.count = function () { return this.toArray().length; };
  Cursor.prototype.forEach = function (fn) { this.toArray().forEach(fn); };
  Cursor.prototype.map = function (fn) { return this.toArray().map(fn); };
  Cursor.prototype.__isCursor = true;

  function Collection(name, getDocs, opts) {
    this._name = name;
    this._get = getDocs;
    this._opts = opts;
  }
  Collection.prototype.find = function (filter, projection) {
    var docs = new mingo.Query(filter || {}, this._opts).find(this._get()).all();
    return new Cursor(docs, projection, this._opts);
  };
  Collection.prototype.findOne = function (filter, projection) {
    var r = this.find(filter, projection).limit(1).toArray();
    return r.length ? r[0] : null;
  };
  Collection.prototype.countDocuments = function (filter) {
    return new mingo.Query(filter || {}, this._opts).find(this._get()).all().length;
  };
  Collection.prototype.count = function (filter) { return this.countDocuments(filter); };
  Collection.prototype.estimatedDocumentCount = function () { return this._get().length; };
  Collection.prototype.distinct = function (field, filter) {
    var docs = new mingo.Query(filter || {}, this._opts).find(this._get()).all();
    var seen = [], keys = {};
    docs.forEach(function (d) {
      resolvePath(d, field).forEach(function (v) {
        var vals = Array.isArray(v) ? v : [v];
        vals.forEach(function (x) {
          var c = canon(x);
          if (!keys[c]) { keys[c] = 1; seen.push(x); }
        });
      });
    });
    seen.sort(function (a, b) { return canon(a) < canon(b) ? -1 : canon(a) > canon(b) ? 1 : 0; });
    return seen;
  };
  Collection.prototype.aggregate = function (pipeline) {
    if (!Array.isArray(pipeline)) throw new Error("aggregate() expects an array of stages");
    var res = new mingo.Aggregator(pipeline, this._opts).run(this._get());
    // let people write .toArray() out of habit
    try {
      Object.defineProperty(res, "toArray", { value: function () { return this; }, enumerable: false });
      Object.defineProperty(res, "pretty", { value: function () { return this; }, enumerable: false });
    } catch (e) { /* frozen array, fine */ }
    return res;
  };

  function buildDb(datasets) {
    var snapshot = deepClone(datasets);
    var opts = {
      collectionResolver: function (n) {
        if (!snapshot[n]) throw new Error('Unknown collection "' + n + '"');
        return snapshot[n];
      }
    };
    var db = {};
    Object.keys(snapshot).forEach(function (name) {
      db[name] = new Collection(name, function () { return snapshot[name]; }, opts);
    });
    db.getCollectionNames = function () { return Object.keys(snapshot); };
    return db;
  }

  var SHELL_GLOBALS = {
    ISODate: function (s) { return s === undefined ? new Date() : new Date(s); },
    ObjectId: function (s) { return String(s); },
    NumberInt: function (n) { return Number(n); },
    NumberLong: function (n) { return Number(n); },
    NumberDecimal: function (n) { return Number(n); }
  };

  function evaluate(code, db) {
    var src = String(code || "").trim();
    if (!src) throw new Error("Write a query first.");
    src = src.replace(/;+\s*$/, "");

    var names = ["db"].concat(Object.keys(SHELL_GLOBALS));
    var args = [db].concat(Object.keys(SHELL_GLOBALS).map(function (k) { return SHELL_GLOBALS[k]; }));

    var fn;
    try {
      fn = new Function(names.join(","), '"use strict"; return (\n' + src + '\n);');
    } catch (e1) {
      try {
        fn = new Function(names.join(","), '"use strict";\n' + src + '\n');
      } catch (e2) {
        throw new Error("Syntax error: " + e2.message);
      }
    }
    return fn.apply(null, args);
  }

  function normalise(raw) {
    if (raw && raw.__isCursor) return { kind: "docs", value: raw.toArray() };
    if (Array.isArray(raw)) return { kind: "docs", value: raw };
    if (raw === null) return { kind: "value", value: null };
    if (raw === undefined) return { kind: "value", value: undefined };
    if (typeof raw === "object" && !(raw instanceof Date)) return { kind: "doc", value: raw };
    return { kind: "value", value: raw };
  }

  function run(code, datasets) {
    var db = buildDb(datasets);
    var raw = evaluate(code, db);
    return normalise(raw);
  }

  function compare(userRes, expectedRes, ordered) {
    var a = userRes, b = expectedRes;

    // a single doc and a one-element array are treated as different on purpose
    // ONLY when the expected answer is a single doc (findOne questions).
    if (b.kind === "doc" && a.kind === "docs" && a.value.length === 1) {
      a = { kind: "doc", value: a.value[0] };
    }
    if (b.kind === "docs" && a.kind === "doc") {
      a = { kind: "docs", value: [a.value] };
    }

    if (a.kind !== b.kind) {
      return { ok: false, reason: "Your query returned " + describe(a) + ", the expected answer is " + describe(b) + "." };
    }

    if (a.kind === "docs") {
      if (a.value.length !== b.value.length) {
        return { ok: false, reason: "Wrong number of documents – you returned " + a.value.length + ", expected " + b.value.length + "." };
      }
      var ua = a.value.map(canon), ub = b.value.map(canon);
      if (ordered) {
        for (var i = 0; i < ua.length; i++) {
          if (ua[i] !== ub[i]) {
            return { ok: false, reason: "Right documents, wrong order (first mismatch at position " + (i + 1) + "). This question is order-sensitive." };
          }
        }
        return { ok: true };
      }
      var sa = ua.slice().sort(), sb = ub.slice().sort();
      for (var j = 0; j < sa.length; j++) {
        if (sa[j] !== sb[j]) {
          return { ok: false, reason: "Same count, but the documents or their fields differ. Check your projection and your filter." };
        }
      }
      return { ok: true };
    }

    if (canon(a.value) !== canon(b.value)) {
      return { ok: false, reason: "Values differ." };
    }
    return { ok: true };
  }

  function describe(r) {
    if (r.kind === "docs") return r.value.length + " document(s)";
    if (r.kind === "doc") return "a single document";
    if (r.value === null) return "null";
    return "a " + typeof r.value + " (" + JSON.stringify(r.value) + ")";
  }

  function stringify(v, indent) {
    indent = indent || "";
    var pad = indent + "  ";
    if (v === null) return "null";
    if (v === undefined) return "undefined";
    if (v instanceof Date) return 'ISODate("' + v.toISOString() + '")';
    if (v instanceof RegExp) return v.toString();
    var t = typeof v;
    if (t === "number" || t === "boolean") return String(v);
    if (t === "string") return JSON.stringify(v);
    if (Array.isArray(v)) {
      if (v.length === 0) return "[]";
      var flat = v.every(function (x) { return x === null || typeof x !== "object" || x instanceof Date; });
      if (flat && v.length <= INLINE_ARRAY_MAX) return "[ " + v.map(function (x) { return stringify(x, pad); }).join(", ") + " ]";
      return "[\n" + v.map(function (x) { return pad + stringify(x, pad); }).join(",\n") + "\n" + indent + "]";
    }
    var keys = Object.keys(v);
    if (keys.length === 0) return "{}";
    var inlineOk = keys.length <= INLINE_KEYS_MAX && keys.every(function (k) {
      var x = v[k];
      return x === null || typeof x !== "object" || x instanceof Date;
    });
    if (inlineOk) {
      return "{ " + keys.map(function (k) { return safeKey(k) + ": " + stringify(v[k], pad); }).join(", ") + " }";
    }
    return "{\n" + keys.map(function (k) { return pad + safeKey(k) + ": " + stringify(v[k], pad); }).join(",\n") + "\n" + indent + "}";
  }

  function safeKey(k) {
    return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) ? k : JSON.stringify(k);
  }

  function render(res) {
    if (!res) return "";
    if (res.kind === "docs") {
      if (res.value.length === 0) return "// 0 documents";
      return "// " + res.value.length + " document" + (res.value.length === 1 ? "" : "s") + "\n" +
        res.value.map(function (d) { return stringify(d, ""); }).join("\n");
    }
    if (res.kind === "doc") return stringify(res.value, "");
    return stringify(res.value, "");
  }

  global.MQEngine = {
    run: run,
    compare: compare,
    render: render,
    stringify: stringify,
    canon: canon,
    buildDb: buildDb
  };
})(typeof window !== "undefined" ? window : globalThis);
