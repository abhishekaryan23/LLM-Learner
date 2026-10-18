/* P2.1: mean squared error, built up from residuals, then the loss landscape.
   Data: five points; the model is a line ŷ = w·x + b with b fixed at 0.5.
   First guess w = 0.5 (MSE 3.55), better guess w = 1 (MSE 0.30). */
(function () {
  var LC = window.LC;
  var X = [1, 2, 3, 4, 5], Y = [1.5, 3.5, 3, 5, 5.5], B = 0.5, W1 = 0.5, W2 = 1;
  LC.p21Data = { x: X, y: Y }; // shared with the playground
  function mse(w) {
    var s = 0;
    for (var i = 0; i < X.length; i++) { var e = Y[i] - (w * X[i] + B); s += e * e; }
    return s / X.length;
  }
  function f2(v) { return (v < 0 ? "−" : "") + Math.abs(v).toFixed(2); }

  LC.anims["p2-1-mse"] = {
    title: "Mean squared error, built from scratch",
    steps: [
      "Five training examples $(x_i, y_i)$. We want a model that predicts $y$ from $x$. Our model is a line, $\\hat y = w\\,x + b$.",
      "A first guess: $w = 0.5$, $b = 0.5$. The line is the model's <strong>prediction</strong> $\\hat y$ for every $x$.",
      "The <strong>error</strong> (residual) for each point is $y_i - \\hat y_i$: the vertical gap between the dot and the line. Here they are $0.5, 2, 1, 2.5, 2.5$.",
      "<strong>Square</strong> each error: $0.25, 4, 1, 6.25, 6.25$. Squaring makes every error positive and punishes big misses much more than small ones.",
      "<strong>Average</strong> them: $(0.25 + 4 + 1 + 6.25 + 6.25)/5 = 3.55$. That single number is the <strong>mean squared error</strong>, the loss for this guess.",
      "Tilt the line to $w = 1$: every gap shrinks, the squares collapse, and the MSE drops to <strong>0.30</strong>. Lower loss = better fit.",
      "Do this for every slope $w$ and you get the <strong>loss landscape</strong>: a smooth bowl. Training means finding its bottom, here at $w \\approx 1.05$. Gradient descent (P2.2) does exactly that."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 468 } : { w: 640, h: 330 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, H = ctx.h, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      var main = S("g", {}, svg);

      // ---- geometry ----
      var P = compact ? { l: 36, r: W - 12, t: 44, b: 204 } : { l: 40, r: 300, t: 44, b: 280 };  // scatter plot
      var Y1 = 6;
      function sx(x) { return P.l + (x / 6) * (P.r - P.l); }
      function sy(y) { return P.b - (y / Y1) * (P.b - P.t); }
      // bars panel
      var Bp = compact ? { head: 252, base: 430, unit: 24, val: 448 } : { head: 20, base: 270, unit: 31, val: 288, lab: 308 };
      function bx(i) { return compact ? sx(X[i]) : 386 + i * 52; }
      var bw = compact ? 26 : 30;

      // ---- scatter axes (s0) ----
      [2, 4, 6].forEach(function (v) { S("line", { x1: P.l, x2: P.r, y1: sy(v), y2: sy(v), class: "s-grid" }, main); });
      S("path", { d: "M" + P.l + " " + P.t + "V" + P.b + "H" + P.r, class: "s-axis" }, main);
      [0, 2, 4, 6].forEach(function (v) { S("text", { x: P.l - 7, y: sy(v) + 4, class: "t t-sm t-muted t-end", text: v }, main); });
      [1, 2, 3, 4, 5].forEach(function (v) { S("text", { x: sx(v), y: P.b + 17, class: "t t-sm t-muted t-mid", text: v }, main); });
      S("text", { x: P.r, y: P.b + 17, class: "t t-sm t-muted t-end", text: "x →" }, main);
      S("text", { x: 4, y: 18, class: "t t-sm t-muted", text: "↑ y" }, main);

      // residuals + line + points (residuals under points)
      var resG = S("g", {}, main);
      var res = X.map(function () {
        var l = S("line", { class: "s-ink", "stroke-dasharray": "3 3" }, resG);
        l.style.strokeLinecap = "butt";
        return l;
      });
      var line = S("path", { class: "s-orange" }, main);
      X.forEach(function (x, i) { S("circle", { cx: sx(x), cy: sy(Y[i]), r: 5.5, class: "f-blue" }, main); });
      var eq = S("text", { x: compact ? 52 : P.r, y: 18, class: "t t-sm t-mono t-orange" + (compact ? "" : " t-end"), text: "" }, main);

      // ---- bars panel ----
      var barsG = S("g", {}, main);
      var head1 = S("text", { x: compact ? 4 : 360, y: Bp.head, class: "t t-sm t-muted", text: "squared errors e²" }, barsG);
      var head2 = S("text", { x: compact ? W - 8 : W - 12, y: Bp.head, class: "t t-sm t-orange t-end", text: "" }, barsG);
      var baseLn = S("line", { x1: (compact ? sx(1) : bx(0)) - bw / 2 - 8, x2: (compact ? sx(5) : bx(4)) + bw / 2 + 8, y1: Bp.base, y2: Bp.base, class: "s-axis" }, barsG);
      var bars = X.map(function (_, i) { return S("rect", { x: bx(i) - bw / 2, width: bw, rx: 3, class: "f-blue", "fill-opacity": 0.75 }, barsG); });
      var bLbl = X.map(function (_, i) { return S("text", { x: bx(i), class: "t t-sm t-mono t-mid", text: "" }, barsG); });
      var xLbl = compact ? [] : X.map(function (x, i) { return S("text", { x: bx(i), y: Bp.lab, class: "t t-sm t-muted t-mid", text: "x=" + x }, barsG); });
      var meanLn = S("line", { x1: (compact ? sx(1) : bx(0)) - bw / 2 - 8, x2: (compact ? sx(5) : bx(4)) + bw / 2 + 8, class: "s-orange", "stroke-dasharray": "6 5" }, barsG);
      meanLn.style.strokeLinecap = "butt";
      meanLn.setAttribute("stroke-width", 2.5);

      // ---- one state drives the line, residuals, bars and readouts ----
      var st = { w: W1 };
      function lineD(w) {
        var xEnd = Math.min(6, (Y1 - B) / w);
        return "M" + sx(0) + " " + sy(B) + "L" + sx(xEnd) + " " + sy(w * xEnd + B);
      }
      function render() {
        var w = st.w;
        line.setAttribute("d", lineD(w));
        eq.textContent = "ŷ = " + w.toFixed(2) + "x + " + B.toFixed(2);
        X.forEach(function (x, i) {
          var yh = w * x + B, e = Y[i] - yh, e2 = e * e;
          res[i].setAttribute("x1", sx(x)); res[i].setAttribute("x2", sx(x));
          res[i].setAttribute("y1", sy(Y[i])); res[i].setAttribute("y2", sy(yh));
          var h = e2 * Bp.unit;
          bars[i].setAttribute("y", Bp.base - h); bars[i].setAttribute("height", Math.max(0, h));
          bLbl[i].setAttribute("y", Bp.val);
          bLbl[i].textContent = e2.toFixed(2);
        });
        var m = mse(w);
        meanLn.setAttribute("y1", Bp.base - m * Bp.unit); meanLn.setAttribute("y2", Bp.base - m * Bp.unit);
        head2.textContent = "MSE = " + m.toFixed(2);
      }
      // build the line at its longest so the dash pattern always covers it, then render
      line.setAttribute("d", lineD(W2));
      tl.addLabel("s0", 0);

      // s1: the first guess
      var dl = LC.drawIn(tl, line, { duration: 0.9 });
      render();
      LC.popIn(tl, eq, { duration: 0.3 }, "-=0.3");
      tl.addLabel("s1");

      // s2: residuals
      LC.popIn(tl, res, { duration: 0.35, stagger: 0.12 }, "+=0.05");
      tl.addLabel("s2");

      // s3: squared errors as bars
      LC.popIn(tl, [head1, baseLn].concat(xLbl), { duration: 0.3 });
      bars.forEach(function (b) { b.style.opacity = 0; });
      bLbl.forEach(function (t) { t.style.opacity = 0; });
      bars.forEach(function (b, i) {
        tl.to([b, bLbl[i]], { opacity: 1, duration: 0.3 }, i ? "<0.12" : undefined);
      });
      tl.addLabel("s3");

      // s4: the mean
      LC.popIn(tl, [meanLn, head2], { duration: 0.4 });
      tl.addLabel("s4");

      // s5: a better line
      tl.to(st, { w: W2, duration: 1.6, ease: "power2.inOut", onUpdate: render });
      tl.addLabel("s5");

      // s6: the loss landscape (replaces the picture)
      var land = S("g", {}, svg);
      land.style.opacity = 0;
      var Lp = compact ? { l: 40, r: W - 14, t: 56, b: 390 } : { l: 52, r: W - 24, t: 48, b: 280 };
      var WMIN = 0, WMAX = 2, LMAX = 13;
      function lx(w) { return Lp.l + ((w - WMIN) / (WMAX - WMIN)) * (Lp.r - Lp.l); }
      function ly(v) { return Lp.b - (v / LMAX) * (Lp.b - Lp.t); }
      [5, 10].forEach(function (v) { S("line", { x1: Lp.l, x2: Lp.r, y1: ly(v), y2: ly(v), class: "s-grid" }, land); });
      S("path", { d: "M" + Lp.l + " " + Lp.t + "V" + Lp.b + "H" + Lp.r, class: "s-axis" }, land);
      [0, 5, 10].forEach(function (v) { S("text", { x: Lp.l - 7, y: ly(v) + 4, class: "t t-sm t-muted t-end", text: v }, land); });
      [0, 0.5, 1, 1.5].forEach(function (v) { S("text", { x: lx(v), y: Lp.b + 18, class: "t t-sm t-muted t-mid", text: v }, land); });
      S("text", { x: Lp.r, y: Lp.b + 18, class: "t t-sm t-muted t-end", text: "slope w →" }, land);
      S("text", { x: 4, y: 18, class: "t t-sm t-muted", text: "↑ MSE (with b = 0.5)" }, land);
      var bowl = S("path", { d: LC.fnPath(mse, WMIN, WMAX, lx, ly, 80), class: "s-blue" }, land);
      var p1 = S("circle", { cx: lx(W1), cy: ly(mse(W1)), r: 7, class: "f-orange" }, land);
      var p1l = S("text", { x: lx(W1) + 12, y: ly(mse(W1)) + 4, class: "t t-sm t-orange", text: "first guess 3.55" }, land);
      var p2 = S("circle", { cx: lx(W2), cy: ly(mse(W2)), r: 7, class: "f-orange" }, land);
      var p2l = compact
        ? S("text", { x: lx(1.45), y: ly(mse(W2)) + 4, class: "t t-sm t-orange", text: "← w = 1: 0.30" }, land)
        : S("text", { x: lx(W2), y: ly(mse(W2)) - 40, class: "t t-sm t-orange t-mid", text: "w = 1: MSE 0.30" }, land);
      tl.to(main, { opacity: 0, duration: 0.4 });
      tl.set(land, { opacity: 1 });
      LC.drawIn(tl, bowl, { duration: 1 });
      LC.popIn(tl, [p1, p1l], { duration: 0.3 }, "-=0.4");
      LC.popIn(tl, [p2, p2l], { duration: 0.3 });
      tl.addLabel("s6");
      return tl;
    }
  };
})();
