/* Mount Rushmore Daily: topics, matching, the daily calendar and scoring.
   Shared by the page (loaded as a plain script, so these names are globals) and the server
   function that re-checks leaderboard posts (loaded with require). Keep it free of browser APIs. */
"use strict";
/* ---------------- topics (data lives in the database, not here) ----------------
   The lists live in the Firebase Realtime Database at /catalog, so a new topic is new data, not a code release.
   catalog = { topics: {<id>: {name, note?, cat, from, seq}}, lists: {<versionId>: {base, from, items}} }
   - A topic's first list has the topic's own id; later versions (re-ranks) have their own ids and a later `from`.
     A day uses the newest version of its topic with from <= day, so days already played keep the list they had.
   - Topic order matters (the daily calendar indexes it): sorted by (from, seq, id). Every new topic starts after
     every day anyone can have played, so it always sorts after the topics those days could see.
   - The database rules make every published row write-once and future-dated; see database.rules.json.
   setCatalog() builds the globals below; the page and the server both call it with the same data. */
let TOPICS = [], ALL_TOPICS = [], TOPIC = {}, VERSIONS = {};
const catOf = t => (TOPIC[t.base||t.id]||t).cat;
function topicOrder(a, b){ return a.from-b.from || a.seq-b.seq || (a.id<b.id?-1:a.id>b.id?1:0); }
function setCatalog(cat){
  const metas = Object.entries((cat&&cat.topics)||{}).map(([id,m])=>({id, name:m.name, note:m.note, cat:m.cat, from:+m.from||1, seq:m.seq==null?1e9:+m.seq}));
  metas.sort(topicOrder);
  const meta = Object.fromEntries(metas.map(m=>[m.id,m]));
  const all = [], versions = {};
  for (const [id, l] of Object.entries((cat&&cat.lists)||{})){
    const m = meta[l.base]; if(!m || typeof l.items!=="string") continue;
    const t = {id, name:m.name, cat:m.cat, from:+l.from||1, items:l.items};
    if(m.note) t.note = m.note;
    if(id!==l.base) t.base = l.base;
    t.entries = t.items.trim().split("\n").map((line,i)=>{
      const [label,...al] = line.split("|").map(x=>x.trim());
      const k = key(label);
      return {label, rank:i+1, keys:[k, ...al.map(key)], tokens:k.split(" ").filter(w=>w.length>=4)};
    });
    t.size = t.entries.length;
    all.push(t); (versions[l.base]=versions[l.base]||[]).push(t);
  }
  for (const b in versions) versions[b].sort((x,y)=>y.from-x.from);
  const byId = Object.fromEntries(all.map(t=>[t.id,t]));
  TOPICS = metas.filter(m=>byId[m.id]).map(m=>byId[m.id]);
  ALL_TOPICS = all; TOPIC = byId; VERSIONS = versions;
  return TOPICS.length;
}

/* ---------------- matching ---------------- */
function key(s){
  let t = String(s).normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase()
    .replace(/&/g," and ").replace(/['’.]/g,"").replace(/[^a-z0-9]+/g," ").trim();
  t = t.replace(/^the /,"");
  return t.split(" ").filter(Boolean).map(w => (w.length>=2 && w.endsWith("s") && !w.endsWith("ss")) ? w.slice(0,-1) : w).join(" ");
}
function matchEntry(t, text){
  const k = key(text); if(!k) return null;
  const exact = t.entries.find(e=>e.keys.includes(k)); if(exact) return exact;
  if(!k.includes(" ") && k.length>=4){ const c=t.entries.filter(e=>e.tokens.includes(k)); if(c.length===1) return c[0]; }
  if(k.length>=6){ const c=t.entries.filter(e=>e.keys[0].includes(k)); if(c.length===1) return c[0]; }
  return null;
}
function titleCase(s){ return s.trim().replace(/\s+/g," ").slice(0,40).replace(/\b([a-z])/g,(m,c)=>c.toUpperCase()); }

/* ---------------- daily (one calendar for everyone: the day turns over at midnight Pacific) ---------------- */
const TZ = "America/Los_Angeles";
function ptParts(d=new Date()){
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US",{timeZone:TZ,year:"numeric",month:"numeric",day:"numeric",hour:"numeric",minute:"numeric",hourCycle:"h23"}).formatToParts(d).map(x=>[x.type,x.value]));
  return {y:+p.year, m:+p.month, d:+p.day, h:+p.hour, min:+p.minute};
}
function dayNumber(d=new Date()){ const p=ptParts(d); return Math.round((Date.UTC(p.y,p.m-1,p.d)-Date.UTC(2026,8,27))/864e5)+1; } // #1 = Sep 27 2026
function shortDay(n){ return new Date(Date.UTC(2026,8,27)+(n-1)*864e5).toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric",timeZone:"UTC"}); }
function dayLabel(n){ const t=new Date(Date.UTC(2026,8,27)+(n-1)*864e5); return t.toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric",timeZone:"UTC"}); }
function untilTomorrow(){ const p=ptParts(); const m=Math.max(1,1440-(p.h*60+p.min)); return `${Math.floor(m/60)}h ${m%60}m`; }
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function shuffled(list, seed){ const r=mulberry(seed), p=list.slice(); for(let i=p.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[p[i],p[j]]=[p[j],p[i]]} return p; }
function hash(str){ let h=2166136261; for(const c of str){ h^=c.charCodeAt(0); h=Math.imul(h,16777619); } return h>>>0; }
/* The daily rotation runs in cycles. Each cycle shuffles the topics available when it starts, so a
   new topic (it always sorts after the topics already playable, see setCatalog) never changes a day
   that has already been played. Cycle 1 is the original order (seed 1776). */
const avail = day => TOPICS.map((t,i)=>i).filter(i=>(TOPICS[i].from||1)<=day);
function dayIndex(n){
  if(!TOPICS.length) throw new Error("no topics loaded");   // an empty catalog would loop forever below
  if(n<1) return shuffled(avail(1),1776)[((n-1)%TOPICS.length+TOPICS.length)%avail(1).length];
  for(let start=1, c=0;; c++){
    const pool=avail(start), order=shuffled(pool, 1776+c);
    if(n<start+order.length) return order[n-start];
    start+=order.length;
  }
}
const onDay = (t, day) => (VERSIONS[t.id]||[]).find(v=>v.from<=day) || t;
function topicForDay(n){ return onDay(TOPICS[dayIndex(n)], n); }
/* Reorder a shuffled list so two topics from the same category never sit back to back. */
function spreadOut(list, prevCat){
  const out=[], pool=list.slice();
  while(pool.length){
    const last = out.length ? catOf(out[out.length-1]) : prevCat;
    let i = pool.findIndex(t=>catOf(t)!==last); if(i<0) i=0;
    out.push(pool.splice(i,1)[0]);
  }
  return out;
}
/* Round 1 is the shared daily topic. Bonus rounds deal from a crew-and-day shuffle of the rest,
   so every phone derives the same topic for "round 3 today" with no coordination and no repeats in a day. */
function roundDeckV1(g, day){
  const daily = topicForDay(day), dailyBase = daily.base || daily.id;
  let rest = shuffled(TOPICS.filter(t=>t.id!==dailyBase && (t.from||1)<=day), hash(g+":"+day)).map(t=>onDay(t, day));
  if(day>=2) rest = spreadOut(rest, catOf(TOPICS.find(t=>t.id===dailyBase)));   // category spreading started on day 2
  return rest;
}
function topicForRound(g, day, n, avoid){
  if(n<=1) return topicForDay(day);
  const rest = roundDeck(g, day, avoid);
  return rest[(n-2)%rest.length];
}
/* "New topic" in a round's lobby (the daily round too, for a crew that already played it) deals from the BACK of the same deck (rounds deal from the front),
   skipping topics already dealt today and every topic this round has shown (seen = topic ids, oldest first).
   Each round starts its swaps SWAP_GAP cards further in, so round 1's, round 2's and round 3's swaps differ. */
const SWAP_GAP = 5;
function swapTopicV1(g, day, n, seen){
  const rest = roundDeckV1(g, day), used = new Set(seen);
  for(let k=2;k<=n;k++) used.add(topicForRound(g, day, k).id);
  const fresh = rest.slice().reverse().filter(t=>!used.has(t.id));
  return fresh[((n-1)*SWAP_GAP + seen.length-1) % (fresh.length||1)] || rest.find(t=>t.id!==seen[seen.length-1]) || rest[0];
}

/* From FRESH_FROM (game #16, Oct 12 2026) a crew is offered topics it hasn't seen lately (Jordan, 2026-10-10: the
   New topic button kept offering topics played days before). `avoid` = topic ids (any version) the crew was shown in the
   last RECENT_DAILY days, read by the page from the crew's rounds; those days' daily topics count as seen too.
   The deck keeps its old order with the unseen topics moved to the front. Phones don't need to agree on the deck any
   more than before: whoever creates a round or swaps records the topic in the round's log, and that log is the truth. */
const FRESH_FROM = 16, RECENT_DAILY = 7;
const baseOf = id => (TOPIC[id] && (TOPIC[id].base || TOPIC[id].id)) || id;
function seenRecently(day, avoid){
  const out = new Set((avoid||[]).map(baseOf));
  for(let k=Math.max(1, day-RECENT_DAILY); k<day; k++){ const t=topicForDay(k); out.add(t.base||t.id); }
  return out;
}
function roundDeck(g, day, avoid){
  const deck = roundDeckV1(g, day);
  if(day<FRESH_FROM) return deck;
  const seen = seenRecently(day, avoid), old = t => seen.has(t.base||t.id);
  return deck.filter(t=>!old(t)).concat(deck.filter(old));
}
/* A swap offers the first topic in the deck that this round hasn't shown, that today's other rounds haven't used,
   and (from FRESH_FROM) that the crew hasn't seen lately; when everything is stale it falls back to deck order. */
function swapTopic(g, day, n, seen, avoid){
  if(day<FRESH_FROM) return swapTopicV1(g, day, n, seen);
  const rest = roundDeck(g, day, avoid), used = new Set((seen||[]).map(baseOf));
  for(let k=2;k<=n+2;k++) used.add(baseOf(rest[(k-2)%rest.length].id));
  for(let k=2;k<=n+3;k++){ const t=topicForRound(g, day, k); used.add(t.base||t.id); }   // also the plain deck's rounds, in case history didn't load
  return rest.find(t=>!used.has(t.base||t.id)) || rest.find(t=>t.id!==seen[seen.length-1]) || rest[0];
}

/* ---------------- scoring ---------------- */
/* From SCORE2_FROM on (Oct 8 2026), points fall off steeply so the top of the board is worth chasing
   (#1 150, #2 136, #4 112, #10 68, #24 36) and the order you carve your four in no longer scores.
   Earlier days keep the old rules (100 down to 31 by 3s, +10 right order, +15 exact spot) so old games keep their scores. */
const WRITE_IN = 15, SCORE2_FROM = 12;
const isScore2 = day => (day||0) >= SCORE2_FROM;
function basePts(rank, day){
  if(!rank) return WRITE_IN;
  return isScore2(day) ? Math.round(30 + 120*Math.pow(0.88, rank-1)) : 100-(rank-1)*3;
}
function maxScore(day){ return isScore2(day) ? [1,2,3,4].reduce((s,r)=>s+basePts(r,day),0) : 482; }
function tierOf(rank){ return !rank ? 4 : rank<=4 ? 1 : rank<=10 ? 2 : 3; }
const TIER_EMO = {1:"\u{1F7E9}",2:"\u{1F7E8}",3:"\u{1F7E7}",4:"⬜"};
const TIER_TXT = {1:"Consensus top 4",2:"Top 10",3:"On the board",4:"Write-in"};
const SPOTS = ["Washington spot","Jefferson spot","Roosevelt spot","Lincoln spot"];
function scoreFaces(faces, day){
  // faces: 4 picks in the player's chosen order (slot 0 = #1); day = the game's day number (decides the rules)
  const v2 = isScore2(day), eff = f => f.rank || 999;
  const ideal = faces.map((f,i)=>({f,i})).sort((a,b)=>eff(a.f)-eff(b.f)||a.i-b.i).map(x=>x.f);
  const rows = faces.map((f,slot)=>{
    const base = basePts(f.rank, day);
    const right = !v2 && f.rank && ideal[slot]===f ? 10 : 0;
    const exact = !v2 && f.rank===slot+1 ? 15 : 0;
    return {f, slot, base, right, exact, pts:base+right+exact};
  });
  return {rows, total: rows.reduce((s,r)=>s+r.pts,0)};
}

if (typeof module !== "undefined") module.exports = {setCatalog, catOf, get TOPICS(){ return TOPICS; }, get ALL_TOPICS(){ return ALL_TOPICS; }, get TOPIC(){ return TOPIC; }, key, matchEntry, dayNumber, topicForDay, topicForRound, swapTopic, scoreFaces, basePts, maxScore, tierOf, SCORE2_FROM};
