/* P1.3: the chain rule on y = ln((2x)²) at x = 1, as a chain x → u = 2x → v = u² → y = ln v.
   Forward: 1 → 2 → 4 → ln 4 ≈ 1.386. Local slopes: du/dx = 2, dv/du = 2u = 4, dy/dv = 1/v = 0.25.
   Nudge x by 0.01: u +0.02, v +0.0804, y +0.0199. Backward: 0.25 → 0.25·4 = 1 → 1·2 = 2.
   Check: y = 2 ln(2x), so dy/dx = 2/x = 2 at x = 1. */
(function () {
  var LC = window.LC;
  LC.anims["p1-3-chain"] = {
    title: "The chain rule: slopes multiply along a chain",
    steps: [
      "$y = \\ln\\big((2x)^2\\big)$ looks fiddly, but it's three simple steps in a row: <strong>double</strong>, <strong>square</strong>, <strong>take the log</strong>.",
      "<strong>Forward pass</strong> at $x = 1$: $u = 2$, $v = 4$, $y = \\ln 4 \\approx 1.386$.",
      "Each link has its own easy <strong>local slope</strong>: $\\frac{du}{dx} = 2$, $\\frac{dv}{du} = 2u = 4$, $\\frac{dy}{dv} = \\frac{1}{v} = 0.25$.",
      "Nudge $x$ by $0.01$. Each link <strong>scales the nudge by its slope</strong>: $u$ moves $0.02$, $v$ about $0.08$, $y$ about $0.02$. So $y$ moves about 2× as much as $x$.",
      "<strong>Backward pass</strong>: start at the output and multiply local slopes as you walk back. $\\frac{dy}{dv} = 0.25$, then $\\frac{dy}{du} = 0.25 \\times 4 = 1$, then $\\frac{dy}{dx} = 1 \\times 2 = 2$.",
      "$\\frac{dy}{dx} = 2$, matching the nudge. (Check: $y = 2\\ln(2x)$, so $\\frac{dy}{dx} = \\frac{2}{x} = 2$.) This backward sweep, run on millions of links, is <strong>backpropagation</strong>."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 430 } : { w: 640, h: 300 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      var names = ["x", "u", "v", "y"], vals = ["1", "2", "4", "1.386"];
      var ops = ["× 2", "square", "ln"];
      var local = [["du/dx = 2"], ["dv/du = 2u", "= 4"], ["dy/dv = 1/v", "= 0.25"]];
      var nudges = ["+0.01", "+0.02", "≈ +0.08", "≈ +0.02"];
      var grads = [["dy/dx = 1 × 2", "= 2"], ["dy/du = 0.25 × 4", "= 1"], ["dy/dv = 0.25"], ["dy/dy = 1"]];
      var bw = compact ? 92 : 104, bh = 42;
      function cx(i) { return compact ? 104 : 80 + i * 160; }
      function cy(i) { return compact ? 46 + i * 108 : 128; }
      var boxes = [], nameT = [], valT = [];
      names.forEach(function (n, i) {
        boxes.push(S("rect", { x: cx(i) - bw / 2, y: cy(i) - bh / 2, width: bw, height: bh, rx: 10, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, svg));
        nameT.push(S("text", { x: cx(i), y: cy(i) + 5, class: "t t-mid", "font-weight": 650, text: n }, svg));
        valT.push(S("text", { x: cx(i), y: cy(i) + 5, class: "t t-mid t-mono", text: n + " = " + vals[i] }, svg));
        valT[i].style.opacity = 0;
      });
      // forward edges with op labels
      var edgeEls = [];
      ops.forEach(function (op, i) {
        var d, lbl;
        if (compact) {
          var x = cx(i), y1 = cy(i) + bh / 2 + 4, y2 = cy(i + 1) - bh / 2 - 4;
          d = "M" + x + " " + y1 + "V" + y2 + "M" + (x - 6) + " " + (y2 - 8) + "L" + x + " " + y2 + "L" + (x + 6) + " " + (y2 - 8);
          lbl = S("text", { x: x + 12, y: (y1 + y2) / 2 + 4, class: "t t-sm t-muted", text: op }, svg);
        } else {
          var x1 = cx(i) + bw / 2 + 4, x2 = cx(i + 1) - bw / 2 - 4, y = cy(i);
          d = "M" + x1 + " " + y + "H" + x2 + "M" + (x2 - 8) + " " + (y - 6) + "L" + x2 + " " + y + "L" + (x2 - 8) + " " + (y + 6);
          lbl = S("text", { x: (x1 + x2) / 2, y: y - 12, class: "t t-sm t-muted t-mid", text: op }, svg);
        }
        edgeEls.push(S("path", { d: d, class: "s-ink", style: "stroke-width:1.8" }, svg), lbl);
      });
      tl.addLabel("s0", 0);

      // s1: forward values
      tl.to(nameT, { opacity: 0, duration: 0.2 });
      valT.forEach(function (t, i) { LC.popIn(tl, t, { duration: 0.3 }, i ? "+=0.05" : "<0.1"); });
      tl.addLabel("s1");

      // s2: local slopes
      var localEls = local.map(function (lines, i) {
        var g = S("g", {}, svg);
        lines.forEach(function (ln, k) {
          if (compact) S("text", { x: 196, y: (cy(i) + cy(i + 1)) / 2 + 4 + (k - (lines.length - 1) / 2) * 17, class: "t t-sm t-mono t-blue", text: ln }, g);
          else S("text", { x: (cx(i) + cx(i + 1)) / 2, y: cy(i) + 40 + k * 17, class: "t t-sm t-mono t-blue t-mid", text: ln }, g);
        });
        return g;
      });
      LC.popIn(tl, localEls, { duration: 0.35, stagger: 0.15 });
      tl.addLabel("s2");

      // s3: nudge
      var nudgeEls = nudges.map(function (n, i) {
        return compact
          ? S("text", { x: cx(i) + bw / 2 + 12, y: cy(i) + 5, class: "t t-sm t-mono t-orange", text: n }, svg)
          : S("text", { x: cx(i), y: cy(i) - bh / 2 - 34, class: "t t-sm t-mono t-orange t-mid", text: n }, svg);
      });
      nudgeEls.forEach(function (e, i) { LC.popIn(tl, e, { duration: 0.3 }, i ? "+=0.15" : undefined); });
      tl.addLabel("s3");

      // s4: backward pass
      tl.to(nudgeEls, { opacity: 0, duration: 0.25 });
      var gradEls = grads.map(function (lines, i) {
        var g = S("g", {}, svg);
        lines.forEach(function (ln, k) {
          if (compact) S("text", { x: cx(i) + bw / 2 + 12, y: cy(i) + 5 + (k - (lines.length - 1) / 2) * 17, class: "t t-sm t-mono t-orange", text: ln }, g);
          else S("text", { x: cx(i), y: cy(i) + bh / 2 + 70 + k * 17, class: "t t-sm t-mono t-orange t-mid", text: ln }, g);
        });
        return g;
      });
      var backArcs = [];
      for (var i = 2; i >= 0; i--) {
        var d;
        if (compact) {
          var xl = cx(i) - bw / 2 - 8, ya = cy(i + 1), yb = cy(i);
          d = "M" + xl + " " + ya + "C" + (xl - 34) + " " + ya + " " + (xl - 34) + " " + yb + " " + xl + " " + yb +
            "M" + (xl - 9) + " " + (yb - 6) + "L" + xl + " " + yb + "L" + (xl - 9) + " " + (yb + 6);
        } else {
          var yb2 = cy(0) - bh / 2 - 6, xa = cx(i + 1), xb = cx(i) + 14;
          d = "M" + xa + " " + yb2 + "C" + xa + " " + (yb2 - 40) + " " + xb + " " + (yb2 - 40) + " " + xb + " " + yb2 +
            "M" + (xb - 6) + " " + (yb2 - 9) + "L" + xb + " " + yb2 + "L" + (xb + 6) + " " + (yb2 - 9);
        }
        backArcs.push(S("path", { d: d, class: "s-orange", style: "stroke-width:2" }, svg));
      }
      LC.popIn(tl, gradEls[3], { duration: 0.3 });
      [2, 1, 0].forEach(function (i, k) {
        LC.drawIn(tl, backArcs[k], { duration: 0.55 });
        LC.popIn(tl, gradEls[i], { duration: 0.3 });
      });
      tl.addLabel("s4");

      // s5: highlight the answer
      var hi = S("rect", { x: cx(0) - bw / 2 - 4, y: cy(0) - bh / 2 - 4, width: bw + 8, height: bh + 8, rx: 13, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 3 }, svg);
      LC.popIn(tl, hi, { duration: 0.4 });
      tl.to(localEls, { opacity: 0.35, duration: 0.3 }, "<");
      tl.addLabel("s5");
      return tl;
    }
  };
})();
