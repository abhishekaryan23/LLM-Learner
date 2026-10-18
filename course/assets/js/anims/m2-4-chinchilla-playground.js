/* M2.4 playground: pick a compute budget C and a model size N. Tokens follow from
   C ≈ 6ND. The curve is the IsoFLOP profile of the same illustrative Chinchilla-style
   formula as the animation (optimum at 20 tokens per parameter), plotted as the extra
   loss compared with the best size for that budget. */
(function () {
  var LC = window.LC;
  var E = 1.69, A = 406.4, AL = 0.34, B = A * Math.pow(20, AL);
  function L(N, D) { return E + A / Math.pow(N, AL) + B / Math.pow(D, AL); }
  function Nopt(C) { return Math.sqrt(C / 120); }
  function extra(N, C) { var n = Nopt(C), lo = L(n, 20 * n); return (L(N, C / (6 * N)) - lo) / lo * 100; }
  var X0 = 8, X1 = 12.5, YMAX = 10;
  function big(n) {
    var u = [[1e12, "T"], [1e9, "B"], [1e6, "M"], [1e3, "K"]];
    for (var i = 0; i < u.length; i++) if (n >= u[i][0]) { var v = n / u[i][0]; return (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(0) : v.toFixed(1)) + u[i][1]; }
    return n.toFixed(0);
  }
  function sci(v) { var e = Math.floor(Math.log10(v)); return (v / Math.pow(10, e)).toFixed(1) + "e" + e; }

  function init(root) {
    var stage = root.querySelector(".pg-stage"), readout = root.querySelector(".pg-readout"), hint = root.querySelector(".pg-hint");
    var cIn = root.querySelector("#sc-c"), nIn = root.querySelector("#sc-n");
    var cOut = root.querySelector('output[for="sc-c"]'), nOut = root.querySelector('output[for="sc-n"]');
    var layout, svg, curve, star, dot, sx, sy, W, H, m;

    function build() {
      layout = stage.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact";
      W = compact ? 360 : 640; H = compact ? 220 : 250;
      m = compact ? { l: 40, r: 14, t: 30, b: 40 } : { l: 48, r: 24, t: 30, b: 40 };
      sx = function (ln) { return m.l + (ln - X0) / (X1 - X0) * (W - m.l - m.r); };
      sy = function (v) { return m.t + (1 - v / YMAX) * (H - m.t - m.b); };
      if (svg) svg.remove();
      var S = LC.svg;
      svg = S("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Extra loss versus model size for the chosen compute budget. The readout below gives the numbers." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "340px";
      stage.appendChild(svg);
      [0, 5, 10].forEach(function (v) {
        S("line", { x1: m.l, x2: W - m.r, y1: sy(v), y2: sy(v), class: "s-grid" }, svg);
        S("text", { x: m.l - 6, y: sy(v) + 4, class: "t t-sm t-muted t-end", text: v + "%" }, svg);
      });
      S("path", { d: "M" + m.l + " " + m.t + "V" + sy(0) + "H" + (W - m.r), class: "s-axis" }, svg);
      [[8, "100M"], [9, "1B"], [10, "10B"], [11, "100B"], [12, "1T"]].forEach(function (x) {
        S("text", { x: sx(x[0]), y: sy(0) + 18, class: "t t-sm t-muted t-mid", text: x[1] }, svg);
      });
      S("text", { x: W - m.r, y: H - 4, class: "t t-sm t-muted t-end", text: "parameters N (log scale) →" }, svg);
      S("text", { x: 4, y: 14, class: "t t-sm t-muted", text: "↑ extra loss vs the best size" }, svg);
      var cid = "scc" + Math.random().toString(36).slice(2), cp = S("clipPath", { id: cid }, S("defs", {}, svg));
      S("rect", { x: m.l, y: m.t - 8, width: W - m.l - m.r, height: H - m.t - m.b + 8 }, cp);
      var g = S("g", { "clip-path": "url(#" + cid + ")" }, svg);
      curve = S("path", { d: "", class: "s-blue" }, g);
      star = S("circle", { r: 6, class: "f-blue" }, svg);
      dot = S("circle", { r: 7, class: "f-orange", stroke: "var(--a-ink)", "stroke-width": 2 }, svg);
      draw();
    }

    function draw() {
      var C = Math.pow(10, parseFloat(cIn.value)), N = Math.pow(10, parseFloat(nIn.value));
      var D = C / (6 * N), n0 = Nopt(C), ex = extra(N, C);
      cOut.textContent = sci(C) + " FLOPs";
      nOut.textContent = big(N);
      var d = "";
      for (var i = 0; i <= 160; i++) { var ln = X0 + (X1 - X0) * i / 160; d += (i ? "L" : "M") + sx(ln).toFixed(1) + " " + sy(Math.min(YMAX * 1.3, extra(Math.pow(10, ln), C))).toFixed(1); }
      curve.setAttribute("d", d);
      var l0 = Math.log10(n0);
      star.setAttribute("cx", sx(l0)); star.setAttribute("cy", sy(0));
      star.style.opacity = l0 >= X0 && l0 <= X1 ? 1 : 0;
      var shown = Math.min(YMAX, ex);
      dot.setAttribute("cx", sx(Math.log10(N))); dot.setAttribute("cy", sy(shown));
      var ratio = D / N;
      readout.textContent = "Best for this budget: N ≈ " + big(n0) + ", D ≈ " + big(20 * n0) + " tokens. " +
        "Yours: N = " + big(N) + ", D = C/6N ≈ " + big(D) + " tokens (" + (ratio >= 10 ? ratio.toFixed(0) : ratio >= 0.1 ? ratio.toFixed(1) : ratio.toPrecision(1)) + " tokens/param), " +
        (ex < 0.05 ? "at the optimum." : "about " + (ex >= YMAX ? "≥ " + YMAX : ex.toFixed(1)) + "% higher loss.");
      if (ratio < 10) hint.textContent = "Too big for this budget: the model sees too few tokens per parameter (undertrained).";
      else if (ratio > 40) hint.textContent = "Smaller than optimal and trained longer: a bit worse for this budget, but cheaper to run at inference. Many modern models choose this on purpose.";
      else hint.textContent = "Close to compute-optimal: roughly 20 tokens per parameter.";
      root.querySelectorAll("[data-c]").forEach(function (b) {
        b.setAttribute("aria-pressed", String(Math.abs(parseFloat(b.dataset.c) - parseFloat(cIn.value)) < 0.0006 && Math.abs(parseFloat(b.dataset.n) - parseFloat(nIn.value)) < 0.0006));
      });
    }

    cIn.addEventListener("input", draw);
    nIn.addEventListener("input", draw);
    root.querySelectorAll("[data-c]").forEach(function (b) {
      b.addEventListener("click", function () { cIn.value = b.dataset.c; nIn.value = b.dataset.n; draw(); });
    });
    build();
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () { var want = stage.clientWidth < 560 ? "compact" : "wide"; if (want !== layout) build(); }).observe(stage);
    }
  }

  document.addEventListener("lc:ready", function () {
    var root = document.getElementById("scaling-playground");
    if (root) init(root);
  });
})();
