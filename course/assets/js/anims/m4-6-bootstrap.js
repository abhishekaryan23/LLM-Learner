/* M4.6: the bootstrap confidence interval for an eval score.
   20 questions, 14 correct (70%). Two example resamples (75%, 60%), then the
   distribution of 1,000 resampled accuracies. For a plain accuracy that distribution is
   Binomial(20, 0.7)/20, so the bars use its expected counts (they sum to 1,000).
   Percentile CI: 2.5% → 10/20 = 50%, 97.5% → 18/20 = 90%. With 80 questions
   (Binomial(80, 0.7)/80) the same percentiles give 60%–80%: 4× the data, half the width. */
(function () {
  var LC = window.LC;
  var C = [1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0];
  var RES = [
    [1, 3, 4, 4, 6, 8, 8, 9, 9, 11, 12, 12, 13, 15, 15, 16, 16, 17, 18, 19],   // 15/20
    [1, 1, 2, 2, 5, 5, 6, 8, 9, 11, 11, 12, 13, 14, 16, 16, 17, 18, 19, 19]    // 12/20
  ];
  function binom(n, p) {
    var out = [], c = 1;
    for (var k = 0; k <= n; k++) {
      if (k > 0) c = c * (n - k + 1) / k;
      out.push(c * Math.pow(p, k) * Math.pow(1 - p, n - k));
    }
    return out;
  }
  var P20 = binom(20, 0.7), P80 = binom(80, 0.7);

  LC.anims["m4-6-bootstrap"] = {
    title: "Bootstrap: how much could this score wobble?",
    steps: [
      "Your eval has <strong>20 questions</strong> and the model got 14 right: <strong>70%</strong>. A different set of 20 questions of the same kind would give a different score. How different?",
      "We can't get new questions, so we <strong>resample</strong> the ones we have: draw 20 <em>with replacement</em>. Some questions appear twice, some not at all. This resample scores <strong>75%</strong>.",
      "Another resample: <strong>60%</strong>. Each resample is a plausible alternative version of your eval.",
      "Repeat <strong>1,000 times</strong> and plot every resampled score. The spread of this histogram is the uncertainty in your 70%.",
      "Keep the middle 95%: the <strong>95% bootstrap CI</strong> is <strong>50% to 90%</strong>. With 20 questions, \"70%\" really means \"somewhere from about 50 to 90\".",
      "With <strong>80 questions</strong> at the same 70%, the distribution (orange) is much narrower: CI <strong>60% to 80%</strong>. Four times the questions halves the width, because uncertainty shrinks like $1/\\sqrt{n}$."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 424 } : { w: 640, h: 310 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      var G = compact
        ? { x0: 17.5, tile: 28, gap: 5, t1: 16, g1: 26, t2: 112, g2: 122, right: W - 4 }
        : { x0: 16, tile: 24, gap: 4, t1: 16, g1: 26, t2: 110, g2: 120, right: 292 };
      var Hs = compact
        ? { l: 24, r: 344, title: 210, top: 226, axis: 350, tick: 368, b1: 390, b2: 412, lab: 4 }
        : { l: 344, r: 628, title: 16, top: 40, axis: 230, tick: 248, b1: 272, b2: 294, lab: 344 };
      var D0 = 0.275, D1 = 1.025;
      function hx(a) { return Hs.l + ((a - D0) / (D1 - D0)) * (Hs.r - Hs.l); }

      function tile(parent, i, slot, y0) {
        var col = slot % 10, row = Math.floor(slot / 10);
        var x = G.x0 + col * (G.tile + G.gap), y = y0 + row * (G.tile + G.gap);
        var g = S("g", {}, parent);
        S("rect", { x: x, y: y, width: G.tile, height: G.tile, rx: 5, class: C[i] ? "f-blue" : "f-faint" }, g);
        var t = S("text", { x: x + G.tile / 2, y: y + G.tile / 2 + 4.5, class: "t t-sm t-mid t-nohalo", text: i + 1 }, g);
        if (C[i]) t.setAttribute("style", "fill:#fff");
        return g;
      }

      // s0: the original eval
      if (compact) S("text", { x: G.x0, y: G.t1, class: "t t-sm", text: "Your eval: 14 of 20 right (blue) = 70%" }, svg);
      else {
        S("text", { x: G.x0, y: G.t1, class: "t t-sm t-muted", text: "20 questions (blue = right)" }, svg);
        S("text", { x: G.right, y: G.t1, class: "t t-sm t-mono t-end", "font-weight": 650, text: "14/20 = 70%" }, svg);
      }
      var orig = S("g", {}, svg);
      for (var i = 0; i < 20; i++) tile(orig, i, i, G.g1);
      // histogram frame (visible from the start, empty)
      S("text", { x: Hs.lab, y: Hs.title, class: "t t-sm t-muted", text: "↑ resampled scores" }, svg);
      S("line", { x1: Hs.l, x2: Hs.r, y1: Hs.axis, y2: Hs.axis, class: "s-axis" }, svg);
      [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].forEach(function (a) {
        S("line", { x1: hx(a), x2: hx(a), y1: Hs.axis, y2: Hs.axis + 4, class: "s-axis" }, svg);
        S("text", { x: hx(a), y: Hs.tick, class: "t t-sm t-muted t-mid", text: Math.round(a * 100) + "%" }, svg);
      });
      tl.addLabel("s0", 0);

      // s1, s2: two resamples
      var t2 = S("text", { x: G.x0, y: G.t2, class: "t t-sm t-muted", text: "Resample 20, with replacement" }, svg);
      var resG = [], resLbl = [], dots = [];
      RES.forEach(function (idx, r) {
        var g = S("g", {}, svg);
        idx.forEach(function (q, slot) { tile(g, q, slot, G.g2); });
        var k = idx.reduce(function (a, q) { return a + C[q]; }, 0);
        var lbl = S("text", { x: G.right, y: G.t2, class: "t t-sm t-mono t-end t-orange", "font-weight": 650, text: k + "/20 = " + (k * 5) + "%" }, svg);
        var dot = S("circle", { cx: hx(k / 20), cy: Hs.axis - 8, r: 6, class: "f-orange" }, svg);
        resG.push(g); resLbl.push(lbl); dots.push(dot);
      });
      LC.popIn(tl, t2, { duration: 0.3 });
      LC.popIn(tl, [].slice.call(resG[0].childNodes), { duration: 0.2, stagger: 0.04 }, "<");
      LC.popIn(tl, [resLbl[0], dots[0]], { duration: 0.4 });
      tl.addLabel("s1");
      tl.to([resG[0], resLbl[0]], { opacity: 0, duration: 0.3 });
      LC.popIn(tl, [].slice.call(resG[1].childNodes), { duration: 0.2, stagger: 0.04 });
      LC.popIn(tl, [resLbl[1], dots[1]], { duration: 0.4 });
      tl.addLabel("s2");

      // s3: 1,000 resamples -> histogram
      var maxD20 = Math.max.apply(null, P20) / 0.05, maxD80 = Math.max.apply(null, P80) / 0.0125;
      var hTop = Hs.axis - Hs.top;
      var bw = (hx(0.05) - hx(0)) * 0.78;
      var bars = [];
      for (var k = 6; k <= 20; k++) {
        var h = (P20[k] / 0.05) / maxD20 * hTop;
        var inCI = k >= 10 && k <= 18;
        var rect = S("rect", { x: hx(k / 20) - bw / 2, y: Hs.axis, width: bw, height: 0, rx: 2, class: "f-blue" }, svg);
        bars.push({ el: rect, h: h, inCI: inCI });
      }
      var hTitle2 = S("text", { x: Hs.lab + (compact ? 128 : 124), y: Hs.title, class: "t t-sm t-muted", text: "× 1,000" }, svg);
      tl.to(dots, { opacity: 0, duration: 0.3 });
      LC.popIn(tl, hTitle2, { duration: 0.3 }, "<");
      bars.forEach(function (b, j) {
        tl.to(b.el, { attr: { y: Hs.axis - b.h, height: b.h }, duration: 0.6, ease: "power2.out" }, j ? "<0.04" : undefined);
      });
      tl.addLabel("s3");

      // s4: middle 95% -> CI bracket (row below the axis)
      function bracket(a0, a1, y, cls) {
        var x0 = hx(a0), x1 = hx(a1);
        return S("path", { d: "M" + x0 + " " + (y - 7) + "V" + y + "H" + x1 + "V" + (y - 7), class: cls, "stroke-width": 2.5 }, svg);
      }
      var lab1 = S("text", { x: Hs.lab, y: Hs.b1 + 4, class: "t t-sm t-blue", text: "n = 20" }, svg);
      var br1 = bracket(0.5, 0.9, Hs.b1, "s-blue");
      var lab1v = S("text", { x: Hs.r, y: Hs.b1 + 4, class: "t t-sm t-mono t-blue t-end", text: "±20" }, svg);
      tl.to(bars.filter(function (b) { return !b.inCI; }).map(function (b) { return b.el; }), { opacity: 0.3, duration: 0.4 });
      LC.popIn(tl, lab1, { duration: 0.3 }, "<");
      LC.drawIn(tl, br1, { duration: 0.6 });
      LC.popIn(tl, lab1v, { duration: 0.3 });
      tl.addLabel("s4");

      // s5: 80 questions: narrower distribution, bars rescaled to the same area
      var scale = maxD20 / maxD80;
      var d = "";
      for (var k2 = 40; k2 <= 72; k2++) {
        var a = k2 / 80, y = Hs.axis - (P80[k2] / 0.0125) / maxD80 * hTop;
        d += (d ? "L" : "M") + hx(a).toFixed(1) + " " + y.toFixed(1);
      }
      var curve = S("path", { d: d, class: "s-orange" }, svg);
      var lab2 = S("text", { x: Hs.lab, y: Hs.b2 + 4, class: "t t-sm t-orange", text: "n = 80" }, svg);
      var br2 = bracket(0.6, 0.8, Hs.b2, "s-orange");
      var lab2v = S("text", { x: Hs.r, y: Hs.b2 + 4, class: "t t-sm t-mono t-orange t-end", text: "±10" }, svg);
      bars.forEach(function (b, j) {
        var h = b.h * scale;
        tl.to(b.el, { attr: { y: Hs.axis - h, height: h }, duration: 0.6, ease: "power2.inOut" }, j ? "<" : undefined);
      });
      LC.drawIn(tl, curve, { duration: 0.9 });
      LC.popIn(tl, lab2, { duration: 0.3 }, "<");
      LC.drawIn(tl, br2, { duration: 0.5 });
      LC.popIn(tl, lab2v, { duration: 0.3 });
      tl.addLabel("s5");
      return tl;
    }
  };
})();
