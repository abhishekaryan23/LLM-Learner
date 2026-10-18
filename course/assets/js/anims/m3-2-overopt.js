/* M3.2: reward-model overoptimization (Goodhart). Illustrative shapes in the
   spirit of Gao et al., 2022: proxy RM score keeps rising with optimization,
   the gold ("true") reward rises, peaks, then falls. d = sqrt(KL from start).
   proxy(d) = d(0.55 - 0.015 d), gold(d) = d(0.5 - 0.05 d), peak of gold at d = 5. */
(function () {
  var LC = window.LC;
  function proxy(d) { return d * (0.55 - 0.015 * d); }
  function gold(d) { return d * (0.5 - 0.05 * d); }
  var D1 = 10, PEAK = 5, Y1 = 4.4;

  LC.anims["m3-2-overopt"] = {
    title: "Reward hacking: optimizing a proxy too hard",
    steps: [
      "RL (next lesson) pushes the policy to maximize the reward model's score. The further it moves from where it started, the more it has <strong>optimized</strong>.",
      "The <strong>reward model's score</strong> keeps climbing: that is what we are optimizing.",
      "At first, <strong>true quality</strong> (what people would actually prefer) climbs with it. The proxy is doing its job.",
      "Then true quality <strong>peaks and falls</strong> while the proxy keeps rising: the policy has found the reward model's blind spots. This is <strong>reward hacking</strong> (overoptimization).",
      "So we <strong>stop near the peak</strong>: a KL penalty keeps the policy close to its start (M3.3), plus bigger reward models, more preference data and early stopping."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 290 } : { w: 640, h: 300 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, H = ctx.h, compact = ctx.layout === "compact";
      var m = compact ? { l: 30, r: 16, t: 50, b: 44 } : { l: 40, r: 24, t: 50, b: 46 };
      function sx(d) { return m.l + (d / D1) * (W - m.l - m.r); }
      function sy(v) { return m.t + (1 - v / Y1) * (H - m.t - m.b); }
      var tl = gsap.timeline();
      S("path", { d: "M" + m.l + " " + m.t + "V" + sy(0) + "H" + (W - m.r), class: "s-axis" }, svg);
      S("text", { x: 4, y: 18, class: "t t-sm t-muted", text: "↑ reward" }, svg);
      S("text", { x: W - m.r, y: H - 8, class: "t t-sm t-muted t-end", text: compact ? "distance from start (√KL) →" : "optimization pressure: distance from the starting policy (√KL) →" }, svg);
      S("text", { x: m.l, y: sy(0) + 18, class: "t t-sm t-muted t-mid", text: "0" }, svg);
      var start = S("circle", { cx: sx(0), cy: sy(0), r: 6, class: "f-ink" }, svg);
      void start;
      tl.addLabel("s0", 0);

      var pPath = S("path", { d: LC.fnPath(proxy, 0, D1, sx, sy, 60), class: "s-orange" }, svg);
      var pLbl = S("text", { x: sx(D1), y: sy(proxy(D1)) - 14, class: "t t-sm t-orange t-end", text: compact ? "RM score" : "reward model score (proxy)", "font-weight": 650 }, svg);
      LC.drawIn(tl, pPath, { duration: 1.4 });
      LC.popIn(tl, pLbl, {}, "-=0.3");
      tl.addLabel("s1");

      var g1 = S("path", { d: LC.fnPath(gold, 0, PEAK, sx, sy, 40), class: "s-blue" }, svg);
      var gLbl = S("text", { x: sx(3.3), y: sy(gold(3.3)) + 30, class: "t t-sm t-blue t-mid", text: "true quality", "font-weight": 650 }, svg);
      LC.drawIn(tl, g1, { duration: 1 });
      LC.popIn(tl, gLbl, {}, "-=0.3");
      tl.addLabel("s2");

      var g2 = S("path", { d: LC.fnPath(gold, PEAK, D1, sx, sy, 40), class: "s-blue" }, svg);
      var hack = S("text", { x: sx(8.4), y: sy(gold(8.4)) - 20, class: "t t-sm t-mid", text: "hacking", "font-weight": 650 }, svg);
      LC.drawIn(tl, g2, { duration: 1.1 });
      LC.popIn(tl, hack, {}, "-=0.2");
      tl.addLabel("s3");

      var stop = S("path", { d: "M" + sx(PEAK) + " " + sy(0) + "V" + (m.t - 4), class: "s-ink", "stroke-dasharray": "5 5", "stroke-width": 1.5 }, svg);
      var stopLbl = S("text", { x: sx(PEAK), y: m.t - 12, class: "t t-sm t-mid", text: compact ? "stop here" : "best place to stop", "font-weight": 650 }, svg);
      var dot = S("circle", { cx: sx(PEAK), cy: sy(gold(PEAK)), r: 6, class: "f-blue", stroke: "var(--a-paper)", "stroke-width": 2 }, svg);
      LC.popIn(tl, [stop, dot, stopLbl], { duration: 0.5 });
      tl.addLabel("s4");
      return tl;
    }
  };
})();
