/* G1.6: how a diffusion transformer sees a latent (patchify → transformer with adaLN →
   unpatchify), then three ways to generate image tokens: raster autoregression,
   MaskGIT-style parallel unmasking (8 rounds, cosine schedule), and VAR next-scale.
   Grids are drawn 8×8 for legibility; captions give the real sizes. */
(function () {
  var LC = window.LC;
  var N = 8;
  function val(i, j) { // a smooth toy "image": sun top-right, hill bottom-left
    var a = Math.exp(-((i - 5.5) * (i - 5.5) + (j - 1.5) * (j - 1.5)) / 4);
    var b = j > 4 + 1.6 * Math.sin(i / 2.2) ? 0.75 : 0;
    return Math.min(1, 0.12 + a + b);
  }
  function blockVal(i, j, k) { // average of val over the block (i, j) of a k×k map
    var s = N / k, t = 0;
    for (var a = 0; a < s; a++) for (var b = 0; b < s; b++) t += val(i * s + a, j * s + b);
    return t / (s * s);
  }

  LC.anims["g1-6-dit"] = {
    title: "Images as tokens: DiT, then three autoregressive orders",
    steps: [
      "A <strong>diffusion transformer</strong> (DiT) works on the VAE latent, e.g. $32 \\times 32 \\times 4$ for a 256×256 image (drawn here as 8×8).",
      "<strong>Patchify</strong>: cut the latent into $p \\times p$ patches and flatten each into one token. With $p = 2$: $(32/2)^2 = 256$ tokens.",
      "A stack of <strong>transformer blocks</strong> attends over all patches. The time step $t$ and the condition enter through <strong>adaLN</strong>: an MLP turns them into a scale, shift and gate for every block.",
      "<strong>Unpatchify</strong>: each output token becomes a patch again, giving the predicted noise for the whole latent, same shape as the input. Diffusion repeats this for every step.",
      "<strong>Autoregressive</strong> alternative (DALL·E, Parti): turn the image into discrete tokens and predict them <strong>one at a time</strong> in raster order, like text. 64 steps here, 1,024 for DALL·E's 32×32 grid.",
      "<strong>MaskGIT</strong>: start fully masked and predict <em>all</em> tokens in parallel; keep the most confident, re-mask the rest, repeat. 8 rounds instead of one step per token.",
      "<strong>VAR</strong>: predict the image <strong>coarse to fine</strong>, a whole token map per step: 1×1, then 2×2, 4×4, 8×8, each conditioned on the smaller ones."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 350 } : { w: 640, h: 300 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact";
      var G0 = compact ? { x: 20, y: 46, c: 18 } : { x: 20, y: 56, c: 22 };
      var tl = gsap.timeline();
      var gs = N * G0.c;

      // the latent grid (noisy latent: ink cells of random opacity)
      var r = LC.g1.rng(66), cells = [], fills = [], outs = [];
      var gridG = S("g", {}, svg);
      for (var j = 0; j < N; j++) for (var i = 0; i < N; i++) {
        var x = G0.x + i * G0.c, y = G0.y + j * G0.c;
        cells.push(S("rect", { x: x + 1, y: y + 1, width: G0.c - 2, height: G0.c - 2, rx: 2, class: "f-ink", "fill-opacity": (0.08 + 0.5 * r()).toFixed(2) }, gridG));
        fills.push(S("rect", { x: x + 1, y: y + 1, width: G0.c - 2, height: G0.c - 2, rx: 2, class: "f-blue", "fill-opacity": val(i, j).toFixed(2) }, svg));
        outs.push(S("rect", { x: x + 1, y: y + 1, width: G0.c - 2, height: G0.c - 2, rx: 2, class: "f-orange", "fill-opacity": (0.15 + 0.6 * r()).toFixed(2) }, svg));
      }
      fills.forEach(function (f) { f.style.opacity = 0; });
      outs.forEach(function (f) { f.style.opacity = 0; });
      var frameR = S("rect", { x: G0.x - 2, y: G0.y - 2, width: gs + 4, height: gs + 4, rx: 4, class: "f-none", stroke: "var(--line)", "stroke-width": 1.5 }, svg);
      var head = function (s, cls) { var t = S("text", { x: G0.x, y: G0.y - 12, class: "t t-sm " + (cls || ""), text: s }, svg); t.style.opacity = 0; return t; };
      var h0 = head("noisy latent");
      h0.style.opacity = 1;
      var info = compact ? { x: 186, y: 76 } : { x: 222, y: 236 };
      function infoT(lines, cls) {
        var g = S("g", {}, svg);
        lines.forEach(function (s, k) { S("text", { x: info.x, y: info.y + 18 * k, class: "t t-sm " + (cls || ""), text: s }, g); });
        g.style.opacity = 0; return g;
      }
      var i0 = infoT(compact ? ["32 × 32 × 4 latent", "(drawn as 8 × 8)"] : ["32 × 32 × 4 latent for a 256 × 256 image (drawn as 8 × 8)"], "t-muted");
      i0.style.opacity = 1;
      tl.addLabel("s0", 0);

      // s1: patch outlines + token row
      var patches = S("g", {}, svg);
      for (var pj = 0; pj < N / 2; pj++) for (var pi = 0; pi < N / 2; pi++)
        S("rect", { x: G0.x + pi * 2 * G0.c, y: G0.y + pj * 2 * G0.c, width: 2 * G0.c, height: 2 * G0.c, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 2 }, patches);
      var tok = compact ? { x: 12, y: 226, w: 18, gap: 3 } : { x: 236, y: 64, w: 20, gap: 4 };
      var tokens = S("g", {}, svg);
      for (var k = 0; k < 16; k++) {
        S("rect", { x: tok.x + k * (tok.w + tok.gap), y: tok.y, width: tok.w, height: tok.w, rx: 3, class: "f-surface", stroke: "var(--a-orange)", "stroke-width": 1.5 }, tokens);
        S("rect", { x: tok.x + k * (tok.w + tok.gap) + 4, y: tok.y + 4, width: tok.w - 8, height: tok.w - 8, rx: 1, class: "f-ink", "fill-opacity": (0.15 + 0.5 * r()).toFixed(2) }, tokens);
      }
      var tokL = S("text", { x: compact ? 180 : tok.x, y: compact ? tok.y - 10 : tok.y - 12, class: "t t-sm" + (compact ? " t-mid" : ""), text: compact ? "16 tokens here · 256 with p = 2" : "patch tokens: 16 here, 256 for 32 × 32 with p = 2" }, svg);
      var patA = compact ? S("path", { d: "M6 " + (G0.y + gs / 2) + "V" + (tok.y + 9) + "H10", class: "s-ink", "stroke-width": 2 }, svg) : S("path", { d: "M" + (G0.x + gs + 8) + " " + (tok.y + 10) + "H" + (tok.x - 8), class: "s-ink", "stroke-width": 2 }, svg);
      tl.to(i0, { opacity: 0, duration: 0.2 }, "+=0.01");
      LC.popIn(tl, patches, { duration: 0.4 });
      LC.drawIn(tl, patA, { duration: 0.4 });
      LC.popIn(tl, [tokens, tokL], { duration: 0.4 });
      tl.addLabel("s1");

      // s2: transformer box + adaLN inputs
      var bx = compact ? { x: 40, y: 256, w: 280, h: 42 } : { x: 260, y: 112, w: 340, h: 52 };
      var tbox = S("g", {}, svg);
      S("rect", { x: bx.x, y: bx.y, width: bx.w, height: bx.h, rx: 10, class: "f-surface", stroke: "var(--a-ink)", "stroke-width": 1.5 }, tbox);
      S("text", { x: bx.x + bx.w / 2, y: bx.y + bx.h / 2 + 5, class: "t t-sm t-mid", "font-weight": 650, text: "DiT blocks × N (self-attention + MLP)" }, tbox);
      var ay = bx.y + bx.h;
      var ada = S("g", {}, svg);
      S("path", { d: "M" + (bx.x + bx.w / 2) + " " + (ay + 22) + "V" + (ay + 4) + "M" + (bx.x + bx.w / 2 - 6) + " " + (ay + 11) + "L" + (bx.x + bx.w / 2) + " " + (ay + 4) + "L" + (bx.x + bx.w / 2 + 6) + " " + (ay + 11), class: "s-orange", "stroke-width": 2 }, ada);
      S("text", { x: bx.x + bx.w / 2, y: ay + 40, class: "t t-sm t-mid t-orange", text: "adaLN: time t + condition → scale, shift, gate" }, ada);
      LC.popIn(tl, tbox, { duration: 0.4 });
      LC.popIn(tl, ada, { duration: 0.4 });
      tl.addLabel("s2");

      // s3: unpatchify back to a grid of predicted noise
      var unA = compact ? S("path", { d: "M" + (bx.x + bx.w) + " " + (bx.y + bx.h / 2) + "H352V" + (G0.y + gs / 2) + "H" + (G0.x + gs + 6), class: "s-ink", "stroke-width": 2 }, svg)
        : S("path", { d: "M" + bx.x + " " + (bx.y + bx.h / 2) + "H" + (G0.x + gs + 8), class: "s-ink", "stroke-width": 2 }, svg);
      var h3 = head("predicted noise (same shape)", "t-orange");
      tl.to([h0, patches], { opacity: 0, duration: 0.25 });
      LC.drawIn(tl, unA, { duration: 0.5 });
      LC.popIn(tl, outs.concat([h3]), { duration: 0.4 });
      tl.addLabel("s3");

      // s4: raster autoregression
      var counter = S("text", { x: info.x, y: compact ? info.y : G0.y + gs / 2, class: "t t-mono", text: "" }, svg);
      counter.style.opacity = 0;
      var cA = S("text", { x: info.x, y: (compact ? info.y : G0.y + gs / 2) + 20, class: "t t-sm t-muted", text: "" }, svg);
      var h4 = head("next-token, raster order", "t-blue");
      var st = { n: 0, m: 0 };
      var ORDER = [], rr = LC.g1.rng(9);
      for (k = 0; k < N * N; k++) ORDER.push(k);
      for (k = ORDER.length - 1; k > 0; k--) { var q = Math.floor(rr() * (k + 1)), tmp = ORDER[k]; ORDER[k] = ORDER[q]; ORDER[q] = tmp; }
      var ROUNDS = [0];
      for (k = 1; k <= 8; k++) ROUNDS.push(Math.round(64 - 64 * Math.cos(Math.PI / 2 * k / 8)));
      function renderAR() {
        var n = Math.round(st.n);
        for (var c = 0; c < N * N; c++) fills[c].style.opacity = c < n ? 1 : 0;
        counter.textContent = "step " + n + " / 64";
        cA.textContent = "one token per step";
      }
      function renderMG() {
        var m = Math.round(st.m), shown = ROUNDS[m];
        for (var c = 0; c < N * N; c++) fills[ORDER[c]].style.opacity = c < shown ? 1 : 0;
        counter.textContent = "round " + m + " / 8";
        cA.textContent = shown + " of 64 tokens kept";
      }
      tl.to([tokens, tokL, patA, tbox, ada, unA, h3], { opacity: 0, duration: 0.3 });
      tl.to(outs.concat(cells), { opacity: 0, duration: 0.3 }, "<");
      LC.popIn(tl, [h4, counter, cA], { duration: 0.3 });
      tl.to(st, { n: 64, duration: 2.0, ease: "none", onUpdate: renderAR });
      tl.addLabel("s4");

      // s5: MaskGIT
      var h5 = head("MaskGIT: parallel, most confident first", "t-blue");
      tl.to(h4, { opacity: 0, duration: 0.2 });
      tl.to(st, { m: 0, duration: 0.01, onUpdate: renderMG });
      LC.popIn(tl, h5, { duration: 0.3 });
      tl.to(st, { m: 8, duration: 1.6, ease: "none", onUpdate: renderMG });
      tl.addLabel("s5");

      // s6: VAR next-scale
      var h6 = S("text", { x: compact ? 14 : 20, y: compact ? 36 : 46, class: "t t-sm t-blue", text: "VAR: next-scale prediction" }, svg);
      h6.style.opacity = 0;
      var var_ = S("g", {}, svg), sz = compact ? 70 : 104, gap = compact ? 18 : 40, vx = compact ? 12 : 20, vy = compact ? 60 : 76;
      [1, 2, 4, 8].forEach(function (kk, idx) {
        var x0 = vx + idx * (sz + gap), c = sz / kk;
        for (var a = 0; a < kk; a++) for (var b = 0; b < kk; b++)
          S("rect", { x: x0 + a * c + 0.5, y: vy + b * c + 0.5, width: c - 1, height: c - 1, rx: kk > 4 ? 1 : 3, class: "f-blue", "fill-opacity": blockVal(a, b, kk).toFixed(2) }, var_);
        S("text", { x: x0 + sz / 2, y: vy + sz + 20, class: "t t-sm t-mid", text: kk + " × " + kk }, var_);
        if (idx < 3) S("path", { d: "M" + (x0 + sz + 3) + " " + (vy + sz / 2) + "H" + (x0 + sz + gap - 3) + "M" + (x0 + sz + gap - 9) + " " + (vy + sz / 2 - 5) + "L" + (x0 + sz + gap - 3) + " " + (vy + sz / 2) + "L" + (x0 + sz + gap - 9) + " " + (vy + sz / 2 + 5), class: "s-ink", "stroke-width": 1.8 }, var_);
      });
      var vNote = S("text", { x: compact ? 180 : 320, y: vy + sz + 52, class: "t t-sm t-mid t-muted", text: "4 steps here, each predicting a whole map" }, svg);
      vNote.style.opacity = 0;
      tl.to(fills.concat([h5, counter, cA, frameR]), { opacity: 0, duration: 0.3 });
      LC.popIn(tl, [h6], { duration: 0.3 });
      LC.popIn(tl, var_, { duration: 0.6 });
      LC.popIn(tl, vNote, { duration: 0.3 });
      tl.addLabel("s6");
      return tl;
    }
  };
})();
