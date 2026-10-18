/* IN.3: a sparse autoencoder on one activation vector. A dense 8-number activation x is built from
   3 of 32 dictionary directions plus a little unexplained noise; the SAE encoder lights up those 3
   latents (shrunk a bit by the L1 penalty, as real SAEs are), the decoder rebuilds x̂, and the
   leftover x − x̂ is the reconstruction error. All bars are computed from these numbers.
   Feature names are illustrative labels of the kind researchers assign after reading top examples. */
(function () {
  var LC = window.LC;
  var NX = 8, NF = 32;
  function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  var R = rng(1);
  function g() { var u = Math.max(1e-9, R()), v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  var D = [];
  for (var i = 0; i < NF; i++) {
    var d = []; for (var j = 0; j < NX; j++) d.push(g());
    var n = Math.sqrt(d.reduce(function (s, v) { return s + v * v; }, 0));
    D.push(d.map(function (v) { return v / n; }));
  }
  var TRUE = { 5: 1.4, 17: 0.9, 26: 0.6 };          // what generated x
  var CODE = { 5: 1.3, 17: 0.8, 26: 0.5 };          // what the SAE encoder outputs
  var STEER = { 5: 3.0, 17: 0.8, 26: 0.5 };         // feature 5 clamped high
  var NOISE = [0.06, -0.04, 0.03, -0.07, 0.02, 0.05, -0.03, 0.04];
  function decode(f, base) {
    var out = (base || [0, 0, 0, 0, 0, 0, 0, 0]).slice();
    for (var k in f) for (var j = 0; j < NX; j++) out[j] += f[k] * D[k][j];
    return out;
  }
  var X = decode(TRUE, NOISE), XH = decode(CODE), XS = decode(STEER);
  var ERR = X.reduce(function (s, v, j) { return s + (v - XH[j]) * (v - XH[j]); }, 0);
  var L1 = 1.3 + 0.8 + 0.5, LAM = 0.05;
  var NAMES = { 5: ["bridges", "#5 bridges"], 17: ["SF", "#17 San Francisco"], 26: ["tourism", "#26 tourism"] };
  function f2(v) { return v.toFixed(2); }

  LC.anims["in-3-sae"] = {
    title: "A sparse autoencoder: dense activation in, a few features out",
    steps: [
      "One token's <strong>activation</strong> $x$ from inside an LLM (here just 8 numbers; in a real model thousands). It's <strong>dense</strong>: every neuron is non-zero, so no single number means much.",
      "The <strong>encoder</strong> computes $f = \\mathrm{ReLU}(W_{\\text{enc}}(x - b_{\\text{dec}}) + b_{\\text{enc}})$: 32 latents, <strong>4× wider</strong> than $x$ (overcomplete). Thanks to the L1 penalty, almost all of them are exactly 0. Only 3 fire.",
      "Each latent is a candidate <strong>feature</strong>. Researchers name it by reading the texts that activate it most (names here are illustrative).",
      "The <strong>decoder</strong> rebuilds the activation as a weighted sum of the active features' directions: $\\hat{x} = W_{\\text{dec}} f + b_{\\text{dec}}$. Grey outlines show the original $x$.",
      "The leftover $x - \\hat{x}$ is the <strong>reconstruction error</strong>, here $\\lVert x - \\hat{x}\\rVert^2 = " + ERR.toFixed(3) + "$. Part is noise the dictionary can't explain (\"dark matter\"); part comes from L1 shrinking the active latents.",
      "Training minimises <strong>reconstruction error + λ × the sum of latent activations</strong>: here " + ERR.toFixed(3) + " + 0.05 × " + L1.toFixed(1) + " = " + (ERR + LAM * L1).toFixed(3) + ". The two terms pull against each other.",
      "Because features are directions, you can <strong>steer</strong>: clamp “bridges” from 1.3 up to 3.0 and decode. The activation now leans hard toward that feature. Clamping a Golden Gate Bridge feature this way gave Golden Gate Claude (Templeton et al., 2024)."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 452 } : { w: 640, h: 360 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact";
      var L = compact
        ? { x: { x0: 60, y0: 38, w: 240, h: 84 }, xh: { x0: 60, y0: 290, w: 240, h: 84 }, f: { x0: 20, y0: 160, w: 320, h: 58 }, encY: 146, decY: 258, nameY: 238, lossY: [400, 422, 444] }
        : { x: { x0: 40, y0: 52, w: 210, h: 96 }, xh: { x0: 390, y0: 52, w: 210, h: 96 }, f: { x0: 40, y0: 196, w: 560, h: 62 }, encY: 178, decY: 178, nameY: 278, lossY: [310, 334, 352] };
      var LIM = 2.1;   // fits the clamped x̂ (down to -2.02) without clipping any bar
      var tl = gsap.timeline();

      function chart(box, title, cls) {
        var g = S("g", {}, svg), mid = box.y0 + box.h / 2, bw = box.w / NX;
        S("text", { x: box.x0, y: box.y0 - 10, class: "t t-sm t-muted", text: title }, g);
        S("line", { x1: box.x0, x2: box.x0 + box.w, y1: mid, y2: mid, class: "s-grid" }, g);
        var bars = [], outl = [];
        for (var j = 0; j < NX; j++) {
          outl.push(S("rect", { x: box.x0 + j * bw + 3, y: mid, width: bw - 6, height: 0, class: "f-none", stroke: "var(--ink-2)", "stroke-width": 1.5, "stroke-dasharray": "3 2" }, g));
          bars.push(S("rect", { x: box.x0 + j * bw + 4, y: mid, width: bw - 8, height: 0, rx: 2, class: cls }, g));
        }
        return { g: g, bars: bars, outl: outl, mid: mid, half: box.h / 2 };
      }
      function setBar(rect, c, v) {
        var vv = Math.max(-LIM, Math.min(LIM, v)), hgt = Math.abs(vv) / LIM * (c.half - 2);
        rect.setAttribute("y", (vv >= 0 ? c.mid - hgt : c.mid).toFixed(1));
        rect.setAttribute("height", hgt.toFixed(1));
      }

      // s0: x
      var cx = chart(L.x, compact ? "activation x (8 neurons)" : "activation x (8 neurons, dense)", "f-ink");
      X.forEach(function (v, j) { setBar(cx.bars[j], cx, v); });
      tl.addLabel("s0", 0);

      // s1: encoder + latents
      var encT = S("text", { x: compact ? 20 : 320, y: L.encY, class: "t t-sm t-blue" + (compact ? "" : " t-mid"), text: compact ? "↓ encoder: ReLU(W_enc(x − b_dec) + b_enc)" : "ReLU(W_enc(x − b_dec) + b_enc) ↓" }, svg);
      var fbox = L.f, cw = fbox.w / NF, fBase = fbox.y0 + fbox.h;
      var fG = S("g", {}, svg);
      S("line", { x1: fbox.x0, x2: fbox.x0 + fbox.w, y1: fBase, y2: fBase, class: "s-axis" }, fG);
      var fBars = [];
      for (var k = 0; k < NF; k++) {
        S("rect", { x: fbox.x0 + k * cw + 1, y: fBase - 3, width: cw - 2, height: 3, rx: 1, class: "f-faint" }, fG);
        fBars.push(S("rect", { x: fbox.x0 + k * cw + 1, y: fBase, width: cw - 2, height: 0, rx: 2, class: "f-orange" }, fG));
      }
      var fT = S("text", { x: fbox.x0 + fbox.w, y: fbox.y0 + 12, class: "t t-sm t-muted t-end", text: "32 latents f, 3 active" }, fG);
      LC.popIn(tl, [encT, fG], { duration: 0.4 }, "+=0.02");
      var fState = { a: 0 };
      tl.to(fState, { a: 1, duration: 0.6, ease: "power1.out" });
      tl.addLabel("s1");

      // s2: names
      var names = [];
      Object.keys(CODE).forEach(function (kk) {
        var xk = fbox.x0 + (+kk + 0.5) * cw;
        names.push(S("text", { x: xk, y: L.nameY, class: "t t-sm t-mid t-orange", "font-weight": 600, text: NAMES[kk][compact ? 0 : 1] }, svg));
      });
      LC.popIn(tl, names, { duration: 0.4 }, "+=0.02");
      tl.addLabel("s2");

      // s3: decoder + x̂
      var decT = S("text", { x: compact ? 20 : 320, y: L.decY, class: "t t-sm t-blue" + (compact ? "" : " t-mid"), text: compact ? "↓ decoder: x̂ = W_dec f + b_dec" : "decoder ↑  x̂ = W_dec f + b_dec" }, svg);
      if (!compact) { decT.setAttribute("x", 495); decT.setAttribute("y", L.decY); encT.setAttribute("x", 145); }
      var cxh = chart(L.xh, "reconstruction x̂", "f-blue");
      X.forEach(function (v, j) { setBar(cxh.outl[j], cxh, v); });
      LC.popIn(tl, [decT, cxh.g], { duration: 0.4 }, "+=0.02");
      var xhState = { a: 0 };
      tl.to(xhState, { a: 1, duration: 0.6 });
      tl.addLabel("s3");

      // s4: error
      var errT = S("text", { x: compact ? 20 : 40, y: L.lossY[0], class: "t t-sm", text: "error ‖x − x̂‖² = " + ERR.toFixed(3) }, svg);
      var errScale = compact ? 600 : 900;
      var errBar = S("rect", { x: compact ? 210 : 330, y: L.lossY[0] - 11, width: (ERR * errScale).toFixed(1), height: 12, rx: 3, class: "f-orange" }, svg);
      LC.popIn(tl, [errT, errBar], { duration: 0.4 }, "+=0.02");
      tl.addLabel("s4");

      // s5: loss
      var spT = S("text", { x: compact ? 20 : 40, y: L.lossY[1], class: "t t-sm", text: "sparsity λ·Σ|f| = 0.05 × " + L1.toFixed(1) + " = " + f2(LAM * L1) }, svg);
      var spBar = S("rect", { x: compact ? 210 : 330, y: L.lossY[1] - 11, width: (LAM * L1 * errScale).toFixed(1), height: 12, rx: 3, class: "f-blue" }, svg);
      var totT = S("text", { x: compact ? 20 : 40, y: L.lossY[2], class: "t t-sm", "font-weight": 650, text: "loss = " + ERR.toFixed(3) + " + " + f2(LAM * L1) + " = " + (ERR + LAM * L1).toFixed(3) }, svg);
      LC.popIn(tl, [spT, spBar, totT], { duration: 0.4 }, "+=0.02");
      tl.addLabel("s5");

      // s6: steer
      var steerState = { a: 0 };
      var clampT = S("text", { x: fbox.x0 + 6 * cw + 5, y: fbox.y0 + 12, class: "t t-sm t-orange", "font-weight": 650, text: "← clamped" }, svg);
      clampT.style.opacity = 0;
      tl.to([errT, errBar, spT, spBar, totT, fT], { opacity: 0, duration: 0.3 }, "+=0.02");
      tl.to(clampT, { opacity: 1, duration: 0.3 });
      tl.to(steerState, { a: 1, duration: 0.7 }, "<");
      tl.addLabel("s6");

      // latents and x̂ are pure functions of the three state objects
      function render() {
        var maxF = 3.0;
        for (var k = 0; k < NF; k++) {
          var v = (CODE[k] || 0) * fState.a;
          if (k === 5) v = v + (STEER[5] - CODE[5]) * steerState.a;
          var hgt = v / maxF * (fbox.h - 2);
          fBars[k].setAttribute("y", (fBase - hgt).toFixed(1));
          fBars[k].setAttribute("height", Math.max(0, hgt).toFixed(1));
        }
        for (var j = 0; j < NX; j++) setBar(cxh.bars[j], cxh, (XH[j] + (XS[j] - XH[j]) * steerState.a) * xhState.a);
        cxh.g.querySelector("text").textContent = steerState.a > 0.5 ? "x̂ after clamping" : "reconstruction x̂";
      }
      tl.eventCallback("onUpdate", render);
      render();
      return tl;
    }
  };
})();
