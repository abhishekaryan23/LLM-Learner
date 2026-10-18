/* M3.5: one GRPO step on one prompt. Sample a group of G = 6 answers, score them with a
   verifier (exact match), normalise rewards inside the group, push probabilities up/down,
   and keep the policy on a KL leash to the frozen reference model.
   Rewards [1,0,1,0,0,0]: mean 1/3, population std sqrt(2)/3 ≈ 0.471,
   advantages (r − mean)/std = +1.41 (correct) and −0.71 (wrong). */
(function () {
  var LC = window.LC;
  var ANS = ["408", "418", "408", "398", "406", "428"];
  var R = ANS.map(function (a) { return a === "408" ? 1 : 0; });
  var G = R.length;
  var MEAN = R.reduce(function (a, b) { return a + b; }, 0) / G;
  var STD = Math.sqrt(R.reduce(function (a, r) { return a + (r - MEAN) * (r - MEAN); }, 0) / G);
  var ADV = R.map(function (r) { return (r - MEAN) / STD; });
  function sgn(v) { return (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(2); }

  LC.anims["m3-5-grpo"] = {
    title: "One GRPO step: score a group, compare within it",
    steps: [
      "A prompt with a <strong>checkable answer</strong>: $17 \\times 24 = 408$. No human needs to judge the response; a program can.",
      "The current policy samples a <strong>group</strong> of $G = 6$ answers to the same prompt (in practice each one is a full chain of reasoning ending in an answer).",
      "A <strong>verifier</strong> (here: does the final answer equal 408?) gives reward 1 or 0. No learned reward model is involved.",
      "Compute the group's <strong>mean</strong> and <strong>standard deviation</strong>: 2 of 6 correct, so mean $= 0.33$ and std $\\approx 0.47$.",
      "Each answer's <strong>advantage</strong> is $(r - \\text{mean})/\\text{std}$: $+1.41$ for the correct ones, $-0.71$ for the wrong ones. The group itself is the baseline, so <strong>no value model</strong> is needed.",
      "The update raises the probability of every token in the above-average answers and <strong>lowers</strong> it for the below-average ones, with PPO-style clipping to keep each step small.",
      "A <strong>KL penalty</strong> ties the policy to a frozen <strong>reference</strong> copy, so it can't drift into gibberish that happens to score well. Then: new prompts, new groups, repeat."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 432 } : { w: 640, h: 432 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var cw = compact ? 48 : 72, gap = compact ? 8 : 14;
      var total = G * cw + (G - 1) * gap;
      var x0 = compact ? (W - total) / 2 : W - 16 - total;
      var mid = x0 + total / 2;
      function cx(i) { return x0 + i * (cw + gap) + cw / 2; }
      var cardY = 88, cardH = 36, markY = 172, rY = 196, statY = 224, zeroY = 292, K = 32;
      var tl = gsap.timeline();

      // wide only: row labels in a left column (each appears with its row)
      function rowLabel(txt, y) {
        return compact ? [] : [S("text", { x: 12, y: y, class: "t t-sm t-muted", text: txt }, svg)];
      }

      // s0: the prompt
      var pw = compact ? 190 : 210;
      S("rect", { x: mid - pw / 2, y: 12, width: pw, height: 36, rx: 10, class: "f-surface", stroke: "var(--a-ink)", "stroke-width": 1.5 }, svg);
      S("text", { x: mid, y: 35, class: "t t-mid", text: "prompt: 17 × 24 = ?", "font-weight": 600 }, svg);
      var keyLbl = S("text", { x: mid + pw / 2 + 8, y: 35, class: "t t-sm t-muted", text: compact ? "" : "(key: 408)" }, svg);
      if (compact) keyLbl.remove();
      tl.addLabel("s0", 0);

      // s1: fan out to G samples
      var fans = ANS.map(function (_, i) {
        return S("path", { d: "M" + mid + " 50L" + cx(i) + " " + (cardY - 2), class: "s-faint", "stroke-width": 1.5 }, svg);
      });
      var cards = ANS.map(function (a, i) {
        var g = S("g", {}, svg);
        var r = S("rect", { x: cx(i) - cw / 2, y: cardY, width: cw, height: cardH, rx: 8, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, g);
        S("text", { x: cx(i), y: cardY + 23, class: "t t-mono t-mid", text: a }, g);
        return { g: g, r: r };
      });
      var sampLbl = rowLabel("G = 6 samples", cardY + 23);
      fans.forEach(function (p, i) { LC.drawIn(tl, p, { duration: 0.35 }, i ? "<0.07" : "+=0.02"); });
      LC.popIn(tl, cards.map(function (c) { return c.g; }).concat(sampLbl), { duration: 0.3, stagger: 0.08 }, "-=0.2");
      tl.addLabel("s1");

      // s2: verifier marks + rewards
      var vHead = S("text", { x: mid, y: 150, class: "t t-sm t-muted t-mid", text: "verifier: final answer = 408?" }, svg);
      var marks = R.map(function (r, i) {
        return S("text", { x: cx(i), y: markY, class: "t t-mid " + (r ? "t-orange" : "t-muted"), text: r ? "✓" : "✗", style: "font-size:17px", "font-weight": 700 }, svg);
      });
      var rews = R.map(function (r, i) {
        return S("text", { x: cx(i), y: rY, class: "t t-mono t-mid" + (r ? " t-orange" : ""), text: String(r) }, svg);
      });
      LC.popIn(tl, [vHead].concat(rowLabel("verifier", markY)), { duration: 0.3 }, "+=0.02");
      LC.popIn(tl, marks, { duration: 0.25, stagger: 0.08 });
      LC.popIn(tl, rews.concat(rowLabel("reward r", rY)), { duration: 0.25, stagger: 0.05 });
      tl.addLabel("s2");

      // s3: group statistics
      var stat = S("text", { x: mid, y: statY, class: "t t-sm t-mid", text: "group mean = " + MEAN.toFixed(2) + "  ·  std = " + STD.toFixed(2) }, svg);
      LC.popIn(tl, [stat], { duration: 0.4 });
      tl.addLabel("s3");

      // s4: advantages as bars around zero
      var zero = S("path", { d: "M" + (x0 - 6) + " " + zeroY + "H" + (x0 + total + 6), class: "s-axis" }, svg);
      var bw = cw * 0.56;
      var bars = ADV.map(function (a, i) {
        return S("rect", { x: cx(i) - bw / 2, y: zeroY, width: bw, height: 0, rx: 3, class: a > 0 ? "f-orange" : "f-blue" }, svg);
      });
      var vals = ADV.map(function (a, i) {
        var y = a > 0 ? zeroY - a * K - 7 : zeroY - a * K + 15;
        return S("text", { x: cx(i), y: y, class: "t t-sm t-mono t-mid" + (a > 0 ? " t-orange" : " t-blue"), text: sgn(a) }, svg);
      });
      LC.drawIn(tl, zero, { duration: 0.4 }, "+=0.02");
      var advLbl = rowLabel("advantage", zeroY + 4);
      if (advLbl.length) LC.popIn(tl, advLbl, { duration: 0.2 }, "<");
      ADV.forEach(function (a, i) {
        var h = Math.abs(a) * K;
        tl.to(bars[i], { attr: { y: a > 0 ? zeroY - h : zeroY, height: h }, duration: 0.6, ease: "power2.out" }, i ? "<0.05" : undefined);
      });
      LC.popIn(tl, vals, { duration: 0.3, stagger: 0.04 }, "-=0.2");
      tl.addLabel("s4");

      // s5: push up / push down
      var arY0 = 360, arY1 = 342;
      var arrows = ADV.map(function (a, i) {
        var x = cx(i), up = a > 0, tip = up ? arY1 : arY0, tail = up ? arY0 : arY1, d = up ? 6 : -6;
        return S("path", { d: "M" + x + " " + tail + "V" + tip + "M" + (x - 6) + " " + (tip + d) + "L" + x + " " + tip + "L" + (x + 6) + " " + (tip + d), class: up ? "s-orange" : "s-blue", "stroke-width": 2.5 }, svg);
      });
      arrows.forEach(function (p, i) { LC.drawIn(tl, p, { duration: 0.35 }, i ? "<0.05" : "+=0.02"); });
      var upLbl = rowLabel("update", 356);
      if (upLbl.length) LC.popIn(tl, upLbl, { duration: 0.2 }, "<");
      cards.forEach(function (c, i) {
        if (R[i]) tl.to(c.r, { attr: { stroke: "var(--a-orange)", "stroke-width": 3 }, duration: 0.3 }, "<");
        else tl.to(c.g, { opacity: 0.45, duration: 0.3 }, "<");
      });
      tl.addLabel("s5");

      // s6: KL leash to the reference model
      var by = 390, bh = 34, bwid = compact ? 136 : 170;
      var lx = mid - bwid - (compact ? 28 : 40), rx = mid + (compact ? 28 : 40);
      var kl = S("g", {}, svg);
      S("rect", { x: lx, y: by, width: bwid, height: bh, rx: 9, class: "f-surface", stroke: "var(--a-orange)", "stroke-width": 2 }, kl);
      S("text", { x: lx + bwid / 2, y: by + 22, class: "t t-sm t-mid", text: "policy πθ (learning)" }, kl);
      S("rect", { x: rx, y: by, width: bwid, height: bh, rx: 9, class: "f-surface2", stroke: "var(--line)", "stroke-width": 1.5 }, kl);
      S("text", { x: rx + bwid / 2, y: by + 22, class: "t t-sm t-mid", text: "reference (frozen)" }, kl);
      var leash = S("path", { d: "M" + (lx + bwid + 4) + " " + (by + bh / 2) + "H" + (rx - 4), class: "s-ink", "stroke-dasharray": "4 4" }, svg);
      var klLbl = S("text", { x: mid, y: by - 6, class: "t t-sm t-mid", text: "β·KL" }, svg);
      LC.popIn(tl, [kl].concat(rowLabel("leash", by + 22)), { duration: 0.4 }, "+=0.02");
      LC.popIn(tl, [leash, klLbl], { duration: 0.3 });
      tl.addLabel("s6");
      return tl;
    }
  };
})();
