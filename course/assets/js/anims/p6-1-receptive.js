/* P6.1: the receptive field of one unit grows through three stacked 3×3 convs
   (stride 1, "same" padding): 3×3, 5×5, 7×7. Left/top: a side view of one row of
   units per layer, with the connections that feed the chosen unit. Right/bottom:
   the input image from above, with the patch the unit can see. Last step: the number
   of paths from each input pixel to the top unit, (1,3,6,7,6,3,1) per axis. */
(function () {
  var LC = window.LC;
  var N = 9, C = 4;                       // 9 units per row, centre index 4
  var PATHS = [1, 3, 6, 7, 6, 3, 1];      // [1,1,1] convolved with itself 3 times

  LC.anims["p6-1-receptive"] = {
    title: "Receptive field: three 3×3 layers see 7×7",
    steps: [
      "Three stacked <strong>3×3 conv layers</strong> (stride 1, padded so every map stays 9 wide). Left: one row of units in each layer, seen from the side. Right: the input image from above.",
      "A <strong>layer-1</strong> unit looks at a 3×3 patch of the input. That patch is its <strong>receptive field</strong>.",
      "A <strong>layer-2</strong> unit looks at 3×3 layer-1 units. Each of those saw its own 3×3 patch, and together they cover <strong>5×5</strong> input pixels.",
      "A <strong>layer-3</strong> unit reaches <strong>7×7</strong>. Every 3×3 layer adds 2 pixels: $1 + L(k-1) = 1 + 3 \\times 2 = 7$.",
      "One 7×7 filter would see the same patch, but with $49C^2$ weights and one ReLU. Three 3×3 layers use only $27C^2$ and get <strong>three</strong> nonlinearities. That was VGG's design choice.",
      "Not every pixel counts equally. The centre pixel reaches the top unit through $7 \\times 7 = 49$ paths, a corner pixel through just 1. So the <strong>effective</strong> receptive field is concentrated in the middle (Luo et al., 2016)."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 496 } : { w: 640, h: 340 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact", W = ctx.w;
      var tl = gsap.timeline();

      // ---- geometry ----
      var P = compact
        ? { cw: 30, gap: 4, ch: 20, x0: 46, rowsY: [30, 74, 118, 162], countY: 200, lblX: 38 }
        : { cw: 26, gap: 4, ch: 26, x0: 84, rowsY: [56, 110, 164, 218], countY: 264, lblX: 74 };
      var G = compact
        ? { cs: 20, gap: 2, x0: 0, y0: 246, titleY: 234 }
        : { cs: 22, gap: 2, x0: 396, y0: 56, titleY: 40 };
      var gridW = N * G.cs + (N - 1) * G.gap;
      if (compact) G.x0 = (W - gridW) / 2;
      var readY = compact ? G.y0 + gridW + 22 : G.y0 + gridW + 30;
      function ux(i) { return P.x0 + i * (P.cw + P.gap); }        // left edge of unit i
      function ucx(i) { return ux(i) + P.cw / 2; }
      function gx(i) { return G.x0 + i * (G.cs + G.gap); }

      // ---- side view: rows from top (layer 3) to bottom (input) ----
      var rowNames = compact ? ["L3", "L2", "L1", "in"] : ["layer 3", "layer 2", "layer 1", "input"];
      S("text", { x: compact ? 4 : P.lblX - 50, y: compact ? 14 : 40, class: "t t-sm t-muted", text: compact ? "side view: one row per layer" : "side view: one row of units per layer" }, svg);
      var lines = S("g", {}, svg);
      var rowHL = [];   // rowHL[r][i] orange overlays
      P.rowsY.forEach(function (y, r) {
        S("text", { x: P.lblX, y: y + P.ch / 2 + 4, class: "t t-sm t-muted t-end", text: rowNames[r] }, svg);
        rowHL.push([]);
        for (var i = 0; i < N; i++) {
          S("rect", { x: ux(i), y: y, width: P.cw, height: P.ch, rx: 4, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, svg);
          var o = S("rect", { x: ux(i), y: y, width: P.cw, height: P.ch, rx: 4, class: "f-orange" }, svg);
          o.style.opacity = 0;
          rowHL[r].push(o);
        }
      });

      // ---- top view: the 9×9 input image ----
      S("text", { x: G.x0 + gridW / 2, y: G.titleY, class: "t t-sm t-muted t-mid", text: "input image, from above" }, svg);
      var cellHL = [];
      for (var r = 0; r < N; r++) {
        cellHL.push([]);
        for (var c = 0; c < N; c++) {
          S("rect", { x: gx(c), y: G.y0 + r * (G.cs + G.gap), width: G.cs, height: G.cs, rx: 3, class: "f-surface2", stroke: "var(--line)", "stroke-width": 1 }, svg);
          var o2 = S("rect", { x: gx(c), y: G.y0 + r * (G.cs + G.gap), width: G.cs, height: G.cs, rx: 3, class: "f-orange" }, svg);
          o2.style.opacity = 0;
          cellHL[r].push(o2);
        }
      }
      var frame = S("rect", { x: gx(C) - 3, y: G.y0 + C * (G.cs + G.gap) - 3, width: G.cs + 6, height: G.cs + 6, rx: 5, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 2.5 }, svg);
      frame.style.opacity = 0;

      // readouts under the grid (one per step, swapped in place)
      function readout(txt, cls, y) { var t = S("text", { x: G.x0 + gridW / 2, y: y || readY, class: "t t-sm t-mid " + (cls || ""), text: txt }, svg); t.style.opacity = 0; return t; }
      var reads = [
        readout("layer-1 unit sees 3 × 3", "t-orange"),
        readout("layer-2 unit sees 5 × 5", "t-orange"),
        readout("layer-3 unit sees 7 × 7", "t-orange")
      ];
      tl.addLabel("s0", 0);

      // helper: connections from unit i in row r (0 = top) to i-1..i+1 in row r+1
      function fan(r, i) {
        var y1 = P.rowsY[r] + P.ch, y2 = P.rowsY[r + 1];
        return [-1, 0, 1].map(function (d) {
          return S("path", { d: "M" + ucx(i) + " " + y1 + "L" + ucx(i + d) + " " + y2, class: "s-orange", "stroke-width": 1.5 }, lines);
        });
      }
      function showRegion(half) {
        var els = [];
        for (var rr = C - half; rr <= C + half; rr++) for (var cc = C - half; cc <= C + half; cc++) els.push(cellHL[rr][cc]);
        return els;
      }
      function setFrame(half) {
        var s = (2 * half + 1) * G.cs + 2 * half * G.gap;
        return { attr: { x: gx(C - half) - 3, y: G.y0 + (C - half) * (G.cs + G.gap) - 3, width: s + 6, height: s + 6 } };
      }

      // ---- s1: layer-1 unit, 3×3 ----
      LC.popIn(tl, rowHL[2][C], { duration: 0.3 }, "+=0.02");
      fan(2, C).forEach(function (p, k) { LC.drawIn(tl, p, { duration: 0.4 }, k ? "<0.05" : "+=0.01"); });
      tl.to([rowHL[3][C - 1], rowHL[3][C], rowHL[3][C + 1]], { opacity: 0.45, duration: 0.3 });
      tl.to(showRegion(1), { opacity: 0.75, duration: 0.4 }, "<");
      tl.set(frame, setFrame(1), "<");
      tl.to(frame, { opacity: 1, duration: 0.3 }, "<");
      tl.to(reads[0], { opacity: 1, duration: 0.3 }, "<");
      tl.addLabel("s1");

      // ---- s2: layer-2 unit, 5×5 ----
      tl.to(rowHL[2][C], { opacity: 0.45, duration: 0.2 });
      LC.popIn(tl, rowHL[1][C], { duration: 0.3 }, "<");
      fan(1, C).forEach(function (p, k) { LC.drawIn(tl, p, { duration: 0.35 }, k ? "<0.05" : "+=0.01"); });
      tl.to([rowHL[2][C - 1], rowHL[2][C + 1]], { opacity: 0.45, duration: 0.25 });
      fan(2, C - 1).concat(fan(2, C + 1)).forEach(function (p, k) { LC.drawIn(tl, p, { duration: 0.35 }, k ? "<0.03" : "+=0.01"); });
      tl.to([rowHL[3][C - 2], rowHL[3][C + 2]], { opacity: 0.45, duration: 0.25 });
      tl.to(showRegion(2), { opacity: 0.75, duration: 0.4 }, "<");
      tl.to(frame, Object.assign({ duration: 0.4 }, setFrame(2)), "<");
      tl.to(reads[0], { opacity: 0, duration: 0.2 }, "<");
      tl.to(reads[1], { opacity: 1, duration: 0.3 });
      tl.addLabel("s2");

      // ---- s3: layer-3 unit, 7×7 ----
      tl.to(rowHL[1][C], { opacity: 0.45, duration: 0.2 });
      LC.popIn(tl, rowHL[0][C], { duration: 0.3 }, "<");
      fan(0, C).forEach(function (p, k) { LC.drawIn(tl, p, { duration: 0.35 }, k ? "<0.05" : "+=0.01"); });
      tl.to([rowHL[1][C - 1], rowHL[1][C + 1]], { opacity: 0.45, duration: 0.25 });
      fan(1, C - 1).concat(fan(1, C + 1)).forEach(function (p, k) { LC.drawIn(tl, p, { duration: 0.3 }, k ? "<0.03" : "+=0.01"); });
      tl.to([rowHL[2][C - 2], rowHL[2][C + 2]], { opacity: 0.45, duration: 0.25 });
      fan(2, C - 2).concat(fan(2, C + 2)).forEach(function (p, k) { LC.drawIn(tl, p, { duration: 0.3 }, k ? "<0.03" : "+=0.01"); });
      tl.to([rowHL[3][C - 3], rowHL[3][C + 3]], { opacity: 0.45, duration: 0.25 });
      tl.to(showRegion(3), { opacity: 0.75, duration: 0.4 }, "<");
      tl.to(frame, Object.assign({ duration: 0.4 }, setFrame(3)), "<");
      tl.to(reads[1], { opacity: 0, duration: 0.2 }, "<");
      tl.to(reads[2], { opacity: 1, duration: 0.3 });
      tl.addLabel("s3");

      // ---- s4: cost comparison ----
      var cmpY = compact ? [readY, readY + 20] : [P.countY + 24, P.countY + 46];
      var cmpX = compact ? W / 2 : P.x0 + (N * P.cw + (N - 1) * P.gap) / 2;
      var cmp1 = S("text", { x: cmpX, y: cmpY[0], class: "t t-sm t-mid t-blue", text: compact ? "three 3×3: 27C² weights, 3 ReLUs" : "three 3×3 layers: 27C² weights, 3 ReLUs" }, svg);
      var cmp2 = S("text", { x: cmpX, y: cmpY[1], class: "t t-sm t-mid t-muted", text: compact ? "one 7×7: 49C² weights, 1 ReLU" : "one 7×7 layer: 49C² weights, 1 ReLU" }, svg);
      if (compact) tl.to(reads[2], { opacity: 0, duration: 0.2 }, "+=0.05");
      LC.popIn(tl, [cmp1, cmp2], { duration: 0.4, stagger: 0.25 }, compact ? undefined : "+=0.05");
      tl.addLabel("s4");

      // ---- s5: path counts ----
      var counts = PATHS.map(function (p, k) {
        return S("text", { x: ucx(C - 3 + k), y: P.countY, class: "t t-sm t-mono t-mid t-orange", text: p }, svg);
      });
      var nums = [];
      for (var a = 0; a < 7; a++) for (var b = 0; b < 7; b++) {
        var v = PATHS[a] * PATHS[b];
        var tx = S("text", { x: gx(C - 3 + b) + G.cs / 2, y: G.y0 + (C - 3 + a) * (G.cs + G.gap) + G.cs / 2 + 3.5, class: "t t-mono t-mid t-nohalo", "font-size": compact ? 9.5 : 10, text: v, style: v / 49 > 0.45 ? "fill:#fff" : "" }, svg);
        tx.style.opacity = 0;
        nums.push({ el: tx, v: v, cell: cellHL[C - 3 + a][C - 3 + b] });
      }
      var pathRead = readout(compact ? "paths: centre 49, corner 1" : "paths to the top unit: centre 49, corner 1", "t-orange");
      tl.to([cmp1, cmp2, reads[2]], { opacity: 0, duration: 0.3 }, "+=0.05");
      tl.to(lines, { opacity: 0.35, duration: 0.3 }, "<");
      nums.forEach(function (n, k) {
        tl.to(n.cell, { opacity: 0.1 + 0.9 * n.v / 49, duration: 0.4 }, k ? "<" : "+=0.01");
      });
      LC.popIn(tl, counts, { duration: 0.3, stagger: 0.05 });
      tl.to(nums.map(function (n) { return n.el; }), { opacity: 1, duration: 0.4 }, "<");
      tl.to(pathRead, { opacity: 1, duration: 0.3 }, "<");
      tl.addLabel("s5");
      return tl;
    }
  };
})();
