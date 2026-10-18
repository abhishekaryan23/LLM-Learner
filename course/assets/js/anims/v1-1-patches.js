/* V1.1: how a Vision Transformer reads an image.
   Image → 3 × 3 patch grid (ViT-B/16 uses 14 × 14) → patches in a row → linear
   patch embedding → [CLS] + position embeddings → Transformer encoder → class.
   The final probability is illustrative. */
(function () {
  var LC = window.LC;
  var uid = 0;
  // shades for the toy embedding vectors (3 cells per token)
  var VEC = [[0.9, 0.5, 0.7], [0.3, 0.8, 0.5], [0.6, 0.4, 0.9], [0.8, 0.3, 0.4], [0.4, 0.9, 0.6],
             [0.7, 0.6, 0.3], [0.5, 0.3, 0.8], [0.9, 0.7, 0.4], [0.3, 0.5, 0.7], [0.6, 0.8, 0.5]];

  LC.anims["v1-1-patches"] = {
    title: "From pixels to tokens: how a ViT reads an image",
    steps: [
      "An image is a grid of numbers: <strong>224 × 224</strong> pixels × 3 colour channels = 150,528 numbers. One token per pixel would be far too many for attention.",
      "Cut it into <strong>patches</strong>. ViT-B/16 uses 16 × 16-pixel patches, so a 224 × 224 image becomes a 14 × 14 grid of <strong>196 patches</strong> (drawn here as 3 × 3).",
      "Read the patches left to right, top to bottom, into a <strong>sequence</strong>, like words in a sentence. Each patch is now a <strong>token</strong>.",
      "Flatten each patch (16·16·3 = <strong>768</strong> numbers) and multiply it by one shared, learned matrix $E$: the <strong>linear patch embedding</strong>. Every patch becomes a $D$-dimensional vector.",
      "Prepend a learned <strong>[CLS]</strong> token and add a learned <strong>position embedding</strong> to every token (the numbers), so the model knows where each patch came from. 196 + 1 = <strong>197 tokens</strong>.",
      "Run a standard <strong>Transformer encoder</strong> (ViT-B: 12 layers). There is no causal mask: every patch attends to every other patch, near or far, from the first layer on.",
      "Take the <strong>[CLS]</strong> token's final vector and pass it through a small <strong>classification head</strong>. The other outputs are ignored for classification, but they are what detection and segmentation build on (illustrative probability)."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 440 } : { w: 640, h: 432 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      var id = "v11c" + (++uid);
      var side = 150, ps = side / 3, ix = (W - side) / 2, iy = 30;
      var tile = compact ? 28 : 40, tgap = compact ? 6 : 10, nSlots = 10;
      var rowW = nSlots * tile + (nSlots - 1) * tgap, rx0 = (W - rowW) / 2;
      var rowY = compact ? 214 : 212;
      var cell = compact ? 8 : 10, cgap = compact ? 2 : 3, vecW = 3 * cell + 2 * cgap;
      var vecY = rowY + tile + 10, posY = vecY + cell + 22;
      var encY = posY + 16, encH = compact ? 44 : 46, outY = encY + encH + 14, headY = outY + cell + 38;
      function sx(k) { return rx0 + k * (tile + tgap); }   // left edge of slot k
      function scx(k) { return sx(k) + tile / 2; }         // centre of slot k

      var defs = S("defs", {}, svg);
      function picture(parent) {
        var g = S("g", {}, parent);
        S("rect", { x: ix, y: iy, width: side, height: side, fill: "var(--a-blue)", "fill-opacity": 0.2 }, g);
        S("circle", { cx: ix + 120, cy: iy + 30, r: 16, class: "f-orange" }, g);
        S("ellipse", { cx: ix + 30, cy: iy + 122, rx: 70, ry: 30, fill: "var(--good)", "fill-opacity": 0.35 }, g);
        S("rect", { x: ix, y: iy + 116, width: side, height: side - 116, fill: "var(--good)", "fill-opacity": 0.5 }, g);
        S("rect", { x: ix + 48, y: iy + 72, width: 54, height: 50, class: "f-paper", stroke: "var(--a-ink)", "stroke-width": 1.5 }, g);
        S("path", { d: "M" + (ix + 40) + " " + (iy + 76) + "L" + (ix + 75) + " " + (iy + 44) + "L" + (ix + 110) + " " + (iy + 76) + "Z", class: "f-orange", "fill-opacity": 0.8 }, g);
        S("rect", { x: ix + 66, y: iy + 96, width: 16, height: 26, class: "f-ink", "fill-opacity": 0.75 }, g);
        S("rect", { x: ix + 86, y: iy + 84, width: 11, height: 11, class: "f-blue" }, g);
        return g;
      }

      // s0: image outline (stays as the "hole" once the patches leave) + 9 clipped tiles
      var hole = S("rect", { x: ix, y: iy, width: side, height: side, rx: 2, class: "f-none", stroke: "var(--a-faint)", "stroke-width": 1.5, "stroke-dasharray": "4 4" }, svg);
      var imgLbl = S("text", { x: W / 2, y: 18, class: "t t-sm t-muted t-mid", text: "image: 224 × 224 × 3" }, svg);
      var gcp = S("clipPath", { id: id + "-g" }, defs);
      S("rect", { x: ix, y: iy, width: side, height: side }, gcp);
      var ghost = S("g", { "clip-path": "url(#" + id + "-g)" }, svg);
      picture(ghost);
      ghost.style.opacity = 0;
      var tiles = [], borders = [];
      for (var k = 0; k < 9; k++) {
        var r = Math.floor(k / 3), c = k % 3, px = ix + c * ps, py = iy + r * ps;
        var cp = S("clipPath", { id: id + "-" + k }, defs);
        S("rect", { x: px, y: py, width: ps, height: ps }, cp);
        var outer = S("g", {}, svg);
        var inner = S("g", { "clip-path": "url(#" + id + "-" + k + ")" }, outer);
        picture(inner);
        borders.push(S("rect", { x: px, y: py, width: ps, height: ps, class: "f-none", stroke: "var(--a-ink)", "stroke-width": 1.5 * ps / tile }, outer));
        tiles.push({ g: outer, px: px, py: py });
      }
      borders.forEach(function (b) { b.style.opacity = 0; });
      tl.addLabel("s0", 0);

      // s1: grid lines
      var gridLines = [1, 2].map(function (i) {
        return S("path", { d: "M" + (ix + i * ps) + " " + iy + "V" + (iy + side), class: "s-ink", "stroke-width": 2 }, svg);
      }).concat([1, 2].map(function (i) {
        return S("path", { d: "M" + ix + " " + (iy + i * ps) + "H" + (ix + side), class: "s-ink", "stroke-width": 2 }, svg);
      }));
      var gridLbl = S("text", { x: W / 2, y: iy + side + 18, class: "t t-sm t-mid", text: compact ? "3 × 3 here (ViT-B/16: 14 × 14)" : "3 × 3 patches here (ViT-B/16 uses 14 × 14 = 196)" }, svg);
      gridLines.forEach(function (p, i) { LC.drawIn(tl, p, { duration: 0.5 }, i ? "<0.1" : undefined); });
      LC.popIn(tl, [gridLbl], { duration: 0.4 }, "-=0.2");
      tl.addLabel("s1");

      // s2: tiles fly into a row (slot 0 is reserved for [CLS])
      tl.to(gridLines, { opacity: 0, duration: 0.3 });
      tl.to(borders, { opacity: 1, duration: 0.3 }, "<");
      tl.to(ghost, { opacity: 0.22, duration: 0.3 }, "<0.05");
      var sc = tile / ps;
      tiles.forEach(function (t, k) {
        gsap.set(t.g, { svgOrigin: t.px + " " + t.py });
        tl.to(t.g, { x: sx(k + 1) - t.px, y: rowY - t.py, scale: sc, duration: 0.8, ease: "power2.inOut" }, k ? "<0.08" : "+=0.05");
      });
      var nums = tiles.map(function (t, k) {
        return S("text", { x: scx(k + 1), y: rowY + tile + 16, class: "t t-sm t-muted t-mid", text: String(k + 1) }, svg);
      });
      LC.popIn(tl, nums, { duration: 0.3, stagger: 0.03 });
      tl.addLabel("s2");

      // s3: linear patch embedding → one vector per patch
      function vecCells(k, cls, y) {
        var g = S("g", {}, svg);
        VEC[k].forEach(function (v, d) {
          S("rect", { x: scx(k) - vecW / 2 + d * (cell + cgap), y: y, width: cell, height: cell, rx: 2, class: cls, "fill-opacity": (0.25 + 0.75 * v).toFixed(2) }, g);
        });
        return g;
      }
      var vecs = [];
      for (k = 1; k < nSlots; k++) vecs.push(vecCells(k, "f-blue", vecY));
      var rowLbls = {};
      if (!compact) {
        rowLbls.tok = S("text", { x: 8, y: rowY + tile / 2 + 4, class: "t t-sm t-muted", text: "patches" }, svg);
        rowLbls.vec = S("text", { x: 8, y: vecY + cell - 1, class: "t t-sm t-muted", text: "× E" }, svg);
        rowLbls.pos = S("text", { x: 8, y: posY, class: "t t-sm t-muted", text: "+ position" }, svg);
        rowLbls.out = S("text", { x: 8, y: outY + cell - 1, class: "t t-sm t-muted", text: "outputs" }, svg);
      }
      LC.popIn(tl, vecs.concat(rowLbls.tok ? [rowLbls.tok, rowLbls.vec] : []), { duration: 0.3, stagger: 0.06 });
      tl.to(nums, { opacity: 0, duration: 0.3 }, "<");
      tl.addLabel("s3");

      // s4: [CLS] token + position embeddings
      var cls = S("g", {}, svg);
      S("rect", { x: sx(0), y: rowY, width: tile, height: tile, rx: 4, class: "f-surface2", stroke: "var(--a-orange)", "stroke-width": 2 }, cls);
      S("text", { x: scx(0), y: rowY + tile / 2 + 4, class: "t t-sm t-mid t-nohalo", text: "CLS", "font-weight": 600 }, cls);
      var clsVec = vecCells(0, "f-orange", vecY);
      var pos = [];
      for (k = 0; k < nSlots; k++) pos.push(S("text", { x: scx(k), y: posY, class: "t t-sm t-mono t-mid t-blue", text: String(k) }, svg));
      LC.popIn(tl, [cls, clsVec], { duration: 0.4 });
      LC.popIn(tl, pos.concat(rowLbls.pos ? [rowLbls.pos] : []), { duration: 0.3, stagger: 0.04 });
      tl.addLabel("s4");

      // s5: Transformer encoder (bidirectional)
      var encBox = S("rect", { x: rx0 - 4, y: encY, width: rowW + 8, height: encH, rx: 10, class: "f-surface2", stroke: "var(--a-ink)", "stroke-width": 1.5 }, svg);
      var encTxt = S("text", { x: W / 2, y: encY + encH / 2 + 5, class: "t t-mid t-nohalo", "font-weight": 600, text: compact ? "Transformer encoder × 12" : "Transformer encoder · 12 layers · no causal mask" }, svg);
      LC.popIn(tl, [encBox, encTxt], { duration: 0.4 });
      var arrows = [];
      for (k = 0; k < nSlots; k++) arrows.push(S("path", { d: "M" + scx(k) + " " + (posY + 4) + "V" + (encY - 1), class: "s-faint", "stroke-width": 1.5 }, svg));
      arrows.forEach(function (p, i) { LC.drawIn(tl, p, { duration: 0.25 }, i ? "<0.03" : undefined); });
      tl.addLabel("s5");

      // s6: outputs; [CLS] → head → class
      var outs = [];
      for (k = 0; k < nSlots; k++) {
        var og = S("g", {}, svg);
        for (var d = 0; d < 3; d++) S("rect", { x: scx(k) - vecW / 2 + d * (cell + cgap), y: outY, width: cell, height: cell, rx: 2, class: k ? "f-faint" : "f-orange" }, og);
        outs.push(og);
      }
      LC.popIn(tl, outs.concat(rowLbls.out ? [rowLbls.out] : []), { duration: 0.3, stagger: 0.03 });
      var headPath = S("path", { d: "M" + scx(0) + " " + (outY + cell + 3) + "V" + (headY - 16), class: "s-orange", "stroke-width": 2.5 }, svg);
      LC.drawIn(tl, headPath, { duration: 0.4 });
      var headTxt = S("text", { x: sx(0), y: headY, class: "t t-orange", "font-weight": 600, text: compact ? "head → “house”  p = 0.93" : "MLP head → class “house”, p = 0.93" }, svg);
      LC.popIn(tl, [headTxt], { duration: 0.4 });
      tl.addLabel("s6");
      return tl;
    }
  };
})();
