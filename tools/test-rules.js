// Rules tests for /catalog against the local database emulator. Run: npm run test:rules (needs Java).
const { initializeTestEnvironment, assertSucceeds, assertFails } = require("@firebase/rules-unit-testing");
const { ref, set, update, get, remove } = require("firebase/database");
const fs = require("fs");
const path = require("path");
const RULES = process.env.RULES || path.join(__dirname, "..", "database.rules.json");
const CATALOG_URL = "https://mount-rushmore-daily-f6451-default-rtdb.firebaseio.com/catalog.json";   // seeded from the live catalog
const E = 1790492400000, today = Math.floor((Date.now() - E) / 864e5) + 1;
const list = (base, from) => ({ base, from, items: Array.from({ length: 24 }, (_, i) => "Item " + i).join("\n") });
const topic = (from, extra = {}) => ({ name: "Test Topic", cat: "brands", from, seq: 1000, ...extra });
let pass = 0, fail = 0;
async function t(name, p, want) {
  try { await (want ? assertSucceeds(p) : assertFails(p)); pass++; console.log("ok   ", name); }
  catch (e) { fail++; console.log("FAIL ", name, "-", e.message.split("\n")[0]); }
}
(async () => {
  const env = await initializeTestEnvironment({ projectId: "demo-rushmore", database: { rules: fs.readFileSync(RULES, "utf8"), host: "127.0.0.1", port: 9000 } });
  const live = process.env.CATALOG ? JSON.parse(fs.readFileSync(process.env.CATALOG, "utf8")) : await (await fetch(CATALOG_URL)).json();
  await env.withSecurityRulesDisabled(c => set(ref(c.database(), "catalog"), live));
  const pub = env.authenticatedContext("catalog-publisher").database();
  const anon = env.unauthenticatedContext().database();
  const user = env.authenticatedContext("someplayer").database();
  const F = today + 2;
  console.log("today is day", today, "-> earliest allowed from", F);
  await t("anyone can read the catalog", get(ref(anon, "catalog/topics/nba")), true);
  await t("publisher adds a new topic + its list together, from today+2", update(ref(pub, "catalog"), { "topics/zza": topic(F), "lists/zza": list("zza", F) }), true);
  await t("publisher adds a re-rank version of an existing topic", set(ref(pub, "catalog/lists/nba_r" + F), list("nba", F)), true);
  await t("DENY: topic starting tomorrow (may already be played)", update(ref(pub, "catalog"), { "topics/zzb": topic(today + 1), "lists/zzb": list("zzb", today + 1) }), false);
  await t("DENY: re-rank starting today", set(ref(pub, "catalog/lists/nba_rx"), list("nba", today)), false);
  await t("DENY: editing a published list", set(ref(pub, "catalog/lists/nba_r/items"), "hacked"), false);
  await t("DENY: replacing a published list", set(ref(pub, "catalog/lists/nba_r"), list("nba", F + 5)), false);
  await t("DENY: deleting a published topic", remove(ref(pub, "catalog/topics/nba")), false);
  await t("DENY: topic without its list", set(ref(pub, "catalog/topics/zzc"), topic(F)), false);
  await t("DENY: list for a topic that does not exist", set(ref(pub, "catalog/lists/nope_r"), list("nope", F)), false);
  await t("DENY: topic with a bad category", update(ref(pub, "catalog"), { "topics/zzd": topic(F, { cat: "weird" }), "lists/zzd": list("zzd", F) }), false);
  await t("DENY: topic with an extra field", update(ref(pub, "catalog"), { "topics/zze": topic(F, { admin: true }), "lists/zze": list("zze", F) }), false);
  await t("DENY: a player adding a topic", update(ref(user, "catalog"), { "topics/zzf": topic(F), "lists/zzf": list("zzf", F) }), false);
  await t("DENY: anonymous adding a list", set(ref(anon, "catalog/lists/nba_rz"), list("nba", F)), false);
  await t("DENY: overwriting the whole catalog", set(ref(pub, "catalog"), {}), false);
  await env.cleanup();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
