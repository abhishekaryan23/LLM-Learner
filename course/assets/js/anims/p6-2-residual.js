/* P6.2: gradients flowing back through 8 plain layers (each scales by 0.5) vs 8 residual
   blocks (each scales by 1 + dF/dx, with small dF/dx). Bars = gradient magnitude that
   reaches each layer's input; the last bar is the loss itself (1.0). */
(function () {
  var LC = window.LC;
  var NB = 8;
  var DF = [0.06, -0.08, 0.05, -0.04, 0.07, -0.05, 0.03, -0.06];
  function prodFrom(f, i) { var p = 1; for (var k = i; k < NB; k++) p *= f[k]; return p; }
  var PLAIN = [], RES = [];
  for (var i = 0; i < NB; i++) {
    PLAIN.push(prodFrom([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], i));
    RES.push(prodFrom(DF.map(function (d) { return 1 + d; }), i));
  }
  // PLAIN[0] = 0.0039, RES[0] = 0.967

  LC.anims["p6-2-residual"] = {
    title: "Gradients through a plain stack vs a residual stack",
    steps: [
      "A <strong>plain</strong> stack of 8 layers: each one replaces its input with a new output, $x \\to F(x)$. The loss $L$ sits at the end.",
      "Backprop multiplies one local derivative per layer. If each is about 0.5, the gradient <strong>halves at every layer</strong>: the first layer gets $0.5^8 \\approx 0.004$ of it. With 50 layers it would be about $10^{-15}$.",
      "A <strong>residual</strong> stack: each block adds its output to its input, $y = x + F(x)$. The arcs are the <strong>skip connections</strong>. They have no weights.",
      "Now each block's derivative is $1 + \\partial F/\\partial x$. With small $\\partial F/\\partial x$ (here between −0.08 and +0.07) the gradient reaching layer 1 is still about <strong>0.97</strong>.",
      "Follow only the arcs: a path from the loss to the first layer whose derivative is <strong>exactly 1</strong>. If every $F$ starts near zero, a very deep ResNet starts out like a shallow network and learns small corrections."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 334 } : { w: 640, h: 384 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact", W = ctx.w;
      var g = compact
        ? { x0: 26, bw: 28, gap: 8, bh: 28, xLbl: 10, barMax: 56, barW: 14, fs: "t t-sm" }
        : { x0: 64, bw: 46, gap: 18, bh: 38, xLbl: 42, barMax: 64, barW: 22, fs: "t" };
      var secs = compact
        ? [{ title: 18, top: 28, base: 124, lbl: 140 }, { title: 172, top: 206, base: 300, lbl: 316 }]
        : [{ title: 22, top: 36, base: 152, lbl: 170 }, { title: 210, top: 246, base: 352, lbl: 370 }];
      function bx(i) { return g.x0 + i * (g.bw + g.gap); }      // i = NB is the loss box
      function bcx(i) { return bx(i) + g.bw / 2; }
      var tl = gsap.timeline();

      function stack(sec, residual) {
        var grp = S("g", {}, svg);
        var midY = sec.top + g.bh / 2;
        S("text", { x: 4, y: sec.title, class: "t t-sm", "font-weight": 620, text: residual ? "residual: y = x + F(x)" : "plain: x → F(x)" }, grp);
        var wire = S("line", { x1: g.xLbl + 8, x2: bx(NB), y1: midY, y2: midY, class: "s-axis" }, grp);
        S("text", { x: g.xLbl, y: midY + 4, class: "t t-sm t-muted t-mid", text: "x" }, grp);
        var blocks = [];
        for (var i = 0; i < NB; i++) {
          var b = S("g", {}, grp);
          S("rect", { x: bx(i), y: sec.top, width: g.bw, height: g.bh, rx: 6, class: "f-surface", stroke: "var(--a-ink)", "stroke-width": 1.5 }, b);
          S("text", { x: bcx(i), y: midY + 4.5, class: g.fs + " t-mid t-nohalo", text: "F" }, b);
          blocks.push(b);
        }
        S("rect", { x: bx(NB), y: sec.top, width: g.bw, height: g.bh, rx: g.bh / 2, class: "f-surface2", stroke: "var(--a-orange)", "stroke-width": 2 }, grp);
        S("text", { x: bcx(NB), y: midY + 4.5, class: g.fs + " t-mid t-nohalo t-orange", text: "L" }, grp);
        S("line", { x1: bx(0) - 4, x2: bx(NB) + g.bw + 4, y1: sec.base, y2: sec.base, class: "s-grid" }, grp);
        var arcs = [];
        if (residual) {
          for (var k = 0; k < NB; k++) {
            var xa = bx(k) - g.gap / 2, xb = bx(k) + g.bw + g.gap / 2, h = compact ? 20 : 26;
            arcs.push(S("path", { d: "M" + xa + " " + midY + "C" + xa + " " + (sec.top - h) + " " + xb + " " + (sec.top - h) + " " + xb + " " + midY, class: "s-blue", "stroke-width": 2 }, grp));
          }
        }
        return { grp: grp, blocks: blocks, arcs: arcs, wire: wire };
      }
      function bars(sec, vals, cls) {
        var els = [], all = vals.concat([1]);
        all.forEach(function (v, i) {
          var r = S("rect", { x: bcx(i) - g.barW / 2, y: sec.base, width: g.barW, height: 0, rx: 2, class: i === NB ? "f-orange" : cls }, svg);
          els.push({ el: r, h: Math.max(1.5, v * g.barMax) });
        });
        return els;
      }
      function growBars(list) {
        for (var i = list.length - 1; i >= 0; i--) {
          var b = list[i];
          var base = +b.el.getAttribute("y");
          tl.to(b.el, { attr: { y: base - b.h, height: b.h }, duration: 0.25, ease: "power1.out" }, i === list.length - 1 ? "+=0.02" : "-=0.12");
        }
      }

      // s0: plain stack
      var A = stack(secs[0], false);
      tl.addLabel("s0", 0);

      // s1: plain gradients
      var gradA = S("text", { x: (bcx(0) + bcx(NB)) / 2, y: secs[0].lbl, class: "t t-sm t-orange t-mid", text: "← gradient flows back" }, svg);
      var pb = bars(secs[0], PLAIN, "f-blue");
      var la = S("text", { x: bcx(0), y: secs[0].lbl, class: "t t-sm t-mono t-mid", text: "0.004" }, svg);
      var la2 = S("text", { x: bcx(NB), y: secs[0].lbl, class: "t t-sm t-mono t-mid", text: "1.0" }, svg);
      LC.popIn(tl, gradA, { duration: 0.3 }, "+=0.02");
      growBars(pb);
      LC.popIn(tl, [la, la2], { duration: 0.3 });
      tl.addLabel("s1");

      // s2: residual stack
      var B = stack(secs[1], true);
      B.grp.style.opacity = 0;
      B.arcs.forEach(function (a) { a.style.opacity = 0; });
      tl.to(B.grp, { opacity: 1, duration: 0.4 }, "+=0.02");
      B.arcs.forEach(function (a, k) { LC.drawIn(tl, a, { duration: 0.3 }, k ? "<0.08" : "+=0.01"); });
      tl.addLabel("s2");

      // s3: residual gradients
      var gradB = S("text", { x: (bcx(0) + bcx(NB)) / 2, y: secs[1].lbl, class: "t t-sm t-orange t-mid", text: "← gradient flows back" }, svg);
      var rb = bars(secs[1], RES, "f-blue");
      var lb = S("text", { x: bcx(0), y: secs[1].lbl, class: "t t-sm t-mono t-mid", text: RES[0].toFixed(2) }, svg);
      var lb2 = S("text", { x: bcx(NB), y: secs[1].lbl, class: "t t-sm t-mono t-mid", text: "1.0" }, svg);
      LC.popIn(tl, gradB, { duration: 0.3 }, "+=0.02");
      growBars(rb);
      LC.popIn(tl, [lb, lb2], { duration: 0.3 });
      tl.addLabel("s3");

      // s4: the highway
      tl.to(B.blocks, { opacity: 0.25, duration: 0.4 }, "+=0.02");
      tl.to(A.grp, { opacity: 0.5, duration: 0.4 }, "<");
      tl.to(B.arcs, { attr: { "stroke-width": compact ? 4 : 5 }, duration: 0.4 }, "<");
      tl.addLabel("s4");
      return tl;
    }
  };
})();
