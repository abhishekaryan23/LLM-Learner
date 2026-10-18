/* P5.1: samples from N(0, 1) pile up into a bell; the density curve; the 68–95–99.7 rule;
   then reparameterization x = μ + σ·ε turns the same draws into N(1, 0.5²).
   Draws come from a seeded RNG (mulberry32 + Box–Muller), so every viewer sees the same picture.
   Areas: P(|Z| < 1) = 0.6827, P(|Z| < 2) = 0.9545, P(|Z| < 3) = 0.9973. Peak of N(0,1) = 1/√(2π) ≈ 0.399. */
(function () {
  var LC = window.LC;
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var N = 5000, EPS = [];
  (function () {
    var r = rng(7);
    for (var i = 0; i < N; i++) {
      var u1 = 1 - r(), u2 = r();
      EPS.push(Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2));
    }
  })();
  function pdf(x, mu, sg) { var z = (x - mu) / sg; return Math.exp(-0.5 * z * z) / (sg * Math.sqrt(2 * Math.PI)); }

  LC.anims["p5-1-bell"] = {
    title: "The bell curve and 68–95–99.7",
    steps: [
      "Draw numbers from the <strong>standard normal</strong> $\\mathcal N(0, 1)$: mean $\\mu = 0$, standard deviation $\\sigma = 1$. After 30 draws, most sit near 0 and only a few land far out.",
      "With 5,000 draws the <strong>histogram</strong> (scaled so its total area is 1) settles into a clear bell shape.",
      "The smooth curve is the <strong>density</strong> $p(x) = \\frac{1}{\\sqrt{2\\pi}}e^{-x^2/2}$. Its peak is $1/\\sqrt{2\\pi} \\approx 0.40$. Probabilities are <em>areas</em> under it, not heights.",
      "About <strong>68%</strong> of the area lies within one standard deviation of the mean, between $\\mu - \\sigma$ and $\\mu + \\sigma$.",
      "About <strong>95%</strong> lies within $\\pm 2\\sigma$ (95.4% to be precise).",
      "And <strong>99.7%</strong> lies within $\\pm 3\\sigma$. A draw beyond $3\\sigma$ happens about 3 times in 1,000; beyond $5\\sigma$, about once in 1.7 million.",
      "<strong>Reparameterization</strong>: to sample $\\mathcal N(\\mu, \\sigma^2)$, reuse the same draws and compute $x = \\mu + \\sigma\\varepsilon$. With $\\mu = 1$, $\\sigma = 0.5$ the bell shifts right, gets half as wide and twice as tall."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 312 } : { w: 640, h: 312 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var m = compact ? { l: 36, r: 12, t: 44 } : { l: 48, r: 24, t: 44 };
      var X0 = -3.5, X1 = 3.5, Y1 = 0.9, ph = 168;
      var pw = W - m.l - m.r, axisY = m.t + ph;
      function sx(x) { return m.l + ((x - X0) / (X1 - X0)) * pw; }
      function sy(v) { return m.t + (1 - v / Y1) * ph; }
      var tl = gsap.timeline();

      // axes (visible from s0)
      [0.2, 0.4, 0.6, 0.8].forEach(function (v) { S("line", { x1: m.l, x2: W - m.r, y1: sy(v), y2: sy(v), class: "s-grid" }, svg); });
      [0, 0.4, 0.8].forEach(function (v) { S("text", { x: m.l - 6, y: sy(v) + 4, class: "t t-sm t-muted t-end", text: v === 0 ? "0" : v.toFixed(1) }, svg); });
      [-3, -2, -1, 0, 1, 2, 3].forEach(function (x) { S("text", { x: sx(x), y: axisY + 17, class: "t t-sm t-muted t-mid", text: x < 0 ? "−" + (-x) : String(x) }, svg); });
      S("text", { x: 4, y: 16, class: "t t-sm t-muted", text: "↑ density p(x)" }, svg);
      var read = S("text", { x: W - m.r, y: compact ? 34 : 16, class: "t t-sm t-mono t-end", text: "" }, svg);

      // histogram (bins of width 0.25)
      var BW = 0.25, NB = Math.round((X1 - X0) / BW), bars = [];
      var hg = S("g", {}, svg);
      for (var b = 0; b < NB; b++) bars.push(S("rect", { x: sx(X0 + b * BW) + 0.5, width: Math.max(1, sx(BW) - sx(0) - 1), y: axisY, height: 0, class: "f-faint" }, hg));
      var st = { mu: 0, sg: 1, grow: 0 };
      function setHist() {
        var c = new Array(NB).fill(0);
        for (var i = 0; i < N; i++) {
          var k = Math.floor((st.mu + st.sg * EPS[i] - X0) / BW);
          if (k >= 0 && k < NB) c[k]++;
        }
        bars.forEach(function (r, k) {
          var h = Math.min(Y1, c[k] / (N * BW)) * st.grow;
          r.setAttribute("y", sy(h).toFixed(1)); r.setAttribute("height", (axisY - sy(h)).toFixed(1));
        });
      }
      setHist();

      // shaded areas under the curve (±1σ, ±2σ, ±3σ), drawn behind the curve
      var areas = [3, 2, 1].map(function (k, i) {
        var d = LC.fnPath(function (x) { return pdf(x, 0, 1); }, -k, k, sx, sy, 60) + "L" + sx(k).toFixed(1) + " " + axisY + "L" + sx(-k).toFixed(1) + " " + axisY + "Z";
        var a = S("path", { d: d, class: "f-blue", "fill-opacity": [0.12, 0.16, 0.22][i] }, svg);
        a.style.opacity = 0;
        return a;
      }).reverse();   // areas[0] = ±1σ

      S("path", { d: "M" + m.l + " " + m.t + "V" + axisY + "H" + (W - m.r), class: "s-axis" }, svg);

      // s0: a dot plot of the first 30 draws
      var dots = S("g", {}, svg), stack = {}, rr = compact ? 3.6 : 4;
      for (var i = 0; i < 30; i++) {
        var k = Math.floor((EPS[i] - X0) / 0.5), n = stack[k] = (stack[k] || 0) + 1;
        S("circle", { cx: sx(X0 + (k + 0.5) * 0.5), cy: axisY - rr - 1 - (n - 1) * (2 * rr + 1), r: rr, class: "f-orange" }, dots);
      }
      read.textContent = "30 draws";
      tl.addLabel("s0", 0);

      // s1: histogram of 5000 draws grows
      tl.to(dots, { opacity: 0, duration: 0.3 });
      tl.call(function () { read.textContent = "5,000 draws"; }, null, "<");
      tl.to(st, { grow: 1, duration: 1.0, ease: "power1.out", onUpdate: setHist });
      tl.addLabel("s1");

      // s2: the density curve
      var curve = S("path", { d: LC.fnPath(function (x) { return pdf(x, st.mu, st.sg); }, X0, X1, sx, sy, 120), class: "s-blue" }, svg);
      var peak = S("text", { x: sx(0.42), y: sy(0.45), class: "t t-sm t-blue", text: "peak ≈ 0.40" }, svg);
      LC.drawIn(tl, curve, { duration: 1.0 });
      LC.popIn(tl, peak, { duration: 0.3 });
      tl.addLabel("s2");

      // brackets under the axis, one row per k
      var rowY = [0, axisY + 40, axisY + 62, axisY + 84];
      var PCT = ["", "68%", "95%", "99.7%"];
      function bracket(k) {
        var y = rowY[k], half = (k === 3 ? 22 : 16) + 4, cx = sx(0);
        var d = "M" + sx(-k) + " " + (y - 5) + "V" + (y + 5) + "M" + sx(-k) + " " + y + "H" + (cx - half) +
          "M" + (cx + half) + " " + y + "H" + sx(k) + "M" + sx(k) + " " + (y - 5) + "V" + (y + 5);
        var p = S("path", { d: d, class: "s-blue", "stroke-width": 1.5 }, svg);
        var t = S("text", { x: cx, y: y + 4, class: "t t-sm t-blue t-mid", "font-weight": 650, text: PCT[k] }, svg);
        var side = S("text", { x: 4, y: y + 4, class: "t t-sm t-muted", text: "±" + k + "σ" }, svg);
        return { p: p, labels: [t, side] };
      }
      var BR = [null, bracket(1), bracket(2), bracket(3)];
      BR.slice(1).forEach(function (b) { b.p.style.opacity = 0; b.labels.forEach(function (l) { l.style.opacity = 0; }); });
      [1, 2, 3].forEach(function (k) {
        tl.to(areas[k - 1], { opacity: 1, duration: 0.5 }, "+=0.02");
        LC.drawIn(tl, BR[k].p, { duration: 0.6 }, "<");
        LC.popIn(tl, BR[k].labels, { duration: 0.3 });
        tl.addLabel("s" + (k + 2));
      });

      // s6: x = μ + σ·ε
      var all = [peak].concat(areas, BR[1].p, BR[2].p, BR[3].p, BR[1].labels, BR[2].labels, BR[3].labels);
      tl.to(all, { opacity: 0, duration: 0.3 });
      tl.call(function () { read.textContent = "x = μ + σε"; }, null, "<");
      tl.to(st, {
        mu: 1, sg: 0.5, duration: 1.6, ease: "power2.inOut", onUpdate: function () {
          setHist();
          curve.setAttribute("d", LC.fnPath(function (x) { return pdf(x, st.mu, st.sg); }, X0, X1, sx, sy, 120));
          var len = curve.getTotalLength();   // keep the dash pattern as long as the reshaped curve
          curve.style.strokeDasharray = len + " " + len;
          read.textContent = "μ = " + st.mu.toFixed(2) + ", σ = " + st.sg.toFixed(2);
        }
      });
      var peak2 = S("text", { x: sx(1.45), y: sy(0.8), class: "t t-sm t-blue", text: "peak ≈ 0.80" }, svg);
      var muL = S("text", { x: sx(1), y: rowY[1] + 4, class: "t t-sm t-orange t-mid", "font-weight": 650, text: "μ = 1" }, svg);
      var sgP = S("path", { d: "M" + sx(1) + " " + rowY[2] + "H" + sx(1.5) + "M" + sx(1.5) + " " + (rowY[2] - 5) + "V" + (rowY[2] + 5), class: "s-orange", "stroke-width": 1.5 }, svg);
      var sgL = S("text", { x: sx(1.5) + 6, y: rowY[2] + 4, class: "t t-sm t-orange", "font-weight": 650, text: "σ = 0.5" }, svg);
      LC.popIn(tl, [peak2, muL, sgL], { duration: 0.3 });
      LC.drawIn(tl, sgP, { duration: 0.4 }, "<");
      tl.addLabel("s6");
      return tl;
    }
  };
})();
