/* AR.6 playground: how many tokens can you commit per pass?
   Toy: 4 two-token names (8 tokens). Each name is one of m equally likely phrases, e.g. m = 3: New York / San Francisco / Los Angeles.
   A perfect model; each pass commits k tokens: first any token whose partner is already committed (its value is then certain),
   then ties broken uniformly at random among untouched names' tokens. Tokens committed in the same pass are sampled independently
   from their own marginals, so a name with both tokens in one pass is coherent with probability 1/m.
   The expected fraction of coherent names comes from an exact dynamic programme over (untouched, half-done, coherent) counts.
   Check: m = 3, k = 8, 4, 2, 1 -> 1/3, 5/7, 269/315, 1. */
(function () {
  var LC = window.LC;
  var P = 4;

  function binom(n, r) { if (r < 0 || r > n) return 0; var v = 1; for (var i = 1; i <= r; i++) v = v * (n - r + i) / i; return v; }

  function coherent(k, m) {
    var q = 1 / m, memo = {};
    function f(n0, n1, nc) {
      var masked = 2 * n0 + n1;
      if (masked === 0) return nc / P;
      var key = n0 + "," + n1 + "," + nc;
      if (key in memo) return memo[key];
      var kk = Math.min(k, masked), a = Math.min(kk, n1), rest = kk - a, out = 0;
      if (rest === 0) out = f(n0, n1 - a, nc + a);
      else {
        var slots = 2 * n0, total = binom(slots, rest);
        for (var j = 0; j <= Math.min(n0, Math.floor(rest / 2)); j++) {
          var s = rest - 2 * j;
          if (s < 0 || j + s > n0) continue;
          var pr = binom(n0, j) * binom(n0 - j, s) * Math.pow(2, s) / total;
          for (var c = 0; c <= j; c++) {
            var pc = binom(j, c) * Math.pow(q, c) * Math.pow(1 - q, j - c);
            out += pr * pc * f(n0 - j - s, n1 - a + s, nc + a + c);
          }
        }
      }
      memo[key] = out;
      return out;
    }
    return f(P, 0, 0);
  }
  LC.ar6Coherent = coherent; // exposed for checks

  function init(root) {
    var stage = root.querySelector(".pg-stage"), inK = root.querySelector('[data-in="k"]'), inM = root.querySelector('[data-in="m"]');
    var outK = root.querySelector('[data-out="k"]'), outM = root.querySelector('[data-out="m"]');
    var readout = root.querySelector(".pg-readout"), layout = null;

    function draw() {
      var k = +inK.value, m = +inM.value;
      outK.textContent = k; outM.textContent = m;
      var passes = Math.ceil(8 / k), frac = coherent(k, m), pct = Math.round(frac * 100);
      layout = stage.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact";
      var W = compact ? 360 : 640, H = 176, x0 = 4, x1 = W - 4, S = LC.svg;
      var svg = S("svg", { viewBox: "0 0 " + W + " " + H, role: "img",
        "aria-label": "Committing " + k + " tokens per pass takes " + passes + " passes and gives about " + pct + " percent coherent names." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto"; svg.style.maxHeight = compact ? "none" : "230px";

      // row 1: the 8 tokens grouped into passes
      S("text", { x: x0, y: 16, class: "t t-sm", "font-weight": 600, text: "8 tokens, grouped by pass" }, svg);
      var tw = compact ? 30 : 56, tg = compact ? 4 : 8, ty = 24, th = 24;
      var cols = ["f-orange", "f-blue"];
      for (var i = 0; i < 8; i++) {
        var pass = Math.floor(i / k), gx = (compact ? 8 : 4) + i * (tw + tg) + pass * (compact ? 6 : 10);
        S("rect", { x: gx, y: ty, width: tw, height: th, rx: 4, class: cols[pass % 2] }, svg);
        S("text", { x: gx + tw / 2, y: ty + 16, class: "t t-sm t-mid t-nohalo", style: "fill:#fff", "font-weight": 650, text: String(pass + 1) }, svg);
      }
      // row 2 and 3: bars
      function bar(y, label, valText, frac2, cls) {
        S("text", { x: x0, y: y, class: "t t-sm", "font-weight": 600, text: label }, svg);
        S("text", { x: x1, y: y, class: "t t-sm t-mono t-end", "font-weight": 650, text: valText }, svg);
        S("rect", { x: x0, y: y + 8, width: x1 - x0, height: 18, rx: 4, class: "f-faint", "fill-opacity": 0.35 }, svg);
        S("rect", { x: x0, y: y + 8, width: Math.max(2, (x1 - x0) * frac2), height: 18, rx: 4, class: cls }, svg);
      }
      bar(82, "forward passes", passes + " of 8", passes / 8, "f-blue");
      bar(132, "coherent names", pct + "%", frac, "f-orange");
      stage.innerHTML = ""; stage.appendChild(svg);

      var exp = (frac * P).toFixed(2);
      readout.textContent = k + " token" + (k > 1 ? "s" : "") + " per pass: " + passes + " pass" + (passes > 1 ? "es" : "") + " for 8 tokens. With " + m +
        " equally likely phrase" + (m > 1 ? "s" : "") + " per name, about " + exp + " of the 4 names come out coherent (" + pct + "%)." +
        (m === 1 ? " Every name is certain, so parallel commits cost nothing." : k === 1 ? " One token per pass is the autoregressive limit: always coherent." : "");
    }

    inK.addEventListener("input", draw); inM.addEventListener("input", draw);
    draw();
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        var want = stage.clientWidth < 560 ? "compact" : "wide";
        if (want !== layout) draw();
      }).observe(stage);
    }
  }

  document.addEventListener("lc:ready", function () {
    var root = document.getElementById("ar6-commit");
    if (root) init(root);
  });
})();
