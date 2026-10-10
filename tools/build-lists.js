/* Builds the researched topic lists into game.js from research/<id>.json. Run: node tools/build-lists.js
   - Original topics: research/<id>.json is the current list. Its `from` (default 13) is the first day it is used.
   - Re-ranked lists: the older version is kept as research/<id>.from<day>.json; each version applies from its own day,
     so games already played keep the list they were scored on.
   - New topics: research/<id>.json carries `topic: {name, note?, cat, from}` and is appended to TOPICS (ADDED block).
   Refuses to build if a version or topic that is not live yet would take effect on a day that may already be played. */
"use strict";
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, ".."), dir = path.join(root, "research");
const gp = path.join(root, "game.js");
const game = require(gp);
const ORIGINAL_FROM = 13, today = game.dayNumber(), firstSafe = today + 2;
const liveIds = new Set(game.ALL_TOPICS.map(t => t.id));
const errors = [], researched = [], added = [];

function readList(id, r, label) {
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
  if (lines.some(l => l.includes("`") || l.includes("${"))) errors.push(`${label}: backtick or template text in a label`);
  return lines.join("\n");
}
/* Every version of one topic: archived ones (<id>.from<day>.json) plus the current file. */
function versions(id, defaultFrom) {
  const out = [];
  for (const f of fs.readdirSync(dir)) {
    const m = f.match(/^(.+)\.from(\d+)\.json$/);
    if (m && m[1] === id) out.push({ from: +m[2], r: JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")), label: f });
  }
  const cur = JSON.parse(fs.readFileSync(path.join(dir, id + ".json"), "utf8"));
  out.push({ from: cur.from || (cur.topic && cur.topic.from) || defaultFrom, r: cur, label: id + ".json" });
  out.sort((a, b) => a.from - b.from);
  for (let i = 1; i < out.length; i++) if (out[i].from === out[i - 1].from) errors.push(`${id}: two versions from day ${out[i].from}`);
  return { cur, out };
}
const vid = (id, from) => id + "_r" + (from !== ORIGINAL_FROM ? from : "");

const originals = game.TOPICS.filter(t => !t.from || t.from <= 1).map(t => t.id);
const originalSet = new Set(originals);
for (const id of originals) {
  if (!fs.existsSync(path.join(dir, id + ".json"))) { errors.push(`${id}: no research file`); continue; }
  const { out } = versions(id, ORIGINAL_FROM);
  for (const v of out) {
    if (v.from < ORIGINAL_FROM) errors.push(`${v.label}: from ${v.from} is before ${ORIGINAL_FROM}`);
    if (!liveIds.has(vid(id, v.from)) && v.from < firstSafe) errors.push(`${v.label}: new version from day ${v.from}, but day ${today} is today; use ${firstSafe} or later`);
    const items = readList(id, v.r, v.label), live = game.TOPIC[vid(id, v.from)];
    if (live && live.items.trim() !== items) errors.push(`${v.label}: changes a list already in play; archive it as ${id}.from${v.from}.json and give the new list from: ${firstSafe} or later`);
    researched.push({ base: id, from: v.from, items });
  }
}
/* New topics: any research/<id>.json with a `topic` block. */
const CATS = new Set(["food", "sports", "screen", "music", "play", "life", "places", "brands", "people"]);
for (const f of fs.readdirSync(dir)) {
  const m = f.match(/^([a-z0-9]+)\.json$/); if (!m || originalSet.has(m[1])) continue;
  const id = m[1];
  const { cur, out } = versions(id, 0);
  const t = cur.topic;
  if (!t) { errors.push(`${f}: not an original topic and has no "topic" block`); continue; }
  if (!/^[a-z0-9]{2,14}$/.test(id)) errors.push(`${id}: id must be 2-14 lowercase letters/digits`);
  if (!t.name || t.name.length > 40) errors.push(`${id}: topic.name missing or over 40 chars`);
  if (!CATS.has(t.cat)) errors.push(`${id}: topic.cat must be one of ${[...CATS].join(", ")}`);
  if (!Number.isInteger(t.from)) errors.push(`${id}: topic.from must be a day number`);
  if (!liveIds.has(id) && t.from < firstSafe) errors.push(`${id}: new topic from day ${t.from}, but day ${today} is today; use ${firstSafe} or later`);
  const first = out.find(v => v.from === t.from) || (out.length === 1 ? out[0] : null);
  if (!first) { errors.push(`${id}: no list version starts on topic.from ${t.from}`); continue; }
  for (const v of out) {
    if (v.from < t.from) errors.push(`${v.label}: from ${v.from} is before the topic starts (${t.from})`);
    if (v !== first && !liveIds.has(vid(id, v.from)) && v.from < firstSafe) errors.push(`${v.label}: new version from day ${v.from}; use ${firstSafe} or later`);
  }
  added.push({ id, name: t.name, note: t.note || "", cat: t.cat, from: t.from, items: readList(id, first.r, first.label) });
  for (const v of out) if (v !== first) researched.push({ base: id, from: v.from, items: readList(id, v.r, v.label) });
}
/* The daily calendar indexes TOPICS, so topics already in game.js keep their places; newcomers go at the end. */
const liveAdded = game.TOPICS.filter(t => !originalSet.has(t.id)).map(t => t.id);
for (const id of liveAdded) if (!added.some(a => a.id === id)) errors.push(`${id}: live topic has no research file (topics are never removed)`);
const rank = id => { const i = liveAdded.indexOf(id); return i < 0 ? Infinity : i; };
added.sort((a, b) => rank(a.id) - rank(b.id) || a.from - b.from || a.id.localeCompare(b.id));
for (const a of added) if (liveIds.has(a.id)) { const t = game.TOPIC[a.id]; if (t.from !== a.from || t.items.trim() !== a.items) errors.push(`${a.id}: live topic's start day or first list changed; add a new version instead`); }

if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
const bt = s => "`" + s + "`";
let src = fs.readFileSync(gp, "utf8");
function put(a, b, body) {
  const i = src.indexOf(a), j = src.indexOf(b);
  if (i < 0 || j < i) { console.error(`markers ${a} not found in game.js`); process.exit(1); }
  src = src.slice(0, i + a.length) + "\n" + body + (body ? "\n" : "") + src.slice(j);
}
put("/* BEGIN RESEARCHED */", "/* END RESEARCHED */", researched.map(r =>
  `{base:${JSON.stringify(r.base)},${r.from !== ORIGINAL_FROM ? `from:${r.from},` : ""}items:${bt(r.items)}}`).join(",\n"));
put("/* BEGIN ADDED */", "/* END ADDED */", added.map(a =>
  `{id:${JSON.stringify(a.id)},name:${JSON.stringify(a.name)},${a.note ? `note:${JSON.stringify(a.note)},` : ""}cat:${JSON.stringify(a.cat)},from:${a.from},items:${bt(a.items)}},`).join("\n"));
fs.writeFileSync(gp, src);
console.log(`wrote ${researched.length} researched list versions and ${added.length} added topics into game.js (today is day ${today})`);
