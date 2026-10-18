/* M5.4: PagedAttention (Kwon et al., 2023). KV-cache memory as 24 physical blocks
   of 4 token slots. First the old way (one contiguous max-length reservation per
   request), then fixed-size blocks + per-request block tables, on-demand growth,
   and block sharing between two samples of the same prompt. */
(function () {
  var LC = window.LC;
  var NBLK = 24, SLOTS = 4;
  // Paged placement (physical block ids) and tokens per block.
  var A0 = [[5, 4], [18, 2]], B0 = [[2, 4], [9, 4], [14, 4], [21, 1]], C0 = [[11, 4], [0, 4]];

  LC.anims["m5-4-paged"] = {
    title: "PagedAttention: the KV cache in fixed-size blocks",
    steps: [
      "The <strong>KV cache</strong> (M1.5) holds keys and values for every token of every running request. Here its memory has 24 blocks × 4 = <strong>96 token slots</strong>.",
      "The old way: give each request <strong>one contiguous chunk</strong> sized for the longest output it might produce, here 32 slots. A has written 6 tokens so far, B 13 and C 8.",
      "Only 27 of 96 slots hold real tokens (28%); the rest is <strong>reserved but empty</strong>. A fourth request D has to wait. Kwon et al. measured just 20–38% of KV memory in actual use in earlier systems.",
      "<strong>PagedAttention</strong> cuts the cache into small fixed-size <strong>blocks</strong> (4 tokens here; vLLM's default is 16). Each request's <strong>block table</strong> lists its blocks, which can sit anywhere, like pages in an OS.",
      "Blocks are handed out <strong>on demand</strong>. A writes 3 more tokens: it fills block 18, then takes any free block (7). At most one part-full block per request is wasted.",
      "<strong>Sharing:</strong> C wants two samples of the same prompt. C₁ and C₂ point at the <em>same</em> prompt blocks (×2 = reference count) and only new tokens get new blocks. Prefix caching reuses blocks the same way.",
      "Still <strong>13 of 24 blocks free</strong>: room for many more requests in the same memory, so bigger batches. The vLLM paper reported 2–4× the throughput of earlier systems at similar latency."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 380 } : { w: 640, h: 220 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact";
      var perRow = compact ? 6 : 8, bw = compact ? 54 : 50, bh = 28, gapX = compact ? 4 : 4, pitchY = 48;
      var gx = compact ? 6 : 14, gy = compact ? 34 : 38;
      var px = compact ? 10 : 472, py = compact ? 262 : 44, rowH = compact ? 21 : 24; // text panel
      var cellPad = 3, cw = (bw - 2 * cellPad - (SLOTS - 1) * 2) / SLOTS;
      var tl = gsap.timeline();
      function bx(id) { return gx + (id % perRow) * (bw + gapX); }
      function by(id) { return gy + Math.floor(id / perRow) * pitchY; }
      function cell(id, k, cls, op) {
        var r = S("rect", { x: bx(id) + cellPad + k * (cw + 2), y: by(id) + cellPad, width: cw, height: bh - 2 * cellPad, rx: 2, class: cls, "fill-opacity": op }, svg);
        r.style.opacity = 0; return r;
      }
      function line(row, txt, cls) {
        var t = S("text", { x: px, y: py + (row + 1) * rowH, class: "t t-sm t-mono " + (cls || ""), text: txt }, svg);
        t.style.opacity = 0; return t;
      }

      // ---- s0: empty memory ----
      S("text", { x: compact ? 6 : 14, y: 18, class: "t t-sm t-muted", text: compact ? "KV-cache memory · 24 blocks × 4 slots" : "KV-cache memory: 24 blocks × 4 token slots (number = block id)" }, svg);
      var ids = [];
      for (var b = 0; b < NBLK; b++) {
        S("rect", { x: bx(b), y: by(b), width: bw, height: bh, rx: 5, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, svg);
        for (var k = 0; k < SLOTS; k++) S("rect", { x: bx(b) + cellPad + k * (cw + 2), y: by(b) + cellPad, width: cw, height: bh - 2 * cellPad, rx: 2, class: "f-surface2" }, svg);
        ids.push(S("text", { x: bx(b) + bw / 2, y: by(b) + bh + 14, class: "t t-sm t-muted t-mid", text: String(b) }, svg));
      }
      tl.addLabel("s0", 0);

      // ---- s1: contiguous reservations ----
      var title1 = S("text", { x: px, y: py, class: "t t-sm t-muted", text: "contiguous reservations" }, svg);
      title1.style.opacity = 0;
      var naive = [], reqs = [["A", 6, "f-orange", "t-orange"], ["B", 13, "f-blue", "t-blue"], ["C", 8, "f-ink", ""]];
      var nLines = reqs.map(function (r, ri) {
        for (var s = 0; s < 32; s++) {
          var id = ri * 8 + Math.floor(s / SLOTS);
          naive.push({ el: cell(id, s % SLOTS, r[2], s < r[1] ? 0.85 : 0.16), used: s < r[1] });
        }
        return line(ri, r[0] + ": " + r[1] + " used of 32", r[3]);
      });
      LC.popIn(tl, naive.map(function (n) { return n.el; }), { duration: 0.25, stagger: 0.006 });
      LC.popIn(tl, [title1].concat(nLines), { duration: 0.3, stagger: 0.1 }, "-=0.2");
      tl.addLabel("s1");

      // ---- s2: the waste ----
      var empty = naive.filter(function (n) { return !n.used; }).map(function (n) { return n.el; });
      var dLine = line(3, compact ? "D: waiting, no room" : "D: waiting (no room)", "t-muted");
      var useLine = line(4, "in use: 27 / 96 = 28%", "");
      tl.to(empty, { attr: { "fill-opacity": 0.4 }, duration: 0.35, yoyo: true, repeat: 1 });
      LC.popIn(tl, [dLine, useLine], { duration: 0.3, stagger: 0.15 });
      tl.addLabel("s2");

      // ---- s3: blocks + block tables ----
      tl.to(naive.map(function (n) { return n.el; }).concat([title1, dLine, useLine], nLines), { opacity: 0, duration: 0.4 });
      var title2 = S("text", { x: px, y: py, class: "t t-sm t-muted", text: "block tables" }, svg);
      title2.style.opacity = 0;
      function place(list, cls) {
        var out = [];
        list.forEach(function (p) { for (var s = 0; s < p[1]; s++) out.push(cell(p[0], s, cls, 0.85)); });
        return out;
      }
      var aC = place(A0, "f-orange"), bC = place(B0, "f-blue"), cC = place(C0, "f-ink");
      var tA = line(0, "A → 5, 18", "t-orange"), tB = line(1, "B → 2, 9, 14, 21", "t-blue"), tC = line(2, "C → 11, 0", "");
      LC.popIn(tl, aC.concat(bC, cC), { duration: 0.25, stagger: 0.02 });
      LC.popIn(tl, [title2, tA, tB, tC], { duration: 0.3, stagger: 0.1 }, "-=0.2");
      tl.addLabel("s3");

      // ---- s4: A grows ----
      var aNew = [cell(18, 2, "f-orange", 0.85), cell(18, 3, "f-orange", 0.85), cell(7, 0, "f-orange", 0.85)];
      var hl7 = S("rect", { x: bx(7) - 3, y: by(7) - 3, width: bw + 6, height: bh + 6, rx: 7, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 2.5 }, svg);
      hl7.style.opacity = 0;
      var tA2 = line(0, "A → 5, 18, 7", "t-orange");
      var waste = line(4, compact ? "waste ≤ 1 part-full block each" : "≤ 1 part-full block", "t-muted");
      LC.popIn(tl, aNew, { duration: 0.3, stagger: 0.25 });
      LC.popIn(tl, hl7, { duration: 0.3 }, "<");
      tl.to(tA, { opacity: 0, duration: 0.2 }, "<");
      LC.popIn(tl, [tA2, waste], { duration: 0.3, stagger: 0.1 }, "<");
      tl.addLabel("s4");

      // ---- s5: sharing between two samples ----
      var c1 = [cell(16, 0, "f-ink", 0.85), cell(16, 1, "f-ink", 0.85)], c2 = [cell(22, 0, "f-ink", 0.5), cell(22, 1, "f-ink", 0.5)];
      var tC1 = line(2, "C₁ → 11, 0, 16", ""), tC2 = line(3, "C₂ → 11, 0, 22", "");
      var share = [11, 0].map(function (id) {
        return S("text", { x: bx(id) + bw / 2, y: by(id) + bh + 14, class: "t t-sm t-mid", "font-weight": 650, text: id + " ×2" }, svg);
      });
      share.forEach(function (t) { t.style.opacity = 0; });
      tl.to([hl7, waste, tC], { opacity: 0, duration: 0.3 });
      tl.to([ids[11], ids[0]], { opacity: 0, duration: 0.2 }, "<");
      LC.popIn(tl, share, { duration: 0.3 });
      LC.popIn(tl, [tC1, tC2], { duration: 0.3, stagger: 0.12 }, "<");
      LC.popIn(tl, c1.concat(c2), { duration: 0.3, stagger: 0.12 });
      tl.addLabel("s5");

      // ---- s6: free blocks ----
      var used = { 5: 1, 18: 1, 7: 1, 2: 1, 9: 1, 14: 1, 21: 1, 11: 1, 0: 1, 16: 1, 22: 1 };
      var free = [];
      for (var f = 0; f < NBLK; f++) if (!used[f]) free.push(S("rect", { x: bx(f) + 1, y: by(f) + 1, width: bw - 2, height: bh - 2, rx: 4, class: "f-none", stroke: "var(--a-blue)", "stroke-width": 1.5, "stroke-dasharray": "4 3" }, svg));
      var freeLine = line(4, "13 of 24 blocks free", "t-blue");
      LC.popIn(tl, free, { duration: 0.25, stagger: 0.03 });
      LC.popIn(tl, freeLine, { duration: 0.3 }, "-=0.1");
      tl.addLabel("s6");
      return tl;
    }
  };
})();
