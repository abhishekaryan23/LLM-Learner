/* G1.3: DDPM on the two-moons toy. Forward: x_t = sqrt(ab_t) x0 + sqrt(1-ab_t) eps with
   the linear schedule (1e-4 → 0.02, T = 1000). Reverse: DDPM ancestral sampling with
   the exact noise predictor of the toy data (see g1-toy.js). */
(function () {
  var LC = window.LC, G = LC.g1;
  function abAt(t) { var i = Math.floor(t), r = t - i; return i >= G.T ? G.AB[G.T] : G.AB[i] + (G.AB[i + 1] - G.AB[i]) * r; }

  LC.anims["g1-3-diffusion"] = {
    title: "Diffusion: noise the data, then learn to walk back",
    steps: [
      "Our toy “images” are 2-D points lying on <strong>two moons</strong>. A real image is the same idea with about 800,000 numbers instead of 2.",
      "<strong>Forward process</strong>, $t = 100$: every point becomes $\\sqrt{\\bar\\alpha_t}\\,x_0 + \\sqrt{1-\\bar\\alpha_t}\\,\\varepsilon$. With $\\bar\\alpha_{100} \\approx 0.90$ the moons are only slightly shrunk and blurred.",
      "$t = 250$: $\\bar\\alpha_t \\approx 0.52$, about half signal and half noise by variance. The moons are hard to see.",
      "$t = 1000$: $\\bar\\alpha_{1000} \\approx 0.00004$. Only noise is left, a standard Gaussian blob. Destroying data is easy and needs <strong>no learning</strong>.",
      "<strong>Training</strong>: take a data point $x_0$, pick a random $t$ and noise $\\varepsilon$, and jump straight to $x_t$. The network sees only $x_t$ and $t$ and must <strong>predict $\\varepsilon$</strong>; the loss is the squared error.",
      "<strong>Sampling</strong> starts from fresh noise at $t = 1000$. Each step removes a little predicted noise and adds back a smaller dose of fresh noise. Here we are at $t = 500$.",
      "$t = 100$: the two moons have formed. The last steps mostly sharpen the details.",
      "$t = 0$: <strong>new samples</strong> on the moons, not copies of the training points. Here the noise predictor is exact (the toy data has a closed form); a real model learns it with a network."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 372 } : { w: 640, h: 364 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact", W = ctx.w;
      var box = compact ? { x: 10, y: 34, w: 340, h: 255 } : { x: 10, y: 44, w: 400, h: 300 };
      var fr = G.frame(svg, box);
      var r = compact ? 2.6 : 3;
      var X0 = G.data(70, 11, null);
      var EPS = G.noise(70, 12);
      var Z = G.noise(70, 21);
      var TR = G.ddpm(Z, 5, 10);              // 101 frames: t = 1000, 990, ..., 0
      var fwdG = S("g", { "clip-path": fr.clip }, svg), revG = S("g", { "clip-path": fr.clip }, svg);
      var fwd = G.dots(fwdG, X0, fr, "f-blue", r);
      var rev = G.dots(revG, Z, fr, "f-orange", r);
      revG.style.opacity = 0;

      // readouts
      var tTxt = S("text", { x: box.x, y: box.y - 12, class: "t t-sm t-mono", text: "" }, svg);
      var cTxt = compact ? S("text", { x: W / 2, y: 364, class: "t t-sm t-mono t-mid", text: "" }, svg) : null;
      var phase = S("text", { x: compact ? W / 2 : box.x + box.w, y: compact ? 342 : box.y - 12, class: "t t-sm t-muted " + (compact ? "t-mid" : "t-end"), text: "" }, svg);
      // progress track (compact) or the schedule chart (wide)
      var marker, mline, chart = {};
      if (compact) {
        var ty = 314, tx0 = 48, tx1 = W - 48;
        S("line", { x1: tx0, x2: tx1, y1: ty, y2: ty, class: "s-axis" }, svg);
        S("text", { x: tx0 - 14, y: ty + 4, class: "t t-sm t-muted t-end", text: "t = 0" }, svg);
        S("text", { x: tx1 + 14, y: ty + 4, class: "t t-sm t-muted", text: "T" }, svg);
        marker = S("circle", { cx: tx0, cy: ty, r: 6, class: "f-orange", stroke: "var(--a-ink)", "stroke-width": 1.5 }, svg);
        chart.x = function (t) { return tx0 + (tx1 - tx0) * t / G.T; };
      } else {
        var cx0 = 462, cx1 = 626, cyT = 92, cyB = 300;
        chart.x = function (t) { return cx0 + (cx1 - cx0) * t / G.T; };
        chart.y = function (v) { return cyB - (cyB - cyT) * v; };
        S("text", { x: 440, y: 32, class: "t t-sm t-blue", text: "— signal weight √ᾱₜ" }, svg);
        S("text", { x: 440, y: 52, class: "t t-sm t-orange", text: "— noise weight √(1−ᾱₜ)" }, svg);
        S("path", { d: "M" + cx0 + " " + cyT + "V" + cyB + "H" + cx1, class: "s-axis" }, svg);
        S("text", { x: cx0 - 6, y: chart.y(1) + 4, class: "t t-sm t-muted t-end", text: "1" }, svg);
        S("text", { x: cx0 - 6, y: cyB + 4, class: "t t-sm t-muted t-end", text: "0" }, svg);
        [0, 500, 1000].forEach(function (t) { S("text", { x: chart.x(t), y: cyB + 18, class: "t t-sm t-muted t-mid", text: t }, svg); });
        S("text", { x: cx1, y: cyB + 38, class: "t t-sm t-muted t-end", text: "step t →" }, svg);
        S("path", { d: LC.fnPath(function (t) { return Math.sqrt(abAt(t)); }, 0, 1000, chart.x, chart.y, 80), class: "s-blue", "stroke-width": 2.5 }, svg);
        S("path", { d: LC.fnPath(function (t) { return Math.sqrt(1 - abAt(t)); }, 0, 1000, chart.x, chart.y, 80), class: "s-orange", "stroke-width": 2.5 }, svg);
        mline = S("line", { x1: cx0, x2: cx0, y1: cyT - 6, y2: cyB, class: "s-ink", "stroke-dasharray": "3 4", "stroke-width": 1.5 }, svg);
      }

      // training illustration (step 4): one point, its scaled copy and the noise arrow
      var TI = 3, TT = 250, trn = S("g", {}, svg);
      var ab0 = G.AB[TT], p0 = X0[TI], ps = [Math.sqrt(ab0) * p0[0], Math.sqrt(ab0) * p0[1]];
      var pt = [ps[0] + Math.sqrt(1 - ab0) * EPS[TI][0], ps[1] + Math.sqrt(1 - ab0) * EPS[TI][1]];
      var arrow = S("path", { d: "M" + fr.sx(ps[0]) + " " + fr.sy(ps[1]) + "L" + fr.sx(pt[0]) + " " + fr.sy(pt[1]), class: "s-orange", "stroke-width": 2.5 }, trn);
      var ang = Math.atan2(fr.sy(pt[1]) - fr.sy(ps[1]), fr.sx(pt[0]) - fr.sx(ps[0])), hx = fr.sx(pt[0]), hy = fr.sy(pt[1]);
      var head = S("path", { d: "M" + (hx - 9 * Math.cos(ang - 0.5)) + " " + (hy - 9 * Math.sin(ang - 0.5)) + "L" + hx + " " + hy + "L" + (hx - 9 * Math.cos(ang + 0.5)) + " " + (hy - 9 * Math.sin(ang + 0.5)), class: "s-orange", "stroke-width": 2.5 }, trn);
      var c0 = S("circle", { cx: fr.sx(p0[0]), cy: fr.sy(p0[1]), r: 6, class: "f-blue", stroke: "var(--a-ink)", "stroke-width": 1.5 }, trn);
      var cS = S("circle", { cx: fr.sx(ps[0]), cy: fr.sy(ps[1]), r: 4, class: "f-ink" }, trn);
      var cT = S("circle", { cx: fr.sx(pt[0]), cy: fr.sy(pt[1]), r: 6, class: "f-orange", stroke: "var(--a-ink)", "stroke-width": 1.5 }, trn);
      var l0 = S("text", { x: fr.sx(p0[0]), y: fr.sy(p0[1]) - 12, class: "t t-sm t-mid", text: "x₀ (data)" }, trn);
      var lT = S("text", { x: fr.sx(pt[0]) + 10, y: fr.sy(pt[1]) + 18, class: "t t-sm", text: "x_t (t = 250)" }, trn);
      var lE = S("text", { x: (fr.sx(ps[0]) + fr.sx(pt[0])) / 2 + 12, y: (fr.sy(ps[1]) + fr.sy(pt[1])) / 2, class: "t t-sm t-orange", text: compact ? "target: ε" : "noise ε: the target" }, trn);
      trn.style.opacity = 0;

      var st = { f: 0, r: 0, dim: 1 };
      function render() {
        var ab = abAt(st.f), sa = Math.sqrt(ab), s1 = Math.sqrt(1 - ab);
        for (var i = 0; i < fwd.length; i++) {
          fwd[i].setAttribute("cx", fr.sx(sa * X0[i][0] + s1 * EPS[i][0]).toFixed(1));
          fwd[i].setAttribute("cy", fr.sy(sa * X0[i][1] + s1 * EPS[i][1]).toFixed(1));
        }
        for (i = 0; i < rev.length; i++) {
          var p = G.along(TR[i], st.r);
          rev[i].setAttribute("cx", fr.sx(p[0]).toFixed(1)); rev[i].setAttribute("cy", fr.sy(p[1]).toFixed(1));
        }
        fwdG.setAttribute("opacity", st.dim);
        var t = st.r > 0 ? G.T * (1 - st.r) : st.f, abt = abAt(t);
        tTxt.textContent = "t = " + Math.round(t) + (compact ? "" : "   ᾱₜ = " + (abt < 0.001 ? abt.toExponential(1) : abt.toFixed(3)));
        if (cTxt) cTxt.textContent = "signal √ᾱ = " + Math.sqrt(abt).toFixed(2) + " · noise √(1−ᾱ) = " + Math.sqrt(1 - abt).toFixed(2);
        phase.textContent = st.r > 0 ? "← sampling: removing noise" : (st.f > 0 ? "forward: adding noise →" : "the data");
        if (marker) marker.setAttribute("cx", chart.x(t).toFixed(1));
        if (mline) { mline.setAttribute("x1", chart.x(t).toFixed(1)); mline.setAttribute("x2", chart.x(t).toFixed(1)); }
      }
      render();
      var tl = gsap.timeline();
      tl.addLabel("s0", 0);
      tl.to(st, { f: 100, duration: 1.0, ease: "power1.inOut", onUpdate: render }, "+=0.01");
      tl.addLabel("s1");
      tl.to(st, { f: 250, duration: 1.0, ease: "power1.inOut", onUpdate: render });
      tl.addLabel("s2");
      tl.to(st, { f: 1000, duration: 1.4, ease: "power1.inOut", onUpdate: render });
      tl.addLabel("s3");
      tl.to(st, { f: 250, dim: 0.18, duration: 0.8, ease: "power1.inOut", onUpdate: render });
      LC.popIn(tl, trn, { duration: 0.4 });
      tl.addLabel("s4");
      tl.to(trn, { opacity: 0, duration: 0.3 });
      tl.to(st, { dim: 0, duration: 0.3, onUpdate: render }, "<");
      tl.to(revG, { opacity: 1, duration: 0.3 }, "<");
      tl.to(st, { r: 0.5, duration: 1.4, ease: "power1.inOut", onUpdate: render });
      tl.addLabel("s5");
      tl.to(st, { r: 0.9, duration: 1.2, ease: "power1.inOut", onUpdate: render });
      tl.addLabel("s6");
      tl.to(st, { r: 1, duration: 0.8, ease: "power1.out", onUpdate: render });
      tl.addLabel("s7");
      return tl;
    }
  };
})();
