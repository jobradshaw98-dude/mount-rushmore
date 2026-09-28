// Two server jobs:
// 1. sendTurnAlert: a phone that just made a move writes a small request to notify/<round>/<id>; this looks up
//    who it's for, sends a web push to each of their saved devices, then deletes the request.
// 2. checkSoloPost: every new solo leaderboard post is re-scored here with the same game code the page uses
//    (game.js, copied in at deploy). Posts for the wrong day or with a score that doesn't match their picks
//    are removed; valid ones bump that day's player count, which only this function may write.
const { onValueCreated } = require("firebase-functions/v2/database");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const webpush = require("web-push");
const game = require("./game.js");

admin.initializeApp();
const VAPID_PRIVATE = defineSecret("VAPID_PRIVATE");
const VAPID_PUBLIC = "BHLLp75RQ05Qp2yJO7Sfve9xQatx2aE_FyQ7pYY_qwEEuGts7jPPK15ZtMDyTOMjN7jUjDvZoB4CIUScDM8tdvo";
const SITE = "https://jobradshaw98-dude.github.io/mount-rushmore/";
const DB = { region: "us-central1", instance: "mount-rushmore-daily-f6451-default-rtdb" };

const TEMPLATES = {
  turn:  (crew) => ({ title: "You're on the clock", body: `Your pick in ${crew}. Don't keep them waiting.` }),
  order: (crew) => ({ title: "Draft's done", body: `Lock in your mountain in ${crew} to see the scores.` }),
  bonus: (crew) => ({ title: "Bonus round", body: `A new round just opened in ${crew}. Come draft.` }),
};
const ID = /^[a-z0-9]{3,24}$/;

// Saved alert slots come in two shapes: one subscription per account (older) or one per device under it.
function flattenSubs(node) {
  const out = [];
  for (const [uid, v] of Object.entries(node || {})) {
    if (!v || typeof v !== "object") continue;
    if (typeof v.endpoint === "string") out.push({ path: uid, sub: v });
    else for (const [dev, sub] of Object.entries(v)) if (sub && typeof sub.endpoint === "string") out.push({ path: `${uid}/${dev}`, sub });
  }
  return out;
}

exports.sendTurnAlert = onValueCreated(
  { ref: "/notify/{round}/{id}", ...DB, secrets: [VAPID_PRIVATE], maxInstances: 5 },
  async (event) => {
    try {
      const req = event.data.val() || {};
      const round = event.params.round;              // CREW-day-n
      const crewCode = round.split("-")[0];
      await event.data.ref.remove();                 // requests are one-shot
      const tmpl = TEMPLATES[req.kind];
      if (!tmpl || typeof req.to !== "string" || !ID.test(req.to)) return;

      const db = admin.database();
      // One alert per player per turn, and a nudge for the same turn at most once a minute.
      const turn = Number.isInteger(req.n) ? req.n : 0;
      const gate = db.ref(`notifyGate/${round}/${req.to}/${req.kind}-${turn}`);
      const now = Date.now();
      const tx = await gate.transaction(last => (last && now - last < 60000) ? undefined : now);
      if (!tx.committed) return;

      const name = (await db.ref(`crews/${crewCode}/name`).get()).val() || `crew ${crewCode}`;
      const subs = flattenSubs((await db.ref(`pushSubs/${crewCode}/${req.to}`).get()).val());
      if (!subs.length) return;
      webpush.setVapidDetails("mailto:noreply@mount-rushmore.invalid", VAPID_PUBLIC, VAPID_PRIVATE.value());
      const payload = JSON.stringify({ ...tmpl(name), url: `${SITE}?g=${crewCode}`, tag: `${crewCode}-${req.kind}` });
      await Promise.all(subs.map(async ({ path, sub }) => {
        try { await webpush.sendNotification(sub, payload, { TTL: 3600, urgency: "high" }); }
        catch (e) {
          // Gone, rejected or malformed subscriptions never recover: drop them. Server-side hiccups (5xx, 429) are kept.
          const code = e && e.statusCode;
          console.warn("push failed", round, req.to, code || (e && e.message));
          if (!code || [400, 401, 403, 404, 410, 413].includes(code)) await db.ref(`pushSubs/${crewCode}/${req.to}/${path}`).remove();
        }
      }));
    } catch (e) {
      console.error("sendTurnAlert", e);
    }
  }
);

exports.checkSoloPost = onValueCreated(
  { ref: "/solo/{day}/{uid}", ...DB, maxInstances: 5 },
  async (event) => {
    const day = Number(event.params.day), v = event.data.val() || {};
    const reject = async (why) => { console.warn("solo post removed", day, event.params.uid, why); await event.data.ref.remove(); };
    try {
      const today = game.dayNumber(new Date(typeof v.ts === "number" ? v.ts : Date.now()));
      if (!(day === today || day === today - 1)) return reject("wrong day");   // yesterday allowed: a game locked just before midnight
      const labels = [0, 1, 2, 3].map(i => v.picks && v.picks[i]);
      if (labels.some(l => typeof l !== "string" || !game.key(l))) return reject("bad picks");
      const t = game.topicForDay(day);
      const faces = labels.map(l => { const m = game.matchEntry(t, l); return { label: m ? m.label : l, rank: m ? m.rank : null }; });
      if (new Set(faces.map(f => f.rank ? "E" + f.rank : "W" + game.key(f.label))).size !== 4) return reject("duplicate picks");
      if (game.scoreFaces(faces).total !== v.score) return reject("score mismatch");
      await admin.database().ref(`soloCount/${day}`).transaction(c => (Number(c) || 0) + 1);
    } catch (e) {
      console.error("checkSoloPost", e);
    }
  }
);
