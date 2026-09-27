// Sends "your turn" alerts. A phone that just made a move writes a small request to notify/<round>/<id>;
// this function looks up who it's for, sends a web push to each of their saved devices, then deletes the request.
const { onValueCreated } = require("firebase-functions/v2/database");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const webpush = require("web-push");

admin.initializeApp();
const VAPID_PRIVATE = defineSecret("VAPID_PRIVATE");
const VAPID_PUBLIC = "BHLLp75RQ05Qp2yJO7Sfve9xQatx2aE_FyQ7pYY_qwEEuGts7jPPK15ZtMDyTOMjN7jUjDvZoB4CIUScDM8tdvo";
const SITE = "https://jobradshaw98-dude.github.io/mount-rushmore/";

const TEMPLATES = {
  turn:  (crew) => ({ title: "You're on the clock", body: `Your pick in ${crew}. Don't keep them waiting.` }),
  order: (crew) => ({ title: "Draft's done", body: `Lock in your mountain in ${crew} to see the scores.` }),
  bonus: (crew) => ({ title: "Bonus round", body: `A new round just opened in ${crew}. Come draft.` }),
};

exports.sendTurnAlert = onValueCreated(
  { ref: "/notify/{round}/{id}", region: "us-central1", instance: "mount-rushmore-daily-f6451-default-rtdb", secrets: [VAPID_PRIVATE], maxInstances: 5 },
  async (event) => {
    const req = event.data.val() || {};
    const round = event.params.round;              // CREW-day-n
    const crewCode = round.split("-")[0];
    await event.data.ref.remove();                 // requests are one-shot
    const tmpl = TEMPLATES[req.kind];
    if (!tmpl || typeof req.to !== "string") return;

    const db = admin.database();
    // Rate limit: one alert per player per kind per 60s.
    const gate = db.ref(`notifyGate/${crewCode}/${req.to}/${req.kind}`);
    const now = Date.now();
    const tx = await gate.transaction(last => (last && now - last < 60000) ? undefined : now);
    if (!tx.committed) return;

    const name = (await db.ref(`crews/${crewCode}/name`).get()).val() || `crew ${crewCode}`;
    const subsSnap = await db.ref(`pushSubs/${crewCode}/${req.to}`).get();
    const subs = subsSnap.val() || {};
    webpush.setVapidDetails("mailto:noreply@mount-rushmore.invalid", VAPID_PUBLIC, VAPID_PRIVATE.value());
    const payload = JSON.stringify({ ...tmpl(name), url: `${SITE}?g=${crewCode}`, tag: `${crewCode}-${req.kind}` });
    await Promise.all(Object.entries(subs).map(async ([id, sub]) => {
      try { await webpush.sendNotification(sub, payload, { TTL: 3600, urgency: "high" }); }
      catch (e) { if (e.statusCode === 404 || e.statusCode === 410) await db.ref(`pushSubs/${crewCode}/${req.to}/${id}`).remove(); }
    }));
  }
);
