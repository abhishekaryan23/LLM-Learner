/* P5.1 playground: forward-noise a 2D point cloud, x_t = √ᾱ_t · x_0 + √(1 − ᾱ_t) · ε.
   Each point keeps its own ε (resample with a button), so dragging t morphs the shape smoothly.
   The shapes are scaled so each coordinate has mean 0 and variance 1; the process is variance-preserving,
   so the measured variance stays ≈ 1 at every t. Schedules: cosine (Nichol & Dhariwal, 2021, s = 0.008)
   and DDPM's linear β from 1e-4 to 0.02 over T = 1000 steps (Ho et al., 2020). */
(function () {
  var LC = window.LC;
  var T = 1000, NP = 400;
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(r) { var u1 = 1 - r(), u2 = r(); return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2); }

  // schedules: ᾱ_t for t = 0..T
  var AB = { cosine: [], linear: [] };
  (function () {
    var s = 0.008, f0 = Math.pow(Math.cos((s / (1 + s)) * Math.PI / 2), 2);
    for (var t = 0; t <= T; t++) AB.cosine.push(Math.max(0, Math.pow(Math.cos(((t / T + s) / (1 + s)) * Math.PI / 2), 2) / f0));
    var a = 1; AB.linear.push(1);
    for (var k = 1; k <= T; k++) { a *= 1 - (1e-4 + (0.02 - 1e-4) * (k - 1) / (T - 1)); AB.linear.push(a); }
  })();

  function normalize(pts) {
    var mx = 0, my = 0;
    pts.forEach(function (p) { mx += p[0]; my += p[1]; });
    mx /= pts.length; my /= pts.length;
    var vx = 0, vy = 0;
    pts.forEach(function (p) { vx += (p[0] - mx) * (p[0] - mx); vy += (p[1] - my) * (p[1] - my); });
    var sx = Math.sqrt(vx / pts.length), sy = Math.sqrt(vy / pts.length);
    return pts.map(function (p) { return [(p[0] - mx) / sx, (p[1] - my) / sy]; });
  }
  function spiral() {
    var r = rng(11), pts = [];
    for (var i = 0; i < NP; i++) {
      var th = 0.6 * Math.PI + 3.4 * Math.PI * (i / NP), rad = th;
      pts.push([rad * Math.cos(th) + 0.25 * gauss(r), rad * Math.sin(th) + 0.25 * gauss(r)]);
    }
    return normalize(pts);
  }
  function smiley() {
    var r = rng(12), pts = [];
    for (var i = 0; i < NP; i++) {
      var u = i / NP, p;
      if (u < 0.55) { var a = 2 * Math.PI * (u / 0.55); p = [3 * Math.cos(a), 3 * Math.sin(a)]; }                        // face
      else if (u < 0.65) p = [-1.1 + 0.18 * gauss(r), 1.0 + 0.25 * gauss(r)];                                            // left eye
      else if (u < 0.75) p = [1.1 + 0.18 * gauss(r), 1.0 + 0.25 * gauss(r)];                                             // right eye
      else { var b = Math.PI * (1.2 + 0.6 * ((u - 0.75) / 0.25)); p = [1.8 * Math.cos(b), -0.2 + 1.8 * Math.sin(b)]; }  // smile
      pts.push([p[0] + 0.06 * gauss(r), p[1] + 0.06 * gauss(r)]);
    }
    return normalize(pts);
  }
  var SHAPES = { spiral: spiral(), smiley: smiley() };

  function init(root) {
    var stageBox = root.querySelector(".pg-stage");
    var slider = root.querySelector("input[type=range]");
    var out = root.querySelector("output");
    var readout = root.querySelector(".pg-readout");
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var shape = "spiral", sched = "cosine", seed = 1, eps = [], layout = null, raf = null;
    var svg, circles = [], bars = [], hx, hy, HB = 0.5, HX0 = -4, HN = 16, hBase, sxp, syp;

    function newEps() {
      var r = rng(100 + seed); eps = [];
      for (var i = 0; i < NP; i++) eps.push([gauss(r), gauss(r)]);
    }

    function build() {
      layout = stageBox.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact", S = LC.svg;
      var W = compact ? 360 : 640, H = compact ? 456 : 340;
      // point-cloud panel (square) and histogram panel
      var P = compact ? { x: 40, y: 8, s: 280 } : { x: 14, y: 14, s: 312 };
      var Hp = compact ? { x: 24, y: 340, w: 320, h: 92, ty: 322 } : { x: 360, y: 92, w: 264, h: 200, ty: 70 };
      var R = 3.2;   // plotted range: ±R in data units
      sxp = function (v) { return P.x + (v + R) / (2 * R) * P.s; };
      syp = function (v) { return P.y + (R - v) / (2 * R) * P.s; };
      if (svg) svg.remove();
      svg = S("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "A point cloud being mixed with Gaussian noise, and a histogram of its first coordinate compared with the standard normal curve. The readout below gives the current numbers." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "420px";
      stageBox.appendChild(svg);
      var id = "p51clip" + Math.random().toString(36).slice(2, 8);
      var cp = S("clipPath", { id: id }, S("defs", {}, svg));
      S("rect", { x: P.x, y: P.y, width: P.s, height: P.s }, cp);
      S("rect", { x: P.x, y: P.y, width: P.s, height: P.s, rx: 6, class: "f-surface2", "fill-opacity": 0.5 }, svg);
      S("line", { x1: sxp(0), x2: sxp(0), y1: P.y, y2: P.y + P.s, class: "s-grid" }, svg);
      S("line", { x1: P.x, x2: P.x + P.s, y1: syp(0), y2: syp(0), class: "s-grid" }, svg);
      [1, 2].forEach(function (k) {
        S("circle", { cx: sxp(0), cy: syp(0), r: (k / (2 * R)) * P.s, class: "s-faint", "stroke-dasharray": "4 5", "stroke-width": 1.5, fill: "none" }, svg);
      });
      var g = S("g", { "clip-path": "url(#" + id + ")" }, svg);
      circles = [];
      for (var i = 0; i < NP; i++) circles.push(S("circle", { r: compact ? 2.4 : 2.6, class: "f-blue", "fill-opacity": 0.75 }, g));

      // histogram of the first coordinate vs N(0, 1)
      hx = function (v) { return Hp.x + (v - HX0) / (2 * -HX0) * Hp.w; };
      var YM = compact ? 0.5 : 0.6;
      hy = function (d) { return Hp.y + Hp.h - Math.min(d, YM) / YM * Hp.h; };
      hBase = Hp.y + Hp.h;
      S("text", { x: compact ? Hp.x : Hp.x, y: Hp.ty, class: "t t-sm t-muted", text: compact ? "histogram of x₁ · curve = N(0, 1)" : "histogram of x₁" }, svg);
      if (!compact) S("text", { x: Hp.x, y: Hp.ty + 18, class: "t t-sm t-blue", text: "curve = N(0, 1)" }, svg);
      bars = [];
      for (var b = 0; b < HN; b++) bars.push(S("rect", { x: hx(HX0 + b * HB) + 0.5, width: hx(HB) - hx(0) - 1, y: hBase, height: 0, class: "f-faint" }, svg));
      S("path", { d: LC.fnPath(function (x) { return Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI); }, HX0, -HX0, hx, hy, 80), class: "s-blue", "stroke-width": 2 }, svg);
      S("line", { x1: Hp.x, x2: Hp.x + Hp.w, y1: hBase, y2: hBase, class: "s-axis" }, svg);
      [-2, 0, 2].forEach(function (v) { S("text", { x: hx(v), y: hBase + 15, class: "t t-sm t-muted t-mid", text: v < 0 ? "−" + (-v) : String(v) }, svg); });
      draw();
    }

    function draw() {
      var t = +slider.value, ab = AB[sched][t], a = Math.sqrt(ab), s = Math.sqrt(1 - ab), x0 = SHAPES[shape];
      var counts = new Array(HN).fill(0), m1 = 0, m2 = 0;
      for (var i = 0; i < NP; i++) {
        var px = a * x0[i][0] + s * eps[i][0], py = a * x0[i][1] + s * eps[i][1];
        circles[i].setAttribute("cx", sxp(px).toFixed(1)); circles[i].setAttribute("cy", syp(py).toFixed(1));
        var k = Math.floor((px - HX0) / HB); if (k >= 0 && k < HN) counts[k]++;
        m1 += px + py; m2 += px * px + py * py;
      }
      bars.forEach(function (r, k) { var y = hy(counts[k] / (NP * HB)); r.setAttribute("y", y.toFixed(1)); r.setAttribute("height", (hBase - y).toFixed(1)); });
      var n = 2 * NP, variance = m2 / n - (m1 / n) * (m1 / n);
      out.textContent = t;
      var snr = ab >= 1 ? "∞" : ab / (1 - ab) >= 100 ? (ab / (1 - ab)).toFixed(0) : (ab / (1 - ab) < 0.001 ? (ab / (1 - ab)).toExponential(1) : (ab / (1 - ab)).toFixed(ab / (1 - ab) < 0.01 ? 4 : 2));
      readout.textContent = "ᾱ = " + (ab > 0 && ab < 0.001 ? ab.toExponential(1) : ab.toFixed(3)) + " · signal ×" + a.toFixed(2) + " · noise ×" + s.toFixed(2) +
        " · SNR = " + snr + " · variance of points = " + variance.toFixed(2);
    }

    function stopPlay() { if (raf) cancelAnimationFrame(raf); raf = null; }
    function play() {
      stopPlay();
      if (reduce) { slider.value = T; draw(); return; }
      var start = null, from = +slider.value >= T ? 0 : +slider.value;
      (function frame(ts) {
        if (start == null) start = ts;
        var v = Math.min(T, from + (ts - start) / 3.5);   // ~3.5 s for the full range
        slider.value = Math.round(v / 10) * 10; draw();
        if (v < T) raf = requestAnimationFrame(frame); else raf = null;
      })(performance.now());
    }

    slider.addEventListener("input", function () { stopPlay(); draw(); });
    root.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.shape) {
        shape = b.dataset.shape;
        root.querySelectorAll("[data-shape]").forEach(function (c) { c.setAttribute("aria-pressed", String(c === b)); });
        draw();
      } else if (b.dataset.sched) {
        sched = b.dataset.sched;
        root.querySelectorAll("[data-sched]").forEach(function (c) { c.setAttribute("aria-pressed", String(c === b)); });
        draw();
      } else if (b.dataset.act === "play") play();
      else if (b.dataset.act === "resample") { seed++; newEps(); draw(); }
      else if (b.dataset.act === "reset") { stopPlay(); slider.value = 0; draw(); }
    });

    newEps();
    build();
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        var want = stageBox.clientWidth < 560 ? "compact" : "wide";
        if (want !== layout) build();
      }).observe(stageBox);
    }
  }

  document.addEventListener("lc:ready", function () {
    var root = document.getElementById("p5-1-noise-playground");
    if (root) init(root);
  });
})();
