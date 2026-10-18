/* AR.5 playground: KV-cache calculator.
   bytes = 2 x layers x kv_heads x head_dim x bytes_per_number x tokens.
   Llama 3.1 8B: 32 layers, 32 query / 8 KV heads, head 128, ~8.0B params.
   Llama 3.1 70B: 80 layers, 64 / 8, 128, ~70.6B. Llama 3.1 405B: 126 layers, 128 / 8, 128, ~405.9B.
   Mistral 7B (v0.1): 32 layers, 32 / 8, 128, ~7.24B, sliding window 4,096 -> rolling buffer cache.
   "GQA off" caches every query head (plain multi-head attention). */
(function () {
  var LC = window.LC;
  var MODELS = [
    { name: "Llama 3.1 8B", L: 32, q: 32, kv: 8, dh: 128, params: 8.03e9 },
    { name: "Llama 3.1 70B", L: 80, q: 64, kv: 8, dh: 128, params: 70.6e9 },
    { name: "Llama 3.1 405B", L: 126, q: 128, kv: 8, dh: 128, params: 405.9e9 },
    { name: "Mistral 7B", L: 32, q: 32, kv: 8, dh: 128, params: 7.24e9, window: 4096 }
  ];
  function fmtB(b) {
    var u = [[1e12, "TB"], [1e9, "GB"], [1e6, "MB"]];
    for (var i = 0; i < u.length; i++) if (b >= u[i][0]) { var v = b / u[i][0]; return (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)) + " " + u[i][1]; }
    return (b / 1e3).toFixed(0) + " KB";
  }
  function fmtN(n) { return n >= 1048576 ? (n / 1048576) + "M" : (n / 1024) + "K"; }

  function init(root) {
    var stage = root.querySelector(".pg-stage"), inN = root.querySelector('[data-in="n"]'), outN = root.querySelector('[data-out="n"]');
    var readout = root.querySelector(".pg-readout");
    var model = 1, gqa = true, fp8 = false, layout = null;

    function draw() {
      var M = MODELS[model], n = Math.pow(2, 10 + (+inN.value));
      outN.textContent = fmtN(n);
      var heads = gqa ? M.kv : M.q, b = fp8 ? 1 : 2;
      var perTok = 2 * M.L * heads * M.dh * b;
      var cached = M.window ? Math.min(n, M.window) : n;
      var kv = perTok * cached, w = M.params * 2, gpu = 80e9;
      layout = stage.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact";
      var W = compact ? 360 : 640, H = 168, x0 = 4, x1 = W - 4;
      var mx = Math.max(kv, w, gpu) * 1.04, sc = function (v) { return x0 + (x1 - x0) * v / mx; };
      var S = LC.svg;
      var svg = S("svg", { viewBox: "0 0 " + W + " " + H, role: "img",
        "aria-label": "KV cache " + fmtB(kv) + " versus weights " + fmtB(w) + " for " + M.name + " at " + fmtN(n) + " tokens." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "260px";
      function row(y, label, val, v, cls) {
        S("text", { x: x0, y: y, class: "t t-sm", "font-weight": 600, text: label }, svg);
        S("text", { x: x1, y: y, class: "t t-sm t-mono t-end " + (cls === "f-orange" ? "t-orange" : "t-blue"), "font-weight": 650, text: val }, svg);
        S("rect", { x: x0, y: y + 8, width: x1 - x0, height: 20, rx: 4, class: "f-faint", "fill-opacity": 0.35 }, svg);
        S("rect", { x: x0, y: y + 8, width: Math.max(2, sc(v) - x0), height: 20, rx: 4, class: cls }, svg);
      }
      row(18, "weights (bf16)", fmtB(w), w, "f-blue");
      row(72, compact ? "KV cache, 1 sequence" : "KV cache for one sequence", fmtB(kv), kv, "f-orange");
      var gx = sc(gpu);
      [[24, 48], [78, 102]].forEach(function (yy) { S("line", { x1: gx, x2: gx, y1: yy[0], y2: yy[1], class: "s-ink", "stroke-width": 1.5, "stroke-dasharray": "4 3" }, svg); });
      var anchor = gx > W - 90 ? "t-end" : gx < 90 ? "" : "t-mid";
      S("text", { x: anchor === "t-end" ? gx + 2 : gx, y: 120, class: "t t-sm t-muted " + anchor, text: "80 GB GPU" }, svg);
      S("text", { x: x0, y: 156, class: "t t-sm t-muted", text: (gqa ? heads + " KV heads (GQA)" : heads + " KV heads (no GQA)") + " · " + (fp8 ? "8-bit" : "bf16") + (M.window ? " · window " + M.window : "") }, svg);
      stage.innerHTML = ""; stage.appendChild(svg);

      readout.textContent = "2 × " + M.L + " layers × " + heads + " KV heads × " + M.dh + " × " + b + " byte" + (b > 1 ? "s" : "") + " = " +
        (perTok / 1024).toFixed(0) + " KiB per token × " + cached.toLocaleString("en-US") + " tokens" +
        (M.window && n > M.window ? " (rolling window; older tokens dropped)" : "") + " = " + fmtB(kv) +
        " · " + (kv / w >= 1 ? (kv / w).toFixed(1) + "× the weights" : Math.round(100 * kv / w) + "% of the weights") + ".";
      root.querySelectorAll("[data-model]").forEach(function (c) { c.setAttribute("aria-pressed", String(+c.dataset.model === model)); });
      var g = root.querySelector('[data-opt="gqa"]'), f = root.querySelector('[data-opt="fp8"]');
      g.setAttribute("aria-pressed", String(gqa)); g.textContent = gqa ? "GQA on" : "GQA off";
      f.setAttribute("aria-pressed", String(fp8));
    }

    inN.addEventListener("input", draw);
    root.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b || !root.contains(b)) return;
      if (b.dataset.model != null) model = +b.dataset.model;
      else if (b.dataset.opt === "gqa") gqa = !gqa;
      else if (b.dataset.opt === "fp8") fp8 = !fp8;
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
    var root = document.getElementById("ar5-kv");
    if (root) init(root);
  });
})();
