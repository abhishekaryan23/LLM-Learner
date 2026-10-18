/* V1.3: a masked autoencoder (MAE, He et al., 2021) on a toy 6 × 6-patch image.
   Mask 75% (27 of 36) → encoder sees only the 9 visible patches → add shared mask
   tokens back in place → light decoder predicts pixels → MSE on masked patches only
   → keep the encoder, drop the decoder. */
(function () {
  var LC = window.LC;
  var PIC = ["SSSSSU", "SSRRSS", "SRRRRS", "SHDHHS", "GHDHHG", "GGGGGG"];
  var FILL = { S: ["var(--a-blue)", 0.28], U: ["var(--a-orange)", 0.95], R: ["var(--a-orange)", 0.6], H: ["var(--warm)", 0.35], D: ["var(--a-ink)", 0.7], G: ["var(--good)", 0.6] };
  var VIS = [1, 5, 8, 14, 16, 21, 26, 30, 33];
  var GUESS = { 20: "H" }; // one hidden door patch is "guessed" as wall: reconstructions are imperfect

  LC.anims["v1-3-mae"] = {
    title: "A masked autoencoder, step by step",
    steps: [
      "Start from an ordinary <strong>unlabelled image</strong>, cut into patches as in a ViT (here 6 × 6 = 36; a 224-pixel image with 16-pixel patches gives 196).",
      "Hide a random <strong>75%</strong> of the patches: 27 of 36 here, 147 of 196 in the paper. With this much hidden, copying a neighbour won't work; the model has to understand the scene.",
      "Only the <strong>9 visible patches</strong>, with their position embeddings, enter the <strong>encoder</strong>, a standard ViT. No placeholders for the gaps: the big encoder works on a quarter of the tokens.",
      "The encoder turns them into 9 vectors. This is the expensive part of the model, and skipping the masked patches made pretraining about <strong>3× faster or more</strong> in the paper.",
      "Put the encoded tokens back in their places and fill every gap with the same learned <strong>mask token</strong>. Position embeddings tell each gap where it is.",
      "A small <strong>decoder</strong> (by default 8 narrow Transformer blocks) predicts the pixels of every patch. Guesses for hidden patches are blurry but plausible, and sometimes wrong (the door).",
      "The loss is the <strong>mean squared error</strong> between predicted and true pixels, computed <strong>only on the masked patches</strong> (orange). The visible ones would be too easy.",
      "After pretraining, <strong>throw the decoder away</strong>. The encoder, now fed all patches, is a general-purpose feature extractor to fine-tune for classification, detection or segmentation."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 468 } : { w: 640, h: 490 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      var c = compact ? 17 : 19, gs = 6 * c + 5;
      var gTop = compact ? 46 : 42, lx0 = compact ? 30 : 130, rx0 = compact ? W - 30 - gs : W - 130 - gs;
      var tile = compact ? 24 : 28, tg = compact ? 6 : 12, rowW = 9 * tile + 8 * tg, tx0 = (W - rowW) / 2;
      var rowY = gTop + gs + 28, encY = rowY + tile + 12, encH = 34, outS = 14, outY = encY + encH + 10;
      var labC = outY + outS + 26, gTopC = labC + 10, lossY = gTopC + gs + 30;
      function pos(x0, y0, k) { return { x: x0 + (k % 6) * (c + 1), y: y0 + Math.floor(k / 6) * (c + 1) }; }
      function code(k) { return PIC[Math.floor(k / 6)][k % 6]; }
      function tileRect(x, y, sz, cd, parent, op) {
        var f = FILL[cd];
        return S("rect", { x: x, y: y, width: sz, height: sz, rx: 2, fill: f[0], "fill-opacity": (f[1] * (op || 1)).toFixed(2) }, parent);
      }
      function isVis(k) { return VIS.indexOf(k) >= 0; }
      function lab(x, y, t, cls, parent) { var e = S("text", { x: x, y: y, class: "t t-sm t-mid" + (cls ? " " + cls : ""), text: t }, parent || svg); return e; }

      // s0: original image (left)
      var gA = S("g", {}, svg);
      for (var k = 0; k < 36; k++) { var p = pos(lx0, gTop, k); tileRect(p.x, p.y, c, code(k), gA); }
      var labA = lab(lx0 + gs / 2, gTop - 10, "image", "t-muted");
      tl.addLabel("s0", 0);

      // s1: masked copy (right)
      var gB = S("g", {}, svg);
      for (k = 0; k < 36; k++) {
        p = pos(rx0, gTop, k);
        if (isVis(k)) tileRect(p.x, p.y, c, code(k), gB);
        else S("rect", { x: p.x, y: p.y, width: c, height: c, rx: 2, class: "f-surface2", stroke: "var(--a-faint)", "stroke-width": 1 }, gB);
      }
      var labB = lab(rx0 + gs / 2, gTop - 10, compact ? "75% masked" : "75% masked (27 of 36)", "t-muted");
      var arrowA = S("path", { d: "M" + (lx0 + gs + 12) + " " + (gTop + gs / 2) + "H" + (rx0 - 12), class: "s-ink", "stroke-width": 2 }, svg);
      var headA = S("path", { d: "M" + (rx0 - 18) + " " + (gTop + gs / 2 - 5) + "L" + (rx0 - 11) + " " + (gTop + gs / 2) + "L" + (rx0 - 18) + " " + (gTop + gs / 2 + 5), class: "s-ink", "stroke-width": 2 }, svg);
      LC.drawIn(tl, arrowA, { duration: 0.4 });
      LC.drawIn(tl, headA, { duration: 0.15 });
      LC.popIn(tl, [gB, labB], { duration: 0.4 });
      tl.addLabel("s1");

      // s2: visible patches fly into a row → encoder box
      var fly = VIS.map(function (k, i) {
        var p0 = pos(rx0, gTop, k);
        var g = S("g", {}, svg);
        tileRect(p0.x, p0.y, c, code(k), g);
        g.style.opacity = 0;
        gsap.set(g, { svgOrigin: p0.x + " " + p0.y });
        return { g: g, dx: tx0 + i * (tile + tg) - p0.x, dy: rowY - p0.y };
      });
      tl.set(fly.map(function (f) { return f.g; }), { opacity: 1 }, "+=0.01");
      fly.forEach(function (f, i) { tl.to(f.g, { x: f.dx, y: f.dy, scale: tile / c, duration: 0.7, ease: "power2.inOut" }, i ? "<0.06" : "<"); });
      var encBox = S("rect", { x: tx0 - 6, y: encY, width: rowW + 12, height: encH, rx: 9, class: "f-surface2", stroke: "var(--a-ink)", "stroke-width": 1.5 }, svg);
      var encTxt = S("text", { x: W / 2, y: encY + encH / 2 + 5, class: "t t-mid t-nohalo", "font-weight": 600, text: compact ? "encoder (ViT): 9 tokens" : "encoder (a full-size ViT) on 9 tokens, not 36" }, svg);
      LC.popIn(tl, [encBox, encTxt], { duration: 0.4 });
      tl.addLabel("s2");

      // s3: encoded vectors
      var outs = VIS.map(function (k, i) {
        return S("rect", { x: tx0 + i * (tile + tg) + (tile - outS) / 2, y: outY, width: outS, height: outS, rx: 3, class: "f-blue", "fill-opacity": (0.5 + 0.5 * ((i * 37) % 10) / 10).toFixed(2) }, svg);
      });
      LC.popIn(tl, outs, { duration: 0.3, stagger: 0.05 });
      tl.addLabel("s3");

      // s4: decoder input grid: encoded tokens in place + shared mask tokens
      var gC = S("g", {}, svg);
      for (k = 0; k < 36; k++) {
        p = pos(lx0, gTopC, k);
        if (isVis(k)) S("rect", { x: p.x, y: p.y, width: c, height: c, rx: 2, class: "f-blue", "fill-opacity": 0.85 }, gC);
        else S("rect", { x: p.x, y: p.y, width: c, height: c, rx: 2, class: "f-faint" }, gC);
      }
      var labC1 = lab(lx0 + gs / 2, labC, compact ? "9 encoded + 27 mask" : "9 encoded + 27 mask tokens", "t-muted");
      LC.popIn(tl, [gC, labC1], { duration: 0.4 });
      tl.addLabel("s4");

      // s5: light decoder → reconstruction
      var gD = S("g", {}, svg);
      for (k = 0; k < 36; k++) {
        p = pos(rx0, gTopC, k);
        tileRect(p.x, p.y, c, isVis(k) ? code(k) : (GUESS[k] || code(k)), gD, isVis(k) ? 1 : 0.7);
      }
      var labD = lab(rx0 + gs / 2, labC, "reconstruction", "t-muted");
      var midX = (lx0 + gs + rx0) / 2;
      var arrowC = S("path", { d: "M" + (lx0 + gs + 12) + " " + (gTopC + gs / 2 + 10) + "H" + (rx0 - 12), class: "s-ink", "stroke-width": 2 }, svg);
      var headC = S("path", { d: "M" + (rx0 - 18) + " " + (gTopC + gs / 2 + 5) + "L" + (rx0 - 11) + " " + (gTopC + gs / 2 + 10) + "L" + (rx0 - 18) + " " + (gTopC + gs / 2 + 15), class: "s-ink", "stroke-width": 2 }, svg);
      var decTxt = lab(midX, gTopC + gs / 2 - 4, compact ? "decoder" : "light decoder", "");
      decTxt.setAttribute("font-weight", 600);
      LC.drawIn(tl, arrowC, { duration: 0.4 });
      LC.drawIn(tl, headC, { duration: 0.15 });
      LC.popIn(tl, [decTxt], { duration: 0.3 }, "<");
      LC.popIn(tl, [gD, labD], { duration: 0.5 });
      tl.addLabel("s5");

      // s6: loss on masked patches only
      var marks = S("g", {}, svg);
      for (k = 0; k < 36; k++) if (!isVis(k)) { p = pos(rx0, gTopC, k); S("rect", { x: p.x + 0.5, y: p.y + 0.5, width: c - 1, height: c - 1, rx: 2, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 1.6 }, marks); }
      var lossTxt = S("text", { x: W / 2, y: lossY, class: "t t-orange t-mid", "font-weight": 600, text: compact ? "loss: MSE on the 27 masked patches" : "loss = mean squared error on the 27 masked patches only" }, svg);
      LC.popIn(tl, [marks, lossTxt], { duration: 0.4 });
      tl.addLabel("s6");

      // s7: keep the encoder, drop the decoder
      var keep1 = S("text", { x: W / 2, y: gTopC + 30, class: "t t-mid", "font-weight": 600, text: "keep the encoder, drop the decoder" }, svg);
      var keep2 = S("text", { x: W / 2, y: gTopC + 54, class: "t t-sm t-muted t-mid", text: compact ? "fine-tune or probe it on any task" : "fine-tune it, or train a small head on its frozen features" }, svg);
      keep1.style.opacity = 0; keep2.style.opacity = 0;
      tl.to([gC, gD, marks, labC1, labD, decTxt, arrowC, headC, lossTxt], { opacity: 0, duration: 0.4 });
      tl.to(encBox, { attr: { stroke: "var(--a-orange)", "stroke-width": 3 }, duration: 0.4 }, "<");
      tl.to([keep1, keep2], { opacity: 1, duration: 0.4 });
      tl.addLabel("s7");
      return tl;
    }
  };
})();
