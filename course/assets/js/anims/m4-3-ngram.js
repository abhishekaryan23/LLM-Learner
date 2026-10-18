/* M4.3: catching contamination with n-gram overlap, then a black-box perturbation probe.
   Test item (15 words after normalising) → 12 word 4-grams. The crawled page rewords
   "gives away 9" as "gives 9 away", so 4-grams #7–#11 miss and 7 of 12 (58%) are found. */
(function () {
  var LC = window.LC;
  var WORDS = ["Mia", "has", "3", "boxes", "of", "12", "pencils.", "She", "gives", "away", "9.", "How", "many", "are", "left?"];
  var NG = 12, FOUND = [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1];
  var COVERED = WORDS.map(function (_, w) {           // a word is covered if any found 4-gram contains it
    for (var g = Math.max(0, w - 3); g <= Math.min(NG - 1, w); g++) if (FOUND[g]) return true;
    return false;
  });

  LC.anims["m4-3-ngram"] = {
    title: "Catching a leaked test question",
    steps: [
      "A test item from a maths benchmark (made up for this demo). It is supposed to be <strong>unseen</strong>: the score should measure solving, not remembering.",
      "But a forum page in the web crawl quotes a near-copy, <em>with the answer</em>. If pretraining reads it, the model can learn “27” for this question.",
      "Detection, when you have the training data: normalise the text (lowercase, drop punctuation), then slide a window of <strong>n = 4 words</strong> across the test item. That gives 12 overlapping <strong>4-grams</strong>.",
      "Look each 4-gram up in an index of the training corpus. <strong>7 of 12</strong> are found (58%); only the reworded part breaks the match. Above a typical threshold (say, half the n-grams), so the item is <strong>flagged</strong>. Real filters use longer n-grams, e.g. 13 words in GPT-3 (Brown et al., 2020).",
      "Fix it on the training side: <strong>decontaminate</strong>. Drop or mask the flagged page before pretraining, and report which test items were affected.",
      "No access to the training data? <strong>Probe</strong> the model instead: change the numbers. The new answer is $3 \\times 15 - 9 = 36$, yet a model that memorised the page may still answer <strong>27</strong>."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 306 } : { w: 640, h: 280 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var L = compact
        ? { bx: 10, bw: 340, testY: 26, testH: 62, testLines: [[0, 7], [7, 15]], lineY: [50, 74],
            crawlLbl: 112, crawlY: 120, crawlH: 84, crawl: ["Q: Mia has 3 boxes of 12 pencils.", "She gives 9 away. How many are left?", "A: 27 pencils"], crawlLineY: [144, 166, 188],
            stripLbl: 230, cellY: 238, cellH: 26, cellW: 24, cellG: 4, botY: 290,
            probe: [["Mia has 3 boxes of ", "15", " pencils."], ["She gives away 9. How many are left?"]], probeH: 62, probeLineY: [144, 168], ans1: 216, ans2: 244 }
        : { bx: 20, bw: 600, testY: 26, testH: 44, testLines: [[0, 15]], lineY: [53],
            crawlLbl: 96, crawlY: 104, crawlH: 62, crawl: ["Q: Mia has 3 boxes of 12 pencils. She gives 9 away. How many are left?", "A: 27 pencils"], crawlLineY: [128, 150],
            stripLbl: 196, cellY: 204, cellH: 30, cellW: 40, cellG: 6, botY: 262,
            probe: [["Mia has 3 boxes of ", "15", " pencils. She gives away 9. How many are left?"]], probeH: 44, probeLineY: [131], ans1: 182, ans2: 212 };
      var tx = L.bx + 12;
      var tl = gsap.timeline();

      // s0: the test item, one tspan per word so words can be coloured later
      S("text", { x: L.bx + 2, y: 18, class: "t t-sm t-muted", text: "benchmark test item" }, svg);
      S("rect", { x: L.bx, y: L.testY, width: L.bw, height: L.testH, rx: 10, class: "f-surface", stroke: "var(--a-blue)", "stroke-width": 2 }, svg);
      var spans = [];
      L.testLines.forEach(function (r, li) {
        var t = S("text", { x: tx, y: L.lineY[li], class: "t", style: "white-space:pre" }, svg);
        for (var w = r[0]; w < r[1]; w++) spans[w] = S("tspan", { class: "w", text: WORDS[w] + (w < r[1] - 1 ? " " : "") }, t);
      });
      tl.addLabel("s0", 0);

      // s1: the crawled page
      var crawl = S("g", {}, svg);
      var crawlLbl = S("text", { x: L.bx + 2, y: L.crawlLbl, class: "t t-sm t-muted", text: "crawled web page (training data)" }, svg);
      S("rect", { x: L.bx, y: L.crawlY, width: L.bw, height: L.crawlH, rx: 10, class: "f-surface2", stroke: "var(--line)", "stroke-width": 1.5 }, crawl);
      L.crawl.forEach(function (s, i) { S("text", { x: tx, y: L.crawlLineY[i], class: "t t-sm t-mono", text: s }, crawl); });
      LC.popIn(tl, [crawlLbl, crawl], { duration: 0.5 });
      tl.addLabel("s1");

      // s2: the 4-gram strip and the first window
      var stripLbl = S("text", { x: L.bx + 2, y: L.stripLbl, class: "t t-sm t-muted", text: compact ? "the test item's 4-grams" : "the test item's 12 overlapping 4-grams" }, svg);
      var sx0 = (W - (NG * L.cellW + (NG - 1) * L.cellG)) / 2;
      var cells = [], hits = [], nums = [];
      for (var g = 0; g < NG; g++) {
        var x = sx0 + g * (L.cellW + L.cellG);
        cells.push(S("rect", { x: x, y: L.cellY, width: L.cellW, height: L.cellH, rx: 5, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, svg));
        hits.push(S("rect", { x: x, y: L.cellY, width: L.cellW, height: L.cellH, rx: 5, class: FOUND[g] ? "f-orange" : "f-faint" }, svg));
        nums.push(S("text", { x: x + L.cellW / 2, y: L.cellY + L.cellH / 2 + 4, class: "t t-sm t-mid t-nohalo", style: "", text: g + 1 }, svg));
      }
      hits.forEach(function (h) { h.style.opacity = 0; });
      var ring = S("rect", { x: sx0 - 3, y: L.cellY - 3, width: L.cellW + 6, height: L.cellH + 6, rx: 7, class: "f-none", stroke: "var(--a-blue)", "stroke-width": 2.5 }, svg);
      var win = S("text", { x: W / 2, y: L.botY, class: "t t-sm t-mid t-blue", text: "4-gram #1 = “mia has 3 boxes”" }, svg);
      LC.popIn(tl, [stripLbl].concat(cells, nums), { duration: 0.3, stagger: 0.03 });
      tl.to(spans.slice(0, 4), { attr: { class: "t-blue" }, duration: 0.01 });
      LC.popIn(tl, [ring, win], { duration: 0.3 });
      tl.addLabel("s2");

      // s3: lookups: found cells turn orange, covered words turn orange
      var verdict = S("text", { x: W / 2, y: L.botY, class: "t t-mid t-orange", "font-weight": 650, text: "7 of 12 found → 58% → flagged" }, svg);
      tl.to([ring, win], { opacity: 0, duration: 0.2 });
      tl.to(hits, { opacity: 1, duration: 0.15, stagger: 0.07 });
      tl.to(nums.filter(function (_, i) { return FOUND[i]; }), { attr: { style: "fill:var(--a-paper)" }, duration: 0.01 }, "<");
      tl.to(spans.filter(function (_, i) { return COVERED[i]; }), { attr: { class: "t-orange" }, duration: 0.01 });
      LC.popIn(tl, verdict, { duration: 0.35 });
      tl.addLabel("s3");

      // s4: decontaminate: the page fades out of the training data
      var removed = S("text", { x: L.bx + L.bw - 2, y: L.crawlLbl, class: "t t-sm t-orange t-end", "font-weight": 650, text: "removed ✗" }, svg);
      tl.to(crawl, { opacity: 0.25, duration: 0.5 });
      LC.popIn(tl, removed, { duration: 0.3 });
      tl.addLabel("s4");

      // s5: black-box probe with new numbers
      var probe = S("g", {}, svg);
      probe.style.opacity = 0;
      S("text", { x: L.bx + 2, y: L.crawlLbl, class: "t t-sm t-muted", text: "probe: same item, new numbers" }, probe);
      S("rect", { x: L.bx, y: L.crawlY, width: L.bw, height: L.probeH, rx: 10, class: "f-surface", stroke: "var(--a-blue)", "stroke-width": 2 }, probe);
      L.probe.forEach(function (parts, li) {
        var t = S("text", { x: tx, y: L.probeLineY[li], class: "t", style: "white-space:pre" }, probe);
        parts.forEach(function (p, k) { S("tspan", { class: p === "15" ? "t-orange" : "w", "font-weight": p === "15" ? 700 : 400, text: p }, t); });
      });
      S("text", { x: W / 2, y: L.ans1, class: "t t-mid", text: "correct answer: 3 × 15 − 9 = 36" }, probe);
      S("text", { x: W / 2, y: L.ans2, class: "t t-mid t-orange", "font-weight": 650, text: "memorising model says: 27 ✗" }, probe);
      tl.to([crawl, crawlLbl, removed, stripLbl, verdict].concat(cells, hits, nums), { opacity: 0, duration: 0.35 });
      tl.to(probe, { opacity: 1, duration: 0.45 });
      tl.addLabel("s5");
      return tl;
    }
  };
})();
