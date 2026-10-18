/* M5.3 playground: route batches of 64 tokens to 8 experts (top-2 = 128 slots).
   The router starts with a learned preference for some experts. Capacity per expert
   = ceil(capacity factor x 128 / 8); slots beyond it are dropped.
   "Balance" applies the bias update used by DeepSeek-V3's auxiliary-loss-free
   balancing: after each batch, bias_i -= gamma * sign(load_i - mean load); the bias
   only affects which experts are chosen, not the gate values. */
(function () {
  var LC = window.LC;
  var N = 64, E = 8, K = 2, D = 4, GAMMA = 0.1;
  var SKEW = [1.3, 0.1, 1.0, -0.6, 0.2, -0.9, 0.5, -0.7];

  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(r) { var u = r() || 1e-9, v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  var WR = (function () { var r = rng(3), w = []; for (var d = 0; d < D; d++) { w.push([]); for (var e = 0; e < E; e++) w[d].push(0.8 * gauss(r)); } return w; })();

  function batch(seed) {
    var r = rng(1000 + seed), xs = [];
    for (var t = 0; t < N; t++) { var x = []; for (var d = 0; d < D; d++) x.push(gauss(r)); xs.push(x); }
    return xs;
  }
  function route(xs, bias) {
    var load = new Array(E).fill(0);
    xs.forEach(function (x) {
      var sc = [];
      for (var e = 0; e < E; e++) { var s = SKEW[e] + bias[e]; for (var d = 0; d < D; d++) s += x[d] * WR[d][e]; sc.push([s, e]); }
      sc.sort(function (a, b) { return b[0] - a[0]; });
      for (var k = 0; k < K; k++) load[sc[k][1]]++;
    });
    return load;
  }

  function init(root) {
    var stage = root.querySelector(".pg-stage"), slider = root.querySelector("input[type=range]");
    var out = root.querySelector("output"), readout = root.querySelector(".pg-readout"), hint = root.querySelector(".pg-hint");
    var CFS = [1, 1.25, 1.5, 2];
    var seed = 0, bias = new Array(E).fill(0), steps = 0, layout = null;

    function draw() {
      var cf = CFS[+slider.value];
      out.textContent = cf.toFixed(2);
      var C = Math.ceil(cf * N * K / E);
      var load = route(batch(seed), bias);
      layout = stage.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact";
      var W = compact ? 360 : 640, H = 250, m = compact ? 12 : 40, pitch = (W - 2 * m) / E, bw = compact ? 28 : 44;
      var base = 196, avail = 160;
      var top = Math.max(36, C + 2, Math.max.apply(null, load)); // fixed scale so loads compare across presses
      var unit = Math.min(10, avail / top);
      var S = LC.svg;
      var svg = S("svg", { viewBox: "0 0 " + W + " " + H, role: "img",
        "aria-label": "Slots routed to each of 8 experts: " + load.join(", ") + ". Capacity " + C + " per expert." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "360px";
      S("text", { x: 4, y: 16, class: "t t-sm t-muted", text: compact ? "blue = processed · orange = dropped" : "each block = one token's slot · blue = processed · orange = dropped (over capacity)" }, svg);
      load.forEach(function (n, i) {
        var cx = m + pitch * (i + 0.5);
        for (var u = 0; u < n; u++) {
          S("rect", { x: cx - bw / 2, y: base - (u + 1) * unit + 0.6, width: bw, height: Math.max(1, unit - 1.2), rx: 1.5, class: u < C ? "f-blue" : "f-orange" }, svg);
        }
        S("text", { x: cx, y: base + 18, class: "t t-sm t-mid", text: "E" + (i + 1) }, svg);
        S("text", { x: cx, y: base + 36, class: "t t-sm t-mono t-mid" + (n > C ? " t-orange" : " t-muted"), text: String(n) }, svg);
      });
      S("line", { x1: m, x2: W - m, y1: base, y2: base, class: "s-axis" }, svg);
      S("line", { x1: m, x2: W - m, y1: base - C * unit, y2: base - C * unit, class: "s-ink", "stroke-width": 1.5, "stroke-dasharray": "5 4" }, svg);
      stage.innerHTML = ""; stage.appendChild(svg);

      var dropped = load.reduce(function (a, n) { return a + Math.max(0, n - C); }, 0);
      var mx = Math.max.apply(null, load);
      readout.textContent = (N * K) + " slots · capacity " + C + " per expert (dashed) · dropped " + dropped + " · busiest expert " + (mx / (N * K / E)).toFixed(2) + "× the average · balancing steps " + steps;
      var msg;
      if (steps === 0) msg = "The router has favourites, so a few experts overflow while others sit idle. Raise the capacity factor to drop fewer slots (at the cost of padding and memory), or press Balance.";
      else msg = "The favourites are gone; what's left is batch-to-batch noise" + (dropped ? ", which a slightly higher capacity factor absorbs" : "") + ". The bias only changes which experts get picked; the gate values still come from the router's own scores.";
      hint.textContent = msg;
    }

    slider.addEventListener("input", draw);
    root.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-act]"); if (!b) return;
      if (b.dataset.act === "batch") seed++;
      else if (b.dataset.act === "balance") {
        for (var s = 0; s < 10; s++) {
          seed++;
          var ld = route(batch(seed), bias), mean = N * K / E;
          for (var i = 0; i < E; i++) bias[i] -= GAMMA * Math.sign(ld[i] - mean);
          steps++;
        }
      } else if (b.dataset.act === "reset") { seed = 0; steps = 0; bias = new Array(E).fill(0); }
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
    var root = document.getElementById("moe-playground");
    if (root) init(root);
  });
})();
