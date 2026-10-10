/* Publishes topic research to the database. Used by the GitHub Action; safe to run by hand.
     node tools/catalog.js plan               what would be published (reads the live catalog, writes nothing)
     node tools/catalog.js publish            plan, check, then write the new rows as the publisher
   Source of truth for research: research/<id>.json (see research/README.md).
   - research/<id>.json with a `topic` block and an id the database lacks = a new topic (row + its first list).
   - research/<id>.json whose list differs from what the database has for its `from` = a new list version
     <base>_r<from>. A list already in the database can never change (the rules refuse it), so a re-rank always
     gets a new, later `from`.
   Before writing it proves no playable day changes (tools/check-history.js, live vs live+new) and the database
   rules enforce the same thing on its side: write-once rows, `from` at least today+2, publisher-only writes.
   Publishing needs FIREBASE_SA (a service-account key, JSON). The connection identifies as "catalog-publisher",
   so the database rules apply to it like to any user; an unrestricted admin connection is used only to read the
   real crew codes for the history check. */
"use strict";
const fs = require("fs"), os = require("os"), path = require("path"), { execFileSync } = require("child_process");
const root = path.join(__dirname, ".."), dir = path.join(root, "research");
const DB_URL = "https://mount-rushmore-daily-f6451-default-rtdb.firebaseio.com";
const game = require(path.join(root, "game.js"));
const CATS = new Set(["food", "sports", "screen", "music", "play", "life", "places", "brands", "people"]);
const ORIGINAL_FROM = 13;
const mode = process.argv[2];
if (!["plan", "publish"].includes(mode)) { console.error("usage: node tools/catalog.js plan|publish"); process.exit(2); }

const vid = (base, from, topicFrom) => from === topicFrom ? base : base + "_r" + (from === ORIGINAL_FROM && topicFrom === 1 ? "" : from);

function readList(r, label, errors) {
  const lines = (r.list || []).map(l => l.split("|").map(x => x.trim()).filter(Boolean).join("|"));
  if (lines.length !== 24) errors.push(`${label}: ${lines.length} items, need 24`);
  if (!(r.sources || []).length) errors.push(`${label}: no sources`);
  const seen = new Map();
  lines.forEach((l, i) => l.split("|").forEach(a => {
    const k = game.key(a);
    if (!k) errors.push(`${label}: empty key in "${l}"`);
    else if (seen.has(k) && seen.get(k) !== i) errors.push(`${label}: "${a}" (#${i + 1}) clashes with #${seen.get(k) + 1}`);
    else seen.set(k, i);
  }));
  return lines.join("\n");
}

async function main() {
  const live = await (await fetch(`${DB_URL}/catalog.json`)).json();
  if (!live || !live.topics || !live.lists) throw new Error("could not read the live catalog");
  game.setCatalog(live);
  const today = game.dayNumber(), firstSafe = today + 2;
  const errors = [], rows = {};
  for (const f of fs.readdirSync(dir).filter(f => /^[a-z0-9]+\.json$/.test(f)).sort()) {
    const id = f.slice(0, -5), r = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    const liveTopic = live.topics[id];
    if (!liveTopic && !r.topic) { errors.push(`${f}: not a live topic and has no "topic" block`); continue; }
    if (r.topic && !liveTopic) {
      const t = r.topic;
      if (!/^[a-z0-9]{2,14}$/.test(id)) errors.push(`${id}: id must be 2-14 lowercase letters/digits`);
      if (!t.name || t.name.length > 40) errors.push(`${id}: topic.name missing or over 40 chars`);
      if (!CATS.has(t.cat)) errors.push(`${id}: topic.cat must be one of ${[...CATS].join(", ")}`);
      if (!Number.isInteger(t.from) || t.from < firstSafe) errors.push(`${id}: topic.from must be day ${firstSafe} or later (today is ${today})`);
      if (r.from && r.from !== t.from) errors.push(`${id}: a new topic's list starts with the topic (drop "from" or set it to ${t.from})`);
      const topic = { name: t.name, cat: t.cat, from: t.from, seq: 1000 };
      if (t.note) topic.note = String(t.note).slice(0, 60);
      rows[`topics/${id}`] = topic;
      rows[`lists/${id}`] = { base: id, from: t.from, items: readList(r, f, errors) };
      continue;
    }
    // A live topic: the file is its newest list.
    const topicFrom = liveTopic.from || 1, from = r.from || (topicFrom === 1 ? ORIGINAL_FROM : topicFrom);
    const v = vid(id, from, topicFrom), items = readList(r, f, errors), have = live.lists[v];
    if (have) { if (have.items.trim() !== items) errors.push(`${f}: changes ${v}, which is already published; give the new list "from": ${firstSafe} or later (and keep the old file as ${id}.from${from}.json)`); continue; }
    if (from < firstSafe) errors.push(`${f}: new version ${v} starts on day ${from}; use ${firstSafe} or later`);
    if (r.topic && JSON.stringify(r.topic) !== JSON.stringify({ ...r.topic, from: topicFrom })) errors.push(`${f}: the topic block of a published topic cannot change`);
    rows[`lists/${v}`] = { base: id, from, items };
  }
  if (errors.length) { console.error("NOT PUBLISHED:\n" + errors.join("\n")); process.exit(1); }
  const ids = Object.keys(rows);
  console.log(ids.length ? `new rows (${ids.length}): ${ids.join(", ")}` : "nothing new to publish");
  if (!ids.length) return;

  // Prove no playable day changes: live catalog vs live + new rows.
  const next = JSON.parse(JSON.stringify(live));
  for (const [k, val] of Object.entries(rows)) { const [a, b] = k.split("/"); next[a][b] = val; }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "mr-cat-"));
  fs.writeFileSync(path.join(tmp, "live.json"), JSON.stringify(live));
  fs.writeFileSync(path.join(tmp, "next.json"), JSON.stringify(next));
  const args = [path.join(__dirname, "check-history.js"), path.join(tmp, "live.json"), path.join(tmp, "next.json")];
  let adminApp = null;
  if (mode === "publish") {
    const admin = require("firebase-admin");
    const cred = admin.credential.cert(JSON.parse(process.env.FIREBASE_SA || "null") || (() => { throw new Error("FIREBASE_SA is not set"); })());
    adminApp = admin.initializeApp({ credential: cred, databaseURL: DB_URL }, "reader");
    const crews = Object.keys((await adminApp.database().ref("crewRounds").get()).val() || {});
    fs.writeFileSync(path.join(tmp, "crews.json"), JSON.stringify(crews));
    args.push("--crews", path.join(tmp, "crews.json"));
    console.log(`history check with ${crews.length} real crews`);
  }
  console.log(execFileSync(process.execPath, args, { encoding: "utf8" }).trim());
  // Simulated deck: each new topic must show up in bonus decks on its start day.
  const g2 = require(path.join(root, "game.js")); g2.setCatalog(next);
  for (const k of ids.filter(k => k.startsWith("topics/"))) {
    const id = k.split("/")[1], d = rows[k].from;
    const seen = new Set(); for (let n = 2; n < 60; n++) seen.add(g2.topicForRound("CHECK1", d, n).base || g2.topicForRound("CHECK1", d, n).id);
    if (!seen.has(id)) throw new Error(`${id} does not appear in a bonus deck on day ${d}`);
    console.log(`${id}: in bonus decks from day ${d}`);
  }
  if (mode === "plan") return;

  // Write as the publisher: the database rules decide.
  const admin = require("firebase-admin");
  const pub = admin.initializeApp({ credential: adminApp.options.credential, databaseURL: DB_URL, databaseAuthVariableOverride: { uid: "catalog-publisher" } }, "publisher");
  await pub.database().ref("catalog").update(rows);
  const after = await (await fetch(`${DB_URL}/catalog.json`)).json();
  const missing = ids.filter(k => { const [a, b] = k.split("/"); return JSON.stringify(after[a][b]) !== JSON.stringify(rows[k]); });
  if (missing.length) throw new Error("published but not readable back: " + missing.join(", "));
  console.log(`published ${ids.length} rows; verified by reading them back`);
  await Promise.all([pub.delete(), adminApp.delete()]);
}
main().catch(e => { console.error("FAILED:", e.message); process.exit(1); });
