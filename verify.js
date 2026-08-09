/* Node harness: run every reference solution through the engine. */
const { loadSrc } = require("./srcload");

const MAX_DOCS = 24;
const PROMPT_CUT = 60;
const ALLOW_EMPTY = new Set(["e8"]);

const { ctx, DATASETS, TOPICS, QUESTIONS } = loadSrc(
  ["vendor/mingo.min.js", "src/data.js", "src/topics.js", "src/questions.js", "src/engine.js"],
  ["DATASETS", "TOPICS", "QUESTIONS"]
);
const MQEngine = ctx.MQEngine;

let fail = 0, empty = 0, big = 0;
const byTopic = {};
const report = [];

for (const q of QUESTIONS) {
  byTopic[q.topic] = (byTopic[q.topic] || 0) + 1;
  let res;
  try {
    res = MQEngine.run(q.solution, DATASETS);
  } catch (e) {
    fail++;
    report.push(`✗ ERROR  ${q.id.padEnd(5)} ${q.topic.padEnd(13)} ${e.message}`);
    continue;
  }
  if (res.kind === "docs" && res.value.length === 0 && !ALLOW_EMPTY.has(q.id)) {
    empty++;
    report.push(`! EMPTY  ${q.id.padEnd(5)} ${q.topic.padEnd(13)} ${q.prompt.slice(0, PROMPT_CUT)}`);
  }
  if (res.kind === "docs" && res.value.length > MAX_DOCS) {
    big++;
    report.push(`~ LARGE  ${q.id.padEnd(5)} ${res.value.length} docs`);
  }
  // self-consistency: solution must validate against itself
  const cmp = MQEngine.compare(res, res, !!q.ordered);
  if (!cmp.ok) {
    fail++;
    report.push(`✗ SELF   ${q.id} ${cmp.reason}`);
  }
}

// topic ids must all exist
const topicIds = new Set(TOPICS.map(t => t.id));
for (const q of QUESTIONS) if (!topicIds.has(q.topic)) { fail++; report.push(`✗ TOPIC  ${q.id} unknown topic ${q.topic}`); }
// unique ids
const ids = new Set();
for (const q of QUESTIONS) { if (ids.has(q.id)) { fail++; report.push(`✗ DUPID  ${q.id}`); } ids.add(q.id); }
// collection must exist
for (const q of QUESTIONS) if (!DATASETS[q.coll]) { fail++; report.push(`✗ COLL   ${q.id} ${q.coll}`); }

console.log(report.join("\n") || "(no issues flagged)");
console.log("\n--- summary ---");
console.log("questions:", QUESTIONS.length, "topics:", TOPICS.length);
console.log(Object.entries(byTopic).map(([k, v]) => `${k}:${v}`).join("  "));
console.log(`errors: ${fail}   empty results: ${empty}   large results: ${big}`);
process.exit(fail ? 1 : 0);
