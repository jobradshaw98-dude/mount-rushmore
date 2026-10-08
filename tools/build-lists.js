/* Builds the researched topic lists into game.js (between the RESEARCHED markers) from research/<id>.json.
   Each research file holds the ranked list and the sources it was built from. Run: node tools/build-lists.js */
"use strict";
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, ".."), dir = path.join(root, "research");
const game = require(path.join(root, "game.js"));
const errors = [], blocks = [];
for (const t of game.TOPICS) {
  const f = path.join(dir, t.id + ".json");
  if (!fs.existsSync(f)) { errors.push(`${t.id}: no research file`); continue; }
  const r = JSON.parse(fs.readFileSync(f, "utf8"));
  const lines = (r.list || []).map(l => l.split("|").map(x => x.trim()).filter(Boolean).join("|"));
  if (lines.length !== 24) errors.push(`${t.id}: ${lines.length} items, need 24`);
  if (!(r.sources || []).length) errors.push(`${t.id}: no sources`);
  const seen = new Map();
  lines.forEach((l, i) => l.split("|").forEach(a => {
    const k = game.key(a);
    if (!k) errors.push(`${t.id}: empty key in "${l}"`);
    else if (seen.has(k) && seen.get(k) !== i) errors.push(`${t.id}: "${a}" (#${i + 1}) clashes with #${seen.get(k) + 1}`);
    else seen.set(k, i);
  }));
  if (lines.some(l => l.includes("`") || l.includes("${"))) errors.push(`${t.id}: backtick or template text in a label`);
  blocks.push(`{base:${JSON.stringify(t.id)},items:\`${lines.join("\n")}\`}`);
}
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
const gp = path.join(root, "game.js"), src = fs.readFileSync(gp, "utf8");
const a = "/* BEGIN RESEARCHED */", b = "/* END RESEARCHED */";
const i = src.indexOf(a), j = src.indexOf(b);
if (i < 0 || j < i) { console.error("markers not found in game.js"); process.exit(1); }
fs.writeFileSync(gp, src.slice(0, i + a.length) + "\n" + blocks.join(",\n") + "\n" + src.slice(j));
console.log(`wrote ${blocks.length} researched lists into game.js`);
