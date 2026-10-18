/* M1.4: a decoder-only transformer, bottom to top, for the input "by the river".
   Token embedding → residual stream → N × [norm → causal attention → add; norm → MLP → add]
   → final norm → unembedding → logits → softmax. Probabilities are illustrative. */
(function () {
  var LC = window.LC;
  var TOKS = ["by", "the", "river"], NEXT = ["the", "river", "bank"];
  var PROBS = [["bank", 0.38], ["side", 0.12], ["and", 0.07]];
  var EMB = [[0.8, 0.3, 0.6, 0.4], [0.3, 0.7, 0.4, 0.9], [0.6, 0.9, 0.2, 0.5]];

  LC.anims["m1-4-decoder"] = {
    title: "A decoder-only transformer, bottom to top",
    steps: [
      "Text arrives as token IDs. The <strong>token embedding</strong> is a lookup: each ID picks one row of a vocab × $d_{\\text{model}}$ table, giving each token a vector.",
      "Each token's vector now travels straight up the <strong>residual stream</strong>. Layers never replace it; they <em>read</em> from it and <em>add</em> their results back.",
      "Sub-block 1: <strong>normalize</strong>, then <strong>causal self-attention</strong> (M1.1–M1.3), the only place where tokens exchange information. Its output is <strong>added</strong> to the stream (⊕).",
      "Sub-block 2: normalize, then an <strong>MLP</strong> applied to each token separately (expand ≈4×, nonlinearity, shrink back). Again the result is added (⊕).",
      "Those two sub-blocks form <strong>one layer</strong>. The model stacks $N$ identical-looking layers (12 in GPT-2 small, 32 in Llama 3 8B), each with its own weights.",
      "At the top: a <strong>final norm</strong>, then the <strong>unembedding</strong> $W_U$ ($d_{\\text{model}}$ × vocab) turns each vector into one <strong>logit</strong> per vocabulary token, 50,257 of them for GPT-2.",
      "A <strong>softmax</strong> turns the last position's logits into next-token probabilities. After “by the river”, <em>bank</em> is the favourite (illustrative numbers).",
      "<strong>Training</strong>: every position predicts its own next token in one parallel pass (the causal mask stops cheating), so one sequence gives many lessons. <strong>Generation</strong> only uses the last position, appends the chosen token and runs again."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 538 } : { w: 640, h: 440 }; },
    build: function (svg, ctx) {
      var S = LC.svg, Wd = ctx.w, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      var cols = compact ? [152, 226, 300] : [240, 320, 400];
      var bx0 = compact ? 8 : 16, bx1 = compact ? 352 : 460, lx = bx0 + 10;
      var tokW = compact ? 62 : 70, tokH = 30, cell = 10, cg = 2, embW = 4 * cell + 3 * cg;
      // y positions (the model is drawn bottom to top)
      var Y = compact
        ? { tok: 496, emb: 466, attn: 384, attnH: 34, plusA: 366, mlp: 306, mlpH: 32, plusM: 288, f0: 270, f1: 430, fn: 224, un: 186, log: 148, by0: 38, tg: 84, stream: 344 }
        : { tok: 400, emb: 376, attn: 316, attnH: 30, plusA: 300, mlp: 252, mlpH: 28, plusM: 234, f0: 214, f1: 354, fn: 178, un: 146, log: 108, by0: 80, tg: 46, stream: 288 };
      var tokY = Y.tok, embY = Y.emb, attnY = Y.attn, attnH = Y.attnH, plusA = Y.plusA, mlpY = Y.mlp, mlpH = Y.mlpH, plusM = Y.plusM;
      var frameY0 = Y.f0, frameY1 = Y.f1, fnY = Y.fn, fnH = compact ? 26 : 22, unY = Y.un, unH = compact ? 26 : 22, logY = Y.log;

      // s0: tokens + embeddings
      TOKS.forEach(function (t, i) {
        S("rect", { x: cols[i] - tokW / 2, y: tokY, width: tokW, height: tokH, rx: 8, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, svg);
        S("text", { x: cols[i], y: tokY + 20, class: "t t-sm t-mid", text: t }, svg);
      });
      var embLbl = S("text", { x: lx, y: embY + 10, class: "t t-sm t-muted", text: compact ? "embedding" : "token embedding (lookup)" }, svg);
      var embCells = [];
      EMB.forEach(function (v, i) {
        v.forEach(function (a, d) {
          embCells.push(S("rect", { x: cols[i] - embW / 2 + d * (cell + cg), y: embY, width: cell, height: cell, rx: 2, class: "f-blue", "fill-opacity": (0.25 + 0.75 * a).toFixed(2) }, svg));
        });
      });
      var tokLbl = S("text", { x: lx, y: tokY + 20, class: "t t-sm t-muted", text: compact ? "tokens" : "input tokens" }, svg);

      // layer furniture is created first so streams draw on top of the boxes
      var shadows = [10, 5].map(function (o) {
        return S("rect", { x: bx0 + 2 + o, y: frameY0 - o, width: bx1 - bx0 - 4, height: frameY1 - frameY0, rx: 12, class: "f-none", stroke: "var(--a-faint)", "stroke-width": 1.5 }, svg);
      });
      var frame = S("rect", { x: bx0 + 2, y: frameY0, width: bx1 - bx0 - 4, height: frameY1 - frameY0, rx: 12, class: "f-paper", stroke: "var(--a-ink)", "stroke-width": 1.5, "stroke-dasharray": "5 4" }, svg);
      var frameLbl = S("text", { x: lx, y: frameY0 + 20, class: "t t-sm", text: compact ? "× 12 layers" : "one layer, repeated N = 12 times", "font-weight": 600 }, svg);
      var attnBox = S("rect", { x: bx0 + 6, y: attnY, width: bx1 - bx0 - 12, height: attnH, rx: 8, class: "f-surface2", stroke: "var(--a-orange)", "stroke-width": 1.5 }, svg);
      var attnLbl = S("text", { x: lx + 2, y: attnY + attnH / 2 + 4.5, class: "t t-sm", text: compact ? "norm → attn" : "norm → causal self-attention", "font-weight": 600 }, svg);
      var mlpLbl = S("text", { x: lx + 2, y: mlpY + mlpH / 2 + 4.5, class: "t t-sm", text: compact ? "norm → MLP" : "norm → MLP (per token)", "font-weight": 600 }, svg);
      var mlpBoxes = cols.map(function (x) { return S("rect", { x: x - 28, y: mlpY, width: 56, height: mlpH, rx: 8, class: "f-surface2", stroke: "var(--a-blue)", "stroke-width": 1.5 }, svg); });
      var fnBox = S("rect", { x: bx0 + 6, y: fnY, width: bx1 - bx0 - 12, height: fnH, rx: 8, class: "f-surface2", stroke: "var(--line)", "stroke-width": 1.5 }, svg);
      var fnLbl = S("text", { x: lx + 2, y: fnY + fnH / 2 + 4.5, class: "t t-sm", text: "final norm" }, svg);
      var unBox = S("rect", { x: bx0 + 6, y: unY, width: bx1 - bx0 - 12, height: unH, rx: 8, class: "f-surface2", stroke: "var(--line)", "stroke-width": 1.5 }, svg);
      var unLbl = S("text", { x: lx + 2, y: unY + unH / 2 + 4.5, class: "t t-sm", text: compact ? "unembed W_U" : "unembedding W_U (d_model × vocab)" }, svg);

      // residual streams
      var streams = cols.map(function (x) { return S("path", { d: "M" + x + " " + (embY - 4) + "V" + (fnY + fnH), class: "s-ink", "stroke-width": 2.5 }, svg); });
      var plus = [];
      [plusA, plusM].forEach(function (py) {
        cols.forEach(function (x) {
          var g = S("g", {}, svg);
          S("circle", { cx: x, cy: py, r: 8, class: "f-paper", stroke: "var(--a-ink)", "stroke-width": 1.8 }, g);
          S("path", { d: "M" + (x - 4.5) + " " + py + "H" + (x + 4.5) + "M" + x + " " + (py - 4.5) + "V" + (py + 4.5), stroke: "var(--a-ink)", "stroke-width": 1.8 }, g);
          plus.push(g);
        });
      });
      var plusAtt = plus.slice(0, 3), plusMlp = plus.slice(3);
      var streamLbl = S("text", { x: lx, y: Y.stream, class: "t t-sm t-muted", text: compact ? "residual stream ↑" : "residual stream ↑ (one vector per token)" }, svg);

      // logits strips + arrows
      var logits = cols.map(function (x, i) {
        var g = S("g", {}, svg), n = 9, bw = compact ? 4 : 6, gp = 2, w = n * bw + (n - 1) * gp;
        for (var k = 0; k < n; k++) {
          var h = 4 + 14 * Math.abs(Math.sin(1.7 * k + i * 2.3));
          S("rect", { x: x - w / 2 + k * (bw + gp), y: logY + 18 - h, width: bw, height: h, rx: 1, class: k === (i * 4 + 2) % n ? "f-orange" : "f-faint" }, g);
        }
        return g;
      });
      var logLbl = S("text", { x: lx, y: logY + 16, class: "t t-sm t-muted", text: compact ? "logits" : "logits (one per vocab token)" }, svg);

      // probability bars for the last position
      var bars = S("g", {}, svg);
      var barX = compact ? 188 : 524, barMax = compact ? 110 : 60, by0 = Y.by0;
      S("text", { x: compact ? 120 : 476, y: by0 - 16, class: "t t-sm", text: compact ? "next after “river”:" : "after “river”:", "font-weight": 600 }, bars);
      var barEls = PROBS.map(function (p, k) {
        var y = by0 + k * 26;
        S("text", { x: barX - 8, y: y + 13, class: "t t-sm t-end", text: p[0] }, bars);
        var r = S("rect", { x: barX, y: y + 1, width: barMax * p[1] / PROBS[0][1], height: 16, rx: 3, class: k ? "f-blue" : "f-orange" }, bars);
        S("text", { x: barX + barMax * p[1] / PROBS[0][1] + 6, y: y + 13, class: "t t-sm t-mono", text: p[1].toFixed(2) }, bars);
        return r;
      });
      var probArrow = compact ? S("path", { d: "M" + cols[2] + " " + (logY - 4) + "V" + (by0 + 3 * 26 + 4), class: "s-ink", "stroke-width": 1.5 }, svg)
        : S("path", { d: "M" + (cols[2] + 34) + " " + (logY + 10) + "H" + 470 + "m-6 -5l6 5l-6 5", class: "s-ink", "stroke-width": 1.5 }, svg);

      // training targets
      var targets = S("g", {}, svg);
      var tgY = Y.tg;
      S("text", { x: lx, y: tgY - 18, class: "t t-sm", text: compact ? "targets (training)" : "training: every position predicts its next token", "font-weight": 600 }, targets);
      NEXT.forEach(function (t, i) {
        S("rect", { x: cols[i] - tokW / 2, y: tgY, width: tokW, height: 28, rx: 8, class: "f-surface", stroke: "var(--a-orange)", "stroke-width": 1.8 }, targets);
        S("text", { x: cols[i], y: tgY + 19, class: "t t-sm t-mid", text: t, "font-weight": 600 }, targets);
      });
      var tgArrows = cols.map(function (x) { return S("path", { d: "M" + x + " " + (logY - 4) + "V" + (tgY + 32) + "m-5 6l5 -6l5 6", class: "s-orange", "stroke-width": 1.8 }, svg); });

      // ---- timeline ----
      [frame, frameLbl, attnBox, attnLbl, mlpLbl, fnBox, fnLbl, unBox, unLbl, streamLbl, logLbl, bars, targets].concat(shadows, mlpBoxes, plus, logits).forEach(function (e) { e.style.opacity = 0; });
      tl.addLabel("s0", 0);

      // s1: streams
      streams.forEach(function (p, i) { LC.drawIn(tl, p, { duration: 0.9 }, i ? "<0.1" : "+=0.01"); });
      LC.popIn(tl, [streamLbl], { duration: 0.3 });
      tl.addLabel("s1");

      // s2: attention + adds
      tl.to(streamLbl, { opacity: 0, duration: 0.2 });
      LC.popIn(tl, [attnBox, attnLbl], { duration: 0.4 });
      LC.popIn(tl, plusAtt, { duration: 0.3, stagger: 0.1 });
      tl.addLabel("s2");

      // s3: MLP + adds
      LC.popIn(tl, [mlpLbl].concat(mlpBoxes), { duration: 0.4, stagger: 0.08 });
      LC.popIn(tl, plusMlp, { duration: 0.3, stagger: 0.1 });
      tl.addLabel("s3");

      // s4: one layer, repeated
      LC.popIn(tl, [frame, frameLbl], { duration: 0.4 });
      LC.popIn(tl, shadows, { duration: 0.3, stagger: 0.15 });
      tl.addLabel("s4");

      // s5: final norm, unembedding, logits
      LC.popIn(tl, [fnBox, fnLbl], { duration: 0.3 });
      LC.popIn(tl, [unBox, unLbl], { duration: 0.3 });
      LC.popIn(tl, logits.concat([logLbl]), { duration: 0.3, stagger: 0.1 });
      tl.addLabel("s5");

      // s6: softmax at the last position
      LC.drawIn(tl, probArrow, { duration: 0.4 });
      LC.popIn(tl, [bars], { duration: 0.2 });
      barEls.forEach(function (r) { var w = +r.getAttribute("width"); r.setAttribute("width", 0); tl.to(r, { attr: { width: w }, duration: 0.5 }, "<0.1"); });
      tl.addLabel("s6");

      // s7: training targets at every position
      tl.to([bars, probArrow], { opacity: 0, duration: 0.3 });
      tgArrows.forEach(function (a, i) { LC.drawIn(tl, a, { duration: 0.4 }, i ? "<0.1" : "+=0.01"); });
      LC.popIn(tl, [targets], { duration: 0.4 });
      tl.addLabel("s7");
      return tl;
    }
  };
})();
