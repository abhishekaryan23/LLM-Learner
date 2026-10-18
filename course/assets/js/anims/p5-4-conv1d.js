/* P5.4: 1D convolution (deep-learning style, i.e. cross-correlation: y[i] = Σ_j w[j]·x[i+j]).
   x = [2, 2, 2, 6, 6, 6, 2, 2].
   Blur w = [¼, ½, ¼]        → y = [2, 3, 5, 6, 5, 3]          (valid: 8 − 3 + 1 = 6 outputs)
   Edge w = [−1, 0, 1]       → y = [0, 4, 4, 0, −4, −4]
   Edge, zero padding p = 1  → y = [2, 0, 4, 4, 0, −4, −4, −2] (8 outputs; the ends are border artefacts)
   Edge, stride s = 2        → y = [0, 4, −4]                  (⌊(8 − 3)/2⌋ + 1 = 3 outputs) */
(function () {
  var LC = window.LC;
  var X = [2, 2, 2, 6, 6, 6, 2, 2];
  var BLUR = [0.25, 0.5, 0.25], EDGE = [-1, 0, 1];
  function xa(i) { return i < 0 || i >= X.length ? 0 : X[i]; }
  function conv(w, p) { return w[0] * xa(p) + w[1] * xa(p + 1) + w[2] * xa(p + 2); }
  function fmtW(v) { return v === 0.25 ? "¼" : v === 0.5 ? "½" : v < 0 ? "−" + (-v) : String(v); }
  function fmtN(v) { return v < 0 ? "−" + (-v) : String(v); }

  LC.anims["p5-4-conv1d"] = {
    title: "Slide, multiply, add",
    steps: [
      "An input signal $x$ with 8 values (a step up, then down) and a 3-wide <strong>kernel</strong> $w = [\\tfrac14, \\tfrac12, \\tfrac14]$, lined up with the first three inputs.",
      "Multiply each kernel weight by the input under it and add: $2\\cdot\\tfrac14 + 2\\cdot\\tfrac12 + 2\\cdot\\tfrac14 = 2$. That's the first <strong>output</strong>.",
      "<strong>Slide</strong> one step right and repeat: $2\\cdot\\tfrac14 + 2\\cdot\\tfrac12 + 6\\cdot\\tfrac14 = 3$.",
      "Keep sliding to the end. The sharp step has become a gentle ramp: this kernel is a <strong>blur</strong>. 8 inputs and a 3-wide kernel give $8 - 3 + 1 = 6$ outputs.",
      "Same input, new kernel $w = [-1, 0, 1]$: each output is \"right minus left\". It's 0 on flat stretches, positive on the rising <strong>edge</strong> and negative on the falling one.",
      "<strong>Padding</strong>: add a 0 at each end and the output keeps all 8 positions. The two end values ($2$ and $-2$) are artefacts of the made-up zeros.",
      "<strong>Stride</strong> 2: jump two places each time (no padding). Only $\\lfloor (8 - 3)/2 \\rfloor + 1 = 3$ outputs: $[0, 4, -4]$. Strides shrink the signal."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 258 } : { w: 640, h: 262 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact", W = ctx.w;
      var cw = compact ? 32 : 48, x0 = (W - 10 * cw) / 2, fs = compact ? "t-sm " : "";
      function slotX(k) { return x0 + (k + 1) * cw; }     // k = −1 … 8
      var R = compact ? { inL: 18, inY: 26, kL: 84, kY: 92, comp: 146, outL: 178, outY: 186, foot: 246, ch: 32, kh: 28 }
                      : { inL: 18, inY: 26, kL: 84, kY: 92, comp: 148, outL: 180, outY: 188, foot: 252, ch: 34, kh: 30 };
      var tl = gsap.timeline();
      var lx = x0 + cw;   // labels line up with input cell 0

      function cell(k, y, h, v, kind) {   // kind: "in" | "out"
        var g = S("g", {}, svg), mag = Math.min(1, Math.abs(v) / 6);
        var neg = v < 0;
        S("rect", { x: slotX(k) + 2, y: y, width: cw - 4, height: h, rx: 5, class: neg ? "f-orange" : "f-blue", "fill-opacity": (0.1 + 0.75 * mag).toFixed(2) }, g);
        S("text", { x: slotX(k) + cw / 2, y: y + h / 2 + 4.5, class: "t " + fs + "t-mono t-mid t-nohalo", "font-weight": 600, text: fmtN(v), style: mag > 0.55 ? "fill:#fff" : "" }, g);
        return g;
      }

      // input row (+ hidden padding cells)
      S("text", { x: lx, y: R.inL, class: "t t-sm t-muted", text: "input x" }, svg);
      X.forEach(function (v, i) { cell(i, R.inY, R.ch, v, "in"); });
      var pads = [-1, 8].map(function (k) {
        var g = S("g", {}, svg);
        S("rect", { x: slotX(k) + 2, y: R.inY, width: cw - 4, height: R.ch, rx: 5, class: "f-none", stroke: "var(--a-faint)", "stroke-width": 2, "stroke-dasharray": "4 3" }, g);
        S("text", { x: slotX(k) + cw / 2, y: R.inY + R.ch / 2 + 4.5, class: "t " + fs + "t-mono t-mid t-muted", text: "0" }, g);
        g.style.opacity = 0;
        return g;
      });

      // kernel (moves) + window outline on the input
      var kLbls = ["kernel w (blur)", "kernel w (edge detector)"].map(function (t, i) {
        var e = S("text", { x: lx, y: R.kL, class: "t t-sm t-muted", text: t }, svg);
        if (i) e.style.opacity = 0;
        return e;
      });
      var kg = S("g", {}, svg), kTxt = [[], []];
      for (var j = 0; j < 3; j++) {
        S("rect", { x: j * cw + 2, y: R.kY, width: cw - 4, height: R.kh, rx: 5, class: "f-surface2", stroke: "var(--a-orange)", "stroke-width": 2 }, kg);
        kTxt[0].push(S("text", { x: j * cw + cw / 2, y: R.kY + R.kh / 2 + 5, class: "t t-mid", "font-weight": 650, text: fmtW(BLUR[j]) }, kg));
        var e2 = S("text", { x: j * cw + cw / 2, y: R.kY + R.kh / 2 + 5, class: "t t-mid", "font-weight": 650, text: fmtW(EDGE[j]) }, kg);
        e2.style.opacity = 0; kTxt[1].push(e2);
      }
      var win = S("rect", { y: R.inY - 4, width: 3 * cw, height: R.ch + 8, rx: 8, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 2.5 }, svg);
      var comp = S("text", { x: W / 2, y: R.comp, class: "t " + fs + "t-mono t-mid", text: "" }, svg);
      comp.style.opacity = 0;
      S("text", { x: lx, y: R.outL, class: "t t-sm t-muted", text: "output y" }, svg);

      var st = { pos: 0, mode: 0, show: 0 };
      var KER = [BLUR, EDGE, EDGE, EDGE];
      function update() {
        var p = Math.round(st.pos), m = Math.round(st.mode), w = KER[m];
        kg.setAttribute("transform", "translate(" + slotX(st.pos) + " 0)");
        win.setAttribute("x", slotX(st.pos));
        comp.textContent = [0, 1, 2].map(function (k) {
          var wt = fmtW(w[k]); return xa(p + k) + "·" + (w[k] < 0 ? "(" + wt + ")" : wt);
        }).join(" + ") + " = " + fmtN(conv(w, p));
      }
      update();

      // output rows for each scenario: { slot of each output, window start positions }
      function outRow(w, starts, slots) {
        return starts.map(function (p, i) { var g = cell(slots[i], R.outY, R.ch, conv(w, p), "out"); g.style.opacity = 0; return g; });
      }
      var OA = outRow(BLUR, [0, 1, 2, 3, 4, 5], [1, 2, 3, 4, 5, 6]);
      var OB = outRow(EDGE, [0, 1, 2, 3, 4, 5], [1, 2, 3, 4, 5, 6]);
      var OC = outRow(EDGE, [-1, 0, 1, 2, 3, 4, 5, 6], [0, 1, 2, 3, 4, 5, 6, 7]);
      var OD = outRow(EDGE, [0, 2, 4], [1, 3, 5]);
      var foot = ["8 inputs, kernel 3 → 6 outputs", "padding 1 → 8 outputs", "stride 2 → 3 outputs"].map(function (t) {
        var e = S("text", { x: W / 2, y: R.foot, class: "t t-sm t-mid t-muted", text: t }, svg);
        e.style.opacity = 0;
        return e;
      });
      tl.addLabel("s0", 0);

      function slideTo(p, dur) { tl.to(st, { pos: p, duration: dur, ease: "power1.inOut", onUpdate: update }); }
      // s1: first output
      tl.to(comp, { opacity: 1, duration: 0.3 });
      LC.popIn(tl, OA[0], { duration: 0.4 });
      tl.addLabel("s1");
      // s2
      slideTo(1, 0.6); LC.popIn(tl, OA[1], { duration: 0.3 });
      tl.addLabel("s2");
      // s3
      for (var p = 2; p <= 5; p++) { slideTo(p, 0.35); LC.popIn(tl, OA[p], { duration: 0.2 }); }
      LC.popIn(tl, foot[0], { duration: 0.3 });
      tl.addLabel("s3");
      // s4: edge kernel
      tl.to(OA.concat(foot[0]), { opacity: 0, duration: 0.3 });
      tl.to(kTxt[0].concat(kLbls[0]), { opacity: 0, duration: 0.2 }, "<");
      tl.to(kTxt[1].concat(kLbls[1]), { opacity: 1, duration: 0.3 });
      tl.to(st, { mode: 1, pos: 0, duration: 0.5, ease: "power1.inOut", onUpdate: update }, "<");
      LC.popIn(tl, OB[0], { duration: 0.2 });
      for (var q = 1; q <= 5; q++) { slideTo(q, 0.3); LC.popIn(tl, OB[q], { duration: 0.2 }); }
      tl.addLabel("s4");
      // s5: padding
      tl.to(OB, { opacity: 0, duration: 0.3 });
      tl.to(pads, { opacity: 1, duration: 0.3 }, "<");
      tl.to(st, { mode: 2, pos: -1, duration: 0.6, ease: "power1.inOut", onUpdate: update });
      LC.popIn(tl, OC[0], { duration: 0.2 });
      for (var r = 0; r <= 6; r++) { slideTo(r, 0.22); LC.popIn(tl, OC[r + 1], { duration: 0.15 }); }
      LC.popIn(tl, foot[1], { duration: 0.3 });
      tl.addLabel("s5");
      // s6: stride 2
      tl.to(OC.concat(foot[1]), { opacity: 0, duration: 0.3 });
      tl.to(pads, { opacity: 0, duration: 0.3 }, "<");
      tl.to(st, { mode: 3, pos: 0, duration: 0.6, ease: "power1.inOut", onUpdate: update });
      LC.popIn(tl, OD[0], { duration: 0.2 });
      slideTo(2, 0.45); LC.popIn(tl, OD[1], { duration: 0.2 });
      slideTo(4, 0.45); LC.popIn(tl, OD[2], { duration: 0.2 });
      LC.popIn(tl, foot[2], { duration: 0.3 });
      tl.addLabel("s6");
      return tl;
    }
  };
})();
