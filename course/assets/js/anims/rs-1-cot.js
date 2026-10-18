/* RS.1: answer directly vs think step by step on a three-operation word problem.
   3 packs × 12 pencils = 36, give away 15 → 21, share among 3 friends → 7 each.
   The direct guess (12) is a plausible-looking wrong answer; the written steps reach 7. */
(function () {
  var LC = window.LC;

  LC.anims["rs-1-cot"] = {
    title: "Answer at once, or write the steps first?",
    steps: [
      "A word problem that takes <strong>three operations in a row</strong>: multiply, subtract, divide. Each one needs the result of the one before.",
      "<strong>Direct answer:</strong> the answer must be the very next token, so all three operations have to happen inside <em>one</em> pass through the network. Here it guesses 12. Wrong.",
      "<strong>Chain of thought:</strong> instead, the model writes the first step, $3 \\times 12 = 36$. Every token it writes is one more full pass through all of its layers.",
      "Step 2 <strong>reads</strong> the 36 it just wrote: $36 - 15 = 21$. Attention can look back at earlier tokens, so the written steps work like a <strong>scratchpad</strong>.",
      "Step 3 builds on step 2: $21 \\div 3 = 7$. Each step is a small, familiar sub-problem, far easier than doing all three at once.",
      "Only now does it answer: <strong>7</strong>, which is right. Same model, same weights. The only change is that it wrote its working first.",
      "The price: about 20 extra tokens before the answer (the exact count depends on the tokenizer), so roughly <strong>20× the serial computation</strong> (21 passes instead of 1), and 20× the output tokens you pay for."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 458 } : { w: 640, h: 350 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      if (compact) svg = S("g", { transform: "translate(0,22)" }, svg); // keep the top-right corner free for the "swipe" hint

      // the problem
      var lines = compact
        ? ["Sam buys 3 packs of 12 pencils, gives", "away 15, and shares the rest equally", "among 3 friends. How many does each get?"]
        : ["Sam buys 3 packs of 12 pencils, gives away 15, and shares the rest", "equally among 3 friends. How many pencils does each friend get?"];
      var boxH = compact ? 72 : 56;
      S("rect", { x: 8, y: 8, width: W - 16, height: boxH, rx: 10, class: "f-surface", stroke: "var(--a-ink)", "stroke-width": 1.5 }, svg);
      lines.forEach(function (t, i) { S("text", { x: 20, y: 30 + i * 20, class: "t", text: t }, svg); });
      tl.addLabel("s0", 0);

      // geometry
      var dX, dY, sX, sY, chipW, rowH, gapY, noteX;
      if (compact) {
        dX = 16; dY = 104; sX = 40; sY = 178; chipW = 168; rowH = 30; gapY = 40; noteX = sX + chipW + 10;
      } else {
        dX = 16; dY = 96; sX = 330; sY = 96; chipW = 168; rowH = 30; gapY = 40; noteX = sX + chipW + 12;
      }

      function chip(x, y, w, parts, stroke) {
        var g = S("g", {}, svg);
        var r = S("rect", { x: x, y: y, width: w, height: rowH, rx: 8, class: "f-surface", stroke: stroke || "var(--line)", "stroke-width": 1.5 }, g);
        var t = S("text", { x: x + 12, y: y + 20, class: "t t-mono" }, g);
        parts.forEach(function (p) { S("tspan", { class: p[1] || "", text: p[0], "font-weight": p[1] ? 700 : 400 }, t); });
        return { g: g, r: r };
      }

      // s1: direct answer
      var dHead = S("text", { x: dX, y: dY, class: "t t-sm t-muted", text: compact ? "Direct: answer right away" : "Direct: answer right away" }, svg);
      var dChip = chip(dX, dY + 10, 132, [["answer: "], ["12", "t-blue"]]);
      var dMark = S("text", { x: dX + 142, y: dY + 30, class: "t t-sm t-blue", text: "✗ wrong", "font-weight": 600 }, svg);
      LC.popIn(tl, [dHead], { duration: 0.3 }, "+=0.02");
      LC.popIn(tl, [dChip.g], { duration: 0.35 });
      LC.popIn(tl, [dMark], { duration: 0.3 });
      tl.addLabel("s1");

      // s2..s4: written steps
      var sHead = S("text", { x: compact ? dX : sX, y: sY, class: "t t-sm t-muted", text: "Step by step: write the working first" }, svg);
      var y1 = sY + 10, y2 = y1 + gapY, y3 = y2 + gapY, y4 = y3 + gapY;
      var c1 = chip(sX, y1, chipW, [["3 × 12 = "], ["36", "t-orange"]]);
      var c2 = chip(sX, y2, chipW, [["36", "t-orange"], [" − 15 = "], ["21", "t-orange"]]);
      var c3 = chip(sX, y3, chipW, [["21", "t-orange"], [" ÷ 3 = "], ["7", "t-orange"]]);
      var n2 = S("text", { x: noteX, y: y2 + 20, class: "t t-sm t-muted", text: "reads 36" }, svg);
      var n3 = S("text", { x: noteX, y: y3 + 20, class: "t t-sm t-muted", text: "reads 21" }, svg);

      // look-back arrows on the left of the chips
      function back(yFrom, yTo) {
        var ax = sX - 8, a = yFrom + rowH / 2, b = yTo + rowH / 2;
        return S("path", { d: "M" + (sX - 2) + " " + a + "C" + (ax - 16) + " " + a + " " + (ax - 16) + " " + b + " " + (sX - 4) + " " + b +
          "M" + (sX - 10) + " " + (b - 5) + "L" + (sX - 4) + " " + b + "L" + (sX - 10) + " " + (b + 5), class: "s-orange", "stroke-width": 2 }, svg);
      }
      var a12 = back(y1, y2), a23 = back(y2, y3);

      LC.popIn(tl, [sHead], { duration: 0.3 }, "+=0.02");
      LC.popIn(tl, [c1.g], { duration: 0.4 });
      tl.addLabel("s2");
      LC.drawIn(tl, a12, { duration: 0.5 }, "+=0.02");
      LC.popIn(tl, [c2.g, n2], { duration: 0.4 });
      tl.addLabel("s3");
      LC.drawIn(tl, a23, { duration: 0.5 }, "+=0.02");
      LC.popIn(tl, [c3.g, n3], { duration: 0.4 });
      tl.addLabel("s4");

      // s5: the answer
      var aChip = chip(sX, y4, compact ? 132 : 132, [["answer: "], ["7", "t-orange"]], "var(--a-orange)");
      var aMark = S("text", { x: sX + 142, y: y4 + 20, class: "t t-sm t-orange", text: "✓ right", "font-weight": 600 }, svg);
      LC.popIn(tl, [aChip.g], { duration: 0.4 }, "+=0.02");
      LC.popIn(tl, [aMark], { duration: 0.3 });
      tl.addLabel("s5");

      // s6: the cost, as tokens written before the answer
      var fy = compact ? y4 + rowH + 36 : y4 + rowH + 30;
      var bx = compact ? 104 : 200, unit = compact ? 8.5 : 12;
      var fHead = S("text", { x: dX, y: fy, class: "t t-sm t-muted", text: "tokens written before the answer" }, svg);
      var l1 = S("text", { x: dX, y: fy + 24, class: "t t-sm", text: "direct" }, svg);
      var l2 = S("text", { x: dX, y: fy + 48, class: "t t-sm", text: "step by step" }, svg);
      var b1 = S("rect", { x: bx, y: fy + 13, width: 0, height: 14, rx: 3, class: "f-blue" }, svg);
      var b2 = S("rect", { x: bx, y: fy + 37, width: 0, height: 14, rx: 3, class: "f-orange" }, svg);
      var v1 = S("text", { x: bx + 8, y: fy + 24, class: "t t-sm t-mono", text: "0" }, svg);
      var v2 = S("text", { x: bx + 20 * unit + 8, y: fy + 48, class: "t t-sm t-mono", text: "≈ 20" }, svg);
      LC.popIn(tl, [fHead, l1, l2], { duration: 0.3 }, "+=0.02");
      tl.to(b1, { attr: { width: 2 }, duration: 0.3 });
      tl.to(b2, { attr: { width: 20 * unit }, duration: 0.8, ease: "power1.out" }, "<");
      LC.popIn(tl, [v1, v2], { duration: 0.3 }, "-=0.2");
      tl.addLabel("s6");
      return tl;
    }
  };
})();
