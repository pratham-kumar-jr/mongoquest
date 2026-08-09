/* Intro section that only appears on the full cheatsheet page. */
const MASTER_INTRO = `
### How a MongoDB read is shaped

There are exactly two ways to read data. Everything else is detail.

\`\`\`js
db.coll.find(<filter>, <projection>).sort().skip().limit()

db.coll.aggregate([ <stage>, <stage>, ... ])
\`\`\`

\`find\` is a filter plus a field picker. \`aggregate\` is a conveyor belt: each
stage rewrites the documents and hands them to the next one. If you can express
it with \`find\`, use \`find\` – it is cheaper and clearer.

### The mental model that saves you

- A **query operator** (\`$gt\`, \`$in\`, \`$elemMatch\`) lives inside a *field*:
  \`{ seats: { $gt: 50 } }\`.
- An **aggregation expression** (\`$sum\`, \`$multiply\`, \`$toUpper\`) lives inside a
  *stage* and refers to fields with a \`$\` prefix: \`{ $multiply: ["$seats", "$price"] }\`.

Those two \`$\` mean different things. \`"$seats"\` inside \`find()\` is just the
string "$seats" – a common source of silent wrong answers.

### Operator index

| Group | Operators |
|---|---|
| Compare | \`$eq $ne $gt $gte $lt $lte $in $nin $mod\` |
| Logic | \`$and $or $not $nor $expr\` |
| Element | \`$exists $type\` |
| Text | \`$regex $options $text\` |
| Array | \`$all $size $elemMatch $slice\` |
| Stages | \`$match $project $addFields $set $unset $group $sort $limit $skip $count $unwind $lookup $graphLookup $facet $bucket $sortByCount $replaceRoot $out $merge\` |
| Accumulators | \`$sum $avg $min $max $push $addToSet $first $last $count\` |
| Expressions | \`$multiply $divide $add $subtract $concat $toUpper $toLower $substr $size $slice $cond $ifNull $switch $year $month $dayOfMonth $dateToString\` |

### Five mistakes that cost everyone an hour

1. Two conditions on the same field written as two keys – the second silently
   wins. Use one object, or \`$and\`.
2. Multiple conditions on an array without \`$elemMatch\` – different elements can
   satisfy different conditions.
3. Expecting \`$ne\` / \`$nin\` to skip documents where the field is missing. They
   do not; missing counts as "not equal".
4. Sorting before \`$group\` and expecting the order to survive. It does not.
5. Forgetting that \`$lookup\` always produces an **array**, even for one match.
`;
