/* VD.2: text-to-video with a latent diffusion transformer.
   prompt + pure-noise latent → patchify into tokens → DiT (full 3D attention, timestep t)
   → repeat for ~50 steps → clean latent → VAE decoder (4× frames, 8× pixels per side).
   Drawing: 4 latent frames of 6 × 4 latent pixels; 1 × 2 × 2 patches give 6 tokens per
   latent frame (24 video tokens) next to 6 text tokens. The decoder makes 16 frames.
   Cost line: 50 steps × 2 passes for classifier-free guidance = 100 transformer passes. */
(function () {
  var LC = window.LC;
  var NLF = 4, LC_ = 6, LR = 4, NTXT = 6, NOUT = NLF * 4, STEPS = 50;
  // deterministic pseudo-random noise
  var seed = 7;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  var NOISE = [];
  for (var i = 0; i < NLF * LC_ * LR; i++) NOISE.push(rnd());

  LC.anims["vd-2-pipeline"] = {
    title: "Text to video with a diffusion transformer",
    steps: [
      "Generation starts from a <strong>text prompt</strong> and a latent tensor of <strong>pure noise</strong>, already in the VAE's compressed shape (here 4 latent frames).",
      "The latent is cut into $1 \\times 2 \\times 2$ patches: <strong>video tokens</strong>. A text encoder turns the prompt into <strong>text tokens</strong>. Some models put both in one sequence; others feed the text in through cross-attention.",
      "A <strong>diffusion transformer</strong> reads all the tokens with full space-time attention, plus the noise level (timestep $t$), and predicts how to remove the noise.",
      "Take a small step toward that prediction, then run the transformer again on the slightly cleaner latent. Halfway through, the coarse layout appears: water below, a boat moving right.",
      "After the last step the latent is clean. Every frame was refined <strong>together</strong>, at every step, so the boat's motion is consistent across the clip.",
      "The <strong>VAE decoder</strong> turns the latent back into pixels: each latent frame becomes 4 video frames, and each latent pixel an 8 × 8 block of pixels.",
      "The bill: every step is a full transformer pass over every token, and classifier-free guidance doubles it. 50 steps × 2 = <strong>100 passes</strong> for one clip."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 368 } : { w: 640, h: 352 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact", W = ctx.w;
      var L = compact ? {
        prompt: [30, 24, 280, 32], latLblY: 80, latY: 88, cell: 11, lgap: 12,
        tokLblY: 160, tokY: 168, tok: 8, tgap: 2,
        dit: [40, 190, 270, 52], loopX: 346, loopLblY: 262,
        decLblY: 286, outW: 38, outH: 26, outGap: 4, outPerRow: 8, outY: [296, 330]
      } : {
        prompt: [140, 6, 360, 34], latLblY: 66, latY: 74, cell: 15, lgap: 24,
        tokLblY: 160, tokY: 168, tok: 12, tgap: 3,
        dit: [140, 200, 360, 54], loopX: 600, loopLblY: 278,
        decLblY: 304, outW: 34, outH: 26, outGap: 4, outPerRow: 16, outY: [314]
      };
      var lfw = LC_ * L.cell, lfh = LR * L.cell;
      var latW = NLF * lfw + (NLF - 1) * L.lgap, lx0 = (W - latW) / 2;
      var tl = gsap.timeline();

      // ---- s0: prompt + noisy latent ----
      S("rect", { x: L.prompt[0], y: L.prompt[1], width: L.prompt[2], height: L.prompt[3], rx: 8, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, svg);
      S("text", { x: L.prompt[0] + L.prompt[2] / 2, y: L.prompt[1] + L.prompt[3] / 2 + 5, class: "t t-mid" + (compact ? " t-sm" : ""), text: "“a paper boat crossing a pond”" }, svg);
      S("text", { x: lx0, y: L.latLblY, class: "t t-sm t-muted", text: compact ? "latent: 4 frames" : "latent: 4 frames, 4 × 8 × 8 smaller than the video" }, svg);
      var counter = S("text", { x: lx0 + latW, y: L.latLblY, class: "t t-sm t-mono t-end", text: "noise" }, svg);
      var noiseR = [], waterR = [], boatR = [];
      for (var f = 0; f < NLF; f++) {
        var fx = lx0 + f * (lfw + L.lgap);
        S("rect", { x: fx, y: L.latY, width: lfw, height: lfh, rx: 3, class: "f-surface" }, svg);
        for (var r = 0; r < LR; r++) for (var c = 0; c < LC_; c++) {
          var x = fx + c * L.cell, y = L.latY + r * L.cell;
          waterR.push({ el: S("rect", { x: x, y: y, width: L.cell, height: L.cell, class: "f-blue", "fill-opacity": 0 }, svg), on: r >= 2 });
          boatR.push({ el: S("rect", { x: x + 1, y: y + 1, width: L.cell - 2, height: L.cell - 2, rx: 2, class: "f-orange", "fill-opacity": 0 }, svg), on: r === 1 && c === 1 + f });
          noiseR.push(S("rect", { x: x, y: y, width: L.cell, height: L.cell, class: "f-ink", "fill-opacity": 0 }, svg));
        }
        S("rect", { x: fx, y: L.latY, width: lfw, height: lfh, rx: 3, class: "f-none", stroke: "var(--a-faint)", "stroke-width": 1 }, svg);
      }
      var prog = { p: 0 };
      function render() {
        var p = prog.p;
        noiseR.forEach(function (n, k) { n.setAttribute("fill-opacity", (0.7 * NOISE[k] * (1 - p)).toFixed(3)); });
        waterR.forEach(function (w) { w.el.setAttribute("fill-opacity", (w.on ? 0.55 * p : 0.08 * p).toFixed(3)); });
        boatR.forEach(function (b) { b.el.setAttribute("fill-opacity", (b.on ? p : 0).toFixed(3)); });
        counter.textContent = p <= 0 ? "noise" : "step " + Math.round(p * STEPS) + " / " + STEPS;
      }
      render();
      tl.addLabel("s0", 0);

      // ---- s1: tokens ----
      var nTok = NTXT + NLF * (LC_ / 2) * (LR / 2);
      var tw = nTok * (L.tok + L.tgap) - L.tgap, tx0 = (W - tw) / 2;
      var tokLblA = S("text", { x: tx0, y: L.tokLblY, class: "t t-sm", text: "text tokens" }, svg);
      var tokLblB = S("text", { x: tx0 + tw, y: L.tokLblY, class: "t t-sm t-blue t-end", text: "video tokens (2 × 2 patches)" }, svg);
      var toks = [];
      for (var k = 0; k < nTok; k++) {
        toks.push(S("rect", { x: tx0 + k * (L.tok + L.tgap), y: L.tokY, width: L.tok, height: L.tok + 4, rx: 2, class: k < NTXT ? "f-ink" : "f-blue", "fill-opacity": k < NTXT ? 0.75 : 0.6 }, svg));
      }
      // patch grid overlay on the latent
      var pg = S("g", {}, svg);
      for (f = 0; f < NLF; f++) {
        fx = lx0 + f * (lfw + L.lgap);
        for (r = 0; r < LR; r += 2) for (c = 0; c < LC_; c += 2) {
          S("rect", { x: fx + c * L.cell, y: L.latY + r * L.cell, width: 2 * L.cell, height: 2 * L.cell, class: "f-none", stroke: "var(--a-blue)", "stroke-width": 1.5 }, pg);
        }
      }
      LC.popIn(tl, pg, { duration: 0.4 }, "+=0.01");
      LC.popIn(tl, [tokLblA, tokLblB], { duration: 0.3 });
      LC.popIn(tl, toks, { duration: 0.2, stagger: 0.03 }, "<");
      tl.addLabel("s1");

      // ---- s2: the DiT ----
      var d = L.dit;
      var ditBox = S("rect", { x: d[0], y: d[1], width: d[2], height: d[3], rx: 10, class: "f-surface2", stroke: "var(--a-blue)", "stroke-width": 2 }, svg);
      var ditT1 = S("text", { x: d[0] + d[2] / 2, y: d[1] + 22, class: "t t-mid", text: "diffusion transformer", "font-weight": 600 }, svg);
      var ditT2 = S("text", { x: d[0] + d[2] / 2, y: d[1] + 41, class: "t t-sm t-mid t-muted", text: compact ? "full 3D attention · timestep t" : "N blocks · full space-time attention · timestep t" }, svg);
      tl.to(pg, { opacity: 0, duration: 0.3 });
      LC.popIn(tl, [ditBox, ditT1, ditT2], { duration: 0.4 });
      tl.addLabel("s2");

      // ---- s3: denoising loop, halfway ----
      var lx = L.loopX, midY = d[1] + d[3] / 2, topY = L.latY + lfh / 2;
      var loop = S("path", { d: "M" + (d[0] + d[2] + 2) + " " + midY + "H" + lx + "V" + topY + "H" + (lx0 + latW + 6) + "M" + (lx0 + latW + 13) + " " + (topY - 6) + "L" + (lx0 + latW + 6) + " " + topY + "L" + (lx0 + latW + 13) + " " + (topY + 6), class: "s-orange", "stroke-width": 2.5 }, svg);
      var loopLbl = S("text", { x: W / 2, y: L.loopLblY, class: "t t-sm t-orange t-mid", text: "repeat: predict, step, predict…" }, svg);
      LC.drawIn(tl, loop, { duration: 0.6 });
      LC.popIn(tl, loopLbl, { duration: 0.3 });
      tl.to(prog, { p: 0.5, duration: 1.2, ease: "none", onUpdate: render });
      tl.addLabel("s3");

      // ---- s4: clean latent ----
      tl.to(prog, { p: 1, duration: 1.2, ease: "none", onUpdate: render });
      tl.addLabel("s4");

      // ---- s5: VAE decoder → 16 frames ----
      var decLbl = S("text", { x: W / 2, y: L.decLblY, class: "t t-sm t-mid", text: compact ? "VAE decoder → 16 frames, 8× bigger" : "VAE decoder → 16 video frames, 8× bigger on each side", "font-weight": 600 }, svg);
      var outs = [];
      var perRow = L.outPerRow, rowW = perRow * L.outW + (perRow - 1) * L.outGap, ox0 = (W - rowW) / 2;
      for (var o = 0; o < NOUT; o++) {
        var g = S("g", {}, svg);
        var ox = ox0 + (o % perRow) * (L.outW + L.outGap), oy = L.outY[Math.floor(o / perRow)];
        S("rect", { x: ox, y: oy, width: L.outW, height: L.outH, rx: 2, class: "f-surface", stroke: "var(--line)", "stroke-width": 1 }, g);
        S("rect", { x: ox + 0.5, y: oy + L.outH * 0.55, width: L.outW - 1, height: L.outH * 0.45 - 0.5, class: "f-blue", "fill-opacity": 0.45 }, g);
        var bx = ox + L.outW * (0.15 + 0.6 * o / (NOUT - 1)), by = oy + L.outH * 0.55;
        S("polygon", { points: (bx - 6) + "," + (by - 4) + " " + (bx + 6) + "," + (by - 4) + " " + (bx + 3) + "," + (by + 1) + " " + (bx - 3) + "," + (by + 1), class: "f-orange" }, g);
        S("polygon", { points: (bx - 1) + "," + (by - 5) + " " + (bx - 1) + "," + (by - 12) + " " + (bx + 4) + "," + (by - 5), class: "f-ink" }, g);
        outs.push(g);
      }
      tl.to(loopLbl, { opacity: 0, duration: 0.2 });
      LC.popIn(tl, decLbl, { duration: 0.3 });
      LC.popIn(tl, outs, { duration: 0.25, stagger: 0.05 }, "<");
      tl.addLabel("s5");

      // ---- s6: the cost ----
      var cost = S("text", { x: W / 2, y: L.loopLblY, class: "t t-sm t-orange t-mid", text: "50 steps × 2 (guidance) = 100 transformer passes", "font-weight": 600 }, svg);
      LC.popIn(tl, cost, { duration: 0.4 });
      tl.to(ditBox, { attr: { "stroke-width": 3.5 }, duration: 0.3, yoyo: true, repeat: 1 }, "<");
      tl.addLabel("s6");
      return tl;
    }
  };
})();
