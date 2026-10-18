/* P5.2: Bayes' rule with natural frequencies. 1,000 people, 1% have a disease (10).
   The test catches 90% of sick people (9 of 10) and wrongly flags 9% of healthy people (89 of 990).
   Of the 98 positives only 9 are sick: P(D | +) = 9 / 98 ≈ 9.2% (exact: 0.009 / 0.0981 = 9.17%).
   A second independent positive test: 0.0917·0.9 / (0.0917·0.9 + 0.9083·0.09) ≈ 50.3%. */
(function () {
  var LC = window.LC;
  var COLS = 40, ROWS = 25, SICK = 10, SICK_POS = 9, FALSE_POS = 89;

  LC.anims["p5-2-bayes"] = {
    title: "Bayes' rule on 1,000 people",
    steps: [
      "1,000 people take a test for a disease. Before any test result, what do we know about one of them?",
      "The <strong>prior</strong>: 1% of people have the disease. That's 10 of the 1,000 (orange).",
      "The <strong>likelihood</strong> of a positive result if you're sick, $P(+ \\mid D)$, is 90%: 9 of the 10 test positive (ringed).",
      "But the test also wrongly flags 9% of healthy people: about <strong>89 false positives</strong> (blue) out of 990.",
      "You tested positive, so keep only the positives. The <strong>evidence</strong> $P(+)$ counts them all: $9 + 89 = 98$ of 1,000.",
      "The <strong>posterior</strong>: of the 98 positives only 9 are sick. $P(D \\mid +) = 9/98 \\approx 9\\%$. The rare disease (low prior) drags it down.",
      "Test again. Today's posterior becomes tomorrow's prior: a second independent positive raises the probability to about <strong>50%</strong>."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 326 } : { w: 640, h: 290 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact";
      var cs = 8.5, gx = compact ? (360 - COLS * cs) / 2 : 20, gy = compact ? 30 : 40;
      var tl = gsap.timeline();
      var hy = compact ? 18 : 24;
      var heads = ["1,000 people", "the 98 who tested positive", compact ? "posterior becomes the new prior" : "today's posterior is tomorrow's prior"].map(function (t, k) {
        var h = S("text", { x: gx, y: hy, class: "t t-sm t-muted", text: t }, svg);
        if (k) h.style.opacity = 0;
        return h;
      });

      // cells: column-major, so each group is one tidy block. Each cell = <g> with a faint base and an optional coloured overlay.
      var cells = [], over = [];
      for (var i = 0; i < COLS * ROWS; i++) {
        var c = Math.floor(i / ROWS), r = i % ROWS, g = S("g", {}, svg);
        var x = gx + c * cs + 1, y = gy + r * cs + 1;
        S("rect", { x: x, y: y, width: cs - 2, height: cs - 2, rx: 1.5, class: "f-faint" }, g);
        var o = null;
        if (i < SICK + FALSE_POS) {
          o = S("rect", { x: x, y: y, width: cs - 2, height: cs - 2, rx: 1.5, class: i < SICK ? "f-orange" : "f-blue" }, g);
          o.style.opacity = 0;
        }
        cells.push(g); over.push(o);
      }
      // rings mark "tested positive"
      function ring(i) {
        var c = Math.floor(i / ROWS), r = i % ROWS;
        var q = S("rect", { x: gx + c * cs + 1.2, y: gy + r * cs + 1.2, width: cs - 2.4, height: cs - 2.4, rx: 1.5, fill: "none", stroke: "var(--a-ink)", "stroke-width": compact ? 1.4 : 1.6 }, cells[i]);
        q.style.opacity = 0;
        return q;
      }
      var sickOver = over.slice(0, SICK), fpOver = over.slice(SICK, SICK + FALSE_POS);
      var sickRings = [], fpRings = [];
      for (var k = 0; k < SICK_POS; k++) sickRings.push(ring(k));
      for (var k2 = SICK; k2 < SICK + FALSE_POS; k2++) fpRings.push(ring(k2));
      var sickPos = cells.slice(0, SICK_POS), falsePos = cells.slice(SICK, SICK + FALSE_POS);
      var negatives = cells.slice(SICK_POS, SICK).concat(cells.slice(SICK + FALSE_POS));
      tl.addLabel("s0", 0);

      // text: compact = one statement row + legend; wide = growing list on the right
      var tx = compact ? 12 : 384, ty0 = compact ? gy + ROWS * cs + 26 : 56, lh = 24;
      function line(txt, k, cls) {
        var y = compact ? ty0 : ty0 + k * lh;
        var t = S("text", { x: tx, y: y, class: "t " + (compact ? "t-sm " : "") + (cls || ""), text: txt }, svg);
        t.style.opacity = 0;
        return t;
      }
      var L = compact ? [
        line("prior P(D) = 10 / 1000 = 1%", 0, "t-orange"),
        line("likelihood P(+ | D) = 9 / 10 = 90%", 0, "t-orange"),
        line("P(+ | healthy) = 89 / 990 ≈ 9%", 0, "t-blue"),
        line("evidence P(+) = 98 / 1000", 0),
        line("posterior P(D | +) = 9 / 98 ≈ 9%", 0, "t-orange"),
        line("after a 2nd positive test: ≈ 50%", 0, "t-orange")
      ] : [
        line("prior  P(D) = 1%", 0, "t-orange"),
        line("likelihood  P(+ | D) = 90%", 1, "t-orange"),
        line("false +  P(+ | healthy) ≈ 9%", 2, "t-blue"),
        line("evidence  P(+) = 98 / 1000", 3),
        line("posterior  P(D | +) = 9 / 98 ≈ 9%", 4, "t-orange"),
        line("2nd positive test  →  ≈ 50%", 6, "t-orange")
      ];
      L.forEach(function (t) { t.setAttribute("font-weight", 600); });
      // legend
      var ly = compact ? ty0 + 26 : 230, lg = S("g", {}, svg);
      function key(x, cls, ring, txt) {
        var g = S("g", {}, lg);
        S("rect", { x: x, y: ly - 9, width: 10, height: 10, rx: 2, class: cls, stroke: ring ? "var(--a-ink)" : "none", "stroke-width": ring ? 1.5 : 0 }, g);
        S("text", { x: x + 15, y: ly, class: "t t-sm t-muted", text: txt }, g);
        g.style.opacity = 0;
        return g;
      }
      var K = compact
        ? [key(12, "f-orange", false, "sick"), key(70, "f-faint", true, "tested +"), key(160, "f-blue", false, "healthy, tested +")]
        : [key(384, "f-orange", false, "sick"), key(444, "f-faint", true, "tested +"), key(384, "f-blue", false, "healthy, tested +")];
      if (!compact) { K[2].setAttribute("transform", "translate(0 22)"); }

      function show(k) {
        if (compact && k > 0) tl.to(L[k - 1], { opacity: 0, duration: 0.2 });
        LC.popIn(tl, L[k], { duration: 0.35 }, compact && k > 0 ? "<0.1" : undefined);
      }

      // s1: prior
      tl.to(sickOver, { opacity: 1, duration: 0.5, stagger: 0.03 });
      show(0); LC.popIn(tl, K[0], { duration: 0.3 }, "<");
      tl.addLabel("s1");

      // s2: likelihood (rings on the 9 sick positives)
      tl.to(sickRings, { opacity: 1, duration: 0.4, stagger: 0.04 });
      show(1); LC.popIn(tl, K[1], { duration: 0.3 }, "<");
      tl.addLabel("s2");

      // s3: false positives
      tl.to(fpOver.concat(fpRings), { opacity: 1, duration: 0.5, stagger: 0.004 });
      show(2); LC.popIn(tl, K[2], { duration: 0.3 }, "<");
      tl.addLabel("s3");

      // s4: condition on "+": dim the negatives
      tl.to(negatives, { opacity: 0.15, duration: 0.6 });
      show(3);
      tl.to(heads[0], { opacity: 0, duration: 0.2 }, "<");
      tl.to(heads[1], { opacity: 1, duration: 0.3 });
      tl.addLabel("s4");

      // s5: posterior
      tl.to(falsePos, { opacity: 0.55, duration: 0.4 });
      tl.to(sickPos, { scale: 1.3, transformOrigin: "50% 50%", duration: 0.25, yoyo: true, repeat: 1 }, "<");
      show(4);
      tl.addLabel("s5");

      // s6: second test
      show(5);
      tl.to(heads[1], { opacity: 0, duration: 0.2 }, "<");
      tl.to(heads[2], { opacity: 1, duration: 0.3 });
      tl.addLabel("s6");
      return tl;
    }
  };
})();
