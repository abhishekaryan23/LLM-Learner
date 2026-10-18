/* P1.3: the derivative as the limit of secant slopes. f(x) = x² at x = 1:
   slope of the secant from 1 to 1 + h is ((1 + h)² − 1) / h = 2 + h → 4, 3, 2.5, 2.1 → 2. */
(function () {
  var LC = window.LC;
  function f(x) { return x * x; }
  var X0P = 1;

  LC.anims["p1-3-slope"] = {
    title: "From average slope to slope at a point",
    steps: [
      "The curve $f(x) = x^2$ and a point $P = (1, 1)$. Question: <strong>how steep</strong> is the curve exactly at $P$?",
      "Easy to answer between <em>two</em> points. Take $Q$ at $x = 1 + h$ with $h = 2$: the line through them rises 8 over a run of 2, so its slope is $\\frac{8}{2} = 4$.",
      "Move $Q$ closer: $h = 1$. Slope $= \\frac{f(2) - f(1)}{1} = \\frac{4 - 1}{1} = 3$.",
      "Closer: $h = 0.5$ gives slope $\\frac{2.25 - 1}{0.5} = 2.5$.",
      "Closer still: $h = 0.1$ gives slope $\\frac{1.21 - 1}{0.1} = 2.1$. The line now barely differs from the curve near $P$.",
      "As $h \\to 0$ the slope settles on <strong>2</strong>. That limit is the <strong>derivative</strong> $f'(1) = 2$, the slope of the <strong>tangent line</strong>. For $x^2$ it's $2x$ everywhere."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 330 } : { w: 640, h: 320 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact", W = ctx.w, H = ctx.h;
      var m = compact ? { l: 34, r: 14, t: 78, b: 30 } : { l: 44, r: 250, t: 44, b: 32 };
      var XA = -0.4, XB = 3.3, YA = -0.6, YB = 10;
      var pw = W - m.l - m.r, ph = H - m.t - m.b;
      function sx(x) { return m.l + (x - XA) / (XB - XA) * pw; }
      function sy(y) { return m.t + (1 - (y - YA) / (YB - YA)) * ph; }
      var tl = gsap.timeline();
      var id = "p13clip" + Math.random().toString(36).slice(2, 8);
      var cp = S("clipPath", { id: id }, S("defs", {}, svg));
      S("rect", { x: m.l, y: m.t, width: pw, height: ph }, cp);

      [2, 4, 6, 8].forEach(function (v) { S("line", { x1: m.l, x2: W - m.r, y1: sy(v), y2: sy(v), class: "s-grid" }, svg); });
      S("path", { d: "M" + sx(0) + " " + m.t + "V" + (H - m.b) + "M" + m.l + " " + sy(0) + "H" + (W - m.r), class: "s-axis" }, svg);
      [1, 2, 3].forEach(function (x) { S("text", { x: sx(x), y: sy(0) + 17, class: "t t-sm t-muted t-mid", text: x }, svg); });
      [4, 8].forEach(function (v) { S("text", { x: sx(0) - 7, y: sy(v) + 4, class: "t t-sm t-muted t-end", text: v }, svg); });
      S("text", { x: compact ? 8 : m.l - 30, y: m.t - 14, class: "t t-sm t-muted", text: "↑ f(x) = x²" }, svg);
      S("path", { d: LC.fnPath(f, -0.4, Math.sqrt(YB), sx, sy, 80), class: "s-blue" }, svg);

      var st = { h: 2 };
      var plot = S("g", { "clip-path": "url(#" + id + ")" }, svg);
      var sec = S("path", { class: "s-orange", style: "stroke-width:2.5" }, plot);
      var run = S("path", { class: "s-ink", "stroke-dasharray": "4 4", style: "stroke-width:1.5" }, svg);
      var rise = S("path", { class: "s-ink", "stroke-dasharray": "4 4", style: "stroke-width:1.5" }, svg);
      var Pdot = S("circle", { cx: sx(1), cy: sy(1), r: 5.5, class: "f-ink" }, svg);
      var Plbl = S("text", { x: sx(1) + 9, y: sy(1) + 18, class: "t t-sm", "font-weight": 650, text: "P" }, svg);
      var Q = S("circle", { r: 5.5, class: "f-orange" }, svg);
      var Qlbl = S("text", { class: "t t-sm t-orange t-end", "font-weight": 650, text: "Q" }, svg);
      var rx = compact ? 10 : W - m.r + 26, ry = compact ? 22 : m.t + 30;
      var r1 = S("text", { x: rx, y: ry, class: "t t-sm t-mono t-muted", text: "slope = (f(1+h) − f(1)) / h" }, svg);
      var r2 = S("text", { x: rx, y: ry + (compact ? 22 : 30), class: "t t-mono t-orange" + (compact ? " t-sm" : ""), text: "" }, svg);
      function place() {
        var h = st.h, xq = X0P + h, s = (f(xq) - f(X0P)) / h;
        var xa = XA, xb = XB;
        sec.setAttribute("d", "M" + sx(xa).toFixed(2) + " " + sy(1 + s * (xa - 1)).toFixed(2) + "L" + sx(xb).toFixed(2) + " " + sy(1 + s * (xb - 1)).toFixed(2));
        Q.setAttribute("cx", sx(xq).toFixed(2)); Q.setAttribute("cy", sy(f(xq)).toFixed(2));
        Qlbl.setAttribute("x", (sx(xq) - 9).toFixed(2)); Qlbl.setAttribute("y", (sy(f(xq)) - 8).toFixed(2));
        run.setAttribute("d", "M" + sx(1) + " " + sy(1) + "H" + sx(xq).toFixed(2));
        rise.setAttribute("d", "M" + sx(xq).toFixed(2) + " " + sy(1) + "V" + sy(f(xq)).toFixed(2));
        r2.textContent = "h = " + h.toFixed(2) + "  →  slope = " + s.toFixed(2);
      }
      place();
      [sec, run, rise, Q, Qlbl, r2].forEach(function (e) { e.style.opacity = 0; });
      tl.addLabel("s0", 0);

      // s1: secant with h = 2, rise/run labels
      var runL = S("text", { x: sx(2), y: sy(1) - 7, class: "t t-sm t-mid", text: "run 2" }, svg);
      var riseL = S("text", { x: sx(3) - 8, y: sy(5) + 4, class: "t t-sm t-end", text: "rise 8" }, svg);
      LC.popIn(tl, [Q, Qlbl, run, rise, runL, riseL], { duration: 0.4 });
      LC.popIn(tl, [sec, r2], { duration: 0.4 });
      tl.addLabel("s1");

      // s2..s4: shrink h
      tl.to([runL, riseL], { opacity: 0, duration: 0.25 });
      [1, 0.5, 0.1].forEach(function (h, i) {
        tl.to(st, { h: h, duration: 1.1, ease: "power2.inOut", onUpdate: place }, i ? undefined : "<");
        tl.addLabel("s" + (i + 2));
      });

      // s5: tangent
      var tan = S("path", { d: "M" + sx(XA) + " " + sy(1 + 2 * (XA - 1)) + "L" + sx(2.9) + " " + sy(1 + 2 * 1.9), class: "s-ink", style: "stroke-width:2.5" }, plot);
      var tanL = S("text", { x: sx(2), y: sy(1.4), class: "t t-sm", "font-weight": 650, text: compact ? "tangent, slope 2" : "tangent: slope 2" }, svg);
      var r3 = S("text", { x: rx, y: ry + (compact ? 22 : 30), class: "t t-mono" + (compact ? " t-sm" : ""), text: "h → 0  →  f′(1) = 2" }, svg);
      r3.style.opacity = 0;
      tl.to([sec, Q, Qlbl, run, rise, r2], { opacity: 0, duration: 0.3 });
      LC.drawIn(tl, tan, { duration: 0.8 });
      LC.popIn(tl, [tanL, r3], { duration: 0.35 });
      tl.addLabel("s5");
      return tl;
    }
  };
})();
