/* A1.5: MusicGen's codebook interleaving. 4 codebooks × 6 frames.
   Flatten: step = 4·(f−1) + k (24 steps). Parallel: step = f (6 steps).
   Delay: codebook k of frame f at step f + k − 1 (6 + 3 = 9 steps). */
(function () {
  var LC = window.LC;
  var K = 4, F = 6;

  LC.anims["a1-5-delay"] = {
    title: "Four codebooks, one Transformer: the delay pattern",
    steps: [
      "MusicGen's codec gives <strong>4 tokens per frame</strong> (codebooks k1–k4) at 50 frames per second. One column per frame; k1 is the coarsest codebook, k4 the finest.",
      "<strong>Flatten:</strong> predict every token one at a time, frame by frame. Numbers show the step at which each token is generated: <strong>4 steps per frame</strong>.",
      "<strong>Parallel:</strong> predict all 4 codebooks of a frame in one step. Only one step per frame, but k2–k4 are guessed <em>without</em> seeing k1 of the same frame.",
      "<strong>Delay:</strong> shift codebook k to the right by k − 1 steps. Each step still emits 4 tokens, but from <strong>different frames</strong>.",
      "Look at step 5: it predicts k1 of frame 5, k2 of frame 4, k3 of frame 3 and k4 of frame 2. Frame 2's k1–k3 were already made at steps 2–4, so <strong>coarse comes before fine</strong>.",
      "For 30 s of music: 1,500 frames. Flattening needs <strong>6,000 steps</strong>; the delay pattern needs <strong>1,503</strong>, while keeping the coarse-to-fine order inside each frame."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 244 } : { w: 640, h: 312 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var cs = compact ? 33 : 52, gap = compact ? 3 : 5, x0 = compact ? 34 : 70, y0 = 62;
      function X(col) { return x0 + col * (cs + gap); }
      function Y(k) { return y0 + k * (cs * 0.8 + gap); }
      var chh = cs * 0.8;
      var tl = gsap.timeline();

      var colHead = S("text", { x: x0, y: 18, class: "t t-sm t-muted", text: "frame →" }, svg);
      var stepHead = S("text", { x: x0, y: 18, class: "t t-sm t-muted", text: "generation step →" }, svg);
      stepHead.style.opacity = 0;
      var frameNums = [], stepNums = [];
      for (var f = 0; f < F; f++) frameNums.push(S("text", { x: X(f) + cs / 2, y: y0 - 10, class: "t t-sm t-muted t-mid", text: f + 1 }, svg));
      for (var s = 0; s < F + K - 1; s++) { var t = S("text", { x: X(s) + cs / 2, y: y0 - 10, class: "t t-sm t-muted t-mid", text: s + 1 }, svg); t.style.opacity = 0; stepNums.push(t); }
      for (var k = 0; k < K; k++) S("text", { x: x0 - 8, y: Y(k) + chh / 2 + 4, class: "t t-sm t-end", text: "k" + (k + 1) }, svg);

      // cells: group per token with rect + label, moved by x for the delay pattern
      var cells = [];
      for (k = 0; k < K; k++) for (f = 0; f < F; f++) {
        var g = S("g", {}, svg);
        S("rect", { x: X(f), y: Y(k), width: cs, height: chh, rx: 5, class: k ? "f-blue" : "f-orange", "fill-opacity": (0.85 - 0.17 * k).toFixed(2) }, g);
        var lbl = S("text", { x: X(f) + cs / 2, y: Y(k) + chh / 2 + 4, class: "t t-sm t-mid t-mono t-nohalo", style: k < 2 ? "fill:#fff" : "", text: "" }, g);
        cells.push({ g: g, lbl: lbl, k: k, f: f, st: { x: 0 } });
      }
      var modeLbl = S("text", { x: 8, y: Y(K) + 26, class: "t", text: "" }, svg);
      var modeSub = S("text", { x: 8, y: Y(K) + 48, class: "t t-sm t-muted", text: "" }, svg);
      function labelState(mode) {
        cells.forEach(function (c) {
          var v = "";
          if (mode === 1) v = c.f * K + c.k + 1;
          else if (mode === 2) v = c.f + 1;
          else if (mode >= 3) v = c.f + c.k + 1;
          c.lbl.textContent = v === "" ? "" : String(v);
        });
        var t = ["", compact ? "flatten: 4 steps per frame" : "flatten: 24 steps for 6 frames (4 per frame)",
          compact ? "parallel: 1 step per frame" : "parallel: 6 steps, but k2–k4 can't see k1",
          compact ? "delay: 6 + 3 = 9 steps" : "delay: 6 + 3 = 9 steps, coarse before fine",
          compact ? "delay: step 5 highlighted" : "delay: step 5 predicts one token from 4 frames",
          compact ? "30 s: 6,000 vs 1,503 steps" : "30 s of music: flatten 6,000 steps · delay 1,503 steps"][mode];
        modeLbl.textContent = t;
        modeSub.textContent = mode === 5 ? (compact ? "1,500 frames × 4 codebooks" : "1,500 frames × 4 codebooks = 6,000 tokens") : (mode === 3 || mode === 4 ? (compact ? "codebook k shifted k − 1 steps" : "codebook k is shifted right by k − 1 steps") : "");
      }
      var state = { m: 0 };
      function apply() { labelState(Math.round(state.m)); }
      labelState(0);
      tl.addLabel("s0", 0);

      function toMode(m) { tl.to(state, { m: m, duration: 0.3, ease: "none", onUpdate: apply }); }
      toMode(1); tl.addLabel("s1");
      toMode(2); tl.addLabel("s2");
      // s3: shift rows
      toMode(3);
      tl.to(frameNums.concat([colHead]), { opacity: 0, duration: 0.3 }, "<");
      tl.to(stepNums.concat([stepHead]), { opacity: 1, duration: 0.3 }, "<");
      cells.forEach(function (c) { if (c.k) tl.to(c.g, { x: c.k * (cs + gap), duration: 0.7, ease: "power2.inOut" }, "<"); });
      tl.addLabel("s3");
      // s4: highlight step 5 column
      var hl = S("rect", { x: X(4) - 3, y: y0 - 3, width: cs + 6, height: K * (chh + gap) - gap + 6, rx: 7, class: "f-none", stroke: "var(--a-ink)", "stroke-width": 2.5 }, svg);
      hl.style.opacity = 0;
      toMode(4);
      tl.to(hl, { opacity: 1, duration: 0.3 }, "<");
      var dim = cells.filter(function (c) { return c.f + c.k !== 4; }).map(function (c) { return c.g; });
      tl.to(dim, { opacity: 0.35, duration: 0.3 }, "<");
      tl.addLabel("s4");
      // s5: totals
      toMode(5);
      tl.to(dim, { opacity: 1, duration: 0.3 }, "<");
      tl.to(hl, { opacity: 0, duration: 0.3 }, "<");
      tl.addLabel("s5");
      return tl;
    }
  };
})();
