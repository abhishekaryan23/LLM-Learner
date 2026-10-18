/* P1.4: partial derivatives and the gradient on f(x, y) = x² + 3y² at P = (1, 1).
   ∂f/∂x = 2x = 2, ∂f/∂y = 6y = 6, ∇f = (2, 6), |∇f| = √40 ≈ 6.32.
   Gradient-descent steps with η = 0.1: (1, 1) → (0.8, 0.4) → (0.64, 0.16) → (0.512, 0.064);
   f: 4 → 1.12 → 0.486 → 0.274. Arrows are drawn at 0.25 plot units per gradient unit. */
(function () {
  var LC = window.LC;
  var K = 0.25, P = [1, 1], G = [2, 6];
  var PATH = [[1, 1], [0.8, 0.4], [0.64, 0.16], [0.512, 0.064]];
  var LEVELS = [1, 4, 9];

  LC.anims["p1-4-gradient"] = {
    title: "The gradient points straight uphill",
    steps: [
      "A function of <strong>two</strong> inputs, $f(x, y) = x^2 + 3y^2$, drawn like a hiking map. Each ellipse is a <strong>contour</strong>: all points with the same value. The bowl's bottom is at the centre.",
      "Stand at $P = (1, 1)$, where $f = 1 + 3 = 4$. You're on the $f = 4$ contour (dark).",
      "<strong>Partial derivative</strong> in $x$: freeze $y$ and treat it as a constant. $\\frac{\\partial f}{\\partial x} = 2x = 2$. Moving right, $f$ climbs at rate 2.",
      "Now freeze $x$: $\\frac{\\partial f}{\\partial y} = 6y = 6$. The bowl is three times steeper in $y$, so $f$ climbs at rate 6 going up.",
      "Stack them into one vector: the <strong>gradient</strong> $\\nabla f = (2, 6)$. It points in the direction of <strong>steepest ascent</strong>, and its length $\\sqrt{40} \\approx 6.32$ is how steep that is. (Arrows drawn shorter to fit.)",
      "It is <strong>perpendicular to the contour</strong>. Walking along a contour doesn't change $f$ at all, so that direction gets zero slope, and the uphill direction is at a right angle to it.",
      "Go the <em>opposite</em> way, $-\\nabla f$, in small steps, recomputing the gradient each time: $f$ drops $4 \\to 1.12 \\to 0.49 \\to 0.27$. That's <strong>gradient descent</strong>."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 302 } : { w: 640, h: 272 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact", W = ctx.w;
      var X0 = -3.2, X1 = 3.2, Y0 = -1.4, Y1 = 2.9;
      var plotL = compact ? 10 : 14, plotW = compact ? 340 : 360, plotT = compact ? 62 : 16;
      var u = plotW / (X1 - X0), plotH = (Y1 - Y0) * u;
      function px(x) { return plotL + (x - X0) * u; }
      function py(y) { return plotT + (Y1 - y) * u; }
      var tl = gsap.timeline();
      var id = "p14clip" + Math.random().toString(36).slice(2, 8);
      var cp = S("clipPath", { id: id }, S("defs", {}, svg));
      S("rect", { x: plotL, y: plotT, width: plotW, height: plotH, rx: 8 }, cp);
      var plot = S("g", { "clip-path": "url(#" + id + ")" }, svg);
      S("rect", { x: plotL, y: plotT, width: plotW, height: plotH, rx: 8, class: "f-none", stroke: "var(--line)" }, svg);
      S("line", { x1: plotL, x2: plotL + plotW, y1: py(0), y2: py(0), class: "s-grid" }, plot);
      S("line", { x1: px(0), x2: px(0), y1: plotT, y2: plotT + plotH, class: "s-grid" }, plot);
      var conts = LEVELS.map(function (c) {
        return S("ellipse", { cx: px(0), cy: py(0), rx: Math.sqrt(c) * u, ry: Math.sqrt(c / 3) * u, class: "s-faint" }, plot);
      });
      S("circle", { cx: px(0), cy: py(0), r: 4, class: "f-faint" }, plot);

      function arrow(p, v, cls, sw) {
        var x1 = px(p[0]), y1 = py(p[1]), x2 = px(p[0] + v[0]), y2 = py(p[1] + v[1]);
        var a = Math.atan2(y2 - y1, x2 - x1), hl = 10;
        var shaft = S("path", { d: "M" + x1.toFixed(2) + " " + y1.toFixed(2) + "L" + (x2 - 0.7 * hl * Math.cos(a)).toFixed(2) + " " + (y2 - 0.7 * hl * Math.sin(a)).toFixed(2), class: cls, style: "stroke-width:" + (sw || 3) }, svg);
        var head = S("path", { d: "M" + (x2 - hl * Math.cos(a - 0.45)).toFixed(2) + " " + (y2 - hl * Math.sin(a - 0.45)).toFixed(2) + "L" + x2.toFixed(2) + " " + y2.toFixed(2) +
          "L" + (x2 - hl * Math.cos(a + 0.45)).toFixed(2) + " " + (y2 - hl * Math.sin(a + 0.45)).toFixed(2), class: cls, style: "stroke-width:" + (sw || 3) }, svg);
        return [shaft, head];
      }
      function show(tl, arr, lbls) { LC.drawIn(tl, arr[0], { duration: 0.5 }); LC.popIn(tl, [arr[1]].concat(lbls || []), { duration: 0.25 }); }

      // readouts
      var rx = compact ? 10 : 400, ry = compact ? 20 : 44, rdy = compact ? 21 : 26;
      function readout(lines) {
        var g = S("g", {}, svg);
        lines.forEach(function (ln, i) { S("text", { x: rx, y: ry + i * rdy, style: "white-space:pre", class: "t t-mono" + (compact ? " t-sm" : "") + (ln[1] ? " " + ln[1] : ""), text: ln[0] }, g); });
        g.style.opacity = 0;
        return g;
      }
      var R = [
        readout([["f(x, y) = x² + 3y²"], ["contours: f = 1, 4, 9", "t-muted"]]),
        readout([["P = (1, 1)"], ["f(P) = 1 + 3·1 = 4"]]),
        readout([["∂f/∂x = 2x = 2", "t-blue"]]),
        readout([["∂f/∂x = 2x = 2", "t-blue"], ["∂f/∂y = 6y = 6", "t-blue"]]),
        readout([["∇f = (2, 6)", "t-orange"], ["|∇f| = √40 ≈ 6.32", "t-orange"]]),
        readout([["along a contour: no change"], ["so ∇f ⟂ contour"]]),
        readout(compact ? [["step: P − 0.1·∇f = (0.8, 0.4)"], ["f: 4 → 1.12 → 0.49 → 0.27"]] :
          [["step: P − 0.1·∇f"], ["    = (0.8, 0.4)"], ["f: 4 → 1.12"], ["   → 0.49 → 0.27"]])
      ];
      R[0].style.opacity = 1;
      function next(i) { tl.to(R[i - 1], { opacity: 0, duration: 0.2 }); tl.to(R[i], { opacity: 1, duration: 0.3 }, "<0.1"); }
      tl.addLabel("s0", 0);

      // s1: P and its contour
      var c4 = S("ellipse", { cx: px(0), cy: py(0), rx: 2 * u, ry: Math.sqrt(4 / 3) * u, class: "s-ink", style: "stroke-width:2.2" }, plot);
      c4.style.opacity = 0;
      var Pdot = S("circle", { cx: px(1), cy: py(1), r: 6, class: "f-ink" }, svg);
      var Plbl = S("text", { x: px(1) - 12, y: py(1) + 18, class: "t t-sm t-end", "font-weight": 650, text: "P" }, svg);
      LC.popIn(tl, [c4, Pdot, Plbl], { duration: 0.4 });
      next(1);
      tl.addLabel("s1");

      // s2: ∂f/∂x
      var ax = arrow(P, [G[0] * K, 0], "s-blue");
      var axL = S("text", { x: px(P[0] + G[0] * K) + 6, y: py(1) + 5, class: "t t-sm t-blue", text: "∂f/∂x" }, svg);
      show(tl, ax, [axL]);
      next(2);
      tl.addLabel("s2");

      // s3: ∂f/∂y
      var ay = arrow(P, [0, G[1] * K], "s-blue");
      var ayL = S("text", { x: px(1) - 8, y: py(P[1] + G[1] * K) + 6, class: "t t-sm t-blue t-end", text: "∂f/∂y" }, svg);
      show(tl, ay, [ayL]);
      next(3);
      tl.addLabel("s3");

      // s4: gradient = both components together
      var guide = S("path", { d: "M" + px(P[0] + G[0] * K) + " " + py(1) + "V" + py(P[1] + G[1] * K) + "M" + px(1) + " " + py(P[1] + G[1] * K) + "H" + px(P[0] + G[0] * K), class: "s-faint", "stroke-dasharray": "3 4" }, svg);
      guide.style.opacity = 0;
      var ag = arrow(P, [G[0] * K, G[1] * K], "s-orange", 3.5);
      var agL = S("text", { x: px(P[0] + G[0] * K) + 8, y: py(P[1] + G[1] * K) + 4, class: "t t-orange", "font-weight": 650, text: "∇f" }, svg);
      LC.popIn(tl, guide, { duration: 0.3 });
      show(tl, ag, [agL]);
      next(4);
      tl.addLabel("s4");

      // s5: perpendicular to the contour
      var tdir = [G[1], -G[0]], tn = Math.hypot(tdir[0], tdir[1]); tdir = [tdir[0] / tn, tdir[1] / tn];
      var tan = S("path", { d: "M" + px(1 - 0.95 * tdir[0]) + " " + py(1 - 0.95 * tdir[1]) + "L" + px(1 + 0.95 * tdir[0]) + " " + py(1 + 0.95 * tdir[1]), class: "s-ink", style: "stroke-width:1.6", "stroke-dasharray": "5 4" }, svg);
      tan.style.opacity = 0;
      var gn = Math.hypot(G[0], G[1]), gd = [G[0] / gn, G[1] / gn], q = 0.2;   // right-angle mark, 0.2 units
      var mark = S("path", { d: "M" + px(1 + q * tdir[0]) + " " + py(1 + q * tdir[1]) + "L" + px(1 + q * tdir[0] + q * gd[0]) + " " + py(1 + q * tdir[1] + q * gd[1]) + "L" + px(1 + q * gd[0]) + " " + py(1 + q * gd[1]), class: "s-ink", style: "stroke-width:1.5" }, svg);
      mark.style.opacity = 0;
      tl.to(ax.concat(ay, [axL, ayL, guide]), { opacity: 0, duration: 0.3 });
      LC.popIn(tl, [tan, mark], { duration: 0.4 });
      next(5);
      tl.addLabel("s5");

      // s6: descend
      tl.to([tan, mark], { opacity: 0, duration: 0.3 });
      var an = arrow(P, [-G[0] * K, -G[1] * K], "s-ink", 2.5);
      var anL = S("text", { x: px(P[0] - G[0] * K) + 10, y: py(P[1] - G[1] * K) + 14, class: "t t-sm", "font-weight": 650, text: "−∇f" }, svg);
      show(tl, an, [anL]);
      var d = PATH.map(function (p, i) { return (i ? "L" : "M") + px(p[0]).toFixed(1) + " " + py(p[1]).toFixed(1); }).join("");
      var path = S("path", { d: d, class: "s-orange", style: "stroke-width:2.5" }, svg);
      var dots = PATH.slice(1).map(function (p) { return S("circle", { cx: px(p[0]), cy: py(p[1]), r: 4, class: "f-orange" }, svg); });
      tl.to([an[0], an[1]], { opacity: 0.35, duration: 0.3 });
      LC.drawIn(tl, path, { duration: 1 });
      LC.popIn(tl, dots, { duration: 0.2, stagger: 0.25 }, "<0.2");
      next(6);
      tl.addLabel("s6");
      return tl;
    }
  };
})();
