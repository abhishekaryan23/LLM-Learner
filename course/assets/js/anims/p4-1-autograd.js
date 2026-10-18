/* P4.1: PyTorch autograd records a graph as code runs, then .backward() replays it.
   x = 2, w = 3: y = w·x = 6, z = y + 1 = 7, loss = z² = 49.
   dloss/dz = 2z = 14, dloss/dy = 14, x.grad = 14·w = 42, w.grad = 14·x = 28. */
(function () {
  var LC = window.LC;
  var CODE = [
    "x = torch.tensor(2., requires_grad=True)",
    "w = torch.tensor(3., requires_grad=True)",
    "y = w * x",
    "z = y + 1",
    "loss = z ** 2",
    "loss.backward()"
  ];

  LC.anims["p4-1-autograd"] = {
    title: "Autograd: the graph is recorded as your code runs",
    steps: [
      "Two <strong>leaf</strong> tensors with <code>requires_grad=True</code>. That flag tells PyTorch: <em>track every operation done with me</em>.",
      "<code>y = w * x</code> computes $6$ <em>and</em> records how: <code>y.grad_fn</code> is a <strong>MulBackward0</strong> node that remembers its inputs.",
      "Each further operation adds a node: <strong>AddBackward0</strong> for $z = 7$, <strong>PowBackward0</strong> for $\\text{loss} = 49$. This recorded graph is the <strong>autograd tape</strong>.",
      "<code>loss.backward()</code> starts at the loss with gradient $1$ and walks the graph <strong>in reverse</strong>, exactly like backprop in P2.3.",
      "PowBackward0 applies its local derivative: $2z = 14$. AddBackward0 passes $14$ through unchanged.",
      "MulBackward0 sends $14 \\times w = 42$ to $x$ and $14 \\times x = 28$ to $w$. These land in <code>x.grad</code> and <code>w.grad</code>.",
      "Only <strong>leaves</strong> keep <code>.grad</code>; intermediate tensors don't, and the graph is <strong>freed</strong> after backward. Run it again and the new gradients are <strong>added</strong> to <code>.grad</code>, so reset them between steps."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 476 } : { w: 640, h: 330 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var tl = gsap.timeline();

      // ---- code panel ----
      var C = compact ? { x: 6, y: 26, w: W - 12, lh: 21 } : { x: 6, y: 40, w: 344, lh: 26 };
      var codeFont = 12;
      S("rect", { x: C.x, y: C.y, width: C.w, height: CODE.length * C.lh + 12, rx: 10, class: "f-surface2" }, svg);
      var hl = S("rect", { x: C.x + 4, y: C.y + 6, width: C.w - 8, height: C.lh, rx: 6, class: "f-orange", "fill-opacity": 0.22 }, svg);
      CODE.forEach(function (line, i) {
        S("text", { x: C.x + 10, y: C.y + 6 + i * C.lh + C.lh / 2 + 4, class: "t t-mono t-nohalo", "font-size": codeFont, text: line, style: "white-space:pre" }, svg);
      });
      function hlTo(a, b, pos) { return tl.to(hl, { attr: { y: C.y + 6 + a * C.lh, height: (b - a + 1) * C.lh }, duration: 0.35 }, pos); }
      hl.setAttribute("height", 2 * C.lh);

      // ---- graph ----
      var bw = compact ? 150 : 136, bh = 42;
      var N = compact ? {
        x: { x: 92, y: 206 }, w: { x: 268, y: 206 }, y: { x: 180, y: 282 }, z: { x: 180, y: 358 }, loss: { x: 180, y: 434 }
      } : {
        x: { x: 427, y: 52 }, w: { x: 569, y: 52 }, y: { x: 490, y: 132 }, z: { x: 490, y: 212 }, loss: { x: 490, y: 292 }
      };
      var gx = compact ? N.y.x + bw / 2 + 8 : N.y.x + bw / 2 + 8;
      function box(k, l1, l2, leaf) {
        var n = N[k], g = S("g", {}, svg);
        S("rect", { x: n.x - bw / 2, y: n.y - bh / 2, width: bw, height: bh, rx: 9, class: "f-surface", stroke: leaf ? "var(--a-blue)" : "var(--a-ink)", "stroke-width": 1.5 }, g);
        S("text", { x: n.x, y: n.y - 4, class: "t t-sm t-mono t-mid", text: l1, "font-weight": 600 }, g);
        var sub = S("text", { x: n.x, y: n.y + 13, class: "t t-sm t-mid t-muted", text: l2 }, g);
        return { g: g, sub: sub };
      }
      function edge(a, b) {
        var A = N[a], B = N[b];
        var x1 = A.x, y1 = A.y + bh / 2 + 3, x2 = B.x + (A.x - B.x) * 0.25, y2 = B.y - bh / 2 - 3;
        if (A.x === B.x) x2 = B.x;
        var p = S("path", { d: "M" + x1 + " " + y1 + "L" + x2 + " " + y2, class: "s-faint" }, svg);
        var back = S("path", { d: "M" + x2 + " " + y2 + "L" + x1 + " " + y1, class: "s-orange" }, svg);
        return { p: p, back: back };
      }
      var eXY = edge("x", "y"), eWY = edge("w", "y"), eYZ = edge("y", "z"), eZL = edge("z", "loss");
      var bX = box("x", "x = 2.", "leaf, requires_grad", true), bW = box("w", "w = 3.", "leaf, requires_grad", true);
      var bY = box("y", "y = 6.", "grad_fn=MulBackward0"), bZ = box("z", "z = 7.", "grad_fn=AddBackward0"), bL = box("loss", "loss = 49.", "grad_fn=PowBackward0");
      // leaf .grad readouts replace the subtitle at the end
      function gradSub(k, txt) { var n = N[k]; return S("text", { x: n.x, y: n.y + 13, class: "t t-sm t-mid t-mono t-orange", text: txt, "font-weight": 600 }, svg); }
      var gX = gradSub("x", "x.grad = 42."), gW = gradSub("w", "w.grad = 28.");
      // upstream gradients beside the chain
      function side(k, txt) { return S("text", { x: gx, y: N[k].y + 4, class: "t t-sm t-mono t-orange", text: txt, "font-weight": 600 }, svg); }
      var dL = side("loss", "grad 1"), dZ = side("z", "grad 14"), dY = side("y", "grad 14");
      [bY.g, bZ.g, bL.g, eXY.p, eWY.p, eYZ.p, eZL.p, gX, gW, dL, dZ, dY].forEach(function (e) { e.style.opacity = 0; });
      tl.addLabel("s0", 0);

      // s1: y = w * x
      hlTo(2, 2);
      LC.popIn(tl, [eXY.p, eWY.p], { duration: 0.3 });
      LC.popIn(tl, bY.g, { duration: 0.35 });
      tl.addLabel("s1");

      // s2: z, loss
      hlTo(3, 3);
      LC.popIn(tl, [eYZ.p, bZ.g], { duration: 0.35 });
      hlTo(4, 4);
      LC.popIn(tl, [eZL.p, bL.g], { duration: 0.35 });
      tl.addLabel("s2");

      // s3: backward starts
      hlTo(5, 5);
      LC.popIn(tl, dL, { duration: 0.3 });
      tl.addLabel("s3");

      // s4: through pow and add
      LC.drawIn(tl, eZL.back, { duration: 0.5 });
      LC.popIn(tl, dZ, { duration: 0.3 });
      LC.drawIn(tl, eYZ.back, { duration: 0.5 });
      LC.popIn(tl, dY, { duration: 0.3 });
      tl.addLabel("s4");

      // s5: into the leaves
      LC.drawIn(tl, eXY.back, { duration: 0.5 });
      LC.drawIn(tl, eWY.back, { duration: 0.5 }, "<");
      tl.to([bX.sub, bW.sub], { opacity: 0, duration: 0.2 });
      tl.to([gX, gW], { opacity: 1, duration: 0.3 });
      tl.addLabel("s5");

      // s6: graph freed; only leaves keep .grad
      tl.to([bY.g, bZ.g, bL.g, dL, dZ, dY, eXY.back, eWY.back, eYZ.back, eZL.back, eXY.p, eWY.p, eYZ.p, eZL.p], { opacity: 0.18, duration: 0.5 });
      tl.to(hl, { opacity: 0, duration: 0.3 }, "<");
      tl.addLabel("s6");
      return tl;
    }
  };

  /* Broadcasting: (3, 1) + (4,) -> (3, 4) */
  var A = [0, 10, 20], B = [0, 1, 2, 3];
  LC.anims["p4-1-broadcast"] = {
    title: "Broadcasting: (3, 1) + (4,) → (3, 4)",
    steps: [
      "<code>a</code> is a column of shape <strong>(3, 1)</strong>; <code>b</code> is a vector of shape <strong>(4,)</strong>. What is <code>a + b</code>?",
      "PyTorch lines the shapes up <strong>from the right</strong>. <code>b</code> has fewer dimensions, so it gets a <strong>1</strong> in front: (4,) becomes (1, 4).",
      "In each position the sizes must match, or one of them must be <strong>1</strong>. A size-1 dimension is <strong>stretched</strong>: <code>a</code>'s single column repeats across 4 columns.",
      "<code>b</code>'s single row repeats down 3 rows. No data is actually copied in memory; it only behaves as if it were.",
      "Now both are (3, 4), so they add element by element: <code>a + b</code> has shape <strong>(3, 4)</strong>.",
      "If two sizes differ and neither is 1, there's nothing to stretch: <code>(3, 2) + (4,)</code> raises a <strong>RuntimeError</strong>. Beware the quiet version: <code>(3,) + (3, 1)</code> works, and gives a (3, 3) matrix you may not have wanted."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 392 } : { w: 640, h: 316 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact", W = ctx.w;
      var tl = gsap.timeline();
      var c = 44, gap = 4, step = c + gap;
      var G = compact ? { ax: 30, gx: 104, by: 92, gy: 152 } : { ax: 330, gx: 404, by: 52, gy: 112 };
      var sp = compact ? { x: 8, y: 20, dy: 20 } : { x: 20, y: 110, dy: 26 };
      function cell(x, y, v, cls, op, parent) {
        var g = S("g", {}, parent || svg);
        S("rect", { x: x, y: y, width: c, height: c, rx: 7, class: cls, "fill-opacity": op }, g);
        S("text", { x: x + c / 2, y: y + c / 2 + 5, class: "t t-mono t-mid t-nohalo", text: v, "font-size": 14 }, g);
        return g;
      }
      // shape panel
      var shp = S("g", {}, svg);
      S("text", { x: sp.x, y: sp.y, class: "t t-mono t-blue", text: "a.shape  (3, 1)" }, shp);
      var b1 = S("text", { x: sp.x, y: sp.y + sp.dy, class: "t t-mono t-orange", text: "b.shape  (4,)" }, shp);
      var b2 = S("text", { x: sp.x, y: sp.y + sp.dy, class: "t t-mono t-orange", text: "b.shape  (1, 4)" }, shp);
      var r1 = S("text", { x: sp.x, y: sp.y + 2 * sp.dy, class: "t t-mono", text: "a + b    (3, 4)", "font-weight": 650 }, shp);
      b2.style.opacity = 0; r1.style.opacity = 0;

      // originals
      var aCells = A.map(function (v, i) { return cell(G.ax, G.gy + i * step, v, "f-blue", 0.28); });
      var bCells = B.map(function (v, j) { return cell(G.gx + j * step, G.by, v, "f-orange", 0.28); });
      tl.addLabel("s0", 0);

      // s1: align shapes
      tl.to(b1, { opacity: 0, duration: 0.25 });
      tl.to(b2, { opacity: 1, duration: 0.3 });
      tl.addLabel("s1");

      // s2: stretch a across columns
      var ghostsA = [];
      for (var j = 0; j < 4; j++) A.forEach(function (v, i) { ghostsA.push(cell(G.gx + j * step, G.gy + i * step, v, "f-blue", 0.13)); });
      ghostsA.forEach(function (g) { g.style.opacity = 0; });
      tl.to(ghostsA, { opacity: 1, duration: 0.3, stagger: 0.04 });
      tl.addLabel("s2");

      // s3: stretch b down rows (drawn as an orange tint over the same cells)
      var ghostsB = [];
      for (var i = 0; i < 3; i++) B.forEach(function (v, jj) {
        var g = S("rect", { x: G.gx + jj * step + 3, y: G.gy + i * step + 3, width: c - 6, height: c - 6, rx: 5, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 2 }, svg);
        ghostsB.push(g);
      });
      ghostsB.forEach(function (g) { g.style.opacity = 0; });
      tl.to(ghostsB, { opacity: 1, duration: 0.3, stagger: 0.04 });
      tl.addLabel("s3");

      // s4: the sums
      var res = [];
      A.forEach(function (va, ii) { B.forEach(function (vb, jj) { res.push(cell(G.gx + jj * step, G.gy + ii * step, va + vb, "f-ink", 0.12)); }); });
      res.forEach(function (g) { g.style.opacity = 0; });
      tl.to(ghostsA.concat(ghostsB), { opacity: 0, duration: 0.3 });
      tl.to(res, { opacity: 1, duration: 0.25, stagger: 0.03 }, "<");
      LC.popIn(tl, r1, { duration: 0.3 });
      tl.addLabel("s4");

      // s5: when it fails
      var fy = compact ? 340 : 286, fx = compact ? 8 : 20;
      var f1 = S("text", { x: fx, y: fy, class: "t t-sm t-mono", text: compact ? "(3, 2) + (4,): 2 ≠ 4, neither is 1" : "(3, 2) + (4,): sizes 2 and 4 differ and neither is 1" }, svg);
      var f2 = S("text", { x: fx, y: fy + 20, class: "t t-sm t-mono t-orange", text: "→ RuntimeError", "font-weight": 650 }, svg);
      LC.popIn(tl, [f1, f2], { duration: 0.4 });
      tl.addLabel("s5");
      return tl;
    }
  };
})();
