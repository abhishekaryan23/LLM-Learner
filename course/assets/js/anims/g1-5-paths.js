/* G1.5: paths from noise to data on the two-moons toy.
   Diffusion's per-pair path (VP): x = cos(phi) x1 + sin(phi) eps, an arc.
   Flow matching's per-pair path: x_t = (1-t) x0 + t x1, a straight segment.
   The learned ODE uses the exact marginal velocity E[x1 - x0 | x_t] (g1-toy.js);
   "reflow" re-pairs each noise point with its own ODE endpoint (idealized here). */
(function () {
  var LC = window.LC, G = LC.g1;

  LC.anims["g1-5-paths"] = {
    title: "Curved diffusion paths vs straight flow paths",
    steps: [
      "Orange dots are <strong>noise</strong> samples $x_0$; the grey bands are where the <strong>data</strong> $x_1$ lives. A generator must carry every noise point onto the data.",
      "Diffusion's training path for one (noise, image) pair is a <strong>curve</strong>: $\\sqrt{\\bar\\alpha}\\,x_1 + \\sqrt{1-\\bar\\alpha}\\,\\varepsilon$ sweeps an arc from the noise point to its data point (blue).",
      "Flow matching connects the same pairs with <strong>straight lines</strong> $x_t = (1-t)\\,x_0 + t\\,x_1$ and trains the network to predict the constant velocity $x_1 - x_0$.",
      "But pairs are <strong>random</strong>, so the lines cross. At a crossing the network can only learn the <em>average</em> direction, and the paths it actually follows (blue) <strong>bend</strong> instead.",
      "So a single Euler step fails: at $t = 0$ the average velocity points every sample at the <strong>mean of the data</strong>. All 60 samples land in one spot, the toy version of a blurry average image.",
      "<strong>Reflow</strong>: run the learned flow, then pair each noise point with <em>where it actually ended up</em> (orange lines). These new pairs don't cross much, so retraining on them gives much straighter paths.",
      "With nearly straight paths, <strong>one Euler step</strong> lands close to the data (shown here for an ideal reflowed model). That is the road to 1–4 step generators."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 326 } : { w: 640, h: 352 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact", W = ctx.w;
      var box = compact ? { x: 10, y: 24, w: 340, h: 255 } : { x: 10, y: 40, w: 400, h: 300 };
      var fr = G.frame(svg, box);
      var r = compact ? 2.6 : 3;
      var Z = G.noise(60, 515);
      var NP = 8, ZP = Z.slice(0, NP), XP = G.data(NP, 516, null);
      var ODE = G.euler(Z, 400);
      var END = ODE.map(function (t) { return t[t.length - 1]; });
      var E1 = G.euler(Z, 1).map(function (t) { return t[1]; });
      var paths = S("g", { "clip-path": fr.clip }, svg);
      var tl = gsap.timeline();

      // per-pair diffusion arcs and straight FM lines
      var arcs = ZP.map(function (z, i) {
        var tr = [];
        for (var k = 0; k <= 40; k++) { var ph = Math.PI / 2 * (1 - k / 40); tr.push([Math.cos(ph) * XP[i][0] + Math.sin(ph) * z[0], Math.cos(ph) * XP[i][1] + Math.sin(ph) * z[1]]); }
        return S("path", { d: G.polyline(tr, fr), class: "s-ink", "stroke-width": 1.8 }, paths);
      });
      var lines = ZP.map(function (z, i) { return S("path", { d: G.polyline([z, XP[i]], fr), class: "s-orange", "stroke-width": 2 }, paths); });
      var odes = ZP.map(function (z, i) { return S("path", { d: G.polyline(ODE[i], fr), class: "s-blue", "stroke-width": 2 }, paths); });
      var reflow = ZP.map(function (z, i) { return S("path", { d: G.polyline([z, END[i]], fr), class: "s-orange", "stroke-width": 2 }, paths); });
      var xDots = S("g", {}, svg);
      G.dots(xDots, XP, fr, "f-blue", r + 1.4);
      xDots.style.opacity = 0;
      var ptsG = S("g", { "clip-path": fr.clip }, svg);
      var pts = G.dots(ptsG, Z, fr, "f-orange", r);

      // labels: one caption-like tag under (compact) or beside (wide) the plot
      var tags = [];
      function tag(s, cls, i) {
        var t = compact ? S("text", { x: W / 2, y: 304, class: "t t-sm t-mid " + cls, text: s }, svg)
          : S("text", { x: 430, y: 74 + 26 * i, class: "t t-sm " + cls, text: s }, svg);
        t.style.opacity = 0; tags.push(t); return t;
      }
      var tA = tag(compact ? "diffusion pair path: an arc" : "— diffusion pair path: arc", "", 0);
      var tB = tag(compact ? "flow-matching pair path: a line" : "— flow-matching pair: straight", "t-orange", 1);
      var tC = tag(compact ? "learned flow: paths bend" : "— learned flow: paths bend", "t-blue", 2);
      var tD = tag(compact ? "1 Euler step: all land on the mean" : "1 Euler step → the data mean", "t-orange", 3);
      var tE = tag(compact ? "reflow: re-pair with the endpoints" : "— reflow: re-paired, straight", "t-orange", 4);
      var tF = tag(compact ? "after reflow: 1 step reaches the data" : "after reflow: 1 step works", "t-blue", 5);
      if (!compact) {
        S("text", { x: 430, y: 40, class: "t t-sm t-muted", text: "what each line shows" }, svg);
      }

      var st = { a: 0, b: 0 };
      function render() {
        for (var i = 0; i < pts.length; i++) {
          var x = Z[i][0] + st.a * (E1[i][0] - Z[i][0]) + st.b * (END[i][0] - Z[i][0]);
          var y = Z[i][1] + st.a * (E1[i][1] - Z[i][1]) + st.b * (END[i][1] - Z[i][1]);
          pts[i].setAttribute("cx", fr.sx(x).toFixed(1)); pts[i].setAttribute("cy", fr.sy(y).toFixed(1));
        }
      }
      render();
      function swap(out, inn) {
        if (compact && out) tl.to(out, { opacity: 0, duration: 0.25 });
        else if (out) tl.to(out, { opacity: 0.45, duration: 0.25 });
        LC.popIn(tl, inn, { duration: 0.35 }, compact ? undefined : "<");
      }
      tl.addLabel("s0", 0);
      tl.to(ptsG, { opacity: 0.35, duration: 0.3 }, "+=0.01");
      LC.popIn(tl, xDots, { duration: 0.3 }, "<");
      arcs.forEach(function (p, i) { LC.drawIn(tl, p, { duration: 0.6 }, i ? "<0.06" : undefined); });
      swap(null, tA);
      tl.addLabel("s1");
      tl.to(arcs, { opacity: 0.18, duration: 0.3 });
      lines.forEach(function (p, i) { LC.drawIn(tl, p, { duration: 0.5 }, i ? "<0.05" : undefined); });
      swap(tA, tB);
      tl.addLabel("s2");
      tl.to(arcs, { opacity: 0, duration: 0.3 });
      tl.to(lines, { opacity: 0.3, duration: 0.3 }, "<");
      tl.to(xDots, { opacity: 0, duration: 0.3 }, "<");
      odes.forEach(function (p, i) { LC.drawIn(tl, p, { duration: 0.7 }, i ? "<0.05" : undefined); });
      swap(tB, tC);
      tl.addLabel("s3");
      tl.to(lines.concat(odes), { opacity: 0, duration: 0.3 });
      tl.to(ptsG, { opacity: 1, duration: 0.3 }, "<");
      tl.to(st, { a: 1, duration: 1.0, ease: "power2.in", onUpdate: render });
      swap(tC, tD);
      tl.addLabel("s4");
      tl.to(st, { a: 0, duration: 0.6, ease: "power1.out", onUpdate: render });
      reflow.forEach(function (p, i) { LC.drawIn(tl, p, { duration: 0.5 }, i ? "<0.05" : undefined); });
      swap(tD, tE);
      tl.addLabel("s5");
      tl.to(reflow, { opacity: 0.35, duration: 0.3 });
      tl.to(st, { b: 1, duration: 1.0, ease: "power2.inOut", onUpdate: render });
      swap(tE, tF);
      tl.addLabel("s6");
      return tl;
    }
  };
})();
