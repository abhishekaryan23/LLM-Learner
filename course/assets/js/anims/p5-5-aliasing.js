/* P5.5: a 4 Hz sine (amplitude 1, period 0.25 s), sampled at fs = 20 Hz over 0.5 s (11 samples).
   A 24 Hz sine gives exactly the same samples: sin(2π·24·k/20) = sin(2π·4·k/20 + 2π·k).
   Nyquist frequency fs/2 = 10 Hz; 24 Hz folds to |24 − 20| = 4 Hz. */
(function () {
  var LC = window.LC;
  var F = 4, FA = 24, FS = 20, T1 = 0.5;

  LC.anims["p5-5-aliasing"] = {
    title: "Sampling, and the aliasing trap",
    steps: [
      "A pure tone is a <strong>sinusoid</strong> $x(t) = A\\sin(2\\pi f t + \\varphi)$. Here the <strong>amplitude</strong> $A = 1$ and the <strong>frequency</strong> $f = 4$ Hz: 4 cycles per second, so one cycle (the <strong>period</strong>) lasts $1/f = 0.25$ s.",
      "The <strong>phase</strong> $\\varphi$ slides the wave sideways without changing its pitch. The dashed wave has $\\varphi = \\pi/2$, a quarter-cycle shift.",
      "A computer can't store a continuous wave. It <strong>samples</strong> it: $f_s = 20$ readings per second, one every 0.05 s.",
      "The dots are all that's kept. Here there are 5 samples per cycle, enough to pin the 4 Hz wave down.",
      "But a 24 Hz wave passes through <strong>exactly the same dots</strong>. From the samples alone, 24 Hz and 4 Hz are indistinguishable: that's <strong>aliasing</strong>.",
      "The rule (Nyquist, Shannon): sampling at $f_s$ can only represent frequencies below $f_s/2$, the <strong>Nyquist frequency</strong> (here 10 Hz). Anything above folds back down: 24 Hz shows up at $|24 - 20| = 4$ Hz."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 300 } : { w: 640, h: 300 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact", W = ctx.w;
      var m = compact ? { l: 30, r: 14, t: 52, h: 132 } : { l: 40, r: 24, t: 52, h: 132 };
      var mid = m.t + m.h / 2, pw = W - m.l - m.r;
      function sx(t) { return m.l + t / T1 * pw; }
      function sy(v) { return mid - v / 1.25 * (m.h / 2); }
      var tl = gsap.timeline();
      S("text", { x: 4, y: 16, class: "t t-sm t-muted", text: "↑ x(t)" }, svg);
      S("line", { x1: m.l, x2: W - m.r, y1: mid, y2: mid, class: "s-axis" }, svg);
      S("line", { x1: m.l, x2: m.l, y1: m.t, y2: m.t + m.h, class: "s-axis" }, svg);
      [[1, "1"], [-1, "−1"]].forEach(function (p) {
        S("line", { x1: m.l, x2: W - m.r, y1: sy(p[0]), y2: sy(p[0]), class: "s-grid" }, svg);
        S("text", { x: m.l - 5, y: sy(p[0]) + 4, class: "t t-sm t-muted t-end", text: p[1] }, svg);
      });
      [0, 0.25, 0.5].forEach(function (t) { S("text", { x: sx(t), y: m.t + m.h + 16, class: "t t-sm t-muted " + (t === 0.5 ? "t-end" : "t-mid"), text: t ? t + " s" : "0" }, svg); });

      var wave = S("path", { d: LC.fnPath(function (t) { return Math.sin(2 * Math.PI * F * t); }, 0, T1, sx, sy, 200), class: "s-blue" }, svg);
      // s0 annotations: amplitude and period (period bracket in its own row above the plot)
      var ann = S("g", {}, svg);
      var ax = sx(1 / (4 * F));
      S("path", { d: "M" + ax + " " + mid + "V" + (sy(1) + 2) + "M" + (ax - 5) + " " + (sy(1) + 8) + "L" + ax + " " + (sy(1) + 2) + "L" + (ax + 5) + " " + (sy(1) + 8), class: "s-ink", "stroke-width": 1.8 }, ann);
      S("text", { x: ax, y: sy(-0.3) + 4, class: "t t-sm t-mid", "font-weight": 650, text: "A = 1" }, ann);   // below the axis: the curve is high here
      var by = m.t - 14;
      S("path", { d: "M" + sx(0) + " " + (by - 5) + "V" + (by + 5) + "M" + sx(0) + " " + by + "H" + sx(0.25) + "M" + sx(0.25) + " " + (by - 5) + "V" + (by + 5), class: "s-ink", "stroke-width": 1.5 }, ann);
      S("text", { x: sx(0.25) + 8, y: by + 4, class: "t t-sm", "font-weight": 650, text: "period 1/f = 0.25 s" }, ann);
      tl.addLabel("s0", 0);

      // s1: phase
      var ph = S("path", { d: LC.fnPath(function (t) { return Math.sin(2 * Math.PI * F * t + Math.PI / 2); }, 0, T1, sx, sy, 200), class: "s-blue", "stroke-width": 2, "stroke-dasharray": "5 5", opacity: 0.8 }, svg);
      ph.style.opacity = 0;
      var phL = S("text", { x: sx(0.25) + 8, y: by + 4, class: "t t-sm t-blue", "font-weight": 650, text: "dashed: phase φ = π/2" }, svg);
      phL.style.opacity = 0;
      tl.to(ann, { opacity: 0, duration: 0.3 });
      tl.to([ph, phL], { opacity: 1, duration: 0.5 });
      tl.addLabel("s1");

      // s2: samples
      var samp = S("g", {}, svg);
      for (var k = 0; k <= FS * T1; k++) {
        var t = k / FS, v = Math.sin(2 * Math.PI * F * t);
        S("line", { x1: sx(t), x2: sx(t), y1: mid, y2: sy(v), class: "s-ink", "stroke-width": 1.2, opacity: 0.6 }, samp);
        S("circle", { cx: sx(t), cy: sy(v), r: 4.5, class: "f-ink", stroke: "var(--a-paper)", "stroke-width": 1.5 }, samp);
      }
      samp.style.opacity = 0;
      var fsL = S("text", { x: sx(0) + 2, y: by + 4, class: "t t-sm", "font-weight": 650, text: "fs = 20 samples per second" }, svg);
      fsL.style.opacity = 0;
      tl.to([ph, phL], { opacity: 0, duration: 0.3 });
      tl.to([samp, fsL], { opacity: 1, duration: 0.5 });
      tl.addLabel("s2");

      // s3: only the samples remain
      tl.to(wave, { opacity: 0.15, duration: 0.5 });
      tl.addLabel("s3");

      // s4: the alias
      var alias = S("path", { d: LC.fnPath(function (t) { return Math.sin(2 * Math.PI * FA * t); }, 0, T1, sx, sy, 600), class: "s-orange", "stroke-width": 2 }, svg);
      svg.appendChild(samp);   // keep the dots on top
      var alL = S("text", { x: W - m.r, y: by + 4, class: "t t-sm t-orange t-end", "font-weight": 650, text: "24 Hz, same dots" }, svg);
      alL.style.opacity = 0;
      tl.to(wave, { opacity: 1, duration: 0.3 });
      LC.drawIn(tl, alias, { duration: 1.4, ease: "none" });
      LC.popIn(tl, alL, { duration: 0.3 });
      tl.addLabel("s4");

      // s5: frequency axis with the Nyquist limit and the fold
      var fy = compact ? 262 : 262, f0 = m.l, f1 = W - m.r, FMAX = 25;
      function fx(f) { return f0 + f / FMAX * (f1 - f0); }
      var fg = S("g", {}, svg);
      S("rect", { x: fx(10), y: fy - 16, width: fx(FMAX) - fx(10), height: 16, class: "f-faint", "fill-opacity": 0.5 }, fg);
      S("line", { x1: f0, x2: f1, y1: fy, y2: fy, class: "s-axis" }, fg);
      S("text", { x: fx(0), y: fy + 16, class: "t t-sm t-muted t-mid", text: "0" }, fg);
      S("text", { x: fx(10), y: fy + 16, class: "t t-sm t-mid", "font-weight": 650, text: "fs/2 = 10" }, fg);
      S("text", { x: fx(20), y: fy + 16, class: "t t-sm t-muted t-mid", text: "20 Hz" }, fg);
      S("line", { x1: fx(10), x2: fx(10), y1: fy - 16, y2: fy, class: "s-ink", "stroke-width": 2 }, fg);
      S("circle", { cx: fx(4), cy: fy, r: 6, class: "f-blue" }, fg);
      S("circle", { cx: fx(24), cy: fy, r: 6, class: "f-orange" }, fg);
      var arc = S("path", { d: "M" + fx(24) + " " + (fy - 8) + "C" + fx(20) + " " + (fy - 46) + " " + fx(8) + " " + (fy - 46) + " " + (fx(4) + 4) + " " + (fy - 9), class: "s-orange", "stroke-width": 2, fill: "none" }, svg);
      var arcHead = S("path", { d: "M" + (fx(4) - 2) + " " + (fy - 18) + "L" + (fx(4) + 4) + " " + (fy - 9) + "L" + (fx(4) + 13) + " " + (fy - 15), class: "s-orange", "stroke-width": 2 }, svg);
      fg.style.opacity = 0; arcHead.style.opacity = 0;
      var foldL = S("text", { x: fx(14), y: fy - 46, class: "t t-sm t-orange t-mid", "font-weight": 650, text: "24 → 4 Hz" }, svg);
      foldL.style.opacity = 0;
      tl.to(fg, { opacity: 1, duration: 0.5 });
      LC.drawIn(tl, arc, { duration: 0.8 });
      LC.popIn(tl, [arcHead, foldL], { duration: 0.3 });
      tl.addLabel("s5");
      return tl;
    }
  };
})();
