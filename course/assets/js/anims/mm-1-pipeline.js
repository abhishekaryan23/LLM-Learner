/* MM.1: the "LLaVA recipe". Image → patches → vision encoder → projector → visual
   tokens, interleaved with text tokens → LLM → answer.
   Drawn with a 3×3 patch grid; the caption gives the real numbers
   (336×336 image, 14×14 patches → 24×24 = 576 visual tokens; ViT-L/14 features are
   1,024-d, a 7B LLM's embeddings 4,096-d). */
(function () {
  var LC = window.LC;
  var FEAT = [[0.3, 0.8, 0.5, 0.6], [0.9, 0.4, 0.6, 0.3], [0.5, 0.6, 0.2, 0.8], [0.4, 0.7, 0.9, 0.2], [0.6, 0.3, 0.4, 0.9],
    [0.2, 0.9, 0.5, 0.4], [0.8, 0.5, 0.3, 0.6], [0.5, 0.2, 0.8, 0.7], [0.7, 0.6, 0.4, 0.3]];
  var PROJ = FEAT.map(function (f, i) { return [f[1], f[3], (f[0] + f[2]) / 2, f[2], 1 - f[0] * 0.6, (i % 3) / 3 + 0.2]; });
  var uid = 0;

  LC.anims["mm-1-pipeline"] = {
    title: "How an LLM reads an image",
    steps: [
      "An <strong>image</strong> and a <strong>question</strong> arrive. A text-only LLM can't read pixels: its input is a sequence of embedding vectors, one per token (M1.4).",
      "Cut the image into square <strong>patches</strong>. We draw 3×3; a real 336×336 image with 14×14-pixel patches gives a 24×24 grid, <strong>576 patches</strong>.",
      "The <strong>vision encoder</strong>, usually a CLIP-trained ViT (V1.2), turns each patch into a <strong>feature vector</strong> that already knows about the rest of the image (1,024 numbers for ViT-L/14).",
      "The <strong>projector</strong>, a linear layer or a small MLP, maps each feature into the LLM's embedding space (4,096 numbers for a 7B LLM). Each one is now a <strong>visual token</strong>.",
      "The question is tokenized and embedded as usual. Visual tokens and <strong>text tokens</strong> sit side by side in <strong>one sequence</strong>.",
      "The <strong>LLM</strong> runs over the whole sequence. Its attention treats the 576 visual tokens like a long run of words it can look back at.",
      "It writes the <strong>answer</strong> one text token at a time, exactly as in M1.4. The only new part is the projector: about 21 million parameters in LLaVA-1.5-7B, roughly 0.3% of the model, bridging two pretrained networks."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 520 } : { w: 640, h: 512 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      var id = "mm1img" + (++uid);
      var L = compact
        ? { ix: 12, iy: 30, S: 108, px0: 12, pitch: 20, ps: 18, rowP: 176, enc: 206, encH: 30, feat: 248, prj: 292, prjH: 30, seq: 336, seqH: 30, llm: 412, llmH: 38, out: 476, rx: 200, txt: [["What", 40], ["is", 22], ["this", 34], ["?", 18]], gap: 4, fs: "t t-sm" }
        : { ix: 24, iy: 30, S: 120, px0: 24, pitch: 34, ps: 30, rowP: 182, enc: 226, encH: 30, feat: 268, prj: 308, prjH: 28, seq: 350, seqH: 32, llm: 428, llmH: 34, out: 476, rx: 360, txt: [["What", 54], ["is", 30], ["this", 46], ["?", 26]], gap: 6, fs: "t" };
      var stripW = 8 * L.pitch + L.ps, stripR = L.px0 + stripW;
      var cell = L.S / 3;

      // ---- the picture (sun over hills), defined once and reused for patches
      var defs = S("defs", {}, svg);
      var pic = S("g", { id: id }, defs);
      S("rect", { x: 0, y: 0, width: L.S, height: L.S, class: "f-surface2" }, pic);
      S("circle", { cx: L.S * 0.72, cy: L.S * 0.28, r: L.S * 0.13, class: "f-orange" }, pic);
      S("path", { d: "M0 " + L.S * 0.72 + "Q" + L.S * 0.3 + " " + L.S * 0.38 + " " + L.S * 0.62 + " " + L.S * 0.7 + "T" + L.S + " " + L.S * 0.62 + "V" + L.S + "H0Z", class: "f-blue", "fill-opacity": 0.55 }, pic);
      S("path", { d: "M0 " + L.S * 0.86 + "Q" + L.S * 0.5 + " " + L.S * 0.64 + " " + L.S + " " + L.S * 0.84 + "V" + L.S + "H0Z", class: "f-blue", "fill-opacity": 0.85 }, pic);

      var imgG = S("g", {}, svg);
      S("use", { href: "#" + id, x: L.ix, y: L.iy }, imgG);
      S("rect", { x: L.ix, y: L.iy, width: L.S, height: L.S, class: "f-none", stroke: "var(--a-ink)", "stroke-width": 1.5 }, imgG);
      S("text", { x: L.ix, y: L.iy - 10, class: "t t-sm t-muted", text: compact ? "image" : "image (336×336 px)" }, imgG);

      // question bubble
      var bub = S("g", {}, svg);
      var bx = L.rx, bw = compact ? 140 : 190, by = L.iy + (compact ? 22 : 30), bh = compact ? 36 : 40;
      S("rect", { x: bx, y: by, width: bw, height: bh, rx: 12, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, bub);
      S("text", { x: bx + bw / 2, y: by + bh / 2 + 5, class: L.fs + " t-mid", text: "What is this?" }, bub);
      S("text", { x: bx, y: by - 10, class: "t t-sm t-muted", text: "question" }, bub);

      // grid over the image
      var grid = S("path", { d: "M" + (L.ix + cell) + " " + L.iy + "V" + (L.iy + L.S) + "M" + (L.ix + 2 * cell) + " " + L.iy + "V" + (L.iy + L.S) +
        "M" + L.ix + " " + (L.iy + cell) + "H" + (L.ix + L.S) + "M" + L.ix + " " + (L.iy + 2 * cell) + "H" + (L.ix + L.S), class: "s-ink", "stroke-width": 1.5, "stroke-dasharray": "4 3" }, svg);

      // patches: groups that show one ninth of the picture each (clipped), later moved + scaled
      function px(i) { return L.px0 + i * L.pitch; }
      var patches = [], k = L.ps / cell;
      for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) {
        var cid = id + "c" + (r * 3 + c);
        var cp = S("clipPath", { id: cid }, defs);
        S("rect", { x: 0, y: 0, width: cell, height: cell }, cp);
        var p = S("g", { transform: "translate(" + (L.ix + c * cell) + "," + (L.iy + r * cell) + ") scale(1)" }, svg);
        var inner = S("g", { "clip-path": "url(#" + cid + ")" }, p);
        S("use", { href: "#" + id, x: -c * cell, y: -r * cell }, inner);
        S("rect", { x: 0, y: 0, width: cell, height: cell, class: "f-none", stroke: "var(--a-ink)", "stroke-width": 1.5 / k }, p);
        patches.push(p);
      }
      var patchLbl = S("text", { x: L.rx, y: L.rowP + L.ps / 2 + 5, class: "t t-sm t-muted", text: compact ? "9 patches (576 real)" : "9 patches here (576 in a real image)" }, svg);

      // encoder
      var enc = S("g", {}, svg);
      S("rect", { x: L.px0 - 4, y: L.enc, width: stripW + 8, height: L.encH, rx: 8, class: "f-surface2", stroke: "var(--a-blue)", "stroke-width": 1.5 }, enc);
      S("text", { x: L.px0 + stripW / 2, y: L.enc + L.encH / 2 + 5, class: L.fs + " t-mid", "font-weight": 600, text: compact ? "vision encoder" : "vision encoder (CLIP ViT)" }, enc);
      var encSide = S("text", { x: L.rx, y: L.enc + L.encH / 2 + 5, class: "t t-sm t-muted", text: compact ? "frozen ViT" : "pretrained, usually frozen" }, svg);

      // feature bars (4 cells each)
      var fc = compact ? 5 : 6, fw = compact ? 12 : 18;
      function bar(x, y, vals, cls, h) {
        var g = S("g", {}, svg);
        vals.forEach(function (v, k) { S("rect", { x: x, y: y + k * (h + 1), width: fw, height: h, rx: 1.5, class: cls, "fill-opacity": (0.25 + 0.75 * v).toFixed(2) }, g); });
        return g;
      }
      var feats = FEAT.map(function (f, i) { return bar(px(i) + (L.ps - fw) / 2, L.feat, f, "f-blue", fc); });
      var featLbl = S("text", { x: L.rx, y: L.feat + 2 * (fc + 1) + 4, class: "t t-sm t-blue", text: compact ? "features (1,024-d)" : "patch features (1,024 numbers each)" }, svg);

      // projector
      var prj = S("g", {}, svg);
      S("rect", { x: L.px0 - 4, y: L.prj, width: stripW + 8, height: L.prjH, rx: 8, class: "f-surface2", stroke: "var(--a-orange)", "stroke-width": 1.5 }, prj);
      S("text", { x: L.px0 + stripW / 2, y: L.prj + L.prjH / 2 + 5, class: L.fs + " t-mid", "font-weight": 600, text: compact ? "projector" : "projector (linear / MLP)" }, prj);
      var prjSide = S("text", { x: L.rx, y: L.prj + L.prjH / 2 + 5, class: "t t-sm t-orange", text: compact ? "the new, trained part" : "the new part you train" }, svg);

      // visual tokens in the sequence row
      var vt = PROJ.map(function (v, i) {
        var g = S("g", {}, svg), h = (L.seqH - 7) / 6;
        S("rect", { x: px(i), y: L.seq, width: L.ps, height: L.seqH, rx: 4, class: "f-paper", stroke: "var(--a-orange)", "stroke-width": 1.5 }, g);
        v.forEach(function (a, k) { S("rect", { x: px(i) + 3, y: L.seq + 2 + k * (h + 0.6), width: L.ps - 6, height: h, rx: 1, class: "f-orange", "fill-opacity": (0.25 + 0.75 * a).toFixed(2) }, g); });
        return g;
      });
      var vtLbl = S("text", { x: L.px0, y: L.seq + L.seqH + 18, class: "t t-sm t-orange", text: "visual tokens" }, svg);

      // text tokens
      var tx = L.rx, tt = [];
      L.txt.forEach(function (t) {
        var g = S("g", {}, svg);
        S("rect", { x: tx, y: L.seq, width: t[1], height: L.seqH, rx: 6, class: "f-surface", stroke: "var(--a-ink)", "stroke-width": 1.2 }, g);
        S("text", { x: tx + t[1] / 2, y: L.seq + L.seqH / 2 + 5, class: L.fs + " t-mid", text: t[0] }, g);
        tt.push(g); tx += t[1] + L.gap;
      });
      var ttLbl = S("text", { x: L.rx, y: L.seq + L.seqH + 18, class: "t t-sm t-muted", text: "text tokens" }, svg);

      // LLM
      var llm = S("g", {}, svg);
      S("rect", { x: L.px0 - 4, y: L.llm, width: W - 2 * (L.px0 - 4), height: L.llmH, rx: 10, class: "f-ink" }, llm);
      S("text", { x: W / 2, y: L.llm + L.llmH / 2 + 5, class: L.fs + " t-mid t-nohalo", style: "fill:var(--a-paper)", "font-weight": 650, text: compact ? "LLM (decoder-only)" : "LLM (decoder-only transformer)" }, llm);
      var arrows = [];
      [L.px0 + stripW / 2, L.rx + 60].forEach(function (x) {
        arrows.push(S("path", { d: "M" + x + " " + (L.seq + L.seqH + 24) + "V" + (L.llm - 4) + "m-4 -5l4 5l4 -5", class: "s-ink", "stroke-width": 1.5 }, svg));
      });

      // answer
      var ans = S("g", {}, svg);
      var aw = compact ? [["sun", 36], ["over", 42], ["hills", 42]] : [["sun", 46], ["over", 52], ["hills", 52]];
      var ax = compact ? 119 : 242;
      S("text", { x: ax - 10, y: L.out + L.seqH / 2 + 5, class: "t t-sm t-muted t-end", text: "answer" }, ans);
      aw.forEach(function (t) {
        S("rect", { x: ax, y: L.out, width: t[1], height: L.seqH - 4, rx: 6, class: "f-surface", stroke: "var(--a-orange)", "stroke-width": 1.8 }, ans);
        S("text", { x: ax + t[1] / 2, y: L.out + (L.seqH - 4) / 2 + 5, class: L.fs + " t-mid", "font-weight": 600, text: t[0] }, ans);
        ax += t[1] + L.gap;
      });
      var ansArrow = S("path", { d: "M" + (W / 2) + " " + (L.llm + L.llmH + 2) + "V" + (L.out - 4) + "m-4 -5l4 5l4 -5", class: "s-orange", "stroke-width": 1.8 }, svg);

      // ---- timeline
      [grid, patchLbl, enc, encSide, featLbl, prj, prjSide, vtLbl, ttLbl, llm, ans].concat(feats, vt, tt).forEach(function (e) { e.style.opacity = 0; });
      patches.forEach(function (p) { p.style.opacity = 0; });
      tl.addLabel("s0", 0);

      // s1: grid, then patches lift out into a strip
      LC.drawIn(tl, grid, { duration: 0.5 });
      tl.to(patches, { opacity: 1, duration: 0.01 });
      patches.forEach(function (p, i) {
        tl.to(p, { attr: { transform: "translate(" + px(i) + "," + L.rowP + ") scale(" + k + ")" }, duration: 0.8, ease: "power2.inOut" }, i ? "<0.06" : "+=0.1");
      });
      LC.popIn(tl, patchLbl, { duration: 0.3 });
      tl.addLabel("s1");

      // s2: encoder → features
      LC.popIn(tl, [enc, encSide], { duration: 0.4 });
      LC.popIn(tl, feats, { duration: 0.3, stagger: 0.05 });
      LC.popIn(tl, featLbl, { duration: 0.3 }, "<");
      tl.addLabel("s2");

      // s3: projector → visual tokens
      LC.popIn(tl, [prj, prjSide], { duration: 0.4 });
      LC.popIn(tl, vt, { duration: 0.3, stagger: 0.05 });
      LC.popIn(tl, vtLbl, { duration: 0.3 }, "<");
      tl.addLabel("s3");

      // s4: text tokens join the sequence
      tl.to(bub, { opacity: 0.45, duration: 0.3 });
      LC.popIn(tl, tt, { duration: 0.3, stagger: 0.08 }, "<");
      LC.popIn(tl, ttLbl, { duration: 0.3 });
      tl.addLabel("s4");

      // s5: the LLM reads the whole sequence
      arrows.forEach(function (a, i) { LC.drawIn(tl, a, { duration: 0.4 }, i ? "<" : "+=0.01"); });
      LC.popIn(tl, llm, { duration: 0.4 });
      tl.addLabel("s5");

      // s6: answer, token by token
      LC.drawIn(tl, ansArrow, { duration: 0.4 });
      LC.popIn(tl, ans, { duration: 0.5 });
      tl.addLabel("s6");
      return tl;
    }
  };
})();
