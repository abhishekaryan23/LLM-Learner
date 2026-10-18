/* M4.4: position bias in a pairwise LLM judge, the swap-and-average fix, and
   checking the judge against human labels with Cohen's kappa.
   Kappa table (100 items): judge good & human good 40, judge good & human bad 20,
   judge bad & human good 10, both bad 30 → p_o = 0.70, p_e = 0.6·0.5 + 0.4·0.5 = 0.50, κ = 0.40. */
(function () {
  var LC = window.LC;

  LC.anims["m4-4-judge"] = {
    title: "Position bias, and how to catch it",
    steps: [
      "One question, two answers, <strong>A</strong> and <strong>B</strong>. People rate them equally good. We show both to an <strong>LLM judge</strong> and ask which is better.",
      "Order 1: A in the first slot, B in the second. The judge picks the <strong>first slot</strong>: A wins.",
      "Order 2: swap them, so B goes first. Now the judge picks B, again the <strong>first slot</strong>. Same answers, opposite verdict: <strong>position bias</strong>.",
      "Fix: always judge <strong>both orders</strong>. Count a win only if the two verdicts agree; if they disagree, record a <strong>tie</strong> (or average the two scores).",
      "At scale: on equally good pairs, a judge that picks the first slot 70% of the time makes A “win” <strong>70%</strong> when A is always shown first. Swapping and averaging recovers the honest <strong>50%</strong>.",
      "Finally, check the judge against people. On 100 labelled answers they agree 70% of the time, but their label rates alone predict 50% agreement by chance. Cohen's $\\kappa = (0.70 - 0.50)/(1 - 0.50) = $ <strong>0.40</strong>: on the border between fair and moderate agreement."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 284 } : { w: 640, h: 284 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var cw = compact ? 120 : 160, cgap = compact ? 40 : 80, cy = 58, ch = 52;
      var x1 = W / 2 - cgap / 2 - cw, x2 = W / 2 + cgap / 2;
      var c1 = x1 + cw / 2, c2 = x2 + cw / 2;
      var jy = 140, jh = 36, jw = compact ? 130 : 160;
      var tl = gsap.timeline();

      // s0: two slots, two answers, a judge
      var main = S("g", {}, svg);
      S("text", { x: 4, y: 18, class: "t t-sm t-muted", text: "A and B: equally good answers" }, main);
      S("text", { x: c1, y: cy - 8, class: "t t-sm t-muted t-mid", text: "shown 1st" }, main);
      S("text", { x: c2, y: cy - 8, class: "t t-sm t-muted t-mid", text: "shown 2nd" }, main);
      [x1, x2].forEach(function (x) { S("rect", { x: x, y: cy, width: cw, height: ch, rx: 10, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, main); });
      var la = S("text", { x: c1, y: cy + ch / 2 + 7, class: "t t-lg t-mid", text: "A" }, main);
      var lb = S("text", { x: c2, y: cy + ch / 2 + 7, class: "t t-lg t-mid", text: "B" }, main);
      S("path", { d: "M" + c1 + " " + (cy + ch + 4) + "L" + (W / 2 - 24) + " " + (jy - 4), class: "s-faint" }, main);
      S("path", { d: "M" + c2 + " " + (cy + ch + 4) + "L" + (W / 2 + 24) + " " + (jy - 4), class: "s-faint" }, main);
      S("rect", { x: W / 2 - jw / 2, y: jy, width: jw, height: jh, rx: 18, class: "f-ink" }, main);
      S("text", { x: W / 2, y: jy + jh / 2 + 5, class: "t t-mid t-nohalo", style: "fill:var(--a-paper)", "font-weight": 650, text: "LLM judge" }, main);
      tl.addLabel("s0", 0);

      // s1: order A, B -> picks slot 1 (A)
      var ring = S("rect", { x: x1 - 4, y: cy - 4 + 0, width: cw + 8, height: ch + 8, rx: 13, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 3 }, main);
      var row1 = S("text", { x: W / 2, y: 210, class: "t t-mid", text: "order A, B  →  judge picks A" }, main);
      LC.popIn(tl, [ring, row1], { duration: 0.4, stagger: 0.2 });
      tl.addLabel("s1");

      // s2: swap -> picks slot 1 again (now B)
      var row2 = S("text", { x: W / 2, y: 236, class: "t t-mid", text: "order B, A  →  judge picks B" }, main);
      tl.to(ring, { opacity: 0, duration: 0.2 });
      tl.to(la, { attr: { x: c2 }, duration: 0.7, ease: "power2.inOut" });
      tl.to(lb, { attr: { x: c1 }, duration: 0.7, ease: "power2.inOut" }, "<");
      tl.to(ring, { opacity: 1, duration: 0.3 });
      LC.popIn(tl, row2, { duration: 0.4 });
      tl.addLabel("s2");

      // s3: consistency rule -> tie
      var tie = S("text", { x: W / 2, y: 268, class: "t t-mid t-orange", "font-weight": 650, text: "verdicts disagree  →  record a tie" }, main);
      LC.popIn(tl, tie, { duration: 0.4 });
      tl.addLabel("s3");

      // s4: at scale: one order vs swap-and-average
      var bars = S("g", {}, svg);
      bars.style.opacity = 0;
      S("text", { x: W / 2, y: 40, class: "t t-sm t-muted t-mid", text: "A's win rate on equally good pairs" }, bars);
      S("text", { x: W / 2, y: 60, class: "t t-sm t-muted t-mid", text: "(judge picks the 1st slot 70% of the time)" }, bars);
      var lw = compact ? 96 : 150, bx = (compact ? 8 : 70) + lw, bmax = compact ? 200 : 320;
      [["A always 1st", 0.7, "f-orange"], ["both orders", 0.5, "f-blue"]].forEach(function (r, k) {
        var y = 92 + k * 46;
        S("text", { x: bx - 10, y: y + 17, class: "t t-sm t-end", text: r[0] }, bars);
        S("rect", { x: bx, y: y, width: bmax, height: 24, rx: 4, class: "f-surface2" }, bars);
        S("rect", { x: bx, y: y, width: bmax * r[1], height: 24, rx: 4, class: r[2] }, bars);
        S("text", { x: bx + bmax + 6, y: y + 17, class: "t t-sm t-mono", text: Math.round(r[1] * 100) + "%" }, bars);
      });
      S("path", { d: "M" + (bx + bmax / 2) + " 84V" + 192, class: "s-ink", "stroke-dasharray": "4 4", "stroke-width": 1.5 }, bars);
      S("text", { x: bx + bmax / 2, y: 212, class: "t t-sm t-mid", text: "fair = 50%" }, bars);
      tl.to(main, { opacity: 0, duration: 0.4 });
      tl.to(bars, { opacity: 1, duration: 0.4 });
      tl.addLabel("s4");

      // s5: agreement with humans, Cohen's kappa
      var kap = S("g", {}, svg);
      kap.style.opacity = 0;
      var labW = compact ? 92 : 120, cellW = compact ? 110 : 140, cellH = 38, g = 6;
      var tx0 = (W - (labW + 2 * cellW + g)) / 2 + labW;
      S("text", { x: 4, y: 18, class: "t t-sm t-muted", text: "100 answers: judge vs human labels" }, kap);
      ["human: good", "human: bad"].forEach(function (h, j) { S("text", { x: tx0 + j * (cellW + g) + cellW / 2, y: 52, class: "t t-sm t-mid", text: h }, kap); });
      [["judge: good", 40, 20], ["judge: bad", 10, 30]].forEach(function (r, i) {
        var y = 62 + i * (cellH + g);
        S("text", { x: tx0 - 10, y: y + cellH / 2 + 4, class: "t t-sm t-end", text: r[0] }, kap);
        [r[1], r[2]].forEach(function (v, j) {
          var agree = i === j;
          S("rect", { x: tx0 + j * (cellW + g), y: y, width: cellW, height: cellH, rx: 6, class: agree ? "f-orange" : "f-surface2" }, kap);
          S("text", { x: tx0 + j * (cellW + g) + cellW / 2, y: y + cellH / 2 + 6, class: "t t-lg t-mid t-nohalo", style: agree ? "fill:var(--a-paper)" : "", text: v }, kap);
        });
      });
      S("text", { x: W / 2, y: 178, class: "t t-sm t-mid", text: "observed agreement = (40 + 30) / 100 = 0.70" }, kap);
      S("text", { x: W / 2, y: 202, class: "t t-sm t-mid t-muted", text: "by chance = 0.6 × 0.5 + 0.4 × 0.5 = 0.50" }, kap);
      S("text", { x: W / 2, y: 240, class: "t t-mid t-orange", "font-weight": 650, text: "κ = (0.70 − 0.50) / (1 − 0.50) = 0.40" }, kap);
      tl.to(bars, { opacity: 0, duration: 0.4 });
      tl.to(kap, { opacity: 1, duration: 0.4 });
      tl.addLabel("s5");
      return tl;
    }
  };
})();
