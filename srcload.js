/* Runs browser sources in a sandbox so the Node scripts read the same data the page does.
   `names` are top-level consts, which vm keeps off the context object – hence the explicit export line. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

/* Only `console` is injected. Passing host intrinsics (RegExp, Date, ...) shadows the
   context's own, so a literal like /^B/ fails `instanceof RegExp` inside and mingo
   silently stops matching regex filters. */
function loadSrc(files, names) {
  const ctx = vm.createContext({ console });
  ctx.window = ctx;
  ctx.globalThis = ctx;

  const code = files.map((f) => fs.readFileSync(path.join(__dirname, f), "utf8")).join("\n;\n") +
    "\n;this.__out = { " + names.map((n) => n + ": " + n).join(", ") + " };";
  vm.runInContext(code, ctx, { filename: "bundle.js" });

  return Object.assign({ ctx }, ctx.__out);
}

module.exports = { loadSrc };
