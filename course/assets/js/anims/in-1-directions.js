/* IN.1: features as directions in a 2-neuron activation space, then five features packed
   as a regular pentagon (superposition). Readings are exact dot products with unit
   directions: cos 72° = 0.31, cos 144° = −0.81. The threshold step uses ReLU(reading − 0.35). */
(function () {
  var LC = window.LC;
  var DEG = Math.PI / 180;
  var NAMES = ["A", "B", "C", "D", "E"];
  var A0 = 60;                                       // feature A's angle
  var PENT = [0, 1, 2, 3, 4].map(function (k) { return A0 - 72 * k; });   // A, B, C, D, E
  var ORTHO_B = A0 - 90;                             // B when only two features exist
  var TH = 0.35;
  function unit(a) { return [Math.cos(a * DEG), Math.sin(a * DEG)]; }
  function dot(u, v) { return u[0] * v[0] + u[1] * v[1]; }
  function fmt(v) { var s = Math.abs(v) < 0.005 ? "0.00" : Math.abs(v).toFixed(2); return (v < -0.005 ? "−" : "") + s; }
  var U = PENT.map(unit);
  // readings for: A alone (pentagon), A + C together; then after ReLU(r − TH)
  var R1 = U.map(function (u) { return dot(u, U[0]); });
  var hAC = [U[0][0] + U[2][0], U[0][1] + U[2][1]];
  var R2 = U.map(function (u) { return dot(u, hAC); });
  function relu(r) { return r.map(function (v) { return Math.max(0, v - TH); }); }
  var R1r = relu(R1), R2r = relu(R2);

  LC.anims["in-1-directions"] = {
    title: "Features as directions, then five features in two dimensions",
    steps: [
      "A layer with two neurons: every activation $h$ is a point in a 2-D plane, neuron 1's value across and neuron 2's value up. Here $h = (0.50, 0.87)$.",
      "Suppose the model stores <strong>feature A</strong> as a <strong>direction</strong>, and here $h$ is exactly 1 × A's direction. Both neurons light up, so neither neuron alone is “the A neuron”.",
      "To read a feature, take the <strong>dot product</strong> of $h$ with its unit direction. A reads 1.00. Feature <strong>B</strong>, at 90° to A, reads 0.00: no interference.",
      "In two dimensions only <strong>two</strong> directions can be exactly perpendicular. A third feature would have to overlap with these.",
      "<strong>Superposition</strong>: squeeze five features in as a pentagon. With only A on, its neighbours B and E read $\\cos 72° = 0.31$ and the far ones read $\\cos 144° = −0.81$: <strong>interference</strong>.",
      "Add a <strong>ReLU with a negative bias</strong>, $\\max(0,\\ r − 0.35)$: the negative and small positive readings are cut to 0 and A survives. The bias costs A some height; in a trained model the weights grow to make up for it. If features are <strong>rarely on together</strong>, this works.",
      "But turn on <strong>A and C together</strong>: their sum points straight along B. A and C now read only 0.19 and are cut to 0, while B, which is off, reads 0.62 and survives as 0.27. Interference adds up, which is why superposition needs <strong>sparse</strong> features."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 462 } : { w: 640, h: 344 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact";
      var P = compact ? { cx: 180, cy: 150, r: 84 } : { cx: 170, cy: 176, r: 112 };
      var B = compact
        ? { title: 312, top: 332, row: 26, lx: 46, zx: 150, sc: 100 }
        : { title: 64, top: 92, row: 40, lx: 384, zx: 480, sc: 96 };
      var tl = gsap.timeline();
      function px(v) { return P.cx + v[0] * P.r; }
      function py(v) { return P.cy - v[1] * P.r; }

      // ---- plane (s0)
      var ax = S("g", {}, svg);
      S("line", { x1: P.cx - P.r - 14, x2: P.cx + P.r + 14, y1: P.cy, y2: P.cy, class: "s-axis" }, ax);
      S("line", { x1: P.cx, x2: P.cx, y1: P.cy + P.r + 14, y2: P.cy - P.r - 14, class: "s-axis" }, ax);
      S("circle", { cx: P.cx, cy: P.cy, r: P.r, class: "f-none", stroke: "var(--line)", "stroke-width": 1, "stroke-dasharray": "3 4" }, ax);
      S("text", { x: P.cx + 0.5 * P.r + 8, y: P.cy - 8, class: "t t-sm t-muted", text: "neuron 1 →" }, ax);
      S("text", { x: P.cx + 8, y: P.cy - P.r - 22, class: "t t-sm t-muted", text: "↑ neuron 2" }, ax);
      if (!compact) S("text", { x: 20, y: 30, class: "t t-sm t-muted", text: "activation space (2 neurons)" }, svg);
      var h = unit(A0);
      var guides = S("g", {}, svg);
      S("line", { x1: px(h), x2: px(h), y1: py(h), y2: P.cy, class: "s-grid", "stroke-dasharray": "4 4", style: "stroke:var(--ink-2)" }, guides);
      S("line", { x1: px(h), x2: P.cx, y1: py(h), y2: py(h), class: "s-grid", "stroke-dasharray": "4 4", style: "stroke:var(--ink-2)" }, guides);
      S("text", { x: px(h), y: P.cy + 16, class: "t t-sm t-mono t-mid", text: "0.50" }, guides);
      S("text", { x: P.cx - 6, y: py(h) + 4, class: "t t-sm t-mono t-end", text: "0.87" }, guides);
      var hDot = S("circle", { cx: px(h), cy: py(h), r: 6, class: "f-ink" }, svg);
      var hLbl = S("text", { x: px(h) + 10, y: py(h) - 6, class: "t t-sm", "font-weight": 650, text: "h" }, svg);
      tl.addLabel("s0", 0);

      // ---- arrows
      function arrow(ang, cls, name, lblR) {
        var g = S("g", {}, svg), u = unit(ang);
        var tip = [px(u), py(u)];
        var back = [P.cx + u[0] * (P.r - 11), P.cy - u[1] * (P.r - 11)];
        var line = S("path", { d: "M" + P.cx + " " + P.cy + "L" + back[0].toFixed(1) + " " + back[1].toFixed(1), class: cls === "o" ? "s-orange" : "s-blue" }, g);
        var nx = -u[1] * 5.5, ny = -u[0] * 5.5;
        var head = S("path", { d: "M" + tip[0].toFixed(1) + " " + tip[1].toFixed(1) + "L" + (back[0] + nx).toFixed(1) + " " + (back[1] + ny).toFixed(1) + "L" + (back[0] - nx).toFixed(1) + " " + (back[1] - ny).toFixed(1) + "Z", class: cls === "o" ? "f-orange" : "f-blue" }, g);
        var lr = lblR || 1.2;
        var lbl = S("text", { x: (P.cx + u[0] * P.r * lr).toFixed(1), y: (P.cy - u[1] * P.r * lr + 5).toFixed(1), class: "t t-mid " + (cls === "o" ? "t-orange" : "t-blue"), "font-weight": 650, text: name }, g);
        return { g: g, line: line, head: head, lbl: lbl };
      }
      function showArrow(a, pos) {
        LC.drawIn(tl, a.line, { duration: 0.5 }, pos);
        LC.popIn(tl, [a.head, a.lbl], { duration: 0.3 });
      }

      // ---- s1: feature A
      var aA = arrow(A0, "o", "A");
      tl.to([guides, hLbl], { opacity: 0, duration: 0.3 }, "+=0.02");
      showArrow(aA);
      var eqA = S("text", { x: compact ? P.cx : P.cx, y: compact ? P.cy + P.r + 50 : P.cy + P.r + 44, class: "t t-sm t-mid", text: "h = 1.0 × (direction A)" }, svg);
      LC.popIn(tl, eqA, { duration: 0.3 });
      tl.addLabel("s1");

      // ---- bars panel
      var title1 = S("text", { x: compact ? B.lx - 30 : B.lx - 4, y: B.title, class: "t t-sm t-muted", text: "reading r = h · direction" }, svg);
      var title2 = S("text", { x: compact ? B.lx - 30 : B.lx - 4, y: B.title, class: "t t-sm t-muted", text: "after ReLU(r − 0.35)" }, svg);
      title1.style.opacity = 0; title2.style.opacity = 0;
      var zero = S("line", { x1: B.zx, x2: B.zx, y1: B.top - 6, y2: B.top + 5 * B.row - 8, class: "s-axis" }, svg);
      zero.style.opacity = 0;
      var thr = S("line", { x1: B.zx + TH * B.sc, x2: B.zx + TH * B.sc, y1: B.top - 6, y2: B.top + 5 * B.row - 8, class: "s-grid", "stroke-dasharray": "3 3", style: "stroke:var(--a-orange)" }, svg);
      thr.style.opacity = 0;
      var bars = NAMES.map(function (n, i) {
        var y = B.top + i * B.row;
        var g = S("g", {}, svg);
        var l = S("text", { x: B.lx, y: y + 11, class: "t t-mid " + (i === 0 ? "t-orange" : "t-blue"), "font-weight": 650, text: n }, g);
        var r = S("rect", { x: B.zx, y: y, width: 0, height: B.row - 14, rx: 3, class: i === 0 ? "f-orange" : "f-blue" }, g);
        var v = S("text", { x: B.zx + 6, y: y + 11, class: "t t-sm t-mono", text: "" }, g);
        g.style.opacity = 0;
        return { g: g, l: l, r: r, v: v, y: y };
      });
      function setBars(vals, thrOn) {
        bars.forEach(function (b, i) {
          var x = vals[i];
          var w = Math.abs(x) * B.sc;
          b.r.setAttribute("x", (x >= 0 ? B.zx : B.zx - w).toFixed(1));
          b.r.setAttribute("width", w.toFixed(1));
          b.v.textContent = fmt(x);
          if (Math.abs(x) < 0.005) { b.v.setAttribute("x", B.zx - 6); b.v.setAttribute("class", "t t-sm t-mono t-end"); }
          else {
            var end = x > 0 ? B.zx + w : B.zx;
            if (thrOn) end = Math.max(end, B.zx + TH * B.sc);
            b.v.setAttribute("x", (end + 6).toFixed(1)); b.v.setAttribute("class", "t t-sm t-mono");
          }
        });
      }
      // Deterministic bar states per step (robust to jumping backwards): store snapshots
      var SNAP = [];

      // ---- s2: read A, add B at 90°
      var aB0 = arrow(ORTHO_B, "b", "B");
      tl.to(eqA, { opacity: 0, duration: 0.2 }, "+=0.02");
      showArrow(aB0);
      LC.popIn(tl, [title1, zero, bars[0].g, bars[1].g], { duration: 0.3 });
      SNAP[2] = [1, 0, 0, 0, 0];
      tl.addLabel("s2");

      // ---- s3: only two fit (nothing new to draw but a note)
      var note = S("text", { x: P.cx, y: compact ? P.cy + P.r + 50 : P.cy + P.r + 44, class: "t t-sm t-mid", text: "2 dimensions → 2 perpendicular directions" }, svg);
      LC.popIn(tl, note, { duration: 0.4 }, "+=0.02");
            tl.addLabel("s3");

      // ---- s4: pentagon
      var pent = [aA];
      for (var k = 1; k < 5; k++) pent.push(arrow(PENT[k], "b", NAMES[k]));
      tl.to([note, aB0.g], { opacity: 0, duration: 0.3 }, "+=0.02");
      for (var k2 = 1; k2 < 5; k2++) showArrow(pent[k2], k2 === 1 ? "<" : "<0.05");
      var note2 = S("text", { x: P.cx, y: compact ? P.cy + P.r + 50 : P.cy + P.r + 44, class: "t t-sm t-mid", text: "5 features in 2 dimensions" }, svg);
      LC.popIn(tl, [note2, bars[2].g, bars[3].g, bars[4].g], { duration: 0.3 });
      SNAP[4] = R1;
      tl.addLabel("s4");

      // ---- s5: ReLU with bias
      tl.to(title1, { opacity: 0, duration: 0.2 }, "+=0.02");
      tl.to([title2, thr], { opacity: 1, duration: 0.3 });
      SNAP[5] = R1r;
      tl.addLabel("s5");

      // ---- s6: A and C together
      var hAcDot = S("circle", { cx: (P.cx + hAC[0] * P.r).toFixed(1), cy: (P.cy - hAC[1] * P.r).toFixed(1), r: 6, class: "f-ink" }, svg);
      hAcDot.style.opacity = 0;
      var aC2 = arrow(PENT[2], "o", "C");
      aC2.g.style.opacity = 0;
      var note3 = S("text", { x: P.cx, y: compact ? P.cy + P.r + 50 : P.cy + P.r + 44, class: "t t-sm t-mid", text: "h = A + C (two features on)" }, svg);
      note3.style.opacity = 0;
      tl.to([hDot, note2, pent[2].g], { opacity: 0, duration: 0.3 }, "+=0.02");
      tl.to([hAcDot, note3, aC2.g], { opacity: 1, duration: 0.3 });
      SNAP[6] = R2r;
      tl.addLabel("s6");

      // Bar values are a pure function of timeline time: pick the last snapshot whose label has passed,
      // and blend from the previous snapshot during the step's transition.
      var order = [2, 4, 5, 6];
      var drive = { t: 0 };
      tl.to(drive, { t: 1, duration: tl.duration(), ease: "none", onUpdate: function () {
        var t = tl.time(), prev = [0, 0, 0, 0, 0], cur = prev, frac = 1;
        for (var i = 0; i < order.length; i++) {
          var s = order[i], end = tl.labels["s" + s], start = tl.labels["s" + (s - 1)];
          if (t >= end) { prev = SNAP[s]; cur = SNAP[s]; frac = 1; }
          else if (t > start) { cur = SNAP[s]; frac = (t - start) / Math.max(0.01, end - start); break; }
          else break;
        }
        setBars(cur.map(function (v, j) { return prev[j] + (v - prev[j]) * frac; }), t > tl.labels.s4 + 0.01);
        var cOn = t > tl.labels.s5 + 0.01;
        bars[2].r.setAttribute("class", cOn ? "f-orange" : "f-blue");
        bars[2].l.setAttribute("class", "t t-mid " + (cOn ? "t-orange" : "t-blue"));
      } }, 0);
      setBars([0, 0, 0, 0, 0]);
      return tl;
    }
  };
})();
