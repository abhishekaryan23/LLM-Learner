/* RS.3: the RLVR loop that trains reasoning models (as in DeepSeek-R1-Zero, with GRPO).
   Toy reward r = accuracy (0/1) + format (0/1), each from a rule-based check.
   Group of 4: A correct + tags (2), B correct + tags (2), C wrong + tags (1), D wrong, no tags (0).
   mean 1.25, population std 0.829, advantages +0.90, +0.90, −0.30, −1.51. */
(function () {
  var LC = window.LC;
  var RESP = [
    { note: "re-checks", ans: "x = 5", len: 1.0, acc: 1, fmt: 1 },
    { note: "short", ans: "x = 5", len: 0.35, acc: 1, fmt: 1 },
    { note: "medium", ans: "x = 8", len: 0.6, acc: 0, fmt: 1 },
    { note: "no tags", ans: "x = 3", len: 0.2, acc: 0, fmt: 0 }
  ];
  var R = RESP.map(function (o) { return o.acc + o.fmt; });
  var G = R.length;
  var MEAN = R.reduce(function (a, b) { return a + b; }, 0) / G;
  var STD = Math.sqrt(R.reduce(function (a, r) { return a + (r - MEAN) * (r - MEAN); }, 0) / G);
  var ADV = R.map(function (r) { return (r - MEAN) / STD; });
  function sgn(v) { return (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(2); }

  LC.anims["rs-3-rlvr"] = {
    title: "The RLVR loop behind reasoning models",
    steps: [
      "A prompt whose answer a program can check: solve $3x + 5 = 20$ (the key is $x = 5$). The model is asked to reason inside <code>&lt;think&gt;</code> tags, then answer.",
      "The current policy samples a <strong>group</strong> of $G = 4$ responses. They differ in length and approach; one stops to <strong>re-check</strong> its work.",
      "<strong>Rule-based checks</strong>, no learned reward model: an <strong>accuracy</strong> reward (does the final answer equal 5?) and a <strong>format</strong> reward (is the reasoning inside the tags?).",
      "Toy reward $r$ = accuracy + format. The group's rewards are $[2, 2, 1, 0]$: mean $1.25$, standard deviation $\\approx 0.83$.",
      "<strong>Group-relative advantage</strong> $(r - \\text{mean})/\\text{std}$: $+0.90$ for the two correct answers, $-0.30$ and $-1.51$ for the others. The group is the baseline (GRPO, M3.5).",
      "The update makes every token of the above-average responses <strong>more likely</strong>, including the re-checking text, and the below-average ones less likely. Clipping and a KL leash keep the step small.",
      "Repeat for thousands of steps. Whatever habits tend to end in correct answers, such as longer thinking and checking, get reinforced. DeepSeek-AI (2025) reported response length growing steadily during R1-Zero's training."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 522 } : { w: 640, h: 486 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      var cw = compact ? 78 : 100, gap = compact ? 8 : 20;
      var total = G * cw + (G - 1) * gap;
      var x0 = compact ? (W - total) / 2 : W - 16 - total;
      var mid = x0 + total / 2;
      function cx(i) { return x0 + i * (cw + gap) + cw / 2; }
      var cardY = 66, cardH = 66, headY = 158, accY = 182, fmtY = 204, rY = 232, statY = 258, zeroY = 324, K = 30;
      var arY0 = 414, arY1 = 394, trendY = 446;
      if (!compact) { // tighter rows so the wide drawing stays under the player's 460px height cap at full size
        cardY = 60; headY = 148; accY = 168; fmtY = 188; rY = 214; statY = 238; zeroY = 296; K = 26;
        arY0 = 384; arY1 = 364; trendY = 408;
      }

      function rowLabel(txt, y) {
        return compact ? [] : [S("text", { x: 12, y: y, class: "t t-sm t-muted", text: txt }, svg)];
      }

      // s0: prompt
      var pw = compact ? 232 : 260;
      S("rect", { x: mid - pw / 2, y: 8, width: pw, height: 36, rx: 10, class: "f-surface", stroke: "var(--a-ink)", "stroke-width": 1.5 }, svg);
      S("text", { x: mid, y: 31, class: "t t-mid", text: "prompt: solve 3x + 5 = 20", "font-weight": 600 }, svg);
      tl.addLabel("s0", 0);

      // s1: group of responses
      var fans = RESP.map(function (_, i) {
        return S("path", { d: "M" + mid + " 46L" + cx(i) + " " + (cardY - 2), class: "s-faint", "stroke-width": 1.5 }, svg);
      });
      var cards = RESP.map(function (o, i) {
        var g = S("g", {}, svg);
        var r = S("rect", { x: cx(i) - cw / 2, y: cardY, width: cw, height: cardH, rx: 8, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, g);
        S("rect", { x: cx(i) - cw / 2 + 8, y: cardY + 10, width: Math.max(6, (cw - 16) * o.len), height: 6, rx: 3, class: o.fmt ? "f-faint" : "f-none", stroke: o.fmt ? "none" : "var(--a-faint)" }, g);
        S("text", { x: cx(i), y: cardY + 34, class: "t t-sm t-muted t-mid", text: o.note }, g);
        S("text", { x: cx(i), y: cardY + 55, class: "t t-mono t-mid", text: o.ans, "font-weight": 600 }, g);
        return { g: g, r: r };
      });
      fans.forEach(function (p, i) { LC.drawIn(tl, p, { duration: 0.3 }, i ? "<0.07" : "+=0.02"); });
      LC.popIn(tl, cards.map(function (c) { return c.g; }).concat(rowLabel("group, G = 4", cardY + 38)), { duration: 0.3, stagger: 0.08 }, "-=0.15");
      tl.addLabel("s1");

      // s2: rule-based checks
      var head = S("text", { x: mid, y: headY, class: "t t-sm t-muted t-mid", text: compact ? "check: answer = 5? · tags present?" : "rule-based check: answer = 5?  ·  reasoning inside tags?" }, svg);
      var accs = RESP.map(function (o, i) {
        return S("text", { x: cx(i), y: accY, class: "t t-sm t-mono t-mid" + (o.acc ? " t-orange" : " t-muted"), text: (compact ? "acc " : "") + (o.acc ? "1 ✓" : "0 ✗") }, svg);
      });
      var fmts = RESP.map(function (o, i) {
        return S("text", { x: cx(i), y: fmtY, class: "t t-sm t-mono t-mid" + (o.fmt ? " t-orange" : " t-muted"), text: (compact ? "fmt " : "") + (o.fmt ? "1 ✓" : "0 ✗") }, svg);
      });
      LC.popIn(tl, [head], { duration: 0.3 }, "+=0.02");
      LC.popIn(tl, accs.concat(rowLabel("accuracy", accY)), { duration: 0.25, stagger: 0.06 });
      LC.popIn(tl, fmts.concat(rowLabel("format", fmtY)), { duration: 0.25, stagger: 0.06 });
      tl.addLabel("s2");

      // s3: rewards and group stats
      var rews = R.map(function (r, i) {
        return S("text", { x: cx(i), y: rY, class: "t t-mono t-mid", text: "r = " + r, "font-weight": 600 }, svg);
      });
      var stat = S("text", { x: mid, y: statY, class: "t t-sm t-mid", text: "group mean = " + MEAN.toFixed(2) + "  ·  std = " + STD.toFixed(2) }, svg);
      LC.popIn(tl, rews.concat(rowLabel("reward", rY)), { duration: 0.3, stagger: 0.06 }, "+=0.02");
      LC.popIn(tl, [stat], { duration: 0.3 });
      tl.addLabel("s3");

      // s4: advantages
      var zero = S("path", { d: "M" + (x0 - 4) + " " + zeroY + "H" + (x0 + total + 4), class: "s-axis" }, svg);
      var bw = cw * 0.42;
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

      // s5: update
      var arrows = ADV.map(function (a, i) {
        var x = cx(i), up = a > 0, tip = up ? arY1 : arY0, tail = up ? arY0 : arY1, d = up ? 6 : -6;
        return S("path", { d: "M" + x + " " + tail + "V" + tip + "M" + (x - 6) + " " + (tip + d) + "L" + x + " " + tip + "L" + (x + 6) + " " + (tip + d), class: up ? "s-orange" : "s-blue", "stroke-width": 2.5 }, svg);
      });
      arrows.forEach(function (p, i) { LC.drawIn(tl, p, { duration: 0.35 }, i ? "<0.05" : "+=0.02"); });
      var upLbl = rowLabel("update", arY0 - 6);
      if (upLbl.length) LC.popIn(tl, upLbl, { duration: 0.2 }, "<");
      cards.forEach(function (c, i) {
        if (ADV[i] > 0) tl.to(c.r, { attr: { stroke: "var(--a-orange)", "stroke-width": 3 }, duration: 0.3 }, "<");
        else tl.to(c.g, { opacity: 0.45, duration: 0.3 }, "<");
      });
      tl.addLabel("s5");

      // s6: repeat; response length grows (shape only)
      var sx0 = compact ? 16 : x0, sw = compact ? 170 : 240, sh = 34, sy0 = trendY + 14;
      var tHead = S("text", { x: sx0, y: trendY, class: "t t-sm t-muted", text: "repeat for thousands of steps" }, svg);
      var axis = S("path", { d: "M" + sx0 + " " + sy0 + "V" + (sy0 + sh) + "H" + (sx0 + sw), class: "s-axis" }, svg);
      var dPath = "";
      for (var k = 0; k <= 40; k++) {
        var u = k / 40, v = 0.08 + 0.84 * Math.pow(u, 1.15) + 0.05 * Math.sin(u * 19) * u;
        dPath += (k ? "L" : "M") + (sx0 + 4 + u * (sw - 8)).toFixed(1) + " " + (sy0 + sh - 3 - v * (sh - 6)).toFixed(1);
      }
      var curve = S("path", { d: dPath, class: "s-orange", "stroke-width": 2.5 }, svg);
      var lx = sx0 + sw + 12;
      var cl1 = S("text", { x: lx, y: sy0 + 14, class: "t t-sm t-orange", text: "avg. response", "font-weight": 600 }, svg);
      var cl2 = S("text", { x: lx, y: sy0 + 30, class: "t t-sm t-orange", text: "length grows", "font-weight": 600 }, svg);
      var cl3 = S("text", { x: sx0, y: sy0 + sh + 18, class: "t t-sm t-muted", text: "training steps → (shape only)" }, svg);
      LC.popIn(tl, [tHead, cl3], { duration: 0.3 }, "+=0.02");
      LC.drawIn(tl, axis, { duration: 0.3 });
      LC.drawIn(tl, curve, { duration: 0.9 });
      LC.popIn(tl, [cl1, cl2], { duration: 0.3 }, "-=0.2");
      tl.addLabel("s6");
      return tl;
    }
  };
})();
