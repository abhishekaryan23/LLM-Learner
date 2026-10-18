/* P2.1: cross-entropy for next-token prediction. Loss = −ln p(correct token).
   Three predictions for "The cat sat on the ___" (correct: "mat"). */
(function () {
  var LC = window.LC;
  var TOK = ["mat", "sofa", "floor", "moon"];
  var DISTS = [
    [0.60, 0.25, 0.10, 0.05],   // decent guess:        −ln 0.60 = 0.51
    [0.95, 0.03, 0.015, 0.005], // confident and right: −ln 0.95 = 0.05
    [0.01, 0.95, 0.03, 0.01]    // confident and wrong: −ln 0.01 = 4.61
  ];
  var LMAX = 5;

  LC.anims["p2-1-xent"] = {
    title: "Cross-entropy: the loss behind every LLM",
    steps: [
      "Input: <em>The cat sat on the ___</em>. The model outputs a <strong>probability for every possible next token</strong> (4 shown; a real vocabulary has 100k+). They sum to 1.",
      "The text actually continues with <strong>mat</strong>. Cross-entropy only asks: <em>how much probability did you give the right answer?</em> Here $p = 0.60$.",
      "The loss is $-\\ln p$. For $p = 0.60$ that's $-\\ln 0.60 = 0.51$. The curve shows the loss for every possible $p$.",
      "<strong>Confident and right</strong> ($p = 0.95$): the loss is only $-\\ln 0.95 = 0.05$. It can never go below 0, which needs $p = 1$.",
      "<strong>Confident and wrong</strong> ($p = 0.01$, most of the mass on <em>sofa</em>): the loss shoots up to $-\\ln 0.01 = 4.61$. The curve is steep near 0, so confident mistakes are punished hard.",
      "Training averages this loss over <strong>every token</strong> in the batch: here $(0.51 + 0.05 + 4.61)/3 = 1.72$. That average is the number in every LLM pretraining loss curve."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 420 } : { w: 640, h: 320 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var tl = gsap.timeline();

      // ---- geometry ----
      var R = compact ? { y0: 48, dy: 30, lab: 62, x0: 70, len: 220 } : { y0: 62, dy: 34, lab: 70, x0: 78, len: 200 };
      var C = compact ? { l: 40, r: W - 14, t: 204, b: 384, head: 184, hx: 4 } : { l: 376, r: W - 20, t: 48, b: 270, head: 20, hx: 340 };
      function lx(p) { return C.l + p * (C.r - C.l); }
      function ly(v) { return C.b - (Math.min(v, LMAX) / LMAX) * (C.b - C.t); }
      function ry(i) { return R.y0 + i * R.dy; }

      // ---- s0: context + bars ----
      S("text", { x: 4, y: 20, class: "t", text: "The cat sat on the ___" }, svg);
      var frame = S("rect", { x: 4, y: ry(0) - 13, width: R.x0 + R.len + 44 - 4, height: 26, rx: 7, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 2 }, svg);
      var bars = [], over, vals = [];
      TOK.forEach(function (t, i) {
        S("text", { x: R.lab, y: ry(i) + 4, class: "t t-sm t-end", text: t, "font-weight": i === 0 ? 650 : 400 }, svg);
        bars.push(S("rect", { x: R.x0, y: ry(i) - 8, height: 16, rx: 3, class: "f-blue", "fill-opacity": 0.75 }, svg));
        vals.push(S("text", { y: ry(i) + 4, class: "t t-sm t-mono", text: "" }, svg));
      });
      over = S("rect", { x: R.x0, y: ry(0) - 8, height: 16, rx: 3, class: "f-orange" }, svg);

      // ---- curve panel (appears at s2) ----
      var cg = S("g", {}, svg);
      [2, 4].forEach(function (v) { S("line", { x1: C.l, x2: C.r, y1: ly(v), y2: ly(v), class: "s-grid" }, cg); });
      S("path", { d: "M" + C.l + " " + C.t + "V" + C.b + "H" + C.r, class: "s-axis" }, cg);
      [0, 2, 4].forEach(function (v) { S("text", { x: C.l - 7, y: ly(v) + 4, class: "t t-sm t-muted t-end", text: v }, cg); });
      [0, 0.5, 1].forEach(function (v) { S("text", { x: lx(v), y: C.b + 18, class: "t t-sm t-muted t-mid", text: v }, cg); });
      S("text", { x: lx(0.75), y: C.b + 18, class: "t t-sm t-muted t-mid", text: "p(correct) →" }, cg);
      S("text", { x: C.hx, y: C.head, class: "t t-sm t-muted", text: "↑ loss = −ln p" }, cg);
      var curve = S("path", { d: LC.fnPath(function (p) { return -Math.log(p); }, Math.exp(-LMAX), 1, lx, ly, 120), class: "s-blue" }, svg);
      var hist = [0, 1, 2].map(function (k) {
        var p = DISTS[k][0];
        return S("circle", { cx: lx(p), cy: ly(-Math.log(p)), r: 5, class: "f-orange", "fill-opacity": 0.5 }, svg);
      });
      var dot = S("circle", { r: 7, class: "f-orange", stroke: "var(--a-ink)", "stroke-width": 1.5 }, svg);
      var dotLbl = S("text", { class: "t t-sm t-orange", text: "" }, svg);
      var mean = (-Math.log(0.6) - Math.log(0.95) - Math.log(0.01)) / 3;
      var meanLn = S("line", { x1: C.l, x2: C.r, y1: ly(mean), y2: ly(mean), class: "s-orange", "stroke-dasharray": "6 5" }, svg);
      meanLn.style.strokeLinecap = "butt"; meanLn.setAttribute("stroke-width", 2);
      var meanLbl = S("text", { x: C.r, y: ly(mean) - 8, class: "t t-sm t-orange t-end", text: "average = " + mean.toFixed(2) }, svg);

      // ---- state: a float index into DISTS ----
      var st = { k: 0 };
      function dist() {
        var a = Math.floor(st.k), b = Math.min(DISTS.length - 1, a + 1), f = st.k - a;
        return DISTS[a].map(function (p, i) { return p + (DISTS[b][i] - p) * f; });
      }
      function render() {
        var d = dist();
        d.forEach(function (p, i) {
          var w = Math.max(1, p * R.len);
          bars[i].setAttribute("width", w);
          vals[i].setAttribute("x", R.x0 + w + 6);
          vals[i].textContent = p.toFixed(2);
        });
        over.setAttribute("width", Math.max(1, d[0] * R.len));
        var p = d[0], L = -Math.log(p);
        dot.setAttribute("cx", lx(p)); dot.setAttribute("cy", ly(L));
        dotLbl.textContent = "loss " + L.toFixed(2);
        if (p >= 0.8) { dotLbl.setAttribute("x", lx(p) - 10); dotLbl.setAttribute("y", ly(L) - 16); dotLbl.setAttribute("text-anchor", "end"); }
        else if (p >= 0.2) { dotLbl.setAttribute("x", lx(p) + 10); dotLbl.setAttribute("y", ly(L) - 12); dotLbl.setAttribute("text-anchor", "start"); }
        else { dotLbl.setAttribute("x", lx(p) + 12); dotLbl.setAttribute("y", ly(L) + 4); dotLbl.setAttribute("text-anchor", "start"); }
      }
      render();
      [frame, over, dot, dotLbl, meanLn, meanLbl].concat(hist).forEach(function (e) { e.style.opacity = 0; });
      cg.style.opacity = 0;
      tl.addLabel("s0", 0);

      // s1: the correct token
      LC.popIn(tl, [frame, over], { duration: 0.4 });
      tl.addLabel("s1");

      // s2: −ln p curve + the point
      tl.to(cg, { opacity: 1, duration: 0.3 });
      LC.drawIn(tl, curve, { duration: 1 });
      LC.popIn(tl, [dot, dotLbl], { duration: 0.3 });
      tl.addLabel("s2");

      // s3: confident and right
      tl.set(hist[0], { opacity: 1 });
      tl.to(st, { k: 1, duration: 1.2, ease: "power2.inOut", onUpdate: render });
      tl.addLabel("s3");

      // s4: confident and wrong
      tl.set(hist[1], { opacity: 1 });
      tl.to(st, { k: 2, duration: 1.4, ease: "power2.inOut", onUpdate: render });
      tl.addLabel("s4");

      // s5: average over tokens
      tl.to(dotLbl, { opacity: 0, duration: 0.25 });
      tl.set(hist[2], { opacity: 1 });
      LC.popIn(tl, [meanLn, meanLbl], { duration: 0.4 });
      tl.addLabel("s5");
      return tl;
    }
  };
})();
