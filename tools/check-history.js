/* Proves a game.js change leaves every day that may already be played exactly as it was.
   Run: node tools/check-history.js <old game.js> [crews.json]
   Compares, for day 1 through tomorrow (PT): the daily topic and its list, every crew's bonus-round deck and
   topic swaps, and the score of a sample of picks. crews.json (optional) is a list of real crew codes; random codes are added. */
"use strict";
const path = require("path"), fs = require("fs");
const [oldPath, crewsPath] = process.argv.slice(2);
if (!oldPath) { console.error("usage: node tools/check-history.js <old game.js> [crews.json]"); process.exit(2); }
const A = require(path.resolve(oldPath)), B = require(path.join(__dirname, "..", "game.js"));
const last = B.dayNumber() + 1;
let crews = crewsPath ? JSON.parse(fs.readFileSync(crewsPath, "utf8")) : [];
for (let i = 0; i < 40; i++) crews.push(Math.random().toString(36).slice(2, 8).toUpperCase());
const sig = t => t.id + "\n" + t.items.trim();
const bad = [];
let checks = 0;
for (let d = 1; d <= last; d++) {
  checks++;
  if (sig(A.topicForDay(d)) !== sig(B.topicForDay(d))) bad.push(`day ${d}: daily topic ${A.topicForDay(d).id} -> ${B.topicForDay(d).id}`);
  for (const g of crews) {
    // The whole bonus deck (every round a crew could reach that day), in order.
    const deckLen = A.TOPICS.filter(t => (t.from || 1) <= d).length - 1;
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
