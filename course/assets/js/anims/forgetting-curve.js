/* M0.1: the forgetting curve, and how spaced retrieval flattens it. */
(function () {
  var LC = window.LC;
  // Memory model used for the picture: R(t) = floor + (1 - floor) * exp(-t / S).
  // Each successful review resets R to 1 and multiplies stability S.
  var FLOOR = 0.2;
  function R(t, S) { return FLOOR + (1 - FLOOR) * Math.exp(-t / S); }
  var REVIEWS = [1, 3, 7];            // review days
  var STAB = [1, 2.5, 6, 15];         // stability before/after each review
  var END = 14;

  LC.anims["forgetting-curve"] = {
    title: "The forgetting curve, and how spacing beats it",
    steps: [
      "You learn something new on <strong>day 0</strong>. Right now it feels 100% clear.",
      "With no review, memory fades fast: <strong>most of it is gone within a few days</strong>. Ebbinghaus measured this curve on himself and published it in 1885.",
      "<strong>Day 1, review #1.</strong> You <em>recall</em> it (a quiz, not a reread). Memory jumps back to the top…",
      "…and now it fades <strong>more slowly</strong>. On <strong>day 3</strong> you recall it again.",
      "<strong>Day 7, review #3.</strong> Each gap is longer than the last, yet you remember <em>more</em> each time you come back.",
      "By day 14 the spaced learner still holds roughly <strong>70%</strong>; the no-review learner is near the floor. Three short reviews, very different result."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 300 } : { w: 640, h: 330 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, H = ctx.h, compact = ctx.layout === "compact";
      var m = compact ? { l: 44, r: 14, t: 48, b: 44 } : { l: 56, r: 24, t: 48, b: 46 };
      var pw = W - m.l - m.r, ph = H - m.t - m.b;
      function sx(d) { return m.l + (d / END) * pw; }
      function sy(r) { return m.t + (1 - r) * ph; }
      var tl = gsap.timeline();

      // grid + axes
      var g = S("g", {}, svg);
      [0.25, 0.5, 0.75, 1].forEach(function (r) { S("line", { x1: m.l, x2: W - m.r, y1: sy(r), y2: sy(r), class: "s-grid" }, g); });
      S("path", { d: "M" + m.l + " " + m.t + "V" + (H - m.b) + "H" + (W - m.r), class: "s-axis" }, g);
      [0, 0.5, 1].forEach(function (r) { S("text", { x: m.l - 8, y: sy(r) + 4, class: "t t-sm t-muted t-end", text: Math.round(r * 100) + "%" }, g); });
      [0, 1, 3, 7, 14].forEach(function (d) { S("text", { x: sx(d), y: H - m.b + 18, class: "t t-sm t-muted t-mid", text: d }, g); });
      S("text", { x: m.l + pw / 2, y: H - 6, class: "t t-sm t-muted t-mid", text: "days after first learning" }, g);
      S("text", { x: 4, y: 16, class: "t t-sm t-muted", text: "↑ how much you remember" }, g);

      // step 0: learning dot
      S("circle", { cx: sx(0), cy: sy(1), r: 7, class: "f-ink" }, svg);
      tl.addLabel("s0", 0);

      // step 1: no-review curve
      var noRev = S("path", { d: LC.fnPath(function (t) { return R(t, STAB[0]); }, 0, END, sx, sy, 90), class: "s-blue" }, svg);
      noRev.style.strokeDasharray = "6 0";
      var noLbl = S("text", { x: sx(END) - 8, y: sy(FLOOR) - 10, class: "t t-sm t-blue t-end", text: "no review" }, svg);
      LC.drawIn(tl, noRev, { duration: 1.6 });
      LC.popIn(tl, noLbl, {}, "-=0.3");
      tl.addLabel("s1");

      // fade the no-review curve back so the spaced curve reads first
      tl.to([noRev, noLbl], { opacity: 0.35, duration: 0.3 });

      // steps 2–4: spaced segments; step 5: final segment + comparison
      var start = 0;
      var segs = REVIEWS.concat([END]);
      segs.forEach(function (day, i) {
        var s0 = start, Si = STAB[i];
        var seg = S("path", { d: LC.fnPath(function (t) { return R(t - s0, Si); }, s0, day, sx, sy, 50), class: "s-orange" }, svg);
        LC.drawIn(tl, seg, { duration: 1.1 });
        if (day !== END) {
          var low = R(day - s0, Si);
          var jump = S("path", { d: "M" + sx(day) + " " + sy(low) + "V" + sy(1), class: "s-orange", "stroke-dasharray": "4 5" }, svg);
          var mark = S("circle", { cx: sx(day), cy: sy(1), r: 6, class: "f-orange" }, svg);
          var lbl = S("text", { x: sx(day), y: sy(1) - 12, class: "t t-sm t-orange t-mid", text: compact ? "R" + (i + 1) : "review " + (i + 1) }, svg);
          var pct = S("text", { x: sx(day) + 12, y: sy(low) + 16, class: "t t-sm t-orange", text: Math.round(low * 100) + "%" }, svg);
          LC.popIn(tl, [pct], {});
          LC.drawIn(tl, jump, { duration: 0.4, ease: "power2.out" });
          LC.popIn(tl, [mark, lbl], { duration: 0.3 }, "-=0.1");
        } else {
          var endR = R(END - s0, Si);
          // below the endpoint: just left of it the curve runs through the band above
          var endLbl = S("text", { x: sx(END) - 8, y: sy(endR) + 20, class: "t t-sm t-orange t-end", text: "spaced ≈ " + Math.round(endR * 100) + "%" }, svg);
          var gap = S("path", { d: "M" + sx(END) + " " + sy(endR) + "V" + sy(R(END, STAB[0])), class: "s-ink", "stroke-dasharray": "2 4" }, svg);
          LC.popIn(tl, endLbl, {});
          tl.to([noRev, noLbl], { opacity: 1, duration: 0.3 }, "<");
          LC.drawIn(tl, gap, { duration: 0.5 });
        }
        tl.addLabel("s" + (i + 2));
        start = day;
      });
      return tl;
    }
  };
})();
