/* MongoQuest topics + per-topic cheatsheets.
   `sheet` is markdown-ish: only ### headings, `code`, ```blocks```, - bullets and | tables | render. */
const TOPICS = [
  {
    id: "basics",
    name: "Finding & Projection",
    blurb: "find, findOne, picking fields, counting, distinct.",
    icon: "◍",
    sheet: `
### The shape of a read

\`\`\`js
db.<collection>.find(<filter>, <projection>)
\`\`\`

- **filter** – which documents. \`{}\` or omitted means *all of them*.
- **projection** – which fields come back.

### Projection rules

| You write | You get |
|---|---|
| \`{ name: 1, borough: 1 }\` | name, borough **and** _id |
| \`{ name: 1, _id: 0 }\` | name only |
| \`{ grades: 0 }\` | everything **except** grades |
| \`{ "address.street": 1, _id: 0 }\` | just the nested street |

You cannot mix 1s and 0s in one projection – the only exception is turning
\`_id\` off while turning other fields on.

### Other reads

\`\`\`js
db.restaurants.findOne({ borough: "Bronx" })   // one doc, not an array
db.restaurants.countDocuments({ price: 1 })     // a number
db.restaurants.distinct("cuisine")              // array of unique values
\`\`\`

### Gotchas

- \`find()\` returns a **cursor**, not an array. In the shell it prints for you.
- Dotted paths need quotes: \`{ "address.zipcode": "10011" }\`.
`
  },
  {
    id: "comparison",
    name: "Comparison Operators",
    blurb: "$gt, $lt, $gte, $lte, $ne, $in, $nin, $mod.",
    icon: "≷",
    sheet: `
### The eight you actually use

| Operator | Meaning | Example |
|---|---|---|
| \`$eq\` | equals (implicit) | \`{ price: 2 }\` |
| \`$ne\` | not equal | \`{ cuisine: { $ne: "Pizza" } }\` |
| \`$gt\` / \`$gte\` | greater / or equal | \`{ seats: { $gt: 50 } }\` |
| \`$lt\` / \`$lte\` | less / or equal | \`{ seats: { $lte: 20 } }\` |
| \`$in\` | matches any in list | \`{ borough: { $in: ["Bronx","Queens"] } }\` |
| \`$nin\` | matches none in list | \`{ borough: { $nin: ["Bronx"] } }\` |
| \`$mod\` | remainder test | \`{ seats: { $mod: [10, 0] } }\` |

### Ranges live in one object

\`\`\`js
// seats between 30 and 60, inclusive
db.restaurants.find({ seats: { $gte: 30, $lte: 60 } })
\`\`\`

Two operators on the **same** field go in the **same** braces. Writing them as
two separate keys silently keeps only the last one.

### Gotchas

- \`$ne\` and \`$nin\` also match documents where the field is **missing**.
- Comparisons are type-aware: \`"5"\` is not \`5\`.
- On an array field, the condition matches if **any element** satisfies it.
`
  },
  {
    id: "logical",
    name: "Logical Operators",
    blurb: "$and, $or, $not, $nor – and when you don't need them.",
    icon: "⋈",
    sheet: `
### Implicit AND is free

\`\`\`js
// these two are identical
db.restaurants.find({ borough: "Manhattan", price: 4 })
db.restaurants.find({ $and: [ { borough: "Manhattan" }, { price: 4 } ] })
\`\`\`

You only *need* \`$and\` when the same field appears twice with operators that
would collide as duplicate keys.

### The four

\`\`\`js
{ $or:  [ { a: 1 }, { b: 2 } ] }   // at least one true
{ $and: [ { a: 1 }, { b: 2 } ] }   // all true
{ $nor: [ { a: 1 }, { b: 2 } ] }   // none true
{ price: { $not: { $gt: 2 } } }    // wraps an operator, not a value
\`\`\`

### $not is different

\`$not\` is a **field-level** operator – it goes *inside* a field, wrapping
another operator expression. It cannot take a plain value:

\`\`\`js
{ price: { $not: 2 } }          // ✗ error
{ price: { $not: { $eq: 2 } } } // ✓
\`\`\`

### Gotchas

- \`$nor\` and \`$not\` match documents where the field is **absent**.
- Mixing: put \`$or\` inside \`$and\` when you need "X and (Y or Z)".
`
  },
  {
    id: "element",
    name: "Element & Type",
    blurb: "$exists and $type – schema questions on schemaless data.",
    icon: "⌗",
    sheet: `
### Does the field exist at all?

\`\`\`js
db.orders.find({ coupon: { $exists: true } })
db.orders.find({ coupon: { $exists: false } })
\`\`\`

\`$exists: true\` matches even when the value is \`null\`. It is asking about the
**key**, not the value.

### What type is it?

\`\`\`js
db.products.find({ price:  { $type: "number" } })
db.movies.find({   genres: { $type: "array"  } })
db.customers.find({ newsletter: { $type: "bool" } })
\`\`\`

Common aliases: \`"double"\`, \`"string"\`, \`"object"\`, \`"array"\`, \`"bool"\`,
\`"date"\`, \`"null"\`, \`"int"\`, \`"long"\`, \`"decimal"\`.

### Missing vs null vs false

| Query | missing key | \`null\` | \`false\` |
|---|---|---|---|
| \`{ f: { $exists: false } }\` | ✓ | ✗ | ✗ |
| \`{ f: null }\` | ✓ | ✓ | ✗ |
| \`{ f: { $ne: true } }\` | ✓ | ✓ | ✓ |

That first column is why \`$ne\` surprises people.
`
  },
  {
    id: "regex",
    name: "Pattern Matching",
    blurb: "$regex – starts with, ends with, contains, case-insensitive.",
    icon: "⁂",
    sheet: `
### Two equivalent forms

\`\`\`js
db.restaurants.find({ name: { $regex: "^B" } })
db.restaurants.find({ name: /^B/ })
\`\`\`

### The three anchors you need

| Goal | Pattern |
|---|---|
| starts with \`Bro\` | \`/^Bro/\` |
| ends with \`Bar\` | \`/Bar$/\` |
| contains \`Bar\` anywhere | \`/Bar/\` |
| case-insensitive contains | \`/bar/i\` or \`{ $regex: "bar", $options: "i" }\` |
| starts with any of a set | \`/^[BCD]/\` |

### Escaping

Dots, parens and \`$\` are regex metacharacters:

\`\`\`js
{ email: /\\.com$/ }     // literal dot, then "com" at the end
\`\`\`

### Gotchas

- Only \`^\`-anchored, case-**sensitive** regexes can use an index. \`/foo/i\`
  scans the whole collection.
- Regex works on strings only – it will not match a number field.
`
  },
  {
    id: "cursor",
    name: "Sort, Limit & Skip",
    blurb: "Ordering results and paginating them.",
    icon: "⇅",
    sheet: `
### Chain it on the cursor

\`\`\`js
db.restaurants.find({ borough: "Manhattan" })
  .sort({ name: 1 })     // 1 = ascending, -1 = descending
  .skip(5)
  .limit(5)
\`\`\`

### Multi-key sort

\`\`\`js
.sort({ cuisine: 1, borough: -1 })
\`\`\`

Key order matters: cuisine ascending first, then borough descending **within**
each cuisine.

### Server-side order is fixed

No matter how you chain the methods, the server always applies:

> **sort → skip → limit**

So \`.limit(5).sort(...)\` still sorts the whole result set first, then takes 5.

### Pagination

\`\`\`js
// page N, 10 per page
.skip((N - 1) * 10).limit(10)
\`\`\`

Large \`skip\` values get slow – real apps page by the last seen \`_id\` instead.

### Gotchas

- Without \`.sort()\` the order is **not guaranteed**, even if it looks stable.
- Sorting on a missing field puts those documents first when ascending.
`
  },
  {
    id: "arrays",
    name: "Array Queries",
    blurb: "$all, $size, $elemMatch, positional dot paths.",
    icon: "⧉",
    sheet: `
### Matching against an array field

\`\`\`js
{ genres: "Drama" }              // array CONTAINS "Drama"
{ genres: ["Drama","Thriller"] } // array EQUALS exactly this, in this order
{ genres: { $all: ["Drama","Thriller"] } }  // contains both, any order
{ genres: { $size: 3 } }         // exactly 3 elements
\`\`\`

### Positional access

\`\`\`js
{ "grades.0.grade": "A" }        // first element's grade
{ "address.coord.1": { $gt: 40.75 } }  // second number in the array
\`\`\`

### $elemMatch – the important one

\`\`\`js
// ✗ one grade has A, ANOTHER has score < 6 – both conditions, different elements
{ "grades.grade": "A", "grades.score": { $lt: 6 } }

// ✓ ONE SINGLE element has both
{ grades: { $elemMatch: { grade: "A", score: { $lt: 6 } } } }
\`\`\`

Without \`$elemMatch\`, multiple conditions on the same array can be satisfied
by *different* elements. This is the #1 array bug.

### "All elements satisfy X"

There is no \`$allMatch\`. You invert it:

\`\`\`js
// every grade scored above 5  ==  no grade scored 5 or less
{ grades: { $not: { $elemMatch: { score: { $lte: 5 } } } } }
\`\`\`
`
  },
  {
    id: "embedded",
    name: "Embedded Documents",
    blurb: "Dot notation into nested objects and arrays of objects.",
    icon: "⊞",
    sheet: `
### Dot notation, always quoted

\`\`\`js
db.restaurants.find({ "address.zipcode": "10011" })
db.movies.find({ "imdb.rating": { $gte: 8 } })
db.orders.find({ "items.sku": "KB-100" })
\`\`\`

That last one reaches **into an array of subdocuments** – it matches if any
item has that sku.

### Whole-document match is exact and ordered

\`\`\`js
{ address: { building: "31", street: "W 8th St" } }
\`\`\`

This matches only documents whose \`address\` has **exactly** those two fields,
in **that order**. Almost never what you want – use dot notation.

### Projecting nested fields

\`\`\`js
db.restaurants.find({}, { name: 1, "address.street": 1, _id: 0 })
// => { name: "...", address: { street: "..." } }
\`\`\`

The shape is preserved; you get a trimmed \`address\` object, not a flat key.

### Gotchas

- \`{ "a.b": 1 }\` in a **filter** = "field a.b equals 1".
  \`{ "a.b": 1 }\` in a **projection** = "include a.b". Same syntax, different job.
`
  },
  {
    id: "agg-basics",
    name: "Aggregation Basics",
    blurb: "$match, $project, $addFields, $count, $sort, $limit.",
    icon: "⛓",
    sheet: `
### A pipeline is an array of stages

\`\`\`js
db.restaurants.aggregate([
  { $match:   { borough: "Manhattan" } },
  { $project: { _id: 0, name: 1, cuisine: 1 } },
  { $sort:    { name: 1 } },
  { $limit:   5 }
])
\`\`\`

Each stage takes the previous stage's documents and emits new ones.

### $match is find's filter

Same syntax exactly. **Put it first** – it is the only stage that can use an
index, and everything after it does less work.

### $project computes, not just selects

\`\`\`js
{ $project: {
    _id: 0,
    name: 1,
    capacityScore: { $multiply: ["$seats", "$price"] },
    shout: { $toUpper: "$cuisine" }
} }
\`\`\`

Field references are strings starting with \`$\`.

### $addFields keeps everything else

\`\`\`js
{ $addFields: { gradeCount: { $size: "$grades" } } }
\`\`\`

Use \`$addFields\` (alias \`$set\`) when you want to *add* a field;
\`$project\` when you want to *replace* the whole shape.

### $count

\`\`\`js
{ $count: "total" }   // => [ { total: 12 } ]
\`\`\`
`
  },
  {
    id: "agg-group",
    name: "Grouping & Accumulators",
    blurb: "$group with $sum, $avg, $min, $max, $push, $addToSet.",
    icon: "Σ",
    sheet: `
### The shape

\`\`\`js
{ $group: {
    _id: "$borough",                    // what to group by
    count: { $sum: 1 },                 // accumulators
    avgSeats: { $avg: "$seats" }
} }
\`\`\`

\`_id\` is mandatory. \`_id: null\` groups **everything** into one bucket.

### Accumulators

| Accumulator | Does |
|---|---|
| \`{ $sum: 1 }\` | counts documents |
| \`{ $sum: "$total" }\` | adds a field up |
| \`{ $avg: "$seats" }\` | mean |
| \`{ $min: }\` / \`{ $max: }\` | extremes |
| \`{ $push: "$name" }\` | array of every value |
| \`{ $addToSet: "$cuisine" }\` | array of **distinct** values |
| \`{ $first: }\` / \`{ $last: }\` | needs a \`$sort\` before it to mean anything |

### Compound grouping key

\`\`\`js
{ $group: { _id: { cuisine: "$cuisine", borough: "$borough" }, n: { $sum: 1 } } }
\`\`\`

### Sort after grouping

\`\`\`js
{ $group: { _id: "$cuisine", n: { $sum: 1 } } },
{ $sort:  { n: -1 } },
{ $limit: 5 }
\`\`\`

Sorting **before** \`$group\` does not survive the group – regroup, then sort.

### Gotchas

- After \`$group\`, only the fields you declared exist. \`name\` is gone unless
  you pushed or \`$first\`-ed it.
- \`$avg\` skips non-numeric and missing values rather than treating them as 0.
`
  },
  {
    id: "agg-unwind",
    name: "$unwind & Array Pipelines",
    blurb: "Flattening arrays so you can group across their elements.",
    icon: "⑂",
    sheet: `
### One document per array element

\`\`\`js
{ $unwind: "$grades" }
\`\`\`

A restaurant with 3 grades becomes 3 documents, each with \`grades\` as a single
**object** instead of an array. Everything else is copied.

### The full form

\`\`\`js
{ $unwind: {
    path: "$grades",
    includeArrayIndex: "gradeIdx",       // adds 0,1,2...
    preserveNullAndEmptyArrays: true     // keep docs with [] or missing
} }
\`\`\`

By default, documents with an **empty or missing** array are **dropped**.
That silently loses rows – reach for \`preserveNullAndEmptyArrays\` when counting.

### The classic combo

\`\`\`js
db.restaurants.aggregate([
  { $unwind: "$grades" },
  { $match:  { "grades.grade": "A" } },
  { $group:  { _id: "$cuisine", aGrades: { $sum: 1 } } },
  { $sort:   { aGrades: -1 } }
])
\`\`\`

unwind → match → group → sort. Most "count things inside arrays" questions are
this exact shape.

### $sortByCount is unwind's best friend

\`\`\`js
{ $unwind: "$genres" },
{ $sortByCount: "$genres" }   // == $group _id + $sum:1, then $sort desc
\`\`\`

### Gotchas

- \`$match\` **before** \`$unwind\` filters documents; **after** \`$unwind\` it
  filters individual elements. Both are useful – know which you meant.
- Unwinding two arrays multiplies rows (a cartesian product). Rarely intended.
`
  },
  {
    id: "agg-advanced",
    name: "Joins & Advanced Stages",
    blurb: "$lookup, $facet, $bucket, $replaceRoot, $graphLookup, top-N per group.",
    icon: "✦",
    sheet: `
### $lookup – the left outer join

\`\`\`js
{ $lookup: {
    from: "customers",
    localField: "customerId",
    foreignField: "_id",
    as: "customer"          // always an ARRAY, even for one match
} },
{ $unwind: "$customer" }     // flatten it back to an object
\`\`\`

### $bucket – histogram

\`\`\`js
{ $bucket: {
    groupBy: "$imdb.rating",
    boundaries: [0, 6, 7, 8, 10],
    default: "unrated",
    output: { count: { $sum: 1 }, titles: { $push: "$title" } }
} }
\`\`\`

### $facet – several pipelines, one pass

\`\`\`js
{ $facet: {
    byBorough: [ { $sortByCount: "$borough" } ],
    priciest:  [ { $sort: { price: -1 } }, { $limit: 3 } ]
} }
\`\`\`

Returns **one** document with an array per key. Great for dashboards.

### $replaceRoot – promote a subdocument

\`\`\`js
{ $replaceRoot: { newRoot: "$address" } }
\`\`\`

### Top N per group

The pattern worth memorising:

\`\`\`js
{ $sort:  { borough: 1, seats: -1 } },
{ $group: { _id: "$borough", top: { $push: "$$ROOT" } } },
{ $project: { top: { $slice: ["$top", 3] } } }
\`\`\`

Sort first, group into an array, then \`$slice\`. \`$$ROOT\` is the whole document.

### $graphLookup – recursive

\`\`\`js
{ $graphLookup: {
    from: "employees",
    startWith: "$reportsTo",
    connectFromField: "reportsTo",
    connectToField: "_id",
    as: "chain"
} }
\`\`\`

Walks the chain until it runs out. Use for org charts, categories, threads.
`
  }
];
