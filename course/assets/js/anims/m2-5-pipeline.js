/* M2.5: pipeline parallelism with p = 4 stages (GPipe-style schedule).
   One batch takes 1 time unit forward and 2 backward per stage; splitting it into m
   micro-batches makes each piece 1/m as long. Idle fraction = (p − 1)/(m + p − 1). */
(function () {
  var LC = window.LC;
  var PST = 4, TF = 1, TB = 2, TMAX = 12;
  function schedule(m) {
    var tf = TF / m, tb = TB / m, out = [];
    for (var s = 0; s < PST; s++) {
      for (var j = 0; j < m; j++) out.push({ s: s, t: (s + j) * tf, d: tf, kind: "F" });
      for (var k = 0; k < m; k++) out.push({ s: s, t: (PST - 1 + m) * tf + (PST - 1 - s) * tb + k * tb, d: tb, kind: "B" });
    }
    var total = (m + PST - 1) * (tf + tb);
    return { blocks: out, total: total, idle: (PST - 1) / (m + PST - 1) };
  }
  var RUNS = [1, 4, 8].map(schedule);

  LC.anims["m2-5-pipeline"] = {
    title: "Pipeline parallelism and the bubble",
    steps: [
      "Split the model's layers into <strong>4 stages</strong>, one per GPU: GPU 1 holds the first quarter of the layers, GPU 4 the last. Time runs left to right.",
      "Send the whole batch through: forward down the pipeline (blue), then backward back up (orange, about twice as long). Each GPU works only <strong>25%</strong> of the time; the rest is the <strong>bubble</strong> (grey).",
      "Split the batch into <strong>4 micro-batches</strong>. While GPU 2 works on micro-batch 1, GPU 1 already starts micro-batch 2. The same batch finishes much sooner.",
      "Idle time is now only the ramp-up and ramp-down: $(p-1)/(m+p-1) = 3/7 \\approx$ <strong>43%</strong> with $p = 4$ stages and $m = 4$ micro-batches.",
      "With <strong>8 micro-batches</strong> the bubble drops to $3/11 \\approx$ <strong>27%</strong>. More micro-batches shrink it further, at the cost of smaller, less efficient pieces and more activations held in memory."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 230 } : { w: 640, h: 230 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var x0 = compact ? 50 : 70, x1 = W - 10, rowH = 30, y0 = 48, bh = 22;
      function sx(t) { return x0 + t / TMAX * (x1 - x0); }
      var tl = gsap.timeline();

      for (var s = 0; s < PST; s++) {
        S("text", { x: 4, y: y0 + s * rowH + 15, class: "t t-sm", text: "GPU " + (s + 1) }, svg);
        S("rect", { x: x0, y: y0 + s * rowH, width: x1 - x0, height: bh, rx: 3, class: "f-faint", "fill-opacity": 0.45 }, svg);
      }
      var axY = y0 + PST * rowH + 8;
      S("path", { d: "M" + x0 + " " + axY + "H" + x1, class: "s-axis" }, svg);
      S("text", { x: x1, y: axY + 18, class: "t t-sm t-muted t-end", text: "time →" }, svg);
      // legend
      var legY = axY + 40, lx = 4;
      [["forward", "f-blue"], ["backward", "f-orange"], ["idle (bubble)", "f-faint"]].forEach(function (l, i) {
        var x = lx + i * (compact ? 108 : 150);
        S("rect", { x: x, y: legY - 11, width: 13, height: 13, rx: 2, class: l[1] }, svg);
        S("text", { x: x + 19, y: legY, class: "t t-sm", text: l[0] }, svg);
      });

      // header readouts (one per step)
      var heads = [
        "4 stages × ¼ of the layers each",
        "no micro-batches · busy 25%",
        "4 micro-batches",
        "4 micro-batches · idle 3/7 ≈ 43%",
        "8 micro-batches · idle 3/11 ≈ 27%"
      ].map(function (t, i) {
        var e = S("text", { x: 4, y: 18, class: "t t-sm" + (i ? " t-orange" : " t-muted"), "font-weight": i ? 650 : 400, text: t }, svg);
        e.style.opacity = i ? 0 : 1;
        return e;
      });
      function head(i) { tl.to(heads[i - 1], { opacity: 0, duration: 0.2 }); tl.to(heads[i], { opacity: 1, duration: 0.2 }); }

      function drawRun(run) {
        var g = S("g", {}, svg);
        var els = run.blocks.slice().sort(function (a, b) { return a.t - b.t; }).map(function (b) {
          var gap = Math.min(1, (sx(b.d) - x0) * 0.12);
          var e = S("rect", { x: sx(b.t) + gap / 2, y: y0 + b.s * rowH, width: Math.max(1, sx(b.d) - x0 - gap), height: bh, rx: 2, class: b.kind === "F" ? "f-blue" : "f-orange" }, g);
          e.style.opacity = 0;
          return e;
        });
        return { g: g, els: els };
      }
      var end = function (run) { return sx(run.total); };
      tl.addLabel("s0", 0);

      // s1: naive
      head(1);
      var r1 = drawRun(RUNS[0]);
      tl.to(r1.els, { opacity: 1, duration: 0.2, stagger: 0.15 });
      var mark1 = S("path", { d: "M" + end(RUNS[0]) + " " + (y0 - 6) + "V" + (axY + 4), class: "s-ink", "stroke-width": 2, "stroke-dasharray": "4 4" }, svg);
      LC.popIn(tl, mark1, { duration: 0.3 });
      tl.addLabel("s1");

      // s2: 4 micro-batches
      head(2);
      var r4 = drawRun(RUNS[1]);
      tl.to(r1.els, { opacity: 0.18, duration: 0.3 }, "<");
      tl.to(r4.els, { opacity: 1, duration: 0.12, stagger: 0.03 });
      var mark4 = S("path", { d: "M" + end(RUNS[1]) + " " + (y0 - 6) + "V" + (axY + 4), class: "s-ink", "stroke-width": 2, "stroke-dasharray": "4 4" }, svg);
      LC.popIn(tl, mark4, { duration: 0.3 });
      tl.to(mark1, { opacity: 0.3, duration: 0.3 }, "<");
      tl.addLabel("s2");

      // s3: point at the bubble
      head(3);
      tl.to(r1.els, { opacity: 0, duration: 0.3 }, "<");
      tl.to(mark1, { opacity: 0, duration: 0.3 }, "<");
      tl.addLabel("s3");

      // s4: 8 micro-batches
      head(4);
      var r8 = drawRun(RUNS[2]);
      tl.to(r4.els, { opacity: 0, duration: 0.3 }, "<");
      tl.to(mark4, { opacity: 0.3, duration: 0.3 }, "<");
      tl.to(r8.els, { opacity: 1, duration: 0.08, stagger: 0.015 });
      var mark8 = S("path", { d: "M" + end(RUNS[2]) + " " + (y0 - 6) + "V" + (axY + 4), class: "s-ink", "stroke-width": 2, "stroke-dasharray": "4 4" }, svg);
      LC.popIn(tl, mark8, { duration: 0.3 });
      tl.addLabel("s4");
      return tl;
    }
  };
})();
