/* M1.1: one query token ("bank") attending over "I sat by the river bank",
   then the full causal attention-weight matrix. Weights are softmax of the
   (already 1/sqrt(d_k)-scaled) scores below, so every row sums to 1. */
(function () {
  var LC = window.LC;
  var TOKS = ["I", "sat", "by", "the", "river", "bank"];
  var QI = 5; // the query token: "bank"
  // Scaled scores q_i·k_j/sqrt(d_k) for each row i over keys j <= i (causal).
  var ROWS = [
    [0.0],
    [0.6, 0.9],
    [-0.2, 1.4, 0.5],
    [0.1, 0.3, 1.6, 0.2],
    [-0.3, 0.5, 0.2, 0.9, 1.0],
    [-0.4, 0.3, 0.1, -0.6, 2.3, 1.1]
  ];
  function softmax(x) {
    var m = Math.max.apply(null, x), e = x.map(function (v) { return Math.exp(v - m); });
    var s = e.reduce(function (a, b) { return a + b; }, 0);
    return e.map(function (v) { return v / s; });
  }
  LC.attnData = { toks: TOKS, rows: ROWS, softmax: softmax }; // shared with the playground
  var SC = ROWS[QI], W = softmax(SC), WMAX = Math.max.apply(null, W);
  // Toy 4-d vectors, drawn as shaded cells (opacity = magnitude).
  var QV = [0.9, 0.25, 0.85, 0.3];
  var KV = [[0.3, 0.8, 0.2, 0.6], [0.4, 0.7, 0.3, 0.7], [0.5, 0.5, 0.4, 0.3], [0.2, 0.6, 0.3, 0.5], [0.95, 0.2, 0.9, 0.35], [0.7, 0.4, 0.6, 0.5]];
  var VV = [[0.3, 0.7, 0.5, 0.9], [0.8, 0.4, 0.3, 0.6], [0.5, 0.5, 0.7, 0.2], [0.2, 0.6, 0.6, 0.4], [0.9, 0.85, 0.25, 0.3], [0.6, 0.3, 0.8, 0.7]];
  var OUT = [0, 1, 2, 3].map(function (d) { return VV.reduce(function (a, v, i) { return a + W[i] * v[d]; }, 0); });
  function fmt(v) { return (v < 0 ? "−" : "") + Math.abs(v).toFixed(2); }

  LC.anims["attention"] = {
    title: "Attention, step by step: what does “bank” look at?",
    steps: [
      "Six tokens. On its own, <strong>bank</strong> is ambiguous: money or rivers? Attention lets it look at the other words to decide.",
      "<strong>bank</strong> computes a <strong>query</strong> $q = x\\,W_Q$, a vector that asks <em>“what am I looking for?”</em>",
      "Every token computes a <strong>key</strong> $k = x\\,W_K$, a vector that says <em>“here's what I offer.”</em> bank gets one too.",
      "Score every token: the dot product $q\\cdot k$, divided by $\\sqrt{d_k}$. A big score means the query and key point the same way. <strong>river</strong> scores highest.",
      "<strong>Softmax</strong> turns scores into weights that are positive and <strong>sum to 1</strong>: river 0.60, bank itself 0.18, the rest small.",
      "These weights <em>are</em> the attention: bank spends 60% of its focus on <strong>river</strong>. Thicker beam means more attention.",
      "Each token also has a <strong>value</strong> $v = x\\,W_V$. bank's new vector is the blend $\\sum_i w_i v_i$, mostly river's value, so it now means <em>river</em> bank.",
      "Every token does this at once, which gives a matrix of weights. A decoder LLM <strong>masks the future</strong> (grey): each token may only look at itself and earlier tokens. Every row sums to 1."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 440 } : { w: 640, h: 440 }; },
    build: function (svg, ctx) {
      var S = LC.svg, Wd = ctx.w, compact = ctx.layout === "compact";
      var boxW = compact ? 52 : 86, gap = compact ? 6 : 12;
      var x0 = (Wd - (6 * boxW + 5 * gap)) / 2;
      var tokY = 104, boxH = 36;
      var cell = compact ? 10 : 13, cgap = compact ? 2 : 3;
      var qY = 152, kY = qY + cell + 6, scoreY = 212, barBase = 312, barMax = 84, wY = 330, vY = 350;
      var outY = compact ? 412 : 398;
      function cx(i) { return x0 + i * (boxW + gap) + boxW / 2; }
      var tl = gsap.timeline();
      var main = S("g", {}, svg);

      // helpers
      function cells(parent, x, y, vec, cls) {
        var g = S("g", {}, parent), total = 4 * cell + 3 * cgap;
        vec.forEach(function (v, d) {
          S("rect", { x: x - total / 2 + d * (cell + cgap), y: y, width: cell, height: cell, rx: 2, class: cls, "fill-opacity": (0.2 + 0.8 * v).toFixed(2) }, g);
        });
        return g;
      }

      // tokens (s0)
      TOKS.forEach(function (t, i) {
        S("rect", { x: cx(i) - boxW / 2, y: tokY, width: boxW, height: boxH, rx: 9, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, main);
        S("text", { x: cx(i), y: tokY + 23, class: "t t-mid" + (compact ? " t-sm" : ""), text: t, "font-weight": i === QI ? 650 : 450 }, main);
      });
      // Row labels (wide layout only); each appears with its step.
      var rowLbl = {};
      [["query", qY], ["key", kY], ["score", scoreY - 4], ["weight", wY - 4], ["value", vY]].forEach(function (r) {
        rowLbl[r[0]] = compact ? [] : [S("text", { x: 4, y: r[1] + 10, class: "t t-sm t-muted", text: r[0] }, main)];
      });
      tl.addLabel("s0", 0);

      // s1: highlight query token + query vector
      var hl = S("rect", { x: cx(QI) - boxW / 2 - 3, y: tokY - 3, width: boxW + 6, height: boxH + 6, rx: 11, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 3 }, main);
      var qCells = cells(main, cx(QI), qY, QV, "f-orange");
      var qLbl = S("text", { x: cx(QI) - (4 * cell + 3 * cgap) / 2 - 4, y: qY + cell - 1, class: "t t-sm t-orange t-end", text: "q" }, main);
      LC.popIn(tl, [hl], { duration: 0.4 });
      LC.popIn(tl, [qCells, qLbl].concat(rowLbl.query), { duration: 0.5 });
      tl.addLabel("s1");

      // s2: keys for every token
      var kGroups = TOKS.map(function (_, i) { return cells(main, cx(i), kY, KV[i], "f-blue"); });
      var kLbl = S("text", { x: cx(0) - (4 * cell + 3 * cgap) / 2 - 4, y: kY + cell - 1, class: "t t-sm t-blue t-end", text: "k" }, main);
      LC.popIn(tl, kGroups.concat([kLbl], rowLbl.key), { duration: 0.35, stagger: 0.12 });
      tl.addLabel("s2");

      // s3: scores
      var scores = SC.map(function (s, i) {
        return S("text", { x: cx(i), y: scoreY, class: "t t-mono t-mid" + (compact ? " t-sm" : ""), text: fmt(s), "font-weight": i === 4 ? 700 : 400 }, main);
      });
      var dotLines = SC.map(function (s, i) {
        return S("path", { d: "M" + cx(QI) + " " + (qY + cell / 2) + "L" + cx(i) + " " + (scoreY - 16), class: "s-faint", "stroke-width": 1 }, main);
      });
      dotLines.forEach(function (p, i) { LC.drawIn(tl, p, { duration: 0.35 }, i ? "<0.06" : undefined); });
      LC.popIn(tl, scores.concat(rowLbl.score), { duration: 0.3, stagger: 0.1 }, "-=0.2");
      tl.to(dotLines, { opacity: 0, duration: 0.3 });
      tl.addLabel("s3");

      // s4: softmax -> weight bars
      var bw = boxW * (compact ? 0.62 : 0.5);
      var bars = W.map(function (w, i) {
        return S("rect", { x: cx(i) - bw / 2, y: barBase, width: bw, height: 0, rx: 3, class: i === 4 ? "f-orange" : "f-blue" }, main);
      });
      var baseLine = S("line", { x1: x0 - 4, x2: Wd - x0 + 4, y1: barBase, y2: barBase, class: "s-grid" }, main);
      var wl = W.map(function (w, i) {
        return S("text", { x: cx(i), y: wY, class: "t t-sm t-mono t-mid", text: w.toFixed(2), "font-weight": i === 4 ? 700 : 400 }, main);
      });
      tl.to(scores, { opacity: 0.45, duration: 0.3 });
      LC.popIn(tl, [baseLine].concat(rowLbl.weight), { duration: 0.3 }, "<");
      W.forEach(function (w, i) {
        var h = (w / WMAX) * barMax;
        tl.to(bars[i], { attr: { y: barBase - h, height: h }, duration: 0.7, ease: "power2.out" }, i ? "<0.05" : undefined);
      });
      LC.popIn(tl, wl, { duration: 0.3, stagger: 0.05 }, "-=0.3");
      tl.addLabel("s4");

      // s5: beams from bank to each token, width ~ weight
      var beams = W.map(function (w, i) {
        var xb = cx(QI), xi = cx(i), d;
        if (i === QI) d = "M" + (xb - 10) + " " + tokY + "C" + (xb - 28) + " " + (tokY - 46) + " " + (xb + 28) + " " + (tokY - 46) + " " + (xb + 10) + " " + tokY;
        else { var h = Math.min(90, 26 + Math.abs(xb - xi) * 0.2); d = "M" + xb + " " + tokY + "C" + xb + " " + (tokY - h) + " " + xi + " " + (tokY - h) + " " + xi + " " + tokY; }
        return S("path", { d: d, class: "s-orange", "stroke-width": (1 + 9 * w / WMAX).toFixed(1), "stroke-opacity": (0.25 + 0.75 * w / WMAX).toFixed(2) }, main);
      });
      beams.forEach(function (b, i) { LC.drawIn(tl, b, { duration: 0.6 }, i ? "<0.08" : undefined); });
      tl.addLabel("s5");

      // s6: values flow into the output
      var vGroups = TOKS.map(function (_, i) { return cells(main, cx(i), vY, VV[i], "f-ink"); });
      LC.popIn(tl, vGroups.concat(rowLbl.value), { duration: 0.3, stagger: 0.06 });
      var outX = compact ? Wd / 2 + 40 : cx(QI);
      var outLbl = S("text", { x: outX - (4 * cell + 3 * cgap) / 2 - 10, y: outY + cell - 1, class: "t t-sm t-end", text: compact ? "new “bank” =" : "new “bank” = Σ wᵢvᵢ →" }, main);
      var outCells = cells(main, outX, outY, OUT.map(function (v) { return Math.min(1, v * 1.05); }), "f-orange");
      var outFrame = S("rect", { x: outX - (4 * cell + 3 * cgap) / 2 - 4, y: outY - 4, width: 4 * cell + 3 * cgap + 8, height: cell + 8, rx: 4, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 1.5 }, main);
      var flyers = TOKS.map(function (_, i) {
        var g = cells(main, cx(i), vY, VV[i], "f-ink");
        g.style.opacity = 0;
        return g;
      });
      flyers.forEach(function (g, i) {
        tl.set(g, { opacity: 0.15 + 0.85 * W[i] / WMAX, x: 0, y: 0 }, i ? "<" : "+=0.1");
        tl.to(g, { x: outX - cx(i), y: outY - vY, opacity: 0, duration: 0.9, ease: "power2.in" }, "<");
      });
      LC.popIn(tl, [outCells, outFrame, outLbl], { duration: 0.4 }, "-=0.25");
      tl.addLabel("s6");

      // s7: the full causal attention matrix
      var hc = compact ? 40 : 42, labW = compact ? 46 : 60, grid = 6 * hc;
      var gx = (Wd - (labW + grid)) / 2 + labW, gy = compact ? 70 : 64;
      var heat = S("g", {}, svg);
      heat.style.opacity = 0;
      S("text", { x: gx + grid / 2, y: gy - 30, class: "t t-sm t-muted t-mid", text: "key (looked at) →" }, heat);
      S("text", { x: gx - labW + 2, y: gy + grid + 26, class: "t t-sm t-muted", text: "↑ query (looking)" }, heat);
      var hcells = [];
      TOKS.forEach(function (t, j) { S("text", { x: gx + j * hc + hc / 2, y: gy - 9, class: "t t-sm t-mid", text: t }, heat); });
      TOKS.forEach(function (t, i) {
        S("text", { x: gx - 8, y: gy + i * hc + hc / 2 + 4, class: "t t-sm t-end", text: t, "font-weight": i === QI ? 650 : 400 }, heat);
        var w = softmax(ROWS[i]);
        for (var j = 0; j < 6; j++) {
          var g = S("g", {}, heat);
          if (j <= i) {
            S("rect", { x: gx + j * hc + 1, y: gy + i * hc + 1, width: hc - 2, height: hc - 2, rx: 4, class: "f-blue", "fill-opacity": (0.08 + 0.92 * w[j]).toFixed(2) }, g);
            S("text", { x: gx + j * hc + hc / 2, y: gy + i * hc + hc / 2 + 4, class: "t t-mono t-mid t-nohalo", "font-size": compact ? 9.5 : 10.5, text: w[j].toFixed(2), style: w[j] > 0.45 ? "fill:#fff" : "" }, g);
          } else {
            S("rect", { x: gx + j * hc + 1, y: gy + i * hc + 1, width: hc - 2, height: hc - 2, rx: 4, class: "f-faint", "fill-opacity": 0.5 }, g);
          }
          hcells.push(g);
        }
      });
      var rowHL = S("rect", { x: gx - 1, y: gy + QI * hc - 1, width: grid + 2, height: hc + 2, rx: 6, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 2.5 }, heat);
      tl.to(main, { opacity: 0, duration: 0.5 });
      tl.to(heat, { opacity: 1, duration: 0.01 });
      hcells.forEach(function (c) { c.style.opacity = 0; });
      rowHL.style.opacity = 0;
      tl.to(hcells, { opacity: 1, duration: 0.25, stagger: 0.03 });
      tl.to(rowHL, { opacity: 1, duration: 0.3 });
      tl.addLabel("s7");
      return tl;
    }
  };
})();
