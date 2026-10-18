/* M5.2: three ways to prune the same 8x8 weight matrix.
   Unstructured magnitude pruning (drop the 32 smallest |w|), 2:4 semi-structured
   sparsity (keep the 2 largest of every 4 consecutive weights in a row) and its
   compressed storage, then structured pruning (drop the 4 columns with smallest norm).
   2:4 storage in bf16: per group of 4, 2 x 16-bit values + 2 x 2-bit indices = 36 of 64 bits. */
(function () {
  var LC = window.LC;
  var N = 8, WEAK = [1, 3, 4, 6]; // columns made weaker so structured pruning has a clear choice
  var M = (function () {
    var seed = 11;
    function r() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    var m = [];
    for (var i = 0; i < N; i++) {
      m.push([]);
      for (var j = 0; j < N; j++) {
        var u = r() || 1e-9, v = r();
        var g = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
        m[i].push(g * (WEAK.indexOf(j) >= 0 ? 0.45 : 1));
      }
    }
    return m;
  })();
  var MAX = Math.max.apply(null, M.map(function (r) { return Math.max.apply(null, r.map(Math.abs)); }));
  function op(v) { return (0.12 + 0.88 * Math.min(1, Math.abs(v) / (0.75 * MAX))).toFixed(2); }

  // masks
  var flat = [];
  M.forEach(function (r) { r.forEach(function (v) { flat.push(Math.abs(v)); }); });
  var thr = flat.slice().sort(function (a, b) { return a - b; })[31];
  var unstr = M.map(function (r) { return r.map(function (v) { return Math.abs(v) > thr; }); });
  var two4 = M.map(function (r) {
    var keep = r.map(function () { return false; });
    [0, 4].forEach(function (g) {
      var idx = [g, g + 1, g + 2, g + 3].sort(function (a, b) { return Math.abs(r[b]) - Math.abs(r[a]); });
      keep[idx[0]] = keep[idx[1]] = true;
    });
    return keep;
  });
  var norms = [0, 1, 2, 3, 4, 5, 6, 7].map(function (j) { return M.reduce(function (a, r) { return a + r[j] * r[j]; }, 0); });
  var dropCols = norms.map(function (n, j) { return [n, j]; }).sort(function (a, b) { return a[0] - b[0]; }).slice(0, 4).map(function (p) { return p[1]; });

  LC.anims["m5-2-sparsity"] = {
    title: "Three ways to prune a weight matrix",
    steps: [
      "A small <strong>weight matrix</strong>, 8×8. Darker cells are weights with larger magnitude $|w|$.",
      "<strong>Unstructured magnitude pruning</strong>: zero the 32 smallest $|w|$, wherever they are. Accuracy holds up well, but the zeros are scattered, so ordinary dense GPU kernels do the same work as before.",
      "<strong>2:4 semi-structured sparsity</strong>: in every group of 4 consecutive weights in a row, keep only the 2 largest. Still 50% zeros, but in a fixed pattern the hardware understands.",
      "The GPU stores just the kept values plus a <strong>2-bit index</strong> per value saying where it sat. Sparse Tensor Cores (NVIDIA Ampere and later) skip the zeros, for up to <strong>2×</strong> faster matrix multiplies.",
      "<strong>Structured pruning</strong> removes whole columns (input channels), here the 4 with the smallest norm. What's left is simply a <strong>smaller dense matrix</strong>, fast on any hardware, but removing whole units usually costs more accuracy, so it's followed by retraining or distillation."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 274 } : { w: 640, h: 286 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var cs = compact ? 22 : 24, side = N * cs, y0 = 36;
      var xc = (W - side) / 2, xl = compact ? 10 : 120;
      var tl = gsap.timeline();
      var mat = S("g", {}, svg);
      mat.setAttribute("transform", "translate(" + xc + ",0)");
      var st = { x: xc };
      function place() { mat.setAttribute("transform", "translate(" + st.x.toFixed(2) + ",0)"); }
      var cells = M.map(function (r, i) {
        return r.map(function (v, j) {
          var g = S("g", {}, mat);
          S("rect", { x: j * cs + 1, y: y0 + i * cs + 1, width: cs - 2, height: cs - 2, rx: 3, class: "f-none", stroke: "var(--line)", "stroke-width": 1 }, g);
          var fg = S("rect", { x: j * cs + 1, y: y0 + i * cs + 1, width: cs - 2, height: cs - 2, rx: 3, class: "f-blue", "fill-opacity": op(v) }, g);
          return { g: g, fg: fg };
        });
      });
      function txt(x, y, s, cls) { return S("text", { x: x, y: y, class: "t t-sm " + (cls || ""), text: s }, svg); }
      var lx = compact ? 4 : 8, n1y = y0 + side + 30, n2y = n1y + 19;
      var title = [txt(lx, 18, "dense"), txt(lx, 18, "unstructured 50%"), txt(lx, 18, "2:4 semi-structured"), txt(lx, 18, "2:4, compressed"), txt(lx, 18, "structured")];
      var n1 = [txt(lx, n1y, "64 weights · darker = larger |w|", "t-muted"),
                txt(lx, n1y, "drop the 32 smallest |w|, wherever they are"),
                txt(lx, n1y, "keep the 2 largest of every 4 in a row"),
                txt(lx, n1y, "stored: 32 values + a 2-bit index each"),
                txt(lx, n1y, "drop the 4 weakest columns")];
      var n2 = [null,
                txt(lx, n2y, "scattered zeros → little GPU speed-up", "t-orange"),
                txt(lx, n2y, "Sparse Tensor Cores: up to 2× matmul", "t-blue"),
                txt(lx, n2y, "per 4 bf16 weights: 36 of 64 bits (56%)", "t-blue"),
                txt(lx, n2y, "a smaller dense matrix: fast anywhere", "t-blue")];
      title.slice(1).concat(n1.slice(1), n2.slice(1)).forEach(function (e) { e.style.opacity = 0; });
      tl.addLabel("s0", 0);
      function swapStep(k) {
        var out = [title[k - 1], n1[k - 1]].concat(n2[k - 1] ? [n2[k - 1]] : []);
        tl.to(out, { opacity: 0, duration: 0.25 });
        tl.to([title[k], n1[k], n2[k]], { opacity: 1, duration: 0.35 }, "<0.1");
      }
      function applyMask(mask, pos) {
        var fgs = [], ops = [];
        M.forEach(function (r, i) { r.forEach(function (v, j) { fgs.push(cells[i][j].fg); ops.push(mask ? (mask[i][j] ? 1 : 0) : 1); }); });
        fgs.forEach(function (f, k) { tl.to(f, { opacity: ops[k], duration: 0.5 }, k ? "<" : pos); });
      }

      // s1: unstructured
      swapStep(1);
      applyMask(unstr, ">");
      tl.addLabel("s1");

      // s2: 2:4
      swapStep(2);
      applyMask(null, ">");
      var sep = S("path", { d: "M" + (4 * cs) + " " + (y0 - 4) + "V" + (y0 + side + 4), class: "s-ink", "stroke-width": 2 }, mat);
      LC.drawIn(tl, sep, { duration: 0.4 }, "+=0.02");
      applyMask(two4, ">");
      tl.addLabel("s2");

      // s3: compressed storage
      swapStep(3);
      tl.to(st, { x: xl, duration: 0.8, ease: "power2.inOut", onUpdate: place }, "<");
      var vx = xl + side + (compact ? 14 : 24), ix = vx + 4 * cs + 8;
      var comp = S("g", {}, svg);
      M.forEach(function (r, i) {
        var kept = [0, 1, 2, 3, 4, 5, 6, 7].filter(function (j) { return two4[i][j]; }); // 2 per group of 4, in order
        kept.forEach(function (j, k) {
          S("rect", { x: vx + k * cs + 1, y: y0 + i * cs + 1, width: cs - 2, height: cs - 2, rx: 3, class: "f-blue", "fill-opacity": op(r[j]) }, comp);
          S("rect", { x: ix + k * 8 + 0.5, y: y0 + i * cs + 1, width: 7, height: cs - 2, rx: 1.5, class: "f-ink", "fill-opacity": 0.35 }, comp);
        });
      });
      var vLbl = S("text", { x: vx + 2 * cs, y: y0 + side + 14, class: "t t-sm t-mid t-muted", text: "values" }, svg);
      var iLbl = S("text", { x: ix + 16, y: y0 + side + 14, class: "t t-sm t-mid t-muted", text: "idx" }, svg);
      LC.popIn(tl, [comp, vLbl, iLbl], { duration: 0.5 });
      tl.addLabel("s3");

      // s4: structured
      swapStep(4);
      tl.to([comp, vLbl, iLbl, sep], { opacity: 0, duration: 0.3 }, "<");
      tl.to(st, { x: xc, duration: 0.6, ease: "power2.inOut", onUpdate: place }, "<");
      applyMask(null, "<");
      var dropEls = [], keepCols = [];
      for (var j = 0; j < N; j++) {
        if (dropCols.indexOf(j) >= 0) for (var i = 0; i < N; i++) dropEls.push(cells[i][j].g);
        else keepCols.push(j);
      }
      tl.to(dropEls, { opacity: 0, duration: 0.5 }, "+=0.2");
      keepCols.forEach(function (j, k) {
        var dx = (k + 2 - j) * cs; // re-centre the 4 kept columns
        var gs = cells.map(function (row) { return row[j].g; });
        tl.to(gs, { x: dx, duration: 0.6, ease: "power2.inOut" }, k ? "<" : ">");
      });
      tl.addLabel("s4");
      return tl;
    }
  };
})();
