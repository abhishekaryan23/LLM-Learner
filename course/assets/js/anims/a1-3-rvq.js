/* A1.3: residual vector quantization in 2-D, three stages of 16-entry codebooks.
   Stage k's codebook is the grid {−0.75, −0.25, 0.25, 0.75}² scaled by 4^−(k−1).
   x = (0.62, −0.41): picks (0.75,−0.25), (−0.1875,−0.1875), (0.046875, 0.015625) (indices #7, #0, #11 as numbered below);
   residual norms 0.743 → 0.206 → 0.064 → 0.016. */
(function () {
  var LC = window.LC;
  var G = [-0.75, -0.25, 0.25, 0.75];
  var X = [0.62, -0.41];
  function stages() {
    var r = X.slice(), out = [];
    for (var s = 0; s < 3; s++) {
      var sc = Math.pow(0.25, s), best = null;
      G.forEach(function (gy, j) { G.forEach(function (gx, i) {
        var c = [gx * sc, gy * sc], d = (r[0] - c[0]) * (r[0] - c[0]) + (r[1] - c[1]) * (r[1] - c[1]);
        if (!best || d < best.d) best = { c: c, d: d, idx: j * 4 + i };
      }); });
      out.push({ scale: sc, input: r.slice(), pick: best.c, idx: best.idx, res: [r[0] - best.c[0], r[1] - best.c[1]] });
      r = out[s].res;
    }
    return out;
  }
  var ST = stages();
  function norm(v) { return Math.sqrt(v[0] * v[0] + v[1] * v[1]); }
  var NORMS = [norm(X)].concat(ST.map(function (s) { return norm(s.res); }));

  LC.anims["a1-3-rvq"] = {
    title: "Residual VQ: each codebook encodes what's left",
    steps: [
      "The encoder outputs one vector per frame (real codecs: 128 numbers; here 2, so we can draw it). The <strong>orange dot</strong> is the vector; blue dots are <strong>codebook 1</strong>'s 16 entries.",
      "Stage 1: pick the <strong>nearest entry</strong> and send its index (16 entries = 4 bits). The orange line is what it missed: the <strong>residual</strong> $r_1 = x - c_1$.",
      "Stage 2 quantizes the <em>residual</em> with its own codebook. Its entries are 4× smaller, so we zoom in 4× to see them. Pick the nearest; a smaller residual remains.",
      "Stage 3 zooms in another 4× and does it again. Each stage adds 4 bits and refines the previous answer.",
      "The leftover error shrinks at every stage: <strong>0.74 → 0.21 → 0.064 → 0.016</strong> here. More codebooks, higher quality, more bits.",
      "The frame is sent as <strong>3 tokens</strong>, one index per codebook. The decoder looks them up and adds them: $\\hat x = c_1 + c_2 + c_3$.",
      "Real codecs do the same with bigger codebooks. EnCodec at 6 kbps: <strong>8 codebooks × 10 bits × 75 frames/s = 6,000 bit/s</strong>, or 600 tokens per second."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 372 } : { w: 640, h: 404 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var pw = compact ? 106 : 150, gap = compact ? 11 : 30;
      var px0 = (W - (3 * pw + 2 * gap)) / 2, py = compact ? 52 : 46;
      var tl = gsap.timeline();
      var panels = [];

      S("text", { x: px0, y: 16, class: "t t-sm t-muted", text: compact ? "one frame vector, 3 codebooks" : "one frame vector, quantized by 3 codebooks in turn" }, svg);

      ST.forEach(function (st, k) {
        var g = S("g", {}, svg), x0 = px0 + k * (pw + gap);
        var half = st.scale * 1.0; // panel shows [−scale, scale]²
        function mx(v) { return x0 + (v / half + 1) / 2 * pw; }
        function my(v) { return py + (1 - (v / half + 1) / 2) * pw; }
        S("rect", { x: x0, y: py, width: pw, height: pw, rx: 6, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.2 }, g);
        S("line", { x1: mx(0), x2: mx(0), y1: py, y2: py + pw, class: "s-grid" }, g);
        S("line", { x1: x0, x2: x0 + pw, y1: my(0), y2: my(0), class: "s-grid" }, g);
        S("text", { x: x0, y: py - 10, class: "t t-sm", text: k === 0 ? "codebook 1" : (compact ? "cb " + (k + 1) + " · ×" + Math.pow(4, k) : "codebook " + (k + 1) + " · zoom ×" + Math.pow(4, k)) }, g);
        var dots = [];
        G.forEach(function (gy) { G.forEach(function (gx) { dots.push(S("circle", { cx: mx(gx * st.scale), cy: my(gy * st.scale), r: compact ? 3.5 : 4.5, class: "f-blue", opacity: 0.75 }, g)); }); });
        var pick = S("circle", { cx: mx(st.pick[0]), cy: my(st.pick[1]), r: compact ? 8 : 10, class: "f-none", stroke: "var(--a-blue)", "stroke-width": 2.5 }, g);
        var res = S("path", { d: "M" + mx(st.pick[0]) + " " + my(st.pick[1]) + "L" + mx(st.input[0]) + " " + my(st.input[1]), class: "s-orange", "stroke-width": 2.5 }, g);
        var pt = S("circle", { cx: mx(st.input[0]), cy: my(st.input[1]), r: compact ? 5 : 6, class: "f-orange", stroke: "var(--a-paper)", "stroke-width": 1.5 }, g);
        var idx = S("text", { x: x0 + pw / 2, y: py + pw + 20, class: "t t-sm t-mono t-mid", text: "#" + st.idx + " = " + ("000" + st.idx.toString(2)).slice(-4) }, g);
        panels.push({ g: g, pick: pick, res: res, pt: pt, idx: idx });
      });

      // s0: panel 1 with x and codebook
      panels[1].g.style.opacity = 0; panels[2].g.style.opacity = 0;
      [panels[0].pick, panels[0].idx].forEach(function (e) { e.style.opacity = 0; });
      tl.addLabel("s0", 0);

      function stage(k) {
        var p = panels[k];
        if (k > 0) {
          [p.pick, p.idx].forEach(function (e) { e.style.opacity = 0; });
          tl.to(p.g, { opacity: 1, duration: 0.4 });
        }
        LC.popIn(tl, p.pick, { duration: 0.35 });
        LC.drawIn(tl, p.res, { duration: 0.5 });
        LC.popIn(tl, p.idx, { duration: 0.3 });
      }
      stage(0); tl.addLabel("s1");
      stage(1); tl.addLabel("s2");
      stage(2); tl.addLabel("s3");

      // s4: residual bars
      var by = py + pw + (compact ? 56 : 60), bh = compact ? 60 : 58;
      var bars = S("g", {}, svg);
      var lbls = compact ? ["|x|", "after 1", "after 2", "after 3"] : ["|x| (start)", "after stage 1", "after stage 2", "after stage 3"];
      var bw = compact ? 50 : 70, bgap = compact ? 30 : 60, bx0 = (W - (4 * bw + 3 * bgap)) / 2;
      S("text", { x: px0, y: by - 12, class: "t t-sm t-muted", text: "size of what's left to encode" }, bars);
      var barBase = by + 12 + bh;
      S("line", { x1: bx0 - 6, x2: bx0 + 4 * bw + 3 * bgap + 6, y1: barBase, y2: barBase, class: "s-grid" }, bars);
      var rects = NORMS.map(function (n, i) {
        var h = Math.max(2, n / NORMS[0] * bh), x = bx0 + i * (bw + bgap);
        var r = S("rect", { x: x, y: barBase - h, width: bw, height: h, rx: 3, class: i ? "f-orange" : "f-ink" }, bars);
        S("text", { x: x + bw / 2, y: barBase - h - 6, class: "t t-sm t-mono t-mid", text: n < 0.1 ? n.toFixed(3) : n.toFixed(2) }, bars);
        S("text", { x: x + bw / 2, y: barBase + 16, class: "t t-sm t-mid t-muted", text: lbls[i] }, bars);
        return r;
      });
      LC.popIn(tl, bars, { duration: 0.5 });
      tl.addLabel("s4");

      // s5: tokens
      var tokY = barBase + (compact ? 44 : 40);
      var tok = S("text", { x: W / 2, y: tokY, class: "t t-mid", text: "" }, svg);
      tok.textContent = compact ? "tokens: [" + ST.map(function (s) { return s.idx; }).join(", ") + "] = 3 × 4 bits" : "this frame → tokens [" + ST.map(function (s) { return s.idx; }).join(", ") + "]: 3 codebooks × 4 bits = 12 bits";
      LC.popIn(tl, tok, { duration: 0.4 });
      tl.addLabel("s5");

      // s6: real codec
      var real = S("text", { x: W / 2, y: tokY + 24, class: "t t-mid t-orange", text: compact ? "EnCodec: 8 × 10 bits × 75/s = 6 kbps" : "EnCodec 6 kbps: 8 codebooks × 10 bits × 75 frames/s = 6,000 bit/s" }, svg);
      LC.popIn(tl, real, { duration: 0.4 });
      tl.addLabel("s6");
      return tl;
    }
  };
})();
