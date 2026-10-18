/* P6.4: an 8×8 ring image → encoder → 2-number code → decoder → reconstruction.
   Reconstructions are illustrative (a blurred copy early in training, a sharper one later);
   the MSE values shown are computed from those pixel grids. Then the VAE twist. */
(function () {
  var LC = window.LC;
  var N = 8;
  var X = [];
  for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
    var d = Math.hypot(r - 3.5, c - 3.5);
    X.push(d >= 1.6 && d <= 3.4 ? 1 : 0);
  }
  function blur(img) {
    var out = [];
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
      var s = 0, w = 0;
      for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
        var rr = r + dr, cc = c + dc; if (rr < 0 || cc < 0 || rr >= N || cc >= N) continue;
        var k = dr === 0 && dc === 0 ? 2 : 1; s += k * img[rr * N + cc]; w += k;
      }
      out.push(s / w);
    }
    return out;
  }
  var EARLY = blur(X).map(function (v) { return 0.12 + 0.6 * v; });
  var LATE = blur(X).map(function (v, i) { return 0.75 * X[i] + 0.25 * v; });
  function mse(a) { return a.reduce(function (s, v, i) { return s + (v - X[i]) * (v - X[i]); }, 0) / a.length; }
  var L_EARLY = mse(EARLY), L_LATE = mse(LATE);

  LC.anims["p6-4-autoencoder"] = {
    title: "An autoencoder: squeeze to a code, rebuild, compare",
    steps: [
      "The input $x$: an 8×8 image, <strong>64 numbers</strong>.",
      "The <strong>encoder</strong> squeezes it down to a <strong>code</strong> $z$ of just 2 numbers: the bottleneck.",
      "The <strong>decoder</strong> expands the code back to 64 pixels: the reconstruction $\\hat{x}$. Early in training it's a blurry guess.",
      "The <strong>reconstruction loss</strong> compares output with input pixel by pixel (orange = error). Mean squared error: " + L_EARLY.toFixed(2) + ".",
      "Gradient descent adjusts encoder and decoder together to shrink that loss. After training the reconstruction is close: MSE " + L_LATE.toFixed(2) + ". (Illustrative pixels.)",
      "A <strong>VAE</strong> changes the middle: the encoder outputs a mean $\\mu$ and a spread $\\sigma$, and the code is <em>sampled</em>: $z = \\mu + \\sigma \\odot \\epsilon$, with random $\\epsilon \\sim \\mathcal{N}(0, 1)$.",
      "Its loss adds a <strong>KL term</strong> pulling every $(\\mu, \\sigma)$ toward $\\mathcal{N}(0, 1)$. Codes overlap and fill the space, so any sampled $z$ decodes to something plausible."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 198 } : { w: 640, h: 256 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact", W = ctx.w;
      var cs = compact ? 9 : 14, cg = compact ? 1 : 1.5;
      var gw = N * cs + (N - 1) * cg;
      var L = compact
        ? { gx1: 6, top: 52, enc: [94, 140], z: [150, 196], dec: [206, 252], lblY: 36, n1: 162, n2: 186 }
        : { gx1: 24, top: 58, enc: [170, 266], z: [288, 352], dec: [374, 470], lblY: 38, n1: 214, n2: 240 };
      L.gx2 = W - gw - L.gx1;
      var midY = L.top + gw / 2;
      var tl = gsap.timeline();

      function grid(x0, vals, cls, noBg) {
        var g = S("g", {}, svg), cells = [];
        for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
          if (!noBg) S("rect", { x: x0 + c * (cs + cg), y: L.top + r * (cs + cg), width: cs, height: cs, rx: compact ? 1.5 : 2, class: "f-surface2" }, g);
          var o = S("rect", { x: x0 + c * (cs + cg), y: L.top + r * (cs + cg), width: cs, height: cs, rx: compact ? 1.5 : 2, class: cls }, g);
          o.style.opacity = vals ? vals[r * N + c] : 0;
          cells.push(o);
        }
        return { g: g, cells: cells };
      }
      function lbl(x, txt, cls) { return S("text", { x: x, y: L.lblY, class: "t t-sm t-mid " + (cls || ""), text: txt }, svg); }
      function trap(x0, x1, wide0) {
        var h0 = wide0 ? gw : gw * 0.34, h1 = wide0 ? gw * 0.34 : gw;
        return S("path", { d: "M" + x0 + " " + (midY - h0 / 2) + "L" + x1 + " " + (midY - h1 / 2) + "L" + x1 + " " + (midY + h1 / 2) + "L" + x0 + " " + (midY + h0 / 2) + "Z", class: "f-blue", "fill-opacity": 0.18, stroke: "var(--a-blue)", "stroke-width": 2 }, svg);
      }

      // s0: input
      var inG = grid(L.gx1, X, "f-ink");
      var inL = lbl(L.gx1 + gw / 2, compact ? "input x" : "input x (64 px)");
      tl.addLabel("s0", 0);

      // s1: encoder + code
      var enc = trap(L.enc[0], L.enc[1], true);
      var encL = lbl((L.enc[0] + L.enc[1]) / 2, compact ? "enc" : "encoder");
      var zx = (L.z[0] + L.z[1]) / 2, zw = L.z[1] - L.z[0], zh = compact ? 20 : 24;
      var zG = S("g", {}, svg);
      [["0.8", -1], ["−1.2", 1]].forEach(function (p) {
        var y = midY + (p[1] < 0 ? -zh - 2 : 2);
        S("rect", { x: L.z[0], y: y, width: zw, height: zh, rx: 5, class: "f-orange" }, zG);
        S("text", { x: zx, y: y + zh / 2 + 4.5, class: "t t-sm t-mono t-mid t-nohalo", style: "fill:#fff", text: p[0] }, zG);
      });
      var zL = lbl(zx, "code z", "t-orange");
      LC.popIn(tl, [enc, encL], { duration: 0.4 }, "+=0.02");
      LC.popIn(tl, [zG, zL], { duration: 0.4 });
      tl.addLabel("s1");

      // s2: decoder + early reconstruction
      var dec = trap(L.dec[0], L.dec[1], false);
      var decL = lbl((L.dec[0] + L.dec[1]) / 2, compact ? "dec" : "decoder");
      var outG = grid(L.gx2, null, "f-ink");
      var outL = lbl(L.gx2 + gw / 2, "output x̂");
      outG.g.style.opacity = 0;
      LC.popIn(tl, [dec, decL], { duration: 0.4 }, "+=0.02");
      LC.popIn(tl, [outL, outG.g], { duration: 0.3 }, "<");
      outG.cells.forEach(function (c, i) { tl.to(c, { opacity: EARLY[i], duration: 0.4 }, i ? "<" : undefined); });
      tl.addLabel("s2");

      // s3: error overlay + loss
      var errG = grid(L.gx2, null, "f-orange", true);
      var note1 = S("text", { x: W / 2, y: L.n1, class: "t t-sm t-mid", text: "loss = mean (x − x̂)² = " + L_EARLY.toFixed(2) }, svg);
      note1.style.opacity = 0;
      errG.cells.forEach(function (c, i) { tl.to(c, { opacity: Math.min(1, Math.abs(EARLY[i] - X[i])), duration: 0.4 }, i ? "<" : "+=0.02"); });
      tl.to(note1, { opacity: 1, duration: 0.3 }, "<");
      tl.addLabel("s3");

      // s4: trained
      var note2 = S("text", { x: W / 2, y: L.n1, class: "t t-sm t-mid", text: "after training: loss = " + L_LATE.toFixed(2) }, svg);
      note2.style.opacity = 0;
      tl.to(note1, { opacity: 0, duration: 0.2 }, "+=0.02");
      outG.cells.forEach(function (c, i) { tl.to(c, { opacity: LATE[i], duration: 0.6 }, "<"); });
      errG.cells.forEach(function (c, i) { tl.to(c, { opacity: Math.min(1, Math.abs(LATE[i] - X[i])), duration: 0.6 }, "<"); });
      tl.to(note2, { opacity: 1, duration: 0.3 });
      tl.addLabel("s4");

      // s5: VAE middle
      var vG = S("g", {}, svg);
      [["μ", -1], ["σ", 1]].forEach(function (p) {
        var y = midY + (p[1] < 0 ? -zh - 2 : 2);
        S("rect", { x: L.z[0], y: y, width: zw, height: zh, rx: 5, class: p[1] < 0 ? "f-orange" : "f-blue" }, vG);
        S("text", { x: zx, y: y + zh / 2 + 5, class: "t t-sm t-mid t-nohalo", "font-weight": 650, style: "fill:#fff", text: p[0] }, vG);
      });
      vG.style.opacity = 0;
      var zL2 = lbl(zx, "μ, σ", "t-orange"); zL2.style.opacity = 0;
      var note3 = S("text", { x: W / 2, y: L.n1, class: "t t-sm t-mid t-orange", text: "z = μ + σ·ε,  ε ~ N(0, 1)" }, svg);
      note3.style.opacity = 0;
      tl.to([zG, zL, note2, errG.g], { opacity: 0, duration: 0.3 }, "+=0.02");
      tl.to([vG, zL2, note3], { opacity: 1, duration: 0.4 });
      tl.addLabel("s5");

      // s6: KL term
      var note4 = S("text", { x: W / 2, y: L.n2, class: "t t-sm t-mid", text: compact ? "loss = reconstruction + KL to N(0, 1)" : "loss = reconstruction + KL( N(μ, σ²) ‖ N(0, 1) )" }, svg);
      LC.popIn(tl, note4, { duration: 0.4 }, "+=0.02");
      tl.addLabel("s6");
      return tl;
    }
  };
})();
