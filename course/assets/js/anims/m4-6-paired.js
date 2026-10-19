/* M4.6: why paired comparisons are more powerful than two separate CIs.
   Toy: 20 questions. A 14/20, B 12/20; both right 11, both wrong 5, A-only 3, B-only 1.
   Separate 95% CIs (normal approx.): A 70 ± 20.1, B 60 ± 21.5.
   Real scale: 1,000 questions, A 82%, B 80%, discordant 60 (A-only) vs 40 (B-only).
   Unpaired SE of the difference = sqrt(.82·.18/1000 + .8·.2/1000) = 1.75 pts → 2.0 ± 3.4.
   Paired: d_i ∈ {−1, 0, 1}, var = 0.1 − 0.02² = 0.0996, SE = 1.0 pt → 2.0 ± 2.0 = [0.04, 3.96]. */
(function () {
  var LC = window.LC;
  var COLS = ["RR", "RR", "RW", "RR", "WW", "RR", "RR", "WR", "RR", "WW", "RR", "RW", "RR", "WW", "RR", "RR", "WW", "RW", "RR", "WW"];

  LC.anims["m4-6-paired"] = {
    title: "Paired comparison: let the questions cancel out",
    steps: [
      "Two models answer the <strong>same 20 questions</strong>. A gets 14 right (70%), B gets 12 (60%). Is A better, or is that luck?",
      "The naive check: give each score its own 95% CI. They're each about ±20 points and <strong>overlap almost completely</strong>, so this view can't tell them apart.",
      "But the questions are shared. On 16 of them the models <strong>agree</strong> (both right or both wrong). Those questions say nothing about which model is better. Easy and hard questions cancel out.",
      "All the evidence about the difference sits in the <strong>discordant</strong> questions: A right and B wrong on 3, the reverse on 1. A paired test (McNemar's test, or a paired bootstrap) looks only at these.",
      "At real scale, 1,000 questions, A 82% vs B 80%. Separate CIs give a difference of 2.0 ± 3.4 points, which includes 0. They disagree on 100 questions (60 vs 40), and the <strong>paired</strong> CI is 2.0 ± 2.0, which just excludes 0. Same data, much sharper answer."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 330 } : { w: 640, h: 222 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      var T = compact
        ? { x0: 28, tile: 14, gap: 2.5, title: 16, ya: 28, yb: 48, sum: 84, right: W - 4 }
        : { x0: 30, tile: 13, gap: 2, title: 16, ya: 28, yb: 48, sum: 84, right: 328 };
      var A = compact
        ? { l: 28, r: 330, title: 114, ya: 136, yb: 158, axis: 176, tick: 194 }
        : { l: 30, r: 328, title: 120, ya: 144, yb: 166, axis: 186, tick: 204 };
      var Dp = compact
        ? { l: 92, r: 344, title: 226, la: 248, ya: 258, lb: 280, yb: 290, axis: 304, tick: 322, lab: 4 }
        : { l: 440, r: 626, title: 16, la: 56, ya: 66, lb: 98, yb: 108, axis: 128, tick: 146, lab: 372 };
      function tx(c) { return T.x0 + c * (T.tile + T.gap); }
      function ax(a) { return A.l + a * (A.r - A.l); }
      function dx(v) { return Dp.l + ((v + 2) / 8) * (Dp.r - Dp.l); }

      // s0: two rows of tiles
      if (compact) S("text", { x: 4, y: T.title, class: "t t-sm t-muted", text: "Same 20 questions · A: 14 right, B: 12" }, svg);
      else {
        S("text", { x: 4, y: T.title, class: "t t-sm t-muted", text: "Same 20 questions" }, svg);
        S("text", { x: T.right, y: T.title, class: "t t-sm t-mono t-end", text: "A 14/20 · B 12/20" }, svg);
      }
      S("text", { x: 4, y: T.ya + 11, class: "t t-sm t-orange", "font-weight": 700, text: "A" }, svg);
      S("text", { x: 4, y: T.yb + 11, class: "t t-sm t-blue", "font-weight": 700, text: "B" }, svg);
      var concord = [], discord = [];
      COLS.forEach(function (c, i) {
        var g = S("g", {}, svg);
        S("rect", { x: tx(i), y: T.ya, width: T.tile, height: T.tile, rx: 3, class: c[0] === "R" ? "f-orange" : "f-faint" }, g);
        S("rect", { x: tx(i), y: T.yb, width: T.tile, height: T.tile, rx: 3, class: c[1] === "R" ? "f-blue" : "f-faint" }, g);
        (c[0] === c[1] ? concord : discord).push({ g: g, i: i });
      });
      tl.addLabel("s0", 0);

      // s1: separate CIs on an accuracy axis
      var p1 = S("g", {}, svg);
      S("text", { x: 4, y: A.title, class: "t t-sm t-muted", text: "Separate 95% CIs" }, p1);
      S("line", { x1: A.l, x2: A.r, y1: A.axis, y2: A.axis, class: "s-axis" }, p1);
      [0, 0.25, 0.5, 0.75, 1].forEach(function (a) {
        S("text", { x: ax(a), y: A.tick, class: "t t-sm t-muted t-mid", text: Math.round(a * 100) + "%" }, p1);
        S("line", { x1: ax(a), x2: ax(a), y1: A.axis, y2: A.axis + 4, class: "s-axis" }, p1);
      });
      S("text", { x: 4, y: A.ya + 4, class: "t t-sm t-orange", "font-weight": 700, text: "A" }, p1);
      S("text", { x: 4, y: A.yb + 4, class: "t t-sm t-blue", "font-weight": 700, text: "B" }, p1);
      function ci(lo, hi, y, cls) {
        return S("path", { d: "M" + ax(lo) + " " + (y - 6) + "V" + (y + 6) + "M" + ax(lo) + " " + y + "H" + ax(hi) + "M" + ax(hi) + " " + (y - 6) + "V" + (y + 6), class: cls, "stroke-width": 2.5 }, svg);
      }
      var ciA = ci(0.499, 0.901, A.ya, "s-orange"), ciB = ci(0.385, 0.815, A.yb, "s-blue");
      var dA = S("circle", { cx: ax(0.7), cy: A.ya, r: 5, class: "f-orange" }, svg);
      var dB = S("circle", { cx: ax(0.6), cy: A.yb, r: 5, class: "f-blue" }, svg);
      LC.popIn(tl, p1, { duration: 0.4 });
      LC.drawIn(tl, ciA, { duration: 0.6 });
      LC.drawIn(tl, ciB, { duration: 0.6 }, "<");
      LC.popIn(tl, [dA, dB], { duration: 0.3 });
      tl.addLabel("s1");

      // s2: fade the concordant questions
      var sum1 = S("text", { x: 4, y: T.sum, class: "t t-sm t-muted", text: "16 agree: no information about A vs B" }, svg);
      tl.to(concord.map(function (o) { return o.g; }), { opacity: 0.18, duration: 0.6 });
      LC.popIn(tl, sum1, { duration: 0.3 }, "<0.2");
      tl.addLabel("s2");

      // s3: highlight the discordant ones
      var rings = discord.map(function (o) {
        return S("rect", { x: tx(o.i) - 2.5, y: T.ya - 2.5, width: T.tile + 5, height: T.yb - T.ya + T.tile + 5, rx: 4, class: "f-none", stroke: "var(--a-ink)", "stroke-width": 2 }, svg);
      });
      var sum2 = S("text", { x: 4, y: T.sum, class: "t t-sm", text: "A only: 3 · B only: 1 · difference = 2/20" }, svg);
      tl.to(sum1, { opacity: 0, duration: 0.3 });
      LC.popIn(tl, rings, { duration: 0.3, stagger: 0.1 });
      LC.popIn(tl, sum2, { duration: 0.3 });
      tl.addLabel("s3");

      // s4: the real-scale difference CIs
      var p2 = S("g", {}, svg);
      S("text", { x: Dp.lab, y: Dp.title, class: "t t-sm t-muted", text: compact ? "1,000 questions: A − B, in points" : "1,000 questions: A − B (points)" }, p2);
      S("line", { x1: Dp.l, x2: Dp.r, y1: Dp.axis, y2: Dp.axis, class: "s-axis" }, p2);
      [-2, 0, 2, 4, 6].forEach(function (v) {
        S("text", { x: dx(v), y: Dp.tick, class: "t t-sm t-muted t-mid", text: v < 0 ? "−" + -v : v }, p2);
        S("line", { x1: dx(v), x2: dx(v), y1: Dp.axis, y2: Dp.axis + 4, class: "s-axis" }, p2);
      });
      S("line", { x1: dx(0), x2: dx(0), y1: Dp.la + 4, y2: Dp.axis, class: "s-faint", "stroke-dasharray": "4 4", "stroke-width": 1.5 }, p2);
      S("text", { x: Dp.lab, y: Dp.ya + 4, class: "t t-sm t-muted", text: "separate" }, p2);
      S("text", { x: Dp.lab, y: Dp.yb + 4, class: "t t-sm t-orange", "font-weight": 650, text: "paired" }, p2);
      S("text", { x: dx(2), y: Dp.la, class: "t t-sm t-mono t-mid t-muted", text: "2.0 ± 3.4" }, p2);
      S("text", { x: dx(2), y: Dp.lb, class: "t t-sm t-mono t-mid t-orange", text: "2.0 ± 2.0" }, p2);
      function dci(lo, hi, y, cls) {
        return S("path", { d: "M" + dx(lo) + " " + (y - 6) + "V" + (y + 6) + "M" + dx(lo) + " " + y + "H" + dx(hi) + "M" + dx(hi) + " " + (y - 6) + "V" + (y + 6), class: cls, "stroke-width": 2.5 }, svg);
      }
      var u = dci(-1.44, 5.44, Dp.ya, "s-ink"), pr = dci(0.04, 3.96, Dp.yb, "s-orange");
      var c1 = S("circle", { cx: dx(2), cy: Dp.ya, r: 4.5, class: "f-ink" }, svg);
      var c2 = S("circle", { cx: dx(2), cy: Dp.yb, r: 4.5, class: "f-orange" }, svg);
      LC.popIn(tl, p2, { duration: 0.4 });
      LC.drawIn(tl, u, { duration: 0.6 });
      LC.popIn(tl, c1, { duration: 0.2 });
      LC.drawIn(tl, pr, { duration: 0.6 });
      LC.popIn(tl, c2, { duration: 0.2 });
      tl.addLabel("s4");
      return tl;
    }
  };
})();
