/* AR.4: from softmax attention to linear-attention states, and how the state update
   decides how much each past token still counts. 6 tokens, causal: 21 scores.
   1M tokens causal: n(n+1)/2 ≈ 5.0e11 scores per head per layer.
   Contributions after token 6: linear all 1; RetNet decay gamma = 0.7 -> 0.7^(6-j)
   = .17 .24 .34 .49 .70 1; gated / delta values are illustrative. */
(function () {
  var LC = window.LC;
  var LIN = [1, 1, 1, 1, 1, 1];
  var DEC = [0, 1, 2, 3, 4, 5].map(function (j) { return Math.pow(0.7, 5 - j); });
  var GATE = [0.05, 0.8, 0.1, 0.15, 0.6, 1];
  var DELTA = [0.05, 0, 0.1, 0.15, 0.6, 1];

  LC.anims["ar-4-linear"] = {
    title: "From attention scores to a fixed-size state",
    steps: [
      "Softmax attention scores every pair: 6 tokens give $6 \\times 7 / 2 = 21$ causal scores per head. At a million tokens that's about $5 \\times 10^{11}$, per head, per layer.",
      "Linear attention regroups the product. Every key–value pair is folded into one $d \\times d$ <strong>state</strong> $S = \\sum_j \\phi(k_j) v_j^\\top$, the same size for 6 tokens or 6 million.",
      "Causal and token by token: $S_t = S_{t-1} + \\phi(k_t) v_t^\\top$. The bars show how much each past token still counts in the state. Plain linear attention <strong>never forgets</strong>: everything counts equally, forever.",
      "<strong>RetNet</strong> multiplies the state by a fixed decay $\\gamma$ each step: $S_t = \\gamma S_{t-1} + k_t v_t^\\top$. With $\\gamma = 0.7$, token 1 counts $0.7^5 \\approx 0.17$ by token 6.",
      "<strong>Gated</strong> updates (GLA, Mamba-2) compute the decay from each token, so the model chooses: keep the important token 2, let filler fade fast.",
      "The <strong>delta rule</strong> (DeltaNet) overwrites: token 6 uses the same key as token 2, so the update first erases what was stored under that key, then writes the new value.",
      "A <strong>hybrid</strong> stacks mostly linear layers with a few full-attention layers (here 1 in 8). The attention layer keeps a KV cache for exact lookups; at long context it dominates memory, so the cache is about 1/8 of an all-attention model's."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 300 } : { w: 640, h: 300 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact", mid = W / 2;
      var tl = gsap.timeline();
      function readout(t) { return S("text", { x: compact ? 4 : 8, y: 18, class: "t t-sm", text: t }, svg); }
      function swapR(a, b, pos) { tl.to(a, { opacity: 0, duration: 0.25 }, pos); LC.popIn(tl, b, { duration: 0.35 }, "<0.1"); }

      // s0: causal score grid
      var grid = S("g", {}, svg), gc = 20, g0x = mid - 3 * gc - (compact ? 0 : 80), g0y = 40;
      for (var i = 0; i < 6; i++) for (var j = 0; j < 6; j++) {
        S("rect", { x: g0x + j * gc + 1, y: g0y + i * gc + 1, width: gc - 2, height: gc - 2, rx: 3, class: j <= i ? "f-blue" : "f-faint", "fill-opacity": j <= i ? 0.75 : 0.35 }, grid);
      }
      S("text", { x: g0x + 3 * gc, y: g0y + 6 * gc + 22, class: "t t-sm t-mid", text: "6 tokens → 21 scores" }, grid);
      S("text", { x: g0x + 3 * gc, y: g0y + 6 * gc + 42, class: "t t-sm t-mid t-orange", text: "1M tokens → 5 × 10¹¹" }, grid);
      if (!compact) {
        S("text", { x: mid + 30, y: 90, class: "t t-sm", text: "cost grows as n²" }, grid);
        S("text", { x: mid + 30, y: 112, class: "t t-sm t-muted", text: "KV cache grows as n" }, grid);
      }
      var r0 = readout("softmax attention: every pair");
      tl.addLabel("s0", 0);

      // s1: tokens + state
      var pitch = compact ? 52 : 70, t0 = mid - 2.5 * pitch, tw = pitch - 10;
      function tx(k) { return t0 + k * pitch; }
      var toks = [0, 1, 2, 3, 4, 5].map(function (k) {
        var g = S("g", {}, svg);
        S("rect", { x: tx(k) - tw / 2, y: 34, width: tw, height: 24, rx: 6, class: "f-surface", stroke: "var(--a-ink)", "stroke-width": 1.2 }, g);
        S("text", { x: tx(k), y: 51, class: "t t-sm t-mid t-nohalo", text: "t" + (k + 1) }, g);
        g.style.opacity = 0; return g;
      });
      var sc = 18, sx0 = mid - 1.5 * sc, sy0 = 72;
      var stG = S("g", {}, svg), stCells = [];
      for (i = 0; i < 3; i++) for (j = 0; j < 3; j++) stCells.push(S("rect", { x: sx0 + j * sc + 1, y: sy0 + i * sc + 1, width: sc - 2, height: sc - 2, rx: 2, class: "f-orange", "fill-opacity": 0.25 }, stG));
      var sLbl = S("text", { x: sx0 - 8, y: sy0 + 32, class: "t t-sm t-orange t-end", "font-weight": 650, text: "state S" }, stG);
      var sLbl2 = S("text", { x: sx0 + 3 * sc + 8, y: sy0 + 32, class: "t t-sm t-muted", text: "d × d, fixed" }, stG);
      stG.style.opacity = 0;
      var r1 = readout("linear attention: one d × d state");
      swapR(r0, r1);
      tl.to(grid, { opacity: 0, duration: 0.4 }, "<");
      LC.popIn(tl, toks, { duration: 0.3, stagger: 0.05 });
      tl.to(stG, { opacity: 1, duration: 0.4 });
      tl.addLabel("s1");

      // contribution bars
      var bBase = 248, bMax = 76, bw = compact ? 26 : 34;
      var bTitle = S("text", { x: 4, y: bBase - bMax - 16, class: "t t-sm t-muted", text: "how much each token still counts in S" }, svg);
      bTitle.style.opacity = 0;
      var bAxis = S("line", { x1: tx(0) - pitch / 2, x2: tx(5) + pitch / 2, y1: bBase, y2: bBase, class: "s-axis" }, svg);
      bAxis.style.opacity = 0;
      var bLbls = [0, 1, 2, 3, 4, 5].map(function (k) { var t = S("text", { x: tx(k), y: bBase + 18, class: "t t-sm t-mid t-muted", text: "t" + (k + 1) }, svg); t.style.opacity = 0; return t; });
      var bars = [0, 1, 2, 3, 4, 5].map(function (k) { return S("rect", { x: tx(k) - bw / 2, y: bBase, width: bw, height: 0, rx: 3, class: "f-blue" }, svg); });
      function setBars(vals, pos, cls) {
        vals.forEach(function (v, k) {
          tl.to(bars[k], { attr: { y: bBase - v * bMax, height: v * bMax }, duration: 0.6, ease: "power2.out" }, k ? "<0.04" : pos);
        });
      }
      // s2: accumulate
      var r2 = readout("Sₜ = Sₜ₋₁ + φ(kₜ) vₜᵀ: never forgets");
      swapR(r1, r2);
      LC.popIn(tl, [bTitle, bAxis].concat(bLbls), { duration: 0.3 });
      stCells.forEach(function (c, k) { tl.to(c, { attr: { "fill-opacity": 0.35 + 0.08 * (k % 4) }, duration: 0.3 }, k ? "<0.02" : ">"); });
      setBars(LIN, ">");
      tl.addLabel("s2");
      // s3: decay
      var gam = S("text", { x: W - (compact ? 4 : 12), y: bBase - bMax - 16, class: "t t-sm t-end t-orange", text: "γ = 0.7" }, svg);
      gam.style.opacity = 0;
      var r3 = readout("RetNet: Sₜ = γ Sₜ₋₁ + kₜ vₜᵀ");
      swapR(r2, r3);
      LC.popIn(tl, [gam], { duration: 0.3 }, "<");
      setBars(DEC, ">");
      tl.addLabel("s3");
      // s4: gated
      var r4 = readout("gated: the decay depends on the token");
      swapR(r3, r4);
      tl.to(gam, { opacity: 0, duration: 0.2 }, "<");
      setBars(GATE, ">");
      tl.addLabel("s4");
      // s5: delta overwrite
      var same = S("path", { d: "M" + tx(5) + " 60C" + tx(5) + " 70 " + tx(1) + " 70 " + tx(1) + " 60", class: "s-orange", "stroke-width": 2 }, svg);
      var keyLbl = S("text", { x: tx(1), y: bBase - 8, class: "t t-sm t-mid t-orange", text: "erased" }, svg);
      keyLbl.style.opacity = 0;
      var r5 = readout("delta rule: t6 reuses t2's key → overwrite");
      swapR(r4, r5);
      tl.to(stG, { opacity: 0, duration: 0.3 }, "<");
      LC.drawIn(tl, same, { duration: 0.5 });
      setBars(DELTA, ">");
      LC.popIn(tl, [keyLbl], { duration: 0.3 });
      tl.addLabel("s5");

      // s6: hybrid stack
      var stack = S("g", {}, svg);
      stack.style.opacity = 0;
      var lw = compact ? 150 : 200, lx = compact ? 16 : mid - 230, ly = 34, lh = 24, lg = 4;
      for (var L = 0; L < 8; L++) {
        var att = L === 3;
        S("rect", { x: lx, y: ly + L * (lh + lg), width: lw, height: lh, rx: 6, class: att ? "f-orange" : "f-blue", "fill-opacity": att ? 1 : 0.8 }, stack);
        S("text", { x: lx + lw / 2, y: ly + L * (lh + lg) + 16.5, class: "t t-sm t-mid t-nohalo", style: "fill:#fff", "font-weight": 600, text: att ? "full attention" : "linear layer" }, stack);
      }
      var tX = lx + lw + (compact ? 14 : 30);
      [["1 of 8 layers keeps", ""], ["a KV cache:", ""], ["exact lookups", "t-orange"], ["7 of 8 keep a fixed", ""], ["state: cheap, lossy", "t-blue"], ["KV memory ≈ 1/8", "t-orange"]].forEach(function (r, k) {
        S("text", { x: tX, y: (k < 3 ? 120 : 150) + k * 20, class: "t t-sm " + r[1], "font-weight": k === 5 ? 650 : 400, text: r[0] }, stack);
      });
      var r6 = readout("hybrid: mostly linear, a little attention");
      swapR(r5, r6);
      tl.to(bars.concat(bLbls, [bTitle, bAxis, keyLbl, same, stG], toks), { opacity: 0, duration: 0.4 }, "<");
      tl.to(stack, { opacity: 1, duration: 0.5 });
      tl.addLabel("s6");
      return tl;
    }
  };
})();
