/* M4.2: the unbiased pass@k estimator (Chen et al., 2021) on one problem.
   n = 10 samples, c = 3 pass. pass@1 = 0.3; pass@5 = 1 − C(7,5)/C(10,5) = 1 − 21/252 = 0.917.
   Plug-in shortcut 1 − (1 − 0.3)^5 = 0.832. */
(function () {
  var LC = window.LC;
  var N = 10, PASS = [1, 4, 7];                 // indices of the 3 passing samples
  var DRAW1 = [0, 3, 4, 6, 9];                  // a random pick of 5 that includes a pass (#5)
  var DRAW2 = [0, 2, 3, 6, 8];                  // a pick of 5 that is all failures
  function comb(n, k) { if (k < 0 || k > n) return 0; var r = 1; for (var i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); }
  var UNB = 1 - comb(7, 5) / comb(10, 5);       // 0.9167
  var NAIVE = 1 - Math.pow(0.7, 5);             // 0.8319

  LC.anims["m4-2-pass-at-k"] = {
    title: "pass@k: give the model k tries",
    steps: [
      "One coding problem. The model writes <strong>n = 10</strong> independent solutions, sampled at a temperature above 0 so they differ.",
      "Hidden unit tests run on each one: <strong>c = 3</strong> pass (✓) and 7 fail. The fraction that pass is the estimate of <strong>pass@1</strong>: $3/10 = 0.3$.",
      "<strong>pass@5</strong> asks: if we hand over 5 of these, chosen at random, does <em>at least one</em> pass? This pick of 5 contains a ✓, so it counts as solved.",
      "The only way to fail is a pick where all 5 are ✗, like this one. Of the $\\binom{10}{5} = 252$ possible picks, only $\\binom{7}{5} = 21$ are all-fail.",
      "So $\\text{pass@}5 = 1 - \\binom{n-c}{k} / \\binom{n}{k} = 1 - 21/252 = $ <strong>0.917</strong>. Averaging this over every problem gives the benchmark's pass@5. This is the <strong>unbiased estimator</strong> of Chen et al. (2021).",
      "The shortcut $1 - (1 - c/n)^k = 1 - 0.7^5 = 0.832$ treats the 10 samples as if drawn <em>with replacement</em>. Averaged over problems it is <strong>biased low</strong>. Chen et al. drew $n = 200$ samples per problem and used the unbiased formula."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 262 } : { w: 640, h: 206 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var perRow = compact ? 5 : 10, cw = compact ? 54 : 46, ch = compact ? 46 : 50, gx = compact ? 12 : 12, gy = 16;
      var x0 = (W - (perRow * cw + (perRow - 1) * gx)) / 2, y0 = 44;
      function pos(i) { var r = Math.floor(i / perRow), c = i % perRow; return { x: x0 + c * (cw + gx), y: y0 + r * (ch + gy) }; }
      var rowsBottom = y0 + Math.ceil(N / perRow) * (ch + gy) - gy;
      var tl = gsap.timeline();

      S("text", { x: 4, y: 18, class: "t t-sm t-muted", text: "10 sampled solutions to one problem" }, svg);
      var cards = [], marks = [], fills = [];
      for (var i = 0; i < N; i++) {
        var p = pos(i), ok = PASS.indexOf(i) >= 0;
        cards.push(S("rect", { x: p.x, y: p.y, width: cw, height: ch, rx: 8, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, svg));
        fills.push(S("rect", { x: p.x, y: p.y, width: cw, height: ch, rx: 8, class: ok ? "f-orange" : "f-faint" }, svg));
        marks.push(S("text", { x: p.x + cw / 2, y: p.y + ch / 2 + 6, class: "t t-lg t-mid t-nohalo", text: ok ? "✓" : "✗", style: ok ? "fill:var(--a-paper)" : "" }, svg));
      }
      fills.forEach(function (f) { f.style.opacity = 0; });
      marks.forEach(function (m) { m.style.opacity = 0; });
      tl.addLabel("s0", 0);

      // s1: run the tests
      var ty = rowsBottom + 34;
      var t1 = S("text", { x: W / 2, y: ty, class: "t t-mid", text: "c = 3 of n = 10 pass  →  pass@1 = 0.3" }, svg);
      tl.to(fills, { opacity: 1, duration: 0.3, stagger: 0.06 });
      tl.to(marks, { opacity: 1, duration: 0.2, stagger: 0.06 }, "<0.1");
      LC.popIn(tl, t1, { duration: 0.4 });
      tl.addLabel("s1");

      // s2: one random pick of 5 (contains a pass)
      function ring(idx, cls, dash) {
        return idx.map(function (i) {
          var p = pos(i);
          var a = { x: p.x - 4, y: p.y - 4, width: cw + 8, height: ch + 8, rx: 11, class: "f-none", stroke: cls, "stroke-width": 3 };
          if (dash) a["stroke-dasharray"] = "5 4";
          return S("rect", a, svg);
        });
      }
      var r1 = ring(DRAW1, "var(--a-orange)");
      var t2 = S("text", { x: W / 2, y: ty, class: "t t-mid t-orange", text: "pick 5: has a ✓  →  solved" }, svg);
      tl.to(t1, { opacity: 0, duration: 0.2 });
      LC.popIn(tl, r1, { duration: 0.25, stagger: 0.08 });
      LC.popIn(tl, t2, { duration: 0.3 });
      tl.addLabel("s2");

      // s3: an all-fail pick, and the counts
      var r2 = ring(DRAW2, "var(--a-ink)", true);
      var t3a = S("text", { x: W / 2, y: ty, class: "t t-mid", text: "all-fail picks: C(7,5) = 21" }, svg);
      var t3b = S("text", { x: W / 2, y: ty + 24, class: "t t-mid t-muted", text: "all possible picks: C(10,5) = 252" }, svg);
      tl.to(r1.concat([t2]), { opacity: 0, duration: 0.25 });
      LC.popIn(tl, r2, { duration: 0.25, stagger: 0.08 });
      LC.popIn(tl, [t3a, t3b], { duration: 0.3, stagger: 0.15 });
      tl.addLabel("s3");

      // s4: the estimator
      var t4 = S("text", { x: W / 2, y: ty + 56, class: "t t-lg t-orange t-mid", text: "pass@5 = 1 − 21/252 = " + UNB.toFixed(3) }, svg);
      tl.to(r2, { opacity: 0, duration: 0.25 });
      LC.popIn(tl, t4, { duration: 0.4 });
      tl.addLabel("s4");

      // s5: compare with the plug-in shortcut as two bars
      var lw = compact ? 78 : 120, bx = (compact ? 12 : 60) + lw, bmax = compact ? 196 : 340, by = ty - 14, bh = 20;
      var cmp = S("g", {}, svg);
      [["unbiased", UNB, "f-orange"], ["shortcut", NAIVE, "f-blue"]].forEach(function (r, k) {
        var y = by + k * 34;
        S("text", { x: bx - 10, y: y + 15, class: "t t-sm t-end", text: r[0] }, cmp);
        S("rect", { x: bx, y: y, width: bmax, height: bh, rx: 4, class: "f-surface2" }, cmp);
        S("rect", { x: bx, y: y, width: bmax * r[1], height: bh, rx: 4, class: r[2] }, cmp);
        S("text", { x: bx + bmax + 6, y: y + 15, class: "t t-sm t-mono", text: r[1].toFixed(3) }, cmp);
      });
      cmp.style.opacity = 0;
      tl.to([t3a, t3b, t4], { opacity: 0, duration: 0.25 });
      tl.to(cmp, { opacity: 1, duration: 0.4 });
      tl.addLabel("s5");
      return tl;
    }
  };
})();
