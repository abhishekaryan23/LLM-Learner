/* RS.4 playground: best-of-N with a verifier that has a blind spot.
   Each sample is correct with probability p, a "fooling" wrong answer with probability q (the verifier
   scores it above every correct answer), and an ordinary wrong answer otherwise (scored below correct ones).
   Best-of-N picks the top score, so it is right exactly when no fooler was sampled and at least one
   correct answer was: P = (1 − q)^N − (1 − p − q)^N.
   Perfect verifier (q = 0): 1 − (1 − p)^N, which is pass@N. */
(function () {
  var LC = window.LC;
  var NMAX = 256;
  function hack(N, p, q) { return Math.pow(1 - q, N) - Math.pow(Math.max(0, 1 - p - q), N); }
  function perfect(N, p) { return 1 - Math.pow(1 - p, N); }

  function init(root) {
    var stage = root.querySelector(".pg-stage");
    var sP = root.querySelector("[data-p]"), sQ = root.querySelector("[data-q]");
    var oP = root.querySelector("[data-op]"), oQ = root.querySelector("[data-oq]");
    var readout = root.querySelector(".pg-readout");
    var layout = null, svg, P;

    function build() {
      layout = stage.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact";
      var W = compact ? 360 : 640, H = compact ? 270 : 290;
      var m = { l: 40, r: compact ? 16 : 24, t: 58, b: 46 };
      if (svg) svg.remove();
      svg = LC.svg("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Line chart of best-of-N accuracy against N on a log scale: a perfect verifier in blue rises to 1, a verifier with a blind spot in orange rises, peaks and falls. The readout below gives the peak." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "360px";
      stage.appendChild(svg);
      var S = LC.svg;
      var lmax = Math.log2(NMAX);
      var x = function (n) { return m.l + (Math.log2(n) / lmax) * (W - m.l - m.r); };
      var y = function (v) { return m.t + (1 - v) * (H - m.t - m.b); };
      [0, 0.5, 1].forEach(function (v) {
        S("line", { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), class: v ? "s-grid" : "s-axis" }, svg);
        S("text", { x: m.l - 6, y: y(v) + 4, class: "t t-sm t-muted t-end", text: v }, svg);
      });
      [1, 4, 16, 64, 256].forEach(function (n) {
        S("text", { x: x(n), y: H - m.b + 18, class: "t t-sm t-muted t-mid", text: n }, svg);
      });
      S("text", { x: (m.l + W - m.r) / 2, y: H - 6, class: "t t-sm t-muted t-mid", text: "samples N (log scale) →" }, svg);
      S("text", { x: 4, y: 16, class: "t t-sm t-muted", text: "↑ chance best-of-N picks a right answer" }, svg);
      var lg = 36, lx = compact ? 6 : 40;
      S("path", { d: "M" + lx + " " + (lg - 4) + "h22", class: "s-orange" }, svg);
      S("text", { x: lx + 28, y: lg, class: "t t-sm", text: "verifier with a blind spot" }, svg);
      S("path", { d: "M" + (lx + 214) + " " + (lg - 4) + "h22", class: "s-blue", "stroke-dasharray": "6 5", "stroke-width": 2.5 }, svg);
      S("text", { x: lx + 242, y: lg, class: "t t-sm", text: "perfect" }, svg);
      P = { W: W, H: H, m: m, x: x, y: y };
      P.pk = S("line", { y1: m.t - 4, y2: H - m.b, class: "s-faint", "stroke-width": 1.5 }, svg);
      P.perf = S("path", { d: "", class: "s-blue", "stroke-dasharray": "6 5", "stroke-width": 2.5 }, svg);
      P.hack = S("path", { d: "", class: "s-orange" }, svg);
      P.dot = S("circle", { r: 5.5, class: "f-orange" }, svg);
      draw();
    }

    function draw() {
      var p = +sP.value, q = +sQ.value;
      oP.textContent = p.toFixed(2); oQ.textContent = q.toFixed(3);
      var dh = "", dp = "", best = 1, bestV = -1;
      for (var n = 1; n <= NMAX; n++) {
        var h = hack(n, p, q), f = perfect(n, p);
        dh += (n > 1 ? "L" : "M") + P.x(n).toFixed(1) + " " + P.y(h).toFixed(1);
        dp += (n > 1 ? "L" : "M") + P.x(n).toFixed(1) + " " + P.y(f).toFixed(1);
        if (h > bestV + 1e-12) { bestV = h; best = n; }
      }
      P.hack.setAttribute("d", dh); P.perf.setAttribute("d", dp);
      P.dot.setAttribute("cx", P.x(best)); P.dot.setAttribute("cy", P.y(bestV));
      P.pk.setAttribute("x1", P.x(best)); P.pk.setAttribute("x2", P.x(best));
      var txt = "p = " + p.toFixed(2) + ", q = " + q.toFixed(3) + " → ";
      if (q === 0) txt += "no blind spot: best-of-N = pass@N, " + perfect(16, p).toFixed(3) + " at N = 16 and still rising.";
      else txt += "best at N = " + best + " (" + bestV.toFixed(3) + "); at N = 16: " + hack(16, p, q).toFixed(3) + "; at N = 256: " + hack(256, p, q).toFixed(3) +
        ". A perfect verifier would give " + perfect(256, p).toFixed(3) + " at N = 256.";
      readout.textContent = txt;
    }

    sP.addEventListener("input", draw);
    sQ.addEventListener("input", draw);
    build();
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        var want = stage.clientWidth < 560 ? "compact" : "wide";
        if (want !== layout) build();
      }).observe(stage);
    }
  }

  document.addEventListener("lc:ready", function () {
    var root = document.getElementById("bon-playground");
    if (root) init(root);
  });
})();
