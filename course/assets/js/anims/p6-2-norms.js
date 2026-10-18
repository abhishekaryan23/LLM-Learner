/* P6.2: which numbers does each norm average over? A mini-batch of activations,
   rows = examples (tokens), columns = features. BatchNorm: per column, across the batch.
   LayerNorm: per row, across features. RMSNorm: per row, rescale only. */
(function () {
  var LC = window.LC;
  var R = 4, C = 6;
  // fixed shading pattern so the grid looks like data
  var V = [
    [0.55, 0.2, 0.85, 0.35, 0.6, 0.15],
    [0.3, 0.75, 0.45, 0.9, 0.25, 0.5],
    [0.8, 0.4, 0.15, 0.6, 0.7, 0.35],
    [0.25, 0.65, 0.5, 0.2, 0.45, 0.85]
  ];

  LC.anims["p6-2-norms"] = {
    title: "BatchNorm vs LayerNorm vs RMSNorm: which axis?",
    steps: [
      "Activations for a mini-batch. Each <strong>row</strong> is one example (in a Transformer: one token), each <strong>column</strong> one feature.",
      "<strong>BatchNorm</strong> computes one mean and variance <strong>per column</strong>: the same feature, across all examples in the batch.",
      "So each output depends on the <em>other</em> examples. With a batch of one, a dense layer's column holds a single value: $x - \\mu_B = 0$, always. At test time BatchNorm switches to running averages instead.",
      "<strong>LayerNorm</strong> computes one mean and variance <strong>per row</strong>: across one example's own features.",
      "Every row is normalized on its own, so batch size, padding and sequence length don't matter, and training computes exactly what generation does, one token at a time.",
      "<strong>RMSNorm</strong> uses the same rows but skips the mean: it divides each row by its root mean square, $x / \\mathrm{RMS}(x)$, then applies a learned scale $\\gamma$."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 268 } : { w: 640, h: 292 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact", W = ctx.w;
      var G = compact
        ? { x0: 70, y0: 58, cw: 40, ch: 32, gap: 4, headY: 22, axisY: 46, noteY: [226, 248] }
        : { x0: 150, y0: 64, cw: 56, ch: 34, gap: 6, headY: 24, axisY: 50, noteY: [250, 274] };
      var gw = C * G.cw + (C - 1) * G.gap, gh = R * G.ch + (R - 1) * G.gap;
      function cx(c) { return G.x0 + c * (G.cw + G.gap); }
      function cy(r) { return G.y0 + r * (G.ch + G.gap); }
      var tl = gsap.timeline();

      // grid
      S("text", { x: G.x0 + gw / 2, y: G.axisY, class: "t t-sm t-muted t-mid", text: "features →" }, svg);
      var rowsG = [];
      for (var r = 0; r < R; r++) {
        var rg = S("g", {}, svg);
        S("text", { x: G.x0 - 8, y: cy(r) + G.ch / 2 + 4, class: "t t-sm t-muted t-end", text: compact ? "ex " + (r + 1) : "example " + (r + 1) }, rg);
        for (var c = 0; c < C; c++) {
          S("rect", { x: cx(c), y: cy(r), width: G.cw, height: G.ch, rx: 4, class: "f-blue", "fill-opacity": (0.15 + 0.7 * V[r][c]).toFixed(2) }, rg);
        }
        rowsG.push(rg);
      }
      tl.addLabel("s0", 0);

      // headers and notes, one per step (swapped in place)
      function head(txt, cls) { var t = S("text", { x: W / 2, y: G.headY, class: "t t-mid " + (cls || ""), "font-weight": 620, text: txt }, svg); t.style.opacity = 0; return t; }
      function note(a, b) {
        var t1 = S("text", { x: W / 2, y: G.noteY[0], class: "t t-sm t-mid", text: a }, svg);
        var t2 = S("text", { x: W / 2, y: G.noteY[1], class: "t t-sm t-mid t-muted", text: b }, svg);
        t1.style.opacity = 0; t2.style.opacity = 0;
        return [t1, t2];
      }
      var hBN = head(compact ? "BatchNorm (2015)" : "BatchNorm (Ioffe & Szegedy, 2015)", "t-orange");
      var hLN = head(compact ? "LayerNorm (2016)" : "LayerNorm (Ba, Kiros & Hinton, 2016)", "t-orange");
      var hRMS = head(compact ? "RMSNorm (2019)" : "RMSNorm (Zhang & Sennrich, 2019)", "t-orange");
      var n1 = note("one mean & variance per column,", "computed across the batch");
      var n2 = note("batch of 1: the column is one value,", "so x − μ = 0 for every input");
      var n3 = note("one mean & variance per row,", "across that example's own features");
      var n4 = note("each row on its own: any batch size,", "and training matches generation");
      var n5 = note("x / RMS(x) · γ for each row:", "no mean subtraction, no shift");

      // column outline (BatchNorm)
      var COL = 2;
      var colBox = S("rect", { x: cx(COL) - 4, y: G.y0 - 4, width: G.cw + 8, height: gh + 8, rx: 7, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 3 }, svg);
      colBox.style.opacity = 0;
      // row outlines (LayerNorm / RMSNorm)
      var rowBoxes = [];
      for (var k = 0; k < R; k++) {
        var rb = S("rect", { x: G.x0 - 4, y: cy(k) - 3, width: gw + 8, height: G.ch + 6, rx: 7, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 3 }, svg);
        rb.style.opacity = 0;
        rowBoxes.push(rb);
      }

      // s1: BatchNorm column
      tl.to([hBN].concat(n1), { opacity: 1, duration: 0.3 }, "+=0.02");
      tl.to(colBox, { opacity: 1, duration: 0.4 }, "<");
      tl.addLabel("s1");

      // s2: batch of one
      tl.to(n1, { opacity: 0, duration: 0.2 }, "+=0.02");
      tl.to(rowsG.slice(1), { opacity: 0.12, duration: 0.4 }, "<");
      tl.to(colBox, { attr: { height: G.ch + 8 }, duration: 0.4 }, "<");
      tl.to(n2, { opacity: 1, duration: 0.3 });
      tl.addLabel("s2");

      // s3: LayerNorm row
      tl.to([hBN, colBox].concat(n2), { opacity: 0, duration: 0.25 }, "+=0.02");
      tl.to(rowsG.slice(1), { opacity: 1, duration: 0.4 }, "<");
      tl.to([hLN].concat(n3), { opacity: 1, duration: 0.3 });
      tl.to(rowBoxes[1], { opacity: 1, duration: 0.4 }, "<");
      tl.addLabel("s3");

      // s4: every row on its own
      tl.to(n3, { opacity: 0, duration: 0.2 }, "+=0.02");
      tl.to([rowBoxes[0], rowBoxes[2], rowBoxes[3]], { opacity: 1, duration: 0.3, stagger: 0.15 }, "<");
      tl.to(n4, { opacity: 1, duration: 0.3 });
      tl.addLabel("s4");

      // s5: RMSNorm
      tl.to([hLN].concat(n4), { opacity: 0, duration: 0.25 }, "+=0.02");
      tl.to([hRMS].concat(n5), { opacity: 1, duration: 0.3 });
      tl.addLabel("s5");
      return tl;
    }
  };
})();
