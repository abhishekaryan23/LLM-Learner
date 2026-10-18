/* M4.7: the eval-driven development loop for a (fictional) shop support bot.
   Illustrative numbers, consistent with whole test cases:
   Order lookup 40 cases: 30 → 30 → 30 (75%); Refund policy 30: 14 → 24 → 24 (47% → 80%);
   JSON format 50: 46 → 37 → 47 (92% → 74% → 94%); Tone 20: 17 → 17 → 18 (85% → 90%). */
(function () {
  var LC = window.LC;
  var CATS = [
    { name: "Order lookup", grader: "assert", fails: 2, n: 40, v: [30, 30, 30] },
    { name: "Refund policy", grader: "rubric", fails: 3, n: 30, v: [14, 24, 24] },
    { name: "JSON format", grader: "assert", fails: 1, n: 50, v: [46, 37, 47] },
    { name: "Tone", grader: "rubric", fails: 1, n: 20, v: [17, 17, 18] }
  ];
  // which of the 24 log squares failed, and in which category
  var FAILED = { 2: 1, 5: 0, 9: 1, 13: 2, 16: 1, 19: 0, 22: 3 };

  LC.anims["m4-7-eval-loop"] = {
    title: "Eval-driven development: from real failures to a regression gate",
    steps: [
      "Start from <strong>real usage</strong>: read a sample of production conversations and mark every one that went wrong. Here 7 of 24 failed.",
      "Group the failures into <strong>categories</strong> and count them. Refund-policy mistakes are the most common, so they're the top priority.",
      "Turn each category into test cases with the <strong>cheapest grader that works</strong>: code <strong>assertions</strong> where there's a checkable answer (right order ID, valid JSON), a <strong>rubric</strong> graded by a model or a person for judgement calls (policy, tone).",
      "Run the suite on today's system (v1) to get a <strong>baseline</strong> pass rate per category (illustrative numbers).",
      "Change the prompt to fix refunds (v2) and re-run everything. <strong>Refund policy</strong> jumps from 47% to 80%.",
      "But <strong>JSON format</strong> fell from 92% to 74%: the new instructions broke the output format. Run in CI, the suite <strong>blocks the merge</strong> before users see it.",
      "Fix the regression (v3), add this week's new failures as test cases, and bump the eval set's <strong>version</strong>. Then the loop starts again."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 392 } : { w: 640, h: 336 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      var L = compact
        ? { sq: 14, step: 20, perRow: 12, y0: 28, rowTop: 88, rowH: 66, barX: 4, barW: 286, b1: 17, b2: 35, lblY: 12, dotX: 136, foot: 380, legY: 50 }
        : { sq: 14, step: 20, perRow: 24, y0: 30, rowTop: 84, rowH: 56, barX: 168, barW: 380, b1: 5, b2: 23, lblY: 23, dotX: 104, foot: 326, legY: 50 };
      function rowTop(r) { return L.rowTop + r * L.rowH; }
      function barLen(k, n) { return (k / n) * L.barW; }
      function pct(k, n) { return Math.round(100 * k / n) + "%"; }

      // s0: logs
      var title0 = S("text", { x: 4, y: 16, class: "t t-sm t-muted", text: compact ? "Conversations (orange = went wrong)" : "Production conversations (orange = went wrong)" }, svg);
      var logs = S("g", {}, svg), squares = [];
      for (var i = 0; i < 24; i++) {
        var x = 4 + (i % L.perRow) * L.step, y = L.y0 + Math.floor(i / L.perRow) * L.step;
        squares.push(S("rect", { x: x, y: y, width: L.sq, height: L.sq, rx: 3, class: FAILED[i] != null ? "f-orange" : "f-faint" }, logs));
      }
      tl.addLabel("s0", 0);

      // s1: categories + failures fly in
      var labels = [], tags = [], dotsAll = [];
      CATS.forEach(function (c, r) {
        var t = rowTop(r);
        labels.push(S("text", { x: 4, y: t + L.lblY, class: "t t-sm", "font-weight": 600, text: c.name }, svg));
        tags.push(S("text", { x: W - 4, y: t + L.lblY, class: "t t-sm t-mono t-end " + (c.grader === "assert" ? "t-blue" : "t-orange"), text: c.grader }, svg));
      });
      LC.popIn(tl, labels, { duration: 0.3, stagger: 0.08 });
      var count = [0, 0, 0, 0];
      Object.keys(FAILED).forEach(function (k, j) {
        var r = FAILED[k], src = squares[k];
        var tx = L.dotX + count[r]++ * 16, ty = rowTop(r) + L.lblY - 10;
        var fly = S("rect", { x: src.getAttribute("x"), y: src.getAttribute("y"), width: L.sq, height: L.sq, rx: 3, class: "f-orange" }, svg);
        fly.style.opacity = 0;
        tl.set(fly, { opacity: 1 }, j ? "<0.08" : "+=0.05");
        tl.to(fly, { attr: { x: tx, y: ty, width: 10, height: 10 }, duration: 0.6, ease: "power2.inOut" }, "<");
        dotsAll.push(fly);
      });
      tl.addLabel("s1");

      // s2: grader tags
      LC.popIn(tl, tags, { duration: 0.35, stagger: 0.1 });
      tl.addLabel("s2");

      // s3: baseline bars (v1)
      var title1 = S("text", { x: 4, y: 16, class: "t t-sm t-muted", text: "Pass rate per category, same eval suite" }, svg);
      var leg = S("g", {}, svg);
      S("rect", { x: 4, y: L.legY - 10, width: 12, height: 10, rx: 2, class: "f-faint" }, leg);
      S("text", { x: 22, y: L.legY, class: "t t-sm t-muted", text: "v1 (baseline)" }, leg);
      S("rect", { x: 130, y: L.legY - 10, width: 12, height: 10, rx: 2, class: "f-blue" }, leg);
      var legNew = S("text", { x: 148, y: L.legY, class: "t t-sm t-blue", text: "candidate (v2)" }, leg);
      var bars1 = [], bars2 = [], v1l = [], v2l = [];
      CATS.forEach(function (c, r) {
        var t = rowTop(r);
        bars1.push(S("rect", { x: L.barX, y: t + L.b1, width: 0, height: 10, rx: 2, class: "f-faint" }, svg));
        bars2.push(S("rect", { x: L.barX, y: t + L.b2, width: 0, height: 10, rx: 2, class: "f-blue" }, svg));
        v1l.push(S("text", { x: L.barX + barLen(c.v[0], c.n) + 6, y: t + L.b1 + 9.5, class: "t t-sm t-mono t-muted", text: pct(c.v[0], c.n) }, svg));
        v2l.push(S("text", { x: L.barX + barLen(c.v[1], c.n) + 6, y: t + L.b2 + 9.5, class: "t t-sm t-mono t-blue", text: pct(c.v[1], c.n) }, svg));
      });
      tl.to([title0, logs].concat(dotsAll), { opacity: 0, duration: 0.4 });
      LC.popIn(tl, [title1, leg], { duration: 0.3 });
      legNew.style.opacity = 0;
      CATS.forEach(function (c, r) { tl.to(bars1[r], { attr: { width: barLen(c.v[0], c.n) }, duration: 0.6, ease: "power2.out" }, r ? "<0.08" : undefined); });
      LC.popIn(tl, v1l, { duration: 0.3 });
      tl.addLabel("s3");

      // s4: v2 bars
      tl.to(legNew, { opacity: 1, duration: 0.3 });
      CATS.forEach(function (c, r) { tl.to(bars2[r], { attr: { width: barLen(c.v[1], c.n) }, duration: 0.7, ease: "power2.out" }, r ? "<0.08" : undefined); });
      LC.popIn(tl, v2l, { duration: 0.3 });
      var up = S("rect", { x: L.barX - 2, y: rowTop(1) + L.b2 - 2, width: barLen(24, 30) + 4, height: 14, rx: 3, class: "f-none", stroke: "var(--a-ink)", "stroke-width": 2 }, svg);
      LC.popIn(tl, up, { duration: 0.3 });
      tl.addLabel("s4");

      // s5: regression
      var regBox = S("rect", { x: L.barX - 2, y: rowTop(2) + L.b2 - 2, width: barLen(37, 50) + 4, height: 14, rx: 3, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 2.5 }, svg);
      var foot1 = S("text", { x: 4, y: L.foot, class: "t t-sm t-orange", "font-weight": 650, text: compact ? "CI gate: JSON format −18 pts → blocked" : "CI gate: JSON format dropped 18 points → merge blocked" }, svg);
      tl.to(up, { opacity: 0, duration: 0.3 });
      LC.popIn(tl, [regBox, foot1], { duration: 0.4 });
      tl.addLabel("s5");

      // s6: v3 fixes it; new cases; eval set versioned
      var foot2 = S("text", { x: 4, y: L.foot, class: "t t-sm t-blue", "font-weight": 650, text: compact ? "Gate passed · eval set v1.1: +7 cases" : "Gate passed · eval set v1.1 adds 7 new cases from this week's logs" }, svg);
      // v3 values: attribute tweens + separate labels (no onUpdate, so instant jumps render correctly)
      var legV3 = S("text", { x: 148, y: L.legY, class: "t t-sm t-blue", text: "candidate (v3)" }, svg);
      var v3l = [2, 3].map(function (r) {
        var c = CATS[r];
        return S("text", { x: L.barX + barLen(c.v[2], c.n) + 6, y: rowTop(r) + L.b2 + 9.5, class: "t t-sm t-mono t-blue", text: pct(c.v[2], c.n) }, svg);
      });
      legV3.style.opacity = 0; v3l.forEach(function (e) { e.style.opacity = 0; });
      tl.to([regBox, foot1, legNew, v2l[2], v2l[3]], { opacity: 0, duration: 0.3 });
      [2, 3].forEach(function (r) {
        tl.to(bars2[r], { attr: { width: barLen(CATS[r].v[2], CATS[r].n) }, duration: 0.8, ease: "power2.inOut" }, "<");
      });
      tl.to([legV3].concat(v3l), { opacity: 1, duration: 0.3 });
      LC.popIn(tl, foot2, { duration: 0.4 });
      tl.addLabel("s6");
      return tl;
    }
  };
})();
