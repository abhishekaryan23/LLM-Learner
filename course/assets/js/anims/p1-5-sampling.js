/* P1.5: a (toy) next-token distribution after "The cat sat on the".
   Probabilities sum to 1; sampling = a uniform r in [0, 1) (here 0.63) landing in a cumulative interval;
   100 draws (numpy default_rng(2), counts 46/23/13/11/3/4) approach the probabilities;
   expectation of word length = Σ p·len = 3.69; a new context gives a new distribution. */
(function () {
  var LC = window.LC;
  var TOK = ["mat", "floor", "sofa", "bed", "roof", "chair"];
  var P1 = [0.45, 0.20, 0.15, 0.10, 0.06, 0.04];
  var P2 = [0.20, 0.40, 0.14, 0.18, 0.02, 0.06];
  var FREQ = [0.46, 0.23, 0.13, 0.11, 0.03, 0.04];
  var R = 0.63;   // falls in floor: [0.45, 0.65)

  LC.anims["p1-5-sampling"] = {
    title: "A next-token distribution: sum, sample, average",
    steps: [
      "After <em>“The cat sat on the”</em>, a (toy) model gives each candidate next word a <strong>probability</strong>. Each is between 0 and 1.",
      "Together they must <strong>sum to 1</strong>: something comes next. Laid end to end they fill the interval from 0 to 1 exactly.",
      "<strong>Sampling</strong>: draw a uniform random number, say $r = 0.63$. It lands in floor's slice ($0.45$ to $0.65$), so the model writes “floor”.",
      "Draw 100 times. The <strong>observed frequencies</strong> (orange) come out close to the probabilities (blue), and get closer with more draws.",
      "The <strong>expectation</strong> is a probability-weighted average. Expected word length: $0.45\\cdot 3 + 0.20\\cdot 5 + \\dots = 3.69$ letters.",
      "Change the context and you get a different distribution. A language model computes a <strong>conditional</strong> distribution, $P(\\text{next token} \\mid \\text{context})$."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 342 } : { w: 640, h: 342 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact", W = ctx.w;
      var labR = compact ? 56 : 120, barL = labR + 8, scale = compact ? 400 : 700, valR = compact ? W - 8 : 560;
      var rowT = 44, rowH = 34;
      var stripL = compact ? 20 : 70, stripW = compact ? 320 : 500, stripY = 276, stripH = 24;
      var tl = gsap.timeline();
      function rowY(i) { return rowT + i * rowH; }

      var ctx1 = S("text", { x: compact ? 10 : 20, y: 22, class: "t", text: "The cat sat on the ___" }, svg);
      var ctx2 = S("text", { x: compact ? 10 : 20, y: 22, class: "t", text: "The dog slept on the ___" }, svg);
      ctx2.style.opacity = 0;
      var st = { k: 0 };   // 0 = context 1, 1 = context 2
      var bars = [], vals1 = [], vals2 = [], fbars = [], fvals = [];
      TOK.forEach(function (t, i) {
        var y = rowY(i);
        S("text", { x: labR, y: y + 15, class: "t t-end", text: t }, svg);
        bars.push(S("rect", { x: barL, y: y + 5, height: 13, rx: 3, width: P1[i] * scale, class: "f-blue" }, svg));
        vals1.push(S("text", { x: valR, y: y + 15, class: "t t-sm t-mono t-blue t-end", text: P1[i].toFixed(2) }, svg));
        vals2.push(S("text", { x: valR, y: y + 15, class: "t t-sm t-mono t-blue t-end", text: P2[i].toFixed(2) }, svg));
        vals2[i].style.opacity = 0;
        fbars.push(S("rect", { x: barL, y: y + 21, height: 7, rx: 2, width: FREQ[i] * scale, class: "f-orange" }, svg));
        fvals.push(S("text", { x: valR, y: y + 31, class: "t t-sm t-mono t-orange t-end", text: FREQ[i].toFixed(2) }, svg));
        fbars[i].style.opacity = 0; fvals[i].style.opacity = 0;
      });
      function setBars() { bars.forEach(function (b, i) { b.setAttribute("width", ((P1[i] + (P2[i] - P1[i]) * st.k) * scale).toFixed(1)); }); }
      tl.addLabel("s0", 0);

      // s1: the 0..1 strip, cumulative
      var strip = S("g", {}, svg), acc = 0;
      TOK.forEach(function (t, i) {
        var x = stripL + acc * stripW, w = P1[i] * stripW, strong = i % 2 === 0;
        S("rect", { x: x, y: stripY, width: w, height: stripH, class: strong ? "f-blue" : "f-faint" }, strip);
        if (w >= 30) {
          var lab = { x: x + w / 2, y: stripY + 16, class: "t t-sm t-mid t-nohalo", text: t };
          if (strong) lab.style = "fill:#fff";
          S("text", lab, strip);
        }
        acc += P1[i];
      });
      S("rect", { x: stripL, y: stripY, width: stripW, height: stripH, class: "f-none", stroke: "var(--a-ink)", "stroke-width": 1.2 }, strip);
      var t0 = S("text", { x: stripL, y: stripY + stripH + 18, class: "t t-sm t-muted t-mid", text: "0" }, strip);
      var t1 = S("text", { x: stripL + stripW, y: stripY + stripH + 18, class: "t t-sm t-muted t-mid", text: "1" }, strip);
      var sumT = S("text", { x: stripL + stripW / 2, y: stripY - 8, class: "t t-sm t-mid", text: "sum = 1.00" }, svg);
      LC.popIn(tl, [strip], { duration: 0.5 });
      tl.to(sumT, { opacity: 1, duration: 0.3 });
      sumT.style.opacity = 0;
      tl.addLabel("s1");

      // s2: one sample r = 0.63
      var rx = stripL + R * stripW;
      var mark = S("path", { d: "M" + rx + " " + (stripY - 4) + "V" + (stripY + stripH + 4), class: "s-orange", style: "stroke-width:3" }, svg);
      var rLbl = S("text", { x: rx, y: stripY + stripH + 18, class: "t t-sm t-orange t-mid", "font-weight": 650, text: "r = 0.63" }, svg);
      var hl = S("rect", { x: 4, y: rowY(1) + 1, width: W - 8, height: rowH - 4, rx: 8, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 2 }, svg);
      tl.to(sumT, { opacity: 0, duration: 0.2 });
      LC.popIn(tl, [mark, rLbl, hl], { duration: 0.4 });
      tl.addLabel("s2");

      // s3: 100 samples
      tl.to([mark, rLbl, hl], { opacity: 0, duration: 0.25 });
      var nLbl = S("text", { x: stripL + stripW / 2, y: stripY - 8, class: "t t-sm t-orange t-mid", text: "orange = share of 100 draws" }, svg);
      fbars.forEach(function (b, i) { tl.fromTo(b, { opacity: 1, attr: { width: 0 } }, { attr: { width: FREQ[i] * scale }, duration: 0.6, ease: "power2.out", immediateRender: false }, i ? "<0.05" : undefined); });
      LC.popIn(tl, fvals.concat([nLbl]), { duration: 0.3 }, "-=0.2");
      tl.addLabel("s3");

      // s4: expectation
      tl.to(fbars.concat(fvals, [nLbl, strip]), { opacity: 0, duration: 0.3 });
      var ex = compact ? [
        S("text", { x: 10, y: stripY + 2, class: "t t-sm t-mono", text: "E[letters] = .45·3 + .20·5 + .15·4" }, svg),
        S("text", { x: 10, y: stripY + 24, class: "t t-sm t-mono", text: "      + .10·3 + .06·4 + .04·5" }, svg),
        S("text", { x: 10, y: stripY + 46, class: "t t-sm t-mono t-orange", "font-weight": 650, text: "           = 3.69" }, svg)
      ] : [
        S("text", { x: stripL, y: stripY + 6, class: "t t-sm t-mono", text: "E[letters] = .45·3 + .20·5 + .15·4 + .10·3 + .06·4 + .04·5" }, svg),
        S("text", { x: stripL, y: stripY + 32, class: "t t-mono t-orange", "font-weight": 650, text: "           = 3.69 letters" }, svg)
      ];
      ex.forEach(function (e) { e.setAttribute("style", "white-space:pre"); });
      LC.popIn(tl, ex, { duration: 0.4, stagger: 0.15 });
      tl.addLabel("s4");

      // s5: new context
      tl.to(ex, { opacity: 0, duration: 0.25 });
      tl.to(ctx1, { opacity: 0, duration: 0.3 }, "<");
      tl.to(ctx2, { opacity: 1, duration: 0.3 });
      tl.to(vals1, { opacity: 0, duration: 0.25 }, "<");
      tl.to(st, { k: 1, duration: 1.0, ease: "power2.inOut", onUpdate: setBars });
      tl.to(vals2, { opacity: 1, duration: 0.3 }, "-=0.3");
      var note = S("text", { x: compact ? 10 : stripL, y: stripY + 6, class: "t t-sm t-mono", text: "P(next | “The dog slept on the”)" }, svg);
      var note2 = S("text", { x: compact ? 10 : stripL, y: stripY + 28, class: "t t-sm t-mono t-muted", text: "still sums to 1 · E[letters] = 4.08" }, svg);
      LC.popIn(tl, [note, note2], { duration: 0.35 });
      tl.addLabel("s5");
      return tl;
    }
  };
})();
