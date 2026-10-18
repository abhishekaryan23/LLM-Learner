/* M2.5: training memory for a 7B model with mixed-precision AdamW (16 bytes/parameter,
   as in Rajbhandari et al., 2020), and how data parallelism and ZeRO stages 1-3 change the
   per-GPU share on 4 GPUs. Activations are not included. */
(function () {
  var LC = window.LC;
  var P = 7;   // billions of parameters → GB per byte/param
  var CATS = [
    { name: "weights (bf16)", bytes: 2, cls: "f-blue", op: 1 },
    { name: "gradients (bf16)", bytes: 2, cls: "f-blue", op: 0.45 },
    { name: "master copy (fp32)", bytes: 4, cls: "f-ink", op: 1 },
    { name: "Adam m (fp32)", bytes: 4, cls: "f-orange", op: 1 },
    { name: "Adam v (fp32)", bytes: 4, cls: "f-orange", op: 0.45 }
  ];
  var G = 4;
  // per-GPU GB of each category at each stage
  var full = CATS.map(function (c) { return c.bytes * P; });
  var STAGES = [
    { rows: 0, gb: full },
    { rows: 1, gb: full, title: "1 GPU" },
    { rows: 4, gb: full, title: "data parallel, 4 GPUs" },
    { rows: 4, gb: [14, 14, 7, 7, 7], title: "ZeRO-1: shard optimizer states" },
    { rows: 4, gb: [14, 3.5, 7, 7, 7], title: "ZeRO-2: + shard gradients" },
    { rows: 4, gb: [3.5, 3.5, 7, 7, 7], title: "ZeRO-3 / FSDP: shard everything" }
  ];
  function sum(a) { return a.reduce(function (x, y) { return x + y; }, 0); }

  LC.anims["m2-5-memory"] = {
    title: "Where a 7B model's training memory goes",
    steps: [
      "One H100 has <strong>80 GB</strong> of memory. How much does training a 7B-parameter model with AdamW and mixed precision need?",
      "<strong>16 bytes per parameter</strong>: bf16 weights (2) and gradients (2), plus an fp32 master copy (4) and Adam's $m$ and $v$ (4 + 4). That's <strong>112 GB</strong>, before any activations. It doesn't fit.",
      "<strong>Data parallelism</strong> gives each GPU a different slice of the batch, but every GPU keeps a <strong>full copy</strong> of everything. Faster, yes; no memory saved.",
      "<strong>ZeRO stage 1</strong> splits the optimizer states (master weights, $m$, $v$) into 4 shards, one per GPU: $28 + 84/4 = 49$ GB each.",
      "<strong>ZeRO stage 2</strong> also shards the gradients: each GPU only keeps the gradients for the parameters it updates. 38.5 GB each.",
      "<strong>ZeRO stage 3</strong> (PyTorch <strong>FSDP</strong>) shards the weights too, gathering each layer just before it's used: $112/4 = 28$ GB each. More GPUs, smaller shares."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 316 } : { w: 640, h: 296 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var x0 = compact ? 56 : 96, x1 = compact ? 296 : 520, GBMAX = 140;
      function sx(gb) { return x0 + gb / GBMAX * (x1 - x0); }
      var rowY = [58, 92, 126, 160], bh = 22, axisY = 196;
      var tl = gsap.timeline();

      // axis + capacity line
      [0, 40, 80, 120].forEach(function (v) {
        S("line", { x1: sx(v), x2: sx(v), y1: 46, y2: axisY - 8, class: "s-grid" }, svg);
        S("text", { x: sx(v), y: axisY + 8, class: "t t-sm t-muted t-mid", text: v }, svg);
      });
      S("text", { x: W - 4, y: axisY + 26, class: "t t-sm t-muted t-end", text: "GB per GPU →" }, svg);
      S("path", { d: "M" + sx(80) + " 40V" + (axisY - 8), class: "s-ink", "stroke-dasharray": "5 5", "stroke-width": 2 }, svg);
      S("text", { x: sx(80), y: 34, class: "t t-sm t-mid", "font-weight": 650, text: "80 GB" }, svg);

      // stage titles (top-left row)
      var titles = STAGES.map(function (st, i) {
        var e = S("text", { x: 4, y: 16, class: "t t-sm t-orange", "font-weight": 650, text: st.title || "" }, svg);
        e.style.opacity = 0;
        return e;
      });

      // rows: label + segments + total
      var rows = rowY.map(function (y, r) {
        var g = S("g", {}, svg);
        S("text", { x: 4, y: y + 15, class: "t t-sm", text: "GPU " + (r + 1) }, g);
        var segs = CATS.map(function (c) { return S("rect", { x: x0, y: y, width: 0, height: bh, class: c.cls, "fill-opacity": c.op, stroke: "var(--a-paper)", "stroke-width": 1 }, g); });
        g.style.opacity = 0;
        return { g: g, segs: segs };
      });
      // totals: one text per (row, stage) so they can cross-fade
      var totals = STAGES.map(function (st) {
        var t = sum(st.gb);
        return rowY.map(function (y) {
          var e = S("text", { x: W - 4, y: y + 15, class: "t t-sm t-mono t-end" + (t > 80 ? " t-orange" : ""), "font-weight": 650, text: (t % 1 ? t.toFixed(1) : t) + " GB" }, svg);
          e.style.opacity = 0;
          return e;
        });
      });

      // legend
      var cols = compact ? 2 : 3, colW = compact ? 178 : 210, legY = compact ? 246 : 248;
      CATS.forEach(function (c, i) {
        var lx = 4 + (i % cols) * colW, ly = legY + Math.floor(i / cols) * 22;
        S("rect", { x: lx, y: ly - 11, width: 13, height: 13, rx: 2, class: c.cls, "fill-opacity": c.op }, svg);
        S("text", { x: lx + 19, y: ly, class: "t t-sm", text: c.name + " · " + c.bytes + " bytes" }, svg);
      });
      tl.addLabel("s0", 0);

      function setStage(k) {
        var st = STAGES[k], prev = STAGES[k - 1];
        if (k > 1) tl.to(titles[k - 1], { opacity: 0, duration: 0.2 });
        tl.to(titles[k], { opacity: 1, duration: 0.25 });
        // rows appear
        for (var r = prev.rows; r < st.rows; r++) tl.to(rows[r].g, { opacity: 1, duration: 0.25 }, "<0.05");
        if (k > 1) tl.to(totals[k - 1].slice(0, prev.rows), { opacity: 0, duration: 0.2 }, "<");
        // segment widths
        var t0 = tl.duration();
        for (r = 0; r < st.rows; r++) {
          var acc = 0;
          rows[r].segs.forEach(function (sg, c) {
            var vars = { attr: { x: sx(acc), width: Math.max(0, sx(acc + st.gb[c]) - sx(acc)) }, duration: k === 1 ? 0.35 : 0.6, ease: "power2.inOut" };
            if (k === 1) tl.to(sg, vars, c ? ">" : t0);
            else tl.to(sg, vars, t0);
            acc += st.gb[c];
          });
        }
        tl.to(totals[k].slice(0, st.rows), { opacity: 1, duration: 0.3 });
        tl.addLabel("s" + k);
      }
      for (var k = 1; k < STAGES.length; k++) setStage(k);
      return tl;
    }
  };
})();
