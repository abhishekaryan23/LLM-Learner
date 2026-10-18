/* H1.1: Rosenblatt's perceptron rule on separable points, then XOR (it can't),
   then two hidden units that solve XOR. Every line shown is computed by the rule:
   output = 1 if w1*x1 + w2*x2 + b > 0, and on a mistake w += eta*(target - output)*x, b += eta*(target - output). */
(function () {
  var LC = window.LC;
  var PTS = [[0.62, 0.80, 1], [0.82, 0.58, 1], [0.88, 0.88, 1], [0.50, 0.94, 1], [0.18, 0.26, 0], [0.38, 0.14, 0], [0.16, 0.58, 0], [0.48, 0.42, 0]];
  var XOR = [[0.2, 0.2, 0], [0.2, 0.8, 1], [0.8, 0.2, 1], [0.8, 0.8, 0]];
  var ETA = 0.5, START = [0.9, 0.5, -0.4];
  function out(w, p) { return w[0] * p[0] + w[1] * p[1] + w[2] > 0 ? 1 : 0; }
  function mistakes(w, pts) { return pts.filter(function (p) { return out(w, p) !== p[2]; }).length; }
  /* run the rule; returns [{w, i}] (weights after each update and the point that caused it) */
  function train(pts, w, maxUpdates) {
    var hist = []; w = w.slice();
    for (var ep = 0; ep < 50 && hist.length < maxUpdates; ep++) {
      var any = false;
      for (var i = 0; i < pts.length && hist.length < maxUpdates; i++) {
        var e = pts[i][2] - out(w, pts[i]);
        if (e) { w = [w[0] + ETA * e * pts[i][0], w[1] + ETA * e * pts[i][1], w[2] + ETA * e]; hist.push({ w: w.slice(), i: i }); any = true; }
      }
      if (!any) break;
    }
    return hist;
  }
  var SEP = train(PTS, START, 20);                       // 3 updates, then 0 mistakes
  var XH = train(XOR, SEP[SEP.length - 1].w, 3);          // XOR: 2, 3, then 1 wrong; never 0
  LC.h1Perceptron = { out: out, mistakes: mistakes, train: train, PTS: PTS, XOR: XOR }; // shared with the playground

  /* clip the unit square to the half-plane w.u + b > 0 */
  function halfPlane(w) {
    var sq = [[0, 0], [1, 0], [1, 1], [0, 1]], res = [];
    function f(p) { return w[0] * p[0] + w[1] * p[1] + w[2]; }
    for (var i = 0; i < 4; i++) {
      var a = sq[i], b = sq[(i + 1) % 4], fa = f(a), fb = f(b);
      if (fa > 0) res.push(a);
      if ((fa > 0) !== (fb > 0)) { var t = fa / (fa - fb); res.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]); }
    }
    return res;
  }
  /* the part of the line w.u + b = 0 inside the unit square */
  function segment(w) {
    var pts = [];
    function add(x, y) { if (x > -1e-9 && x < 1 + 1e-9 && y > -1e-9 && y < 1 + 1e-9) pts.push([x, y]); }
    if (Math.abs(w[1]) > 1e-9) { add(0, -w[2] / w[1]); add(1, -(w[2] + w[0]) / w[1]); }
    if (Math.abs(w[0]) > 1e-9) { add(-w[2] / w[0], 0); add(-(w[2] + w[1]) / w[0], 1); }
    if (pts.length < 2) return null;
    pts.sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
    return [pts[0], pts[pts.length - 1]];
  }

  LC.anims["h1-1-perceptron"] = {
    title: "Perceptron: a line, XOR, then a hidden layer",
    steps: [
      "Eight examples with two inputs each: <strong>blue circles</strong> (target 1) and <strong>orange squares</strong> (target 0). The perceptron computes $w_1x_1 + w_2x_2 + b$ and answers 1 if it's positive.",
      "Its weights start arbitrary. The line where $w_1x_1 + w_2x_2 + b = 0$ is its <strong>decision boundary</strong>: the shaded side gets answer 1. Right now <strong>3 points are wrong</strong>.",
      "The <strong>learning rule</strong>: go through the points; on a mistake, add $\\eta \\times (\\text{target} - \\text{output}) \\times x$ to the weights. This orange square was called 1, so the line is pushed away from it.",
      "Two more corrections and every point is on the right side: <strong>0 mistakes</strong>. The convergence theorem (Novikoff, 1962) guarantees this always happens, in a finite number of updates, if <em>some</em> line can separate the classes.",
      "Now <strong>XOR</strong>: answer 1 only when exactly one input is on. The same rule keeps correcting and never settles: every fix breaks another point. No straight line gets all four right; the best possible is 3 of 4.",
      "Add a <strong>hidden layer</strong> of two perceptrons. $h_1$ (an OR) fires above the lower line, $h_2$ (a NAND) fires below the upper line. The output fires only when <strong>both</strong> do: the band between them.",
      "As a network: inputs → 2 hidden units → 1 output gets XOR right. Here the weights were set by hand. <strong>Backpropagation</strong> (1986) is what lets a network find hidden units like these by itself."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 420 } : { w: 640, h: 340 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var s = compact ? 216 : 260, px = compact ? 72 : 52, py = compact ? 44 : 34;
      function X(u) { return px + u * s; }
      function Y(v) { return py + (1 - v) * s; }
      var tl = gsap.timeline();

      // frame + axis labels
      S("rect", { x: px, y: py, width: s, height: s, class: "f-none", stroke: "var(--line)", "stroke-width": 1.5 }, svg);
      S("text", { x: px + s, y: py + s + 18, class: "t t-sm t-muted t-end", text: "x₁ →" }, svg);
      S("text", { x: px - 8, y: py + 12, class: "t t-sm t-muted t-end", text: "x₂" }, svg);
      S("text", { x: px - 8, y: py + 28, class: "t t-sm t-muted t-end", text: "↑" }, svg);

      var shade = S("polygon", { points: "", class: "f-blue", "fill-opacity": 0.12 }, svg);
      var line = S("path", { d: "", class: "s-ink", "stroke-width": 2.5 }, svg);
      shade.style.opacity = 0; line.style.opacity = 0;

      function drawPts(pts, g) {
        return pts.map(function (p) {
          if (p[2]) return S("circle", { cx: X(p[0]), cy: Y(p[1]), r: compact ? 8 : 9, class: "f-blue" }, g);
          return S("rect", { x: X(p[0]) - 7.5, y: Y(p[1]) - 7.5, width: 15, height: 15, rx: 2, class: "f-orange" }, g);
        });
      }
      var gSep = S("g", {}, svg), gXor = S("g", {}, svg);
      drawPts(PTS, gSep); drawPts(XOR, gXor);
      gXor.style.opacity = 0;
      var xorTicks = S("g", {}, svg);
      [["0", 0.2], ["1", 0.8]].forEach(function (t) {
        S("text", { x: X(t[1]), y: py + s + 18, class: "t t-sm t-muted t-mid", text: t[0] }, xorTicks);
        S("text", { x: px - 8, y: Y(t[1]) + 4, class: "t t-sm t-muted t-end", text: t[0] }, xorTicks);
      });
      xorTicks.style.opacity = 0;

      // status lines (one text per message, crossfaded) and a live readout
      var stX = compact ? W / 2 : 470, stY = compact ? 22 : 64, rdY = compact ? py + s + 44 : 92;
      var anchor = compact ? " t-mid" : " t-mid";
      var msgs = ["8 examples, 2 classes", "start: 3 points wrong", "a mistake → move the line", "0 mistakes ✓",
        compact ? "XOR: never 0 mistakes" : "XOR: it never settles", compact ? "2 hidden units: 0 mistakes ✓" : "2 hidden units: 0 mistakes ✓", "a 2-layer network = XOR ✓"];
      var msgEls = msgs.map(function (m, k) {
        var t = S("text", { x: stX, y: stY, class: "t" + anchor, "font-weight": 600, text: m }, svg);
        t.style.opacity = k === 0 ? 1 : 0;
        return t;
      });
      var readout = S("text", { x: stX, y: rdY, class: "t t-sm t-mono t-muted" + anchor, text: "" }, svg);
      var readW = compact ? null : S("text", { x: stX, y: rdY + 20, class: "t t-sm t-mono t-muted" + anchor, text: "" }, svg);
      readout.style.opacity = 0;
      if (readW) readW.style.opacity = 0;
      function msg(k) {
        tl.to(msgEls[k - 1], { opacity: 0, duration: 0.2 });
        tl.to(msgEls[k], { opacity: 1, duration: 0.25 });
      }

      var st = { w0: START[0], w1: START[1], w2: START[2], ds: 0 };
      function place() {
        var w = [st.w0, st.w1, st.w2];
        var seg = segment(w);
        line.setAttribute("d", seg ? "M" + X(seg[0][0]).toFixed(1) + " " + Y(seg[0][1]).toFixed(1) + "L" + X(seg[1][0]).toFixed(1) + " " + Y(seg[1][1]).toFixed(1) : "");
        shade.setAttribute("points", halfPlane(w).map(function (p) { return X(p[0]).toFixed(1) + "," + Y(p[1]).toFixed(1); }).join(" "));
        var pts = st.ds > 0.5 ? XOR : PTS;
        readout.textContent = "wrong: " + mistakes(w, pts) + " of " + pts.length;
        if (readW) readW.textContent = "w = (" + w[0].toFixed(2) + ", " + w[1].toFixed(2) + "), b = " + w[2].toFixed(2);
      }
      place();
      tl.addLabel("s0", 0);

      // s1: initial line
      msg(1);
      tl.to([line, shade, readout].concat(readW ? [readW] : []), { opacity: 1, duration: 0.4 });
      tl.addLabel("s1");

      // ring that marks the point being corrected
      var ring = S("circle", { r: 14, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 3 }, svg);
      ring.style.opacity = 0;
      function update(u, pts, dur) {
        var p = pts[u.i];
        tl.set(ring, { attr: { cx: X(p[0]), cy: Y(p[1]) } });
        tl.to(ring, { opacity: 1, duration: 0.25 });
        tl.to(st, { w0: u.w[0], w1: u.w[1], w2: u.w[2], duration: dur, ease: "power2.inOut", onUpdate: place });
        tl.to(ring, { opacity: 0, duration: 0.2 });
      }
      // s2: first update
      msg(2);
      update(SEP[0], PTS, 0.9);
      tl.addLabel("s2");
      // s3: remaining updates
      for (var k = 1; k < SEP.length; k++) update(SEP[k], PTS, 0.7);
      msg(3);
      tl.addLabel("s3");

      // s4: XOR
      msg(4);
      tl.to(gSep, { opacity: 0, duration: 0.3 }, "<");
      tl.to(st, { ds: 1, duration: 0.01, onUpdate: place });
      tl.to([gXor, xorTicks], { opacity: 1, duration: 0.35 });
      XH.forEach(function (u) { update(u, XOR, 0.6); });
      tl.addLabel("s4");

      // s5: two hidden units carve a band
      var b1 = segment([1, 1, -0.7]), b2 = segment([1, 1, -1.3]);
      function segD(sg) { return "M" + X(sg[0][0]) + " " + Y(sg[0][1]) + "L" + X(sg[1][0]) + " " + Y(sg[1][1]); }
      var band = S("polygon", { points: [[0, 0.7], [0, 1], [0.3, 1], [1, 0.3], [1, 0], [0.7, 0]].map(function (p) { return X(p[0]) + "," + Y(p[1]); }).join(" "), class: "f-blue", "fill-opacity": 0.14 }, svg);
      band.style.opacity = 0;
      var h1 = S("path", { d: segD(b1), class: "s-blue" }, svg), h2 = S("path", { d: segD(b2), class: "s-blue" }, svg);
      var h1l = S("text", { x: X(0.7), y: py + s + 18, class: "t t-sm t-blue t-mid", text: "h₁" }, svg);
      var h2l = S("text", { x: px + s + 8, y: Y(0.3) + 4, class: "t t-sm t-blue", text: "h₂" }, svg);
      h1l.style.opacity = 0; h2l.style.opacity = 0;
      svg.insertBefore(band, gSep); // under the points
      msg(5);
      tl.to([line, shade, readout].concat(readW ? [readW] : []), { opacity: 0, duration: 0.3 }, "<");
      LC.drawIn(tl, h1, { duration: 0.6 });
      LC.drawIn(tl, h2, { duration: 0.6 });
      tl.to([band, h1l, h2l], { opacity: 1, duration: 0.35 });
      tl.addLabel("s5");

      // s6: the network
      var net = S("g", {}, svg); net.style.opacity = 0;
      var xi, xh, xo, yA, yB, yM;
      if (compact) { xi = 46; xh = 170; xo = 282; yA = 336; yB = 396; yM = 366; }
      else { xi = 392; xh = 488; xo = 584; yA = 156; yB = 248; yM = 202; }
      var bw = 52, bh = 28;
      [[xi, yA, xh, yA], [xi, yA, xh, yB], [xi, yB, xh, yA], [xi, yB, xh, yB], [xh, yA, xo, yM], [xh, yB, xo, yM]].forEach(function (e) {
        S("line", { x1: e[0] + 14, y1: e[1], x2: e[2] - bw / 2, y2: e[3], class: "s-faint" }, net);
      });
      [[yA, "x₁"], [yB, "x₂"]].forEach(function (p) {
        S("circle", { cx: xi, cy: p[0], r: 14, class: "f-ink" }, net);
        S("text", { x: xi, y: p[0] + 5, class: "t t-sm t-mid t-nohalo", style: "fill:var(--a-paper)", text: p[1] }, net);
      });
      LC.h1.box(net, xh, yA, bw, bh, "OR", { size: 12, fill: "f-surface", stroke: "var(--a-blue)" });
      LC.h1.box(net, xh, yB, bw, bh, "NAND", { size: 12, fill: "f-surface", stroke: "var(--a-blue)" });
      LC.h1.box(net, xo, yM, bw, bh, "AND", { size: 12, fill: "f-surface", stroke: "var(--a-orange)" });
      S("text", { x: compact ? xo : xo, y: yM + (compact ? 34 : 36), class: "t t-sm t-orange t-mid", "font-weight": 600, text: "= XOR" }, net);
      S("text", { x: xh, y: yA - 22, class: "t t-sm t-muted t-mid", text: "hidden" }, net);
      msg(6);
      tl.to(net, { opacity: 1, duration: 0.5 });
      tl.addLabel("s6");
      return tl;
    }
  };
})();
