/* P1.6: surprise, entropy, cross-entropy and KL in bits.
   p = (1/2, 1/4, 1/8, 1/8): surprises 1, 2, 3, 3 bits; H(p) = 1.75.
   q = uniform (1/4 each): −log2 q = 2 for every token; H(p, q) = 2; KL(p‖q) = 0.25.
   One-hot p on "mat": H(p) = 0, H(p, q) = KL = −log2 q(mat) = 2 bits (= ln 4 ≈ 1.39 nats). */
(function () {
  var LC = window.LC;
  var TOK = ["mat", "floor", "sofa", "bed"];
  var P = [0.5, 0.25, 0.125, 0.125], Q = [0.25, 0.25, 0.25, 0.25], P1 = [1, 0, 0, 0];
  var PL = ["1/2", "1/4", "1/8", "1/8"], QL = ["1/4", "1/4", "1/4", "1/4"], P1L = ["1", "0", "0", "0"];

  LC.anims["p1-6-cross-entropy"] = {
    title: "Entropy, cross-entropy and KL, in bits",
    steps: [
      "The <strong>true distribution</strong> $p$ of what comes next (blue): “mat” half the time, “floor” a quarter, “sofa” and “bed” an eighth each.",
      "<strong>Surprise</strong> is $-\\log_2 p(x)$ bits: 1 bit for a 1-in-2 event, 2 bits for 1-in-4, 3 bits for 1-in-8. Rarer means more surprising.",
      "<strong>Entropy</strong> is the <em>average</em> surprise: $H(p) = \\sum_x p(x)\\,(-\\log_2 p(x)) = 1.75$ bits. No predictor can average less than this.",
      "A model doesn't know $p$. It predicts its own distribution $q$ (orange), here a clueless uniform guess of $\\frac14$ each.",
      "<strong>Cross-entropy</strong> $H(p, q)$: outcomes still arrive at the true rates $p$, but you're surprised according to $q$. That's $2$ bits on average.",
      "The extra cost of believing $q$ when the truth is $p$ is the <strong>KL divergence</strong>: $D_{\\mathrm{KL}}(p\\,\\|\\,q) = H(p, q) - H(p) = 0.25$ bits. It's never negative, and 0 only when $q = p$.",
      "In LLM training, the target is the token that actually came next: $p$ is <strong>one-hot</strong>, so $H(p) = 0$ and the loss is just $-\\log q(\\text{mat})$: 2 bits, or $\\ln 4 \\approx 1.39$ nats."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 330 } : { w: 640, h: 330 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact", W = ctx.w;
      var gx0 = compact ? 64 : 150, gx1 = compact ? 356 : 560, gw = (gx1 - gx0) / 4;
      var base = 200, maxH = 120, bw = compact ? 24 : 32, gp = compact ? 4 : 2;   // gp: half-gap between a token's p and q bars
      var rowLx = compact ? 4 : 30;
      var mx0 = gx0, bitPx = compact ? 128 : 170, my = 284;
      var tl = gsap.timeline();
      function cx(i) { return gx0 + gw * (i + 0.5); }
      function rect(i, side, v, cls) {
        var x = side < 0 ? cx(i) - gp - bw : cx(i) + gp;
        return S("rect", { x: x, y: base - v * maxH, width: bw, height: v * maxH, class: cls }, svg);
      }
      function lbls(side, vals, cls, prob) {
        return vals.map(function (t, i) {
          var x = side < 0 ? cx(i) - gp - bw / 2 : cx(i) + gp + bw / 2;
          return S("text", { x: x, y: base - prob[i] * maxH - 6, class: "t t-sm t-mono t-mid " + cls, text: t }, svg);
        });
      }
      S("line", { x1: gx0 - 4, x2: gx1, y1: base, y2: base, class: "s-axis" }, svg);
      TOK.forEach(function (t, i) { S("text", { x: cx(i), y: base + 18, class: "t t-mid", text: t }, svg); });

      // readouts
      function readout(lines) {
        var g = S("g", {}, svg);
        lines.forEach(function (ln, i) { S("text", { x: compact ? 8 : 30, y: 18 + i * 20, style: "white-space:pre", class: "t t-sm t-mono" + (ln[1] ? " " + ln[1] : ""), text: ln[0] }, g); });
        g.style.opacity = 0;
        return g;
      }
      var RD = [
        readout([["p = the true distribution", "t-blue"]]),
        readout([["surprise = −log₂ p(x)   (bits)", "t-blue"]]),
        readout([["H(p) = ½·1 + ¼·2 + ⅛·3 + ⅛·3", "t-blue"], ["     = 1.75 bits", "t-blue"]]),
        readout([["q = the model's prediction", "t-orange"]]),
        readout([["H(p,q) = Σ p(x)·(−log₂ q(x))", "t-orange"], ["       = 2.00 bits", "t-orange"]]),
        readout([["KL(p‖q) = H(p,q) − H(p)"], ["        = 2.00 − 1.75 = 0.25 bits"]]),
        readout([["one-hot p:  H(p) = 0"], ["loss = −log₂ q(mat) = 2 bits"]])
      ];
      RD[0].style.opacity = 1;
      function next(i) { tl.to(RD[i - 1], { opacity: 0, duration: 0.2 }); tl.to(RD[i], { opacity: 1, duration: 0.3 }, "<0.1"); }

      // s0: p bars
      var pb = P.map(function (v, i) { return rect(i, -1, v, "f-blue"); });
      var pl = lbls(-1, PL, "t-blue", P);
      tl.addLabel("s0", 0);

      // s1: surprise row
      var r1L = S("text", { x: rowLx, y: 244, class: "t t-sm t-blue", text: "−log₂p" }, svg);
      var sp = [1, 2, 3, 3].map(function (v, i) { return S("text", { x: cx(i) - gp - bw / 2, y: 244, class: "t t-sm t-mono t-blue t-mid", text: v }, svg); });
      LC.popIn(tl, [r1L].concat(sp), { duration: 0.35, stagger: 0.08 });
      next(1);
      tl.addLabel("s1");

      // s2: entropy -> meter (blue segment)
      var st = { h: 1.75, ce: 1.75, k: 0 };
      var segB = S("rect", { x: mx0, y: my, height: 14, rx: 3, class: "f-blue" }, svg);
      var segO = S("rect", { y: my, height: 14, rx: 3, class: "f-orange" }, svg);
      var hL = S("text", { y: my + 32, class: "t t-sm t-blue t-mid", text: "H(p)" }, svg);
      var kL = S("text", { y: my + 32, class: "t t-sm t-orange t-mid", "font-weight": 650, text: "KL" }, svg);
      var mL = S("text", { x: rowLx, y: my + 12, class: "t t-sm t-muted", text: "bits" }, svg);
      function meter() {
        segB.setAttribute("width", Math.max(0, st.h * bitPx).toFixed(1));
        segO.setAttribute("x", (mx0 + st.h * bitPx).toFixed(1));
        segO.setAttribute("width", Math.max(0, (st.ce - st.h) * bitPx).toFixed(1));
        hL.setAttribute("x", (mx0 + st.h * bitPx / 2).toFixed(1));
        kL.setAttribute("x", (mx0 + (st.h + st.ce) * bitPx / 2).toFixed(1));
      }
      meter();
      segO.style.opacity = 0; kL.style.opacity = 0;
      LC.popIn(tl, [segB, hL, mL], { duration: 0.4 });
      next(2);
      tl.addLabel("s2");

      // s3: q bars
      var qb = Q.map(function (v, i) { return rect(i, 1, v, "f-orange"); });
      var ql = lbls(1, QL, "t-orange", Q);
      LC.popIn(tl, qb.concat(ql), { duration: 0.4, stagger: 0.05 });
      next(3);
      tl.addLabel("s3");

      // s4: cross-entropy row + meter grows
      var r2L = S("text", { x: rowLx, y: 264, class: "t t-sm t-orange", text: "−log₂q" }, svg);
      var sq = Q.map(function (v, i) { return S("text", { x: cx(i) + gp + bw / 2, y: 264, class: "t t-sm t-mono t-orange t-mid", text: "2" }, svg); });
      LC.popIn(tl, [r2L].concat(sq), { duration: 0.35, stagger: 0.06 });
      LC.popIn(tl, [segO], { duration: 0.01 });
      tl.to(st, { ce: 2, duration: 0.7, ease: "power2.out", onUpdate: meter });
      next(4);
      tl.addLabel("s4");

      // s5: KL label
      LC.popIn(tl, [kL], { duration: 0.35 });
      next(5);
      tl.addLabel("s5");

      // s6: one-hot target
      var pl1 = P1L.map(function (t, i) { return S("text", { x: cx(i) - gp - bw / 2, y: base - P1[i] * maxH - 6, class: "t t-sm t-mono t-mid t-blue", text: t }, svg); });
      pl1.forEach(function (e) { e.style.opacity = 0; });
      var sp1 = S("text", { x: cx(0) - gp - bw / 2, y: 244, class: "t t-sm t-mono t-blue t-mid", text: "0" }, svg);
      sp1.style.opacity = 0;
      tl.to(pl.concat(sp, [hL]), { opacity: 0, duration: 0.25 });
      P1.forEach(function (v, i) { tl.to(pb[i], { attr: { y: base - v * maxH, height: v * maxH }, duration: 0.7, ease: "power2.inOut" }, i ? "<" : undefined); });
      tl.to(st, { h: 0, duration: 0.7, ease: "power2.inOut", onUpdate: meter }, "<");
      tl.to(pl1.concat([sp1]), { opacity: 1, duration: 0.3 });
      tl.to(sq.slice(1), { opacity: 0.3, duration: 0.3 }, "<");
      next(6);
      tl.addLabel("s6");
      return tl;
    }
  };
})();
