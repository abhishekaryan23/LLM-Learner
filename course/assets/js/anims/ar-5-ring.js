/* AR.5: ring attention with 4 devices. Device i keeps query block Q_i; key/value blocks
   rotate one hop per round (device i holds KV_{(i - r) mod 4} in round r), so after
   4 rounds every (Q_i, KV_j) pair has been computed: 16 blocks. Causal: blocks with
   j > i are masked (6 of 16); with contiguous blocks device 1 does 1 block, device 4 does 4. */
(function () {
  var LC = window.LC;

  LC.anims["ar-5-ring"] = {
    title: "Ring attention: one sequence, four GPUs",
    steps: [
      "A long sequence is split into 4 blocks, one per GPU. Each GPU keeps its <strong>queries</strong> $Q_i$ (blue) and starts with its own <strong>keys and values</strong> $KV_i$ (orange). The GPUs form a ring.",
      "<strong>Round 1:</strong> each GPU computes attention between its queries and the KV block it holds. The grid records which (query, key) blocks are done: the diagonal.",
      "<strong>Round 2:</strong> every KV block moves one hop around the ring while the GPUs compute, so the transfer hides behind the arithmetic. Each GPU now covers a new block.",
      "<strong>Round 3:</strong> another hop, another diagonal. Partial results are merged with the <strong>online softmax</strong> (running max and sum), so the order blocks arrive in doesn't matter.",
      "<strong>Round 4:</strong> every query block has met every KV block: exact attention over the whole sequence, with each GPU only ever holding 2 of the 8 blocks at once.",
      "With a <strong>causal mask</strong>, blocks above the diagonal (grey) are skipped. With contiguous blocks GPU 1 has 1 block of work and GPU 4 has 4, so real systems interleave early and late tokens on each GPU to even out the load."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 362 } : { w: 640, h: 248 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      function readout(t) { return S("text", { x: compact ? 4 : 8, y: 18, class: "t t-sm", text: t }, svg); }
      function swapR(a, b, pos) { tl.to(a, { opacity: 0, duration: 0.25 }, pos); LC.popIn(tl, b, { duration: 0.35 }, "<0.1"); }
      // device positions (ring order 0 -> 1 -> 2 -> 3 -> 0, clockwise)
      var bw = 112, bh = 56;
      var C = compact ? [[64, 36], [196, 36], [196, 128], [64, 128]] : [[30, 60], [190, 60], [190, 172], [30, 172]];
      if (compact) C = C.map(function (p) { return [p[0] - 16, p[1]]; });
      var chip = compact ? 40 : 42;
      function kvPos(d) { return { x: C[d][0] + 62, y: C[d][1] + 26 }; }
      for (var d = 0; d < 4; d++) {
        S("rect", { x: C[d][0], y: C[d][1], width: bw, height: bh, rx: 10, class: "f-surface", stroke: "var(--a-ink)", "stroke-width": 1.3 }, svg);
        S("text", { x: C[d][0] + 8, y: C[d][1] + 17, class: "t t-sm t-muted", "font-weight": 600, text: "GPU " + (d + 1) }, svg);
        S("rect", { x: C[d][0] + 8, y: C[d][1] + 26, width: chip, height: 22, rx: 5, class: "f-blue" }, svg);
        S("text", { x: C[d][0] + 8 + chip / 2, y: C[d][1] + 41, class: "t t-sm t-mid t-nohalo", style: "fill:#fff", "font-weight": 650, text: "Q" + (d + 1) }, svg);
      }
      // ring arrows between boxes
      function arrow(x1, y1, x2, y2) {
        var p = S("path", { d: "M" + x1 + " " + y1 + "L" + x2 + " " + y2, class: "s-faint", "stroke-width": 2 }, svg);
        var ang = Math.atan2(y2 - y1, x2 - x1), a = 6;
        S("path", { d: "M" + (x2 - a * Math.cos(ang - 0.5)) + " " + (y2 - a * Math.sin(ang - 0.5)) + "L" + x2 + " " + y2 + "L" + (x2 - a * Math.cos(ang + 0.5)) + " " + (y2 - a * Math.sin(ang + 0.5)), class: "s-faint", "stroke-width": 2 }, svg);
        return p;
      }
      var gapX0 = C[0][0] + bw + 4, gapX1 = C[1][0] - 4, midYTop = C[0][1] + bh / 2, midYBot = C[3][1] + bh / 2;
      arrow(gapX0, midYTop, gapX1, midYTop);
      arrow(C[1][0] + bw / 2, C[1][1] + bh + 4, C[2][0] + bw / 2, C[2][1] - 4);
      arrow(gapX1, midYBot, gapX0, midYBot);
      arrow(C[3][0] + bw / 2, C[3][1] - 4, C[0][0] + bw / 2, C[0][1] + bh + 4);
      // KV chips (groups that move)
      var kvs = [0, 1, 2, 3].map(function (j) {
        var g = S("g", {}, svg);
        S("rect", { x: 0, y: 0, width: chip, height: 22, rx: 5, class: "f-orange" }, g);
        S("text", { x: chip / 2, y: 15, class: "t t-sm t-mid t-nohalo", style: "fill:#fff", "font-weight": 650, text: "KV" + (j + 1) }, g);
        var p = kvPos(j); gsap.set(g, { x: p.x, y: p.y });
        return g;
      });
      // progress grid
      var gc = 30, gx = compact ? 134 : 440, gy = compact ? 236 : 82;
      S("text", { x: compact ? 4 : gx - 44, y: gy - 26, class: "t t-sm t-muted", text: compact ? "blocks done (row Q, column KV)" : "blocks done" }, svg);
      var cells = [];
      for (var i = 0; i < 4; i++) {
        S("text", { x: gx - 8, y: gy + i * gc + gc / 2 + 4, class: "t t-sm t-end", text: "Q" + (i + 1) }, svg);
        S("text", { x: gx + i * gc + gc / 2, y: gy - 6, class: "t t-sm t-mid", text: "KV" + (i + 1) }, svg);
        cells.push([]);
        for (var j = 0; j < 4; j++) {
          S("rect", { x: gx + j * gc + 1, y: gy + i * gc + 1, width: gc - 2, height: gc - 2, rx: 3, class: "f-faint", "fill-opacity": 0.3 }, svg);
          var c = S("rect", { x: gx + j * gc + 1, y: gy + i * gc + 1, width: gc - 2, height: gc - 2, rx: 3, class: "f-orange" }, svg);
          c.style.opacity = 0; cells[i].push(c);
        }
      }
      var r0 = readout("split the sequence over a ring of GPUs");
      tl.addLabel("s0", 0);

      var labels = ["round 1: local blocks", "round 2: KV blocks move one hop", "round 3", "round 4: every pair covered"];
      var prev = r0;
      for (var r = 0; r < 4; r++) {
        var rr = readout(labels[r]);
        swapR(prev, rr); prev = rr;
        if (r > 0) {
          kvs.forEach(function (g, jj) {
            var p = kvPos((jj + r) % 4);
            tl.to(g, { x: p.x, y: p.y, duration: 0.9, ease: "power2.inOut" }, jj ? "<" : ">");
          });
        }
        var diag = [];
        for (i = 0; i < 4; i++) diag.push(cells[i][(i - r + 4) % 4]);
        tl.to(diag, { opacity: 1, duration: 0.4, stagger: 0.08 });
        tl.addLabel("s" + (r + 1));
      }
      // s5: causal
      var masked = [];
      for (i = 0; i < 4; i++) for (j = i + 1; j < 4; j++) masked.push(cells[i][j]);
      var work = [0, 1, 2, 3].map(function (k) {
        var t = S("text", { x: gx + 4 * gc + 8, y: gy + k * gc + gc / 2 + 4, class: "t t-sm t-muted", text: (k + 1) + (k ? " blocks" : " block") }, svg);
        t.style.opacity = 0; return t;
      });
      var r5 = readout("causal mask: skip the upper triangle");
      swapR(prev, r5);
      tl.to(masked, { opacity: 0, duration: 0.4 });
      LC.popIn(tl, work, { duration: 0.3, stagger: 0.06 });
      tl.addLabel("s5");
      return tl;
    }
  };
})();
