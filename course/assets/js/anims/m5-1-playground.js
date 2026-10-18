/* M5.1 playground: symmetric round-to-nearest quantization of 512 bell-curve
   weights. Bits slider (2-8), optional outlier, per-tensor vs per-group (32) scales.
   Symmetric: s = max|w| / (2^(b-1) - 1), q = round(w / s), w_hat = s * q.
   Top: histogram of the original weights. Bottom: histogram after quantize ->
   dequantize, with the quantization levels marked when they are few enough to draw. */
(function () {
  var LC = window.LC;
  var N = 512, GROUP = 32, OUT_I = 300, OUT_V = 14;

  function rng(seed) { // mulberry32
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var BASE = (function () {
    var r = rng(7), out = [];
    while (out.length < N) {
      var u = r() || 1e-9, v = r();
      var g = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      if (Math.abs(g) < 3.4) out.push(g);
    }
    return out;
  })();

  function quantize(ws, bits, group) {
    var qmax = Math.pow(2, bits - 1) - 1, out = new Array(ws.length), size = group ? GROUP : ws.length;
    for (var g0 = 0; g0 < ws.length; g0 += size) {
      var m = 0, k;
      for (k = g0; k < g0 + size; k++) m = Math.max(m, Math.abs(ws[k]));
      var s = m / qmax;
      for (k = g0; k < g0 + size; k++) out[k] = s * Math.round(ws[k] / s);
    }
    return { deq: out, qmax: qmax };
  }

  function init(root) {
    var stage = root.querySelector(".pg-stage"), slider = root.querySelector("input[type=range]");
    var out = root.querySelector("output"), readout = root.querySelector(".pg-readout"), hint = root.querySelector(".pg-hint");
    var opt = { outlier: false, group: false }, layout = null;

    function weights() {
      var w = BASE.slice();
      if (opt.outlier) w[OUT_I] = OUT_V;
      return w;
    }

    function draw() {
      var bits = +slider.value;
      out.textContent = bits;
      layout = stage.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact";
      var W = compact ? 360 : 640, H = 290;
      var mL = compact ? 16 : 30, mR = compact ? 16 : 30;
      var ws = weights(), res = quantize(ws, bits, opt.group), deq = res.deq;
      var R = opt.outlier ? OUT_V : 3.4;
      function sx(v) { return mL + ((v + R) / (2 * R)) * (W - mL - mR); }
      var NB = compact ? 72 : 110, bw = (2 * R) / NB;
      function hist(vals) {
        var h = new Array(NB).fill(0);
        vals.forEach(function (v) { var b = Math.floor((v + R) / bw); h[Math.max(0, Math.min(NB - 1, b))]++; });
        return h;
      }
      var hA = hist(ws), hB = hist(deq);
      var S = LC.svg;
      var svg = S("svg", { viewBox: "0 0 " + W + " " + H, role: "img",
        "aria-label": "Two histograms. Top: the original weights, a bell curve. Bottom: the same weights after " + bits + "-bit quantization. The readout below gives the error." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "380px";
      var baseA = 112, baseB = 226, maxH = 74, pw = (W - mL - mR) / NB;
      function bars(h, base, cls) {
        var mx = Math.max.apply(null, h);
        h.forEach(function (c, i) {
          if (!c) return;
          var hh = Math.max(1.5, (c / mx) * maxH);
          S("rect", { x: mL + i * pw + 0.3, y: base - hh, width: Math.max(1, pw - 0.6), height: hh, class: cls }, svg);
        });
      }
      S("text", { x: 4, y: 16, class: "t t-sm t-muted", text: "original weights" }, svg);
      bars(hA, baseA, "f-blue");
      S("line", { x1: mL, x2: W - mR, y1: baseA, y2: baseA, class: "s-axis" }, svg);
      S("text", { x: 4, y: 140, class: "t t-sm t-muted", text: "after " + bits + "-bit quantize → dequantize" }, svg);
      bars(hB, baseB, "f-orange");
      S("line", { x1: mL, x2: W - mR, y1: baseB, y2: baseB, class: "s-axis" }, svg);
      var nLevels = 2 * res.qmax + 1;
      if (!opt.group) {
        var s = Math.max.apply(null, ws.map(Math.abs)) / res.qmax;
        if (nLevels <= 63) {
          for (var q = -res.qmax; q <= res.qmax; q++) {
            S("line", { x1: sx(q * s), x2: sx(q * s), y1: baseB + 3, y2: baseB + 10, class: "s-blue", "stroke-width": 1.2 }, svg);
          }
        }
      }
      // x axis labels
      [-R, 0, R].forEach(function (v, i) {
        S("text", { x: sx(v), y: baseB + 30, class: "t t-sm t-mono t-muted " + (i === 0 ? "" : i === 2 ? "t-end" : "t-mid"), text: (v < 0 ? "−" : "") + Math.abs(v).toFixed(v ? 1 : 0) }, svg);
      });
      var levelTxt = opt.group ? "each group of 32 has its own grid" : (nLevels <= 63 ? "ticks = the " + nLevels + " levels" : nLevels + " levels (too dense to draw)");
      S("text", { x: W / 2, y: baseB + 52, class: "t t-sm t-muted t-mid", text: levelTxt }, svg);
      if (opt.outlier) {
        S("circle", { cx: sx(OUT_V) - 3, cy: baseA - 5, r: 4, class: "f-orange" }, svg);
        S("text", { x: sx(OUT_V) - 3, y: baseA - 16, class: "t t-sm t-orange t-end", text: "outlier (14σ)" }, svg);
      }
      stage.innerHTML = ""; stage.appendChild(svg);

      // stats over the normal (non-outlier) weights
      var se = 0, sw = 0, used = {};
      for (var i = 0; i < N; i++) {
        if (opt.outlier && i === OUT_I) continue;
        se += Math.pow(ws[i] - deq[i], 2); sw += ws[i] * ws[i];
        used[deq[i].toFixed(6)] = 1;
      }
      var rel = Math.sqrt(se / sw) * 100;
      var bpw = bits + (opt.group ? 16 / GROUP : 0);
      readout.textContent = bits + " bits · RMS error " + (rel < 1 ? rel.toFixed(2) : rel.toFixed(1)) + "% of the weights' RMS · distinct values used by normal weights: " +
        Object.keys(used).length + " · storage ≈ " + (bpw % 1 ? bpw.toFixed(1) : bpw) + " bits/weight";
      var msg;
      if (opt.outlier && !opt.group) msg = "One outlier stretches the grid: s = 14/" + res.qmax + ", so the normal weights crowd into a few codes near zero.";
      else if (opt.outlier && opt.group) msg = "Only the outlier's group of 32 gets a coarse grid; the other 15 groups keep fine ones. The price is one 16-bit scale per group (+0.5 bit per weight here).";
      else if (bits <= 3) msg = "So few levels that the bell curve turns into a handful of spikes.";
      else if (bits >= 8) msg = "With 255 levels the error is tiny, which is why 8-bit weights are usually close to lossless.";
      else msg = "Each extra bit doubles the number of levels and roughly halves the error.";
      if (opt.group && !opt.outlier) msg = "Per-group scales help a little even without outliers: each group's grid fits its own largest weight. " + msg;
      hint.textContent = msg;
    }

    slider.addEventListener("input", draw);
    root.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-opt]"); if (!b) return;
      opt[b.dataset.opt] = !opt[b.dataset.opt];
      b.setAttribute("aria-pressed", String(opt[b.dataset.opt]));
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
    var root = document.getElementById("quant-playground");
    if (root) init(root);
  });
})();
