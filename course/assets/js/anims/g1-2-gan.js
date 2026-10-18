/* G1.2: a GAN on the two-moons toy, schematically. Real data is blue; the generator's
   fakes are orange. The discriminator's decision boundary is drawn as a dashed line.
   Positions are illustrative (not a trained GAN), chosen to show the dynamics. */
(function () {
  var LC = window.LC, G = LC.g1;

  LC.anims["g1-2-gan"] = {
    title: "A GAN's tug of war, on the two-moons toy",
    steps: [
      "The <strong>real data</strong>: points on two moons. The generator never sees these directly; it only hears from the discriminator.",
      "The <strong>generator</strong> $G$ turns random noise $z$ into points. At the start its fakes (orange) look nothing like the data.",
      "The <strong>discriminator</strong> $D$ learns to tell real from fake. Its decision boundary (the dark line) puts the fakes on the <em>fake</em> side.",
      "The generator takes a step to <strong>fool $D$</strong>: it follows $D$'s gradient, moving its fakes toward where $D$ says “real”.",
      "$D$ retrains and draws a new boundary; $G$ moves again. The two take turns, each step a little gradient descent on its own loss.",
      "At the ideal end point the fakes match the data and $D(x) = \\tfrac12$ everywhere: it can only guess. In practice this balance is fragile.",
      "<strong>Mode collapse</strong> (an unlucky run): $G$ finds that one moon fools $D$ and puts <em>all</em> its fakes there. $D$ catches on, $G$ hops to the other moon, and the chase can go round and round."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 322 } : { w: 640, h: 360 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact", W = ctx.w;
      var box = compact ? { x: 10, y: 24, w: 340, h: 255 } : { x: 10, y: 44, w: 400, h: 300 };
      var fr = G.frame(svg, box, { moons: false });
      var r = compact ? 2.6 : 3;
      var real = G.data(60, 31, null);
      var N = 50, rr = G.rng(77), start = [];
      while (start.length < N) { var p = [-1.55 + 0.25 * G.gauss(rr), -1.35 + 0.25 * G.gauss(rr)]; if (p[1] > -2.0 && p[0] > -2.3) start.push(p); }
      var target = G.data(N, 52, null), collapse = G.data(N, 53, 0);
      function byX(a, b) { return a[0] - b[0]; }
      start.sort(byX); target.sort(byX); collapse.sort(byX);
      var realG = S("g", { "clip-path": fr.clip }, svg), fakeG = S("g", { "clip-path": fr.clip }, svg);
      G.dots(realG, real, fr, "f-blue", r);
      var fakes = G.dots(fakeG, start, fr, "f-orange", r + 0.4);
      fakeG.style.opacity = 0;
      var st = { u: 0, c: 0 };
      function pos(i) {
        var a = start[i], b = target[i], c = collapse[i];
        var x = a[0] + (b[0] - a[0]) * st.u, y = a[1] + (b[1] - a[1]) * st.u;
        return [x + (c[0] - x) * st.c, y + (c[1] - y) * st.c];
      }
      function render() { for (var i = 0; i < N; i++) { var q = pos(i); fakes[i].setAttribute("cx", fr.sx(q[0]).toFixed(1)); fakes[i].setAttribute("cy", fr.sy(q[1]).toFixed(1)); } }
      render();

      // legend (below the plot on phones, above it on wide)
      var ly = compact ? 302 : 30;
      S("circle", { cx: box.x + 8, cy: ly - 4, r: 4, class: "f-blue" }, svg);
      S("text", { x: box.x + 18, y: ly, class: "t t-sm", text: "real data" }, svg);
      var legF = [S("circle", { cx: box.x + 110, cy: ly - 4, r: 4, class: "f-orange" }, svg),
        S("text", { x: box.x + 120, y: ly, class: "t t-sm", text: "fakes from G" }, svg)];
      var legD = [S("path", { d: "M" + (box.x + 222) + " " + (ly - 4) + "h18", class: "s-ink", "stroke-width": 2.5 }, svg),
        S("text", { x: box.x + 246, y: ly, class: "t t-sm", text: compact ? "D's boundary" : "D's boundary" }, svg)];
      legF.concat(legD).forEach(function (e) { e.style.opacity = 0; });

      // wide: a small block diagram of who sees what
      var gBox = null, dBox = null, dia = [];
      if (!compact) {
        var cx = 530;
        function blk(y, label, sub) {
          var rc = S("rect", { x: cx - 64, y: y, width: 128, height: 40, rx: 9, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, svg);
          S("text", { x: cx, y: y + 17, class: "t t-sm t-mid", "font-weight": 650, text: label }, svg);
          S("text", { x: cx, y: y + 32, class: "t t-sm t-mid t-muted", text: sub }, svg);
          return rc;
        }
        function arr(x1, y1, x2, y2) {
          var a = S("path", { d: "M" + x1 + " " + y1 + "L" + x2 + " " + y2 + "M" + (x2 - 5) + " " + (y2 - 7) + "L" + x2 + " " + y2 + "L" + (x2 + 5) + " " + (y2 - 7), class: "s-ink", "stroke-width": 1.8 }, svg);
          return a;
        }
        dia.push(S("text", { x: cx, y: 72, class: "t t-sm t-mid", text: "noise z ~ N(0, I)" }, svg));
        dia.push(arr(cx, 80, cx, 100));
        gBox = blk(104, "G  generator", "makes fakes");
        dia.push(arr(cx, 148, cx, 178));
        dia.push(S("text", { x: cx + 10, y: 168, class: "t t-sm t-orange", text: "fake x" }, svg));
        dia.push(S("text", { x: cx - 62, y: 168, class: "t t-sm t-blue", text: "real x" }, svg));
        dBox = blk(182, "D  discriminator", "real or fake?");
        dia.push(arr(cx, 226, cx, 248));
        dia.push(S("text", { x: cx, y: 266, class: "t t-sm t-mid", text: "D(x) = P(real)" }, svg));
        dia.push(S("text", { x: cx, y: 300, class: "t t-sm t-mid t-muted", text: "G's gradient flows back" }, svg));
        dia.push(S("text", { x: cx, y: 318, class: "t t-sm t-mid t-muted", text: "through D's judgement" }, svg));
      }

      function line(pts) { return S("path", { d: pts.map(function (p, i) { return (i ? "L" : "M") + fr.sx(p[0]).toFixed(1) + " " + fr.sy(p[1]).toFixed(1); }).join(""), class: "s-ink", "stroke-width": 2, fill: "none" }, svg); }
      var b1 = line([[-3, -0.5], [-1.5, -0.62], [-0.65, -1.2], [-0.3, -2.25]]);
      var b2 = line([[-3, 0.15], [-1.15, -0.25], [-0.3, -1.05], [0.15, -2.25]]);
      var lblY = compact ? 2.0 : 2.0;
      var t1 = S("text", { x: fr.sx(-2.9), y: fr.sy(-2.08), class: "t t-sm t-orange", text: "D: fake" }, svg);
      var t2 = S("text", { x: fr.sx(1.0), y: fr.sy(-1.95), class: "t t-sm t-blue t-mid", text: "D: real" }, svg);
      var half = S("text", { x: fr.sx(0), y: fr.sy(lblY), class: "t t-sm t-mid", text: "D(x) = ½ everywhere" }, svg);
      var coll = S("text", { x: fr.sx(0), y: fr.sy(-1.95), class: "t t-sm t-mid t-orange", text: "every fake on one moon" }, svg);
      [t1, t2, half, coll].forEach(function (e) { e.style.opacity = 0; });
      // gradient arrows for step 3
      var arrows = S("g", {}, svg);
      [3, 12, 22, 31, 40, 47].forEach(function (i) {
        var a = start[i], b = target[i], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
        var x1 = fr.sx(a[0]), y1 = fr.sy(a[1]), x2 = fr.sx(a[0] + 0.55 * dx / L), y2 = fr.sy(a[1] + 0.55 * dy / L);
        var ang = Math.atan2(y2 - y1, x2 - x1);
        S("path", { d: "M" + x1 + " " + y1 + "L" + x2 + " " + y2 + "M" + (x2 - 7 * Math.cos(ang - 0.5)) + " " + (y2 - 7 * Math.sin(ang - 0.5)) + "L" + x2 + " " + y2 + "L" + (x2 - 7 * Math.cos(ang + 0.5)) + " " + (y2 - 7 * Math.sin(ang + 0.5)), class: "s-orange", "stroke-width": 2 }, arrows);
      });
      arrows.style.opacity = 0;

      var tl = gsap.timeline();
      tl.addLabel("s0", 0);
      LC.popIn(tl, [fakeG].concat(legF), { duration: 0.5 });
      if (gBox) tl.to(gBox, { attr: { stroke: "var(--a-orange)" }, duration: 0.3 }, "<");
      tl.addLabel("s1");
      LC.drawIn(tl, b1, { duration: 0.8 });
      LC.popIn(tl, [t1, t2].concat(legD), { duration: 0.4 });
      if (dBox) { tl.to(gBox, { attr: { stroke: "var(--line)" }, duration: 0.3 }, "<"); tl.to(dBox, { attr: { stroke: "var(--a-orange)" }, duration: 0.3 }, "<"); }
      tl.addLabel("s2");
      LC.popIn(tl, arrows, { duration: 0.3 });
      if (dBox) { tl.to(dBox, { attr: { stroke: "var(--line)" }, duration: 0.3 }, "<"); tl.to(gBox, { attr: { stroke: "var(--a-orange)" }, duration: 0.3 }, "<"); }
      tl.to(st, { u: 0.5, duration: 1.2, ease: "power1.inOut", onUpdate: render });
      tl.to(arrows, { opacity: 0, duration: 0.3 }, "-=0.3");
      tl.addLabel("s3");
      tl.to(b1, { opacity: 0, duration: 0.3 });
      LC.drawIn(tl, b2, { duration: 0.8 });
      tl.to(st, { u: 0.85, duration: 1.0, ease: "power1.inOut", onUpdate: render });
      tl.addLabel("s4");
      tl.to([b2, t1, t2], { opacity: 0, duration: 0.3 });
      tl.to(st, { u: 1, duration: 0.8, ease: "power1.inOut", onUpdate: render }, "<");
      LC.popIn(tl, half, { duration: 0.4 });
      tl.addLabel("s5");
      tl.to(half, { opacity: 0, duration: 0.3 });
      tl.to(st, { c: 1, duration: 1.3, ease: "power1.inOut", onUpdate: render });
      LC.popIn(tl, coll, { duration: 0.4 });
      tl.addLabel("s6");
      return tl;
    }
  };
})();
