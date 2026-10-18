/* VD.1: from pixels to space-time tokens. Eight frames of a bouncing ball, each
   4 × 3 patches. Tubelets of t = 2 frames give 4 time slabs × 12 places = 48 tokens.
   Full space-time attention: 48² = 2,304 pairs. Divided space-time attention
   (TimeSformer, Bertasius et al. 2021): each token attends to its own time slab
   (12 tokens) and to its own place across time (4 tokens): 48 × 16 = 768 pairs. */
(function () {
  var LC = window.LC;
  var NF = 8, PC = 4, PR = 3, TT = 2;            // frames, patch columns, patch rows, tubelet depth
  var NS = NF / TT, NP = PC * PR, N = NS * NP;    // 4 slabs, 12 places, 48 tokens
  var Q = { slab: 1, r: 1, c: 2 };                // the highlighted tubelet / query token
  var QP = Q.r * PC + Q.c;                        // its place index (0..11)

  LC.anims["vd-1-tubelets"] = {
    title: "From video to space-time tokens",
    steps: [
      "A video is a stack of frames: a tensor of shape $T \\times H \\times W \\times 3$ (time, height, width, colour). Here: 8 frames of a bouncing ball.",
      "An image ViT would cut <strong>each frame</strong> into 16×16-pixel patches. Each frame here is 4 × 3 patches.",
      "A <strong>tubelet</strong> (a space-time patch) takes the same patch from $t$ consecutive frames. With $t = 2$, one tubelet is 2 × 16 × 16 pixels, and the video splits into 4 <strong>time slabs</strong>.",
      "Flatten the tubelet (2 · 16 · 16 · 3 = 1,536 numbers) and multiply by a learned matrix. Out comes one <strong>token</strong>: a $d$-dimensional vector.",
      "Every tubelet becomes a token: $\\frac{T}{t} \\cdot \\frac{H}{16} \\cdot \\frac{W}{16}$ = 4 × 3 × 4 = <strong>48 tokens</strong>. Add position embeddings for (time, row, column) and a transformer takes over.",
      "<strong>Full space-time attention:</strong> the orange token scores all 48 tokens, and so does every other token: $48^2$ = 2,304 pairs. The cost grows with the <em>square</em> of the token count.",
      "<strong>Divided attention</strong> (TimeSformer): attend within the same time slab (12 tokens, its row), then to the same place across time (4 tokens, its column). 48 × 16 = 768 pairs, and the gap grows fast for real videos."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 376 } : { w: 640, h: 324 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact", W = ctx.w;
      var cell = compact ? 17 : 17, fw = PC * cell, fh = PR * cell;
      var inGap = compact ? 8 : 5, outGap = compact ? 22 : 16;
      var perRow = compact ? 4 : 8;
      var rowW = perRow * fw + (perRow / 2) * inGap + (perRow / 2 - 1) * outGap;
      var fx0 = (W - rowW) / 2;
      var fy = compact ? [34, 112] : [40];
      var L = compact
        ? { timeY: 18, infoY: 196, tokLblY: 224, gridY: 234, tc: 14, tg: 4, formY: 334, attY: 360 }
        : { timeY: 22, infoY: 126, tokLblY: 156, gridY: 168, tc: 16, tg: 4, formY: 278, attY: 306 };
      var tl = gsap.timeline();

      function frameXY(i) {
        var k = i % perRow, row = Math.floor(i / perRow), pair = Math.floor(k / 2), inPair = k % 2;
        return { x: fx0 + pair * (2 * fw + inGap + outGap) + inPair * (fw + inGap), y: fy[row] };
      }
      function cellXY(i, r, c) { var f = frameXY(i); return { x: f.x + c * cell, y: f.y + r * cell }; }

      // ---- s0: the frames ----
      S("text", { x: fx0, y: L.timeY, class: "t t-sm t-muted", text: compact ? "time → (frames 1–8)" : "time → (frames 1–8)" }, svg);
      var tints = [], grids = [];
      for (var i = 0; i < NF; i++) {
        var f = frameXY(i);
        S("rect", { x: f.x, y: f.y, width: fw, height: fh, rx: 3, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, svg);
        var tg = [];
        for (var r = 0; r < PR; r++) for (var c = 0; c < PC; c++) {
          var t = S("rect", { x: f.x + c * cell + 0.5, y: f.y + r * cell + 0.5, width: cell - 1, height: cell - 1, class: "f-blue", "fill-opacity": 0.32 }, svg);
          t.style.opacity = 0;
          tg.push(t);
        }
        tints.push(tg);
        // bouncing ball: moves right, bounces off the floor between frames 4 and 5
        var u = i / (NF - 1), bx = f.x + fw * (0.14 + 0.72 * u);
        var by = f.y + fh * (0.22 + 0.62 * (1 - Math.pow((u - 0.5) * 2, 2)));
        S("circle", { cx: bx.toFixed(1), cy: by.toFixed(1), r: compact ? 5 : 4.5, class: "f-ink" }, svg);
        var g = S("g", {}, svg);
        for (r = 0; r < PR; r++) for (c = 0; c < PC; c++) {
          S("rect", { x: f.x + c * cell, y: f.y + r * cell, width: cell, height: cell, class: "f-none", stroke: "var(--a-faint)", "stroke-width": 1 }, g);
        }
        g.style.opacity = 0;
        grids.push(g);
      }
      tl.addLabel("s0", 0);

      // ---- s1: patch grid on every frame ----
      var info1 = S("text", { x: W / 2, y: L.infoY, class: "t t-sm t-mid", text: "each frame: 4 × 3 patches of 16×16 px" }, svg);
      LC.popIn(tl, grids, { duration: 0.35, stagger: 0.06 }, "+=0.01");
      LC.popIn(tl, info1, { duration: 0.3 }, "-=0.2");
      tl.addLabel("s1");

      // ---- s2: tubelets (pairs of frames) + one highlighted tubelet ----
      var boxes = [];
      for (var s = 0; s < NS; s++) {
        var a = frameXY(2 * s);
        boxes.push(S("rect", { x: a.x - 4, y: a.y - 4, width: 2 * fw + inGap + 8, height: fh + 8, rx: 6, class: "f-none", stroke: "var(--a-blue)", "stroke-width": 1.5, "stroke-dasharray": "4 3" }, svg));
      }
      var hl = [0, 1].map(function (k) {
        var p = cellXY(2 * Q.slab + k, Q.r, Q.c);
        return S("rect", { x: p.x, y: p.y, width: cell, height: cell, class: "f-orange", "fill-opacity": 0.75, stroke: "var(--a-orange)", "stroke-width": 1.5 }, svg);
      });
      var info2 = S("text", { x: W / 2, y: L.infoY, class: "t t-sm t-mid", text: "1 tubelet = 2 frames × 16 × 16 px" }, svg);
      tl.to(info1, { opacity: 0, duration: 0.2 });
      LC.popIn(tl, boxes, { duration: 0.3, stagger: 0.08 });
      LC.popIn(tl, hl, { duration: 0.35 });
      LC.popIn(tl, info2, { duration: 0.3 }, "<");
      tl.addLabel("s2");

      // ---- s3: tubelet → one token ----
      var gw = NP * (L.tc + L.tg) - L.tg, gx = (W - gw) / 2;
      function tokXY(sl, p) { return { x: gx + p * (L.tc + L.tg), y: L.gridY + sl * (L.tc + L.tg) }; }
      var tokLbl = S("text", { x: W / 2, y: L.tokLblY, class: "t t-sm t-muted t-mid", text: "tokens: one row per time slab" }, svg);
      var rowLbls = [], toks = [];
      for (s = 0; s < NS; s++) {
        var p0 = tokXY(s, 0);
        rowLbls.push(S("text", { x: gx - 8, y: p0.y + L.tc - 2, class: "t t-sm t-muted t-end", text: "t" + (s + 1) }, svg));
        for (var p = 0; p < NP; p++) {
          var q = tokXY(s, p), isQ = s === Q.slab && p === QP;
          toks.push(S("rect", { x: q.x, y: q.y, width: L.tc, height: L.tc, rx: 3, class: isQ ? "f-orange" : "f-blue", "fill-opacity": isQ ? 1 : 0.4 }, svg));
        }
      }
      var qTok = toks[Q.slab * NP + QP];
      var others = toks.filter(function (t) { return t !== qTok; });
      [tokLbl, qTok].concat(rowLbls, others).forEach(function (e) { e.style.opacity = 0; });
      var dst = tokXY(Q.slab, QP);
      var flyers = [0, 1].map(function (k) {
        var p = cellXY(2 * Q.slab + k, Q.r, Q.c);
        var fl = S("rect", { x: p.x, y: p.y, width: cell, height: cell, class: "f-orange", "fill-opacity": 0.8 }, svg);
        fl.style.opacity = 0;
        return { el: fl, dx: dst.x + L.tc / 2 - (p.x + cell / 2), dy: dst.y + L.tc / 2 - (p.y + cell / 2) };
      });
      var info3 = S("text", { x: W / 2, y: L.infoY, class: "t t-sm t-mid", text: "2 · 16 · 16 · 3 = 1,536 numbers → 1 token" }, svg);
      tl.to(info2, { opacity: 0, duration: 0.2 });
      LC.popIn(tl, info3, { duration: 0.3 });
      LC.popIn(tl, tokLbl, { duration: 0.3 }, "<");
      flyers.forEach(function (fl, k) {
        tl.set(fl.el, { opacity: 1, x: 0, y: 0 }, k ? "<" : "+=0.05");
        tl.to(fl.el, { x: fl.dx, y: fl.dy, scale: 0.85, transformOrigin: "50% 50%", duration: 0.8, ease: "power1.inOut" }, "<");
      });
      tl.to(flyers.map(function (f) { return f.el; }), { opacity: 0, duration: 0.15 });
      LC.popIn(tl, qTok, { duration: 0.2 }, "<");
      tl.addLabel("s3");

      // ---- s4: all tubelets → 48 tokens ----
      var info4 = S("text", { x: W / 2, y: L.infoY, class: "t t-sm t-mid", text: "every tubelet → one token" }, svg);
      var form = S("text", { x: W / 2, y: L.formY, class: "t t-mid", text: "4 slabs × 3 × 4 places = 48 tokens", "font-weight": 600 }, svg);
      tl.to(info3, { opacity: 0, duration: 0.2 });
      LC.popIn(tl, info4, { duration: 0.3 });
      LC.popIn(tl, rowLbls, { duration: 0.3 }, "<");
      LC.popIn(tl, others, { duration: 0.2, stagger: 0.012 }, "<");
      LC.popIn(tl, form, { duration: 0.3 });
      tl.addLabel("s4");

      // ---- s5: full space-time attention ----
      var info5 = S("text", { x: W / 2, y: L.infoY, class: "t t-sm t-mid", text: "full attention: each token sees all 48" }, svg);
      var att5 = S("text", { x: W / 2, y: L.attY, class: "t t-mid t-mono", text: "48² = 2,304 pairs" }, svg);
      var allTints = [].concat.apply([], tints);
      tl.to(info4, { opacity: 0, duration: 0.2 });
      LC.popIn(tl, info5, { duration: 0.3 });
      tl.to(boxes, { opacity: 0.35, duration: 0.3 }, "<");
      tl.to(allTints, { opacity: 1, duration: 0.4, stagger: 0.004 }, "<");
      tl.to(others, { attr: { "fill-opacity": 0.85 }, duration: 0.4 }, "<");
      LC.popIn(tl, att5, { duration: 0.3 });
      tl.addLabel("s5");

      // ---- s6: divided space-time attention ----
      var keep = [];
      for (i = 0; i < NF; i++) for (var k2 = 0; k2 < NP; k2++) {
        if (Math.floor(i / TT) === Q.slab || k2 === QP) keep.push(tints[i][k2]);
      }
      var drop = allTints.filter(function (t) { return keep.indexOf(t) < 0; });
      var tokKeep = [], tokDrop = [];
      toks.forEach(function (t, idx) {
        if (t === qTok) return;
        var sl = Math.floor(idx / NP), pl = idx % NP;
        (sl === Q.slab || pl === QP ? tokKeep : tokDrop).push(t);
      });
      var info6 = S("text", { x: W / 2, y: L.infoY, class: "t t-sm t-mid", text: compact ? "divided: own slab (12) + own place (4)" : "divided: same time slab (12) + same place over time (4)" }, svg);
      var att6 = S("text", { x: W / 2, y: L.attY, class: "t t-mid t-mono", text: "48 × (12 + 4) = 768 pairs" }, svg);
      tl.to([info5, att5], { opacity: 0, duration: 0.2 });
      LC.popIn(tl, info6, { duration: 0.3 });
      tl.to(drop, { opacity: 0, duration: 0.4 }, "<");
      tl.to(tokDrop, { attr: { "fill-opacity": 0.12 }, duration: 0.4 }, "<");
      LC.popIn(tl, att6, { duration: 0.3 });
      tl.addLabel("s6");
      return tl;
    }
  };
})();
