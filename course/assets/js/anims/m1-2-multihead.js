/* M1.2: multi-head attention for the query "bank" in "I sat by the river bank".
   One head (weights = M1.1's softmax row for bank) vs four heads with d_k = d_model / h = 2.
   Head weights are illustrative (each row sums to 1); real heads are messier. */
(function () {
  var LC = window.LC;
  var TOKS = ["I", "sat", "by", "the", "river", "bank"];
  var QI = 5;
  function softmax(x) {
    var m = Math.max.apply(null, x), e = x.map(function (v) { return Math.exp(v - m); });
    var s = e.reduce(function (a, b) { return a + b; }, 0);
    return e.map(function (v) { return v / s; });
  }
  var ONE = softmax([-0.4, 0.3, 0.1, -0.6, 2.3, 1.1]); // same row as the M1.1 animation
  var HEADS = [
    { name: "topic", w: [0.03, 0.05, 0.04, 0.03, 0.70, 0.15] },
    { name: "preposition", w: [0.03, 0.08, 0.66, 0.10, 0.05, 0.08] },
    { name: "verb", w: [0.12, 0.62, 0.08, 0.04, 0.06, 0.08] },
    { name: "broad", w: [0.17, 0.16, 0.16, 0.15, 0.17, 0.19] }
  ];
  var QV = [0.9, 0.3, 0.7, 0.5, 0.35, 0.95, 0.6, 0.2];      // bank's query, d_model = 8
  var HOUT = [0.85, 0.4, 0.3, 0.9, 0.7, 0.25, 0.5, 0.55];   // concatenated head outputs
  var OUT = [0.6, 0.8, 0.45, 0.7, 0.9, 0.35, 0.65, 0.5];    // after W_O

  LC.anims["m1-2-multihead"] = {
    title: "Multi-head attention: four views of “bank”",
    steps: [
      "With <strong>one head</strong>, bank gets one set of weights that must sum to 1: 0.60 on river, and every other relation shares what's left.",
      "Split instead. bank's query has $d_{\\text{model}} = 8$ numbers; with $h = 4$ heads, each head gets its own slice of $d_k = 8/4 = 2$. Keys and values are split the same way, so <strong>each head has its own</strong> $W_Q, W_K, W_V$.",
      "Each head runs its <strong>own softmax</strong> over the same six tokens. Here H1 looks at the topic (<em>river</em>), H2 at the preposition (<em>by</em>), H3 at the verb (<em>sat</em>), H4 spreads out. (Illustrative weights.)",
      "Each head blends <em>its own</em> values into 2 numbers. <strong>Concatenating</strong> the four results gives back 8 numbers, one slice per head.",
      "Finally the <strong>output projection</strong> $W_O$ (8 × 8) mixes the slices, so information from every head can reach every dimension of bank's new vector.",
      "Cost check: one head's $W_Q$ is 8 × 8; four heads' $W_Q^{(i)}$ are four 8 × 2 slices: the <strong>same 64 numbers</strong>. With $W_K, W_V, W_O$ that's $4\\,d_{\\text{model}}^2$ parameters either way.",
      "When generating, every head's keys and values are cached (M1.5). <strong>GQA</strong> lets groups of query heads share one K/V head, and <strong>MQA</strong> shares a single one, shrinking that cache."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 446 } : { w: 640, h: 420 }; },
    build: function (svg, ctx) {
      var S = LC.svg, Wd = ctx.w, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      var labW = compact ? 30 : 138, boxW = compact ? 48 : 70, gap = compact ? 5 : 9;
      var x0 = labW + 8;
      function cx(i) { return x0 + i * (boxW + gap) + boxW / 2; }
      var rowW = 6 * boxW + 5 * gap, xEnd = x0 + rowW;
      var tokY = compact ? 26 : 8, tokH = 34, dy = compact ? 18 : 0;
      var oneHdrY = 66 + dy, oneY = 74 + dy, rowH = 30;
      var splitHdrY = 130 + dy, splitY = 140 + dy, cell = compact ? 12 : 18, cg = compact ? 2 : 4;
      var headsHdrY = 196 + dy, headsY = 204 + dy, hRowH = compact ? 30 : 28, hGap = compact ? 5 : 5;
      var catHdrY = headsY + 4 * (hRowH + hGap) + 26, catY = catHdrY + 9;

      var main = S("g", {}, svg);
      // tokens
      TOKS.forEach(function (t, i) {
        S("rect", { x: cx(i) - boxW / 2, y: tokY, width: boxW, height: tokH, rx: 8, class: "f-surface", stroke: i === QI ? "var(--a-orange)" : "var(--line)", "stroke-width": i === QI ? 2.5 : 1.5 }, main);
        S("text", { x: cx(i), y: tokY + 22, class: "t t-mid" + (compact ? " t-sm" : ""), text: t, "font-weight": i === QI ? 650 : 450 }, main);
      });
      if (!compact) S("text", { x: 4, y: tokY + 22, class: "t t-sm t-muted", text: "query: bank" }, main);

      function weightRow(parent, y, h, w) {
        var g = S("g", {}, parent);
        w.forEach(function (v, j) {
          S("rect", { x: cx(j) - boxW / 2, y: y, width: boxW, height: h, rx: 5, class: "f-blue", "fill-opacity": (0.08 + 0.92 * v).toFixed(2) }, g);
          S("text", { x: cx(j), y: y + h / 2 + 4.5, class: "t t-sm t-mono t-mid t-nohalo", text: v.toFixed(2), style: v > 0.45 ? "fill:#fff" : "" }, g);
        });
        return g;
      }
      function cellRow(parent, x, y, vec, cls, groupGap) {
        var g = S("g", {}, parent), parts = [];
        vec.forEach(function (v, d) {
          var extra = groupGap ? Math.floor(d / 2) * groupGap : 0;
          parts.push(S("rect", { x: x + d * (cell + cg) + extra, y: y, width: cell, height: cell, rx: 3, class: cls, "fill-opacity": (0.25 + 0.75 * v).toFixed(2) }, g));
        });
        return { g: g, parts: parts };
      }

      // s0: one head
      var oneHdr = S("text", { x: compact ? 4 : x0, y: oneHdrY - 6, class: "t t-sm t-muted", text: compact ? "1 head (d_k = 8)" : "one head, d_k = 8: one set of weights" }, main);
      var oneRow = weightRow(main, oneY, rowH, ONE);
      var oneLbl = compact ? null : S("text", { x: labW, y: oneY + rowH / 2 + 4, class: "t t-sm t-end", text: "1 head" }, main);
      tl.addLabel("s0", 0);

      // s1: split the query into 4 slices of 2
      var qW = 8 * cell + 7 * cg, gGap = compact ? 14 : 22, qWsplit = qW + 3 * gGap;
      var qx = compact ? (Wd - qWsplit) / 2 + 10 : x0 + (rowW - qWsplit) / 2;
      var splitHdr = S("text", { x: compact ? 4 : x0, y: splitHdrY - 4, class: "t t-sm t-muted", text: compact ? "bank's q: 8 numbers → 4 heads × 2" : "bank's query: 8 numbers, split into 4 heads of d_k = 2" }, main);
      var q = cellRow(main, qx + 3 * gGap / 2, splitY, QV, "f-orange", 0);
      var qLbl = S("text", { x: qx - 8, y: splitY + cell - 3, class: "t t-sm t-orange t-end", text: "q" }, main);
      var hLbls = [0, 1, 2, 3].map(function (k) {
        return S("text", { x: qx + k * (2 * (cell + cg) + gGap) + cell + cg / 2, y: splitY + cell + 17, class: "t t-sm t-mid t-orange", text: "H" + (k + 1) }, main);
      });
      LC.popIn(tl, [splitHdr, q.g, qLbl], { duration: 0.4 });
      q.parts.forEach(function (r, d) {
        tl.to(r, { x: "+=" + (Math.floor(d / 2) * gGap - 3 * gGap / 2), duration: 0.6, ease: "power2.inOut" }, d ? "<" : "+=0.1");
      });
      LC.popIn(tl, hLbls, { duration: 0.3, stagger: 0.08 });
      tl.to([oneRow], { opacity: 0.35, duration: 0.3 }, "<");
      tl.addLabel("s1");

      // s2: four heads, four softmaxes
      var headsHdr = S("text", { x: compact ? 4 : x0, y: headsHdrY - 6, class: "t t-sm t-muted", text: compact ? "4 heads, 4 softmaxes" : "four heads, four separate softmaxes" }, main);
      var hRows = HEADS.map(function (h, k) {
        var y = headsY + k * (hRowH + hGap);
        var g = weightRow(main, y, hRowH, h.w);
        S("text", { x: labW, y: y + hRowH / 2 + 4, class: "t t-sm t-end", text: compact ? "H" + (k + 1) : "H" + (k + 1) + " · " + h.name }, g);
        return g;
      });
      LC.popIn(tl, [headsHdr], { duration: 0.3 });
      LC.popIn(tl, hRows, { duration: 0.4, stagger: 0.25 });
      tl.addLabel("s2");

      // s3: concat the head outputs
      var catX = compact ? 30 : x0;
      var catHdr = S("text", { x: compact ? 4 : x0, y: catHdrY - 6, class: "t t-sm t-muted", text: compact ? "concatenate, then × W_O" : "each head returns 2 numbers → concatenate, then × W_O" }, main);
      var cat = cellRow(main, catX, catY, HOUT, "f-ink", compact ? 6 : 8);
      var catW = 8 * cell + 7 * cg + 3 * (compact ? 6 : 8);
      var catLbls = [0, 1, 2, 3].map(function (k) {
        var gx = catX + k * (2 * (cell + cg) + (compact ? 6 : 8)) + cell + cg / 2;
        return S("text", { x: gx, y: catY + cell + 15, class: "t t-sm t-mid t-muted", text: "H" + (k + 1) }, main);
      });
      LC.popIn(tl, [catHdr], { duration: 0.3 });
      LC.popIn(tl, cat.parts, { duration: 0.25, stagger: 0.06 });
      LC.popIn(tl, catLbls, { duration: 0.3 }, "<");
      tl.addLabel("s3");

      // s4: W_O mixes them into the output
      var arrX0 = catX + catW + 8, arrX1 = arrX0 + (compact ? 34 : 70);
      var arrow = S("path", { d: "M" + arrX0 + " " + (catY + cell / 2) + "H" + arrX1 + "m-6 -5l6 5l-6 5", class: "s-ink", "stroke-width": 1.8 }, main);
      var woLbl = S("text", { x: (arrX0 + arrX1) / 2, y: catY + cell + 15, class: "t t-sm t-mid", text: "W_O" }, main);
      var out = cellRow(main, arrX1 + 8, catY, OUT, "f-orange", 0);
      var outW = 8 * cell + 7 * cg;
      var outFrame = S("rect", { x: arrX1 + 4, y: catY - 4, width: outW + 8, height: cell + 8, rx: 4, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 1.5 }, main);
      var outLbl = S("text", { x: arrX1 + 8 + outW / 2, y: catY + cell + 17, class: "t t-sm t-mid t-orange", text: "new “bank”" }, main);
      LC.drawIn(tl, arrow, { duration: 0.5 });
      LC.popIn(tl, [woLbl], { duration: 0.3 }, "<");
      LC.popIn(tl, [out.g, outFrame, outLbl], { duration: 0.5 });
      tl.addLabel("s4");

      // s5: parameter count scene
      var par = S("g", {}, svg); par.style.opacity = 0;
      var pc = compact ? 9 : 12; // cell size of the weight grids
      var gridW = 8 * pc, slabGap = compact ? 10 : 14;
      var leftX = compact ? 34 : 110, gy = compact ? 100 : 80;
      var rightX = compact ? 186 : 360;
      S("text", { x: leftX + gridW / 2, y: gy - 30, class: "t t-sm t-mid", text: compact ? "1 head: W_Q" : "one head: W_Q is 8 × 8" }, par);
      S("text", { x: rightX + (4 * 2 * pc + 3 * slabGap) / 2, y: gy - 30, class: "t t-sm t-mid", text: compact ? "4 heads: 8 × 2 each" : "four heads: four 8 × 2 slices" }, par);
      for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) {
        S("rect", { x: leftX + c * pc + 0.5, y: gy + r * pc + 0.5, width: pc - 1, height: pc - 1, class: "f-blue", "fill-opacity": (0.25 + 0.6 * ((r * 7 + c * 3) % 5) / 4).toFixed(2) }, par);
        var k = Math.floor(c / 2);
        S("rect", { x: rightX + k * slabGap + c * pc + 0.5, y: gy + r * pc + 0.5, width: pc - 1, height: pc - 1, class: "f-blue", "fill-opacity": (0.25 + 0.6 * ((r * 7 + c * 3) % 5) / 4).toFixed(2) }, par);
      }
      [0, 1, 2, 3].forEach(function (k) {
        S("text", { x: rightX + k * slabGap + k * 2 * pc + pc, y: gy + gridW + 18, class: "t t-sm t-mid t-muted", text: "H" + (k + 1) }, par);
      });
      S("text", { x: leftX + gridW / 2, y: gy + gridW + 18, class: "t t-sm t-mid t-muted", text: "64 numbers" }, par);
      S("text", { x: leftX + gridW + (rightX - leftX - gridW) / 2, y: gy + gridW / 2 + 5, class: "t t-lg t-mid", text: "=" }, par);
      var ly = gy + gridW + 58;
      var lines = compact
        ? ["4 × (8 × 2) = 64: same numbers, sliced", "W_Q, W_K, W_V, W_O: 4 · d_model² total", "d_model = 512 → 4 · 512² ≈ 1.05M", "per layer, for 1 head or 8 heads"]
        : ["4 heads × (8 × 2) = 64: the same numbers, just sliced into heads", "W_Q, W_K, W_V and W_O together: 4 · d_model² parameters", "e.g. d_model = 512 → 4 · 512² = 1,048,576 per layer, whether h = 1 or h = 8"];
      lines.forEach(function (s, i) { S("text", { x: Wd / 2, y: ly + i * 24, class: "t t-sm t-mid" + (i === 1 ? "" : " t-muted"), text: s, "font-weight": i === 1 ? 600 : 400 }, par); });
      tl.to(main, { opacity: 0, duration: 0.4 });
      tl.to(par, { opacity: 1, duration: 0.5 });
      tl.addLabel("s5");

      // s6: MHA vs GQA vs MQA
      var gq = S("g", {}, svg); gq.style.opacity = 0;
      var colW = compact ? 112 : 190, colX0 = (Wd - 3 * colW) / 2;
      var sq = compact ? 18 : 24, sg = compact ? 7 : 12;
      var qy = compact ? 110 : 100, ky = compact ? 210 : 210;
      var kinds = [["MHA", 4], ["GQA", 2], ["MQA", 1]];
      var gqLines = [];
      if (compact) {
        S("text", { x: Wd / 2 - 8, y: ky + sq + 52, class: "t t-sm t-orange t-end", text: "■ query heads" }, gq);
        S("text", { x: Wd / 2 + 8, y: ky + sq + 52, class: "t t-sm t-blue", text: "■ K/V heads" }, gq);
      } else {
        S("text", { x: 4, y: qy + sq / 2 + 4, class: "t t-sm t-orange", text: "query heads" }, gq);
        S("text", { x: 4, y: ky + sq / 2 + 4, class: "t t-sm t-blue", text: "K/V heads" }, gq);
      }
      kinds.forEach(function (kd, ci) {
        var cxm = colX0 + ci * colW + colW / 2 + (compact ? 0 : 30);
        S("text", { x: cxm, y: qy - 34, class: "t t-mid", text: kd[0], "font-weight": 650 }, gq);
        var qW4 = 4 * sq + 3 * sg;
        var qxs = [0, 1, 2, 3].map(function (i) { return cxm - qW4 / 2 + i * (sq + sg) + sq / 2; });
        var nk = kd[1], kW = nk * sq + (nk - 1) * (sg * 2.5);
        var kxs = []; for (var i = 0; i < nk; i++) kxs.push(cxm - kW / 2 + i * (sq + sg * 2.5) + sq / 2);
        qxs.forEach(function (x, i) {
          var kx = kxs[Math.floor(i * nk / 4)];
          gqLines.push(S("path", { d: "M" + x + " " + (qy + sq) + "L" + kx + " " + ky, class: "s-faint", "stroke-width": 1.8 }, gq));
        });
        qxs.forEach(function (x) { S("rect", { x: x - sq / 2, y: qy, width: sq, height: sq, rx: 4, class: "f-orange" }, gq); });
        kxs.forEach(function (x) { S("rect", { x: x - sq / 2, y: ky, width: sq, height: sq, rx: 4, class: "f-blue" }, gq); });
        S("text", { x: cxm, y: ky + sq + 22, class: "t t-sm t-mid", text: "cache × " + (nk === 4 ? "1" : nk === 2 ? "½" : "¼") }, gq);
      });
      var notes = compact
        ? ["Llama 2 70B: 64 Q heads, 8 KV", "→ KV cache 8× smaller than MHA"]
        : ["Real example: Llama 2 70B uses 64 query heads but only 8 K/V heads,", "so its KV cache is 8× smaller than full multi-head attention would need."];
      notes.forEach(function (s, i) { S("text", { x: Wd / 2, y: ky + sq + (compact ? 92 : 70) + i * 22, class: "t t-sm t-mid t-muted", text: s }, gq); });
      tl.to(par, { opacity: 0, duration: 0.4 });
      tl.to(gq, { opacity: 1, duration: 0.5 });
      tl.addLabel("s6");
      return tl;
    }
  };
})();
