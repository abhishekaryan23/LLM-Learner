/* Offline support: pages are network-first (fresh when online, cached when not);
   static assets are stale-while-revalidate. Bump VERSION to drop old caches entirely. */
var VERSION = "llmc-v6";
var CORE = [
  "./", "./index.html", "./review.html", "./manifest.webmanifest",
  "./assets/css/main.css", "./assets/js/course-data.js", "./assets/js/app.js", "./assets/js/learn.js",
  "./assets/js/stepper.js", "./assets/js/review.js", "./assets/js/home.js",
  "./assets/vendor/gsap.min.js", "./assets/vendor/katex/katex.min.js", "./assets/vendor/katex/katex.min.css",
  "./assets/vendor/katex/auto-render.min.js", "./assets/icons/icon.svg"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  var isPage = req.mode === "navigate" || (req.headers.get("accept") || "").indexOf("text/html") >= 0;
  if (isPage) {
    e.respondWith(fetch(req).then(function (res) {
      var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); return res;
    }).catch(function () { return caches.match(req).then(function (r) { return r || caches.match("./index.html"); }); }));
  } else {
    // stale-while-revalidate: instant from cache, refreshed in the background for next time
    e.respondWith(caches.match(req).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res.ok) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); }
        return res;
      });
      if (hit) { net.catch(function () {}); return hit; }
      return net;
    }));
  }
});
