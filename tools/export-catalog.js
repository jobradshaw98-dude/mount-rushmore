/* One-time export: turns the lists built into game.js (before the move to the database) into the catalog shape
   the database holds. Run: node tools/export-catalog.js <game.js> <out.json>
   catalog = { topics: {<id>: {name, note?, cat, from, seq}}, lists: {<versionId>: {base, from, items}} } */
"use strict";
const path = require("path"), fs = require("fs");
const [src, out] = process.argv.slice(2);
const g = require(path.resolve(src));
const topics = {}, lists = {};
g.TOPICS.forEach((t, seq) => {
  topics[t.id] = { name: t.name, cat: g.catOf ? g.catOf(t) : t.cat, from: t.from || 1, seq };
  if (t.note) topics[t.id].note = t.note;
});
for (const t of g.ALL_TOPICS) {
  const base = t.base || t.id;
  // Original lists start on day 1; the two hand revisions (villains2, boardgames2) on REVISE_FROM (2); researched versions carry their own from.
  const from = !t.base ? (t.from || 1) : (t.from || 2);
  lists[t.id] = { base, from, items: t.items.trim() };
}
fs.writeFileSync(out, JSON.stringify({ topics, lists }, null, 1));
console.log(`${Object.keys(topics).length} topics, ${Object.keys(lists).length} lists -> ${out}`);
