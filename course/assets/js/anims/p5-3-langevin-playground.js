/* P5.3 playground: Langevin dynamics on a 1D two-bump density.
   Target p(x) = 0.3·N(−1.4, 0.6²) + 0.7·N(1.2, 0.8²). Update: x ← x + (η/2)·∇log p(x) + √η·z.
   500 particles start near x = −4. With noise, they flow into both bumps and the share right of the dip (x > −0.36)
   approaches ≈ 0.69 (0.7 + 0.0125 − 0.018). Without noise it is plain gradient ascent: everyone collapses onto the
   nearest peak, the left one. */
(function () {
  var LC = window.LC;
  var W_ = [0.3, 0.7], M_ = [-1.4, 1.2], S_ = [0.6, 0.8], NP = 500, DIP = -0.36, X0 = -5, X1 = 4, BW = 0.2;
  function comp(x, k) { var z = (x - M_[k]) / S_[k]; return W_[k] * Math.exp(-0.5 * z * z) / (S_[k] * Math.sqrt(2 * Math.PI)); }
  function p(x) { return comp(x, 0) + comp(x, 1); }
  function score(x) {
    var a = comp(x, 0), b = comp(x, 1), tot = a + b;
    if (tot < 1e-300) return x < 0 ? 10 : -10;   // far out in the tails: point back towards the data
    return (a * -(x - M_[0]) / (S_[0] * S_[0]) + b * -(x - M_[1]) / (S_[1] * S_[1])) / tot;
  }
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function init(root) {
    var stageBox = root.querySelector(".pg-stage");
    var slider = root.querySelector("input[type=range]");
    var out = root.querySelector("output");
    var readout = root.querySelector(".pg-readout");
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var xs = new Float64Array(NP), jit = new Float64Array(NP), r, steps = 0, noise = true, timer = null, layout = null;
    var svg, bars = [], dots = [], sx, sy, base, NB = Math.round((X1 - X0) / BW), YM;

    function gauss() { var u1 = 1 - r(), u2 = r(); return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2); }
    function reset() {
      stopRun(); r = rng(2024); steps = 0;
      for (var i = 0; i < NP; i++) { xs[i] = -4 + 0.3 * gauss(); jit[i] = r(); }
      draw();
    }

    function build() {
      layout = stageBox.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact", S = LC.svg;
      var W = compact ? 360 : 640, H = compact ? 268 : 280;
      var m = compact ? { l: 34, r: 12, t: 44, h: 140 } : { l: 44, r: 20, t: 44, h: 150 };
      YM = 0.8; base = m.t + m.h;
      sx = function (x) { return m.l + (x - X0) / (X1 - X0) * (W - m.l - m.r); };
      sy = function (v) { return base - Math.min(v, YM) / YM * m.h; };
      if (svg) svg.remove();
      svg = S("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "A two-bump target density, a histogram of 500 particles running Langevin dynamics, and the particles themselves as dots below the axis. The readout below gives the numbers." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "380px";
      stageBox.appendChild(svg);
      S("text", { x: 4, y: 16, class: "t t-sm t-muted", text: "↑ density" }, svg);
      S("text", { x: W - m.r, y: 16, class: "t t-sm t-blue t-end", text: compact ? "curve = target p(x)" : "curve = target p(x) · bars = particles" }, svg);
      if (compact) S("text", { x: W - m.r, y: 34, class: "t t-sm t-muted t-end", text: "bars = particles" }, svg);
      [0.2, 0.4, 0.6].forEach(function (v) { S("line", { x1: m.l, x2: W - m.r, y1: sy(v), y2: sy(v), class: "s-grid" }, svg); });
      [0, 0.4, 0.8].forEach(function (v) { S("text", { x: m.l - 5, y: sy(v) + 4, class: "t t-sm t-muted t-end", text: v ? v.toFixed(1) : "0" }, svg); });
      bars = [];
      for (var b = 0; b < NB; b++) bars.push(S("rect", { x: sx(X0 + b * BW) + 0.4, width: sx(BW) - sx(0) - 0.8, y: base, height: 0, class: "f-faint" }, svg));
      S("path", { d: LC.fnPath(p, X0, X1, sx, sy, 160), class: "s-blue", "stroke-width": 2.5 }, svg);
      S("line", { x1: sx(DIP), x2: sx(DIP), y1: sy(0.5), y2: base, class: "s-ink", "stroke-width": 1, "stroke-dasharray": "3 4", opacity: 0.6 }, svg);
      S("path", { d: "M" + m.l + " " + m.t + "V" + base + "H" + (W - m.r), class: "s-axis" }, svg);
      [-4, -2, 0, 2, 4].forEach(function (x) { S("text", { x: sx(x), y: base + 16, class: "t t-sm t-muted t-mid", text: x < 0 ? "−" + (-x) : String(x) }, svg); });
      var g = S("g", {}, svg); dots = [];
      for (var i = 0; i < NP; i++) dots.push(S("circle", { r: 1.8, class: "f-orange", "fill-opacity": 0.6 }, g));
      dots.top = base + 28; dots.h = H - base - 34;
      draw();
    }

    function draw() {
      var c = new Array(NB).fill(0), right = 0;
      for (var i = 0; i < NP; i++) {
        var k = Math.floor((xs[i] - X0) / BW); if (k >= 0 && k < NB) c[k]++;
        if (xs[i] > DIP) right++;
        var cx = sx(Math.max(X0, Math.min(X1, xs[i])));
        dots[i].setAttribute("cx", cx.toFixed(1)); dots[i].setAttribute("cy", (dots.top + jit[i] * dots.h).toFixed(1));
      }
      bars.forEach(function (rr, k) { var y = sy(c[k] / (NP * BW)); rr.setAttribute("y", y.toFixed(1)); rr.setAttribute("height", (base - y).toFixed(1)); });
      var eta = parseFloat(slider.value);
      out.textContent = eta.toFixed(2);
      readout.textContent = "step " + steps + " · η = " + eta.toFixed(2) + " · noise " + (noise ? "on" : "off") +
        " · share right of the dip = " + (right / NP).toFixed(2) + " (target ≈ 0.69)";
    }

    function step(n) {
      var eta = parseFloat(slider.value), s = Math.sqrt(eta);
      for (var t = 0; t < n; t++) {
        for (var i = 0; i < NP; i++) xs[i] += 0.5 * eta * score(xs[i]) + (noise ? s * gauss() : 0);
        steps++;
      }
      draw();
    }
    function stopRun() { clearInterval(timer); timer = null; }
    function run(n) {
      stopRun();
      if (reduce) { step(n); return; }
      var done = 0;
      timer = setInterval(function () { step(3); done += 3; if (done >= n) stopRun(); }, 30);
    }

    slider.addEventListener("input", function () { draw(); });
    root.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.noise) {
        noise = b.dataset.noise === "on";
        root.querySelectorAll("[data-noise]").forEach(function (c) { c.setAttribute("aria-pressed", String(c === b)); });
        reset();
      } else if (b.dataset.act === "step") { stopRun(); step(10); }
      else if (b.dataset.act === "run") run(300);
      else if (b.dataset.act === "reset") reset();
    });

    r = rng(2024);
    build();
    reset();
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        var want = stageBox.clientWidth < 560 ? "compact" : "wide";
        if (want !== layout) build();
      }).observe(stageBox);
    }
  }

  document.addEventListener("lc:ready", function () {
    var root = document.getElementById("p5-3-langevin-playground");
    if (root) init(root);
  });
})();
