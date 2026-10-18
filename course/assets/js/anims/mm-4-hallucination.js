/* MM.4: anatomy of an object hallucination (illustrative numbers, not measurements).
   "Is there a fork?" on a pizza scene with no fork. Weak, low-resolution visual evidence (0.2)
   plus a strong co-occurrence prior (0.8) → the model's belief 0.65 → "Yes": a hallucination.
   Fixes: sharper evidence + grounding data with negatives (belief 0.3 → "No"), then preference
   tuning on hallucination pairs (belief 0.08). */
(function () {
  var LC = window.LC;

  LC.anims["mm-4-hallucination"] = {
    title: "Why a model “sees” a fork that isn't there",
    steps: [
      "A table, a plate, a slice of pizza, a cup. <strong>No fork.</strong> We ask a yes/no probe, POPE-style: “Is there a fork in the image?”",
      "The <strong>visual evidence</strong> is weak: at low resolution each visual token blurs a whole patch, and a thin napkin edge looks a little like cutlery. On its own the evidence says “probably not” (0.2).",
      "The <strong>language prior</strong> is strong: in training captions, pizza, plates and tables often come with forks. From context alone, “fork” looks likely (0.8).",
      "The language model leans on the prior, its belief lands above 0.5, and it answers <strong>“Yes”</strong>: an <strong>object hallucination</strong>. Exactly the case POPE's <em>adversarial</em> negatives target.",
      "Fix 1: <strong>sharper evidence</strong> (higher resolution, better encoders) and <strong>grounding data with negatives</strong>, so the model learns to check the pixels. Belief drops below 0.5: “No”.",
      "Fix 2: <strong>preference tuning</strong> on hallucination pairs (M3.4): prefer “No, I don't see a fork” over “Yes, next to the plate”. The model answers no, and more confidently."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 412 } : { w: 640, h: 318 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      var m = compact ? 12 : 24;
      S("text", { x: m, y: 18, class: "t t-sm", "font-weight": 650, text: "Q: “Is there a fork in the image?”" }, svg);

      // ---- scene
      var ix = m, iy = 32, iw = compact ? 150 : 200, ih = compact ? 112 : 150;
      var sc = S("g", {}, svg);
      S("rect", { x: ix, y: iy, width: iw, height: ih, rx: 6, class: "f-surface2", stroke: "var(--a-ink)", "stroke-width": 1.5 }, sc);
      S("rect", { x: ix + 8, y: iy + ih * 0.42, width: iw - 16, height: ih * 0.5, rx: 6, class: "f-faint", "fill-opacity": 0.6 }, sc);
      var pcx = ix + iw * 0.42, pcy = iy + ih * 0.66;
      S("ellipse", { cx: pcx, cy: pcy, rx: iw * 0.2, ry: ih * 0.13, class: "f-paper", stroke: "var(--a-ink)", "stroke-width": 1.2 }, sc);
      S("path", { d: "M" + (pcx - iw * 0.12) + " " + (pcy + ih * 0.05) + "L" + (pcx + iw * 0.12) + " " + (pcy + ih * 0.03) + "L" + (pcx - iw * 0.02) + " " + (pcy - ih * 0.1) + "Z", class: "f-orange" }, sc);
      S("rect", { x: ix + iw * 0.72, y: iy + ih * 0.5, width: iw * 0.1, height: ih * 0.18, rx: 2, class: "f-blue" }, sc);
      // the ambiguous napkin edge
      S("path", { d: "M" + (ix + iw * 0.66) + " " + (iy + ih * 0.78) + "L" + (ix + iw * 0.82) + " " + (iy + ih * 0.86), stroke: "var(--a-ink)", "stroke-opacity": 0.45, "stroke-width": 2, fill: "none" }, sc);
      // low-res grid (s1)
      var grid = S("g", {}, svg), nx = 5, ny = 4;
      for (var a = 0; a < nx; a++) for (var b = 0; b < ny; b++) {
        S("rect", { x: ix + a * iw / nx, y: iy + b * ih / ny, width: iw / nx, height: ih / ny, class: "f-paper", "fill-opacity": ((a * 7 + b * 3) % 5) * 0.06 + 0.1, stroke: "var(--a-ink)", "stroke-opacity": 0.35, "stroke-width": 0.8 }, grid);
      }

      // ---- answer area (right of the scene)
      var ax = ix + iw + (compact ? 16 : 28);
      S("text", { x: ax, y: iy + 14, class: "t t-sm t-muted", text: "truth: no fork" }, svg);
      var ansY = iy + (compact ? 52 : 60);
      var yes = S("g", {}, svg);
      S("text", { x: ax, y: ansY, class: "t t-lg t-orange", text: "says “Yes”" }, yes);
      S("text", { x: ax, y: ansY + 22, class: "t t-sm t-orange", "font-weight": 600, text: "✗ hallucination" }, yes);
      var no1 = S("g", {}, svg);
      S("text", { x: ax, y: ansY, class: "t t-lg t-blue", text: "says “No”" }, no1);
      S("text", { x: ax, y: ansY + 22, class: "t t-sm t-blue", "font-weight": 600, text: "✓ grounded" }, no1);

      // ---- bars
      var bx = m, bw = W - 2 * m, by0 = compact ? 170 : 210, bdy = compact ? 44 : 0;
      var cols = compact ? null : [m, m + 200 + 8, m + 2 * (200 + 8)];
      var bwide = compact ? bw : 192;
      function barRow(i, label, val, cls) {
        var gg = S("g", {}, svg);
        var x = compact ? bx : cols[i], y = compact ? by0 + i * bdy : by0, w = bwide;
        S("text", { x: x, y: y, class: "t t-sm", text: label }, gg);
        var vt = S("text", { x: x + w, y: y, class: "t t-sm t-mono t-end", text: val.toFixed(2) }, gg);
        S("rect", { x: x, y: y + 6, width: w, height: 14, rx: 4, class: "f-surface2", stroke: "var(--line)", "stroke-width": 1 }, gg);
        var f = S("rect", { x: x, y: y + 6, width: w * val, height: 14, rx: 4, class: cls }, gg);
        return { g: gg, f: f, v: vt, w: w, x: x, y: y, cur: val };
      }
      var rPix = barRow(0, compact ? "pixels: P(fork)" : "pixels say P(fork)", 0.2, "f-blue");
      var rPri = barRow(1, compact ? "language prior: P(fork)" : "prior says P(fork)", 0.8, "f-orange");
      var rMod = barRow(2, compact ? "model's belief: P(yes)" : "model's belief P(yes)", 0.65, "f-ink");
      var thr = S("path", { d: "M" + (rMod.x + rMod.w * 0.5) + " " + (rMod.y + 2) + "V" + (rMod.y + 24), stroke: "var(--a-orange)", "stroke-width": 2, "stroke-dasharray": "3 3", fill: "none" }, rMod.g);
      void thr;

      // ---- fixes text
      var fy = compact ? 310 : 262;
      var fix1 = S("g", {}, svg), fix2 = S("g", {}, svg);
      if (compact) {
        S("text", { x: m, y: fy, class: "t t-sm t-blue", "font-weight": 600, text: "fix 1: higher resolution +" }, fix1);
        S("text", { x: m, y: fy + 18, class: "t t-sm t-blue", "font-weight": 600, text: "grounding data with negatives" }, fix1);
        S("text", { x: m, y: fy + 48, class: "t t-sm t-blue", "font-weight": 600, text: "fix 2: preference pairs" }, fix2);
        S("text", { x: m, y: fy + 66, class: "t t-sm", text: "✓ “No, I don't see a fork.”" }, fix2);
        S("text", { x: m, y: fy + 84, class: "t t-sm t-muted", text: "✗ “Yes, next to the plate.”" }, fix2);
      } else {
        S("text", { x: m, y: fy, class: "t t-sm t-blue", "font-weight": 600, text: "fix 1: higher resolution + grounding data with negatives" }, fix1);
        S("text", { x: m, y: fy + 26, class: "t t-sm t-blue", "font-weight": 600, text: "fix 2: preference pairs" }, fix2);
        S("text", { x: m + 170, y: fy + 26, class: "t t-sm", text: "✓ “No, I don't see a fork.”" }, fix2);
        S("text", { x: m + 370, y: fy + 26, class: "t t-sm t-muted", text: "✗ “Yes, next to the plate.”" }, fix2);
      }

      // ---- timeline
      [grid, rPix.g, rPri.g, rMod.g, yes, no1, fix1, fix2].forEach(function (e) { e.style.opacity = 0; });
      tl.addLabel("s0", 0);

      LC.popIn(tl, grid, { duration: 0.4 });
      LC.popIn(tl, rPix.g, { duration: 0.4 });
      tl.addLabel("s1");

      LC.popIn(tl, rPri.g, { duration: 0.4 });
      tl.addLabel("s2");

      LC.popIn(tl, rMod.g, { duration: 0.4 });
      LC.popIn(tl, yes, { duration: 0.4 });
      tl.addLabel("s3");

      function setVal(r, v) {
        var o = { v: r.cur }; r.cur = v;
        tl.to(o, { v: v, duration: 0.6, onUpdate: function () { r.f.setAttribute("width", r.w * o.v); r.v.textContent = o.v.toFixed(2); } }, "<");
      }
      tl.to(grid, { opacity: 0, duration: 0.4 });
      LC.popIn(tl, fix1, { duration: 0.4 }, "<");
      tl.to({}, { duration: 0.01 });
      setVal(rPix, 0.05);
      tl.to({}, { duration: 0.2 });
      setVal(rMod, 0.3);
      tl.to(yes, { opacity: 0, duration: 0.3 });
      tl.to(no1, { opacity: 1, duration: 0.3 });
      tl.addLabel("s4");

      LC.popIn(tl, fix2, { duration: 0.4 });
      tl.to({}, { duration: 0.01 });
      setVal(rMod, 0.08);
      tl.addLabel("s5");
      return tl;
    }
  };
})();
