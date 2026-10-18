/* M3.3: PPO's clipped surrogate objective, min(r A, clip(r, 1-eps, 1+eps) A),
   plotted against the probability ratio r for A = +1 and A = -1, eps = 0.2. */
(function () {
  var LC = window.LC;
  var EPS = 0.2, R0 = 0.4, R1 = 1.6;
  function clip(r) { return Math.max(1 - EPS, Math.min(1 + EPS, r)); }
  function obj(r, A) { return Math.min(r * A, clip(r) * A); }

  LC.anims["m3-3-clip"] = {
    title: "PPO's clipped objective (ε = 0.2)",
    steps: [
      "PPO compares the updated policy with the one that sampled the data through the <strong>ratio</strong> $r = \\pi_\\theta(y)/\\pi_{\\text{old}}(y)$. At $r = 1$ nothing has changed yet.",
      "Better than expected ($A &gt; 0$): the plain objective $r\\,A$ (grey) rewards raising the probability <strong>without limit</strong>, so one lucky sample could swing the policy a long way.",
      "PPO's <strong>clipped</strong> objective (orange) goes flat past $1 + \\epsilon = 1.2$: no extra credit for moving more than 20% in one update, so the gradient there is zero.",
      "Worse than expected ($A &lt; 0$): lowering the probability helps, but only down to $1 - \\epsilon = 0.8$. Below that it is flat too.",
      "Because PPO takes the <strong>minimum</strong> of the clipped and plain terms, moves that make things worse are never clipped away. The result: <strong>small, safe steps</strong> inside a trust region, so each batch can be reused for several epochs."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 470 } : { w: 640, h: 292 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      var P = compact
        ? [{ x0: 44, x1: 344, y0: 44, y1: 190 }, { x0: 44, x1: 344, y0: 278, y1: 424 }]
        : [{ x0: 46, x1: 300, y0: 44, y1: 226 }, { x0: 370, x1: 624, y0: 44, y1: 226 }];
      var signs = [1, -1];
      var titles = compact ? ["A > 0: better than expected", "A < 0: worse than expected"] : ["A > 0 (better than expected)", "A < 0 (worse than expected)"];
      var panels = P.map(function (p, k) {
        var A = signs[k];
        var lo = A > 0 ? 0.3 : -1.7, hi = A > 0 ? 1.7 : -0.3;
        var sx = function (r) { return p.x0 + (r - R0) / (R1 - R0) * (p.x1 - p.x0); };
        var sy = function (v) { return p.y1 - (v - lo) / (hi - lo) * (p.y1 - p.y0); };
        var g = S("g", {}, svg);
        S("text", { x: p.x0 - 40, y: p.y0 - 20, class: "t t-sm", text: titles[k], "font-weight": 650 }, g);
        var band = S("rect", { x: sx(1 - EPS), y: p.y0, width: sx(1 + EPS) - sx(1 - EPS), height: p.y1 - p.y0, class: "f-faint", "fill-opacity": 0.35 }, g);
        [1 - EPS, 1 + EPS].forEach(function (r) { S("line", { x1: sx(r), x2: sx(r), y1: p.y0, y2: p.y1, class: "s-grid", "stroke-dasharray": "4 4" }, g); });
        S("line", { x1: sx(1), x2: sx(1), y1: p.y0 + 24, y2: p.y1, class: "s-grid" }, g);
        S("path", { d: "M" + p.x0 + " " + p.y0 + "V" + p.y1 + "H" + p.x1, class: "s-axis" }, g);
        [0.8, 1, 1.2].forEach(function (r) { S("text", { x: sx(r), y: p.y1 + 16, class: "t t-sm t-muted t-mid", text: r }, g); });
        S("text", { x: p.x1, y: p.y1 + 34, class: "t t-sm t-muted t-end", text: "ratio r →" }, g);
        var flat = A > 0 ? 1 + EPS : -(1 - EPS);
        S("text", { x: p.x0 - 6, y: sy(flat) + 4, class: "t t-sm t-muted t-end", text: A > 0 ? "1.2" : "−0.8" }, g);
        var plain = S("path", { d: LC.fnPath(function (r) { return r * A; }, R0, R1, sx, sy, 2), class: "s-faint", "stroke-width": 7, "stroke-linecap": "round" }, svg);
        var clipped = S("path", { d: LC.fnPath(function (r) { return obj(r, A); }, R0, R1, sx, sy, 120), class: "s-orange" }, svg);
        var plainLbl, clipLbl;
        if (A > 0) {
          plainLbl = S("text", { x: sx(1.36), y: sy(1.36) - 12, class: "t t-sm t-muted t-end", text: "r·A" }, svg);
          clipLbl = S("text", { x: sx(1.42), y: sy(1.2) + 20, class: "t t-sm t-orange t-mid", text: "clipped: flat", "font-weight": 650 }, svg);
        } else {
          plainLbl = S("text", { x: sx(1.34), y: sy(-1.3) - 8, class: "t t-sm t-muted", text: "r·A" }, svg);
          clipLbl = S("text", { x: sx(0.6), y: sy(-0.8) + 20, class: "t t-sm t-orange t-mid", text: "clipped: flat", "font-weight": 650 }, svg);
        }
        var bandLbl = S("text", { x: sx(1), y: p.y0 + 16, class: "t t-sm t-mid t-nohalo", text: "1 ± ε" }, svg);
        band.style.opacity = 0;
        return { g: g, plain: plain, clipped: clipped, plainLbl: plainLbl, clipLbl: clipLbl, band: band, bandLbl: bandLbl };
      });
      panels[1].g.style.opacity = 0;
      tl.addLabel("s0", 0);

      var a = panels[0], b = panels[1];
      LC.drawIn(tl, a.plain, { duration: 0.9 });
      LC.popIn(tl, a.plainLbl, { duration: 0.3 });
      tl.addLabel("s1");

      LC.drawIn(tl, a.clipped, { duration: 1 }, "+=0.02");
      LC.popIn(tl, a.clipLbl, { duration: 0.3 });
      tl.addLabel("s2");

      tl.to(b.g, { opacity: 1, duration: 0.3 });
      LC.drawIn(tl, b.plain, { duration: 0.7 });
      LC.popIn(tl, b.plainLbl, { duration: 0.2 });
      LC.drawIn(tl, b.clipped, { duration: 0.9 });
      LC.popIn(tl, b.clipLbl, { duration: 0.3 });
      tl.addLabel("s3");

      LC.popIn(tl, [a.bandLbl, b.bandLbl], { duration: 0.4 });
      tl.to([a.band, b.band], { opacity: 1, duration: 0.4 }, "<");
      tl.addLabel("s4");
      return tl;
    }
  };
})();
