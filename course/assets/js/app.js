/* Site shell: storage, theme, top bar, sidebar, lesson nav, progress, math, offline. */
(function () {
  var LC = window.LC = window.LC || {};
  var root = document.documentElement.getAttribute("data-root") || "./";
  var lessonId = document.documentElement.getAttribute("data-lesson");
  LC.root = root;
  LC.lessonId = lessonId;

  /* ---------- storage (never throws; works without it) ---------- */
  var PREFIX = "llmc:v1:";
  LC.store = {
    get: function (k, fallback) {
      try { var v = localStorage.getItem(PREFIX + k); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
    },
    set: function (k, v) { try { localStorage.setItem(PREFIX + k, JSON.stringify(v)); } catch (e) {} }
  };
  LC.progress = function () { return LC.store.get("progress", {}); };
  LC.markProgress = function (id, patch) {
    var p = LC.progress(); p[id] = Object.assign(p[id] || {}, patch); LC.store.set("progress", p); return p[id];
  };
  LC.isDone = function (id) { var p = LC.progress()[id]; return !!(p && p.done); };

  /* ---------- icons ---------- */
  var I = LC.icons = {
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/></svg>',
    review: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 8v4l3 2"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5-11-6.5Z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
    replay: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>',
    chev: '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2Z"/></svg>',
    brain: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1V5a2 2 0 0 0-3-1Z"/><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 1"/></svg>',
    code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>',
    pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></svg>'
  };
  var MARK = '<svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="var(--ink)"/><circle cx="9" cy="16" r="3" fill="var(--a-orange)"/><circle cx="23" cy="9" r="2.5" fill="var(--bg)"/><circle cx="23" cy="23" r="2.5" fill="var(--bg)"/><path d="M11.5 15 20.5 10M11.5 17l9 5" stroke="var(--bg)" stroke-width="1.8" stroke-linecap="round"/></svg>';

  function el(html) { var t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; }
  LC.el = el;
  LC.escape = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };

  /* ---------- theme ---------- */
  function currentTheme() {
    var t = document.documentElement.getAttribute("data-theme");
    if (t) return t;
    return window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function setThemeIcon(btn) {
    var dark = currentTheme() === "dark";
    btn.innerHTML = dark ? I.sun : I.moon;
    btn.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
  }

  /* ---------- toast ---------- */
  var toastEl;
  LC.toast = function (msg) {
    if (!toastEl) { toastEl = el('<div class="toast" role="status" aria-live="polite"></div>'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add("show");
    clearTimeout(LC._tt); LC._tt = setTimeout(function () { toastEl.classList.remove("show"); }, 2600);
  };

  LC.lessonHref = function (id) { return root + "lessons/" + id + ".html"; };

  /* ---------- due count (cards live in learn.js, but the badge is global) ---------- */
  LC.dueCount = function () {
    var cards = LC.store.get("cards", {}), now = Date.now(), n = 0;
    Object.keys(cards).forEach(function (k) { if (cards[k].due <= now) n++; });
    return n;
  };
  LC.refreshBadge = function () {
    var b = document.getElementById("due-badge"); if (!b) return;
    var n = LC.dueCount(); b.textContent = n; b.hidden = n === 0;
    b.setAttribute("aria-label", n + " cards due");
  };

  /* ---------- shell ---------- */
  function buildTopbar() {
    var page = document.documentElement.getAttribute("data-page");
    var bar = el(
      '<header class="topbar">' +
        '<button class="btn btn-ghost icon-btn menu-btn" type="button" aria-label="Open lesson list" aria-expanded="false" aria-controls="sidebar">' + I.menu + '</button>' +
        '<a class="brand" href="' + root + 'index.html">' + MARK + '<span>LLMs<span class="brand-name-long"> From Basics</span></span></a>' +
        '<nav class="topnav" aria-label="Main">' +
          '<a class="navlink" href="' + root + 'index.html#map"' + (page === "home" ? ' aria-current="page"' : "") + '>' + I.map + '<span class="lbl">Course map</span></a>' +
          '<a class="navlink" href="' + root + 'whats-new.html"' + (page === "new" ? ' aria-current="page"' : "") + '>' + I.spark + '<span class="lbl">What\'s new</span></a>' +
          '<a class="navlink" href="' + root + 'review.html"' + (page === "review" ? ' aria-current="page"' : "") + '>' + I.review + '<span class="lbl">Review</span> <span class="badge" id="due-badge" hidden>0</span></a>' +
          '<button class="btn btn-ghost icon-btn theme-btn" type="button"></button>' +
        '</nav>' +
        '<div class="progress-rail" aria-hidden="true"><span></span></div>' +
      '</header>');
    document.body.insertBefore(bar, document.body.firstChild);
    document.body.insertBefore(el('<a class="skip-link" href="#main">Skip to content</a>'), bar);

    var tbtn = bar.querySelector(".theme-btn");
    setThemeIcon(tbtn);
    tbtn.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      LC.store.set("theme", next);
      setThemeIcon(tbtn);
      document.dispatchEvent(new CustomEvent("lc:theme"));
    });

    var menuBtn = bar.querySelector(".menu-btn");
    var side = document.getElementById("sidebar");
    if (!side) { menuBtn.remove(); return; }
    var scrim = el('<div class="scrim" hidden></div>');
    document.body.appendChild(scrim);
    function close() { side.classList.remove("open"); scrim.hidden = true; menuBtn.setAttribute("aria-expanded", "false"); }
    menuBtn.addEventListener("click", function () {
      var open = !side.classList.contains("open");
      side.classList.toggle("open", open); scrim.hidden = !open; menuBtn.setAttribute("aria-expanded", String(open));
      if (open) { var cur = side.querySelector('[aria-current="page"]') || side.querySelector("a"); if (cur) cur.focus(); }
    });
    scrim.addEventListener("click", close);
    side.addEventListener("keydown", function (e) { if (e.key === "Escape") { close(); menuBtn.focus(); } });
  }

  function lessonListHTML(mid, opts) {
    var m = LC.course.modules[mid];
    var html = '<ul class="side-list">';
    m.lessons.forEach(function (l) {
      var done = LC.isDone(l.id);
      var dot = '<span class="dot' + (done ? " done" : l.ready ? " ready" : "") + '" aria-hidden="true"></span>';
      if (l.ready) {
        html += '<li><a href="' + LC.lessonHref(l.id) + '"' + (l.id === lessonId ? ' aria-current="page"' : "") + '>' + dot +
          '<span>' + LC.escape(l.title) + (done ? '<span class="visually-hidden"> (completed)</span>' : "") + '</span>' +
          (opts && opts.tags ? '<span class="ready-tag">' + l.mins + ' min</span>' : "") + '</a></li>';
      } else {
        html += '<li><span class="soon">' + dot + '<span>' + LC.escape(l.title) + '</span>' + (opts && opts.tags ? '<span class="soon-tag">Soon</span>' : "") + '</span></li>';
      }
    });
    return html + "</ul>";
  }
  LC.lessonListHTML = lessonListHTML;

  function buildSidebar() {
    var side = document.getElementById("sidebar"); if (!side) return;
    var html = "";
    LC.course.tracks.forEach(function (t) {
      t.modules.forEach(function (mid) {
        var m = LC.course.modules[mid];
        html += '<p class="side-title">' + LC.escape(m.code + " · " + m.title) + "</p>" + lessonListHTML(mid);
      });
    });
    side.innerHTML = html;
  }

  function buildLessonNav() {
    if (!lessonId) return;
    var all = LC.allLessons();
    var idx = all.findIndex(function (l) { return l.id === lessonId; });
    if (idx < 0) return;
    var prev = null, next = null, i;
    for (i = idx - 1; i >= 0; i--) if (all[i].ready) { prev = all[i]; break; }
    for (i = idx + 1; i < all.length; i++) if (all[i].ready) { next = all[i]; break; }
    var main = document.getElementById("main");
    var nav = el('<nav class="lesson-nav" aria-label="Lesson navigation"></nav>');
    nav.appendChild(prev ? el('<a href="' + LC.lessonHref(prev.id) + '"><span class="dir">← Previous</span><span class="ttl">' + LC.escape(prev.title) + "</span></a>") : el("<span></span>"));
    nav.appendChild(next ? el('<a class="next" href="' + LC.lessonHref(next.id) + '"><span class="dir">Next →</span><span class="ttl">' + LC.escape(next.title) + "</span></a>") :
      el('<a class="next" href="' + root + 'index.html#map"><span class="dir">Next →</span><span class="ttl">Back to the course map</span></a>'));
    main.appendChild(nav);

    var bb = el('<div class="bottombar"></div>');
    bb.appendChild(prev ? el('<a class="btn" href="' + LC.lessonHref(prev.id) + '" aria-label="Previous lesson: ' + LC.escape(prev.title) + '">' + I.prev + "Prev</a>") : el('<span class="btn" aria-hidden="true" style="visibility:hidden"></span>'));
    bb.appendChild(el('<a class="btn" href="' + root + 'review.html">' + I.review + "Review</a>"));
    bb.appendChild(next ? el('<a class="btn btn-primary" href="' + LC.lessonHref(next.id) + '" aria-label="Next lesson: ' + LC.escape(next.title) + '">Next' + I.next + "</a>") : el('<a class="btn btn-primary" href="' + root + 'index.html#map">Map</a>'));
    document.body.appendChild(bb);

    // Lesson header meta
    var cur = all[idx];
    var kicker = document.querySelector("[data-kicker]");
    if (kicker) kicker.textContent = cur.moduleCode + " · " + cur.moduleTitle;
    var mins = document.querySelector("[data-mins]");
    if (mins) mins.innerHTML = I.clock + cur.mins + " min";
    var rv = (cur.reviewed || LC.config.reviewed || "").split("-");
    if (mins && rv.length === 2) {
      var month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][+rv[1] - 1];
      mins.parentNode.appendChild(el('<span title="When this lesson was last checked against current research">Reviewed ' + month + " " + rv[0] + "</span>"));
    }
    LC.markProgress(lessonId, { visited: Date.now() });
  }

  function buildFooter() {
    document.body.appendChild(el('<footer class="site-foot"><p>LLMs From Basics · Progress and review cards are saved only in this browser. ' +
      '<a href="' + root + 'index.html#science">How this course is designed</a></p></footer>'));
  }

  function readingProgress() {
    var bar = document.querySelector(".progress-rail > span"); if (!bar || !lessonId) return;
    var ticking = false;
    function upd() {
      var h = document.documentElement.scrollHeight - innerHeight;
      bar.style.width = (h > 0 ? Math.min(100, (scrollY / h) * 100) : 0) + "%"; ticking = false;
    }
    addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }

  LC.renderMath = function (node) {
    if (window.renderMathInElement) {
      renderMathInElement(node || document.body, {
        delimiters: [{ left: "$$", right: "$$", display: true }, { left: "\\(", right: "\\)", display: false }, { left: "$", right: "$", display: false }],
        throwOnError: false, ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code", "svg"]
      });
    }
  };

  function registerSW() {
    if ("serviceWorker" in navigator && location.protocol === "https:") {
      navigator.serviceWorker.register(root + "sw.js").catch(function () {});
    }
  }

  /* Lessons link forward to lessons that may not be written yet. Instead of a 404,
     show those links as plain text marked "coming soon". */
  function markUnwrittenLinks() {
    var ready = {};
    LC.allLessons().forEach(function (l) { ready[l.id] = !!l.ready; });
    document.querySelectorAll("main a[href]").forEach(function (a) {
      var m = a.getAttribute("href").match(/(?:^|\/)([a-z0-9]+-\d+)\.html(?:#.*)?$/);
      if (!m || !(m[1] in ready) || ready[m[1]]) return;
      var s = document.createElement("span");
      s.className = "soon-link";
      s.title = "Coming soon";
      s.innerHTML = a.innerHTML;
      s.appendChild(el('<span class="soon-mark"> (coming soon)</span>'));
      a.replaceWith(s);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    markUnwrittenLinks();
    buildTopbar();
    buildSidebar();
    buildLessonNav();
    buildFooter();
    readingProgress();
    LC.renderMath();
    LC.refreshBadge();
    registerSW();
    document.dispatchEvent(new CustomEvent("lc:ready"));
  });
})();
