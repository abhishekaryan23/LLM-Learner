/* RS.2: spend more compute at answer time. Sample N = 5 reasoning chains for one question,
   then either take a majority vote over their final answers (self-consistency) or let a scorer
   pick the best one (best-of-N). Answers [7, 7, 9, 7, 5]: 7 wins with 3 of 5 votes.
   Scores [0.71, 0.84, 0.32, 0.66, 0.45]: the top-scored chain (#2) also says 7. */
(function () {
  var LC = window.LC;
  var ANS = ["7", "7", "9", "7", "5"];
  var SCORE = [0.71, 0.84, 0.32, 0.66, 0.45];
  var BARS = [[0.8, 0.6, 0.7], [0.7, 0.85, 0.5], [0.9, 0.4, 0.65], [0.6, 0.75, 0.8], [0.85, 0.55, 0.45]];
  var TALLY = [["7", 3], ["9", 1], ["5", 1]];
  var BEST = 1;

  LC.anims["rs-2-voting"] = {
    title: "Five tries, then vote or pick",
    steps: [
      "One question (the pencil problem from RS.1). Instead of one answer, we will spend more compute <strong>at inference time</strong>.",
      "Sample <strong>$N = 5$ reasoning chains</strong> with temperature above 0, so each one takes a slightly different path. They run in parallel.",
      "Read off each chain's <strong>final answer</strong>: 7, 7, 9, 7, 5. Two chains slipped somewhere, and they slipped in <em>different</em> ways.",
      "<strong>Majority vote</strong> (self-consistency): count the answers and return the most common one. 7 gets 3 of 5 votes and wins. No scorer needed, only answers you can compare.",
      "<strong>Best-of-N</strong> instead: a scorer (a reward model or verifier) rates each chain and we keep the top one, chain #2 with 0.84, which says 7. This is only as good as the scorer (RS.4).",
      "Either way the cost is about <strong>5× the tokens</strong> of a single answer. What you buy with them depends on how often one sample is right, and on whether the mistakes are spread out."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 404 } : { w: 640, h: 372 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      if (compact) svg = S("g", { transform: "translate(0,22)" }, svg); // keep the top-right corner free for the "swipe" hint
      var cw = compact ? 56 : 76, gap = compact ? 10 : 22, n = ANS.length;
      var total = n * cw + (n - 1) * gap;
      var x0 = compact ? (W - total) / 2 : W - 16 - total;
      var mid = x0 + total / 2;
      function cx(i) { return x0 + i * (cw + gap) + cw / 2; }
      var chainY = 70, chainH = 72, ansY = 168, scoreY = 192, tallyHead = 218, tallyY = 242, rowGap = 24;
      var sumY = tallyY + 3 * rowGap + 14;

      function rowLabel(txt, y) {
        return compact ? [] : [S("text", { x: 12, y: y, class: "t t-sm t-muted", text: txt }, svg)];
      }

      // s0: the question
      var qw = compact ? 260 : 300;
      S("rect", { x: mid - qw / 2, y: 8, width: qw, height: 36, rx: 10, class: "f-surface", stroke: "var(--a-ink)", "stroke-width": 1.5 }, svg);
      S("text", { x: mid, y: 31, class: "t t-mid", text: "question: Sam's pencils (RS.1)", "font-weight": 600 }, svg);
      tl.addLabel("s0", 0);

      // s1: five chains
      var fans = ANS.map(function (_, i) {
        return S("path", { d: "M" + mid + " 46L" + cx(i) + " " + (chainY - 2), class: "s-faint", "stroke-width": 1.5 }, svg);
      });
      var chains = ANS.map(function (_, i) {
        var g = S("g", {}, svg);
        var r = S("rect", { x: cx(i) - cw / 2, y: chainY, width: cw, height: chainH, rx: 8, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, g);
        BARS[i].forEach(function (f, k) {
          S("rect", { x: cx(i) - cw / 2 + 8, y: chainY + 10 + k * 13, width: (cw - 16) * f, height: 6, rx: 3, class: "f-faint" }, g);
        });
        S("text", { x: cx(i), y: chainY + chainH - 10, class: "t t-sm t-muted t-mid", text: "#" + (i + 1) }, g);
        return { g: g, r: r };
      });
      fans.forEach(function (p, i) { LC.drawIn(tl, p, { duration: 0.3 }, i ? "<0.06" : "+=0.02"); });
      LC.popIn(tl, chains.map(function (c) { return c.g; }).concat(rowLabel("5 samples", chainY + chainH / 2 + 4)), { duration: 0.3, stagger: 0.08 }, "-=0.15");
      tl.addLabel("s1");

      // s2: final answers
      var ans = ANS.map(function (a, i) {
        return S("text", { x: cx(i), y: ansY, class: "t t-lg t-mono t-mid", text: a }, svg);
      });
      LC.popIn(tl, ans.concat(rowLabel("answer", ansY - 2)), { duration: 0.3, stagger: 0.07 }, "+=0.02");
      tl.addLabel("s2");

      // s3: tally
      var tx = compact ? 46 : x0 + 22, bx = tx + 16, unit = compact ? 42 : 64;
      var tHead = S("text", { x: compact ? 16 : x0, y: tallyHead, class: "t t-sm t-muted", text: "votes per answer" }, svg);
      var tEls = [tHead].concat(rowLabel("vote", tallyHead));
      var bars = [];
      TALLY.forEach(function (t, k) {
        var y = tallyY + k * rowGap;
        tEls.push(S("text", { x: tx, y: y, class: "t t-mono t-end", text: t[0], "font-weight": 600 }, svg));
        bars.push(S("rect", { x: bx, y: y - 12, width: 0, height: 15, rx: 3, class: k === 0 ? "f-orange" : "f-faint" }, svg));
      });
      var vText = TALLY.map(function (t, k) {
        return S("text", { x: bx + t[1] * unit + 8, y: tallyY + k * rowGap, class: "t t-sm" + (k === 0 ? " t-orange" : " t-muted"),
          text: t[1] + (t[1] === 1 ? " vote" : " votes") + (k === 0 ? " → majority" : ""), "font-weight": k === 0 ? 600 : 400 }, svg);
      });
      LC.popIn(tl, tEls, { duration: 0.3 }, "+=0.02");
      bars.forEach(function (b, k) { tl.to(b, { attr: { width: TALLY[k][1] * unit }, duration: 0.5, ease: "power2.out" }, k ? "<0.1" : undefined); });
      LC.popIn(tl, vText, { duration: 0.3, stagger: 0.05 }, "-=0.2");
      ans.forEach(function (a, i) { if (ANS[i] === "7") tl.to(a, { fill: "var(--a-orange)", duration: 0.3 }, "<"); });
      tl.addLabel("s3");

      // s4: best-of-N with a scorer
      var sc = SCORE.map(function (s, i) {
        return S("text", { x: cx(i), y: scoreY, class: "t t-sm t-mono t-mid" + (i === BEST ? " t-orange" : " t-muted"), text: s.toFixed(2), "font-weight": i === BEST ? 700 : 400 }, svg);
      });
      var bestTxt = S("text", { x: compact ? 16 : x0, y: sumY, class: "t t-sm", text: "best-of-5: top score 0.84 (#2) → answer 7" }, svg);
      LC.popIn(tl, sc.concat(rowLabel("scorer", scoreY)), { duration: 0.3, stagger: 0.06 }, "+=0.02");
      tl.to(chains[BEST].r, { attr: { stroke: "var(--a-orange)", "stroke-width": 3 }, duration: 0.3 });
      LC.popIn(tl, [bestTxt], { duration: 0.3 }, "<");
      tl.addLabel("s4");

      // s5: the cost
      var costTxt = S("text", { x: compact ? 16 : x0, y: sumY + 24, class: "t t-sm t-muted", text: "cost: 5 chains ≈ 5× the tokens of one answer" }, svg);
      LC.popIn(tl, [costTxt], { duration: 0.4 }, "+=0.02");
      tl.addLabel("s5");
      return tl;
    }
  };
})();
