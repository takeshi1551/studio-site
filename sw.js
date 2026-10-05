// Service worker: сайт открывается и без интернета.
// После правки config.js, картинок или стилей увеличьте число в VERSION,
// чтобы у посетителей обновилась сохранённая копия.
const VERSION = "3";
const CACHE = "studio-" + VERSION;
const SHELL = [
  "./", "index.html", "styles.css", "config.js", "app.js", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png",
  "images/hero.jpg", "images/before.jpg", "images/after.jpg", "images/work-1.jpg", "images/work-2.jpg", "images/work-3.jpg", "images/work-4.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("studio-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Открытие страницы: сначала сеть, без сети берём сохранённую копию
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("index.html").then((r) => r || caches.match("./")))
    );
    return;
  }

  // Остальное: быстро из памяти и тихо обновляем
  event.respondWith(
    caches.match(req).then((cached) => {
      const fresh = fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || fresh;
    })
  );
});
