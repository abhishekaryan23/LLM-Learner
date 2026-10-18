/* V1.2: CLIP training on one batch of 4 image–caption pairs, then zero-shot use.
   Cosine similarities are toy numbers; softmaxes use tau = 0.07 (CLIP's initial
   temperature) and were checked in Python: row/column probabilities below are
   softmax(S / 0.07) along rows and along columns. Zero-shot uses tau = 0.01. */
(function () {
  var LC = window.LC;
  var CAPS = ["a dog", "a cat", "a car", "a tree"], KINDS = ["dog", "cat", "car", "tree"];
  var SIM = [[0.31, 0.24, 0.12, 0.15], [0.22, 0.29, 0.11, 0.14], [0.10, 0.09, 0.33, 0.13], [0.14, 0.12, 0.15, 0.28]];
  var ZS = [0.27, 0.24, 0.11, 0.14];
  function softmax(x) {
    var m = Math.max.apply(null, x), e = x.map(function (v) { return Math.exp(v - m); });
    var s = e.reduce(function (a, b) { return a + b; }, 0);
    return e.map(function (v) { return v / s; });
  }
  function rowsP(S, tau) { return S.map(function (r) { return softmax(r.map(function (v) { return v / tau; })); }); }
  function colsP(S, tau) {
    var cols = [0, 1, 2, 3].map(function (j) { return softmax(S.map(function (r) { return r[j] / tau; })); });
    return S.map(function (r, i) { return r.map(function (_, j) { return cols[j][i]; }); });
  }
  /* Simple drawn icons, centred at (cx, cy), about s units across. Shared with the playground. */
  function icon(kind, cx, cy, s, parent) {
    var S = LC.svg, g = S("g", {}, parent), u = s / 40;
    function c(x, y, r, a) { return S("circle", Object.assign({ cx: cx + x * u, cy: cy + y * u, r: r * u }, a), g); }
    if (kind === "dog") {
      S("ellipse", { cx: cx - 13 * u, cy: cy - 2 * u, rx: 6 * u, ry: 12 * u, class: "f-ink", "fill-opacity": 0.6 }, g);
      S("ellipse", { cx: cx + 13 * u, cy: cy - 2 * u, rx: 6 * u, ry: 12 * u, class: "f-ink", "fill-opacity": 0.6 }, g);
      c(0, 2, 14, { fill: "var(--a-orange)" });
      c(-5, -1, 2.2, { class: "f-ink" }); c(5, -1, 2.2, { class: "f-ink" });
      S("ellipse", { cx: cx, cy: cy + 8 * u, rx: 4 * u, ry: 3 * u, class: "f-ink" }, g);
    } else if (kind === "cat") {
      S("path", { d: "M" + (cx - 14 * u) + " " + (cy - 2 * u) + "L" + (cx - 12 * u) + " " + (cy - 19 * u) + "L" + (cx - 2 * u) + " " + (cy - 10 * u) + "Z", fill: "var(--a-blue)" }, g);
      S("path", { d: "M" + (cx + 14 * u) + " " + (cy - 2 * u) + "L" + (cx + 12 * u) + " " + (cy - 19 * u) + "L" + (cx + 2 * u) + " " + (cy - 10 * u) + "Z", fill: "var(--a-blue)" }, g);
      c(0, 2, 14, { fill: "var(--a-blue)" });
      c(-5, 0, 2.2, { class: "f-ink" }); c(5, 0, 2.2, { class: "f-ink" });
      S("path", { d: "M" + (cx - 3 * u) + " " + (cy + 7 * u) + "L" + (cx + 3 * u) + " " + (cy + 7 * u) + "L" + cx + " " + (cy + 10 * u) + "Z", class: "f-ink" }, g);
    } else if (kind === "car") {
      S("path", { d: "M" + (cx - 18 * u) + " " + (cy + 6 * u) + "V" + (cy - 1 * u) + "L" + (cx - 10 * u) + " " + (cy - 3 * u) + "L" + (cx - 5 * u) + " " + (cy - 11 * u) + "H" + (cx + 7 * u) + "L" + (cx + 12 * u) + " " + (cy - 3 * u) + "L" + (cx + 18 * u) + " " + (cy - 1 * u) + "V" + (cy + 6 * u) + "Z", class: "f-ink", "fill-opacity": 0.8 }, g);
      S("rect", { x: cx - 3 * u, y: cy - 9 * u, width: 8 * u, height: 6 * u, class: "f-paper" }, g);
      c(-10, 7, 4.5, { class: "f-paper", stroke: "var(--a-ink)", "stroke-width": 2.5 * u });
      c(10, 7, 4.5, { class: "f-paper", stroke: "var(--a-ink)", "stroke-width": 2.5 * u });
    } else {
      S("rect", { x: cx - 3 * u, y: cy + 4 * u, width: 6 * u, height: 14 * u, fill: "var(--warm)" }, g);
      c(0, -6, 13, { fill: "var(--good)" });
      c(-8, 2, 8, { fill: "var(--good)" }); c(8, 2, 8, { fill: "var(--good)" });
    }
    return g;
  }
  LC.clipData = { caps: CAPS, kinds: KINDS, sim: SIM, softmax: softmax, rowsP: rowsP, colsP: colsP, icon: icon };

  var TAU = 0.07, RP = rowsP(SIM, TAU), CP = colsP(SIM, TAU);
  function lossOf(P) { return -[0, 1, 2, 3].reduce(function (a, i) { return a + Math.log(P[i][i]); }, 0) / 4; }
  var LOSS = (lossOf(RP) + lossOf(CP)) / 2;

  LC.anims["v1-2-clip"] = {
    title: "CLIP: one training batch, then zero-shot",
    steps: [
      "A batch of $N$ image–caption pairs scraped from the web (here $N = 4$; CLIP used 32,768). Each image's own caption is its <strong>positive</strong>; the other captions are <strong>negatives</strong>.",
      "An <strong>image encoder</strong> (a ViT or ResNet) and a <strong>text encoder</strong> (a Transformer) map each input to a vector in the <strong>same space</strong>, scaled to length 1.",
      "Compare every image with every caption: the <strong>cosine similarity</strong> (a dot product of unit vectors). That gives an $N \\times N$ matrix.",
      "Training wants the <strong>diagonal</strong> (matching pairs) high and everything <strong>off the diagonal</strong> low: pull partners together, push strangers apart.",
      "Divide by a temperature $\\tau$ and take a <strong>softmax over each row</strong>: for each image, a probability for every caption. The loss is cross-entropy with the diagonal as the right answer.",
      "Do the same <strong>down each column</strong> (for each caption, which image?). CLIP's loss is the <strong>average of the two directions</strong>: the symmetric InfoNCE loss.",
      "After training, classify with <strong>no new training</strong>: embed prompts like “a photo of a dog”, embed the image, and pick the most similar prompt. This is <strong>zero-shot</strong> classification (τ = 0.01)."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 406 } : { w: 640, h: 400 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      var top = compact ? 22 : 0;
      var cs = compact ? 56 : 64, cg = compact ? 4 : 5, mx = compact ? 98 : 232, my = 60 + top;
      var icX = compact ? 28 : 150, vecX = compact ? 54 : 178;
      var cell = 8, vg = 2, vw = 3 * cell + 2 * vg;
      function ccx(j) { return mx + j * (cs + cg) + cs / 2; }
      function rcy(i) { return my + i * (cs + cg) + cs / 2; }
      var mBottom = my + 4 * cs + 3 * cg;
      var noteY1 = mBottom + 24, noteY2 = mBottom + 46;
      var main = S("g", {}, svg);

      // s0: images (rows) and captions (columns)
      var icons = KINDS.map(function (k, i) { return icon(k, icX, rcy(i), compact ? 38 : 44, main); });
      var caps = CAPS.map(function (c, j) { return S("text", { x: ccx(j), y: 18 + top, class: "t t-sm t-mid", text: "“" + c + "”" }, main); });
      tl.addLabel("s0", 0);

      // s1: encoders → unit vectors
      var shades = [[0.9, 0.4, 0.6], [0.7, 0.5, 0.9], [0.3, 0.9, 0.4], [0.5, 0.3, 0.8]];
      function vec(x, y, sh, cls) {
        var g = S("g", {}, main);
        sh.forEach(function (v, d) { S("rect", { x: x + d * (cell + vg), y: y, width: cell, height: cell, rx: 2, class: cls, "fill-opacity": (0.25 + 0.75 * v).toFixed(2) }, g); });
        return g;
      }
      var tv = CAPS.map(function (_, j) { return vec(ccx(j) - vw / 2, 30 + top, shades[j], "f-orange"); });
      var iv = KINDS.map(function (_, i) { return vec(vecX, rcy(i) - cell / 2, shades[i], "f-blue"); });
      var encT = S("text", { x: compact ? 4 : mx - 10, y: 38 + top, class: "t t-sm t-orange" + (compact ? "" : " t-end"), text: compact ? "text →" : "text encoder →" }, main);
      var encI = compact ? null : S("text", { x: vecX + vw / 2, y: my - 8, class: "t t-sm t-blue t-mid", text: "image enc. ↓" }, main);
      LC.popIn(tl, tv.concat(iv, [encT], encI ? [encI] : []), { duration: 0.35, stagger: 0.05 });
      tl.addLabel("s1");

      // s2: similarity matrix
      var rects = [], tSim = [], tRow = [], tCol = [];
      function txt(i, j, v, strong) {
        return S("text", { x: ccx(j), y: rcy(i) + 4.5, class: "t t-mono t-mid t-nohalo", "font-size": 12.5, text: v.toFixed(2), style: strong ? "fill:var(--a-paper)" : "" }, main);
      }
      SIM.forEach(function (r, i) {
        r.forEach(function (v, j) {
          var op = Math.max(0.08, Math.min(1, (v - 0.05) / 0.3));
          rects.push(S("rect", { x: ccx(j) - cs / 2, y: rcy(i) - cs / 2, width: cs, height: cs, rx: 6, class: "f-blue", "fill-opacity": op.toFixed(2) }, main));
          tSim.push(txt(i, j, v, op > 0.78));
          var pr = RP[i][j], pc = CP[i][j];
          tRow.push(txt(i, j, pr, 0.08 + 0.9 * pr > 0.78));
          tCol.push(txt(i, j, pc, 0.08 + 0.9 * pc > 0.78));
        });
      });
      tRow.concat(tCol).forEach(function (t) { t.style.opacity = 0; });
      LC.popIn(tl, rects, { duration: 0.25, stagger: 0.03 });
      LC.popIn(tl, tSim, { duration: 0.25, stagger: 0.02 }, "-=0.3");
      var note2 = S("text", { x: mx + (4 * cs + 3 * cg) / 2, y: noteY1, class: "t t-sm t-muted t-mid", text: "cosine similarity, image · caption" }, main);
      LC.popIn(tl, [note2], { duration: 0.3 });
      tl.addLabel("s2");

      // s3: diagonal = pull, off-diagonal = push
      var diag = [0, 1, 2, 3].map(function (i) {
        return S("rect", { x: ccx(i) - cs / 2 - 2, y: rcy(i) - cs / 2 - 2, width: cs + 4, height: cs + 4, rx: 8, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 3 }, main);
      });
      var n3a = S("text", { x: mx + (4 * cs + 3 * cg) / 2, y: noteY1, class: "t t-sm t-orange t-mid", "font-weight": 600, text: "diagonal: matching pairs, pull up ↑" }, main);
      var n3b = S("text", { x: mx + (4 * cs + 3 * cg) / 2, y: noteY2, class: "t t-sm t-muted t-mid", text: "everything else: push down ↓" }, main);
      tl.to(note2, { opacity: 0, duration: 0.2 });
      LC.popIn(tl, diag, { duration: 0.3, stagger: 0.08 });
      LC.popIn(tl, [n3a, n3b], { duration: 0.3 });
      tl.addLabel("s3");

      // s4: row softmax
      var n4a = S("text", { x: mx + (4 * cs + 3 * cg) / 2, y: noteY1, class: "t t-sm t-mid", text: "softmax along each row, τ = 0.07" }, main);
      var n4b = S("text", { x: mx + (4 * cs + 3 * cg) / 2, y: noteY2, class: "t t-sm t-muted t-mid", text: "rows sum to 1: image → which caption?" }, main);
      n4a.style.opacity = 0; n4b.style.opacity = 0;
      tl.to(tSim.concat([n3a, n3b]), { opacity: 0, duration: 0.25 });
      rects.forEach(function (r, k) { tl.to(r, { attr: { "fill-opacity": (0.08 + 0.9 * RP[Math.floor(k / 4)][k % 4]).toFixed(2) }, duration: 0.4 }, "<"); });
      tl.to(tRow.concat([n4a, n4b]), { opacity: 1, duration: 0.3 });
      tl.addLabel("s4");

      // s5: column softmax + loss
      var n5a = S("text", { x: mx + (4 * cs + 3 * cg) / 2, y: noteY1, class: "t t-sm t-mid", text: "softmax down each column" }, main);
      var n5b = S("text", { x: mx + (4 * cs + 3 * cg) / 2, y: noteY2, class: "t t-sm t-orange t-mid", "font-weight": 600, text: "loss = average of both ≈ " + LOSS.toFixed(2) }, main);
      n5a.style.opacity = 0; n5b.style.opacity = 0;
      tl.to(tRow.concat([n4a, n4b]), { opacity: 0, duration: 0.25 });
      rects.forEach(function (r, k) { tl.to(r, { attr: { "fill-opacity": (0.08 + 0.9 * CP[Math.floor(k / 4)][k % 4]).toFixed(2) }, duration: 0.4 }, "<"); });
      tl.to(tCol.concat([n5a, n5b]), { opacity: 1, duration: 0.3 });
      tl.addLabel("s5");

      // s6: zero-shot classification
      var zs = S("g", {}, svg);
      zs.style.opacity = 0;
      var P = softmax(ZS.map(function (v) { return v / 0.01; }));
      var qx = compact ? W / 2 : 130, qy = compact ? 72 : 150, qs = compact ? 64 : 96;
      S("rect", { x: qx - qs / 2 - 8, y: qy - qs / 2 - 8, width: qs + 16, height: qs + 16, rx: 12, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, zs);
      icon("dog", qx, qy, qs, zs);
      S("text", { x: qx, y: qy + qs / 2 + 26, class: "t t-sm t-muted t-mid", text: "new image" }, zs);
      var lx = compact ? 12 : 250, bx = compact ? 124 : 380, bw = compact ? 120 : 130, vx = W - (compact ? 10 : 30);
      var r0 = compact ? 186 : 70, rs = compact ? 36 : 44;
      S("text", { x: lx, y: r0 - 30, class: "t t-sm t-muted", text: "prompt" }, zs);
      S("text", { x: vx, y: r0 - 30, class: "t t-sm t-muted t-end", text: "cos → p" }, zs);
      var best = 0;
      CAPS.forEach(function (c, j) {
        var y = r0 + j * rs;
        S("text", { x: lx, y: y + 5, class: "t t-sm", text: "a photo of " + c, "font-weight": j === best ? 650 : 400 }, zs);
        S("rect", { x: bx, y: y - 8, width: bw, height: 14, rx: 4, class: "f-surface2" }, zs);
        S("rect", { x: bx, y: y - 8, width: Math.max(3, bw * ZS[j] / 0.3), height: 14, rx: 4, class: j === best ? "f-orange" : "f-blue", "fill-opacity": j === best ? 1 : 0.55 }, zs);
        S("text", { x: vx, y: y + 5, class: "t t-sm t-mono t-end", text: ZS[j].toFixed(2) + " → " + P[j].toFixed(2), "font-weight": j === best ? 650 : 400 }, zs);
      });
      S("text", { x: compact ? W / 2 : (lx + vx) / 2, y: r0 + 4 * rs + 14, class: "t t-orange t-mid", "font-weight": 600, text: "prediction: dog (p = " + P[0].toFixed(2) + ")" }, zs);
      tl.to(main, { opacity: 0, duration: 0.4 });
      tl.to(zs, { opacity: 1, duration: 0.5 });
      tl.addLabel("s6");
      return tl;
    }
  };
})();
