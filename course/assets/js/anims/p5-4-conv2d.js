/* P5.4: 2D convolution (cross-correlation) of a 6×6 image with a 3×3 vertical-edge kernel (Prewitt).
   Image A: columns 0–2 = 1, columns 3–5 = 5. Kernel rows = [−1, 0, 1].
   Output (6 − 3 + 1 = 4)×4, every row [0, 12, 12, 0] since each window gives 3·(x[c+2] − x[c]).
   Image B (edge moved one column right: columns 0–3 = 1): every row [0, 0, 12, 12] (translation equivariance). */
(function () {
  var LC = window.LC;
  var K = [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]];
  function img(edge) { var a = []; for (var r = 0; r < 6; r++) { a.push([]); for (var c = 0; c < 6; c++) a[r].push(c >= edge ? 5 : 1); } return a; }
  var IA = img(3), IB = img(4);
  function out(I, r, c) { var s = 0; for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) s += K[i][j] * I[r + i][c + j]; return s; }

  LC.anims["p5-4-conv2d"] = {
    title: "2D convolution finds an edge",
    steps: [
      "A tiny 6×6 grey-scale image: dark (1) on the left, bright (5) on the right. Each row of the 3×3 <strong>kernel</strong> is $[-1, 0, 1]$: minus the left, plus the right.",
      "Place the kernel on the top-left 3×3 patch, multiply the 9 overlapping pairs and add them up. The patch is flat, so the output is 0.",
      "Slide one pixel right. Now each row gives $-1\\cdot 1 + 0\\cdot 1 + 1\\cdot 5 = 4$, and three rows give <strong>12</strong>.",
      "Slide across every row, then down. The output lights up exactly where the brightness jumps: a <strong>vertical-edge detector</strong>.",
      "A 6×6 input and a 3×3 kernel give a $(6 - 3 + 1) \\times (6 - 3 + 1) = 4\\times 4$ output. All 16 outputs used the <strong>same 9 weights</strong>: parameter sharing.",
      "Move the edge one pixel right and the bright output columns move one to the right too. Shift the input, and the output shifts the same way: <strong>translation equivariance</strong>."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 282 } : { w: 640, h: 282 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact";
      var L = compact
        ? { ix: 10, iy: 28, ic: 30, kx: 232, ky: 28, kc: 30, ox: 222, oy: 150, oc: 30, olab: 142, lab: 18, cx: 10, cy: 234, fy: 258 }
        : { ix: 20, iy: 36, ic: 38, kx: 290, ky: 36, kc: 34, ox: 440, oy: 36, oc: 44, olab: 26, lab: 26, cx: 290, cy: 238, fy: 262 };
      var tl = gsap.timeline();

      function box(g, x, y, s, v, max, neg) {
        var mag = Math.min(1, Math.abs(v) / max);
        S("rect", { x: x + 1.5, y: y + 1.5, width: s - 3, height: s - 3, rx: 4, class: neg ? "f-orange" : (v === 0 ? "f-surface2" : "f-blue"), "fill-opacity": v === 0 ? 1 : (0.15 + 0.8 * mag).toFixed(2) }, g);
        S("text", { x: x + s / 2, y: y + s / 2 + 4.3, class: "t t-sm t-mono t-mid t-nohalo", "font-weight": 600, text: v < 0 ? "−" + (-v) : String(v), style: mag > 0.6 && v !== 0 ? "fill:#fff" : "" }, g);
      }
      S("text", { x: L.ix, y: L.lab, class: "t t-sm t-muted", text: "image x (6×6)" }, svg);
      S("text", { x: L.kx, y: L.lab, class: "t t-sm t-muted", text: compact ? "kernel w" : "kernel w (3×3)" }, svg);
      S("text", { x: L.ox, y: L.olab, class: "t t-sm t-muted", text: "output (4×4)" }, svg);
      var imgA = S("g", {}, svg), colA = S("g", {}, svg);   // column 3 of image A gets swapped out in the last step
      for (var r = 0; r < 6; r++) for (var c = 0; c < 6; c++) box(c === 3 ? colA : imgA, L.ix + c * L.ic, L.iy + r * L.ic, L.ic, IA[r][c], 5);
      var colB = S("g", {}, svg);   // column 3 of image B overlays image A
      S("rect", { x: L.ix + 3 * L.ic, y: L.iy, width: L.ic, height: 6 * L.ic, class: "f-paper" }, colB);   // hide column 3 of image A
      for (var r2 = 0; r2 < 6; r2++) box(colB, L.ix + 3 * L.ic, L.iy + r2 * L.ic, L.ic, IB[r2][3], 5);
      colB.style.opacity = 0;
      var kg = S("g", {}, svg);
      for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) box(kg, L.kx + j * L.kc, L.ky + i * L.kc, L.kc, K[i][j], 1, K[i][j] < 0);
      // output grid frame (faint) + two sets of results
      for (var a = 0; a < 4; a++) for (var b = 0; b < 4; b++) S("rect", { x: L.ox + b * L.oc + 1.5, y: L.oy + a * L.oc + 1.5, width: L.oc - 3, height: L.oc - 3, rx: 4, class: "f-none", stroke: "var(--a-faint)", "stroke-width": 1.5, "stroke-dasharray": "3 3" }, svg);
      function outCells(I) {
        var cells = [];
        for (var rr = 0; rr < 4; rr++) for (var cc = 0; cc < 4; cc++) {
          var g = S("g", {}, svg); box(g, L.ox + cc * L.oc, L.oy + rr * L.oc, L.oc, out(I, rr, cc), 12); g.style.opacity = 0; cells.push(g);
        }
        return cells;
      }
      var OA = outCells(IA), OB = outCells(IB);

      var win = S("rect", { width: 3 * L.ic, height: 3 * L.ic, rx: 6, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 3 }, svg);
      var tgt = S("rect", { width: L.oc, height: L.oc, rx: 6, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 3 }, svg);
      win.style.opacity = 0; tgt.style.opacity = 0;
      var comp = S("text", { x: L.cx, y: L.cy, class: "t t-sm t-mono", text: "" }, svg);
      comp.style.opacity = 0;
      var st = { k: 0 };   // window index 0..15 (row-major)
      function update() {
        var k = Math.max(0, Math.min(15, st.k)), rr = Math.floor(k / 4), cc = Math.min(3, k - rr * 4), rk = Math.round(k), r0 = Math.floor(rk / 4), c0 = rk % 4;
        win.setAttribute("x", L.ix + cc * L.ic); win.setAttribute("y", L.iy + rr * L.ic);
        tgt.setAttribute("x", L.ox + cc * L.oc); tgt.setAttribute("y", L.oy + rr * L.oc);
        var row = IA[r0].slice(c0, c0 + 3);
        comp.textContent = "(−1·" + row[0] + " + 0·" + row[1] + " + 1·" + row[2] + ") × 3 = " + out(IA, r0, c0);
      }
      update();
      var notes = (compact ? ["6 − 3 + 1 = 4 per side", "9 weights, shared by 16 outputs"] : ["output size: 6 − 3 + 1 = 4 per side", "9 weights, shared by all 16 outputs"]).map(function (t, n) {
        var e = S("text", { x: L.cx, y: n ? L.fy : L.cy, class: "t t-sm" + (n ? " t-orange" : ""), "font-weight": n ? 650 : 400, text: t }, svg);
        e.style.opacity = 0; return e;
      });
      var shiftNote = S("text", { x: L.cx, y: L.cy, class: "t t-sm t-orange", "font-weight": 650, text: compact ? "edge moved → output moved" : "edge moved right → output moved right" }, svg);
      shiftNote.style.opacity = 0;
      tl.addLabel("s0", 0);

      // s1: first window
      LC.popIn(tl, [win, tgt, comp], { duration: 0.4 });
      LC.popIn(tl, OA[0], { duration: 0.3 });
      tl.addLabel("s1");
      // s2: second window
      tl.to(st, { k: 1, duration: 0.6, ease: "power1.inOut", onUpdate: update });
      LC.popIn(tl, OA[1], { duration: 0.3 });
      tl.addLabel("s2");
      // s3: the rest
      for (var k = 2; k < 16; k++) {
        tl.to(st, { k: k, duration: k % 4 === 0 ? 0.3 : 0.18, ease: "power1.inOut", onUpdate: update });
        LC.popIn(tl, OA[k], { duration: 0.12 });
      }
      tl.addLabel("s3");
      // s4: size + sharing
      tl.to([win, tgt, comp], { opacity: 0, duration: 0.3 });
      LC.popIn(tl, notes, { duration: 0.4, stagger: 0.2 });
      tl.to(kg, { scale: 1.06, transformOrigin: "50% 50%", duration: 0.25, yoyo: true, repeat: 1 });
      tl.addLabel("s4");
      // s5: shift the edge
      tl.to(notes, { opacity: 0, duration: 0.3 });
      tl.to(colB, { opacity: 1, duration: 0.5 });
      tl.to(colA, { opacity: 0, duration: 0.5 }, "<");
      tl.to(OA, { opacity: 0, duration: 0.4 });
      tl.to(OB, { opacity: 1, duration: 0.5 }, "<");
      LC.popIn(tl, shiftNote, { duration: 0.3 });
      tl.addLabel("s5");
      return tl;
    }
  };
})();
