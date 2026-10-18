/* M5.6 playground: batch size vs throughput and per-token latency, from a deliberately
   simple roofline toy model of DECODE only (no prefill, no queueing, perfect kernels):
     GPU: 80 GB memory, 2 TB/s bandwidth, 312 TFLOP/s (A100-class, 16-bit)
     model: 7B parameters in 16-bit = 14 GB of weights, 2 × 7e9 = 14 GFLOP per generated token
     KV cache: 0.125 MB per token of context (grouped-query attention), `ctx` tokens per request
   One decode step for a batch of B requests takes
     t(B) = max( (14 GB + B · KV) / 2 TB/s ,  B · 14 GFLOP / 312 TFLOP/s )
   Every request gets one token per step, so per-token latency = t(B), throughput = B / t(B).
   The batch must fit: 14 GB + B · KV ≤ 80 GB. */
(function () {
  var LC = window.LC;
  var BS = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024];
  var WGB = 14, BW = 2000, FLOP = 14e9, PEAK = 312e12, MEM = 80, KV_PER_TOK_GB = 0.125e-3, PRICE = 2;

  function model(B, ctx) {
    var kv = ctx * KV_PER_TOK_GB;                       // GB per request
    var tMem = (WGB + B * kv) / BW * 1000;              // ms
    var tComp = B * FLOP / PEAK * 1000;                 // ms
    var t = Math.max(tMem, tComp);
    return { t: t, tput: B / t * 1000, mem: WGB + B * kv, fits: WGB + B * kv <= MEM, bound: tComp > tMem ? "compute" : "memory", kv: kv };
  }
  function fmt(n) { return Math.round(n).toLocaleString("en-US"); }

  function init(root) {
    var stage = root.querySelector(".pg-stage");
    var slider = root.querySelector("input[type=range]"), out = root.querySelector("output");
    var readout = root.querySelector(".pg-readout"), hint = root.querySelector(".pg-hint");
    var ctx = 2000, layout = null, svg, P;

    function build() {
      layout = stage.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact";
      var W = compact ? 360 : 640, H = compact ? 360 : 340;
      var m = compact ? { l: 46, r: 14 } : { l: 56, r: 24 };
      var p1 = compact ? { t: 30, b: 150 } : { t: 30, b: 140 }, p2 = compact ? { t: 186, b: 300 } : { t: 176, b: 284 };
      if (svg) svg.remove();
      svg = LC.svg("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Two charts against batch size from 1 to 1024: total throughput in tokens per second rises and flattens; time per output token rises. The readout below gives the values for the chosen batch size." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "440px";
      stage.appendChild(svg);
      P = { W: W, H: H, m: m, p1: p1, p2: p2, compact: compact, layer: LC.svg("g", {}, svg) };
      var S = LC.svg;
      S("text", { x: 4, y: 16, class: "t t-sm", "font-weight": 600, text: compact ? "Throughput, all users (tokens/s)" : "Throughput: tokens/s summed over all users" }, svg);
      S("text", { x: 4, y: p2.t - 14, class: "t t-sm", "font-weight": 600, text: compact ? "Time per output token, each user (ms)" : "Latency: time per output token for each user (ms)" }, svg);
      [0, 10000, 20000].forEach(function (v) { var y = sy1(v); S("line", { x1: m.l, x2: W - m.r, y1: y, y2: y, class: "s-grid" }, svg); S("text", { x: m.l - 6, y: y + 4, class: "t t-sm t-muted t-end", text: v ? v / 1000 + "k" : "0" }, svg); });
      [0, 25, 50].forEach(function (v) { var y = sy2(v); S("line", { x1: m.l, x2: W - m.r, y1: y, y2: y, class: "s-grid" }, svg); S("text", { x: m.l - 6, y: y + 4, class: "t t-sm t-muted t-end", text: v }, svg); });
      BS.forEach(function (b, i) { if (compact && i % 2) return; S("text", { x: sx(i), y: p2.b + 18, class: "t t-sm t-muted t-mid", text: b }, svg); });
      S("text", { x: W - m.r, y: H - 6, class: "t t-sm t-muted t-end", text: "batch size B (log scale) →" }, svg);
      svg.appendChild(P.layer);
      draw();
    }
    function sx(i) { return P.m.l + 8 + i / (BS.length - 1) * (P.W - P.m.l - P.m.r - 16); }
    function sy1(v) { return P.p1.t + (1 - v / 25000) * (P.p1.b - P.p1.t); }
    function sy2(v) { return P.p2.t + (1 - v / 50) * (P.p2.b - P.p2.t); }

    function draw() {
      var i = parseInt(slider.value, 10), B = BS[i], S = LC.svg, L = P.layer;
      out.textContent = B;
      while (L.firstChild) L.removeChild(L.firstChild);
      var pts = BS.map(function (b) { return model(b, ctx); });
      var lastFit = -1; pts.forEach(function (p, j) { if (p.fits) lastFit = j; });
      // out-of-memory region
      if (lastFit < BS.length - 1) {
        var x0 = (sx(lastFit) + sx(lastFit + 1)) / 2, x1 = P.W - P.m.r;
        [[P.p1.t, P.p1.b], [P.p2.t, P.p2.b]].forEach(function (yy) {
          S("rect", { x: x0, y: yy[0], width: x1 - x0, height: yy[1] - yy[0], class: "f-faint", "fill-opacity": 0.35 }, L);
        });
        // labelled in the title row, so the guide line never crosses it
        S("text", { x: P.W - P.m.r, y: 16, class: "t t-sm t-muted t-end", text: P.compact ? "grey = won't fit" : "grey = doesn't fit in 80 GB" }, L);
      }
      function line(fn, cls) {
        var d = "";
        for (var j = 0; j <= lastFit; j++) d += (j ? "L" : "M") + sx(j).toFixed(1) + " " + fn(pts[j]).toFixed(1);
        S("path", { d: d, class: cls }, L);
      }
      line(function (p) { return sy1(p.tput); }, "s-blue");
      line(function (p) { return sy2(p.t); }, "s-orange");
      var cur = pts[i];
      [[P.p1.t, P.p1.b], [P.p2.t, P.p2.b]].forEach(function (yy) {
        S("line", { x1: sx(i), x2: sx(i), y1: yy[0], y2: yy[1], class: "s-faint", "stroke-dasharray": "4 4" }, L);
      });
      if (cur.fits) {
        S("circle", { cx: sx(i), cy: sy1(cur.tput), r: 6.5, class: "f-blue", stroke: "var(--a-paper)", "stroke-width": 2 }, L);
        S("circle", { cx: sx(i), cy: sy2(cur.t), r: 6.5, class: "f-orange", stroke: "var(--a-paper)", "stroke-width": 2 }, L);
        var cost = PRICE / (cur.tput * 3600 / 1e6);
        readout.textContent = "B = " + B + ": one decode step takes " + cur.t.toFixed(1) + " ms (" + cur.bound + "-bound), so each user gets about " +
          fmt(1000 / cur.t) + " tokens/s and the GPU makes " + fmt(cur.tput) + " tokens/s in total. Memory used: " + cur.mem.toFixed(1) +
          " of 80 GB. At $2 per GPU-hour that's about $" + cost.toFixed(2) + " per million output tokens.";
      } else {
        readout.textContent = "B = " + B + " doesn't fit: weights plus " + B + " KV caches need " + cur.mem.toFixed(0) + " GB, but the GPU has 80 GB. The largest batch that fits is " + BS[lastFit] + " (with this context length).";
      }
      var msg;
      if (!cur.fits) msg = "Long contexts fill memory with KV cache, capping the batch size. That's why PagedAttention's savings (M5.4) translate into throughput.";
      else if (cur.bound === "compute") msg = "Compute-bound: the arithmetic units are now the bottleneck, so a bigger batch only adds latency; throughput has hit its ceiling.";
      else if (B <= 4) msg = "Tiny batch: almost all of each step is spent streaming 14 GB of weights for a handful of tokens. Lowest latency, highest cost.";
      else msg = "Memory-bound: each weight read is shared by more requests, so throughput climbs much faster than latency does.";
      hint.textContent = msg;
    }

    slider.addEventListener("input", draw);
    root.querySelectorAll("[data-ctx]").forEach(function (c) {
      c.addEventListener("click", function () {
        ctx = parseInt(c.dataset.ctx, 10);
        root.querySelectorAll("[data-ctx]").forEach(function (o) { o.setAttribute("aria-pressed", String(o === c)); });
        draw();
      });
    });
    build();
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        var want = stage.clientWidth < 560 ? "compact" : "wide";
        if (want !== layout) build();
      }).observe(stage);
    }
  }

  document.addEventListener("lc:ready", function () {
    var root = document.getElementById("batch-playground");
    if (root) init(root);
  });
})();
