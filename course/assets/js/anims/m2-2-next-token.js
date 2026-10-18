/* M2.2: shift-by-one targets, teacher forcing, per-position −ln p and the mean loss.
   The probabilities are made up but the arithmetic is exact:
   −ln[0.10, 0.40, 0.70, 0.60, 0.30] = [2.30, 0.92, 0.36, 0.51, 1.20], mean 1.06, e^1.06 ≈ 2.88. */
(function () {
  var LC = window.LC;
  var TEXT = ["the", "cat", "sat", "on", "the", "mat"];
  var P = [0.10, 0.40, 0.70, 0.60, 0.30];
  var NLL = P.map(function (p) { return -Math.log(p); });
  var MEAN = NLL.reduce(function (a, b) { return a + b; }, 0) / NLL.length;

  LC.anims["m2-2-next-token"] = {
    title: "One sentence, five training examples",
    steps: [
      "A snippet of training text, already split into <strong>tokens</strong>. No human labels anywhere: the text <em>is</em> the label.",
      "<strong>Shift by one.</strong> The input is every token but the last; the target at each position is the <strong>next</strong> token. Six tokens give five prediction problems.",
      "At position 3 the model sees <em>the cat sat</em> (blue) and must predict <em>on</em> (orange). The <strong>causal mask</strong> (M1.1) hides everything to the right, so all five positions train <strong>in parallel</strong> in one pass. The inputs are always the <em>true</em> tokens: <strong>teacher forcing</strong>.",
      "At each position the model outputs a probability for every token in the vocabulary. We only need one number: the probability it gave the <strong>correct</strong> next token.",
      "Each position's loss is the <strong>cross-entropy</strong> $-\\ln p(\\text{target})$: near 0 when the model was confident and right, large when it was surprised.",
      "The training loss is the <strong>average over all positions</strong>: $(2.30 + 0.92 + 0.36 + 0.51 + 1.20)/5 \\approx 1.06$ nats. Its exponential, $e^{1.06} \\approx 2.88$, is the <strong>perplexity</strong> (M4.1)."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 420 } : { w: 640, h: 370 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var L = compact
        ? { left: 13, right: 13, textY: 26, inY: 96, tgY: 164, barTop: 230, barBase: 300, pY: 318, nllY: 368, meanY: 408, bh: 30,
            lab: { text: [4, 16], inp: [4, 86], tgt: [4, 154], p: [4, 222], nll: [4, 348] } }
        : { left: 132, right: 16, textY: 18, inY: 84, tgY: 140, barTop: 196, barBase: 270, pY: 290, nllY: 320, meanY: 356, bh: 34,
            lab: { text: [4, 40], inp: [4, 106], tgt: [4, 162], p: [4, 240], nll: [4, 324] } };
      var span = W - L.left - L.right;
      var cg = compact ? 6 : 10, cw = (span - 4 * cg) / 5;          // 5 position columns
      var tg = compact ? 5 : 8, tw = (span - 5 * tg) / 6;           // 6 text tokens
      function col(i) { return L.left + i * (cw + cg); }
      function tcol(i) { return L.left + i * (tw + tg); }
      var tl = gsap.timeline();

      function tokBox(x, y, w, t, cls) {
        var g = S("g", {}, svg);
        var r = S("rect", { x: x, y: y, width: w, height: L.bh, rx: 8, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, g);
        S("text", { x: x + w / 2, y: y + L.bh / 2 + 5, class: "t t-mid" + (cls ? " " + cls : ""), text: t }, g);
        return { g: g, r: r };
      }
      var labTxt = compact
        ? { text: "training text", inp: "input: what the model reads", tgt: "target: the next token", p: "p(target), from the model", nll: "loss per position = −ln p" }
        : { text: "text", inp: "input", tgt: "target", p: "p(target)", nll: "−ln p" };
      var lab = {};
      Object.keys(labTxt).forEach(function (k) {
        lab[k] = S("text", { x: L.lab[k][0], y: L.lab[k][1], class: "t t-sm t-muted", text: labTxt[k] }, svg);
      });

      // s0: the text
      var text = TEXT.map(function (t, i) { return tokBox(tcol(i), L.textY, tw, t); });
      [lab.inp, lab.tgt, lab.p, lab.nll].forEach(function (e) { e.style.opacity = 0; });
      tl.addLabel("s0", 0);

      // s1: inputs and shifted targets
      var inp = TEXT.slice(0, 5).map(function (t, i) { return tokBox(col(i), L.inY, cw, t); });
      var tgt = TEXT.slice(1).map(function (t, i) { return tokBox(col(i), L.tgY, cw, t, "t-orange"); });
      inp.forEach(function (b, i) { b.g.style.opacity = 0; });
      tgt.forEach(function (b) { b.g.style.opacity = 0; });
      tl.to(lab.inp, { opacity: 1, duration: 0.25 });
      inp.forEach(function (b, i) {
        tl.fromTo(b.g, { opacity: 0, y: L.textY - L.inY, x: tcol(i) - col(i) }, { opacity: 1, y: 0, x: 0, duration: 0.5, ease: "power2.out" }, i ? "<0.06" : undefined);
      });
      tl.to(lab.tgt, { opacity: 1, duration: 0.25 });
      tgt.forEach(function (b, i) {
        tl.fromTo(b.g, { opacity: 0, y: L.textY - L.tgY, x: tcol(i + 1) - col(i) }, { opacity: 1, y: 0, x: 0, duration: 0.5, ease: "power2.out" }, i ? "<0.06" : undefined);
      });
      tl.addLabel("s1");

      // s2: what position 3 sees (causal mask) and predicts
      var Q = 2;
      var seeFrame = S("rect", { x: col(0) - 3, y: L.inY - 3, width: col(Q) + cw - col(0) + 6, height: L.bh + 6, rx: 10, class: "f-none", stroke: "var(--a-blue)", "stroke-width": 2.5 }, svg);
      var predFrame = S("rect", { x: col(Q) - 3, y: L.tgY - 3, width: cw + 6, height: L.bh + 6, rx: 10, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 2.5 }, svg);
      var hidden = inp.slice(Q + 1).map(function (b) { return b.g; });
      LC.popIn(tl, seeFrame, { duration: 0.35 });
      tl.to(hidden, { opacity: 0.25, duration: 0.35 }, "<");
      LC.popIn(tl, predFrame, { duration: 0.35 });
      tl.addLabel("s2");

      // s3: probability bars
      tl.to([seeFrame, predFrame], { opacity: 0, duration: 0.3 });
      tl.to(hidden, { opacity: 1, duration: 0.3 }, "<");
      tl.to(lab.p, { opacity: 1, duration: 0.25 });
      var base = S("line", { x1: L.left, x2: W - L.right, y1: L.barBase, y2: L.barBase, class: "s-grid" }, svg);
      LC.popIn(tl, base, { duration: 0.2 }, "<");
      var bw = cw * 0.5, maxH = L.barBase - L.barTop;
      var bars = P.map(function (p, i) {
        return S("rect", { x: col(i) + (cw - bw) / 2, y: L.barBase, width: bw, height: 0, rx: 3, class: "f-blue" }, svg);
      });
      var pTxt = P.map(function (p, i) { return S("text", { x: col(i) + cw / 2, y: L.pY, class: "t t-sm t-mono t-mid", text: p.toFixed(2) }, svg); });
      P.forEach(function (p, i) { tl.to(bars[i], { attr: { y: L.barBase - p * maxH, height: p * maxH }, duration: 0.6, ease: "power2.out" }, i ? "<0.06" : undefined); });
      LC.popIn(tl, pTxt, { duration: 0.3, stagger: 0.05 }, "-=0.3");
      tl.addLabel("s3");

      // s4: −ln p per position
      tl.to(lab.nll, { opacity: 1, duration: 0.25 });
      var nTxt = NLL.map(function (v, i) {
        return S("text", { x: col(i) + cw / 2, y: L.nllY, class: "t t-mono t-mid t-orange", "font-weight": 650, text: v.toFixed(2) }, svg);
      });
      LC.popIn(tl, nTxt, { duration: 0.3, stagger: 0.08 });
      tl.addLabel("s4");

      // s5: mean
      var mean = S("text", { x: compact ? W / 2 : L.left + span / 2, y: L.meanY, class: "t t-lg t-mid", text: "loss = mean = " + MEAN.toFixed(2) + " nats · perplexity ≈ " + Math.exp(MEAN).toFixed(2) }, svg);
      if (compact) mean.setAttribute("class", "t t-mid");
      var brace = S("path", { d: "M" + (L.left + 4) + " " + (L.nllY + 10) + "H" + (W - L.right - 4), class: "s-orange", "stroke-width": 2 }, svg);
      LC.drawIn(tl, brace, { duration: 0.5 });
      LC.popIn(tl, mean, { duration: 0.4 });
      tl.addLabel("s5");
      return tl;
    }
  };
})();
