/* M3.2: one human preference pair trains a reward model through the
   Bradley–Terry model. r_A = 1.2, r_B = 0.4 -> sigma(0.8) = 0.69, loss 0.37.
   After a step (illustrative): r_A = 1.6, r_B = 0.1 -> sigma(1.5) = 0.82, loss 0.20. */
(function () {
  var LC = window.LC;
  function sig(x) { return 1 / (1 + Math.exp(-x)); }
  var R0 = [1.2, 0.4], R1 = [1.6, 0.1];

  LC.anims["m3-2-rm"] = {
    title: "Training a reward model on one comparison",
    steps: [
      "Sample <strong>two responses</strong> to the same prompt, usually from the SFT model. Which one is better?",
      "A person compares them: A is <strong>chosen</strong>, B is <strong>rejected</strong>. Comparing is much easier than writing a perfect answer or giving an absolute score.",
      "The <strong>reward model</strong> is a language model whose output layer is swapped for a <strong>scalar head</strong>: (prompt, response) → one number. Right now it gives $r_A = 1.2$ and $r_B = 0.4$.",
      "<strong>Bradley–Terry</strong>: the probability that A beats B is $\\sigma(r_A - r_B) = \\sigma(0.8) = 0.69$. Only the <em>difference</em> of rewards matters.",
      "The loss is the negative log-probability of the person's choice: $-\\log 0.69 = 0.37$. It is large when the reward model disagrees with the person.",
      "A gradient step pushes $r_A$ <strong>up</strong> and $r_B$ <strong>down</strong>: now $\\sigma(1.5) = 0.82$ and the loss falls to 0.20. Over thousands of pairs, the model learns to score any response."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 540 } : { w: 640, h: 330 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      var lx = 14, colW = compact ? W - 28 : 330;
      var y0 = compact ? 18 : 22;

      // ---- prompt + responses ----
      S("text", { x: lx, y: y0, class: "t t-sm t-muted", text: "prompt: why is the sky blue?" }, svg);
      var rows = compact ? [52, 140] : [56, 150];
      var texts = ["Air scatters blue light the most.", "It reflects the colour of the sea."];
      var names = ["A", "B"];
      var boxes = [], tags = [], bars = [], barLbls = [];
      var barX = lx + 22, barMax = compact ? 170 : 200, barScale = barMax / 2;
      rows.forEach(function (y, i) {
        var g = S("g", {}, svg);
        S("text", { x: lx, y: y + 21, class: "t", text: names[i], "font-weight": 700 }, g);
        S("rect", { x: lx + 22, y: y, width: colW - 22, height: 32, rx: 9, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, g);
        S("text", { x: lx + 34, y: y + 21, class: "t" + (compact ? " t-sm" : ""), text: texts[i] }, g);
        boxes.push(g);
        tags.push(S("text", { x: lx + colW, y: y - 8, class: "t t-sm t-end " + (i === 0 ? "t-blue" : "t-muted"), text: i === 0 ? "✓ chosen" : "✗ rejected", "font-weight": i === 0 ? 700 : 450 }, svg));
        var by = y + 42;
        bars.push(S("rect", { x: barX, y: by, width: R0[i] * barScale, height: 12, rx: 3, class: i === 0 ? "f-blue" : "f-faint" }, svg));
        barLbls.push(S("text", { x: barX + R0[i] * barScale + 8, y: by + 11, class: "t t-sm t-mono", text: "r = " + R0[i].toFixed(1) }, svg));
      });
      tl.addLabel("s0", 0);

      // s1: preference
      LC.popIn(tl, tags, { duration: 0.4, stagger: 0.15 });
      tl.addLabel("s1");

      // s2: reward model schematic + scores
      var schY = compact ? 228 : 262;
      var sch = S("g", {}, svg);
      var b1w = compact ? 150 : 160, b2w = compact ? 96 : 100;
      var bx1 = lx, bx2 = lx + b1w + 30, bx3 = bx2 + b2w + 30;
      S("text", { x: lx, y: schY - 10, class: "t t-sm t-muted", text: "reward model" }, sch);
      S("rect", { x: bx1, y: schY, width: b1w, height: 30, rx: 8, class: "f-surface", stroke: "var(--a-ink)", "stroke-width": 1.5 }, sch);
      S("text", { x: bx1 + b1w / 2, y: schY + 20, class: "t t-sm t-mid", text: "transformer (from SFT)" }, sch);
      S("rect", { x: bx2, y: schY, width: b2w, height: 30, rx: 8, class: "f-surface", stroke: "var(--a-orange)", "stroke-width": 2 }, sch);
      S("text", { x: bx2 + b2w / 2, y: schY + 20, class: "t t-sm t-mid", text: "scalar head" }, sch);
      S("path", { d: "M" + (bx1 + b1w + 4) + " " + (schY + 15) + "H" + (bx2 - 6) + "M" + (bx2 - 11) + " " + (schY + 10) + "L" + (bx2 - 5) + " " + (schY + 15) + "L" + (bx2 - 11) + " " + (schY + 20), class: "s-ink" }, sch);
      S("path", { d: "M" + (bx2 + b2w + 4) + " " + (schY + 15) + "H" + (bx3 - 6) + "M" + (bx3 - 11) + " " + (schY + 10) + "L" + (bx3 - 5) + " " + (schY + 15) + "L" + (bx3 - 11) + " " + (schY + 20), class: "s-ink" }, sch);
      S("text", { x: bx3, y: schY + 20, class: "t t-mono", text: "r", "font-weight": 700 }, sch);
      LC.popIn(tl, sch, { duration: 0.4 });
      bars.forEach(function (b, i) { b.setAttribute("width", 0); tl.to(b, { attr: { width: R0[i] * barScale }, duration: 0.6, ease: "power2.out" }, i ? "<0.1" : ">"); });
      LC.popIn(tl, barLbls, { duration: 0.3 });
      tl.addLabel("s2");

      // s3: Bradley–Terry curve
      var px0 = compact ? 44 : 410, px1 = W - 16;
      var pt = compact ? 310 : 50, pb = compact ? 446 : 238;
      var X0 = -4, X1 = 4;
      function sx(d) { return px0 + (d - X0) / (X1 - X0) * (px1 - px0); }
      function sy(p) { return pb - p * (pb - pt); }
      var plot = S("g", {}, svg);
      S("text", { x: px0 - 34, y: pt - 18, class: "t t-sm t-muted", text: "↑ P(A beats B) = σ(r(A) − r(B))" }, plot);
      [0.5, 1].forEach(function (p) { S("line", { x1: px0, x2: px1, y1: sy(p), y2: sy(p), class: "s-grid" }, plot); });
      S("path", { d: "M" + px0 + " " + pt + "V" + pb + "H" + px1, class: "s-axis" }, plot);
      [0, 0.5, 1].forEach(function (p) { S("text", { x: px0 - 6, y: sy(p) + 4, class: "t t-sm t-muted t-end", text: p }, plot); });
      [-4, 0, 4].forEach(function (d) { S("text", { x: sx(d), y: pb + 16, class: "t t-sm t-muted t-mid", text: (d < 0 ? "−" + (-d) : d) }, plot); });
      S("text", { x: px1, y: pb + 34, class: "t t-sm t-muted t-end", text: "r(A) − r(B) →" }, plot);
      var curve = S("path", { d: LC.fnPath(sig, X0, X1, sx, sy, 80), class: "s-blue" }, svg);
      LC.popIn(tl, plot, { duration: 0.3 });
      LC.drawIn(tl, curve, { duration: 0.9 });
      var st = { d: R0[0] - R0[1] };
      var guide = S("path", { d: "", class: "s-orange", "stroke-width": 1.5, "stroke-dasharray": "4 4" }, svg);
      var dot = S("circle", { r: 6, class: "f-orange", stroke: "var(--a-ink)", "stroke-width": 1.5 }, svg);
      var pLbl = S("text", { class: "t t-sm t-orange t-end", text: "", "font-weight": 700 }, svg);
      function place() {
        var x = sx(st.d), y = sy(sig(st.d));
        guide.setAttribute("d", "M" + x + " " + pb + "V" + y);
        dot.setAttribute("cx", x); dot.setAttribute("cy", y);
        pLbl.setAttribute("x", x - 10); pLbl.setAttribute("y", y - 10);
        pLbl.textContent = "P = " + sig(st.d).toFixed(2);
      }
      place();
      var r1y = compact ? pb + 60 : 292, r2y = r1y + 22, rX = compact ? lx : px0 - 34;
      var read1 = S("text", { x: rX, y: r1y, class: "t t-sm t-mono", text: "P = σ(1.2 − 0.4) = σ(0.8) = 0.69" }, svg);
      var read2 = S("text", { x: rX, y: r2y, class: "t t-sm t-mono t-orange", text: "loss = −log 0.69 = 0.37", "font-weight": 700 }, svg);
      LC.popIn(tl, [guide, dot, pLbl, read1], { duration: 0.4 });
      tl.addLabel("s3");

      // s4: loss
      LC.popIn(tl, read2, { duration: 0.4 });
      tl.addLabel("s4");

      // s5: gradient step
      var nb = [0, 1].map(function (i) { return { r: R0[i] }; });
      tl.to(read1, { opacity: 0, duration: 0.2 });
      tl.to(read2, { opacity: 0, duration: 0.2 }, "<");
      nb.forEach(function (o, i) {
        tl.to(o, { r: R1[i], duration: 1, ease: "power2.inOut", onUpdate: function () {
          bars[i].setAttribute("width", o.r * barScale);
          barLbls[i].setAttribute("x", barX + o.r * barScale + 8);
          barLbls[i].textContent = "r = " + o.r.toFixed(1);
        } }, i ? "<" : ">");
      });
      tl.to(st, { d: R1[0] - R1[1], duration: 1, ease: "power2.inOut", onUpdate: place }, "<");
      var read1b = S("text", { x: rX, y: r1y, class: "t t-sm t-mono", text: "P = σ(1.6 − 0.1) = σ(1.5) = 0.82" }, svg);
      var read2b = S("text", { x: rX, y: r2y, class: "t t-sm t-mono t-blue", text: "loss = −log 0.82 = 0.20", "font-weight": 700 }, svg);
      LC.popIn(tl, [read1b, read2b], { duration: 0.4 });
      tl.addLabel("s5");
      return tl;
    }
  };
})();
