/* MongoQuest question bank. Answers are checked by running the user's query and the
   reference solution side by side, so any query with the right output is accepted.
   ordered: true -> result order is part of the answer. */
const QUESTIONS = [

  /* ---------------- 1. Finding & Projection ---------------- */
  { id: "b1", topic: "basics", difficulty: "easy", coll: "restaurants",
    prompt: "Return every document in the `restaurants` collection.",
    hint: "An empty filter object matches everything.",
    solution: `db.restaurants.find({})` },

  { id: "b2", topic: "basics", difficulty: "easy", coll: "restaurants",
    prompt: "Return only the `name`, `borough` and `cuisine` fields for every restaurant. Keep `_id`.",
    hint: "Second argument to find() is the projection. 1 means include.",
    solution: `db.restaurants.find({}, { name: 1, borough: 1, cuisine: 1 })` },

  { id: "b3", topic: "basics", difficulty: "easy", coll: "restaurants",
    prompt: "Return `name`, `borough` and `cuisine` for every restaurant, but drop `_id`.",
    hint: "_id is the only field you may exclude alongside inclusions.",
    solution: `db.restaurants.find({}, { name: 1, borough: 1, cuisine: 1, _id: 0 })` },

  { id: "b4", topic: "basics", difficulty: "easy", coll: "restaurants",
    prompt: "Return each restaurant's `name` and its `address.zipcode` only – no `_id`.",
    hint: "Dotted paths work in projections too, and need quotes.",
    solution: `db.restaurants.find({}, { name: 1, "address.zipcode": 1, _id: 0 })` },

  { id: "b5", topic: "basics", difficulty: "easy", coll: "restaurants",
    prompt: "Return every field of every restaurant *except* `grades` and `address`.",
    hint: "0 means exclude. You can list several exclusions together.",
    solution: `db.restaurants.find({}, { grades: 0, address: 0 })` },

  { id: "b6", topic: "basics", difficulty: "easy", coll: "restaurants",
    prompt: "Return a single restaurant located in the borough `Bronx` (not an array – one document).",
    hint: "findOne().",
    solution: `db.restaurants.findOne({ borough: "Bronx" })` },

  { id: "b7", topic: "basics", difficulty: "easy", coll: "restaurants",
    prompt: "How many restaurants have `price` equal to 1? Return the number.",
    hint: "countDocuments() takes a filter and returns a number.",
    solution: `db.restaurants.countDocuments({ price: 1 })` },

  { id: "b8", topic: "basics", difficulty: "easy", coll: "restaurants",
    prompt: "List the distinct `borough` values present in the collection.",
    hint: "distinct() takes the field name as a string.",
    solution: `db.restaurants.distinct("borough")` },

  { id: "b9", topic: "basics", difficulty: "medium", coll: "restaurants",
    prompt: "List the distinct cuisines served in `Queens`.",
    hint: "distinct() accepts an optional second argument: a filter.",
    solution: `db.restaurants.distinct("cuisine", { borough: "Queens" })` },

  /* ---------------- 2. Comparison ---------------- */
  { id: "c1", topic: "comparison", difficulty: "easy", coll: "restaurants",
    prompt: "Find restaurants with more than 50 `seats`.",
    hint: "$gt.",
    solution: `db.restaurants.find({ seats: { $gt: 50 } })` },

  { id: "c2", topic: "comparison", difficulty: "easy", coll: "restaurants",
    prompt: "Find restaurants whose `seats` are between 30 and 60 inclusive.",
    hint: "Both operators belong to the same field object.",
    solution: `db.restaurants.find({ seats: { $gte: 30, $lte: 60 } })` },

  { id: "c3", topic: "comparison", difficulty: "easy", coll: "restaurants",
    prompt: "Find restaurants whose `price` is not 1.",
    hint: "$ne.",
    solution: `db.restaurants.find({ price: { $ne: 1 } })` },

  { id: "c4", topic: "comparison", difficulty: "easy", coll: "restaurants",
    prompt: "Find restaurants whose `cuisine` is Indian, Chinese or Japanese.",
    hint: "$in with an array.",
    solution: `db.restaurants.find({ cuisine: { $in: ["Indian", "Chinese", "Japanese"] } })` },

  { id: "c5", topic: "comparison", difficulty: "medium", coll: "restaurants",
    prompt: "Find restaurants that are NOT in Manhattan, Brooklyn or Queens.",
    hint: "$nin.",
    solution: `db.restaurants.find({ borough: { $nin: ["Manhattan", "Brooklyn", "Queens"] } })` },

  { id: "c6", topic: "comparison", difficulty: "easy", coll: "restaurants",
    prompt: "Find restaurants with no more than 20 `seats`.",
    hint: "\"No more than\" is $lte, not $lt.",
    solution: `db.restaurants.find({ seats: { $lte: 20 } })` },

  { id: "c7", topic: "comparison", difficulty: "medium", coll: "restaurants",
    prompt: "Find restaurants whose `seats` count divides evenly by 10 (remainder 0).",
    hint: "$mod takes [divisor, remainder].",
    solution: `db.restaurants.find({ seats: { $mod: [10, 0] } })` },

  { id: "c8", topic: "comparison", difficulty: "medium", coll: "movies",
    prompt: "Find movies released after 2015 with an `imdb.rating` of at least 7.5.",
    hint: "Two fields, one of them nested.",
    solution: `db.movies.find({ year: { $gt: 2015 }, "imdb.rating": { $gte: 7.5 } })` },

  { id: "c9", topic: "comparison", difficulty: "medium", coll: "products",
    prompt: "Find products priced under 100 that still have stock (`stock` greater than 0). Return `sku`, `price` and `stock` without `_id`.",
    hint: "Filter on two fields, then project three.",
    solution: `db.products.find({ price: { $lt: 100 }, stock: { $gt: 0 } }, { sku: 1, price: 1, stock: 1, _id: 0 })` },

  /* ---------------- 3. Logical ---------------- */
  { id: "l1", topic: "logical", difficulty: "easy", coll: "restaurants",
    prompt: "Find restaurants in `Manhattan` whose `price` is 4, writing the condition with an explicit `$and`.",
    hint: "$and takes an array of condition objects.",
    solution: `db.restaurants.find({ $and: [ { borough: "Manhattan" }, { price: 4 } ] })` },

  { id: "l2", topic: "logical", difficulty: "easy", coll: "restaurants",
    prompt: "Find restaurants in either `Bronx` or `Staten Island` using `$or`.",
    hint: "$or takes an array too.",
    solution: `db.restaurants.find({ $or: [ { borough: "Bronx" }, { borough: "Staten Island" } ] })` },

  { id: "l3", topic: "logical", difficulty: "medium", coll: "restaurants",
    prompt: "Find restaurants that are in neither `Manhattan` nor `Brooklyn`, using `$nor`.",
    hint: "$nor = none of these conditions is true.",
    solution: `db.restaurants.find({ $nor: [ { borough: "Manhattan" }, { borough: "Brooklyn" } ] })` },

  { id: "l4", topic: "logical", difficulty: "medium", coll: "restaurants",
    prompt: "Find restaurants whose `price` is NOT greater than 2, using `$not`.",
    hint: "$not wraps an operator expression inside the field.",
    solution: `db.restaurants.find({ price: { $not: { $gt: 2 } } })` },

  { id: "l5", topic: "logical", difficulty: "medium", coll: "restaurants",
    prompt: "Find restaurants that are open (`isOpen` true) AND are either Indian or Italian.",
    hint: "Combine a plain field condition with an $or.",
    solution: `db.restaurants.find({ isOpen: true, $or: [ { cuisine: "Indian" }, { cuisine: "Italian" } ] })` },

  { id: "l6", topic: "logical", difficulty: "hard", coll: "restaurants",
    prompt: "Find restaurants that are NOT American and NOT Pizza, OR whose `name` starts with the letter B.",
    hint: "An $or whose first branch is itself a $nin.",
    solution: `db.restaurants.find({ $or: [ { cuisine: { $nin: ["American", "Pizza"] } }, { name: /^B/ } ] })` },

  { id: "l7", topic: "logical", difficulty: "hard", coll: "movies",
    prompt: "Find movies rated `R` that belong to either the Action or Sci-Fi genre.",
    hint: "$in on an array field checks membership of any element.",
    solution: `db.movies.find({ rated: "R", genres: { $in: ["Action", "Sci-Fi"] } })` },

  { id: "l8", topic: "logical", difficulty: "hard", coll: "restaurants",
    prompt: "Find restaurants that are closed (`isOpen` false) or have fewer than 20 seats.",
    hint: "$or with a comparison in one branch.",
    solution: `db.restaurants.find({ $or: [ { isOpen: false }, { seats: { $lt: 20 } } ] })` },

  /* ---------------- 4. Element & Type ---------------- */
  { id: "e1", topic: "element", difficulty: "easy", coll: "customers",
    prompt: "Find customers that have a `newsletter` field at all.",
    hint: "$exists asks about the key, not the value.",
    solution: `db.customers.find({ newsletter: { $exists: true } })` },

  { id: "e2", topic: "element", difficulty: "easy", coll: "customers",
    prompt: "Find customers that have no `newsletter` field.",
    hint: "$exists: false.",
    solution: `db.customers.find({ newsletter: { $exists: false } })` },

  { id: "e3", topic: "element", difficulty: "easy", coll: "orders",
    prompt: "Find orders that used a coupon (the `coupon` field is present).",
    hint: "Same $exists idea on the orders collection.",
    solution: `db.orders.find({ coupon: { $exists: true } })` },

  { id: "e4", topic: "element", difficulty: "medium", coll: "orders",
    prompt: "Find orders where `coupon` is a string. Return `_id` and `coupon` only.",
    hint: "$type: \"string\".",
    solution: `db.orders.find({ coupon: { $type: "string" } }, { _id: 1, coupon: 1 })` },

  { id: "e5", topic: "element", difficulty: "medium", coll: "customers",
    prompt: "Find customers whose `newsletter` is a boolean value.",
    hint: "The type alias is \"bool\".",
    solution: `db.customers.find({ newsletter: { $type: "bool" } })` },

  { id: "e6", topic: "element", difficulty: "medium", coll: "movies",
    prompt: "Find movies where `genres` is stored as an array.",
    hint: "$type: \"array\".",
    solution: `db.movies.find({ genres: { $type: "array" } })` },

  { id: "e7", topic: "element", difficulty: "hard", coll: "customers",
    prompt: "Find customers who are NOT subscribed to the newsletter – counting a missing `newsletter` field as not subscribed.",
    hint: "$ne also matches documents where the field is absent.",
    solution: `db.customers.find({ newsletter: { $ne: true } })` },

  { id: "e8", topic: "element", difficulty: "hard", coll: "restaurants",
    prompt: "Confirm every restaurant has a street: find restaurants where `address.street` does NOT exist.",
    hint: "An empty result is a valid answer here.",
    solution: `db.restaurants.find({ "address.street": { $exists: false } })` },

  /* ---------------- 5. Pattern Matching ---------------- */
  { id: "r1", topic: "regex", difficulty: "easy", coll: "restaurants",
    prompt: "Find restaurants whose `name` starts with `B`.",
    hint: "Anchor the pattern with ^.",
    solution: `db.restaurants.find({ name: /^B/ })` },

  { id: "r2", topic: "regex", difficulty: "easy", coll: "restaurants",
    prompt: "Find restaurants whose `name` ends with the letter `e`.",
    hint: "Anchor the pattern with $.",
    solution: `db.restaurants.find({ name: /e$/ })` },

  { id: "r3", topic: "regex", difficulty: "easy", coll: "restaurants",
    prompt: "Find restaurants whose `name` contains `Bar` anywhere.",
    hint: "No anchors at all.",
    solution: `db.restaurants.find({ name: /Bar/ })` },

  { id: "r4", topic: "regex", difficulty: "medium", coll: "restaurants",
    prompt: "Find restaurants whose `cuisine` starts with the letter `C`. Return `name` and `cuisine` without `_id`.",
    hint: "Regex plus a projection.",
    solution: `db.restaurants.find({ cuisine: /^C/ }, { name: 1, cuisine: 1, _id: 0 })` },

  { id: "r5", topic: "regex", difficulty: "medium", coll: "restaurants",
    prompt: "Find restaurants whose `address.zipcode` starts with `10`.",
    hint: "Regex on a nested string field.",
    solution: `db.restaurants.find({ "address.zipcode": /^10/ })` },

  { id: "r6", topic: "regex", difficulty: "medium", coll: "restaurants",
    prompt: "Find restaurants whose `name` contains `cafe`, ignoring case.",
    hint: "The i flag, or $options: \"i\".",
    solution: `db.restaurants.find({ name: /cafe/i })` },

  { id: "r7", topic: "regex", difficulty: "medium", coll: "movies",
    prompt: "Find movies whose `title` contains the word `the`, ignoring case. Return `title` only, without `_id`.",
    hint: "Case-insensitive regex plus projection.",
    solution: `db.movies.find({ title: /the/i }, { title: 1, _id: 0 })` },

  { id: "r8", topic: "regex", difficulty: "hard", coll: "restaurants",
    prompt: "Find restaurants whose `address.street` ends with `Ave` or `Blvd`.",
    hint: "Alternation with | inside a group, anchored at the end.",
    solution: `db.restaurants.find({ "address.street": /(Ave|Blvd)$/ })` },

  { id: "r9", topic: "regex", difficulty: "hard", coll: "restaurants",
    prompt: "Find restaurants whose `cuisine` starts with any of the letters I, J or K.",
    hint: "A character class right after the ^ anchor.",
    solution: `db.restaurants.find({ cuisine: /^[IJK]/ })` },

  /* ---------------- 6. Sort, Limit, Skip ---------------- */
  { id: "s1", topic: "cursor", difficulty: "easy", coll: "restaurants", ordered: true,
    prompt: "Return all restaurants sorted by `name` ascending.",
    hint: "1 is ascending.",
    solution: `db.restaurants.find({}).sort({ name: 1 })` },

  { id: "s2", topic: "cursor", difficulty: "easy", coll: "restaurants", ordered: true,
    prompt: "Return all restaurants sorted by `name` descending.",
    hint: "-1 is descending.",
    solution: `db.restaurants.find({}).sort({ name: -1 })` },

  { id: "s3", topic: "cursor", difficulty: "medium", coll: "restaurants", ordered: true,
    prompt: "Sort restaurants by `cuisine` ascending, and within the same cuisine by `borough` descending.",
    hint: "Key order inside sort() decides precedence.",
    solution: `db.restaurants.find({}).sort({ cuisine: 1, borough: -1 })` },

  { id: "s4", topic: "cursor", difficulty: "medium", coll: "restaurants", ordered: true,
    prompt: "Return the first 5 Manhattan restaurants ordered by `name` ascending.",
    hint: "sort() then limit().",
    solution: `db.restaurants.find({ borough: "Manhattan" }).sort({ name: 1 }).limit(5)` },

  { id: "s5", topic: "cursor", difficulty: "medium", coll: "restaurants", ordered: true,
    prompt: "Return the *next* 5 Manhattan restaurants by `name` ascending – that is, skip the first 5.",
    hint: "skip() before limit().",
    solution: `db.restaurants.find({ borough: "Manhattan" }).sort({ name: 1 }).skip(5).limit(5)` },

  { id: "s6", topic: "cursor", difficulty: "medium", coll: "movies", ordered: true,
    prompt: "Return the 5 highest-rated movies. Show `title` and `imdb.rating` only, no `_id`.",
    hint: "Sort on the nested rating descending.",
    solution: `db.movies.find({}, { title: 1, "imdb.rating": 1, _id: 0 }).sort({ "imdb.rating": -1 }).limit(5)` },

  { id: "s7", topic: "cursor", difficulty: "medium", coll: "products", ordered: true,
    prompt: "Return the 3 cheapest products, showing `name` and `price` only.",
    hint: "Ascending sort on price.",
    solution: `db.products.find({}, { name: 1, price: 1, _id: 0 }).sort({ price: 1 }).limit(3)` },

  { id: "s8", topic: "cursor", difficulty: "medium", coll: "restaurants",
    prompt: "How many restaurants are in `Brooklyn`?",
    hint: "countDocuments with a filter.",
    solution: `db.restaurants.countDocuments({ borough: "Brooklyn" })` },

  { id: "s9", topic: "cursor", difficulty: "hard", coll: "restaurants", ordered: true,
    prompt: "Return page 2 of all restaurants sorted by `seats` descending, using a page size of 4.",
    hint: "Page 2 means skipping one page worth of documents.",
    solution: `db.restaurants.find({}).sort({ seats: -1 }).skip(4).limit(4)` },

  /* ---------------- 7. Arrays ---------------- */
  { id: "a1", topic: "arrays", difficulty: "easy", coll: "restaurants",
    prompt: "Find restaurants that have at least one grade with a `score` below 5.",
    hint: "Dot into the array: \"grades.score\".",
    solution: `db.restaurants.find({ "grades.score": { $lt: 5 } })` },

  { id: "a2", topic: "arrays", difficulty: "medium", coll: "restaurants",
    prompt: "Find restaurants that have a single grade entry which is BOTH grade `A` AND scored below 6.",
    hint: "One element must satisfy both conditions – $elemMatch.",
    solution: `db.restaurants.find({ grades: { $elemMatch: { grade: "A", score: { $lt: 6 } } } })` },

  { id: "a3", topic: "arrays", difficulty: "medium", coll: "restaurants",
    prompt: "Find restaurants whose SECOND grade entry is grade `A` with a `score` of 9.",
    hint: "Array positions are zero-based and used like a field name.",
    solution: `db.restaurants.find({ "grades.1.grade": "A", "grades.1.score": 9 })` },

  { id: "a4", topic: "arrays", difficulty: "easy", coll: "restaurants",
    prompt: "Find restaurants with exactly 3 grade entries.",
    hint: "$size takes an exact number, not a range.",
    solution: `db.restaurants.find({ grades: { $size: 3 } })` },

  { id: "a5", topic: "arrays", difficulty: "medium", coll: "movies",
    prompt: "Find movies that are tagged with BOTH `Drama` and `Thriller` genres, in any order.",
    hint: "$all.",
    solution: `db.movies.find({ genres: { $all: ["Drama", "Thriller"] } })` },

  { id: "a6", topic: "arrays", difficulty: "hard", coll: "restaurants",
    prompt: "Find restaurants where EVERY grade scored above 5.",
    hint: "There is no $allMatch – invert it with $not + $elemMatch.",
    solution: `db.restaurants.find({ grades: { $not: { $elemMatch: { score: { $lte: 5 } } } } })` },

  { id: "a7", topic: "arrays", difficulty: "medium", coll: "restaurants",
    prompt: "The `address.coord` array is `[longitude, latitude]`. Find restaurants whose latitude is above 40.75.",
    hint: "Index 1 is the latitude.",
    solution: `db.restaurants.find({ "address.coord.1": { $gt: 40.75 } })` },

  { id: "a8", topic: "arrays", difficulty: "easy", coll: "products",
    prompt: "Find products tagged `wireless`.",
    hint: "Matching a plain value against an array field checks membership.",
    solution: `db.products.find({ tags: "wireless" })` },

  { id: "a9", topic: "arrays", difficulty: "medium", coll: "movies",
    prompt: "Find movies with an empty `cast` array.",
    hint: "$size: 0.",
    solution: `db.movies.find({ cast: { $size: 0 } })` },

  { id: "a10", topic: "arrays", difficulty: "medium", coll: "orders",
    prompt: "Find orders containing at least one line item with `qty` of 3 or more.",
    hint: "The items array holds subdocuments.",
    solution: `db.orders.find({ items: { $elemMatch: { qty: { $gte: 3 } } } })` },

  { id: "a11", topic: "arrays", difficulty: "hard", coll: "restaurants",
    prompt: "Find restaurants that have received at least one `A` grade AND at least one `C` grade.",
    hint: "Two $elemMatch conditions combined with $and, or $all on grades.grade.",
    solution: `db.restaurants.find({ $and: [ { "grades.grade": "A" }, { "grades.grade": "C" } ] })` },

  { id: "a12", topic: "arrays", difficulty: "hard", coll: "restaurants",
    prompt: "Find restaurants that have at least one `A` grade but have NEVER received a `C`.",
    hint: "$ne on a dotted array path means \"no element equals this\" – but two conditions on the same key need $and.",
    solution: `db.restaurants.find({ $and: [ { "grades.grade": "A" }, { "grades.grade": { $ne: "C" } } ] })` },

  /* ---------------- 8. Embedded documents ---------------- */
  { id: "n1", topic: "embedded", difficulty: "easy", coll: "restaurants",
    prompt: "Find restaurants whose `address.zipcode` is exactly `10011`.",
    hint: "Zipcodes are stored as strings here.",
    solution: `db.restaurants.find({ "address.zipcode": "10011" })` },

  { id: "n2", topic: "embedded", difficulty: "easy", coll: "restaurants",
    prompt: "Return each restaurant's `name` and `address.street`, without `_id`.",
    hint: "The nested shape is preserved in the output.",
    solution: `db.restaurants.find({}, { name: 1, "address.street": 1, _id: 0 })` },

  { id: "n3", topic: "embedded", difficulty: "easy", coll: "movies",
    prompt: "Find movies with more than 100000 `imdb.votes`.",
    hint: "Dot into imdb.",
    solution: `db.movies.find({ "imdb.votes": { $gt: 100000 } })` },

  { id: "n4", topic: "embedded", difficulty: "medium", coll: "movies",
    prompt: "Find movies that have won zero awards. Return `title` and `awards` only, no `_id`.",
    hint: "awards.wins equals 0.",
    solution: `db.movies.find({ "awards.wins": 0 }, { title: 1, awards: 1, _id: 0 })` },

  { id: "n5", topic: "embedded", difficulty: "medium", coll: "orders",
    prompt: "Find orders that include the product with sku `KB-100`.",
    hint: "items is an array of subdocuments – dot notation reaches into it.",
    solution: `db.orders.find({ "items.sku": "KB-100" })` },

  { id: "n6", topic: "embedded", difficulty: "medium", coll: "restaurants",
    prompt: "Find restaurants on a street containing `Ave`. Return `name`, `address.street` and `borough`, no `_id`.",
    hint: "Regex on the nested street field.",
    solution: `db.restaurants.find({ "address.street": /Ave/ }, { name: 1, "address.street": 1, borough: 1, _id: 0 })` },

  { id: "n7", topic: "embedded", difficulty: "hard", coll: "movies",
    prompt: "Find movies with an `imdb.rating` below 6.5. Return `title` and `imdb.rating` only, no `_id`.",
    hint: "Nested filter and nested projection together.",
    solution: `db.movies.find({ "imdb.rating": { $lt: 6.5 } }, { title: 1, "imdb.rating": 1, _id: 0 })` },

  { id: "n8", topic: "embedded", difficulty: "hard", coll: "employees",
    prompt: "Find employees who report to `E4`. Return `name` and `title` without `_id`.",
    hint: "reportsTo holds the manager's _id.",
    solution: `db.employees.find({ reportsTo: "E4" }, { name: 1, title: 1, _id: 0 })` },

  /* ---------------- 9. Aggregation basics ---------------- */
  { id: "g1", topic: "agg-basics", difficulty: "easy", coll: "restaurants",
    prompt: "Using the aggregation pipeline, return `name` and `cuisine` (no `_id`) for Manhattan restaurants.",
    hint: "$match then $project.",
    solution: `db.restaurants.aggregate([
  { $match: { borough: "Manhattan" } },
  { $project: { _id: 0, name: 1, cuisine: 1 } }
])` },

  { id: "g2", topic: "agg-basics", difficulty: "easy", coll: "restaurants",
    prompt: "Count how many restaurants are in `Queens`, using a pipeline that outputs a field called `total`.",
    hint: "$count takes the output field name as a string.",
    solution: `db.restaurants.aggregate([
  { $match: { borough: "Queens" } },
  { $count: "total" }
])` },

  { id: "g3", topic: "agg-basics", difficulty: "medium", coll: "restaurants",
    prompt: "For every restaurant output `name` and a computed field `capacityScore` equal to `seats` multiplied by `price`. No `_id`.",
    hint: "$multiply takes an array of expressions; field refs start with $.",
    solution: `db.restaurants.aggregate([
  { $project: { _id: 0, name: 1, capacityScore: { $multiply: ["$seats", "$price"] } } }
])` },

  { id: "g4", topic: "agg-basics", difficulty: "medium", coll: "restaurants",
    prompt: "Add a field `gradeCount` (the number of grade entries) to every restaurant while keeping all original fields.",
    hint: "$addFields plus $size.",
    solution: `db.restaurants.aggregate([
  { $addFields: { gradeCount: { $size: "$grades" } } }
])` },

  { id: "g5", topic: "agg-basics", difficulty: "medium", coll: "restaurants", ordered: true,
    prompt: "Return the 3 restaurants with the most `seats`. Output `name` and `seats` only, no `_id`.",
    hint: "$sort, $limit, $project.",
    solution: `db.restaurants.aggregate([
  { $sort: { seats: -1 } },
  { $limit: 3 },
  { $project: { _id: 0, name: 1, seats: 1 } }
])` },

  { id: "g6", topic: "agg-basics", difficulty: "medium", coll: "restaurants",
    prompt: "Output each restaurant's `name` and its `cuisine` in UPPERCASE as a field called `shout`. No `_id`.",
    hint: "$toUpper.",
    solution: `db.restaurants.aggregate([
  { $project: { _id: 0, name: 1, shout: { $toUpper: "$cuisine" } } }
])` },

  { id: "g7", topic: "agg-basics", difficulty: "hard", coll: "movies",
    prompt: "For movies released in 2020 or later, output `title`, `year`, and a boolean `isLong` that is true when `runtime` exceeds 120 minutes. No `_id`.",
    hint: "$gt inside $project returns a boolean.",
    solution: `db.movies.aggregate([
  { $match: { year: { $gte: 2020 } } },
  { $project: { _id: 0, title: 1, year: 1, isLong: { $gt: ["$runtime", 120] } } }
])` },

  { id: "g8", topic: "agg-basics", difficulty: "hard", coll: "restaurants",
    prompt: "Output `name` and `avgScore` – the average of each restaurant's grade scores – for restaurants in `Brooklyn`. No `_id`.",
    hint: "$avg works directly on an array field inside $project.",
    solution: `db.restaurants.aggregate([
  { $match: { borough: "Brooklyn" } },
  { $project: { _id: 0, name: 1, avgScore: { $avg: "$grades.score" } } }
])` },

  /* ---------------- 10. Grouping ---------------- */
  { id: "p1", topic: "agg-group", difficulty: "easy", coll: "restaurants",
    prompt: "Count the restaurants in each `borough`. Output the borough as `_id` and the count as `count`.",
    hint: "{ $sum: 1 } counts documents.",
    solution: `db.restaurants.aggregate([
  { $group: { _id: "$borough", count: { $sum: 1 } } }
])` },

  { id: "p2", topic: "agg-group", difficulty: "easy", coll: "restaurants", ordered: true,
    prompt: "Count restaurants per `cuisine` as `count`, sorted from most to least. Break ties by cuisine name ascending.",
    hint: "Group first, then sort on the computed field.",
    solution: `db.restaurants.aggregate([
  { $group: { _id: "$cuisine", count: { $sum: 1 } } },
  { $sort: { count: -1, _id: 1 } }
])` },

  { id: "p3", topic: "agg-group", difficulty: "medium", coll: "restaurants",
    prompt: "For each `borough` compute the average number of `seats` as `avgSeats`.",
    hint: "$avg as an accumulator.",
    solution: `db.restaurants.aggregate([
  { $group: { _id: "$borough", avgSeats: { $avg: "$seats" } } }
])` },

  { id: "p4", topic: "agg-group", difficulty: "medium", coll: "restaurants",
    prompt: "For each `borough` return the largest and smallest `seats` values as `maxSeats` and `minSeats`.",
    hint: "$max and $min accumulators in the same group.",
    solution: `db.restaurants.aggregate([
  { $group: { _id: "$borough", maxSeats: { $max: "$seats" }, minSeats: { $min: "$seats" } } }
])` },

  { id: "p5", topic: "agg-group", difficulty: "medium", coll: "restaurants",
    prompt: "For each `cuisine` collect the restaurant names into an array field called `names`.",
    hint: "$push.",
    solution: `db.restaurants.aggregate([
  { $group: { _id: "$cuisine", names: { $push: "$name" } } }
])` },

  { id: "p6", topic: "agg-group", difficulty: "medium", coll: "restaurants",
    prompt: "For each `borough` collect the DISTINCT cuisines served into an array field `cuisines`.",
    hint: "$addToSet deduplicates; $push does not.",
    solution: `db.restaurants.aggregate([
  { $group: { _id: "$borough", cuisines: { $addToSet: "$cuisine" } } }
])` },

  { id: "p7", topic: "agg-group", difficulty: "medium", coll: "orders",
    prompt: "Compute total revenue per customer: group `orders` by `customerId` and sum `total` into `revenue`.",
    hint: "$sum on a field, not on 1.",
    solution: `db.orders.aggregate([
  { $group: { _id: "$customerId", revenue: { $sum: "$total" } } }
])` },

  { id: "p8", topic: "agg-group", difficulty: "hard", coll: "restaurants",
    prompt: "Count restaurants for each combination of `cuisine` and `borough`. The `_id` should be an object with both keys.",
    hint: "A compound grouping key is just an object.",
    solution: `db.restaurants.aggregate([
  { $group: { _id: { cuisine: "$cuisine", borough: "$borough" }, count: { $sum: 1 } } }
])` },

  { id: "p9", topic: "agg-group", difficulty: "hard", coll: "orders",
    prompt: "Count orders by `status` as `n`, but only for orders placed through the `web` channel.",
    hint: "$match before $group.",
    solution: `db.orders.aggregate([
  { $match: { channel: "web" } },
  { $group: { _id: "$status", n: { $sum: 1 } } }
])` },

  { id: "p10", topic: "agg-group", difficulty: "hard", coll: "restaurants",
    prompt: "Compute the overall average `seats` across the whole collection as `avgSeats`, in one group with `_id` of null.",
    hint: "_id: null puts every document in one bucket.",
    solution: `db.restaurants.aggregate([
  { $group: { _id: null, avgSeats: { $avg: "$seats" } } }
])` },

  { id: "p11", topic: "agg-group", difficulty: "hard", coll: "employees",
    prompt: "For each `dept` return the total salary bill as `payroll` and the headcount as `headcount`, sorted by payroll descending.",
    hint: "Two accumulators, then $sort.",
    solution: `db.employees.aggregate([
  { $group: { _id: "$dept", payroll: { $sum: "$salary" }, headcount: { $sum: 1 } } },
  { $sort: { payroll: -1 } }
])`, ordered: true },

  /* ---------------- 11. $unwind ---------------- */
  { id: "u1", topic: "agg-unwind", difficulty: "easy", coll: "restaurants",
    prompt: "Flatten the `grades` array and count how many grades of each letter (`A`, `B`, `C`) exist across all restaurants. Output the letter as `_id` and the count as `count`.",
    hint: "$unwind then $group on grades.grade.",
    solution: `db.restaurants.aggregate([
  { $unwind: "$grades" },
  { $group: { _id: "$grades.grade", count: { $sum: 1 } } }
])` },

  { id: "u2", topic: "agg-unwind", difficulty: "medium", coll: "restaurants", ordered: true,
    prompt: "Count how many `A` grades each cuisine has earned, as `aGrades`, sorted descending then by cuisine ascending.",
    hint: "unwind → match → group → sort.",
    solution: `db.restaurants.aggregate([
  { $unwind: "$grades" },
  { $match: { "grades.grade": "A" } },
  { $group: { _id: "$cuisine", aGrades: { $sum: 1 } } },
  { $sort: { aGrades: -1, _id: 1 } }
])` },

  { id: "u3", topic: "agg-unwind", difficulty: "medium", coll: "orders", ordered: true,
    prompt: "Across all orders, compute the total quantity sold per `sku` as `unitsSold`, sorted by sku ascending.",
    hint: "Unwind items first, then group on items.sku.",
    solution: `db.orders.aggregate([
  { $unwind: "$items" },
  { $group: { _id: "$items.sku", unitsSold: { $sum: "$items.qty" } } },
  { $sort: { _id: 1 } }
])` },

  { id: "u4", topic: "agg-unwind", difficulty: "medium", coll: "movies", ordered: true,
    prompt: "Which genres appear most often? Flatten `genres` and use `$sortByCount`.",
    hint: "$sortByCount does the group and sort in one stage.",
    solution: `db.movies.aggregate([
  { $unwind: "$genres" },
  { $sortByCount: "$genres" }
])` },

  { id: "u5", topic: "agg-unwind", difficulty: "hard", coll: "restaurants", ordered: true,
    prompt: "How many inspections happened in each calendar month? Unwind `grades` and group by the month number of `grades.date` as `_id`, count as `inspections`, sorted by month.",
    hint: "$month extracts 1-12 from a date.",
    solution: `db.restaurants.aggregate([
  { $unwind: "$grades" },
  { $group: { _id: { $month: "$grades.date" }, inspections: { $sum: 1 } } },
  { $sort: { _id: 1 } }
])` },

  { id: "u6", topic: "agg-unwind", difficulty: "hard", coll: "restaurants",
    prompt: "Unwind `grades` for `Bombay Spice House` and include the array position as a field called `gradeIdx`. Output `name`, `gradeIdx` and `grades.grade` only, no `_id`.",
    hint: "The object form of $unwind supports includeArrayIndex.",
    solution: `db.restaurants.aggregate([
  { $match: { name: "Bombay Spice House" } },
  { $unwind: { path: "$grades", includeArrayIndex: "gradeIdx" } },
  { $project: { _id: 0, name: 1, gradeIdx: 1, "grades.grade": 1 } }
])` },

  { id: "u7", topic: "agg-unwind", difficulty: "hard", coll: "movies", ordered: true,
    prompt: "Which 3 actors appear in the most movies? Unwind `cast`, count per actor as `films`, sort descending then by name ascending, and take the top 3.",
    hint: "unwind → group → sort → limit.",
    solution: `db.movies.aggregate([
  { $unwind: "$cast" },
  { $group: { _id: "$cast", films: { $sum: 1 } } },
  { $sort: { films: -1, _id: 1 } },
  { $limit: 3 }
])` },

  { id: "u8", topic: "agg-unwind", difficulty: "hard", coll: "restaurants", ordered: true,
    prompt: "Find the average grade score per `borough` as `avgScore`, sorted ascending (best inspection scores first – lower is better).",
    hint: "Unwind grades before averaging grades.score.",
    solution: `db.restaurants.aggregate([
  { $unwind: "$grades" },
  { $group: { _id: "$borough", avgScore: { $avg: "$grades.score" } } },
  { $sort: { avgScore: 1 } }
])` },

  /* ---------------- 12. Advanced ---------------- */
  { id: "x1", topic: "agg-advanced", difficulty: "medium", coll: "orders",
    prompt: "Join `orders` to `customers`: attach the matching customer document as an array field called `customer`.",
    hint: "$lookup with localField customerId and foreignField _id.",
    solution: `db.orders.aggregate([
  { $lookup: { from: "customers", localField: "customerId", foreignField: "_id", as: "customer" } }
])` },

  { id: "x2", topic: "agg-advanced", difficulty: "hard", coll: "orders", ordered: true,
    prompt: "Produce one row per order with `_id`, the customer's `name` as `customerName`, and `total` – sorted by `_id` ascending.",
    hint: "$lookup, then $unwind the joined array, then $project.",
    solution: `db.orders.aggregate([
  { $lookup: { from: "customers", localField: "customerId", foreignField: "_id", as: "customer" } },
  { $unwind: "$customer" },
  { $project: { _id: 1, customerName: "$customer.name", total: 1 } },
  { $sort: { _id: 1 } }
])` },

  { id: "x3", topic: "agg-advanced", difficulty: "hard", coll: "restaurants",
    prompt: "In one pipeline produce a document with two keys: `byBorough` (a `$sortByCount` on `borough`) and `topSeats` (the 2 restaurants with the most seats, projected to `name` and `seats` only, no `_id`).",
    hint: "$facet runs several sub-pipelines over the same input.",
    solution: `db.restaurants.aggregate([
  { $facet: {
      byBorough: [ { $sortByCount: "$borough" } ],
      topSeats: [ { $sort: { seats: -1 } }, { $limit: 2 }, { $project: { _id: 0, name: 1, seats: 1 } } ]
  } }
])` },

  { id: "x4", topic: "agg-advanced", difficulty: "hard", coll: "movies",
    prompt: "Bucket movies by `imdb.rating` into the ranges [0,6), [6,7), [7,8), [8,10) with a `count` in each and the titles pushed into `titles`. Use `other` as the default bucket.",
    hint: "$bucket with boundaries, default and output.",
    solution: `db.movies.aggregate([
  { $bucket: {
      groupBy: "$imdb.rating",
      boundaries: [0, 6, 7, 8, 10],
      default: "other",
      output: { count: { $sum: 1 }, titles: { $push: "$title" } }
  } }
])` },

  { id: "x5", topic: "agg-advanced", difficulty: "medium", coll: "restaurants", ordered: true,
    prompt: "Use a single stage to rank boroughs by restaurant count, highest first.",
    hint: "$sortByCount.",
    solution: `db.restaurants.aggregate([
  { $sortByCount: "$borough" }
])` },

  { id: "x6", topic: "agg-advanced", difficulty: "hard", coll: "restaurants", ordered: true,
    prompt: "For each `borough`, list the top 2 restaurants by `seats`. Output `_id` (the borough) and `top` – an array of the whole documents, sliced to 2. Sort boroughs by name ascending.",
    hint: "$sort first, $push \"$$ROOT\", then $slice in a $project.",
    solution: `db.restaurants.aggregate([
  { $sort: { borough: 1, seats: -1 } },
  { $group: { _id: "$borough", top: { $push: "$$ROOT" } } },
  { $project: { top: { $slice: ["$top", 2] } } },
  { $sort: { _id: 1 } }
])` },

  { id: "x7", topic: "agg-advanced", difficulty: "medium", coll: "restaurants", ordered: true,
    prompt: "Promote each Manhattan restaurant's `address` subdocument to be the top-level document. Sort by `building` ascending.",
    hint: "$replaceRoot with newRoot.",
    solution: `db.restaurants.aggregate([
  { $match: { borough: "Manhattan" } },
  { $replaceRoot: { newRoot: "$address" } },
  { $sort: { building: 1 } }
])` },

  { id: "x8", topic: "agg-advanced", difficulty: "hard", coll: "employees",
    prompt: "For employee `E6`, walk the full management chain upward into a field called `chain`.",
    hint: "$graphLookup starting with $reportsTo, connecting reportsTo to _id.",
    solution: `db.employees.aggregate([
  { $match: { _id: "E6" } },
  { $graphLookup: { from: "employees", startWith: "$reportsTo", connectFromField: "reportsTo", connectToField: "_id", as: "chain" } }
])` },

  { id: "x9", topic: "agg-advanced", difficulty: "hard", coll: "restaurants", ordered: true,
    prompt: "Which single restaurant has the best (lowest) average grade score? Output `name` and `avgScore`, one row.",
    hint: "$project the average, then $sort ascending and $limit 1.",
    solution: `db.restaurants.aggregate([
  { $project: { _id: 0, name: 1, avgScore: { $avg: "$grades.score" } } },
  { $sort: { avgScore: 1 } },
  { $limit: 1 }
])` },

  { id: "x10", topic: "agg-advanced", difficulty: "hard", coll: "orders", ordered: true,
    prompt: "Compute monthly revenue: group delivered orders by the `YYYY-MM` string of their `date` as `_id`, summing `total` into `revenue`, sorted by month.",
    hint: "$dateToString with format \"%Y-%m\".",
    solution: `db.orders.aggregate([
  { $match: { status: "delivered" } },
  { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$date" } }, revenue: { $sum: "$total" } } },
  { $sort: { _id: 1 } }
])` },

  { id: "x11", topic: "agg-advanced", difficulty: "hard", coll: "orders", ordered: true,
    prompt: "Join order line items to `products` and report revenue per product name: unwind `items`, look up the product by sku, and sum `qty * price` into `revenue`. Output `_id` as the product name, sorted by revenue descending.",
    hint: "$lookup on items.sku -> sku, $unwind the result, then group on the product name.",
    solution: `db.orders.aggregate([
  { $unwind: "$items" },
  { $lookup: { from: "products", localField: "items.sku", foreignField: "sku", as: "product" } },
  { $unwind: "$product" },
  { $group: { _id: "$product.name", revenue: { $sum: { $multiply: ["$items.qty", "$items.price"] } } } },
  { $sort: { revenue: -1 } }
])` }
];
