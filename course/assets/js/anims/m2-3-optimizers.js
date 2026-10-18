/* M2.3: SGD vs momentum vs Adam on the bowl L = x² + 10y² from P2.2.
   Paths are simulated here (20 steps each, start (−4, 1)):
   SGD η = 0.09; momentum (PyTorch form v ← μv + g, θ ← θ − ηv) η = 0.03, μ = 0.6;
   Adam η = 0.2, β1 = 0.9, β2 = 0.95, ε = 1e-8, with bias correction. */
(function () {
  var LC = window.LC;
  var STEPS = 20, X0 = [-4, 1];
  function grad(p) { return [2 * p[0], 20 * p[1]]; }
  function loss(p) { return p[0] * p[0] + 10 * p[1] * p[1]; }
  function sgd(eta) {
    var p = X0.slice(), out = [p.slice()];
    for (var t = 0; t < STEPS; t++) { var g = grad(p); p = [p[0] - eta * g[0], p[1] - eta * g[1]]; out.push(p.slice()); }
    return out;
  }
  function momentum(eta, mu) {
    var p = X0.slice(), v = [0, 0], out = [p.slice()];
    for (var t = 0; t < STEPS; t++) { var g = grad(p); v = [mu * v[0] + g[0], mu * v[1] + g[1]]; p = [p[0] - eta * v[0], p[1] - eta * v[1]]; out.push(p.slice()); }
    return out;
  }
  function adam(eta, b1, b2) {
    var p = X0.slice(), m = [0, 0], v = [0, 0], out = [p.slice()];
    for (var t = 1; t <= STEPS; t++) {
      var g = grad(p);
      for (var k = 0; k < 2; k++) {
        m[k] = b1 * m[k] + (1 - b1) * g[k];
        v[k] = b2 * v[k] + (1 - b2) * g[k] * g[k];
        var mh = m[k] / (1 - Math.pow(b1, t)), vh = v[k] / (1 - Math.pow(b2, t));
        p[k] -= eta * mh / (Math.sqrt(vh) + 1e-8);
      }
      out.push(p.slice());
    }
    return out;
  }
  var PATHS = { sgd: sgd(0.09), mom: momentum(0.03, 0.6), adam: adam(0.2, 0.9, 0.95) };
  function fmtL(v) { return v < 0.01 ? v.toFixed(3) : v.toFixed(2); }

  LC.anims["m2-3-optimizers"] = {
    title: "SGD, momentum and Adam on the same bowl",
    steps: [
      "The stretched bowl $L = x^2 + 10y^2$ from P2.2. At the start, the downhill direction $-\\nabla L = (8, -20)$ is dominated by the steep $y$ direction.",
      "<strong>SGD</strong> ($\\eta = 0.09$) steps along $-\\nabla L$, so it <strong>zig-zags</strong> across the valley. Its rate is capped by the steep direction: above $\\eta = 0.1$ the $y$ zig-zag grows and it diverges.",
      "<strong>Momentum</strong> keeps a running sum of past gradients. The $y$ components flip sign every step and cancel; the $x$ components agree and build up. The path smooths out.",
      "<strong>Adam</strong> divides each coordinate by its own running gradient size $\\sqrt{\\hat v}$. Its first step (blue) is exactly $\\eta = 0.2$ in <strong>both</strong> $x$ and $y$. SGD's first step (orange) was $(0.72, -1.8)$, 2.5× bigger in $y$, just like the gradient.",
      "So Adam heads <strong>diagonally</strong>, with per-parameter step sizes, then curves in. Its momentum ($\\beta_1 = 0.9$) carries it a little past the minimum.",
      "Honest scorecard: on a tiny, smooth, noise-free bowl, tuned SGD does fine. Adam earns its place in LLMs, where gradient scales differ wildly between parameters and every gradient is <strong>noisy</strong>, because one learning rate then works for all of them."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 272 } : { w: 640, h: 304 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var XA = -4.5, XB = 1.5, YA = -1.6, YB = 1.6;
      var u = compact ? 56 : 78;                        // px per unit (equal aspect)
      var px0 = compact ? 10 : 16, py0 = compact ? 58 : 44;
      function sx(x) { return px0 + (x - XA) * u; }
      function sy(y) { return py0 + (YB - y) * u; }
      var tl = gsap.timeline();

      // contours + minimum
      var clip = "pl-" + Math.random().toString(36).slice(2);
      var defs = S("defs", {}, svg), cp = S("clipPath", { id: clip }, defs);
      S("rect", { x: sx(XA), y: sy(YB), width: (XB - XA) * u, height: (YB - YA) * u }, cp);
      var cg = S("g", { "clip-path": "url(#" + clip + ")" }, svg);
      [0.5, 2, 5, 10, 18, 26].forEach(function (c) {
        S("ellipse", { cx: sx(0), cy: sy(0), rx: Math.sqrt(c) * u, ry: Math.sqrt(c / 10) * u, class: "s-faint", "stroke-width": 1.5 }, cg);
      });
      S("rect", { x: sx(XA), y: sy(YB), width: (XB - XA) * u, height: (YB - YA) * u, class: "f-none", stroke: "var(--line)", rx: 6 }, svg);
      S("circle", { cx: sx(0), cy: sy(0), r: 5, class: "f-ink" }, svg);
      S("text", { x: sx(0), y: sy(0) + 24, class: "t t-sm t-mid", text: "min" }, svg);
      S("circle", { cx: sx(X0[0]), cy: sy(X0[1]), r: 5, class: "f-ink" }, svg);
      S("text", { x: sx(X0[0]) - 8, y: sy(X0[1]) - 12, class: "t t-sm", text: "start" }, svg);

      // header rows: legend (top) and a one-line readout
      var legY = compact ? 18 : 18;
      var legend = [["SGD", "s-orange"], ["momentum", "s-ink"], ["Adam", "s-blue"]];
      var legX = compact ? [4, 92, 214] : [W - 380, W - 250, W - 100];
      var legEls = legend.map(function (l, i) {
        var g = S("g", {}, svg);
        S("path", { d: "M" + legX[i] + " " + (legY - 4) + "h18", class: l[1] }, g);
        S("text", { x: legX[i] + 24, y: legY, class: "t t-sm", text: l[0] }, g);
        return g;
      });
      var readY = compact ? 40 : 18, readX = 4;
      var reads = [
        compact ? "−∇L at start = (8, −20)" : "−∇L at start = (8, −20)",
        "SGD: 20 steps, η = 0.09",
        "momentum: η = 0.03, μ = 0.6",
        "Adam step 1: Δx = Δy = η = 0.2",
        "Adam: η = 0.2, β₁ = 0.9, β₂ = 0.95",
        compact ? "loss after 20 steps (start: 26)" : "loss after 20 steps (start: 26)"
      ].map(function (t, i) {
        var e = S("text", { x: readX, y: readY, class: "t t-sm t-muted", text: t }, svg);
        e.style.opacity = i === 0 ? 1 : 0;
        return e;
      });
      legEls.forEach(function (g) { g.style.opacity = 0; });
      function swapRead(i) { tl.to(reads[i - 1], { opacity: 0, duration: 0.2 }); tl.to(reads[i], { opacity: 1, duration: 0.2 }); }

      function arrow(p, q, cls, width) {
        var x1 = sx(p[0]), y1 = sy(p[1]), x2 = sx(q[0]), y2 = sy(q[1]);
        var a = Math.atan2(y2 - y1, x2 - x1), h = 9;
        var line = S("path", { d: "M" + x1 + " " + y1 + "L" + x2 + " " + y2, class: cls, "stroke-width": width || 2.5 }, svg);
        var head = S("path", { d: "M" + (x2 - h * Math.cos(a - 0.45)) + " " + (y2 - h * Math.sin(a - 0.45)) + "L" + x2 + " " + y2 + "L" + (x2 - h * Math.cos(a + 0.45)) + " " + (y2 - h * Math.sin(a + 0.45)), class: cls, "stroke-width": width || 2.5 }, svg);
        return [line, head];
      }
      function pathD(pts) { return pts.map(function (p, i) { return (i ? "L" : "M") + sx(p[0]).toFixed(1) + " " + sy(p[1]).toFixed(1); }).join(""); }

      // s0: the negative gradient at the start (scaled to fit)
      var g0 = arrow(X0, [X0[0] + 0.4, X0[1] - 1.0], "s-ink");
      var g0l = S("text", { x: sx(X0[0] + 0.4) + 8, y: sy(X0[1] - 1.0) + 4, class: "t t-sm", text: "−∇L" }, svg);
      tl.addLabel("s0", 0);

      // s1: SGD
      swapRead(1);
      tl.to(g0.concat([g0l]), { opacity: 0, duration: 0.25 }, "<");
      LC.popIn(tl, legEls[0], { duration: 0.2 }, "<");
      var pS = S("path", { d: pathD(PATHS.sgd), class: "s-orange", "stroke-width": 2.5 }, svg);
      LC.drawIn(tl, pS, { duration: 1.4 });
      tl.addLabel("s1");

      // s2: momentum
      swapRead(2);
      tl.to(pS, { opacity: 0.25, duration: 0.3 }, "<");
      LC.popIn(tl, legEls[1], { duration: 0.2 }, "<");
      var pM = S("path", { d: pathD(PATHS.mom), class: "s-ink", "stroke-width": 2.5 }, svg);
      LC.drawIn(tl, pM, { duration: 1.4 });
      tl.addLabel("s2");

      // s3: Adam's first step vs SGD's first step
      swapRead(3);
      tl.to(pM, { opacity: 0.25, duration: 0.3 }, "<");
      LC.popIn(tl, legEls[2], { duration: 0.2 }, "<");
      var s1a = arrow(X0, PATHS.sgd[1], "s-orange", 3);
      var a1 = arrow(X0, PATHS.adam[1], "s-blue", 3.5);
      var s1l = S("text", { x: sx(PATHS.sgd[1][0]) + 10, y: sy(PATHS.sgd[1][1]) + 4, class: "t t-sm t-orange", text: "SGD step 1" }, svg);
      var a1l = S("text", { x: sx(PATHS.adam[1][0]) + 12, y: sy(PATHS.adam[1][1]) + 2, class: "t t-sm t-blue", "font-weight": 650, text: "Adam step 1" }, svg);
      LC.drawIn(tl, s1a[0], { duration: 0.5 });
      LC.popIn(tl, [s1a[1], s1l], { duration: 0.2 });
      LC.drawIn(tl, a1[0], { duration: 0.4 });
      LC.popIn(tl, [a1[1], a1l], { duration: 0.2 });
      tl.addLabel("s3");

      // s4: Adam's full path
      swapRead(4);
      tl.to(a1.concat(s1a, [s1l, a1l]), { opacity: 0, duration: 0.2 }, "<");
      var pA = S("path", { d: pathD(PATHS.adam), class: "s-blue", "stroke-width": 2.5 }, svg);
      LC.drawIn(tl, pA, { duration: 1.4 });
      tl.addLabel("s4");

      // s5: scorecard
      swapRead(5);
      tl.to([pS, pM], { opacity: 1, duration: 0.3 }, "<");
      var names = [["SGD", "sgd", "t-orange"], ["mom.", "mom", ""], ["Adam", "adam", "t-blue"]];
      var score = names.map(function (n, i) {
        var last = PATHS[n[1]][STEPS];
        var txt = n[0] + " " + fmtL(loss(last));
        return compact
          ? S("text", { x: 4 + i * 118, y: sy(YA) + 22, class: "t t-sm t-mono " + n[2], text: txt }, svg)
          : S("text", { x: sx(XB) + 16, y: sy(YB) + 40 + i * 26, class: "t t-sm t-mono " + n[2], text: txt }, svg);
      });
      LC.popIn(tl, score, { duration: 0.3, stagger: 0.1 });
      tl.addLabel("s5");
      return tl;
    }
  };
})();
