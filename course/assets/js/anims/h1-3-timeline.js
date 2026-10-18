/* H1.3: 2014–2017, from seq2seq to the Transformer. The quality-vs-length curves are
   an illustrative sketch of the trend in Bahdanau et al. (2014, Fig. 2), not data.
   BLEU scores are from Vaswani et al. (2017), Table 2 (WMT14 English→German). */
(function () {
  var LC = window.LC;
  LC.anims["h1-3-timeline"] = {
    title: "From one vector to attention, 2014–2017",
    steps: [
      "<strong>2014.</strong> Sutskever, Vinyals and Le's <strong>seq2seq</strong>: an <strong>encoder</strong> LSTM reads the sentence into one vector, and a <strong>decoder</strong> LSTM writes the translation from it, word by word.",
      "The catch: every sentence, short or long, must squeeze into that <strong>one fixed-size vector</strong>. The longer the sentence, the more gets lost, and translation quality drops (sketch of the trend).",
      "<strong>2014.</strong> Bahdanau, Cho and Bengio add <strong>attention</strong>: for every word it writes, the decoder looks back at <em>all</em> the encoder's word states and takes a weighted blend. Long sentences stop hurting.",
      "<strong>2015.</strong> The weights learn an <strong>alignment</strong> without being told: French “zone économique européenne” attends to English “European Economic Area” in reverse order. Luong et al. simplify the scores to <strong>dot products</strong>.",
      "<strong>2016.</strong> Google Translate switches to neural translation (GNMT: deep LSTMs plus attention). But recurrence is <strong>sequential</strong>: word 6 can't be processed until words 1–5 are done.",
      "<strong>2017.</strong> Vaswani et al., “Attention Is All You Need”: drop the recurrence. In <strong>self-attention</strong> every word looks directly at every other word, in one step.",
      "No recurrence means <strong>parallel</strong> training: all positions are computed at once on a GPU, instead of one after another. That makes much bigger models and datasets affordable.",
      "The <strong>Transformer</strong> scored <strong>28.4 BLEU</strong> on WMT14 English→German, over 2 points above the best previous systems (even ensembles), after 3.5 days on 8 GPUs."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 310 } : { w: 640, h: 310 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact", cx = W / 2;
      var T = LC.h1.timeline(svg, ctx, {
        from: 2013.5, to: 2017.9, ticks: [2014, 2015, 2016, 2017],
        steps: [
          { year: "2014", text: "seq2seq: encoder → one vector → decoder", short: "seq2seq", dots: [2014.7] },
          { year: "2014", text: "The fixed-vector bottleneck", short: "The bottleneck", dots: [2014.7] },
          { year: "2014", text: "Bahdanau, Cho & Bengio: attention", short: "Attention (Bahdanau)", dots: [2014.7] },
          { year: "2015", text: "Luong: attention learns alignment", short: "Alignment (Luong)", dots: [2015.6] },
          { year: "2016", text: "GNMT: neural Google Translate", short: "Google's GNMT", dots: [2016.7] },
          { year: "2017", text: "“Attention Is All You Need”", short: "The Transformer", dots: [2017.45] },
          { year: "2017", text: "No recurrence → parallel training", short: "Parallel training", dots: [2017.45] },
          { year: "2017", text: "Transformer: 28.4 BLEU", short: "28.4 BLEU", dots: [2017.45] }
        ]
      });
      var top = T.top, A = LC.h1.arrow, tl = gsap.timeline();
      var sc = [0, 1, 2, 3, 4, 5, 6, 7].map(function (k) { return LC.h1.scene(svg, k === 0); });
      function note(g, y, txt, cls) { return S("text", { x: cx, y: y, class: "t t-sm t-mid" + (cls ? " " + cls : ""), text: txt }, g); }
      var SRC = ["the", "cat", "sat", "down"], TGT = ["le", "chat", "s'est", "assis"];
      function row(g, words, y, x0, x1, opt) {
        var n = words.length, st = (x1 - x0) / n, bw = Math.min(st - 6, 70);
        return words.map(function (w, i) {
          var xx = x0 + st * (i + 0.5);
          LC.h1.box(g, xx, y, bw, 26, w, { size: 12, stroke: opt && opt.stroke });
          return xx;
        });
      }

      // ---- scene 0: seq2seq
      var flow = [];
      (function (g) {
        var x0 = compact ? 14 : 80, x1 = W - x0;
        var ys = top + 16, yv = top + 76, yt = top + 136;
        var sx = row(g, SRC, ys, x0, x1, { stroke: "var(--a-blue)" });
        var tx = row(g, TGT, yt, x0, x1, { stroke: "var(--a-orange)" });
        S("rect", { x: cx - 34, y: yv - 13, width: 68, height: 26, rx: 6, class: "f-ink" }, g);
        S("text", { x: cx, y: yv + 4, class: "t t-sm t-mid t-nohalo", style: "fill:var(--a-paper)", text: "1 vector" }, g);
        sx.forEach(function (x) { flow.push(A(g, x, ys + 15, cx + (x - cx) * 0.15, yv - 15, "s-blue", 6)); });
        tx.forEach(function (x) { flow.push(A(g, cx + (x - cx) * 0.15, yv + 15, x, yt - 15, "s-orange", 6)); });
        S("text", { x: compact ? 14 : 20, y: yv + 4, class: "t t-sm t-blue", text: "encoder" }, g);
        S("text", { x: W - (compact ? 14 : 20), y: yv + 4, class: "t t-sm t-orange t-end", text: "decoder" }, g);
        note(g, top + 186, compact ? "both encoder and decoder are LSTMs" : "both halves are LSTMs; the decoder writes one word at a time", "t-muted");
      })(sc[0]);
      tl.addLabel("s0", 0);

      // ---- scene 1: bottleneck sketch
      var cNo;
      (function (g) {
        var px = compact ? 50 : 150, pw = compact ? 220 : 280, py = top + 18, ph = 120;
        S("path", { d: "M" + px + " " + py + "V" + (py + ph) + "H" + (px + pw), class: "s-axis" }, g);
        S("text", { x: px - 6, y: py - 6, class: "t t-sm t-muted", text: "↑ quality" }, g);
        S("text", { x: px + pw, y: py + ph + 18, class: "t t-sm t-muted t-end", text: "sentence length →" }, g);
        function curve(f) { return LC.fnPath(f, 0, 1, function (u) { return px + 6 + u * (pw - 10); }, function (v) { return py + ph - v * ph; }, 40); }
        cNo = S("path", { d: curve(function (u) { return 0.8 / (1 + Math.exp((u - 0.45) * 9)) + 0.12; }), class: "s-ink" }, g);
        S("text", { x: px + pw - 4, y: py + ph - 52, class: "t t-sm t-end", text: "one fixed vector" }, g);
        note(g, top + 186, compact ? "sketch of the trend, not real data" : "a sketch of the trend reported by Bahdanau et al. (2014), not real data", "t-muted");
      })(sc[1]);
      LC.h1.swap(tl, sc[0], sc[1]); T.go(tl, 1);
      LC.drawIn(tl, cNo, { duration: 0.9 });
      tl.addLabel("s1");

      // ---- scene 2: attention beams
      var beams = [];
      (function (g) {
        var x0 = compact ? 14 : 80, x1 = W - x0;
        var ys = top + 20, yt = top + 132;
        var sx = row(g, SRC, ys, x0, x1, { stroke: "var(--a-blue)" });
        var tx = row(g, TGT, yt, x0, x1, { stroke: "var(--a-orange)" });
        var wts = [0.12, 0.72, 0.06, 0.10]; // illustrative: "chat" attends to "cat"
        sx.forEach(function (x, i) {
          var d = "M" + tx[1] + " " + (yt - 14) + "C" + tx[1] + " " + (yt - 60) + " " + x + " " + (ys + 60) + " " + x + " " + (ys + 14);
          beams.push(S("path", { d: d, class: "s-orange", "stroke-width": (1 + 9 * wts[i]).toFixed(1), "stroke-opacity": (0.3 + 0.7 * wts[i]).toFixed(2) }, g));
        });
        S("text", { x: tx[1], y: yt + 32, class: "t t-sm t-orange t-mid", text: compact ? "writing “chat”" : "writing “chat”: 72% on “cat”" }, g);
        note(g, top + 190, compact ? "it looks back at every source word" : "each output word gets its own weighted look at every source word", "t-muted");
      })(sc[2]);
      LC.h1.swap(tl, sc[1], sc[2]); T.go(tl, 2);
      beams.forEach(function (b, i) { LC.drawIn(tl, b, { duration: 0.5 }, i ? "<0.1" : undefined); });
      tl.addLabel("s2");

      // ---- scene 3: alignment heatmap (illustrative)
      var hcells = [];
      (function (g) {
        var src = ["European", "Economic", "Area"], tgt = ["zone", "économique", "européenne"];
        var M = [[0.05, 0.08, 0.87], [0.10, 0.82, 0.08], [0.84, 0.10, 0.06]];
        var cs = compact ? 46 : 74, ch = 46, lw = compact ? 84 : 96;
        var gx = cx - (lw + 3 * cs) / 2 + lw, gy = top + 34;
        src.forEach(function (s, j) { S("text", { x: gx + j * cs + cs / 2, y: gy - 10, class: "t t-sm t-mid", text: compact ? ["Euro.", "Econ.", "Area"][j] : s }, g); });
        tgt.forEach(function (t, i) {
          S("text", { x: gx - 8, y: gy + i * ch + ch / 2 + 4, class: "t t-sm t-end", text: t }, g);
          M[i].forEach(function (w, j) {
            var c = S("g", {}, g);
            S("rect", { x: gx + j * cs + 1, y: gy + i * ch + 1, width: cs - 2, height: ch - 2, rx: 4, class: "f-blue", "fill-opacity": (0.08 + 0.92 * w).toFixed(2) }, c);
            S("text", { x: gx + j * cs + cs / 2, y: gy + i * ch + ch / 2 + 4, class: "t t-sm t-mono t-mid t-nohalo", style: w > 0.45 ? "fill:var(--a-paper)" : "", text: w.toFixed(2) }, c);
            hcells.push(c);
          });
        });
        note(g, top + 204, compact ? "French order is reversed (illustrative)" : "the reversed word order is learned, not programmed (illustrative weights)", "t-muted");
      })(sc[3]);
      hcells.forEach(function (c) { c.style.opacity = 0; });
      LC.h1.swap(tl, sc[2], sc[3]); T.go(tl, 3);
      tl.to(hcells, { opacity: 1, duration: 0.2, stagger: 0.06 });
      tl.addLabel("s3");

      // ---- scene 4: recurrence is sequential
      var rnnLit = [];
      (function (g) {
        var n = 6, x0 = compact ? 22 : 90, x1 = W - x0, st = (x1 - x0) / n, y = top + 50, r = compact ? 17 : 19;
        S("text", { x: x0, y: top + 6, class: "t t-sm t-muted", text: compact ? "an RNN reads one word per step" : "a recurrent network: one word per step, each step waits for the last" }, g);
        for (var i = 0; i < n; i++) {
          var xx = x0 + st * (i + 0.5);
          if (i) A(g, xx - st + r + 2, y, xx - r - 2, y, "s-ink", 6);
          S("circle", { cx: xx, cy: y, r: r, class: "f-surface", stroke: "var(--a-ink)", "stroke-width": 2 }, g);
          var lit = S("circle", { cx: xx, cy: y, r: r, class: "f-blue" }, g);
          lit.style.opacity = 0; rnnLit.push(lit);
          S("text", { x: xx, y: y + 5, class: "t t-sm t-mid t-nohalo", text: "w" + (i + 1) }, g);
          S("text", { x: xx, y: y + r + 20, class: "t t-sm t-muted t-mid", text: "t=" + (i + 1) }, g);
        }
        note(g, top + 140, compact ? "6 words = 6 steps, one after another" : "6 words = 6 steps that can't run at the same time");
        note(g, top + 162, compact ? "GPUs sit mostly idle" : "so most of a GPU's thousands of cores sit idle", "t-muted");
      })(sc[4]);
      LC.h1.swap(tl, sc[3], sc[4]); T.go(tl, 4);
      tl.to(rnnLit, { opacity: 0.9, duration: 0.2, stagger: 0.25 });
      tl.addLabel("s4");

      // ---- scene 5: self-attention arcs
      var arcs = [];
      (function (g) {
        var words = ["the", "cat", "sat", "on", "the", "mat"], n = 6;
        var x0 = compact ? 16 : 90, x1 = W - x0, st = (x1 - x0) / n, y = top + 120;
        var xs = words.map(function (_, i) { return x0 + st * (i + 0.5); });
        for (var i = 0; i < n; i++) for (var j = i + 1; j < n; j++) {
          var h = 16 + (j - i) * (compact ? 15 : 18);
          arcs.push(S("path", { d: "M" + xs[i] + " " + (y - 15) + "C" + xs[i] + " " + (y - 15 - h) + " " + xs[j] + " " + (y - 15 - h) + " " + xs[j] + " " + (y - 15), class: "s-blue", "stroke-width": 1.5, "stroke-opacity": 0.6 }, g));
        }
        words.forEach(function (w, i) { LC.h1.box(g, xs[i], y, Math.min(st - 6, 64), 26, w, { size: 12 }); });
        note(g, top + 168, compact ? "every word links to every other word" : "every word connects directly to every other word: 1 hop, any distance");
        note(g, top + 190, compact ? "no recurrence: 1 hop at any distance" : "no recurrence, no convolution: only attention (plus small MLPs)", "t-muted");
      })(sc[5]);
      LC.h1.swap(tl, sc[4], sc[5]); T.go(tl, 5);
      arcs.forEach(function (a, i) { LC.drawIn(tl, a, { duration: 0.35 }, i ? "<0.04" : undefined); });
      tl.addLabel("s5");

      // ---- scene 6: sequential vs parallel
      var seqDots = [], parDots = [];
      (function (g) {
        var n = 6, x0 = compact ? 110 : 220, x1 = compact ? 340 : 560, st = (x1 - x0) / n;
        var yR = top + 30, yT = top + 96;
        S("text", { x: x0 - 12, y: yR + 5, class: "t t-sm t-end", text: "RNN" }, g);
        S("text", { x: x0 - 12, y: yT + 5, class: "t t-sm t-end", text: "Transformer" }, g);
        for (var i = 0; i < n; i++) {
          var xx = x0 + st * (i + 0.5);
          S("circle", { cx: xx, cy: yR, r: 12, class: "f-faint" }, g);
          S("circle", { cx: xx, cy: yT, r: 12, class: "f-faint" }, g);
          seqDots.push(S("circle", { cx: xx, cy: yR, r: 12, class: "f-blue" }, g));
          parDots.push(S("circle", { cx: xx, cy: yT, r: 12, class: "f-orange" }, g));
        }
        S("text", { x: x1, y: yR + 32, class: "t t-sm t-muted t-end", text: "6 steps" }, g);
        S("text", { x: x1, y: yT + 32, class: "t t-sm t-muted t-end", text: "1 step" }, g);
        note(g, top + 172, compact ? "all positions at once → fast on GPUs" : "all positions are computed at once, so training uses the whole GPU");
      })(sc[6]);
      seqDots.concat(parDots).forEach(function (d) { d.style.opacity = 0; });
      LC.h1.swap(tl, sc[5], sc[6]); T.go(tl, 6);
      tl.to(parDots, { opacity: 1, duration: 0.25 });
      tl.to(seqDots, { opacity: 1, duration: 0.15, stagger: 0.25 }, "<");
      tl.addLabel("s6");

      // ---- scene 7: BLEU bars
      var bars = [];
      (function (g) {
        var x0 = compact ? 150 : 250, maxW = compact ? 150 : 270, lo = 20, hi = 30;
        function bw(v) { return (v - lo) / (hi - lo) * maxW; }
        S("text", { x: compact ? 14 : x0, y: top + 6, class: "t t-sm t-muted", text: compact ? "WMT14 En→De BLEU (axis from 20)" : "WMT14 English→German, BLEU (higher is better; axis starts at 20)" }, g);
        [["GNMT ens. (2016)", 26.3, "f-faint"], ["ConvS2S ens. (2017)", 26.4, "f-faint"], ["Transformer big", 28.4, "f-orange"]].forEach(function (b, i) {
          var y = top + 24 + i * 40;
          S("text", { x: x0 - 10, y: y + 18, class: "t t-sm t-end", "font-weight": i === 2 ? 600 : 400, text: compact ? b[0].replace(" (2016)", "").replace(" (2017)", "") : b[0] }, g);
          var r = S("rect", { x: x0, y: y, width: 0, height: 26, rx: 4, class: b[2] }, g);
          var v = S("text", { x: x0 + bw(b[1]) + 8, y: y + 18, class: "t t-sm t-mono", text: b[1].toFixed(1) }, g);
          v.style.opacity = 0;
          bars.push([r, bw(b[1]), v]);
        });
        note(g, top + 160, compact ? "3.5 days on 8 GPUs" : "trained in 3.5 days on 8 GPUs, a fraction of earlier systems' cost");
        note(g, top + 182, compact ? "ens. = several models combined" : "ens. = an ensemble, several models whose answers are combined", "t-muted");
      })(sc[7]);
      LC.h1.swap(tl, sc[6], sc[7]); T.go(tl, 7);
      bars.forEach(function (b, i) {
        tl.to(b[0], { attr: { width: b[1] }, duration: 0.5, ease: "power2.out" }, i ? "<0.12" : undefined);
        tl.to(b[2], { opacity: 1, duration: 0.2 }, ">-0.1");
      });
      tl.addLabel("s7");
      return tl;
    }
  };
})();
