/* Proves a catalog change leaves every day that may already be played exactly as it was.
   Run: node tools/check-history.js <old> <new> [--crews crews.json] [--days N]
   <old> and <new> are each a catalog .json (played with today's game.js) or a self-contained game.js
   from before the lists moved to the database. Compares, for day 1 through tomorrow (PT) or N days:
   the daily topic and its list, every crew's whole bonus deck, chains of "New topic" swaps, and scores.
   Real crew codes (--crews) plus 40 random ones. */
"use strict";
const path = require("path"), fs = require("fs");
const argv = process.argv.slice(2), opt = k => { const i = argv.indexOf(k); return i < 0 ? null : argv.splice(i, 2)[1]; };
const crewsPath = opt("--crews"), daysOpt = opt("--days");
const [oldSrc, newSrc] = argv;
if (!oldSrc || !newSrc) { console.error("usage: node tools/check-history.js <old catalog.json|game.js> <new catalog.json|game.js> [--crews crews.json] [--days N]"); process.exit(2); }
const GAME = path.join(__dirname, "..", "game.js");
/* A fresh copy of the game module per side, so the two catalogs never share state. */
function load(src) {
  const p = path.resolve(src);
  if (p.endsWith(".js")) { delete require.cache[p]; return require(p); }
  delete require.cache[require.resolve(GAME)];
  const g = require(GAME);
  g.setCatalog(JSON.parse(fs.readFileSync(p, "utf8")));
  delete require.cache[require.resolve(GAME)];
  return g;
}
const A = load(oldSrc), B = load(newSrc);
const last = daysOpt ? +daysOpt : B.dayNumber() + 1;
const crews = crewsPath ? JSON.parse(fs.readFileSync(crewsPath, "utf8")) : [];
for (let i = 0; i < 40; i++) crews.push(Math.random().toString(36).slice(2, 8).toUpperCase());
const sig = t => t.id + "\n" + t.items.trim();
const bad = [];
let checks = 0;
for (let d = 1; d <= last; d++) {
  checks++;
  if (sig(A.topicForDay(d)) !== sig(B.topicForDay(d))) bad.push(`day ${d}: daily topic ${A.topicForDay(d).id} -> ${B.topicForDay(d).id}`);
  const deckLen = A.TOPICS.filter(t => (t.from || 1) <= d).length - 1;
  for (const g of crews) {
    // The whole bonus deck (every round a crew could reach that day), in order.
    for (let n = 2; n <= deckLen + 1; n++) {
      checks++;
      const a = A.topicForRound(g, d, n), b = B.topicForRound(g, d, n);
      if (sig(a) !== sig(b)) { bad.push(`day ${d} crew ${g} round ${n}: ${a.id} -> ${b.id}`); break; }
    }
    // Chains of up to 6 "New topic" swaps in rounds 1-6.
    for (let n = 1; n <= 6; n++) {
      const seenA = [A.topicForRound(g, d, n).id], seenB = seenA.slice();
      for (let s = 0; s < 6; s++) {
        checks++;
        const a = A.swapTopic(g, d, n, seenA), b = B.swapTopic(g, d, n, seenB);
        if (sig(a) !== sig(b)) { bad.push(`day ${d} crew ${g} round ${n} swap ${s + 1}: ${a.id} -> ${b.id}`); break; }
        seenA.push(a.id); seenB.push(b.id);
      }
    }
  }
  const t = A.topicForDay(d);
  for (let k = 0; k < 20; k++) {
    checks++;
    const picks = [0, 1, 2, 3].map(i => t.entries[(k * 5 + i * 7) % t.entries.length].label);
    const sc = G => { const tt = G.topicForDay(d); return G.scoreFaces(picks.map(l => { const m = G.matchEntry(tt, l); return { label: m ? m.label : l, rank: m ? m.rank : null }; }), d).total; };
    if (sc(A) !== sc(B)) { bad.push(`day ${d}: picks ${picks.join(", ")} score ${sc(A)} -> ${sc(B)}`); break; }
  }
}
for (const t of A.ALL_TOPICS) if (!B.TOPIC[t.id] || sig(B.TOPIC[t.id]) !== sig(t)) bad.push(`topic ${t.id} changed or vanished (live crew rounds refer to it by id)`);
if (bad.length) { console.error(`HISTORY CHANGED (${bad.length}):\n` + bad.slice(0, 30).join("\n")); process.exit(1); }
console.log(`history unchanged: days 1-${last}, ${crews.length} crews, ${checks} checks`);
