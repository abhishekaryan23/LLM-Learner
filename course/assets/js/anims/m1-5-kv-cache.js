/* M1.5: the generation loop, with and without a KV cache.
   Prompt "I sat by the" (4 tokens) → "river" → "bank".
   Work chart (token-passes per step, 5 steps): no cache 4,5,6,7,8 = 30; cache 4,1,1,1,1 = 8.
   Memory: Llama 2 7B, 2·32 layers·32 KV heads·128·2 bytes = 512 KiB/token → 2 GiB at 4,096 tokens.
   Llama 3 8B (GQA, 8 KV heads) = 128 KiB/token. */
(function () {
  var LC = window.LC;
  var TOKS = ["I", "sat", "by", "the", "river", "bank"];

  LC.anims["m1-5-kv-cache"] = {
    title: "Generating text, with and without a KV cache",
    steps: [
      "Generation is a loop. The model reads the prompt “I sat by the” and its last position predicts the next token: <strong>river</strong>.",
      "Now append “river” and run again. Without a cache the model recomputes queries, keys and values for <strong>all 5 tokens</strong> in every layer, though only the last position's prediction is used.",
      "But earlier tokens can't see later ones (causal mask), so their <strong>keys and values never change</strong>. Recomputing them is pure waste. Keep them instead: that's the <strong>KV cache</strong>.",
      "With the cache, each step runs only the <strong>newest token</strong>: compute its $q$, $k$, $v$, append $k$ and $v$ to the cache, and let $q$ attend over every cached key.",
      "Next step: <strong>bank</strong>. Again one new column: one token's worth of work per step, while the cache grows by one token's keys and values in every layer.",
      "Total work over 5 steps (first step = the prompt, the <strong>prefill</strong>): 30 token-passes without a cache, 8 with one. For $n$ new tokens that's roughly $n^2/2$ versus $n$.",
      "The price is <strong>memory</strong>: per token, a key and a value per KV head per layer. For Llama 2 7B in 16-bit that's 512 KiB per token, <strong>2 GiB</strong> for one 4,096-token sequence."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 430 } : { w: 640, h: 410 }; },
    build: function (svg, ctx) {
      var S = LC.svg, Wd = ctx.w, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      var boxW = compact ? 48 : 70, gap = compact ? 5 : 10, x0 = compact ? 40 : 110;
      function cx(i) { return x0 + i * (boxW + gap) + boxW / 2; }
      var tokY = 30, tokH = 32, rowH = 18, qY = 78, kY = 104, vY = 128, labX = x0 - 8;
      var cw = boxW - (compact ? 12 : 22);

      // tokens
      var tokG = TOKS.map(function (t, i) {
        var g = S("g", {}, svg), gen = i >= 4;
        S("rect", { x: cx(i) - boxW / 2, y: tokY, width: boxW, height: tokH, rx: 8, class: "f-surface", stroke: gen ? "var(--a-orange)" : "var(--line)", "stroke-width": gen ? 2.2 : 1.5, "stroke-dasharray": gen ? "4 3" : "" }, g);
        S("text", { x: cx(i), y: tokY + 21, class: "t t-sm t-mid", text: t, "font-weight": gen ? 650 : 450 }, g);
        return g;
      });
      tokG[5].style.opacity = 0;
      var promptLbl = S("text", { x: labX, y: tokY + 21, class: "t t-sm t-muted t-end", text: compact ? "" : "tokens" }, svg);

      // q / k / v cells
      function cellRow(y, cls) {
        return TOKS.map(function (_, i) {
          var r = S("rect", { x: cx(i) - cw / 2, y: y, width: cw, height: rowH, rx: 4, class: cls, "fill-opacity": 0.85 }, svg);
          r.style.opacity = 0; return r;
        });
      }
      // cache frame (behind cells)
      var frame = S("rect", { x: cx(0) - boxW / 2 - 3, y: kY - 5, width: 4 * (boxW + gap) - gap + 6, height: vY + rowH - kY + 10, rx: 8, class: "f-surface2", stroke: "var(--a-blue)", "stroke-width": 1.8 }, svg);
      frame.style.opacity = 0;
      var Q = cellRow(qY, "f-orange"), K = cellRow(kY, "f-blue"), V = cellRow(vY, "f-ink");
      var rl = [["q", qY, "t-orange"], ["k", kY, "t-blue"], ["v", vY, ""]].map(function (r) {
        var t = S("text", { x: labX, y: r[1] + 13, class: "t t-sm t-end " + r[2], text: compact ? r[0] : (r[0] === "q" ? "query" : r[0] === "k" ? "key" : "value"), "font-weight": 600 }, svg);
        t.style.opacity = 0; return t;
      });
      var cacheLbl = S("text", { x: cx(0) - boxW / 2, y: vY + rowH + 24, class: "t t-sm t-blue", text: "KV cache", "font-weight": 650 }, svg);
      cacheLbl.style.opacity = 0;
      var readLbl = S("text", { x: cx(4) - cw / 2 - 8, y: qY + 13, class: "t t-sm t-end t-orange", text: compact ? "new q reads all k" : "the new query attends over every cached key" }, svg);
      readLbl.style.opacity = 0;
      var readLbl2 = S("text", { x: cx(5) - cw / 2 - 8, y: qY + 13, class: "t t-sm t-end t-orange", text: compact ? "new q reads all k" : "the new query attends over every cached key" }, svg);
      readLbl2.style.opacity = 0;

      // work line
      var workY = compact ? 200 : 196;
      function workText(s) { var t = S("text", { x: Wd / 2, y: workY, class: "t t-mid", text: s, "font-weight": 600 }, svg); t.style.opacity = 0; return t; }
      var w0 = workText(compact ? "prompt in → next token “river”" : "prompt in, next token out: “river”");
      w0.style.opacity = 1;
      var w1 = workText(compact ? "no cache: redo all 5 tokens" : "without a cache: this step recomputes all 5 tokens");
      var w2 = workText(compact ? "old k, v never change → keep" : "old keys and values never change: keep them");
      var w3 = workText(compact ? "with cache: 1 token this step" : "with a cache: this step computes just 1 token");
      var w4 = workText(compact ? "again 1 token; cache holds 6" : "again just 1 token; the cache now holds 6");
      tl.addLabel("s0", 0);

      // s1: recompute everything for 5 tokens
      tl.to(w0, { opacity: 0, duration: 0.2 }, "+=0.01");
      tl.to(rl, { opacity: 1, duration: 0.3 });
      [0, 1, 2, 3, 4].forEach(function (i) { tl.to([Q[i], K[i], V[i]], { opacity: 1, duration: 0.25 }, i ? "<0.12" : undefined); });
      tl.to(w1, { opacity: 1, duration: 0.3 });
      tl.addLabel("s1");

      // s2: keep old k, v in a cache
      tl.to([w1].concat(Q.slice(0, 4)), { opacity: 0, duration: 0.3 });
      tl.to([frame, cacheLbl], { opacity: 1, duration: 0.4 });
      tl.to(w2, { opacity: 1, duration: 0.3 });
      tl.addLabel("s2");

      // s3: newest token only, appended to the cache
      tl.to(w2, { opacity: 0, duration: 0.2 });
      tl.to([Q[4], K[4], V[4]], { opacity: 0.15, duration: 0.25 });
      tl.to(frame, { attr: { width: 5 * (boxW + gap) - gap + 6 }, duration: 0.5 });
      tl.to([Q[4], K[4], V[4]], { opacity: 1, duration: 0.3 });
      tl.to([readLbl, w3], { opacity: 1, duration: 0.3 });
      tl.addLabel("s3");

      // s4: next token "bank"
      tl.to([w3, readLbl, Q[4]], { opacity: 0, duration: 0.25 });
      tl.to(tokG[5], { opacity: 1, duration: 0.3 });
      tl.to(frame, { attr: { width: 6 * (boxW + gap) - gap + 6 }, duration: 0.5 });
      tl.to([Q[5], K[5], V[5]], { opacity: 1, duration: 0.3 });
      tl.to([readLbl2, w4], { opacity: 1, duration: 0.3 });
      tl.addLabel("s4");

      // s5: work chart
      var chart = S("g", {}, svg); chart.style.opacity = 0;
      var NO = [4, 5, 6, 7, 8], YES = [4, 1, 1, 1, 1];
      var cbase = compact ? 362 : 352, cmax = compact ? 112 : 104, unit = cmax / 8;
      var gx0 = compact ? 58 : 150, gw = compact ? 58 : 80, bw = compact ? 18 : 24;
      S("text", { x: compact ? 4 : gx0 - 40, y: cbase - cmax - 18, class: "t t-sm", text: "token-passes per step", "font-weight": 600 }, chart);
      S("line", { x1: gx0 - 8, x2: gx0 + 5 * gw - 10, y1: cbase, y2: cbase, class: "s-axis" }, chart);
      var barEls = [];
      NO.forEach(function (v, i) {
        var x = gx0 + i * gw;
        barEls.push([S("rect", { x: x, y: cbase, width: bw, height: 0, rx: 2, class: "f-faint" }, chart), v]);
        barEls.push([S("rect", { x: x + bw + 3, y: cbase, width: bw, height: 0, rx: 2, class: "f-orange" }, chart), YES[i]]);
        S("text", { x: x + bw + 1.5, y: cbase + 17, class: "t t-sm t-mid t-muted", text: i ? "step " + (i + 1) : "prefill" }, chart);
      });
      var legX = compact ? 58 : gx0 + 40, legY = cbase + (compact ? 46 : 42), legD = compact ? 130 : 180;
      S("rect", { x: legX, y: legY - 10, width: 12, height: 12, rx: 2, class: "f-faint" }, chart);
      S("text", { x: legX + 18, y: legY, class: "t t-sm", text: compact ? "no cache: 30" : "no cache: 30 in total" }, chart);
      S("rect", { x: legX + legD, y: legY - 10, width: 12, height: 12, rx: 2, class: "f-orange" }, chart);
      S("text", { x: legX + legD + 18, y: legY, class: "t t-sm", text: compact ? "KV cache: 8" : "KV cache: 8 in total" }, chart);
      tl.to([w4, readLbl2], { opacity: 0, duration: 0.25 });
      tl.to(chart, { opacity: 1, duration: 0.3 });
      barEls.forEach(function (b, i) { tl.to(b[0], { attr: { y: cbase - b[1] * unit, height: b[1] * unit }, duration: 0.35 }, i ? "<0.06" : undefined); });
      tl.addLabel("s5");

      // s6: memory
      var mem = S("g", {}, svg); mem.style.opacity = 0;
      var my = compact ? 232 : 228;
      var mlines = compact
        ? [["bytes per token =", 600], ["2 × layers × kv_heads × d_head × bytes", 400], ["Llama 2 7B: 2×32×32×128×2 = 512 KiB", 400], ["× 4,096 tokens = 2 GiB per sequence", 650], ["Llama 3 8B (GQA, 8 KV heads):", 400], ["128 KiB per token, 4× smaller", 400]]
        : [["KV cache bytes per token = 2 × layers × kv_heads × d_head × bytes", 600], ["Llama 2 7B: 2 × 32 × 32 × 128 × 2 bytes = 512 KiB per token", 400], ["× 4,096 tokens = 2 GiB for one sequence (weights are ≈ 13.5 GB)", 650], ["Llama 3 8B with GQA (8 KV heads): 128 KiB per token, 4× smaller", 400]];
      mlines.forEach(function (l, i) { S("text", { x: Wd / 2, y: my + i * (compact ? 26 : 30), class: "t t-sm t-mid" + (l[1] === 400 ? " t-muted" : ""), text: l[0], "font-weight": l[1] }, mem); });
      tl.to(chart, { opacity: 0, duration: 0.3 });
      tl.to(mem, { opacity: 1, duration: 0.4 });
      tl.addLabel("s6");
      return tl;
    }
  };
})();
