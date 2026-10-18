/* VD.4: how a video-LLM reads a long video, and the token budget.
   1 h at 24 fps = 86,400 frames. Sample frames → image encoder (ViT at 336 px, 14 px
   patches: 24 × 24 = 576 tokens per frame) → 2 × 2 pooling (144 tokens) → projector →
   LLM with the question. Budget: 1 h at 1 fps = 3,600 frames × 144 = 518,400 tokens,
   about 4.05× a 128,000-token context. 1 frame per 10 s: 360 × 144 = 51,840 tokens. */
(function () {
  var LC = window.LC;
  var NTH = 8, G = 24, CTX = 128000, NEED = 3600 * 144, SPARSE = 360 * 144;
  var seed = 11;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  // a smooth-ish "image": a bright blob plus noise
  var IMG = [];
  for (var r = 0; r < G; r++) for (var c = 0; c < G; c++) {
    var d = Math.hypot(r - 9, c - 14) / 10;
    IMG.push(Math.max(0.08, Math.min(1, 0.9 * Math.exp(-d * d) + 0.25 * rnd())));
  }

  LC.anims["vd-4-videollm"] = {
    title: "How a video-LLM reads an hour of video",
    steps: [
      "The input: a <strong>1-hour video</strong>. At 24 fps that is 86,400 frames, far too many to read one by one.",
      "So a video-LLM <strong>samples</strong> frames: uniformly, or at a fixed rate such as 1 frame per second (8 are drawn here). Timestamps go along, so the model knows <em>when</em> each frame was.",
      "Each frame goes through the <strong>image encoder</strong> (as in MM.1). A ViT at 336 × 336 pixels with 14-pixel patches gives 24 × 24 = <strong>576 tokens</strong> per frame.",
      "<strong>Pool</strong> neighbouring tokens (a 2 × 2 average) to cut each frame to <strong>144 tokens</strong>, keeping the coarse picture. Merging similar tokens is another way to shrink.",
      "A projector maps the frame tokens into the LLM's embedding space. They go in front of the question, and the LLM answers as usual.",
      "<strong>The budget:</strong> 1 hour at 1 frame per second is 3,600 frames × 144 = 518,400 tokens, about 4× a 128K-token context window.",
      "Sample sparser, 1 frame every 10 s: 360 × 144 = 51,840 tokens, which fits. But a 3-second event can now fall between samples, which is why long-video systems add smarter frame selection and memory."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 396 } : { w: 640, h: 406 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact", W = ctx.w;
      var L = compact
        ? { left: 16, right: 344, lblY: 34, barY: 42, barH: 18, thY: 80, thW: 36, thH: 27, encLblY: 132, gridY: 140, cellA: 4, cellB: 8, gxA: 28, gxB: 236, seqLblY: 262, seqY: 270, llmY: 306, budLblY: 334, budY: 342, budValY: 388 }
        : { left: 40, right: 600, lblY: 24, barY: 32, barH: 20, thY: 72, thW: 60, thH: 40, encLblY: 140, gridY: 148, cellA: 4, cellB: 8, gxA: 130, gxB: 414, seqLblY: 272, seqY: 280, llmY: 316, budLblY: 344, budY: 352, budValY: 398 };
      var span = L.right - L.left;
      var tl = gsap.timeline();

      // ---- s0: the long video ----
      S("text", { x: L.left, y: L.lblY, class: "t t-sm", text: "a 1-hour video", "font-weight": 600 }, svg);
      S("text", { x: L.right, y: L.lblY, class: "t t-sm t-muted t-end", text: "86,400 frames at 24 fps" }, svg);
      S("rect", { x: L.left, y: L.barY, width: span, height: L.barH, rx: 4, class: "f-surface2", stroke: "var(--line)", "stroke-width": 1 }, svg);
      var ticks = "";
      for (var x = L.left + 6; x < L.right - 2; x += 6) ticks += "M" + x + " " + (L.barY + 3) + "v" + (L.barH - 6);
      S("path", { d: ticks, class: "s-grid" }, svg);
      tl.addLabel("s0", 0);

      // ---- s1: sample frames ----
      var thGap = (span - NTH * L.thW) / (NTH - 1);
      var marks = [], thumbs = [];
      for (var i = 0; i < NTH; i++) {
        var tx = L.left + i * (L.thW + thGap), cx = tx + L.thW / 2;
        var m = S("g", {}, svg);
        S("rect", { x: cx - 1.5, y: L.barY - 2, width: 3, height: L.barH + 4, class: "f-orange" }, m);
        S("path", { d: "M" + cx + " " + (L.barY + L.barH + 3) + "V" + (L.thY - 3), class: "s-faint", "stroke-width": 1.5 }, m);
        marks.push(m);
        var t = S("g", {}, svg);
        S("rect", { x: tx, y: L.thY, width: L.thW, height: L.thH, rx: 3, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.2 }, t);
        S("rect", { x: tx + 0.6, y: L.thY + L.thH * 0.62, width: L.thW - 1.2, height: L.thH * 0.38 - 0.6, class: "f-faint" }, t);
        S("circle", { cx: tx + L.thW * (0.25 + 0.5 * ((i * 37) % 8) / 7), cy: L.thY + L.thH * 0.45, r: L.thH * 0.15, class: i === 3 ? "f-orange" : "f-blue", "fill-opacity": 0.8 }, t);
        thumbs.push(t);
      }
      LC.popIn(tl, marks, { duration: 0.25, stagger: 0.05 }, "+=0.01");
      LC.popIn(tl, thumbs, { duration: 0.25, stagger: 0.05 }, "-=0.2");
      tl.addLabel("s1");

      // ---- s2: one frame → 576 tokens ----
      var gA = S("g", {}, svg), gB = S("g", {}, svg);
      S("text", { x: L.gxA + G * L.cellA / 2, y: L.encLblY, class: "t t-sm t-mid", text: "576 tokens / frame", "font-weight": 600 }, gA);
      for (r = 0; r < G; r++) for (c = 0; c < G; c++) {
        S("rect", { x: L.gxA + c * L.cellA, y: L.gridY + r * L.cellA, width: L.cellA - 0.6, height: L.cellA - 0.6, class: "f-blue", "fill-opacity": IMG[r * G + c].toFixed(2) }, gA);
      }
      var hl = S("rect", { x: L.left + 3 * (L.thW + thGap) - 2, y: L.thY - 2, width: L.thW + 4, height: L.thH + 4, rx: 4, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 2.5 }, svg);
      LC.popIn(tl, hl, { duration: 0.3 });
      LC.popIn(tl, gA, { duration: 0.5 });
      tl.addLabel("s2");

      // ---- s3: 2 × 2 pooling → 144 tokens ----
      S("text", { x: L.gxB + (G / 2) * L.cellB / 2, y: L.encLblY, class: "t t-sm t-mid", text: "144 after 2 × 2 pooling", "font-weight": 600 }, gB);
      for (r = 0; r < G / 2; r++) for (c = 0; c < G / 2; c++) {
        var v = (IMG[2 * r * G + 2 * c] + IMG[2 * r * G + 2 * c + 1] + IMG[(2 * r + 1) * G + 2 * c] + IMG[(2 * r + 1) * G + 2 * c + 1]) / 4;
        S("rect", { x: L.gxB + c * L.cellB, y: L.gridY + r * L.cellB, width: L.cellB - 1, height: L.cellB - 1, class: "f-blue", "fill-opacity": v.toFixed(2) }, gB);
      }
      var midY = L.gridY + G * L.cellA / 2, ax0 = L.gxA + G * L.cellA + 8, ax1 = L.gxB - 8;
      var arr = S("path", { d: "M" + ax0 + " " + midY + "H" + ax1 + "M" + (ax1 - 7) + " " + (midY - 6) + "L" + ax1 + " " + midY + "L" + (ax1 - 7) + " " + (midY + 6), class: "s-ink", "stroke-width": 2 }, svg);
      LC.drawIn(tl, arr, { duration: 0.5 });
      LC.popIn(tl, gB, { duration: 0.5 });
      tl.addLabel("s3");

      // ---- s4: the LLM input sequence ----
      var seqLbl = S("text", { x: L.left, y: L.seqLblY, class: "t t-sm", text: compact ? "LLM input: 8 × 144 frame tokens + question" : "LLM input: 8 frames × 144 tokens, then the question", "font-weight": 600 }, svg);
      var qW = span * 0.14, segW = (span - qW - 4) / NTH, segs = [];
      for (i = 0; i < NTH; i++) segs.push(S("rect", { x: L.left + i * segW, y: L.seqY, width: segW - 2, height: 16, rx: 2, class: "f-blue", "fill-opacity": i % 2 ? 0.55 : 0.8 }, svg));
      var qRect = S("rect", { x: L.right - qW, y: L.seqY, width: qW, height: 16, rx: 2, class: "f-ink", "fill-opacity": 0.8 }, svg);
      var llm = S("text", { x: W / 2, y: L.llmY, class: "t t-sm t-mid", text: compact ? "→ LLM → “The chef adds salt at 12:40.”" : "→ LLM → “The chef adds the salt at about 12:40.”" }, svg);
      LC.popIn(tl, seqLbl, { duration: 0.3 });
      LC.popIn(tl, segs.concat([qRect]), { duration: 0.2, stagger: 0.04 }, "<");
      LC.popIn(tl, llm, { duration: 0.3 });
      tl.addLabel("s4");

      // ---- s5: the budget ----
      var sc = span / NEED, ctxW = CTX * sc;
      var budLbl = S("text", { x: L.left, y: L.budLblY, class: "t t-sm", text: compact ? "1 h at 1 fps vs a 128K context (dashed)" : "1 hour at 1 frame per second vs a 128K-token context (dashed box)", "font-weight": 600 }, svg);
      var need = S("rect", { x: L.left, y: L.budY + 4, width: 0, height: 16, rx: 3, class: "f-orange" }, svg);
      var ctxBox = S("rect", { x: L.left, y: L.budY, width: ctxW, height: 24, rx: 4, class: "f-none", stroke: "var(--a-ink)", "stroke-width": 2, "stroke-dasharray": "5 3" }, svg);
      var val1 = S("text", { x: L.left, y: L.budValY, class: "t t-sm t-mono", text: "518,400 tokens ≈ 4× the context" }, svg);
      var val2 = S("text", { x: L.left, y: L.budValY, class: "t t-sm t-mono", text: compact ? "1 frame / 10 s: 51,840 tokens, fits" : "1 frame every 10 s: 51,840 tokens, fits" }, svg);
      [budLbl, ctxBox, val1, val2].forEach(function (e) { e.style.opacity = 0; });
      LC.popIn(tl, [budLbl, ctxBox], { duration: 0.3 });
      tl.to(need, { attr: { width: span }, duration: 0.8, ease: "power2.out" });
      LC.popIn(tl, val1, { duration: 0.3 });
      tl.addLabel("s5");

      // ---- s6: sparser sampling ----
      tl.to(val1, { opacity: 0, duration: 0.2 });
      var needB = S("rect", { x: L.left, y: L.budY + 4, width: SPARSE * sc, height: 16, rx: 3, class: "f-blue" }, svg);
      needB.style.opacity = 0;
      tl.to(need, { attr: { width: SPARSE * sc }, duration: 0.7, ease: "power2.inOut" });
      tl.to(needB, { opacity: 1, duration: 0.3 });
      LC.popIn(tl, val2, { duration: 0.3 }, "<");
      tl.to(marks.filter(function (_, k) { return k % 2 === 0; }).concat(thumbs.filter(function (_, k) { return k % 2 === 0; })), { opacity: 0.2, duration: 0.3 }, "<");
      tl.addLabel("s6");
      return tl;
    }
  };
})();
