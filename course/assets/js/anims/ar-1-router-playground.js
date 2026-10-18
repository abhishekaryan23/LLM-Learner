/* AR.1 playground: a toy top-k router. 64 tokens (4-d features) are routed to 8 experts.
   The router (logits = x·W + c) starts with favourites (c = SKEW). Capacity per expert
   C = ceil(cf · k · N / E); assignments beyond C are dropped.
   "Balance loss" trains W and c for 400 gradient steps (learning rate decaying to 0) on the Switch loss
   E · Σ f_i P_i (f_i = share of assignments, P_i = mean router probability; gradient
   flows only through P), then routes a fresh batch with the trained router. */
(function () {
  var LC = window.LC;
  var N = 64, E = 8, D = 4, STEPS = 400, LR = 2.0;
  var SKEW = [1.6, 0.2, 1.1, -0.7, 0.3, -1.0, 0.6, -0.8];
  var CFS = [0.75, 1, 1.25, 1.5, 2];

  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(r) { var u = r() || 1e-9, v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function initRouter() {
    var r = rng(7), W = [];
    for (var d = 0; d < D; d++) { W.push([]); for (var e = 0; e < E; e++) W[d].push(0.6 * gauss(r)); }
    return { W: W, c: SKEW.slice() };
  }
  function batch(seed) {
    var r = rng(500 + seed), xs = [];
    for (var t = 0; t < N; t++) { var x = []; for (var d = 0; d < D; d++) x.push(gauss(r)); xs.push(x); }
    return xs;
  }
  function probs(R, x) {
    var z = [], m = -1e9, e, d;
    for (e = 0; e < E; e++) { var s = R.c[e]; for (d = 0; d < D; d++) s += x[d] * R.W[d][e]; z.push(s); if (s > m) m = s; }
    var p = z.map(function (v) { return Math.exp(v - m); }), S = p.reduce(function (a, b) { return a + b; }, 0);
    return p.map(function (v) { return v / S; });
  }
  function topk(p, k) {
    return p.map(function (v, i) { return [v, i]; }).sort(function (a, b) { return b[0] - a[0]; }).slice(0, k).map(function (a) { return a[1]; });
  }
  // Route a batch: loads per expert, f, P and the aux loss E·Σ f P.
  function route(R, xs, k) {
    var load = new Array(E).fill(0), P = new Array(E).fill(0), ps = [];
    xs.forEach(function (x) {
      var p = probs(R, x); ps.push(p);
      topk(p, k).forEach(function (i) { load[i]++; });
      for (var e = 0; e < E; e++) P[e] += p[e] / xs.length;
    });
    var f = load.map(function (n) { return n / (k * xs.length); });
    var aux = E * f.reduce(function (a, fi, i) { return a + fi * P[i]; }, 0);
    return { load: load, f: f, P: P, aux: aux, ps: ps };
  }
  function train(k) {
    var R = initRouter();
    for (var s = 0; s < STEPS; s++) {
      var xs = batch(10000 + s), out = route(R, xs, k);
      var gW = [], gc = new Array(E).fill(0), d, e;
      for (d = 0; d < D; d++) gW.push(new Array(E).fill(0));
      out.ps.forEach(function (p, t) {
        var fp = 0; for (e = 0; e < E; e++) fp += out.f[e] * p[e];
        for (e = 0; e < E; e++) {
          var g = (E / N) * p[e] * (out.f[e] - fp); // dL/dz_{t,e}
          gc[e] += g;
          for (d = 0; d < D; d++) gW[d][e] += g * xs[t][d];
        }
      });
      for (e = 0; e < E; e++) { var lr = LR * (1 - s / STEPS); R.c[e] -= lr * gc[e]; for (d = 0; d < D; d++) R.W[d][e] -= lr * gW[d][e]; }
    }
    return R;
  }
  LC.ar1Router = { route: route, train: train, initRouter: initRouter, batch: batch }; // exposed for tests

  function init(root) {
    var stage = root.querySelector(".pg-stage");
    var inK = root.querySelector('[data-in="k"]'), inC = root.querySelector('[data-in="cf"]');
    var outK = root.querySelector('[data-out="k"]'), outC = root.querySelector('[data-out="cf"]');
    var auxBtn = root.querySelector('[data-act="aux"]');
    var readout = root.querySelector(".pg-readout"), hint = root.querySelector(".pg-hint");
    var base = initRouter(), trained = {}, aux = false, seed = 0, layout = null;

    function draw() {
      var k = +inK.value, cf = CFS[+inC.value];
      outK.textContent = k; outC.textContent = cf.toFixed(2);
      var R = aux ? (trained[k] || (trained[k] = train(k))) : base;
      var res = route(R, batch(seed), k), load = res.load;
      var C = Math.ceil(cf * k * N / E);
      layout = stage.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact";
      var W = compact ? 360 : 640, H = compact ? 262 : 270;
      var m = compact ? 14 : 44, pitch = (W - 2 * m) / E, bw = compact ? 26 : 40;
      var top = 44, baseY = H - 54, avail = baseY - top - 6;
      var mx = Math.max(C, Math.max.apply(null, load), 16 * k);
      var unit = avail / mx;
      var S = LC.svg;
      var svg = S("svg", { viewBox: "0 0 " + W + " " + H, role: "img",
        "aria-label": "Assignments per expert: " + load.join(", ") + ". Capacity " + C + " per expert." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "360px";
      // legend row (its own row above the plot)
      S("rect", { x: 4, y: 8, width: 12, height: 12, rx: 2, class: "f-blue" }, svg);
      S("text", { x: 21, y: 18, class: "t t-sm t-muted", text: "processed" }, svg);
      S("rect", { x: compact ? 98 : 110, y: 8, width: 12, height: 12, rx: 2, class: "f-orange" }, svg);
      S("text", { x: compact ? 115 : 127, y: 18, class: "t t-sm t-muted", text: "dropped" }, svg);
      S("text", { x: W - 4, y: 18, class: "t t-sm t-muted t-end", text: compact ? "- - capacity " + C : "dashed line = capacity " + C }, svg);
      load.forEach(function (n, i) {
        var cx = m + pitch * (i + 0.5), ok = Math.min(n, C), over = Math.max(0, n - C);
        if (ok) S("rect", { x: cx - bw / 2, y: baseY - ok * unit, width: bw, height: ok * unit, rx: 2, class: "f-blue" }, svg);
        if (over) S("rect", { x: cx - bw / 2, y: baseY - n * unit, width: bw, height: over * unit, rx: 2, class: "f-orange" }, svg);
        S("text", { x: cx, y: baseY + 18, class: "t t-sm t-mid", text: "E" + (i + 1) }, svg);
        S("text", { x: cx, y: baseY + 36, class: "t t-sm t-mono t-mid" + (n > C ? " t-orange" : " t-muted"), text: String(n) }, svg);
      });
      S("line", { x1: m, x2: W - m, y1: baseY, y2: baseY, class: "s-axis" }, svg);
      S("line", { x1: m - 6, x2: W - m + 6, y1: baseY - C * unit, y2: baseY - C * unit, class: "s-ink", "stroke-width": 1.5, "stroke-dasharray": "5 4" }, svg);
      stage.innerHTML = ""; stage.appendChild(svg);

      var dropped = load.reduce(function (a, n) { return a + Math.max(0, n - C); }, 0);
      var busiest = Math.max.apply(null, load) / (k * N / E);
      readout.textContent = (k * N) + " assignments · capacity " + C + " per expert · dropped " + dropped +
        " (" + Math.round(100 * dropped / (k * N)) + "%) · busiest expert " + busiest.toFixed(2) + "× average · balance loss E·Σ f·P = " + res.aux.toFixed(3);
      hint.textContent = aux
        ? "After training on the balance loss the favourites are gone and the loss is close to its minimum of 1. What's left is batch-to-batch noise: with only 64 tokens it is large, and a higher capacity factor absorbs most of it."
        : "The router prefers a few experts, so they overflow (orange) while others idle, and the balance loss sits well above 1. Raising the capacity factor drops fewer assignments but pads every buffer. Try the balance loss.";
      auxBtn.textContent = "Balance loss: " + (aux ? "on" : "off");
      auxBtn.setAttribute("aria-pressed", String(aux));
    }

    inK.addEventListener("input", draw);
    inC.addEventListener("input", draw);
    root.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-act]"); if (!b) return;
      if (b.dataset.act === "aux") aux = !aux;
      else if (b.dataset.act === "batch") seed++;
      draw();
    });
    draw();
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        var want = stage.clientWidth < 560 ? "compact" : "wide";
        if (want !== layout) draw();
      }).observe(stage);
    }
  }

  document.addEventListener("lc:ready", function () {
    var root = document.getElementById("ar1-router");
    if (root) init(root);
  });
})();
