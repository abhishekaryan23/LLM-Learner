/* P3.1: a one-hidden-layer ReLU network is a sum of hinges, i.e. a piecewise-linear curve.
   More hidden units = more bends = a closer fit (universal approximation intuition).
   Target f(x) = 0.8 sin(1.5x) + 0.15x on [0, 2π]. Each fit is the least-squares
   piecewise-linear curve with n equal segments (exactly representable by n ReLUs plus a bias);
   knot values precomputed in Python. "avg error" = mean |fit − f| over 2,001 points. */
(function () {
  var LC = window.LC;
  var TWO_PI = 2 * Math.PI;
  function f(x) { return 0.8 * Math.sin(1.5 * x) + 0.15 * x; }
  var FITS = {
    2: { k: [0.893, -0.084, 1.836], err: "0.29" },
    4: { k: [0.36, 0.94, -0.619, 1.411, 1.302], err: "0.13" },
    8: { k: [0.029, 0.938, 0.871, 0.01, -0.424, 0.246, 1.343, 1.645, 0.972], err: "0.03" },
    16: { k: [0.003, 0.515, 0.879, 0.984, 0.818, 0.455, 0.038, -0.272, -0.352, -0.154, 0.274, 0.809, 1.289, 1.573, 1.586, 1.34, 0.946], err: "0.006" }
  };

  LC.anims["p3-1-relu-sum"] = {
    title: "Hinges add up to any curve",
    steps: [
      "The dashed curve is a target function. Can a network built from simple pieces reproduce it?",
      "One ReLU unit computes $\\max(0,\\, wx + b)$: flat, then a straight ramp. It's a <strong>hinge</strong>, and the bend sits where $wx + b = 0$.",
      "A hidden layer's output is a weighted <strong>sum of hinges</strong> plus a bias. With 2 units you get a line with one bend: a poor fit.",
      "4 units, more bends. Training places each bend and sets each slope.",
      "8 units: already close. Each unit adds one bend to the curve.",
      "16 units: almost indistinguishable. This is the <strong>universal approximation</strong> idea: with enough hidden units, even one hidden layer can get as close as you like to any continuous function on a bounded range."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 300 } : { w: 640, h: 320 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, H = ctx.h, compact = ctx.layout === "compact";
      var m = compact ? { l: 14, r: 12, t: 58, b: 34 } : { l: 24, r: 24, t: 60, b: 36 };
      var Y0 = -0.8, Y1 = 2.0;
      function sx(x) { return m.l + (x / TWO_PI) * (W - m.l - m.r); }
      function sy(v) { return m.t + (1 - (v - Y0) / (Y1 - Y0)) * (H - m.t - m.b); }
      var tl = gsap.timeline();

      // axes and header rows (row 1: legend, row 2: axis title + unit count)
      S("path", { d: "M" + m.l + " " + sy(0) + "H" + (W - m.r), class: "s-grid" }, svg);
      S("path", { d: "M" + m.l + " " + m.t + "V" + (H - m.b) + "H" + (W - m.r), class: "s-axis" }, svg);
      S("text", { x: W - m.r, y: H - 8, class: "t t-sm t-muted t-end", text: "input x →" }, svg);
      S("text", { x: 4, y: 40, class: "t t-sm t-muted", text: "↑ output" }, svg);
      S("path", { d: "M4 14H26", class: "s-ink", "stroke-dasharray": "5 4", "stroke-width": 2 }, svg);
      S("text", { x: 31, y: 18, class: "t t-sm", text: "target" }, svg);
      var legNet = S("g", {}, svg);
      S("path", { d: "M84 14H106", class: "s-orange", "stroke-width": 3 }, legNet);
      S("text", { x: 111, y: 18, class: "t t-sm", text: "network" }, legNet);
      legNet.style.opacity = 0;
      var target = S("path", { d: LC.fnPath(f, 0, TWO_PI, sx, sy, 120), class: "s-ink", "stroke-dasharray": "5 4", "stroke-width": 2 }, svg);
      target.style.opacity = 0.75;
      tl.addLabel("s0", 0);

      // s1: a single hinge
      var hingeX = Math.PI;
      var hinge = S("path", { d: "M" + sx(0) + " " + sy(0) + "H" + sx(hingeX) + "L" + sx(TWO_PI) + " " + sy(0.6 * (TWO_PI - hingeX)), class: "s-orange" }, svg);
      var bend = S("circle", { cx: sx(hingeX), cy: sy(0), r: 4.5, class: "f-orange" }, svg);
      var bendL = S("text", { x: sx(hingeX) - 8, y: sy(0) - 10, class: "t t-sm t-orange t-end", text: "bend" }, svg);
      function lbl(u, e) { // per-step header texts, crossfaded
        // unit count on row 2 (right); error on the bottom row (left). Row 1's right end stays
        // clear for the phone "swipe" hint.
        var a = S("text", { x: W - 4, y: 40, class: "t t-orange t-end" + (compact ? " t-sm" : ""), "font-weight": 650, text: u }, svg);
        var b = S("text", { x: m.l, y: H - 8, class: "t t-sm t-muted", text: e }, svg);
        a.style.opacity = 0; b.style.opacity = 0;
        return [a, b];
      }
      var cur = lbl("1 unit = 1 hinge", "");
      LC.popIn(tl, legNet, { duration: 0.3 }, "+=0.02");
      LC.drawIn(tl, hinge, { duration: 0.8 });
      LC.popIn(tl, [bend, bendL].concat(cur), { duration: 0.3 });
      tl.addLabel("s1");

      // s2..s5: fits with 2, 4, 8, 16 units
      var prev = [hinge, bend, bendL];
      [2, 4, 8, 16].forEach(function (n, si) {
        var F = FITS[n];
        var d = F.k.map(function (v, i) { return (i ? "L" : "M") + sx(TWO_PI * i / n).toFixed(1) + " " + sy(v).toFixed(1); }).join("");
        var p = S("path", { d: d, class: "s-orange" }, svg);
        var dots = S("g", {}, svg);
        F.k.forEach(function (v, i) { if (i > 0 && i < n) S("circle", { cx: sx(TWO_PI * i / n), cy: sy(v), r: n > 8 ? 2.5 : 3.5, class: "f-orange" }, dots); });
        dots.style.opacity = 0;
        var nl = lbl(n + " hidden units", "avg error " + F.err);
        tl.to(prev.concat(cur), { opacity: 0, duration: 0.3 }, "+=0.02");
        LC.drawIn(tl, p, { duration: 0.9 });
        tl.to(dots, { opacity: 1, duration: 0.3 });
        tl.to(nl, { opacity: 1, duration: 0.3 }, "<");
        tl.addLabel("s" + (si + 2));
        prev = [p, dots]; cur = nl;
      });
      return tl;
    }
  };
})();
