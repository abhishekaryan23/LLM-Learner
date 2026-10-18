/* P3.1: one neuron (weighted sum + bias + ReLU), then a layer as a matrix multiply,
   then why stacking layers WITHOUT a nonlinearity collapses into a single layer.
   Numbers: x = [1, 2, 3], w = [0.4, -0.5, 0.3], b = 0.1  ->  z = 0.4 - 1.0 + 0.9 + 0.1 = 0.4, ReLU(0.4) = 0.4 */
(function () {
  var LC = window.LC;
  var X = [1, 2, 3], WTS = [0.4, -0.5, 0.3], B = 0.1;
  var PROD = X.map(function (x, i) { return x * WTS[i]; });
  var Z = PROD.reduce(function (a, b) { return a + b; }, 0) + B;   // 0.4
  function fmt(v) { v = Math.round(v * 100) / 100; return (v < 0 ? "−" : "") + Math.abs(v).toFixed(1); }

  LC.anims["p3-1-neuron"] = {
    title: "From one neuron to a layer, and why we need a bend",
    steps: [
      "A <strong>neuron</strong> takes some inputs, here three numbers $x = (1, 2, 3)$, and produces one output.",
      "Each input arrives through a connection with its own <strong>weight</strong>. Blue weights are positive, orange ones negative; thicker means bigger.",
      "The neuron multiplies each input by its weight and adds them up, plus a <strong>bias</strong>: $z = 0.4 - 1.0 + 0.9 + 0.1 = 0.4$. That's a dot product, $z = x\\cdot w + b$.",
      "Then a <strong>nonlinearity</strong> bends the result. ReLU keeps positives and zeroes negatives: $\\max(0, 0.4) = 0.4$. Had $z$ been $-0.5$, the output would be 0.",
      "A <strong>layer</strong> is many neurons reading the same inputs. Their weights stack into a matrix $W_1$ (3×4 here, one column per neuron), so the whole layer is one matrix multiply: $h = \\varphi(xW_1 + b_1)$.",
      "Stack another layer on top, $y = hW_2 + b_2$, and you have a <strong>multilayer perceptron</strong> (MLP). Data flows left to right; training tunes every weight.",
      "Remove the nonlinearity $\\varphi$ and the stack <strong>collapses</strong>: $(xW_1)W_2 = x(W_1W_2)$, a single matrix. Without the bends, a hundred linear layers are no more powerful than one."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 330 } : { w: 640, h: 330 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var sm = compact ? " t-sm" : "";
      var tl = gsap.timeline();

      /* ---------- scene 1: a single neuron ---------- */
      var s1 = S("g", {}, svg);
      var inX = compact ? 36 : 90, nX = compact ? 220 : 380, oX = compact ? 322 : 540;
      var inY = [96, 160, 224], nY = 160, rIn = 17, rN = 36, rO = 18;
      var headY = 40;
      S("text", { x: inX, y: headY, class: "t t-muted t-mid" + sm, text: "inputs" }, s1);
      S("text", { x: nX, y: headY, class: "t t-muted t-mid" + sm, text: "neuron" }, s1);
      var outHead = S("text", { x: oX, y: headY, class: "t t-muted t-mid" + sm, text: "output" }, s1);

      // edges (drawn first so nodes sit on top)
      var edges = inY.map(function (y, i) {
        var dx = nX - inX, dy = nY - y, len = Math.sqrt(dx * dx + dy * dy);
        var x1 = inX + (dx / len) * rIn, y1 = y + (dy / len) * rIn, x2 = nX - (dx / len) * rN, y2 = nY - (dy / len) * rN;
        var p = S("path", { d: "M" + x1.toFixed(1) + " " + y1.toFixed(1) + "L" + x2.toFixed(1) + " " + y2.toFixed(1),
          class: WTS[i] >= 0 ? "s-blue" : "s-orange", "stroke-width": (1.5 + 6 * Math.abs(WTS[i])).toFixed(1) }, s1);
        return { p: p, x1: x1, y1: y1, x2: x2, y2: y2 };
      });
      function along(e, t) { return [e.x1 + (e.x2 - e.x1) * t, e.y1 + (e.y2 - e.y1) * t]; }

      inY.forEach(function (y, i) {
        S("circle", { cx: inX, cy: y, r: rIn, class: "f-surface", stroke: "var(--a-ink)", "stroke-width": 1.5 }, s1);
        S("text", { x: inX, y: y + 5, class: "t t-mono t-mid t-nohalo", text: X[i] }, s1);
      });
      S("circle", { cx: nX, cy: nY, r: rN, class: "f-surface", stroke: "var(--a-ink)", "stroke-width": 2 }, s1);
      var sigma = S("text", { x: nX, y: nY + 7, class: "t t-lg t-mid t-nohalo", text: "Σ" }, s1);
      var zTxt = S("text", { x: nX, y: nY + 5, class: "t t-mono t-mid t-nohalo t-sm", text: "z = " + fmt(Z) }, s1);
      zTxt.style.opacity = 0;
      tl.addLabel("s0", 0);

      // s1: weights on the connections
      var wl = edges.map(function (e, i) {
        var pt = along(e, compact ? 0.4 : 0.36), up = i === 2 ? 16 : -8;
        return S("text", { x: pt[0], y: pt[1] + up, class: "t t-mono t-mid" + sm + (WTS[i] >= 0 ? " t-blue" : " t-orange"), text: "×" + fmt(WTS[i]) }, s1);
      });
      edges.forEach(function (e, i) { LC.drawIn(tl, e.p, { duration: 0.5 }, i ? "<0.12" : "+=0.02"); });
      LC.popIn(tl, wl, { duration: 0.3, stagger: 0.1 }, "-=0.2");
      tl.addLabel("s1");

      // s2: weighted sum + bias -> z (written out on its own row)
      var sumT = S("text", { x: W / 2, y: 296, class: "t t-mono t-mid" + sm, text: "z = 0.4 − 1.0 + 0.9 + 0.1 = " + fmt(Z) }, s1);
      var biasT = S("text", { x: nX, y: nY + rN + 22, class: "t t-mono t-mid" + sm, text: "+ bias " + B.toFixed(1) }, s1);
      LC.popIn(tl, biasT, { duration: 0.3 }, "+=0.02");
      LC.popIn(tl, sumT, { duration: 0.4 });
      tl.to(sigma, { opacity: 0, duration: 0.25 });
      tl.to(zTxt, { opacity: 1, duration: 0.3 }, "<");
      tl.addLabel("s2");

      // s3: ReLU + output
      var outEdge = S("path", { d: "M" + (nX + rN) + " " + nY + "L" + (oX - rO) + " " + nY, class: "s-ink", "stroke-width": 2 }, s1);
      var outNode = S("circle", { cx: oX, cy: nY, r: rO, class: "f-orange" }, s1);
      var outVal = S("text", { x: oX, y: nY + 5, class: "t t-mono t-mid t-nohalo" + sm, text: fmt(Math.max(0, Z)), style: "fill:#fff" }, s1);
      var px0 = oX - 30, px1 = oX + 30, pyB = 236, pyT = 200;
      var reluAxis = S("path", { d: "M" + px0 + " " + pyB + "H" + px1, class: "s-axis" }, s1);
      var reluPath = S("path", { d: "M" + px0 + " " + pyB + "H" + oX + "L" + px1 + " " + pyT, class: "s-orange", "stroke-width": 2.5 }, s1);
      var reluLbl = S("text", { x: oX, y: pyB + 20, class: "t t-sm t-orange t-mid", text: "ReLU" }, s1);
      LC.drawIn(tl, outEdge, { duration: 0.4 }, "+=0.02");
      LC.popIn(tl, [reluAxis, reluLbl], { duration: 0.3 });
      LC.drawIn(tl, reluPath, { duration: 0.5 });
      LC.popIn(tl, [outNode, outVal], { duration: 0.35 });
      tl.addLabel("s3");

      /* ---------- scene 2: layers ---------- */
      var s2 = S("g", {}, svg);
      s2.style.opacity = 0;
      var cIn = compact ? 40 : 110, cH = compact ? 180 : 320, cOut = compact ? 320 : 530;
      var yIn = [100, 160, 220], yH = [82, 134, 186, 238], yOut = [128, 192], r = 13;
      function link(x1, y1, x2, y2, cls, g) {
        var dx = x2 - x1, dy = y2 - y1, len = Math.sqrt(dx * dx + dy * dy);
        return S("path", { d: "M" + (x1 + dx / len * r).toFixed(1) + " " + (y1 + dy / len * r).toFixed(1) + "L" + (x2 - dx / len * r).toFixed(1) + " " + (y2 - dy / len * r).toFixed(1), class: cls, "stroke-width": 1.4 }, g);
      }
      var e1 = [], e2 = [], direct = [];
      yIn.forEach(function (a) { yH.forEach(function (b) { e1.push(link(cIn, a, cH, b, "s-blue", s2)); }); });
      yH.forEach(function (a) { yOut.forEach(function (b) { e2.push(link(cH, a, cOut, b, "s-blue", s2)); }); });
      yIn.forEach(function (a) { yOut.forEach(function (b) { direct.push(link(cIn, a, cOut, b, "s-orange", s2)); }); });
      function nodes(x, ys, cls, g) {
        var gg = S("g", {}, g);
        ys.forEach(function (y) { S("circle", { cx: x, cy: y, r: r, class: cls, stroke: "var(--a-ink)", "stroke-width": 1.5 }, gg); });
        return gg;
      }
      var nIn = nodes(cIn, yIn, "f-surface", s2);
      var nH = nodes(cH, yH, "f-surface", s2);
      var nOut = nodes(cOut, yOut, "f-surface", s2);
      // phi marks inside hidden nodes
      var phis = S("g", {}, s2);
      yH.forEach(function (y) { S("text", { x: cH, y: y + 4, class: "t t-sm t-mid t-nohalo t-orange", text: "φ" }, phis); });
      var hIn = S("text", { x: cIn, y: headY, class: "t t-muted t-mid" + sm, text: "input" }, s2);
      var hH = S("text", { x: cH, y: headY, class: "t t-muted t-mid" + sm, text: "hidden" }, s2);
      var hOut = S("text", { x: cOut, y: headY, class: "t t-muted t-mid" + sm, text: "output" }, s2);
      var w1L = S("text", { x: (cIn + cH) / 2, y: headY, class: "t t-blue t-mid" + sm, text: "W₁" }, s2);
      var w2L = S("text", { x: (cH + cOut) / 2, y: headY, class: "t t-blue t-mid" + sm, text: "W₂" }, s2);
      var eqY1 = 282, eqY2 = 308;
      var eq1 = S("text", { x: W / 2, y: eqY1, class: "t t-mono t-mid" + sm, text: compact ? "h = φ(x W₁ + b₁)   W₁: 3×4" : "layer 1:  h = φ(x W₁ + b₁)    W₁ is 3×4" }, s2);
      var eq2 = S("text", { x: W / 2, y: eqY2, class: "t t-mono t-mid" + sm, text: compact ? "y = h W₂ + b₂   W₂: 4×2" : "layer 2:  y = h W₂ + b₂       W₂ is 4×2" }, s2);
      var col1 = S("text", { x: W / 2, y: eqY1, class: "t t-mono t-mid t-orange" + sm, text: compact ? "no φ:  (x W₁) W₂ = x (W₁W₂)" : "without φ:  (x W₁) W₂ = x (W₁ W₂) = x W" }, s2);
      var col2 = S("text", { x: W / 2, y: eqY2, class: "t t-mid t-orange" + sm, text: "= one linear layer, W = W₁W₂ (3×2)" }, s2);
      var wL = S("text", { x: (cIn + cOut) / 2, y: headY, class: "t t-orange t-mid" + sm, text: "W = W₁W₂" }, s2);
      [nH, nOut, w1L, w2L, hH, hOut, eq1, eq2, col1, col2, wL, phis].forEach(function (e) { e.style.opacity = 0; });

      // s4: crossfade to the layer view
      tl.to(s1, { opacity: 0, duration: 0.4 }, "+=0.02");
      tl.set(s2, { opacity: 1 });
      e1.forEach(function (p, i) { LC.drawIn(tl, p, { duration: 0.35 }, i ? "<0.03" : "+=0.01"); });
      tl.to([nH, phis, hH, w1L], { opacity: 1, duration: 0.35 }, "<");
      LC.popIn(tl, eq1, { duration: 0.3 });
      tl.addLabel("s4");

      // s5: second layer
      e2.forEach(function (p, i) { LC.drawIn(tl, p, { duration: 0.35 }, i ? "<0.04" : "+=0.01"); });
      tl.to([nOut, hOut, w2L], { opacity: 1, duration: 0.35 }, "<");
      LC.popIn(tl, eq2, { duration: 0.3 });
      tl.addLabel("s5");

      // s6: collapse without the nonlinearity
      tl.to(e1.concat(e2, [nH, phis]), { opacity: 0.1, duration: 0.4 });
      tl.to([hH, w1L, w2L, eq1, eq2], { opacity: 0, duration: 0.2 }, "<");
      direct.forEach(function (p, i) { LC.drawIn(tl, p, { duration: 0.4 }, i ? "<0.05" : "+=0.01"); });
      LC.popIn(tl, [wL, col1], { duration: 0.3 });
      LC.popIn(tl, col2, { duration: 0.3 });
      tl.addLabel("s6");
      return tl;
    }
  };
})();
