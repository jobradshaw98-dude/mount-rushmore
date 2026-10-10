// Network first, so players always get the latest game; the cached copy only opens the app offline.
const CACHE = "rushmore-shell-v5";
const SHELL = ["./", "./index.html", "./game.js", "./manifest.webmanifest", "./icons/icon-192.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Cache one copy per file (ignoring ?g=... and other query strings) so the cache never grows per crew link.
const bare = req => { const u = new URL(req.url); u.search = ""; return u.toString(); };
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;   // Firebase, fonts, etc. go straight to the network
  // Always ask the server (skip the browser cache) so a new deploy shows up on the next open; after 5s on a
  // bad connection, open the saved copy instead of waiting.
  const net = fetch(req, {cache: "no-store"}).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(bare(req), copy)); }
    return res;
  });
  const saved = () => caches.match(bare(req)).then(r => r || (req.mode === "navigate" ? caches.match("./index.html") : undefined));
  e.respondWith(Promise.race([net, new Promise((_, no) => setTimeout(() => no(new Error("slow")), 5000))])
    .catch(() => saved().then(r => r || net)));
});

// "Your turn" alerts.
self.addEventListener("push", e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch {}
  e.waitUntil(self.registration.showNotification(d.title || "Mount Rushmore", {
    body: d.body || "Something happened in your crew.", tag: d.tag, renotify: true,
    icon: "icons/icon-192.png", badge: "icons/icon-192.png", data: { url: d.url || "./" }
  }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "./";
  e.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    for (const c of list) if ("focus" in c) { c.navigate(url).catch(()=>{}); return c.focus(); }
    return clients.openWindow(url);
  }));
});
