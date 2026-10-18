/* P1.2: a 2×2 matrix warps the plane. M = [[2, −1], [1, 1]]: its columns (2, 1) and (−1, 1)
   are where e₁ and e₂ land; x = (1, 2) goes to Mx = 1·(2, 1) + 2·(−1, 1) = (0, 3).
   The unit square becomes a parallelogram of area det M = 2·1 − (−1)·1 = 3. */
(function () {
  var LC = window.LC;
  var M = [[2, -1], [1, 1]], X = [1, 2];
  var clipN = 0;

  LC.anims["p1-2-matrix-grid"] = {
    title: "A matrix is a way to warp space",
    steps: [
      "The plane, with two <strong>basis arrows</strong> $e_1 = (1, 0)$ (blue) and $e_2 = (0, 1)$ (orange). The vector $x = (1, 2)$ is just $1\\cdot e_1 + 2\\cdot e_2$.",
      "Here's a matrix $M$. Its <strong>columns</strong> tell you where $e_1$ and $e_2$ will land: at $(2, 1)$ and $(-1, 1)$ (dashed).",
      "Apply $M$ to everything. The whole grid moves with the basis arrows, and $x$ lands at $Mx = (0, 3)$.",
      "Why $(0, 3)$? $x$ was 1 of $e_1$ plus 2 of $e_2$, so $Mx$ is <strong>1 of column 1 plus 2 of column 2</strong>: $(2, 1) + (-2, 2) = (0, 3)$.",
      "The same numbers, row by row: each output entry is a <strong>dot product</strong> of a row of $M$ with $x$. Row 1: $2\\cdot 1 + (-1)\\cdot 2 = 0$. Row 2: $1\\cdot 1 + 1\\cdot 2 = 3$.",
      "Grid lines stay <strong>straight, parallel and evenly spaced</strong>, and the origin stays put: that's what <em>linear</em> means. The unit square became a parallelogram of area 3, which is $\\det M$."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 352 } : { w: 640, h: 300 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact", W = ctx.w;
      var X0 = -3.2, X1 = 3.2, Y0 = -1.4, Y1 = 3.6;
      var plotL = compact ? 10 : 16, plotW = compact ? 340 : 350, plotT = compact ? 78 : 10;
      var u = plotW / (X1 - X0), plotH = (Y1 - Y0) * u;
      function px(x) { return plotL + (x - X0) * u; }
      function py(y) { return plotT + (Y1 - y) * u; }
      var tl = gsap.timeline();
      var st = { t: 0 };
      function T(p) {                       // (1 − t)·I + t·M, applied to p
        var t = st.t;
        return [(1 - t + t * M[0][0]) * p[0] + t * M[0][1] * p[1], t * M[1][0] * p[0] + (1 - t + t * M[1][1]) * p[1]];
      }

      // clip region for the plot
      var id = "p12clip" + (++clipN);
      var defs = S("defs", {}, svg);
      var cp = S("clipPath", { id: id }, defs);
      S("rect", { x: plotL, y: plotT, width: plotW, height: plotH }, cp);
      var plot = S("g", { "clip-path": "url(#" + id + ")" }, svg);

      // static reference grid + axes
      for (var gx = -3; gx <= 3; gx++) S("line", { x1: px(gx), x2: px(gx), y1: plotT, y2: plotT + plotH, class: "s-grid" }, plot);
      for (var gy = -1; gy <= 3; gy++) S("line", { x1: plotL, x2: plotL + plotW, y1: py(gy), y2: py(gy), class: "s-grid" }, plot);
      S("line", { x1: plotL, x2: plotL + plotW, y1: py(0), y2: py(0), class: "s-axis" }, plot);
      S("line", { x1: px(0), x2: px(0), y1: plotT, y2: plotT + plotH, class: "s-axis" }, plot);

      // moving grid (drawn on top of the reference grid, but faint)
      var warp = S("g", {}, plot), lines = [];
      for (var k = -7; k <= 7; k++) {
        lines.push({ a: [k, -8], b: [k, 8], el: S("line", { class: "s-blue", style: "stroke-width:1;stroke-opacity:.3" }, warp) });
        lines.push({ a: [-8, k], b: [8, k], el: S("line", { class: "s-blue", style: "stroke-width:1;stroke-opacity:.3" }, warp) });
      }
      warp.style.opacity = 0;
      var square = S("path", { class: "f-orange", style: "fill-opacity:.18" }, plot);
      square.style.opacity = 0;

      function arrowD(p) {
        var ox = px(0), oy = py(0), x2 = px(p[0]), y2 = py(p[1]);
        var ang = Math.atan2(y2 - oy, x2 - ox), hl = 11;
        return "M" + ox + " " + oy + "L" + (x2 - hl * 0.8 * Math.cos(ang)).toFixed(2) + " " + (y2 - hl * 0.8 * Math.sin(ang)).toFixed(2) +
          "M" + (x2 - hl * Math.cos(ang - 0.45)).toFixed(2) + " " + (y2 - hl * Math.sin(ang - 0.45)).toFixed(2) + "L" + x2.toFixed(2) + " " + y2.toFixed(2) +
          "L" + (x2 - hl * Math.cos(ang + 0.45)).toFixed(2) + " " + (y2 - hl * Math.sin(ang + 0.45)).toFixed(2);
      }
      // dashed targets for the columns (s1)
      var ghost1 = S("path", { d: arrowD(M.map(function (r) { return r[0]; })), class: "s-blue", style: "stroke-width:2", "stroke-dasharray": "5 5" }, svg);
      var ghost2 = S("path", { d: arrowD(M.map(function (r) { return r[1]; })), class: "s-orange", style: "stroke-width:2", "stroke-dasharray": "5 5" }, svg);
      ghost1.style.opacity = 0; ghost2.style.opacity = 0;
      var e1 = S("path", { class: "s-blue" }, svg), e2 = S("path", { class: "s-orange" }, svg), xv = S("path", { class: "s-ink", style: "stroke-width:3" }, svg);

      function update() {
        lines.forEach(function (l) {
          var a = T(l.a), b = T(l.b);
          l.el.setAttribute("x1", px(a[0]).toFixed(1)); l.el.setAttribute("y1", py(a[1]).toFixed(1));
          l.el.setAttribute("x2", px(b[0]).toFixed(1)); l.el.setAttribute("y2", py(b[1]).toFixed(1));
        });
        e1.setAttribute("d", arrowD(T([1, 0])));
        e2.setAttribute("d", arrowD(T([0, 1])));
        xv.setAttribute("d", arrowD(T(X)));
        var c = [[0, 0], [1, 0], [1, 1], [0, 1]].map(function (p) { var q = T(p); return px(q[0]).toFixed(1) + " " + py(q[1]).toFixed(1); });
        square.setAttribute("d", "M" + c.join("L") + "Z");
      }
      update();

      function lbl(x, y, txt, cls, dx, dy) {
        return S("text", { x: px(x) + (dx || 0), y: py(y) + (dy || 0), class: "t " + cls, "font-weight": 650, text: txt }, svg);
      }
      var L0 = [lbl(1, 0, "e₁", "t-blue t-mid", -2, 22), lbl(0, 1, "e₂", "t-orange t-mid", 0, -10), lbl(1, 2, "x = (1, 2)", "t-sm", 8, 0)];

      // matrix display
      var mx = compact ? 12 : 420, my = compact ? 38 : 46;
      var mg = S("g", {}, svg);
      S("text", { x: mx, y: my + 11, class: "t", text: "M =" }, mg);
      var bx = mx + 38, colX = [bx + 22, bx + 56], bw = 76;
      S("path", { d: "M" + (bx + 6) + " " + (my - 12) + "H" + bx + "V" + (my + 30) + "H" + (bx + 6), class: "s-axis" }, mg);
      S("path", { d: "M" + (bx + bw - 6) + " " + (my - 12) + "H" + (bx + bw) + "V" + (my + 30) + "H" + (bx + bw - 6), class: "s-axis" }, mg);
      [[0, 0], [0, 1], [1, 0], [1, 1]].forEach(function (rc) {
        var v = M[rc[0]][rc[1]];
        S("text", { x: colX[rc[1]], y: my + 4 + rc[0] * 22, class: "t t-mono t-mid " + (rc[1] ? "t-orange" : "t-blue"), "font-weight": 650, text: v < 0 ? "−" + (-v) : String(v) }, mg);
      });
      mg.style.opacity = 0;

      // readouts, one group per step from s2 on
      var rx = compact ? 140 : 420, ry = compact ? 44 : 128, rdy = compact ? 20 : 24;
      function readout(lines) {
        var g = S("g", {}, svg);
        lines.forEach(function (ln, i) { S("text", { x: rx, y: ry + i * rdy, style: "white-space:pre", class: "t t-mono" + (compact ? " t-sm" : "") + (ln[1] ? " " + ln[1] : ""), text: ln[0] }, g); });
        g.style.opacity = 0;
        return g;
      }
      var R = compact ? [
        readout([["Mx = (0, 3)"]]),
        readout([["Mx = 1·(2, 1) + 2·(−1, 1)"], ["   = (0, 3)"]]),
        readout([["row 1: 2·1 + (−1)·2 = 0"], ["row 2: 1·1 +    1·2 = 3"]]),
        readout([["det M = 2·1 − (−1)·1 = 3"], ["area 1 → area 3"]])
      ] : [
        readout([["x = (1, 2)"], ["Mx = (0, 3)"]]),
        readout([["Mx = 1·(2, 1)"], ["   + 2·(−1, 1)"], ["   = (0, 3)"]]),
        readout([["row 1: 2·1 + (−1)·2 = 0"], ["row 2: 1·1 +    1·2 = 3"]]),
        readout([["det M = 2·1 − (−1)·1"], ["      = 3"], ["area 1 → area 3"]])
      ];
      tl.addLabel("s0", 0);

      // s1: the matrix + ghost columns
      LC.popIn(tl, [mg], { duration: 0.4 });
      LC.popIn(tl, [ghost1, ghost2], { duration: 0.4 });
      tl.addLabel("s1");

      // s2: warp
      tl.to(L0, { opacity: 0, duration: 0.25 });
      LC.popIn(tl, warp, { duration: 0.3 }, "<");
      tl.to(st, { t: 1, duration: 1.6, ease: "power2.inOut", onUpdate: update });
      tl.to([ghost1, ghost2], { opacity: 0, duration: 0.2 }, "-=0.2");
      var L2 = [lbl(2, 1, "col 1", "t-sm t-blue", 8, 14), lbl(-1, 1, "col 2", "t-sm t-orange t-end", -8, -6), lbl(0, 3, "Mx", "t-sm t-end", -10, 6)];
      LC.popIn(tl, L2.concat([R[0]]), { duration: 0.35 });
      tl.addLabel("s2");

      // s3: weighted sum of columns, tip to tail
      var hx = px(0), hy = py(3), ta = Math.atan2(hy - py(1), hx - px(2)), hl = 11;
      var tip = S("path", { d: "M" + px(2) + " " + py(1) + "L" + (hx - hl * 0.8 * Math.cos(ta)).toFixed(2) + " " + (hy - hl * 0.8 * Math.sin(ta)).toFixed(2), class: "s-orange", style: "stroke-width:2.5" }, svg);
      var tipHead = S("path", { d: "M" + (hx - hl * Math.cos(ta - 0.45)).toFixed(2) + " " + (hy - hl * Math.sin(ta - 0.45)).toFixed(2) + "L" + hx + " " + hy +
        "L" + (hx - hl * Math.cos(ta + 0.45)).toFixed(2) + " " + (hy - hl * Math.sin(ta + 0.45)).toFixed(2), class: "s-orange", style: "stroke-width:2.5" }, svg);
      var tipLbl = lbl(1.05, 2.05, "+ 2 × col 2", "t-sm t-orange", 8, 0);
      tl.to(R[0], { opacity: 0, duration: 0.2 });
      LC.drawIn(tl, tip, { duration: 0.7 });
      LC.popIn(tl, [tipHead, tipLbl, R[1]], { duration: 0.3 });
      tl.addLabel("s3");

      // s4: row view
      tl.to(R[1], { opacity: 0, duration: 0.2 });
      LC.popIn(tl, R[2], { duration: 0.35 });
      tl.addLabel("s4");

      // s5: linear + area
      tl.to([R[2], tip, tipHead, tipLbl], { opacity: 0, duration: 0.25 });
      var areaLbl = lbl(0.95, 1.12, "area 3", "t-sm t-orange t-mid", 0, 0);
      LC.popIn(tl, [square, areaLbl, R[3]], { duration: 0.45 });
      tl.addLabel("s5");
      return tl;
    }
  };
})();
