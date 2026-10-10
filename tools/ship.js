/* Ships topic changes made under research/: builds the lists into game.js, proves no played day changed,
   commits, pushes the page and deploys the server function that re-scores leaderboard posts (always together:
   a page and server on different lists reject each other's scores), then checks the live site.
   Run: node tools/ship.js "<commit message>"   (add --dry to stop before the commit) */
"use strict";
const { execSync } = require("child_process"), fs = require("fs"), os = require("os"), path = require("path");
const root = path.join(__dirname, "..");
const msg = process.argv.slice(2).filter(a => a !== "--dry").join(" ");
const dry = process.argv.includes("--dry");
if (!msg && !dry) { console.error('usage: node tools/ship.js "<commit message>" [--dry]'); process.exit(2); }
const env = { ...process.env, MSYS_NO_PATHCONV: "1" };
const run = (cmd, opts = {}) => execSync(cmd, { cwd: root, stdio: ["ignore", "pipe", "pipe"], encoding: "utf8", env, ...opts });
const step = s => console.log("== " + s);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "mr-ship-"));

step("snapshot the live game.js (what is pushed, not a local commit that may never have gone out)");
run("git fetch -q");
fs.writeFileSync(path.join(tmp, "old.js"), run("git show @{u}:game.js"));
step("build lists");
console.log(run("node tools/build-lists.js").trim());
step("collect real crew codes");
let crews = [];
try { crews = Object.keys(JSON.parse(run('npx firebase-tools database:get /rounds --shallow', { stdio: ["ignore", "pipe", "ignore"] })) || {}).map(k => k.split("-")[0]); }
catch (e) { console.log("could not read crews (" + e.message.split("\n")[0] + "); random crews only"); }
fs.writeFileSync(path.join(tmp, "crews.json"), JSON.stringify([...new Set(crews)]));
step("history check");
console.log(run(`node tools/check-history.js "${path.join(tmp, "old.js")}" "${path.join(tmp, "crews.json")}"`).trim());
step("page smoke test");
const g = require(path.join(root, "game.js"));
for (let d = 1; d <= g.dayNumber() + 60; d++) { const t = g.topicForDay(d); if (!t || t.entries.length !== 24) throw new Error(`day ${d}: bad topic`); }
const oldIds = new Set(require(path.join(tmp, "old.js")).ALL_TOPICS.map(t => t.id));
const newIds = g.ALL_TOPICS.map(t => t.id).filter(id => !oldIds.has(id));
console.log("ok; topic ids new in this ship: " + (newIds.join(", ") || "none"));
if (dry) { console.log("dry run: stopping before commit"); process.exit(0); }
if (!run("git status --porcelain -- game.js research").trim() && !run("git log @{u}..HEAD --oneline").trim()) { console.log("nothing changed; nothing to ship"); process.exit(0); }
step("commit + push");
run("git add game.js research tools");
run(`git commit -q -F -`, { input: msg + "\n", stdio: ["pipe", "pipe", "pipe"] });
run("git push -q origin HEAD");
const sha = run("git rev-parse --short HEAD").trim();
console.log("pushed " + sha);
step("deploy server function");
console.log(run("npx firebase-tools deploy --only functions --force", { timeout: 600000 }).split("\n").filter(l => /Deploy complete|Error|error/.test(l)).join("\n"));
step("live check");
const want = fs.readFileSync(path.join(root, "game.js"), "utf8");
let live = "";
for (let i = 0; i < 20; i++) {
  try { live = run(`curl -s -H "Cache-Control: no-cache" "https://jobradshaw98-dude.github.io/mount-rushmore/game.js?v=${Date.now()}"`); } catch { live = ""; }
  if (live.replace(/\r/g, "") === want.replace(/\r/g, "")) break;
  execSync(process.platform === "win32" ? "ping -n 31 127.0.0.1 >NUL" : "sleep 30", { stdio: "ignore", shell: true });
}
if (live.replace(/\r/g, "") !== want.replace(/\r/g, "")) { console.error("LIVE CHECK FAILED: the site's game.js does not match after 10 minutes"); process.exit(1); }
console.log(`live: site serves ${sha}`);
