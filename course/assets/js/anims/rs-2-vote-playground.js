/* RS.2 playground: majority-vote accuracy against the number of samples N.
   Independent samples, each right with probability p: the correct answer has a strict majority with
   probability M(N, p) = Σ_{k > N/2} C(N, k) p^k (1 − p)^(N − k)   (odd N, exact binomial).
   That is a guaranteed win; with wrong answers spread over many values, plurality voting does at least this well.
   "Correlated errors" toy: with probability ρ = 0.4 all N samples follow one shared line of reasoning,
   so the vote is just one sample (right with probability p); otherwise they are independent:
   accuracy = ρ·p + (1 − ρ)·M(N, p), which flattens out at ρ·p + (1 − ρ) for p > 0.5. */
(function () {
  var LC = window.LC;
  var RHO = 0.4, NMAX = 41;

  function logC(n, k) { var s = 0; for (var i = 1; i <= k; i++) s += Math.log(n - k + i) - Math.log(i); return s; }
  function maj(N, p) {
    if (p <= 0) return 0; if (p >= 1) return 1;
    var s = 0;
    for (var k = Math.floor(N / 2) + 1; k <= N; k++) s += Math.exp(logC(N, k) + k * Math.log(p) + (N - k) * Math.log(1 - p));
    return Math.min(1, s);
  }
  function corr(N, p) { return RHO * p + (1 - RHO) * maj(N, p); }

  function init(root) {
    var stage = root.querySelector(".pg-stage");
    var sP = root.querySelector("[data-p]"), sN = root.querySelector("[data-n]");
    var oP = root.querySelector("[data-op]"), oN = root.querySelector("[data-on]");
    var bC = root.querySelector('[data-act="corr"]');
    var readout = root.querySelector(".pg-readout");
    var layout = null, svg, P, corrOn = false;

    function build() {
      layout = stage.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact";
      var W = compact ? 360 : 640, H = compact ? 270 : 290;
      var m = { l: 40, r: compact ? 14 : 24, t: 58, b: 46 };
      if (svg) svg.remove();
      svg = LC.svg("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Line chart of majority-vote accuracy against the number of samples N, for the chosen per-sample accuracy p. The readout below gives the values at the chosen N." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "360px";
      stage.appendChild(svg);
      var S = LC.svg;
      var x = function (n) { return m.l + ((n - 1) / (NMAX - 1)) * (W - m.l - m.r); };
      var y = function (v) { return m.t + (1 - v) * (H - m.t - m.b); };
      [0, 0.5, 1].forEach(function (v) {
        S("line", { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), class: v ? "s-grid" : "s-axis" }, svg);
        S("text", { x: m.l - 6, y: y(v) + 4, class: "t t-sm t-muted t-end", text: v }, svg);
      });
      [1, 11, 21, 31, 41].forEach(function (n) {
        S("text", { x: x(n), y: H - m.b + 18, class: "t t-sm t-muted t-mid", text: n }, svg);
      });
      S("text", { x: (m.l + W - m.r) / 2, y: H - 6, class: "t t-sm t-muted t-mid", text: "samples N (odd, so there are no ties) →" }, svg);
      S("text", { x: 4, y: 16, class: "t t-sm t-muted", text: "↑ chance the majority answer is right" }, svg);
      // legend row
      var lg = 36, lx = compact ? 6 : 40;
      S("path", { d: "M" + lx + " " + (lg - 4) + "h22", class: "s-orange" }, svg);
      S("text", { x: lx + 28, y: lg, class: "t t-sm", text: "independent" }, svg);
      S("path", { d: "M" + (lx + 114) + " " + (lg - 4) + "h22", class: "s-faint", "stroke-dasharray": "4 4" }, svg);
      S("text", { x: lx + 142, y: lg, class: "t t-sm", text: "one sample" }, svg);
      P = { W: W, H: H, m: m, x: x, y: y };
      P.legC = S("g", {}, svg);
      S("path", { d: "M" + (lx + 226) + " " + (lg - 4) + "h22", class: "s-blue", "stroke-dasharray": "6 5", "stroke-width": 2.5 }, P.legC);
      S("text", { x: lx + 254, y: lg, class: "t t-sm", text: "correlated" }, P.legC);
      P.nLine = S("line", { y1: m.t - 4, y2: H - m.b, class: "s-faint", "stroke-width": 1.5 }, svg);
      P.base = S("path", { d: "", class: "s-faint", "stroke-dasharray": "4 4" }, svg);
      P.corr = S("path", { d: "", class: "s-blue", "stroke-dasharray": "6 5", "stroke-width": 2.5 }, svg);
      P.ind = S("path", { d: "", class: "s-orange" }, svg);
      P.dotC = S("circle", { r: 5, class: "f-blue" }, svg);
      P.dot = S("circle", { r: 5.5, class: "f-orange" }, svg);
      draw();
    }

    function draw() {
      var p = +sP.value, N = +sN.value;
      oP.textContent = p.toFixed(2); oN.textContent = N;
      var di = "", dc = "";
      for (var n = 1; n <= NMAX; n += 2) {
        di += (n > 1 ? "L" : "M") + P.x(n).toFixed(1) + " " + P.y(maj(n, p)).toFixed(1);
        dc += (n > 1 ? "L" : "M") + P.x(n).toFixed(1) + " " + P.y(corr(n, p)).toFixed(1);
      }
      P.ind.setAttribute("d", di);
      P.corr.setAttribute("d", dc);
      P.base.setAttribute("d", "M" + P.m.l + " " + P.y(p).toFixed(1) + "H" + (P.W - P.m.r));
      var show = corrOn ? "" : "none";
      P.corr.style.display = show; P.dotC.style.display = show; P.legC.style.display = show;
      var a = maj(N, p), c = corr(N, p);
      P.dot.setAttribute("cx", P.x(N)); P.dot.setAttribute("cy", P.y(a));
      P.dotC.setAttribute("cx", P.x(N)); P.dotC.setAttribute("cy", P.y(c));
      P.nLine.setAttribute("x1", P.x(N)); P.nLine.setAttribute("x2", P.x(N));
      var txt = "p = " + p.toFixed(2) + ", N = " + N + " → majority right: " + a.toFixed(3) + " (one sample: " + p.toFixed(3) + ")";
      if (corrOn) txt += " · with correlated errors: " + c.toFixed(3) + (p > 0.5 ? ", levelling off at " + (RHO * p + 1 - RHO).toFixed(3) + " however large N gets" : "");
      if (p < 0.5) txt += " · below 0.5, voting makes things worse: the wrong side wins more often.";
      else if (p === 0.5) txt += " · exactly 0.5: a coin flip, however many votes.";
      readout.textContent = txt;
    }

    sP.addEventListener("input", draw);
    sN.addEventListener("input", draw);
    bC.addEventListener("click", function () {
      corrOn = !corrOn;
      bC.setAttribute("aria-pressed", String(corrOn));
      bC.textContent = "Correlated errors: " + (corrOn ? "on" : "off");
      draw();
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
    var root = document.getElementById("vote-playground");
    if (root) init(root);
  });
})();
