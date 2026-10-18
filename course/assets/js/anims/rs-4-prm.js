/* RS.4: outcome vs process grading. Problem: 3 bags × 7 apples, eat 4 → 17.
   Solution A has two compensating mistakes (3 × 7 = 24, then 24 − 4 = 17) but the right final answer;
   solution B is correct throughout. An outcome check rewards both with 1; a process reward model
   (illustrative step scores) flags A's steps, and min-aggregation gives A 0.08 vs B 0.96. */
(function () {
  var LC = window.LC;
  var SOL = [
    { name: "solution A", steps: ["3 × 7 = 24", "24 − 4 = 17"], prm: [0.08, 0.11], ans: "17" },
    { name: "solution B", steps: ["3 × 7 = 21", "21 − 4 = 17"], prm: [0.97, 0.96], ans: "17" }
  ];

  LC.anims["rs-4-prm"] = {
    title: "Grade the answer, or grade every step?",
    steps: [
      "A two-step problem, and a model's solution A. Look closely: $3 \\times 7$ is not 24, and $24 - 4$ is not 17. Two mistakes that happen to cancel out.",
      "An <strong>outcome</strong> grader (an exact-match check, or an outcome reward model) sees only the final answer. 17 matches the key, so A gets the <strong>full reward, 1</strong>.",
      "A <strong>process reward model</strong> (PRM) scores <em>each step</em>: the probability that this step is correct given the ones before it. Both of A's steps get very low scores.",
      "To score a whole solution, combine the step scores, here with the <strong>minimum</strong> (the weakest step). A gets 0.08: a lucky answer no longer earns full credit.",
      "Solution B is correct throughout. Outcome grading can't tell A and B apart (both get 1); process grading can (0.08 vs 0.96). The step scores here are illustrative.",
      "Step scores also work on <strong>partial</strong> solutions. A search can drop A right after step 1, before spending tokens on the rest, and keep expanding B."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 322 } : { w: 640, h: 286 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      if (compact) svg = S("g", { transform: "translate(0,22)" }, svg); // keep the top-right corner free for the "swipe" hint

      // problem
      var lines = compact ? ["Ana has 3 bags of 7 apples and eats 4.", "How many apples are left?"]
        : ["Ana has 3 bags of 7 apples and eats 4. How many apples are left?"];
      var boxH = compact ? 54 : 36;
      S("rect", { x: 8, y: 8, width: W - 16, height: boxH, rx: 10, class: "f-surface", stroke: "var(--a-ink)", "stroke-width": 1.5 }, svg);
      lines.forEach(function (t, i) { S("text", { x: 20, y: 30 + i * 20, class: "t", text: t, "font-weight": 600 }, svg); });

      var top = boxH + 8;
      var headY = top + 26, rowH = 28, chipW = compact ? 112 : 136;
      var y1 = headY + 10, y2 = y1 + rowH + 8, y3 = y2 + rowH + 8;
      var outY = y3 + rowH + 26, procY = outY + 24, noteY = procY + 30;
      var colX = compact ? [12, 186] : [130, 392];

      // row labels (wide only)
      function rowLabel(txt, y) {
        return compact ? [] : [S("text", { x: 12, y: y, class: "t t-sm t-muted", text: txt }, svg)];
      }
      var labs = [rowLabel("step 1", y1 + 19), rowLabel("step 2", y2 + 19), rowLabel("final answer", y3 + 19)];

      function chip(x, y, txt) {
        var g = S("g", {}, svg);
        var r = S("rect", { x: x, y: y, width: chipW, height: rowH, rx: 7, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, g);
        S("text", { x: x + 10, y: y + 19, class: "t t-mono", text: txt }, g);
        return { g: g, r: r };
      }

      var cols = SOL.map(function (s, k) {
        var x = colX[k];
        var o = {};
        o.head = S("text", { x: x, y: headY, class: "t t-sm t-muted", text: s.name, "font-weight": 600 }, svg);
        o.c1 = chip(x, y1, s.steps[0]);
        o.c2 = chip(x, y2, s.steps[1]);
        o.c3 = chip(x, y3, "answer: " + s.ans);
        o.p = s.prm.map(function (v, i) {
          var bad = v < 0.5;
          return S("text", { x: x + chipW + 8, y: (i ? y2 : y1) + 19, class: "t t-sm t-mono" + (bad ? " t-blue" : " t-orange"), text: v.toFixed(2) + (bad ? " ✗" : " ✓"), "font-weight": 600 }, svg);
        });
        o.out = S("text", { x: x, y: outY, class: "t t-sm", text: (compact ? "outcome: " : "") + "1 ✓", "font-weight": 600 }, svg);
        var mn = Math.min.apply(null, s.prm);
        o.proc = S("text", { x: x, y: procY, class: "t t-sm" + (mn < 0.5 ? " t-blue" : " t-orange"), text: (compact ? "process: " : "min = ") + mn.toFixed(2), "font-weight": 600 }, svg);
        return o;
      });
      var A = cols[0], B = cols[1];
      var outLbl = rowLabel("outcome", outY), procLbl = rowLabel("process", procY);

      // s0: solution A only
      tl.addLabel("s0", 0);

      // s1: outcome grading
      LC.popIn(tl, [A.out].concat(outLbl), { duration: 0.35 }, "+=0.02");
      tl.to(A.c3.r, { attr: { stroke: "var(--a-orange)", "stroke-width": 2.5 }, duration: 0.3 }, "<");
      tl.addLabel("s1");

      // s2: process scores per step
      LC.popIn(tl, A.p, { duration: 0.3, stagger: 0.15 }, "+=0.02");
      tl.to([A.c1.r, A.c2.r], { attr: { stroke: "var(--a-blue)", "stroke-width": 2.5 }, duration: 0.3 }, "<");
      tl.addLabel("s2");

      // s3: aggregate
      LC.popIn(tl, [A.proc].concat(procLbl), { duration: 0.35 }, "+=0.02");
      tl.addLabel("s3");

      // s4: solution B
      LC.popIn(tl, [B.head, B.c1.g, B.c2.g, B.c3.g], { duration: 0.3, stagger: 0.06 }, "+=0.02");
      LC.popIn(tl, [B.out], { duration: 0.25 });
      LC.popIn(tl, B.p, { duration: 0.25, stagger: 0.1 });
      LC.popIn(tl, [B.proc], { duration: 0.25 });
      tl.to([B.c1.r, B.c2.r, B.c3.r], { attr: { stroke: "var(--a-orange)", "stroke-width": 2.5 }, duration: 0.3 }, "<");
      tl.addLabel("s4");

      // s5: prune A after step 1 during search
      var cutY = y1 + rowH + 4;
      var cut = S("path", { d: "M" + (colX[0] - 4) + " " + cutY + "H" + (colX[0] + chipW + 52), class: "s-blue", "stroke-width": 2.5 }, svg);
      var note = S("text", { x: compact ? 12 : 130, y: noteY, class: "t t-sm t-blue", text: compact ? "search: drop A after step 1" : "search: drop A after step 1, keep expanding B", "font-weight": 600 }, svg);
      LC.drawIn(tl, cut, { duration: 0.5 }, "+=0.02");
      tl.to([A.c2.g, A.c3.g, A.p[1]], { opacity: 0.3, duration: 0.4 }, "<");
      LC.popIn(tl, [note], { duration: 0.3 });
      tl.addLabel("s5");
      return tl;
    }
  };
})();
