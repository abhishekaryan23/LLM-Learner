/* MM.2: late fusion vs early fusion.
   Panel A (s0): LLaVA-style late fusion: reads images, writes only text.
   Panel B (s1–s3): Chameleon-style early fusion. Real numbers: a 512×512 image → 32×32 = 1,024
     discrete codes from an 8,192-entry codebook; shared vocabulary of 65,536 (Chameleon Team, 2024).
     Code IDs drawn here (4071, 22, 913) are made up.
   Panel C (s4): Transfusion (Zhou et al., 2024): next-token loss on text, diffusion loss on image
     patches; attention causal overall, bidirectional within an image.
   Panel D (s5): audio codec tokens in and out of the same model. */
(function () {
  var LC = window.LC;

  LC.anims["mm-2-fusion"] = {
    title: "Late fusion, early fusion, and two losses in one model",
    steps: [
      "<strong>Late fusion</strong> (MM.1): an encoder and projector feed visual tokens to a text LLM. Its output head only scores <strong>text</strong> tokens, so it can read images but can only write words.",
      "<strong>Early fusion</strong> starts with an <strong>image tokenizer</strong> (G1.6): Chameleon turns a 512×512 image into 1,024 <strong>discrete codes</strong>, each an entry from a codebook of 8,192.",
      "The codes become ordinary token IDs in <strong>one shared vocabulary</strong> (65,536 in Chameleon). Text and image tokens sit in one sequence, and <strong>one transformer</strong> is trained on them from scratch.",
      "Because the output head covers image codes too, the model can <strong>write an image</strong>: after <code>&lt;img&gt;</code> it predicts the codes one at a time, and the tokenizer's decoder turns them back into pixels.",
      "<strong>Transfusion</strong> keeps images continuous. Text positions get the <strong>next-token loss</strong>; noised image patches get a <strong>diffusion loss</strong> (predict the noise). Attention is causal, except <strong>inside an image</strong>, where patches see each other.",
      "Sound joins the same way: a <strong>neural codec</strong> (A1.3) turns speech into tokens, so speech can go in <em>and</em> come out of one model, with no text in between (A1.6)."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 336 } : { w: 640, h: 330 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      var m = compact ? 12 : 24, th = compact ? 28 : 30, g = compact ? 3 : 5, fs = compact ? "t t-sm" : "t";
      var cw = compact ? 6.6 : 7.8;   // rough width per character for token boxes

      function tw(label) { return Math.max(compact ? 22 : 28, Math.round(label.length * cw + (compact ? 12 : 16))); }
      function tok(parent, x, y, label, kind, w) {
        var gg = S("g", {}, parent);
        w = w || tw(label);
        var cls = kind === "img" ? "f-surface2" : kind === "out" ? "f-surface" : "f-surface";
        var stroke = kind === "img" ? "var(--a-blue)" : kind === "out" ? "var(--a-orange)" : kind === "sp" ? "var(--a-faint)" : "var(--a-ink)";
        S("rect", { x: x, y: y, width: w, height: th, rx: 6, class: cls, stroke: stroke, "stroke-width": kind === "out" ? 1.8 : 1.3 }, gg);
        S("text", { x: x + w / 2, y: y + th / 2 + 4.5, class: "t t-sm t-mid t-nohalo" + (kind === "img" ? " t-mono" : ""), text: label }, gg);
        gg._w = w;
        return gg;
      }
      function box(parent, x, y, w, h, label, stroke, bold) {
        var gg = S("g", {}, parent);
        S("rect", { x: x, y: y, width: w, height: h, rx: 8, class: "f-surface2", stroke: stroke || "var(--a-ink)", "stroke-width": 1.5 }, gg);
        S("text", { x: x + w / 2, y: y + h / 2 + 4.5, class: fs + " t-mid t-nohalo", "font-weight": bold ? 650 : 550, text: label }, gg);
        return gg;
      }
      function dark(parent, x, y, w, h, label) {
        var gg = S("g", {}, parent);
        S("rect", { x: x, y: y, width: w, height: h, rx: 9, class: "f-ink" }, gg);
        S("text", { x: x + w / 2, y: y + h / 2 + 5, class: fs + " t-mid t-nohalo", style: "fill:var(--a-paper)", "font-weight": 650, text: label }, gg);
        return gg;
      }
      function arrow(parent, x1, y1, x2, y2, cls) {
        var ang = Math.atan2(y2 - y1, x2 - x1), a1 = ang + 2.6, a2 = ang - 2.6;
        return S("path", { d: "M" + x1 + " " + y1 + "L" + x2 + " " + y2 + "M" + (x2 + 6 * Math.cos(a1)).toFixed(1) + " " + (y2 + 6 * Math.sin(a1)).toFixed(1) + "L" + x2 + " " + y2 + "L" + (x2 + 6 * Math.cos(a2)).toFixed(1) + " " + (y2 + 6 * Math.sin(a2)).toFixed(1), class: cls || "s-ink", "stroke-width": 1.5, fill: "none" }, parent);
      }
      function picture(parent, x, y, s) {
        var gg = S("g", {}, parent);
        S("rect", { x: x, y: y, width: s, height: s, rx: 3, class: "f-surface2", stroke: "var(--a-ink)", "stroke-width": 1.2 }, gg);
        S("circle", { cx: x + s * 0.7, cy: y + s * 0.32, r: s * 0.14, class: "f-orange" }, gg);
        S("path", { d: "M" + x + " " + (y + s * 0.78) + "Q" + (x + s * 0.4) + " " + (y + s * 0.45) + " " + (x + s) + " " + (y + s * 0.72) + "V" + (y + s) + "H" + x + "Z", class: "f-blue", "fill-opacity": 0.75 }, gg);
        return gg;
      }
      function title(parent, text) { return S("text", { x: m, y: 18, class: "t t-sm", "font-weight": 650, text: text }, parent); }

      // ================= Panel A: late fusion
      var A = S("g", {}, svg);
      title(A, compact ? "Late fusion (MM.1)" : "Late fusion: vision bolted onto a text LLM (MM.1)");
      var r1 = 34, ic = 36, bw = compact ? 96 : 150;
      picture(A, m, r1, ic);
      var encX = m + 52, prjX = encX + bw + 16;
      arrow(A, m + ic + 3, r1 + 18, encX - 3, r1 + 18);
      box(A, encX, r1 + 2, bw, 32, compact ? "encoder" : "vision encoder", "var(--a-blue)");
      arrow(A, encX + bw + 3, r1 + 18, prjX - 3, r1 + 18);
      box(A, prjX, r1 + 2, bw, 32, "projector", "var(--a-orange)");
      var sqY = 98, vw = compact ? 13 : 20, x = m;
      for (var i = 0; i < 6; i++) { S("rect", { x: x, y: sqY, width: vw, height: th, rx: 3, class: "f-orange", "fill-opacity": (0.35 + 0.1 * i).toFixed(2) }, A); x += vw + 3; }
      x += 5;
      ["What's", "this?"].forEach(function (t) { var k = tok(A, x, sqY, t, "txt"); x += k._w + g; });
      S("path", { d: "M" + (prjX + bw / 2) + " " + (r1 + 36) + "C" + (prjX + bw / 2) + " " + (sqY - 6) + " " + (m + 50) + " " + (r1 + 40) + " " + (m + 50) + " " + (sqY - 4), class: "s-faint", "stroke-width": 1.5, fill: "none" }, A);
      var llmY = 146;
      arrow(A, m + 100, sqY + th + 3, m + 100, llmY - 3);
      dark(A, m, llmY, W - 2 * m, 34, compact ? "text LLM" : "text LLM (pretrained on text first)");
      S("text", { x: m, y: 208, class: "t t-sm t-muted", text: compact ? "output head: text vocabulary only" : "output head: scores the text vocabulary only" }, A);
      S("rect", { x: m, y: 216, width: W - 2 * m, height: 14, rx: 4, class: "f-faint" }, A);
      x = m;
      ["a", "red", "kite"].forEach(function (t) { var k = tok(A, x, 246, t, "out"); x += k._w + g; });
      var nx = compact ? 222 : 400;
      picture(A, nx, 246, 30);
      S("path", { d: "M" + (nx - 4) + " 242L" + (nx + 34) + " 280M" + (nx + 34) + " 242L" + (nx - 4) + " 280", class: "s-orange", "stroke-width": 2.5 }, A);
      S("text", { x: m, y: 304, class: "t t-sm t-muted", text: "reads images, writes only text" }, A);

      // ================= Panel B: early fusion (Chameleon)
      var B = S("g", {}, svg);
      title(B, compact ? "Early fusion: images as tokens" : "Early fusion: images become tokens (Chameleon, 2024)");
      var b1 = S("g", {}, B);
      picture(b1, m, r1, ic);
      var tkW = compact ? 110 : 170, tkX = m + 52;
      arrow(b1, m + ic + 3, r1 + 18, tkX - 3, r1 + 18);
      box(b1, tkX, r1 + 2, tkW, 32, compact ? "image tokenizer" : "image tokenizer (VQ)", "var(--a-blue)");
      arrow(b1, tkX + tkW + 3, r1 + 18, tkX + tkW + 13, r1 + 18);
      var cW = compact ? 34 : 44;
      x = tkX + tkW + 16;
      ["4071", "22", "913", "…"].forEach(function (c) { tok(b1, x, r1 + 4, c, "img", cW); x += cW + g; });
      S("text", { x: m, y: 96, class: "t t-sm t-muted", text: compact ? "512×512 px → 1,024 codes (codebook: 8,192)" : "a 512×512 image → 32×32 = 1,024 codes, each one of 8,192 codebook entries" }, b1);

      var b2 = S("g", {}, B), seqY = 110;
      x = m;
      var seqToks = [["A", "txt"], ["kite", "txt"], ["<img>", "sp"], ["4071", "img"], ["22", "img"], ["913", "img"], ["…", "img"], ["</img>", "sp"]];
      seqToks.forEach(function (t) { var k = tok(b2, x, seqY, t[0], t[1], t[1] === "img" ? (t[0] === "…" ? (compact ? 22 : 28) : cW) : null); x += k._w + g; });
      var trY = 156;
      arrow(b2, W / 2, seqY + th + 3, W / 2, trY - 3);
      dark(b2, m, trY, W - 2 * m, 34, compact ? "one transformer, from scratch" : "one transformer, trained from scratch on mixed text + image tokens");
      S("text", { x: m, y: 210, class: "t t-sm t-muted", text: compact ? "one shared vocabulary: 65,536" : "one shared output vocabulary: 65,536 token IDs" }, b2);
      var vbW = W - 2 * m, imgFrac = 8192 / 65536;
      S("rect", { x: m, y: 218, width: vbW * (1 - imgFrac) - 2, height: 14, rx: 4, class: "f-faint" }, b2);
      S("rect", { x: m + vbW * (1 - imgFrac), y: 218, width: vbW * imgFrac, height: 14, rx: 4, class: "f-blue" }, b2);
      S("text", { x: m, y: 248, class: "t t-sm t-muted", text: "text tokens" }, b2);
      S("text", { x: W - m, y: 248, class: "t t-sm t-blue t-end", text: "8,192 image codes" }, b2);

      var b3 = S("g", {}, B), oy = 262;
      x = m;
      var ot = tok(b3, x, oy, "<img>", "sp"); x += ot._w + g;
      var genToks = [];
      ["517", "8", "2210", "…"].forEach(function (c) { var k = tok(b3, x, oy, c, "img", c === "…" ? (compact ? 22 : 28) : cW); genToks.push(k); x += k._w + g; });
      var decW = compact ? 66 : 90;
      arrow(b3, x + 2, oy + th / 2, x + 12, oy + th / 2);
      box(b3, x + 15, oy, decW, th, "decoder", "var(--a-blue)");
      arrow(b3, x + 15 + decW + 3, oy + th / 2, x + 15 + decW + 13, oy + th / 2);
      var outPic = picture(b3, x + 15 + decW + 16, oy, th);
      S("text", { x: m, y: 316, class: "t t-sm t-muted", text: compact ? "1,024 steps, one code at a time" : "writing one 512×512 image = 1,024 decoding steps, one code at a time" }, b3);

      // ================= Panel C: Transfusion
      var C = S("g", {}, svg);
      title(C, compact ? "Transfusion: one model, two losses" : "Transfusion (2024): one transformer, two losses");
      var cY = 56;
      x = m;
      var txtToks = ["A", "red", "kite"], tx0 = x;
      txtToks.forEach(function (t) { var k = tok(C, x, cY, t, "txt"); x += k._w + g; });
      var tx1 = x - g; x += 6;
      var pW = compact ? 30 : 44, px0 = x;
      for (i = 0; i < 4; i++) {
        var pg = S("g", {}, C);
        S("rect", { x: x, y: cY, width: pW, height: th, rx: 4, class: "f-blue", "fill-opacity": 0.55 + 0.1 * (i % 2) }, pg);
        for (var d = 0; d < 5; d++) S("circle", { cx: x + 5 + ((d * 7 + i * 5) % (pW - 10)), cy: cY + 6 + ((d * 11 + i * 3) % (th - 12)), r: 1.6, class: "f-paper" }, pg);
        x += pW + g;
      }
      var px1 = x - g;
      S("path", { d: "M" + tx0 + " " + (cY - 6) + "V" + (cY - 10) + "H" + tx1 + "V" + (cY - 6), class: "s-ink", "stroke-width": 1.2, fill: "none" }, C);
      S("text", { x: (tx0 + tx1) / 2, y: cY - 16, class: "t t-sm t-mid", text: "next-token loss" }, C);
      S("path", { d: "M" + px0 + " " + (cY - 6) + "V" + (cY - 10) + "H" + px1 + "V" + (cY - 6), class: "s-blue", "stroke-width": 1.2, fill: "none" }, C);
      S("text", { x: (px0 + px1) / 2, y: cY - 16, class: "t t-sm t-blue t-mid", text: compact ? "diffusion loss" : "diffusion loss (denoise)" }, C);
      if (!compact) S("text", { x: px1 + 14, y: cY + th / 2 + 4.5, class: "t t-sm t-muted", text: "← noised latent patches" }, C);
      dark(C, m, 102, W - 2 * m, 32, "one transformer");
      // attention mask
      var mk = compact ? 15 : 18, mx = m, my = 170, kinds = [0, 0, 0, 1, 1, 1, 1];
      S("text", { x: mx, y: my - 10, class: "t t-sm t-muted", text: "attention mask (row looks at column)" }, C);
      for (var r = 0; r < 7; r++) for (var c = 0; c < 7; c++) {
        var ok = c <= r, bi = !ok && kinds[r] && kinds[c];
        S("rect", { x: mx + c * mk, y: my + r * mk, width: mk - 2, height: mk - 2, rx: 2, class: ok ? "f-ink" : bi ? "f-blue" : "f-faint", "fill-opacity": ok ? 0.55 : bi ? 0.9 : 0.35 }, C);
      }
      var lx = mx + 7 * mk + 14;
      S("rect", { x: lx, y: my + 10, width: 12, height: 12, rx: 2, class: "f-ink", "fill-opacity": 0.55 }, C);
      S("text", { x: lx + 18, y: my + 21, class: "t t-sm", text: compact ? "causal: earlier only" : "causal: each token sees earlier ones" }, C);
      S("rect", { x: lx, y: my + 40, width: 12, height: 12, rx: 2, class: "f-blue", "fill-opacity": 0.9 }, C);
      S("text", { x: lx + 18, y: my + 51, class: "t t-sm", text: compact ? "patches see each other" : "inside an image: patches see each other" }, C);
      S("text", { x: lx, y: my + 84, class: "t t-sm t-muted", text: compact ? "loss = LM + λ · diffusion" : "loss = LM loss + λ · diffusion loss" }, C);

      // ================= Panel D: audio tokens
      var D = S("g", {}, svg);
      title(D, compact ? "Speech in, speech out" : "Speech in, speech out: audio tokens in the same sequence");
      function wave(parent, x0, y0, w, h) {
        var dd = "M" + x0 + " " + (y0 + h / 2);
        for (var k = 1; k <= 24; k++) { var xx = x0 + (w * k) / 24, amp = (h / 2) * Math.abs(Math.sin(k * 1.3)) * (k % 2 ? 1 : -1); dd += "L" + xx.toFixed(1) + " " + (y0 + h / 2 + amp).toFixed(1); }
        return S("path", { d: dd, class: "s-orange", "stroke-width": 1.8, fill: "none" }, parent);
      }
      var dW = compact ? 52 : 70;
      wave(D, m, r1, dW, 36);
      var ceX = m + dW + 16, ceW = compact ? 96 : 140;
      arrow(D, m + dW + 3, r1 + 18, ceX - 3, r1 + 18);
      box(D, ceX, r1 + 2, ceW, 32, compact ? "codec encoder" : "codec encoder (A1.3)", "var(--a-orange)");
      arrow(D, ceX + ceW + 3, r1 + 18, ceX + ceW + 13, r1 + 18);
      var aw = compact ? 14 : 20;
      x = ceX + ceW + 16;
      for (i = 0; i < 5; i++) { S("rect", { x: x, y: r1 + 4, width: aw, height: th, rx: 3, class: "f-orange", "fill-opacity": (0.4 + 0.12 * i).toFixed(2) }, D); x += aw + 3; }
      var sY = 112;
      S("text", { x: m, y: sY - 8, class: "t t-sm t-muted", text: "your speech" }, D);
      x = m;
      for (i = 0; i < 5; i++) { S("rect", { x: x, y: sY, width: aw, height: th, rx: 3, class: "f-orange", "fill-opacity": (0.4 + 0.12 * i).toFixed(2) }, D); x += aw + 3; }
      x += 8;
      var ox0 = x, outA = [];
      S("text", { x: ox0, y: sY - 8, class: "t t-sm t-orange", text: "its reply" }, D);
      for (i = 0; i < 5; i++) { outA.push(S("rect", { x: x, y: sY, width: aw, height: th, rx: 3, class: "f-paper", stroke: "var(--a-orange)", "stroke-width": 1.8 }, D)); x += aw + 3; }
      var cdX = x + 12, cdW = compact ? 70 : 120;
      arrow(D, x + 1, sY + th / 2, cdX - 3, sY + th / 2);
      box(D, cdX, sY, cdW, th, compact ? "decoder" : "codec decoder", "var(--a-orange)");
      arrow(D, cdX + cdW + 3, sY + th / 2, cdX + cdW + 13, sY + th / 2);
      var wOut = wave(D, cdX + cdW + 16, sY - 4, compact ? W - m - (cdX + cdW + 16) : 70, 36);
      dark(D, m, 172, W - 2 * m, 32, compact ? "one multimodal transformer" : "one multimodal transformer (text, image and audio tokens)");
      S("text", { x: m, y: 238, class: "t t-sm t-muted", text: "no text in between, so tone, pauses" }, D);
      S("text", { x: m, y: 256, class: "t t-sm t-muted", text: "and laughter can survive the round trip" }, D);
      void wOut;

      // ================= timeline
      [B, C, D].forEach(function (p) { p.style.opacity = 0; });
      [b2, b3].forEach(function (p) { p.style.opacity = 0; });
      genToks.forEach(function (k) { k.style.opacity = 0; });
      outPic.style.opacity = 0;
      outA.forEach(function (o) { o.style.opacity = 0; });
      tl.addLabel("s0", 0);

      tl.to(A, { opacity: 0, duration: 0.4 });
      tl.to(B, { opacity: 1, duration: 0.4 });
      tl.addLabel("s1");

      tl.to(b2, { opacity: 1, duration: 0.5 });
      tl.addLabel("s2");

      tl.to(b3, { opacity: 1, duration: 0.3 });
      genToks.forEach(function (k) { tl.to(k, { opacity: 1, duration: 0.25 }, "+=0.1"); });
      tl.to(outPic, { opacity: 1, duration: 0.4 });
      tl.addLabel("s3");

      tl.to(B, { opacity: 0, duration: 0.4 });
      tl.to(C, { opacity: 1, duration: 0.5 });
      tl.addLabel("s4");

      tl.to(C, { opacity: 0, duration: 0.4 });
      tl.to(D, { opacity: 1, duration: 0.4 });
      outA.forEach(function (o) { tl.to(o, { opacity: 1, duration: 0.2 }, "+=0.05"); });
      tl.addLabel("s5");
      return tl;
    }
  };
})();
