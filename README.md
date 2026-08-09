# MongoQuest

Practise MongoDB queries in the browser. 110 exercises across 12 topics, a
cheatsheet for each one, and a runner that tells you whether your answer is
actually right.

https://pratham-kumar-jr.github.io/mongoquest/

## The problem

Getting better at MongoDB queries means writing a lot of them, and that usually
stalls before it starts. To practise `$unwind` or `$lookup` you first need a
database running, a dataset big enough to be interesting but small enough to
reason about, and some way of knowing whether what you just wrote is correct.

Most people skip all that and read the documentation instead. Documentation
tells you what an operator does. It does not tell you which one to reach for
when the question is "count how many grades of each letter exist across all
restaurants", and it never tells you that your answer was wrong.

## What this does about it

Everything runs in the browser with the data already loaded. You get a question,
you write a real query, you run it, and it gets checked immediately.

Answers are compared by result, not by text. Your query and the reference
solution both execute against the same collections and the two outputs are
compared, so any query that returns the right documents is accepted no matter
how you wrote it. Order only counts on questions that are about sorting.

The datasets are deliberately small, 8 to 24 documents each, so you can read a
collection top to bottom and work out what the answer should be before you write
anything. That is the part a huge sample dataset takes away from you.

## What's covered

Finding & Projection, Comparison Operators, Logical Operators, Element & Type,
Pattern Matching, Sort/Limit/Skip, Array Queries, Embedded Documents,
Aggregation Basics, Grouping & Accumulators, `$unwind` & Array Pipelines, and
Joins & Advanced Stages.

Six collections to query: restaurants, movies, customers, products, orders and
employees, wired together so joins and lookups have something real to join on.

Each topic has its own cheatsheet next to the questions, and there is a combined
one covering all twelve.

## Scope

It teaches the read path. No writes, no indexes, no `explain()`, no `$text` or
geospatial operators. Queries execute through
[mingo](https://github.com/kofrasa/mingo) rather than a real server, so this is
for learning query shapes, not for anything about performance or deployment.

No signup, no accounts, no backend. Progress is saved in localStorage, and the
whole app is a single HTML file that works offline once loaded.

## Licence

mingo is MIT and bundled. The rest, do what you like with.
