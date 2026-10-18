/* H1.4: 2018–2022, the scaling era. Parameter counts: GPT 117M, BERT-large 340M,
   GPT-2 1.5B, T5 11B (published). Tokens per parameter: GPT-3 300B/175B ≈ 1.7,
   Gopher 300B/280B ≈ 1.1, Chinchilla 1.4T/70B = 20 (Hoffmann et al., 2022).
   The scaling-law plot is an illustrative power law, not fitted data. */
(function () {
  var LC = window.LC;
  LC.anims["h1-4-timeline"] = {
    title: "The scaling era, 2018–2022",
    steps: [
      "<strong>2018.</strong> A new recipe: <strong>pretrain</strong> one big model on raw text, then <strong>fine-tune</strong> it for each task. ELMo (Feb), GPT (June) and BERT (Oct) each beat years of task-specific models.",
      "Two flavours of transformer. <strong>GPT</strong> (decoder) predicts the <em>next</em> word from the words before. <strong>BERT</strong> (encoder) fills in <em>hidden</em> words using both sides. Both learn from text alone: the text is its own label.",
      "<strong>2019.</strong> Models grow fast: GPT-2 (1.5B weights) and T5 (11B), nearly <strong>100×</strong> the original GPT in about 18 months. Note the log scale: each grid line is 10× more.",
      "<strong>2020.</strong> Kaplan et al.'s <strong>scaling laws</strong>: test loss falls smoothly and predictably as a <strong>power law</strong> in model size, data and compute: a straight line on log–log axes (sketch).",
      "<strong>2020.</strong> <strong>GPT-3</strong> (175B weights) shows <strong>in-context learning</strong>: put a few examples in the prompt and it continues the pattern, with no retraining. This example is from the GPT-3 paper.",
      "<strong>2020–2022.</strong> The same ingredients spread: <strong>diffusion</strong> models (DDPM, 2020) learn to turn noise into images step by step; CLIP and DALL·E (2021); Stable Diffusion released openly (2022).",
      "<strong>2022.</strong> DeepMind's <strong>Chinchilla</strong>: for a fixed compute budget, train a smaller model on more data, about <strong>20 tokens per weight</strong>. 70B Chinchilla beat the 280B Gopher.",
      "<strong>2022.</strong> InstructGPT teaches GPT-3 to <strong>follow instructions</strong> with human feedback (RLHF). <strong>ChatGPT</strong> launches on 30 November 2022 and becomes one of the fastest-growing apps ever."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 316 } : { w: 640, h: 312 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact", cx = W / 2;
      var T = LC.h1.timeline(svg, ctx, {
        from: 2017.8, to: 2023.1, ticks: [2018, 2019, 2020, 2021, 2022, 2023], ticksCompact: [2018, 2020, 2022],
        steps: [
          { year: "2018", text: "ELMo, GPT and BERT: pretrain, then fine-tune", short: "Pretrain, then fine-tune", dots: [2018.1, 2018.45, 2018.8] },
          { year: "2018", text: "GPT (next word) vs BERT (fill the blank)", short: "GPT vs BERT", dots: [2018.45, 2018.8] },
          { year: "2019", text: "GPT-2 and T5: models grow 100×", short: "GPT-2 and T5", dots: [2019.1, 2019.8] },
          { year: "2020", text: "Scaling laws (Kaplan et al.)", short: "Scaling laws", dots: [2020.05] },
          { year: "2020", text: "GPT-3: 175B and in-context learning", short: "GPT-3", dots: [2020.4] },
          { year: "2021", text: "Diffusion, CLIP, DALL·E, Stable Diffusion", short: "Images: diffusion", dots: [2020.45, 2021.0, 2022.6] },
          { year: "2022", text: "Chinchilla: more data per weight", short: "Chinchilla", dots: [2022.24] },
          { year: "2022", text: "InstructGPT → ChatGPT (30 Nov)", short: "ChatGPT", dots: [2022.17, 2022.91] }
        ]
      });
      var top = T.top, A = LC.h1.arrow, tl = gsap.timeline();
      var sc = [0, 1, 2, 3, 4, 5, 6, 7].map(function (k) { return LC.h1.scene(svg, k === 0); });
      function note(g, y, txt, cls) { return S("text", { x: cx, y: y, class: "t t-sm t-mid" + (cls ? " " + cls : ""), text: txt }, g); }

      // ---- scene 0: pretrain → fine-tune
      (function (g) {
        var y1 = top + 26, y2 = top + 92, y3 = top + 152;
        LC.h1.box(g, cx, y1, compact ? 220 : 300, 32, compact ? "lots of raw text (no labels)" : "billions of words of raw text (no labels)", { size: 12, fill: "f-surface2" });
        A(g, cx, y1 + 18, cx, y2 - 20, "s-ink");
        LC.h1.box(g, cx, y2, compact ? 170 : 200, 34, "pretrained model", { size: 13, weight: 600, stroke: "var(--a-blue)" });
        var tasks = compact ? ["sentiment", "Q&A", "entailment"] : ["sentiment", "question answering", "entailment"];
        var tw = compact ? 96 : 150, gap = compact ? 12 : 30, x0 = cx - (3 * tw + 2 * gap) / 2 + tw / 2;
        tasks.forEach(function (t, i) {
          var xx = x0 + i * (tw + gap);
          A(g, cx + (xx - cx) * 0.25, y2 + 18, xx, y3 - 16, "s-orange", 6);
          LC.h1.box(g, xx, y3, tw, 28, t, { size: 12, stroke: "var(--a-orange)" });
        });
        S("text", { x: compact ? 14 : cx + 110, y: y2 + 4, class: "t t-sm t-blue", text: compact ? "" : "pretrain once" }, g);
        note(g, top + 196, compact ? "then fine-tune briefly for each task" : "then fine-tune a copy briefly for each task, with little labelled data", "t-muted");
      })(sc[0]);
      tl.addLabel("s0", 0);

      // ---- scene 1: GPT vs BERT
      var gArr = [], bArr = [];
      (function (g) {
        var words = ["the", "cat", "sat", "on", "the"], n = 5;
        var x0 = compact ? 46 : 140, st = compact ? 50 : 70, bw = st - 6;
        function rowWords(y, list, hole) {
          return list.map(function (w, i) {
            var xx = x0 + st * (i + 0.5);
            LC.h1.box(g, xx, y, bw, 26, w, { size: 12, fill: i === hole ? "f-surface2" : "f-surface", stroke: i === hole ? "var(--a-orange)" : "var(--line)" });
            return xx;
          });
        }
        var yG = top + 30, yB = top + 112;
        S("text", { x: compact ? 8 : 40, y: yG + 4, class: "t t-sm t-blue", "font-weight": 600, text: "GPT" }, g);
        S("text", { x: compact ? 8 : 40, y: yB + 4, class: "t t-sm t-blue", "font-weight": 600, text: "BERT" }, g);
        var gx = rowWords(yG, words.concat(["?"]), 5);
        var bx = rowWords(yB, ["the", "[?]", "sat", "on", "the", "mat"], 1);
        for (var i = 0; i < 5; i++) gArr.push(S("path", { d: "M" + gx[i] + " " + (yG + 14) + "C" + gx[i] + " " + (yG + 38) + " " + gx[5] + " " + (yG + 38) + " " + gx[5] + " " + (yG + 15), class: "s-orange", "stroke-width": 1.8 }, g));
        [0, 2, 3, 4, 5].forEach(function (j) { bArr.push(S("path", { d: "M" + bx[j] + " " + (yB + 14) + "C" + bx[j] + " " + (yB + 38) + " " + bx[1] + " " + (yB + 38) + " " + bx[1] + " " + (yB + 15), class: "s-orange", "stroke-width": 1.8 }, g)); });
        S("text", { x: cx, y: yG + 56, class: "t t-sm t-muted t-mid", text: compact ? "predict the next word (left only)" : "decoder: predict the next word, looking left only" }, g);
        S("text", { x: cx, y: yB + 56, class: "t t-sm t-muted t-mid", text: compact ? "fill in a hidden word (both sides)" : "encoder: fill in a hidden word, looking both ways" }, g);
      })(sc[1]);
      LC.h1.swap(tl, sc[0], sc[1]); T.go(tl, 1);
      gArr.forEach(function (p, i) { LC.drawIn(tl, p, { duration: 0.35 }, i ? "<0.06" : undefined); });
      bArr.forEach(function (p, i) { LC.drawIn(tl, p, { duration: 0.35 }, "<0.06"); });
      tl.addLabel("s1");

      // ---- scene 2: model sizes, log scale
      var sizeBars = [];
      (function (g) {
        var x0 = compact ? 112 : 190, x1 = compact ? 300 : 520, lo = -1, hi = 2; // log10(billions): 0.1B … 100B
        function X(b) { return x0 + (Math.log10(b) - lo) / (hi - lo) * (x1 - x0); }
        var gy0 = top + 14, gy1 = top + 168;
        [0.1, 1, 10, 100].forEach(function (b) {
          S("line", { x1: X(b), x2: X(b), y1: gy0, y2: gy1, class: "s-grid" }, g);
          S("text", { x: X(b), y: gy1 + 16, class: "t t-sm t-muted t-mid", text: b < 1 ? "0.1B" : b + "B" }, g);
        });
        [["GPT (2018)", 0.117, "0.117B"], ["BERT-large", 0.34, "0.34B"], ["GPT-2 (2019)", 1.5, "1.5B"], ["T5 (2019)", 11, "11B"]].forEach(function (m, i) {
          var y = gy0 + 10 + i * 36;
          S("text", { x: x0 - 10, y: y + 17, class: "t t-sm t-end", text: compact ? m[0].replace(" (2018)", "").replace(" (2019)", "") : m[0] }, g);
          var r = S("rect", { x: X(0.1), y: y + 2, width: 0, height: 22, rx: 3, class: i > 1 ? "f-orange" : "f-blue" }, g);
          var v = S("text", { x: X(m[1]) + 6, y: y + 17, class: "t t-sm t-mono", text: m[2] }, g);
          v.style.opacity = 0;
          sizeBars.push([r, X(m[1]) - X(0.1), v]);
        });
        note(g, top + 212, compact ? "weights, log scale: each line = 10×" : "number of weights, log scale: each grid line is 10× more", "t-muted");
      })(sc[2]);
      LC.h1.swap(tl, sc[1], sc[2]); T.go(tl, 2);
      sizeBars.forEach(function (b, i) {
        tl.to(b[0], { attr: { width: b[1] }, duration: 0.45, ease: "power2.out" }, i ? "<0.12" : undefined);
        tl.to(b[2], { opacity: 1, duration: 0.2 }, ">-0.1");
      });
      tl.addLabel("s2");

      // ---- scene 3: scaling law sketch
      var lawLine, lawPts = [];
      (function (g) {
        var px = compact ? 56 : 170, pw = compact ? 260 : 300, py = top + 22, ph = 130;
        S("path", { d: "M" + px + " " + py + "V" + (py + ph) + "H" + (px + pw), class: "s-axis" }, g);
        S("text", { x: px - 6, y: py - 8, class: "t t-sm t-muted", text: "↑ test loss (log)" }, g);
        S("text", { x: px + pw, y: py + ph + 18, class: "t t-sm t-muted t-end", text: "compute (log) →" }, g);
        lawLine = S("path", { d: "M" + (px + 10) + " " + (py + 10) + "L" + (px + pw - 10) + " " + (py + ph - 16), class: "s-blue" }, g);
        for (var i = 0; i < 6; i++) {
          var u = 0.08 + i * 0.17, jit = [3, -4, 2, -2, 4, -3][i];
          var x = px + 10 + u * (pw - 20), y = py + 10 + u * (ph - 26) + jit;
          lawPts.push(S("circle", { cx: x, cy: y, r: 5, class: "f-orange" }, g));
        }
        if (!compact) {
          S("text", { x: px + pw + 14, y: py + 40, class: "t t-sm", text: "each 10× more compute" }, g);
          S("text", { x: px + pw + 14, y: py + 58, class: "t t-sm", text: "cuts loss by a" }, g);
          S("text", { x: px + pw + 14, y: py + 76, class: "t t-sm", text: "similar fraction" }, g);
        }
        note(g, top + 194, compact ? "a power law: straight on log–log axes" : "a power law is a straight line on log–log axes (sketch, not data)", "t-muted");
      })(sc[3]);
      lawPts.forEach(function (p) { p.style.opacity = 0; });
      LC.h1.swap(tl, sc[2], sc[3]); T.go(tl, 3);
      tl.to(lawPts, { opacity: 1, duration: 0.2, stagger: 0.12 });
      LC.drawIn(tl, lawLine, { duration: 0.7 });
      tl.addLabel("s3");

      // ---- scene 4: GPT-3 few-shot prompt
      var answer;
      (function (g) {
        var bx = compact ? 24 : 150, bw = compact ? 312 : 340, by = top + 8, lh = 22;
        S("rect", { x: bx, y: by, width: bw, height: 4 * lh + 20, rx: 10, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, g);
        var lines = ["Translate English to French:", "sea otter => loutre de mer", "peppermint => menthe poivrée", "cheese =>"];
        lines.forEach(function (t, i) { S("text", { x: bx + 14, y: by + 24 + i * lh, class: "t t-sm t-mono", text: t }, g); });
        answer = S("text", { x: bx + 14 + (compact ? 76 : 76), y: by + 24 + 3 * lh, class: "t t-sm t-mono t-orange", "font-weight": 700, text: "fromage" }, g);
        S("text", { x: bx, y: by + 4 * lh + 40, class: "t t-sm t-muted", text: compact ? "the prompt, then GPT-3's answer (orange)" : "the prompt, then GPT-3's continuation (in orange)" }, g);
        note(g, top + 166, compact ? "no retraining: the examples are in the prompt" : "no weights change: the examples live in the prompt (“few-shot”)");
        note(g, top + 188, compact ? "175B weights, ~300B training tokens" : "175 billion weights, trained on about 300 billion tokens", "t-muted");
      })(sc[4]);
      answer.style.opacity = 0;
      LC.h1.swap(tl, sc[3], sc[4]); T.go(tl, 4);
      tl.to(answer, { opacity: 1, duration: 0.4 });
      tl.addLabel("s4");

      // ---- scene 5: noise → image strip
      var frames = [];
      (function (g) {
        var n = 5, fs = compact ? 52 : 70, gap = compact ? 10 : 22, x0 = cx - (n * fs + (n - 1) * gap) / 2, y = top + 18;
        var rnd = (function (s) { return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })(7);
        for (var k = 0; k < n; k++) {
          var fx = x0 + k * (fs + gap), fg = S("g", {}, g), noise = 1 - k / (n - 1);
          S("rect", { x: fx, y: y, width: fs, height: fs, rx: 6, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, fg);
          S("circle", { cx: fx + fs / 2, cy: y + fs / 2, r: fs * 0.28, class: "f-orange", "fill-opacity": (1 - noise).toFixed(2) }, fg);
          for (var d = 0; d < 26; d++) {
            S("rect", { x: fx + 3 + rnd() * (fs - 9), y: y + 3 + rnd() * (fs - 9), width: 4, height: 4, class: rnd() > 0.5 ? "f-ink" : "f-blue", "fill-opacity": (0.75 * noise).toFixed(2) }, fg);
          }
          if (k < n - 1) A(g, fx + fs + 2, y + fs / 2, fx + fs + gap - 2, y + fs / 2, "s-ink", 5);
          frames.push(fg);
        }
        S("text", { x: x0, y: y + fs + 18, class: "t t-sm t-muted", text: "noise" }, g);
        S("text", { x: x0 + n * fs + (n - 1) * gap, y: y + fs + 18, class: "t t-sm t-muted t-end", text: "image" }, g);
        note(g, top + 128, compact ? "diffusion: remove noise step by step" : "diffusion (DDPM, 2020): learn to remove a little noise at a time");
        note(g, top + 152, compact ? "CLIP + DALL·E (2021): text meets images" : "CLIP and DALL·E (2021): connect captions and pictures", "t-muted");
        note(g, top + 174, compact ? "Stable Diffusion (2022): open weights" : "Stable Diffusion (Aug 2022): high-quality images, openly released", "t-muted");
      })(sc[5]);
      frames.forEach(function (f) { f.style.opacity = 0; });
      LC.h1.swap(tl, sc[4], sc[5]); T.go(tl, 5);
      tl.to(frames, { opacity: 1, duration: 0.25, stagger: 0.2 });
      tl.addLabel("s5");

      // ---- scene 6: tokens per weight
      var tpb = [];
      (function (g) {
        var x0 = compact ? 128 : 220, maxW = compact ? 160 : 260, sc20 = maxW / 22;
        S("text", { x: compact ? 14 : x0, y: top + 6, class: "t t-sm t-muted", text: "training tokens per weight" }, g);
        [["GPT-3 (175B)", 300 / 175, "1.7"], ["Gopher (280B)", 300 / 280, "1.1"], ["Chinchilla (70B)", 20, "20"]].forEach(function (b, i) {
          var y = top + 22 + i * 40;
          S("text", { x: x0 - 10, y: y + 18, class: "t t-sm t-end", "font-weight": i === 2 ? 600 : 400, text: b[0] }, g);
          var r = S("rect", { x: x0, y: y, width: 0, height: 26, rx: 4, class: i === 2 ? "f-orange" : "f-faint" }, g);
          var v = S("text", { x: x0 + b[1] * sc20 + 8, y: y + 18, class: "t t-sm t-mono", text: b[2] }, g);
          v.style.opacity = 0;
          tpb.push([r, b[1] * sc20, v]);
        });
        note(g, top + 162, compact ? "70B Chinchilla beat 280B Gopher" : "same compute: the 70B model trained on 1.4T tokens beat the 280B one");
        note(g, top + 184, compact ? "rule of thumb: ~20 tokens per weight" : "rule of thumb for compute-optimal training: about 20 tokens per weight", "t-muted");
      })(sc[6]);
      LC.h1.swap(tl, sc[5], sc[6]); T.go(tl, 6);
      tpb.forEach(function (b, i) {
        tl.to(b[0], { attr: { width: Math.max(2, b[1]) }, duration: 0.45, ease: "power2.out" }, i ? "<0.12" : undefined);
        tl.to(b[2], { opacity: 1, duration: 0.2 }, ">-0.1");
      });
      tl.addLabel("s6");

      // ---- scene 7: chat bubbles
      var bubbles = [];
      (function (g) {
        var bw = compact ? 250 : 330;
        var u = S("g", {}, g), a = S("g", {}, g);
        S("rect", { x: W - (compact ? 16 : 120) - bw, y: top + 8, width: bw, height: 36, rx: 14, class: "f-blue" }, u);
        S("text", { x: W - (compact ? 16 : 120) - bw / 2, y: top + 31, class: "t t-sm t-mid t-nohalo", style: "fill:var(--a-paper)", text: "Explain attention in one sentence." }, u);
        S("rect", { x: compact ? 16 : 120, y: top + 58, width: bw + 20, height: 56, rx: 14, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, a);
        S("text", { x: (compact ? 16 : 120) + 14, y: top + 81, class: "t t-sm", text: "Each word takes a weighted look at" }, a);
        S("text", { x: (compact ? 16 : 120) + 14, y: top + 101, class: "t t-sm", text: "the other words that matter to it." }, a);
        bubbles.push(u, a);
        note(g, top + 146, compact ? "InstructGPT (Mar 2022): RLHF" : "InstructGPT (Mar 2022): fine-tuned with human demonstrations and rankings");
        note(g, top + 168, compact ? "ChatGPT: 30 November 2022" : "ChatGPT: a free chat window on the same idea, 30 November 2022", "t-muted");
      })(sc[7]);
      bubbles.forEach(function (b) { b.style.opacity = 0; });
      LC.h1.swap(tl, sc[6], sc[7]); T.go(tl, 7);
      tl.to(bubbles, { opacity: 1, duration: 0.35, stagger: 0.4 });
      tl.addLabel("s7");
      return tl;
    }
  };
})();
