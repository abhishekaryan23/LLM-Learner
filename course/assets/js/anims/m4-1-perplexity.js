/* M4.1: perplexity from the probabilities a model gave to the actual next tokens.
   "The cat sat on the mat": p = 1/16, 1/4, 1/2, 1/2, 1/4 for cat, sat, on, the, mat.
   Surprise −ln p = 2.77, 1.39, 0.69, 0.69, 1.39; mean = 2 ln 2 = 1.386 nats; PPL = e^1.386 = 4.0. */
(function () {
  var LC = window.LC;
  var TOKS = ["The", "cat", "sat", "on", "the", "mat"];
  var P = [null, 1 / 16, 1 / 4, 1 / 2, 1 / 2, 1 / 4];
  var SUR = P.map(function (p) { return p ? -Math.log(p) : 0; });
  var MEAN = SUR.slice(1).reduce(function (a, b) { return a + b; }, 0) / 5; // 1.386
  var PPL = Math.exp(MEAN);                                                // 4.0

  LC.anims["m4-1-perplexity"] = {
    title: "Perplexity, token by token",
    steps: [
      "The model reads <em>The cat sat on the mat</em> one token at a time. Before each token it spreads probability over the <strong>whole vocabulary</strong>: what comes next?",
      "Keep only the probability it gave the token that <strong>actually</strong> came next: cat 0.06, sat 0.25, on 0.5, the 0.5, mat 0.25. Higher is better.",
      "Turn each probability into <strong>surprise</strong>, $-\\ln p$. A token it found unlikely is very surprising (cat: 2.77); a likely one barely (on: 0.69). Certainty ($p = 1$) would be 0.",
      "Average the surprise over the 5 predictions: $(2.77 + 1.39 + 0.69 + 0.69 + 1.39)/5 = 1.39$ nats. That is exactly the <strong>cross-entropy loss</strong> the model is trained to minimise.",
      "Undo the log: $\\text{PPL} = e^{1.39} = $ <strong>4.0</strong>. Perplexity is just the exponential of the average loss per token.",
      "Read it as an <strong>effective number of choices</strong>: on average the model was as unsure as if it were picking among <strong>4 equally likely tokens</strong>. A perfect model scores 1; uniform guessing over a 50,000-token vocabulary scores 50,000."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 300 } : { w: 640, h: 300 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var boxW = compact ? 50 : 86, gap = compact ? 8 : 14;
      var x0 = (W - (6 * boxW + 5 * gap)) / 2;
      function cx(i) { return x0 + i * (boxW + gap) + boxW / 2; }
      var base = 238, tokY = 248, boxH = 32;
      var pScale = 150, sScale = 150 / SUR[1];      // tallest bar = 150 units in both phases
      var bw = boxW * (compact ? 0.62 : 0.5);
      var tl = gsap.timeline();

      // tokens (visible at s0)
      var toks = S("g", {}, svg);
      TOKS.forEach(function (t, i) {
        S("rect", { x: cx(i) - boxW / 2, y: tokY, width: boxW, height: boxH, rx: 8, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, toks);
        S("text", { x: cx(i), y: tokY + 21, class: "t t-mid" + (compact ? " t-sm" : ""), text: t }, toks);
      });
      var baseLine = S("line", { x1: cx(1) - boxW / 2, x2: cx(5) + boxW / 2, y1: base, y2: base, class: "s-grid" }, svg);

      // one heading per step, all in the reserved top row
      function head(txt, cls) { return S("text", { x: W / 2, y: 30, class: "t t-mid " + (cls || "t-sm t-muted"), text: txt }, svg); }
      var heads = [
        head("a model reads: The cat sat on the mat"),
        head("p(the token that actually came next)"),
        head("surprise = −ln p   (nats)"),
        head("average surprise = 1.39 nats = the loss")
      ];
      var ppl = S("text", { x: W / 2, y: 36, class: "t t-lg t-orange t-mid" }, svg);
      ppl.appendChild(document.createTextNode("PPL = e"));
      S("tspan", { dy: -9, "font-size": 13, text: MEAN.toFixed(2) }, ppl);
      S("tspan", { dy: 9, text: " = " + PPL.toFixed(1) }, ppl);
      heads.push(ppl);
      heads.push(head("as unsure as picking 1 of 4 doors", "t t-orange"));
      heads.forEach(function (h, i) { if (i) h.style.opacity = 0; });
      function swapHead(i) {
        tl.to(heads[i - 1], { opacity: 0, duration: 0.2 });
        tl.to(heads[i], { opacity: 1, duration: 0.3 });
      }
      tl.addLabel("s0", 0);

      // s1: probability bars (blue)
      var pBars = [], pLbls = [], sBars = [], sLbls = [];
      for (var i = 1; i < 6; i++) {
        pBars.push(S("rect", { x: cx(i) - bw / 2, y: base, width: bw, height: 0, rx: 3, class: "f-blue" }, svg));
        pLbls.push(S("text", { x: cx(i), y: base - P[i] * pScale - 6, class: "t t-sm t-mono t-mid", text: P[i].toFixed(2) }, svg));
        sBars.push(S("rect", { x: cx(i) - bw / 2, y: base, width: bw, height: 0, rx: 3, class: "f-orange" }, svg));
        sLbls.push(S("text", { x: cx(i), y: base - SUR[i] * sScale - 10, class: "t t-sm t-mono t-mid", text: SUR[i].toFixed(2) }, svg));
      }
      swapHead(1);
      pBars.forEach(function (b, k) {
        var h = P[k + 1] * pScale;
        tl.to(b, { attr: { y: base - h, height: h }, duration: 0.6, ease: "power2.out" }, k ? "<0.06" : "<");
      });
      LC.popIn(tl, pLbls, { duration: 0.3, stagger: 0.05 }, "-=0.2");
      tl.addLabel("s1");

      // s2: morph into surprise bars (orange)
      swapHead(2);
      tl.to(pLbls, { opacity: 0, duration: 0.2 }, "<");
      sBars.forEach(function (b, k) {
        var h = SUR[k + 1] * sScale;
        tl.to(b, { attr: { y: base - h, height: h }, duration: 0.7, ease: "power2.inOut" }, k ? "<0.06" : "<");
      });
      tl.to(pBars, { opacity: 0, duration: 0.5 }, "<");
      LC.popIn(tl, sLbls, { duration: 0.3, stagger: 0.05 }, "-=0.2");
      tl.addLabel("s2");

      // s3: mean line; its label sits in the empty column above "The"
      var my = base - MEAN * sScale;
      var meanLine = S("path", { d: "M" + (cx(1) - boxW / 2) + " " + my + "H" + (cx(5) + boxW / 2), class: "s-ink", "stroke-dasharray": "6 5" }, svg);
      var meanA = S("text", { x: cx(0), y: my - 7, class: "t t-sm t-mid", text: "mean" }, svg);
      var meanB = S("text", { x: cx(0), y: my + 17, class: "t t-sm t-mono t-mid", text: MEAN.toFixed(2) }, svg);
      swapHead(3);
      // a dashed path can't use the dash-offset draw trick, so it fades in instead
      LC.popIn(tl, [meanLine, meanA, meanB], { duration: 0.5 });
      tl.addLabel("s3");

      // s4: exponentiate
      swapHead(4);
      tl.to(sBars.concat(sLbls), { opacity: 0.35, duration: 0.3 }, "<");
      tl.addLabel("s4");

      // s5: four equally likely doors
      var dw = compact ? 46 : 60, dh = 92, dg = compact ? 18 : 26, dy = 104;
      var dx0 = W / 2 - (4 * dw + 3 * dg) / 2;
      var doors = [];
      for (var d = 0; d < 4; d++) {
        var g = S("g", {}, svg);
        S("rect", { x: dx0 + d * (dw + dg), y: dy, width: dw, height: dh, rx: 6, class: "f-surface", stroke: "var(--a-orange)", "stroke-width": 2.5 }, g);
        S("circle", { cx: dx0 + d * (dw + dg) + dw - 8, cy: dy + dh / 2 + 14, r: 3, class: "f-orange" }, g);
        S("text", { x: dx0 + d * (dw + dg) + dw / 2, y: dy + dh / 2 + 2, class: "t t-lg t-mid t-nohalo", text: "?" }, g);
        doors.push(g);
      }
      var doorNote = S("text", { x: W / 2, y: dy + dh + 26, class: "t t-sm t-muted t-mid", text: "each door: 1 in 4 chance" }, svg);
      swapHead(5);
      tl.to(sBars.concat(sLbls, [meanLine, meanA, meanB, baseLine]), { opacity: 0, duration: 0.35 }, "<");
      LC.popIn(tl, doors, { duration: 0.3, stagger: 0.1 });
      LC.popIn(tl, doorNote, { duration: 0.3 });
      tl.addLabel("s5");
      return tl;
    }
  };
})();
