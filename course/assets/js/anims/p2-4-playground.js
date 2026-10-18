/* P2.4 playground: pick a polynomial degree (and optionally weight decay) and compare
   training vs validation error. Uses the precomputed fits in LC.p24Data (p2-4-overfit.js). */
(function () {
  var LC = window.LC;

  function init(root) {
    var D = LC.p24Data, F = LC.p24;
    if (!D) return;
    var stageBox = root.querySelector(".pg-stage");
    var slider = root.querySelector("input[type=range]");
    var out = root.querySelector("output");
    var chip = root.querySelector('[data-act="wd"]');
    var readout = root.querySelector(".pg-readout"), hint = root.querySelector(".pg-hint");
    var wd = false, layout = null, svg, curve, sx, sy;

    function build() {
      layout = stageBox.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact", S = LC.svg;
      var W = compact ? 360 : 640, H = compact ? 260 : 300;
      var P = compact ? { l: 34, r: W - 10, t: 12, b: H - 12 } : { l: 40, r: W - 14, t: 14, b: H - 14 };
      sx = function (x) { return P.l + x * (P.r - P.l); };
      sy = function (y) { return P.b - ((y - F.YMIN) / (F.YMAX - F.YMIN)) * (P.b - P.t); };
      if (svg) svg.remove();
      svg = S("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Training points (filled), validation points (hollow) and the fitted polynomial. The readout below gives both errors." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "380px";
      stageBox.appendChild(svg);
      var id = "p24pg-" + layout;
      var cp = S("clipPath", { id: id }, S("defs", {}, svg));
      S("rect", { x: P.l, y: P.t, width: P.r - P.l, height: P.b - P.t }, cp);
      [-1, 0, 1].forEach(function (v) { S("line", { x1: P.l, x2: P.r, y1: sy(v), y2: sy(v), class: "s-grid" }, svg); });
      S("path", { d: "M" + P.l + " " + P.t + "V" + P.b + "H" + P.r, class: "s-axis" }, svg);
      [-1, 0, 1].forEach(function (v) { S("text", { x: P.l - 7, y: sy(v) + 4, class: "t t-sm t-muted t-end", text: v === -1 ? "−1" : v }, svg); });
      curve = S("path", { class: "s-ink", "stroke-width": 2.5, "clip-path": "url(#" + id + ")" }, svg);
      D.xva.forEach(function (x, i) { S("circle", { cx: sx(x), cy: sy(D.yva[i]), r: 5, class: "f-paper", stroke: "var(--a-orange)", "stroke-width": 2.2 }, svg); });
      D.xtr.forEach(function (x, i) { S("circle", { cx: sx(x), cy: sy(D.ytr[i]), r: 5, class: "f-blue" }, svg); });
      draw();
    }

    function fmt(v) { return v >= 10 ? v.toFixed(1) : v.toFixed(3); }
    function draw() {
      var d = parseInt(slider.value, 10), e = (wd ? D.ridge : D.plain)[d];
      out.textContent = d;
      curve.setAttribute("d", F.fitPath(e.c, sx, sy));
      readout.textContent = "train MSE " + fmt(e.tr) + " · validation MSE " + fmt(e.va);
      var best = Math.min.apply(null, D.plain.map(function (x) { return x.va; }));
      var msg;
      if (e.va > 1) msg = "Overfitting: near-perfect on the training points, terrible on the validation points.";
      else if (d <= 2 && e.tr > 0.05) msg = "Underfitting: too stiff to follow the wave, so both errors are high.";
      else if (e.va < best * 1.35) msg = "Close to the best validation error: this model generalises well.";
      else msg = "Training error keeps falling as the degree rises; watch whether validation error follows.";
      if (wd && d >= 6) msg += " Weight decay is holding the wiggles back.";
      hint.textContent = msg;
    }

    slider.addEventListener("input", draw);
    chip.addEventListener("click", function () {
      wd = !wd; chip.setAttribute("aria-pressed", String(wd)); draw();
    });
    build();
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        var want = stageBox.clientWidth < 560 ? "compact" : "wide";
        if (want !== layout) build();
      }).observe(stageBox);
    }
  }

  document.addEventListener("lc:ready", function () {
    var root = document.getElementById("overfit-playground");
    if (root) init(root);
  });
})();
