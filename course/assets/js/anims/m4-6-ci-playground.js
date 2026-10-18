/* M4.6 playground: how wide is a 95% CI for an accuracy, and does it really catch the
   truth 95% of the time? Each "eval run" draws n fresh questions from a model whose true
   accuracy is p, then reports p̂ ± 1.96·sqrt(p̂(1−p̂)/n). About 1 in 20 intervals should miss. */
(function () {
  var LC = window.LC;
  var NS = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];
  var RUNS = 20;

  function rng(seed) { // mulberry32
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function init(root) {
    var stageBox = root.querySelector(".pg-stage");
    var nSlider = root.querySelector('input[name="n"]'), pSlider = root.querySelector('input[name="p"]');
    var nOut = root.querySelector(".ci-n-out"), pOut = root.querySelector(".ci-p-out");
    var readout = root.querySelector(".pg-readout");
    var seed = 3, layout = null, svg, G = {}, results = [];

    function n() { return NS[+nSlider.value]; }
    function p() { return +pSlider.value / 100; }

    function simulate() {
      var r = rng(seed++), N = n(), P = p();
      results = [];
      for (var k = 0; k < RUNS; k++) {
        var c = 0;
        for (var i = 0; i < N; i++) if (r() < P) c++;
        results.push(c / N);
      }
    }

    function build() {
      layout = stageBox.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact";
      var W = compact ? 360 : 640, H = 292;
      var m = compact ? { l: 18, r: 18 } : { l: 24, r: 24 };
      G.W = W; G.top = 52; G.row = 10; G.axis = G.top + RUNS * G.row + 8;
      // 60-point window around the true accuracy, so narrow intervals stay visible
      var lo = Math.max(0, Math.min(40, Math.round(p() * 10 - 3) * 10)) / 100;
      G.lo = lo; G.hi = lo + 0.6;
      G.x = function (a) { return m.l + (Math.max(G.lo, Math.min(G.hi, a)) - G.lo) / 0.6 * (W - m.l - m.r); };
      if (svg) svg.remove();
      svg = LC.svg("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Twenty simulated eval runs, each drawn as an estimate with its 95% confidence interval, against a vertical line at the true accuracy. The readout below gives the numbers." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "360px";
      stageBox.appendChild(svg);
      var S = LC.svg;
      S("text", { x: 4, y: 16, class: "t t-sm t-muted", text: "20 simulated eval runs, each with its 95% CI" }, svg);
      S("line", { x1: G.x(G.lo), x2: G.x(G.hi), y1: G.axis, y2: G.axis, class: "s-axis" }, svg);
      [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6].map(function (d) { return Math.round((G.lo + d) * 100) / 100; }).forEach(function (a) {
        S("line", { x1: G.x(a), x2: G.x(a), y1: G.axis, y2: G.axis + 4, class: "s-axis" }, svg);
        S("text", { x: G.x(a), y: G.axis + 20, class: "t t-sm t-muted t-mid", text: Math.round(a * 100) + "%" }, svg);
      });
      G.truth = S("line", { y1: G.top - 6, y2: G.axis, class: "s-ink", "stroke-dasharray": "3 4", "stroke-width": 1.5 }, svg);
      G.truthLbl = S("text", { y: 36, class: "t t-sm t-mid", text: "" }, svg);
      G.runs = S("g", {}, svg);
      draw();
    }

    function draw() {
      var N = n(), P = p(), S = LC.svg, miss = 0;
      nOut.textContent = N.toLocaleString("en-US");
      pOut.textContent = Math.round(P * 100) + "%";
      var tx = G.x(P);
      G.truth.setAttribute("x1", tx); G.truth.setAttribute("x2", tx);
      G.truthLbl.setAttribute("x", Math.max(44, Math.min(G.W - 44, tx)));
      G.truthLbl.textContent = "true " + Math.round(P * 100) + "%";
      while (G.runs.firstChild) G.runs.removeChild(G.runs.firstChild);
      results.forEach(function (ph, k) {
        var se = Math.sqrt(ph * (1 - ph) / N), lo = Math.max(0, ph - 1.96 * se), hi = Math.min(1, ph + 1.96 * se);
        var hit = lo <= P && P <= hi;
        if (!hit) miss++;
        var y = G.top + k * G.row + G.row / 2;
        S("line", { x1: G.x(lo), x2: G.x(hi), y1: y, y2: y, class: hit ? "s-blue" : "s-orange", "stroke-width": hit ? 2 : 3 }, G.runs);
        S("circle", { cx: G.x(ph), cy: y, r: 2.6, class: hit ? "f-blue" : "f-orange" }, G.runs);
      });
      var se0 = Math.sqrt(P * (1 - P) / N) * 100;
      readout.textContent = "SE ≈ " + se0.toFixed(1) + " pts · 95% CI ≈ ±" + (1.96 * se0).toFixed(1) + " pts · " +
        (RUNS - miss) + " of " + RUNS + " intervals contain the truth (orange ones miss)";
    }

    function rerun() { simulate(); draw(); }
    nSlider.addEventListener("input", rerun);
    pSlider.addEventListener("input", function () {
      simulate();
      var lo = Math.max(0, Math.min(40, Math.round(p() * 10 - 3) * 10)) / 100;
      if (lo !== G.lo) build(); else draw();
    });
    root.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (b && b.dataset.act === "run") rerun();
    });

    simulate();
    build();
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        var want = stageBox.clientWidth < 560 ? "compact" : "wide";
        if (want !== layout) build();
      }).observe(stageBox);
    }
  }

  document.addEventListener("lc:ready", function () {
    var root = document.getElementById("ci-playground");
    if (root) init(root);
  });
})();
