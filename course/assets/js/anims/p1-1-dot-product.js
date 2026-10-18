/* P1.1: two arrows, their dot product, and what the angle between them does to it.
   a = (3, 1), b = (1, 2): a·b = 5, |a| = √10, |b| = √5, θ = 45°. b then rotates
   (length fixed) to 90° (a·b = 0) and to 135°, where b = (−2, 1) and a·b = −5. */
(function () {
  var LC = window.LC;
  var A = [3, 1], RB = Math.sqrt(5), ANG_A = Math.atan2(1, 3);
  var DEG = Math.PI / 180;

  LC.anims["p1-1-dot-product"] = {
    title: "The dot product, as numbers and as arrows",
    steps: [
      "A vector is a list of numbers, here $a = (3, 1)$. Drawn as an arrow, it goes 3 right and 1 up from the origin.",
      "Its <strong>length</strong> comes from Pythagoras: $\\lVert a\\rVert = \\sqrt{3^2 + 1^2} = \\sqrt{10} \\approx 3.16$.",
      "A second vector $b = (1, 2)$. The <strong>dot product</strong> multiplies matching entries and adds: $a\\cdot b = 3\\cdot 1 + 1\\cdot 2 = 5$.",
      "The same number, geometrically: $\\lVert a\\rVert\\,\\lVert b\\rVert\\cos\\theta = 3.16 \\times 2.24 \\times 0.707 = 5$. The angle between them is $\\theta = 45°$.",
      "Read it as a <strong>shadow</strong>: drop $b$ straight onto $a$. The shadow (orange) is $\\lVert b\\rVert\\cos\\theta \\approx 1.58$ long, and $a\\cdot b = 3.16 \\times 1.58 = 5$.",
      "Turn $b$ until it is <strong>perpendicular</strong> to $a$ (same length). The shadow vanishes: $\\cos 90° = 0$, so $a\\cdot b = 0$.",
      "Turn further, to $135°$: now $b = (-2, 1)$ and the shadow points <em>backwards</em>. $a\\cdot b = -6 + 1 = -5$. <strong>Negative means \"pointing apart\".</strong>"
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 262 } : { w: 640, h: 262 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact", W = ctx.w, H = ctx.h;
      var X0 = -2.6, X1 = 3.8, Y0 = -0.9, Y1 = 2.75;
      var plotL = compact ? 10 : 14, plotW = compact ? 340 : 368;
      var u = plotW / (X1 - X0);                         // px per unit, same on both axes
      var plotT = compact ? 58 : 24;
      function px(x) { return plotL + (x - X0) * u; }
      function py(y) { return plotT + (Y1 - y) * u; }
      var ox = px(0), oy = py(0);
      var tl = gsap.timeline();

      // grid + axes
      var g = S("g", {}, svg);
      for (var gx = -2; gx <= 3; gx++) if (gx) S("line", { x1: px(gx), x2: px(gx), y1: py(Y0), y2: py(Y1), class: "s-grid" }, g);
      for (var gy = 0; gy <= 2; gy++) if (gy) S("line", { x1: px(X0), x2: px(X1), y1: py(gy), y2: py(gy), class: "s-grid" }, g);
      S("line", { x1: px(X0), x2: px(X1), y1: oy, y2: oy, class: "s-axis" }, g);
      S("line", { x1: ox, x2: ox, y1: py(Y0), y2: py(Y1), class: "s-axis" }, g);

      // readout area: two rows on top (compact) or a column on the right (wide)
      var rx = compact ? 10 : 404, ry = compact ? 18 : 64, rdy = compact ? 22 : 26;
      function readout(lines) {
        var grp = S("g", {}, svg);
        lines.forEach(function (ln, i) {
          S("text", { x: rx, y: ry + i * rdy, style: "white-space:pre", class: "t t-mono" + (compact ? " t-sm" : "") + (ln[1] ? " " + ln[1] : ""), text: ln[0] }, grp);
        });
        grp.style.opacity = 0;
        return grp;
      }
      if (!compact) S("text", { x: rx, y: 34, class: "t t-sm t-muted", text: "readout" }, svg);
      var LINES = compact ? [
        [["a = (3, 1)", "t-blue"]],
        [["|a| = √(3² + 1²) = √10 ≈ 3.16", "t-blue"]],
        [["b = (1, 2)", "t-orange"], ["a·b = 3·1 + 1·2 = 5"]],
        [["θ = 45°,  cos θ ≈ 0.707"], ["|a||b|cos θ = 3.16×2.24×0.707 = 5"]],
        [["shadow = |b| cos θ ≈ 1.58", "t-orange"], ["a·b = 3.16 × 1.58 = 5"]],
        [["θ = 90°,  cos θ = 0"], ["a·b = 0   (perpendicular)"]],
        [["θ = 135°,  b = (−2, 1)", "t-orange"], ["a·b = 3·(−2) + 1·1 = −5"]]
      ] : [
        [["a = (3, 1)", "t-blue"]],
        [["|a| = √(3² + 1²)", "t-blue"], ["    = √10 ≈ 3.16", "t-blue"]],
        [["b = (1, 2)", "t-orange"], ["a·b = 3·1 + 1·2"], ["    = 5"]],
        [["θ = 45°, cos θ ≈ 0.707"], ["|a||b| cos θ"], ["  = 3.16 × 2.24 × 0.707"], ["  = 5  ✓"]],
        [["shadow = |b| cos θ", "t-orange"], ["       ≈ 1.58", "t-orange"], ["a·b = 3.16 × 1.58 = 5"]],
        [["θ = 90°, cos θ = 0"], ["a·b = 0 (perpendicular)"]],
        [["θ = 135°, b = (−2, 1)", "t-orange"], ["a·b = 3·(−2) + 1·1"], ["    = −5"]]
      ];
      var R = LINES.map(function (l) { return readout(l); });
      function show(i) {
        if (i > 0) tl.to(R[i - 1], { opacity: 0, duration: 0.25 });
        tl.to(R[i], { opacity: 1, duration: 0.35 }, i > 0 ? "<0.15" : undefined);
      }

      function arrowD(x, y) {        // shaft + head path from the origin to (x, y) in data units
        var x2 = px(x), y2 = py(y), ang = Math.atan2(y2 - oy, x2 - ox), hl = 11;
        var bx = x2 - hl * Math.cos(ang), by = y2 - hl * Math.sin(ang);
        return {
          shaft: "M" + ox + " " + oy + "L" + bx.toFixed(2) + " " + by.toFixed(2),
          head: "M" + (x2 - hl * Math.cos(ang - 0.45)).toFixed(2) + " " + (y2 - hl * Math.sin(ang - 0.45)).toFixed(2) +
                "L" + x2.toFixed(2) + " " + y2.toFixed(2) +
                "L" + (x2 - hl * Math.cos(ang + 0.45)).toFixed(2) + " " + (y2 - hl * Math.sin(ang + 0.45)).toFixed(2)
        };
      }

      // s0: vector a (the shadow layer sits underneath it)
      var drop = S("path", { d: "", class: "s-faint", "stroke-dasharray": "4 4" }, svg);
      var shadow = S("path", { d: "", class: "s-orange", style: "stroke-width:9;stroke-opacity:.45;stroke-linecap:butt" }, svg);
      var ad = arrowD(A[0], A[1]);
      var aShaft = S("path", { d: ad.shaft, class: "s-blue" }, svg);
      var aHead = S("path", { d: ad.head, class: "s-blue" }, svg);
      S("text", { x: px(3) + 8, y: py(1) - 8, class: "t t-blue", "font-weight": 650, text: "a" }, svg);
      R[0].style.opacity = 1;
      tl.addLabel("s0", 0);

      // s1: components 3 and 1
      var cx3 = S("path", { d: "M" + ox + " " + (oy) + "H" + px(3), class: "s-ink", "stroke-dasharray": "5 5", "stroke-width": 2 }, svg);
      var cy1 = S("path", { d: "M" + px(3) + " " + oy + "V" + (py(1) + 4), class: "s-ink", "stroke-dasharray": "5 5", "stroke-width": 2 }, svg);
      var l3 = S("text", { x: px(1.5), y: oy + 18, class: "t t-sm t-mid", text: "3" }, svg);
      var l1 = S("text", { x: px(3) + 10, y: py(0.5) + 5, class: "t t-sm", text: "1" }, svg);
      LC.popIn(tl, [cx3, cy1, l3, l1], { duration: 0.4 }, "+=0.05");
      show(1);
      tl.addLabel("s1");

      // s2: vector b (rotating group)
      tl.to([cx3, cy1, l3, l1], { opacity: 0, duration: 0.3 });
      var bState = { ang: Math.atan2(2, 1), shadow: 0 };
      var bG = S("g", {}, svg);
      var bd0 = arrowD(1, 2);
      var bShaft = S("path", { d: bd0.shaft, class: "s-orange" }, bG);
      var bHead = S("path", { d: bd0.head, class: "s-orange" }, bG);
      var bLbl = S("text", { class: "t t-orange t-mid", "font-weight": 650, text: "b" }, svg);
      // angle arc + θ
      var arc = S("path", { d: "", class: "s-ink", "stroke-width": 1.5 }, svg);
      var thLbl = S("text", { class: "t t-sm t-mid", text: "θ" }, svg);
      // projection (shadow) of b on the line of a
      var ua = [Math.cos(ANG_A), Math.sin(ANG_A)];

      function place() {
        var a = bState.ang, bx = RB * Math.cos(a), by = RB * Math.sin(a);
        var d = arrowD(bx, by);
        bShaft.setAttribute("d", d.shaft); bHead.setAttribute("d", d.head);
        var tx = px(bx), ty = py(by), dl = Math.hypot(tx - ox, ty - oy);
        bLbl.setAttribute("x", (tx + (tx - ox) / dl * 15).toFixed(1));
        bLbl.setAttribute("y", (ty + (ty - oy) / dl * 15 + 5).toFixed(1));
        var r = 30, a0 = ANG_A, a1 = a;
        arc.setAttribute("d", "M" + (ox + r * Math.cos(a0)).toFixed(2) + " " + (oy - r * Math.sin(a0)).toFixed(2) +
          "A" + r + " " + r + " 0 0 0 " + (ox + r * Math.cos(a1)).toFixed(2) + " " + (oy - r * Math.sin(a1)).toFixed(2));
        var mid = (a0 + a1) / 2;
        thLbl.setAttribute("x", (ox + 44 * Math.cos(mid)).toFixed(1));
        thLbl.setAttribute("y", (oy - 44 * Math.sin(mid) + 4).toFixed(1));
        var proj = bx * ua[0] + by * ua[1];               // signed shadow length
        var fx = proj * ua[0], fy = proj * ua[1];
        drop.setAttribute("d", "M" + tx.toFixed(2) + " " + ty.toFixed(2) + "L" + px(fx).toFixed(2) + " " + py(fy).toFixed(2));
        shadow.setAttribute("d", "M" + ox + " " + oy + "L" + px(fx).toFixed(2) + " " + py(fy).toFixed(2));
      }
      place();
      LC.drawIn(tl, bShaft, { duration: 0.6 }, "+=0.02");
      LC.popIn(tl, [bHead, bLbl], { duration: 0.25 });
      show(2);
      tl.addLabel("s2");

      // s3: angle
      LC.drawIn(tl, arc, { duration: 0.5 }, "+=0.02");
      tl.set(arc.style, { strokeDasharray: "none" });      // the arc is redrawn as b turns
      LC.popIn(tl, thLbl, { duration: 0.3 }, "<");
      show(3);
      tl.addLabel("s3");

      // s4: shadow
      LC.popIn(tl, [drop, shadow], { duration: 0.5 }, "+=0.02");
      show(4);
      tl.addLabel("s4");

      // s5: rotate to 90°
      tl.to(bState, { ang: ANG_A + 90 * DEG, duration: 1.1, ease: "power2.inOut", onUpdate: place });
      show(5);
      tl.addLabel("s5");

      // s6: rotate to 135°
      tl.to(bState, { ang: ANG_A + 135 * DEG, duration: 0.9, ease: "power2.inOut", onUpdate: place });
      show(6);
      tl.addLabel("s6");
      return tl;
    }
  };
})();
