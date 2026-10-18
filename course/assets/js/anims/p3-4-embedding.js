/* P3.4: token IDs -> rows of the embedding table (one-hot × E = a row lookup),
   then a toy 2-D picture of a trained embedding space: clusters, cosine similarity,
   and the king − man + woman ≈ queen analogy. All vectors are illustrative toys. */
(function () {
  var LC = window.LC;
  var VOCAB = ["the", "cat", "dog", "sat", "on", "mat"];
  // toy 6 × 4 table, shaded by value in [0, 1]
  var E = [[0.2, 0.7, 0.4, 0.3], [0.9, 0.3, 0.8, 0.2], [0.85, 0.35, 0.7, 0.3], [0.3, 0.2, 0.5, 0.9], [0.15, 0.6, 0.3, 0.4], [0.5, 0.9, 0.2, 0.6]];
  var SENT = [0, 1, 3]; // "the cat sat"
  function deg(a) { return a * Math.PI / 180; }

  LC.anims["p3-4-embedding"] = {
    title: "From token IDs to vectors, and what the vectors learn",
    steps: [
      "The tokenizer (P3.3) turns “the cat sat” into integer IDs. In this toy vocabulary of 6 tokens: the = 0, cat = 1, sat = 3.",
      "The <strong>embedding table</strong> $E$ has one row per vocabulary entry and $d$ columns: here 6 × 4. For GPT-2 small it's 50,257 × 768. Every number in it is a learned parameter.",
      "Feeding token 1 in as a <strong>one-hot</strong> vector (a 1 at position 1, zeros elsewhere) and multiplying by $E$ just <strong>picks out row 1</strong>. That row is cat's vector.",
      "So in practice nobody multiplies: the layer simply <strong>indexes rows</strong>. The sentence becomes a sequence of vectors, the input to the transformer.",
      "After training, the vectors are anything but random. Drawn here as a toy 2-D picture (real ones have hundreds or thousands of dimensions), <strong>similar words end up near each other</strong>.",
      "Similarity is measured by the <strong>angle</strong> between vectors: cosine similarity. cat and dog point almost the same way (cos ≈ 0.99); cat and car do not (cos ≈ 0.31).",
      "Directions can carry meaning too. The step from man to woman is roughly the same as from king to queen, so <strong>king − man + woman</strong> lands near <strong>queen</strong>. A famous result for word2vec, with caveats (see below)."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 348 } : { w: 640, h: 348 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var tl = gsap.timeline();

      /* ---------- scene 1: lookup ---------- */
      var s1 = S("g", { transform: compact ? "" : "translate(140,0)" }, svg);
      var tokX = [56, 124, 192], tokW = 60;
      S("text", { x: 4, y: 25, class: "t t-sm t-muted", text: "text" }, s1);
      SENT.forEach(function (id, i) {
        S("rect", { x: tokX[i], y: 8, width: tokW, height: 26, rx: 7, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, s1);
        S("text", { x: tokX[i] + tokW / 2, y: 26, class: "t t-sm t-mid t-nohalo", text: VOCAB[id] }, s1);
      });
      var ids = S("g", {}, s1);
      S("text", { x: 4, y: 56, class: "t t-sm t-muted", text: "IDs" }, ids);
      SENT.forEach(function (id, i) { S("text", { x: tokX[i] + tokW / 2, y: 56, class: "t t-sm t-mono t-mid t-orange", "font-weight": 650, text: id }, ids); });

      var tY = 100, rowH = 24, cell = 22, cg = 3, tX = 112, ohX = 70;
      var table = S("g", {}, s1);
      S("text", { x: tX + (4 * (cell + cg)) / 2, y: tY - 10, class: "t t-sm t-muted t-mid", text: "E (6 × 4)" }, table);
      VOCAB.forEach(function (t, r) {
        S("text", { x: 54, y: tY + r * rowH + 16, class: "t t-sm t-end", text: r + " " + t }, table);
        E[r].forEach(function (v, c) {
          S("rect", { x: tX + c * (cell + cg), y: tY + r * rowH + 1, width: cell, height: rowH - 4, rx: 3, class: "f-blue", "fill-opacity": (0.15 + 0.85 * v).toFixed(2) }, table);
        });
      });
      table.style.opacity = 0;
      var rowHL = S("rect", { x: tX - 4, y: tY + 1 * rowH - 2, width: 4 * (cell + cg) + 5, height: rowH + 2, rx: 6, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 2.5 }, s1);
      rowHL.style.opacity = 0;

      // one-hot column for "cat"
      var oh = S("g", {}, s1);
      S("text", { x: ohX + 9, y: tY - 10, class: "t t-sm t-muted t-mid", text: "1-hot" }, oh);
      VOCAB.forEach(function (_, r) {
        S("rect", { x: ohX, y: tY + r * rowH + 1, width: 18, height: rowH - 4, rx: 3, class: r === 1 ? "f-orange" : "f-faint", "fill-opacity": r === 1 ? 1 : 0.5 }, oh);
        S("text", { x: ohX + 9, y: tY + r * rowH + 15, class: "t t-sm t-mono t-mid t-nohalo", style: r === 1 ? "fill:#fff" : "", text: r === 1 ? "1" : "0" }, oh);
      });
      S("text", { x: ohX + 30, y: tY + 1 * rowH + 15, class: "t t-sm t-mid", text: "×" }, oh);
      oh.style.opacity = 0;

      // output vectors
      var oY = 270, outRows = SENT.map(function (id, i) {
        var g = S("g", {}, s1);
        S("text", { x: 54, y: oY + i * rowH + 16, class: "t t-sm t-end", text: VOCAB[id] }, g);
        E[id].forEach(function (v, c) {
          S("rect", { x: tX + c * (cell + cg), y: oY + i * rowH + 1, width: cell, height: rowH - 4, rx: 3, class: "f-orange", "fill-opacity": (0.15 + 0.85 * v).toFixed(2) }, g);
        });
        g.style.opacity = 0;
        return g;
      });
      var outHead = S("text", { x: 4, y: oY - 10, class: "t t-sm t-muted", text: "vectors into the transformer" }, s1);
      outHead.style.opacity = 0;
      var copy = S("g", {}, s1);
      E[1].forEach(function (v, c) { S("rect", { x: tX + c * (cell + cg), y: tY + rowH + 1, width: cell, height: rowH - 4, rx: 3, class: "f-orange", "fill-opacity": (0.15 + 0.85 * v).toFixed(2) }, copy); });
      copy.style.opacity = 0;
      tl.addLabel("s0", 0);

      LC.popIn(tl, table, { duration: 0.5 }, "+=0.02");
      tl.addLabel("s1");
      LC.popIn(tl, oh, { duration: 0.4 }, "+=0.02");
      LC.popIn(tl, rowHL, { duration: 0.3 });
      tl.set(copy, { opacity: 1, y: 0 });
      LC.popIn(tl, outHead, { duration: 0.3 });
      tl.to(copy, { y: oY + rowH - (tY + rowH), duration: 0.8, ease: "power2.inOut" }, "<");
      tl.set(outRows[1], { opacity: 1 });
      tl.set(copy, { opacity: 0 });
      tl.addLabel("s2");
      tl.to([oh, rowHL], { opacity: 0, duration: 0.3 }, "+=0.02");
      [0, 2].forEach(function (i) {
        var r = SENT[i];
        tl.set(rowHL, { attr: { y: tY + r * rowH - 2 } });
        tl.to(rowHL, { opacity: 1, duration: 0.2 });
        LC.popIn(tl, outRows[i], { duration: 0.4 });
        tl.to(rowHL, { opacity: 0, duration: 0.2 });
      });
      tl.addLabel("s3");

      /* ---------- scene 2: the embedding space ---------- */
      var s2 = S("g", {}, svg);
      s2.style.opacity = 0;
      var ox = compact ? 36 : 170, oy = 312, kx = 1; // same geometry in both layouts, so the drawn angles match the cosines
      function P(r, a) { return [ox + kx * r * Math.cos(deg(a)), oy - r * Math.sin(deg(a))]; }
      var PTS = [
        { w: "cat", r: 205, a: 80, c: "f-orange" }, { w: "dog", r: 225, a: 74, c: "f-orange" }, { w: "horse", r: 175, a: 70, c: "f-orange" },
        { w: "apple", r: 200, a: 46, c: "f-blue" }, { w: "banana", r: 240, a: 41, c: "f-blue" }, { w: "cherry", r: 160, a: 50, c: "f-blue" },
        { w: "car", r: 230, a: 8, c: "f-ink" }, { w: "bus", r: 270, a: 15, c: "f-ink" }, { w: "train", r: 280, a: 4, c: "f-ink" }
      ];
      S("path", { d: "M" + ox + " " + (oy - 250) + "V" + oy + "H" + (W - 10), class: "s-grid" }, s2);
      S("circle", { cx: ox, cy: oy, r: 3, class: "f-ink" }, s2);
      var leg = S("g", {}, s2);
      [["f-orange", "animals"], ["f-blue", "fruit"], ["f-ink", "vehicles"]].forEach(function (L, i) {
        var x = 8 + i * (compact ? 82 : 100);
        S("circle", { cx: x + 5, cy: 14, r: 5, class: L[0] }, leg);
        S("text", { x: x + 14, y: 18, class: "t t-sm", text: L[1] }, leg);
      });
      var dots = PTS.map(function (p) {
        var xy = P(p.r, p.a), g = S("g", {}, s2);
        S("circle", { cx: xy[0], cy: xy[1], r: 5.5, class: p.c }, g);
        S("text", { x: p.w === "cat" ? xy[0] - 9 : xy[0] + 9, y: xy[1] + 4, class: "t t-sm" + (p.w === "cat" ? " t-end" : ""), text: p.w }, g);
        g.style.opacity = 0; p.xy = xy;
        return g;
      });
      function arrow(xy, cls, g) {
        var dx = xy[0] - ox, dy = xy[1] - oy, L = Math.sqrt(dx * dx + dy * dy), ux = dx / L, uy = dy / L;
        var ex = xy[0] - ux * 8, ey = xy[1] - uy * 8;
        var line = S("path", { d: "M" + ox + " " + oy + "L" + ex.toFixed(1) + " " + ey.toFixed(1), class: cls, "stroke-width": 2.5 }, g);
        var hx = ex - ux * 9, hy = ey - uy * 9;
        var head = S("path", { d: "M" + (hx - uy * 5).toFixed(1) + " " + (hy + ux * 5).toFixed(1) + "L" + ex.toFixed(1) + " " + ey.toFixed(1) + "L" + (hx + uy * 5).toFixed(1) + " " + (hy - ux * 5).toFixed(1), class: cls, "stroke-width": 2.5 }, g);
        head.style.opacity = 0;
        return [line, head];
      }
      var aCat = arrow(PTS[0].xy, "s-orange", s2), aDog = arrow(PTS[1].xy, "s-orange", s2), aCar = arrow(PTS[6].xy, "s-ink", s2);
      var cosT = S("text", { x: 4, y: 42, class: "t t-sm t-mono", text: compact ? "cos(cat,dog)=0.99  cos(cat,car)=0.31" : "cos(cat, dog) = 0.99    cos(cat, car) = 0.31" }, s2);
      cosT.style.opacity = 0;

      tl.to(s1, { opacity: 0, duration: 0.4 }, "+=0.02");
      tl.set(s2, { opacity: 1 });
      tl.to(dots, { opacity: 1, duration: 0.3, stagger: 0.08 });
      tl.addLabel("s4");
      [aCat, aDog, aCar].forEach(function (a) { LC.drawIn(tl, a[0], { duration: 0.5 }); LC.popIn(tl, a[1], { duration: 0.15 }); });
      LC.popIn(tl, cosT, { duration: 0.3 });
      tl.addLabel("s5");

      /* ---------- scene 3: analogy ---------- */
      var s3 = S("g", {}, svg);
      s3.style.opacity = 0;
      var sx = compact ? 1 : 1.6, bx = compact ? 0 : 40;
      var A = { man: [bx + 70 * sx, 262], woman: [bx + 82 * sx, 132], king: [bx + 232 * sx, 250], queen: [bx + 262 * sx, 112] };
      var RES = [A.king[0] + A.woman[0] - A.man[0], A.king[1] + A.woman[1] - A.man[1]];
      function vec(a, b, cls, dash, g) {
        var dx = b[0] - a[0], dy = b[1] - a[1], L = Math.sqrt(dx * dx + dy * dy), ux = dx / L, uy = dy / L;
        var ex = b[0] - ux * 9, ey = b[1] - uy * 9, hx = ex - ux * 9, hy = ey - uy * 9;
        var line = S("path", { d: "M" + (a[0] + ux * 8).toFixed(1) + " " + (a[1] + uy * 8).toFixed(1) + "L" + ex.toFixed(1) + " " + ey.toFixed(1), class: cls, "stroke-width": 2.5 }, g);
        if (dash) line.setAttribute("stroke-dasharray", "6 5");
        var head = S("path", { d: "M" + (hx - uy * 5).toFixed(1) + " " + (hy + ux * 5).toFixed(1) + "L" + ex.toFixed(1) + " " + ey.toFixed(1) + "L" + (hx + uy * 5).toFixed(1) + " " + (hy - ux * 5).toFixed(1), class: cls, "stroke-width": 2.5 }, g);
        head.style.opacity = 0;
        return [line, head];
      }
      var pts3 = [["man", 0, 22], ["woman", 0, -14], ["king", 0, 22], ["queen", 0, -14]].map(function (p) {
        var g = S("g", {}, s3), xy = A[p[0]];
        S("circle", { cx: xy[0], cy: xy[1], r: 6, class: p[0] === "queen" ? "f-blue" : "f-ink" }, g);
        S("text", { x: xy[0] + p[1], y: xy[1] + p[2], class: "t t-sm t-mid", text: p[0] }, g);
        return g;
      });
      var resDot = S("circle", { cx: RES[0], cy: RES[1], r: 7, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 2.5 }, s3);
      resDot.style.opacity = 0;
      var v1 = vec(A.man, A.woman, "s-blue", false, s3), v2 = vec(A.king, RES, "s-orange", true, s3);
      var eq = S("text", { x: 4, y: 42, class: "t t-sm t-mono", text: "king − man + woman ≈ queen" }, s3);
      var dirL = S("text", { x: (A.man[0] + A.woman[0]) / 2 + 10, y: (A.man[1] + A.woman[1]) / 2 + 4, class: "t t-sm t-blue", text: "+ (woman − man)" }, s3);
      [eq, dirL].forEach(function (e) { e.style.opacity = 0; });
      tl.to(s2, { opacity: 0, duration: 0.4 }, "+=0.02");
      tl.set(s3, { opacity: 1 });
      LC.drawIn(tl, v1[0], { duration: 0.5 });
      LC.popIn(tl, [v1[1], dirL], { duration: 0.2 });
      LC.drawIn(tl, v2[0], { duration: 0.6 });
      LC.popIn(tl, [v2[1], resDot, eq], { duration: 0.3 });
      tl.addLabel("s6");
      return tl;
    }
  };
})();
