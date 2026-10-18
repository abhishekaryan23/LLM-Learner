/* P6.3: an unrolled vanilla RNN where the first token's signal fades by ×0.5 per step,
   vs an LSTM whose cell state carries it with forget gates ≈ 0.97.
   RNN: 1, .50, .25, .13, .06, .03 (0.5^5 ≈ 0.03). LSTM: 0.97^k → 0.86 after 5 steps. */
(function () {
  var LC = window.LC;
  var T = 6;
  var RNN = [], LSTM = [];
  for (var k = 0; k < T; k++) { RNN.push(Math.pow(0.5, k)); LSTM.push(Math.pow(0.97, k)); }
  function f2(v) { return v >= 0.995 ? "1.0" : v.toFixed(2).replace(/^0/, ""); }
  var TOK = ["A", "·", "·", "·", "·", "·"];

  LC.anims["p6-3-unroll"] = {
    title: "Unrolled: an RNN forgets, an LSTM's cell state remembers",
    steps: [
      "An RNN <strong>unrolled</strong> over 6 steps: one copy per input, all sharing the same weights. The first input is a token <strong>A</strong> we'll need to remember; the rest are filler.",
      "Step 1 reads <strong>A</strong>: the hidden state $h_1$ is full of it (orange = how much of A is left).",
      "Each step pushes the memory through $\\tanh(W h + \\ldots)$ again. With an effective factor of 0.5 per step (illustrative), A <strong>fades</strong>: after 5 steps only $0.5^5 \\approx 0.03$ remains. The telephone game.",
      "Training runs the same chain <strong>backwards</strong>. The gradient that would teach step 1 to keep A shrinks by the same factor at every step: it <strong>vanishes</strong>.",
      "An <strong>LSTM</strong> adds a <strong>cell state</strong> $c$, a conveyor belt running along the top. It's updated by addition: $c_t = f_t \\odot c_{t-1} + i_t \\odot \\tilde{c}_t$.",
      "The <strong>input gate</strong> writes A onto the belt at step 1. The <strong>forget gates</strong> stay near 1 (here 0.97), so A rides along almost intact: $0.97^5 \\approx 0.86$.",
      "At step 6 the <strong>output gate</strong> reads A off the belt. Backwards, the gradient along the belt is the product of the forget gates, so it survives too."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 330 } : { w: 640, h: 352 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact", W = ctx.w;
      var cw = compact ? 40 : 62, gap = compact ? 14 : 28;
      var x0 = (W - (T * cw + (T - 1) * gap)) / 2 + (compact ? 6 : 10);
      var Y = compact
        ? { t1: 16, v1: 36, c1: 44, ch: 34, in1: 98, ih: 24, back: 138, backL: 156, t2: 186, v2: 204, c2: 212, ch2: 42, in2: 276, out: 318 }
        : { t1: 18, v1: 40, c1: 50, ch: 38, in1: 108, ih: 26, back: 152, backL: 172, t2: 202, v2: 222, c2: 232, ch2: 46, in2: 298, out: 342 };
      function cx(i) { return x0 + i * (cw + gap); }
      function ccx(i) { return cx(i) + cw / 2; }
      var tl = gsap.timeline();
      var fs = compact ? "t t-sm" : "t";

      function row(yC, ch, yIn, title, ty) {
        var g = S("g", {}, svg);
        S("text", { x: 4, y: ty, class: "t t-sm", "font-weight": 620, text: title }, g);
        var fills = [];
        for (var i = 0; i < T; i++) {
          if (i) S("line", { x1: cx(i) - gap, x2: cx(i), y1: yC + ch / 2, y2: yC + ch / 2, class: "s-axis" }, g);
          S("rect", { x: cx(i), y: yC, width: cw, height: ch, rx: 7, class: "f-surface", stroke: "var(--a-ink)", "stroke-width": 1.5 }, g);
          var f = S("rect", { x: cx(i), y: yC, width: cw, height: ch, rx: 7, class: "f-orange" }, g);
          f.style.opacity = 0;
          fills.push(f);
          S("line", { x1: ccx(i), x2: ccx(i), y1: yIn, y2: yC + ch, class: "s-axis" }, g);
          S("rect", { x: ccx(i) - 13, y: yIn, width: 26, height: Y.ih, rx: 6, class: i ? "f-surface2" : "f-blue" }, g);
          S("text", { x: ccx(i), y: yIn + Y.ih / 2 + 5, class: "t t-sm t-mid t-nohalo", "font-weight": 650, text: TOK[i], style: i ? "" : "fill:#fff" }, g);
        }
        return { g: g, fills: fills };
      }
      function values(arr, y) {
        return arr.map(function (v, i) {
          var t = S("text", { x: ccx(i), y: y, class: "t t-sm t-mono t-mid t-orange", text: f2(v) }, svg);
          t.style.opacity = 0;
          return t;
        });
      }

      // ---- RNN row (s0) ----
      var A = row(Y.c1, Y.ch, Y.in1, compact ? "vanilla RNN: hidden state h" : "vanilla RNN: hidden state h (same W every step)", Y.t1);
      var vA = values(RNN, Y.v1);
      tl.addLabel("s0", 0);

      // s1: read A
      tl.to(A.fills[0], { opacity: 1, duration: 0.4 }, "+=0.02");
      tl.to(vA[0], { opacity: 1, duration: 0.3 }, "<");
      tl.addLabel("s1");

      // s2: fade forward
      for (var i = 1; i < T; i++) {
        tl.to(A.fills[i], { opacity: Math.max(0.04, RNN[i]), duration: 0.3 }, i === 1 ? "+=0.02" : "-=0.1");
        tl.to(vA[i], { opacity: 1, duration: 0.25 }, "<");
      }
      tl.addLabel("s2");

      // s3: backward gradient
      var back = S("path", { d: "M" + ccx(T - 1) + " " + Y.back + "H" + (ccx(0) + 8), class: "s-orange", "stroke-width": 2.5 }, svg);
      var head = S("path", { d: "M" + (ccx(0) + 16) + " " + (Y.back - 6) + "L" + ccx(0) + " " + Y.back + "L" + (ccx(0) + 16) + " " + (Y.back + 6), class: "s-orange", "stroke-width": 2.5 }, svg);
      var backLbl = S("text", { x: (ccx(0) + ccx(T - 1)) / 2, y: Y.backL, class: "t t-sm t-mid t-orange", text: compact ? "gradient to step 1: 0.5⁵ ≈ 0.03" : "gradient flowing back to step 1: 0.5⁵ ≈ 0.03" }, svg);
      LC.drawIn(tl, back, { duration: 0.8 }, "+=0.02");
      LC.popIn(tl, [head, backLbl], { duration: 0.3 });
      tl.addLabel("s3");

      // s4: LSTM row with cell-state belt
      var B = row(Y.c2, Y.ch2, Y.in2, compact ? "LSTM: cell state c on top" : "LSTM: a cell state c runs along the top", Y.t2);
      B.g.style.opacity = 0;
      var beltY = Y.c2 + 10;
      var belt = S("path", { d: "M" + (cx(0) - 6) + " " + beltY + "H" + (cx(T - 1) + cw + 6), class: "s-blue", "stroke-width": 3 }, svg);
      var cLbl = S("text", { x: cx(0) - 12, y: beltY + 4, class: "t t-sm t-blue t-end", text: "c" }, svg);
      cLbl.style.opacity = 0;
      // the orange overlay shows only the belt band, so A visibly rides along the top
      B.fills.forEach(function (f) { f.setAttribute("height", 20); });
      var vB = values(LSTM, Y.v2);
      tl.to([A.g, back, head], { opacity: 0.35, duration: 0.3 }, "+=0.02");
      tl.to(B.g, { opacity: 1, duration: 0.4 }, "<");
      LC.drawIn(tl, belt, { duration: 0.7 });
      tl.to(cLbl, { opacity: 1, duration: 0.3 }, "<");
      tl.addLabel("s4");

      // s5: write A, carry it
      tl.to(B.fills[0], { opacity: 1, duration: 0.4 }, "+=0.02");
      tl.to(vB[0], { opacity: 1, duration: 0.3 }, "<");
      for (var j = 1; j < T; j++) {
        tl.to(B.fills[j], { opacity: LSTM[j], duration: 0.3 }, "-=0.1");
        tl.to(vB[j], { opacity: 1, duration: 0.25 }, "<");
      }
      tl.addLabel("s5");

      // s6: read it out
      var outBox = S("rect", { x: cx(T - 1) - 4, y: Y.c2 - 4, width: cw + 8, height: Y.ch2 + 8, rx: 9, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 3 }, svg);
      var outLbl = S("text", { x: (ccx(0) + ccx(T - 1)) / 2, y: Y.out, class: "t t-sm t-mid t-orange", "font-weight": 620, text: compact ? "step 6 output: “A” ✓ (gradient ≈ 0.86)" : "step 6 reads “A” ✓ · gradient along c ≈ 0.97⁵ ≈ 0.86" }, svg);
      LC.popIn(tl, [outBox, outLbl], { duration: 0.4 }, "+=0.02");
      tl.addLabel("s6");
      return tl;
    }
  };
})();
