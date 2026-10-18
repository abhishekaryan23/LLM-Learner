/* M5.1: asymmetric 4-bit quantization of nine weights, then the same nine plus
   one outlier. Numbers (checked in Python):
   panel A: range [-0.80, 1.20], s = 2/15 = 0.1333, z = 6,
            codes 0 2 4 5 6 8 9 11 15, max |error| 0.063 <= s/2, RMS error 0.035
   panel B: + outlier 5.20, range [-0.80, 5.20], s = 6/15 = 0.40, z = 2,
            codes 0 1 1 2 2 3 3 4 5 | 15, RMS error (first nine) 0.094 */
(function () {
  var LC = window.LC;
  var WTS = [-0.80, -0.47, -0.29, -0.10, 0.06, 0.23, 0.41, 0.66, 1.20];
  var OUT = 5.20;

  function quant(ws, lo, hi) {
    var s = (hi - lo) / 15, z = Math.round(-lo / s);
    return ws.map(function (w) {
      var q = Math.max(0, Math.min(15, Math.round(w / s) + z));
      return { w: w, q: q, xh: s * (q - z) };
    });
  }

  LC.anims["m5-1-quantize"] = {
    title: "Quantizing nine weights to 4 bits",
    steps: [
      "Nine weights from one row of a layer, each stored in <strong>bf16</strong> (16 bits). We want to store them in <strong>4 bits</strong> each.",
      "First find the <strong>range</strong>: the smallest weight is −0.80 and the largest 1.20, so the range is 2.00.",
      "4 bits give $2^4 = 16$ <strong>levels</strong> (codes 0 to 15), so 15 equal gaps. The gap is the <strong>scale</strong> $s = 2.00/15 \\approx 0.133$. The <strong>zero-point</strong> $z = 6$ is the code that stands for exactly 0.",
      "<strong>Quantize:</strong> each weight snaps to the nearest level, $q = \\mathrm{round}(w/s) + z$. The integer code is all we keep.",
      "Storage: 4-bit codes plus one $s$ and one $z$ shared by the whole row, instead of 16-bit numbers. A real row has thousands of weights, so the shared $s$ and $z$ are negligible and the row is about <strong>4× smaller</strong>.",
      "<strong>Dequantize</strong> to compute: $\\hat w = s\\,(q - z)$. Each weight moved by its rounding error (grey lines), never more than $s/2 \\approx 0.067$.",
      "Now add one <strong>outlier</strong>, 5.20. The range triples, so $s = 0.40$. The nine normal weights now share just <strong>6 codes</strong> (pairs collapse together) and their error grows about <strong>2.7×</strong>. Outliers are quantization's main enemy."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 366 } : { w: 640, h: 366 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var mL = compact ? 30 : 70, mR = compact ? 30 : 70;
      var tl = gsap.timeline();

      function panel(top, lo, hi, ws) {
        var p = {};
        p.sx = function (v) { return mL + ((v - lo) / (hi - lo)) * (W - mL - mR); };
        p.dotY = top + 40; p.axY = top + 62; p.codeY = top + 84; p.valY = top + 102;
        p.g = S("g", {}, svg);
        p.axis = S("line", { x1: mL - 10, x2: W - mR + 10, y1: p.axY, y2: p.axY, class: "s-axis" }, p.g);
        p.data = quant(ws, lo, hi);
        var s = (hi - lo) / 15, z = Math.round(-lo / s);
        p.ticks = S("g", {}, svg);
        for (var q = 0; q <= 15; q++) {
          S("line", { x1: p.sx(s * (q - z)), x2: p.sx(s * (q - z)), y1: p.axY - 7, y2: p.axY + 7, class: "s-blue", "stroke-width": 1.5 }, p.ticks);
        }
        if (!compact) {
          p.rowT = [S("text", { x: 8, y: p.codeY, class: "t t-sm t-muted", text: "code q" }, svg),
                    S("text", { x: 8, y: p.valY, class: "t t-sm t-muted", text: "value" }, svg)];
        } else p.rowT = [];
        p.ghosts = p.data.map(function (d) { return S("circle", { cx: p.sx(d.w), cy: p.dotY, r: compact ? 4.5 : 5.5, class: "f-orange" }, svg); });
        p.snap = p.data.map(function (d) { return S("circle", { cx: p.sx(d.w), cy: p.dotY, r: compact ? 4.5 : 5.5, class: "f-blue" }, svg); });
        p.codeLbl = function (q, cls) { return S("text", { x: p.sx(s * (q - z)), y: p.codeY, class: "t t-sm t-mono t-mid " + (cls || ""), text: String(q) }, svg); };
        p.valLbl = function (v, txt) { return S("text", { x: p.sx(v), y: p.valY, class: "t t-sm t-mono t-mid t-muted", text: txt }, svg); };
        return p;
      }
      function swap(oldEl, newEl, pos) {
        if (oldEl) tl.to(oldEl, { opacity: 0, duration: 0.25 }, pos);
        LC.popIn(tl, newEl, { duration: 0.35 }, oldEl ? "<0.1" : pos);
      }
      function readout(y, txt) { return S("text", { x: compact ? 4 : 8, y: y, class: "t t-sm", text: txt }, svg); }

      // ---------- panel A ----------
      var A = panel(18, -0.8, 1.2, WTS);
      A.ticks.style.opacity = 0;
      A.snap.forEach(function (c) { c.style.opacity = 0; });
      A.rowT.forEach(function (t) { t.style.opacity = 0; });
      var r0 = readout(18, "9 weights, bf16 = 16 bits each");
      tl.addLabel("s0", 0);

      // s1: range bracket + min/max values
      var bY = A.dotY - 18;
      var bracket = S("path", { d: "M" + A.sx(-0.8) + " " + (bY + 6) + "V" + bY + "H" + A.sx(1.2) + "V" + (bY + 6), class: "s-ink", "stroke-width": 1.5 }, svg);
      var r1 = readout(18, "range = 1.20 − (−0.80) = 2.00");
      var vMin = A.valLbl(-0.8, "−0.80"), vMax = A.valLbl(1.2, "1.20");
      swap(r0, r1);
      LC.drawIn(tl, bracket, { duration: 0.6 }, "<");
      LC.popIn(tl, [vMin, vMax].concat(A.rowT.slice(1)), { duration: 0.3 });
      tl.addLabel("s1");

      // s2: 16 levels
      var r2 = readout(18, "4 bits → 16 levels · s = 2.00 / 15 ≈ 0.133");
      var v0 = A.valLbl(0, "0.00");
      var c0 = A.codeLbl(0), c6 = A.codeLbl(6, "t-blue"), c15 = A.codeLbl(15);
      swap(r1, r2);
      tl.to(bracket, { opacity: 0, duration: 0.3 }, "<");
      LC.popIn(tl, A.ticks, { duration: 0.5 });
      LC.popIn(tl, [c0, c6, c15, v0].concat(A.rowT.slice(0, 1)), { duration: 0.35 });
      tl.addLabel("s2");

      // s3: snap to nearest level
      var r3 = readout(18, "round each weight to the nearest level");
      swap(r2, r3);
      var used = {};
      A.data.forEach(function (d) { used[d.q] = 1; });
      var extra = Object.keys(used).map(Number).filter(function (q) { return q !== 0 && q !== 6 && q !== 15; }).map(function (q) { return A.codeLbl(q); });
      tl.set(A.snap, { opacity: 1 });
      tl.to(A.ghosts, { opacity: 0.35, duration: 0.3 }, "<");
      A.data.forEach(function (d, i) {
        tl.to(A.snap[i], { attr: { cx: A.sx(d.xh), cy: A.axY }, duration: 0.8, ease: "power2.inOut" }, i ? "<0.04" : ">");
      });
      LC.popIn(tl, extra, { duration: 0.3, stagger: 0.03 });
      tl.addLabel("s3");

      // s4: storage
      var st1 = S("text", { x: compact ? 4 : 8, y: A.valY + 26, class: "t t-sm t-mono", text: "stored: 0 2 4 5 6 8 9 11 15 + s, z" }, svg);
      var st2 = S("text", { x: compact ? 4 : 8, y: A.valY + 44, class: "t t-sm t-muted", text: "9 × 4 bits (+ s, z) vs 9 × 16 bits" }, svg);
      LC.popIn(tl, [st1, st2], { duration: 0.4, stagger: 0.15 });
      tl.addLabel("s4");

      // s5: dequantize + error segments
      var r5 = readout(18, "ŵ = s·(q − z) · max |error| 0.063 ≤ s/2");
      swap(r3, r5);
      var errs = A.data.map(function (d) {
        return S("path", { d: "M" + A.sx(d.w) + " " + A.dotY + "L" + A.sx(d.xh) + " " + A.axY, class: "s-ink", "stroke-width": 1.5, "stroke-opacity": 0.55 }, svg);
      });
      errs.forEach(function (p, i) { LC.drawIn(tl, p, { duration: 0.35 }, i ? "<0.05" : "+=0.02"); });
      tl.addLabel("s5");

      // s6: panel B with an outlier
      var B = panel(196, -0.8, OUT, WTS.concat([OUT]));
      var zB = 2;
      var bHead = readout(196, "+ one outlier, 5.20 → s = 6.00 / 15 = 0.40");
      var bOut = S("text", { x: B.sx(OUT), y: B.dotY - 13, class: "t t-sm t-orange t-mid", text: "outlier" }, svg);
      B.snap.forEach(function (c, i) { c.setAttribute("cx", B.sx(B.data[i].xh)); c.setAttribute("cy", B.axY); });
      B.ghosts.forEach(function (c, i) { if (i < WTS.length) c.style.fillOpacity = 0.35; });
      var usedB = {};
      B.data.forEach(function (d) { usedB[d.q] = 1; });
      var bCodes = Object.keys(usedB).map(function (q) { return B.codeLbl(+q, +q === zB ? "t-blue" : ""); });
      var bVals = [B.valLbl(-0.8, "−0.80"), B.valLbl(OUT, "5.20")].concat(compact ? [] : [B.valLbl(0, "0.00")]);
      var bSum = S("text", { x: compact ? 4 : 8, y: B.valY + 28, class: "t t-sm", text: compact ? "9 normal weights share 6 codes" : "the 9 normal weights now share only 6 codes" }, svg);
      var bSum2 = S("text", { x: compact ? 4 : 8, y: B.valY + 46, class: "t t-sm t-orange", text: "RMS error 0.035 → 0.094 (≈ 2.7×)" }, svg);
      LC.popIn(tl, [B.g, B.ticks, bHead].concat(B.rowT), { duration: 0.4 }, "+=0.05");
      LC.popIn(tl, B.ghosts.concat([bOut]), { duration: 0.3 });
      LC.popIn(tl, B.snap.concat(bCodes, bVals), { duration: 0.4 });
      LC.popIn(tl, [bSum, bSum2], { duration: 0.4, stagger: 0.15 });
      tl.addLabel("s6");
      return tl;
    }
  };
})();
