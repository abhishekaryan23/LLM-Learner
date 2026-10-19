/* AR.6: filling a 7-token sentence, autoregressive vs masked diffusion, then the parallel-commit
   failure and the steps-vs-quality table.
   Illustrative confidences (not from a real model). Toy numbers in the last step are exact:
   4 two-token names, each one of 3 equally likely phrases (e.g. New York / San Francisco / Los Angeles),
   a perfect model, k tokens committed per pass (partners of already-committed tokens first, other ties random),
   each token sampled from its own marginal. Fraction of coherent names after 1, 2, 4, 8 passes (k = 8, 4, 2, 1):
   1/3, 5/7, 269/315, 1  ->  33%, 71%, 85%, 100%. */
(function () {
  var LC = window.LC;
  var WORDS = ["The", "cat", "sat", "on", "the", "mat", "."];
  // diffusion order: pass 1 commits positions 0, 4, 6; pass 2 positions 3, 5; pass 3 positions 1, 2
  var GROUPS = [[0, 4, 6], [3, 5], [1, 2]];
  var CONF = { 0: "97%", 4: "95%", 6: "99%", 3: "82%", 5: "74%", 1: "63%", 2: "58%" };
  var TOY = [[1, 8, 33], [2, 4, 71], [4, 2, 85], [8, 1, 100]]; // passes, tokens per pass, % coherent

  LC.anims["ar-6-fill"] = {
    title: "Autoregressive vs masked diffusion",
    steps: [
      "Both models must write a 7-token sentence. <strong>Autoregressive</strong> (blue) will fill it left to right, one token per forward pass. <strong>Masked diffusion</strong> (orange) starts with every position <strong>[M]</strong> (short for [MASK]) and uses a bidirectional transformer.",
      "<strong>Pass 1.</strong> The autoregressive model commits one token, “The”. The diffusion model predicts <em>every</em> masked position at once and commits the <strong>three most confident</strong>: “The”, “the” and “.” (confidences are illustrative).",
      "<strong>Pass 2.</strong> One more token for the autoregressive model. The diffusion model re-reads the sentence, now with three tokens filled in, and commits the next two most confident: “on” and “mat”.",
      "<strong>Pass 3.</strong> The diffusion model fills the last two blanks, “cat” and “sat”: <strong>3 passes</strong> for 7 tokens. The autoregressive model is only 3 tokens in.",
      "The autoregressive model needs <strong>7 passes</strong>, strictly in order, for the same 7 tokens. Fewer passes is the whole appeal. But each diffusion pass processes all 7 positions, not 1.",
      "<strong>The catch.</strong> Say a pass must fill two blanks of a city name: New York, San Francisco or Los Angeles, equally likely. The model gives each blank its own distribution and cannot see what the other blank is sampled as. Committing both can give “New Francisco”.",
      "<strong>Steps versus quality</strong> in a toy: 4 two-word names, each one of 3 phrases. One pass for all 8 tokens gives only 33% coherent names; more passes, fewer tokens committed per pass, and quality climbs to 100%."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 248 } : { w: 640, h: 232 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      var bw = compact ? 46 : 40, gap = 4, bh = 32;
      var xA = compact ? 7 : 6, xB = compact ? 7 : 330;
      var yA = compact ? 0 : 20, yB = compact ? 102 : 20; // vertical offset of the panels
      var W = ctx.w;

      var gA = S("g", {}, svg), gB = S("g", {}, svg), gF = S("g", {}, svg), gT = S("g", {}, svg);
      gF.style.opacity = 0; gT.style.opacity = 0;

      function box(g, x, y, i) {
        var bx = x + i * (bw + gap);
        S("rect", { x: bx, y: y, width: bw, height: bh, rx: 6, class: "f-faint", "fill-opacity": 0.3 }, g);
        return bx;
      }
      function swap(a, b, pos) { tl.to(a, { opacity: 0, duration: 0.25 }, pos); LC.popIn(tl, b, { duration: 0.35 }, pos + 0.1); }

      // ---- panel A: autoregressive
      S("text", { x: xA, y: yA + 18, class: "t t-sm t-blue", "font-weight": 650, text: compact ? "Autoregressive: 1 token per pass" : "Autoregressive: 1 token per pass" }, gA);
      var aFill = [], aTxt = [];
      for (var i = 0; i < 7; i++) {
        var bx = box(gA, xA, yA + 30, i);
        var r = S("rect", { x: bx, y: yA + 30, width: bw, height: bh, rx: 6, class: "f-blue" }, gA); r.style.opacity = 0;
        var t = S("text", { x: bx + bw / 2, y: yA + 30 + 21, class: "t t-sm t-mid t-nohalo", style: "fill:#fff", "font-weight": 650, text: WORDS[i] }, gA); t.style.opacity = 0;
        aFill.push(r); aTxt.push(t);
      }
      var cA = [];
      for (i = 0; i <= 7; i++) {
        var ct = S("text", { x: xA, y: compact ? yA + 86 : yB + 30 + bh + 40, class: "t t-sm t-muted", text: "passes so far: " + i }, gA);
        ct.style.opacity = i === 0 ? 1 : 0; cA.push(ct);
      }

      // ---- panel B: masked diffusion
      S("text", { x: xB, y: yB + 18, class: "t t-sm t-orange", "font-weight": 650, text: compact ? "Masked diffusion: 2 to 3 per pass" : "Masked diffusion: 2 to 3 tokens per pass" }, gB);
      var bFill = [], bTxt = [], bM = [], bConf = [];
      for (i = 0; i < 7; i++) {
        bx = box(gB, xB, yB + 30, i);
        var m = S("text", { x: bx + bw / 2, y: yB + 30 + 21, class: "t t-sm t-mid t-muted", text: "[M]" }, gB);
        var r2 = S("rect", { x: bx, y: yB + 30, width: bw, height: bh, rx: 6, class: "f-orange" }, gB); r2.style.opacity = 0;
        var t2 = S("text", { x: bx + bw / 2, y: yB + 30 + 21, class: "t t-sm t-mid t-nohalo", style: "fill:#fff", "font-weight": 650, text: WORDS[i] }, gB); t2.style.opacity = 0;
        var cf = S("text", { x: bx + bw / 2, y: yB + 30 + bh + 16, class: "t t-sm t-mid t-orange", text: CONF[i] }, gB); cf.style.opacity = 0;
        bFill.push(r2); bTxt.push(t2); bM.push(m); bConf.push(cf);
      }
      var cB = [];
      var bLabels = ["passes so far: 0", "passes so far: 1", "passes so far: 2", "passes so far: 3 (done)"];
      for (i = 0; i < 4; i++) {
        var cbt = S("text", { x: xB, y: yB + 30 + bh + 40, class: "t t-sm t-muted", text: bLabels[i] }, gB);
        cbt.style.opacity = i === 0 ? 1 : 0; cB.push(cbt);
      }
      if (compact) {
        // separator between the two panels
        S("line", { x1: 4, x2: W - 4, y1: yB - 8, y2: yB - 8, class: "s-grid" }, gA);
      }

      // ---- failure view (gF)
      var fx = compact ? 8 : 90, colW = compact ? 164 : 220, lblW = compact ? 44 : 70;
      S("text", { x: fx, y: 18, class: "t t-sm", "font-weight": 650, text: "One pass, two masked blanks" }, gF);
      var cols = [
        { x: fx, head: "blank 1", names: ["New", "San", "Los"] },
        { x: fx + colW + (compact ? 16 : 40), head: "blank 2", names: ["York", "Francisco", "Angeles"] }
      ];
      var lw = [compact ? 30 : 36, compact ? 62 : 72];
      cols.forEach(function (c, ci) {
        S("text", { x: c.x, y: 44, class: "t t-sm t-muted", text: c.head + " (model's guess)" }, gF);
        var labelW = lw[ci], barX = c.x + labelW + 6, barW = compact ? 56 : 90;
        c.names.forEach(function (nm, k) {
          var y = 58 + k * 26;
          S("text", { x: c.x, y: y + 12, class: "t t-sm", text: nm }, gF);
          S("rect", { x: barX, y: y, width: barW, height: 16, rx: 3, class: "f-orange" }, gF);
          S("text", { x: barX + barW + 6, y: y + 12, class: "t t-sm t-muted", text: "1/3" }, gF);
        });
      });
      var ry = compact ? 150 : 150;
      S("text", { x: fx, y: ry, class: "t t-sm t-muted", text: "both committed in the same pass:" }, gF);
      var wNew = 56, wFr = 84, boxY = ry + 10;
      S("rect", { x: fx, y: boxY, width: wNew, height: 32, rx: 6, class: "f-surface", stroke: "var(--bad)", "stroke-width": 2 }, gF);
      S("text", { x: fx + wNew / 2, y: boxY + 21, class: "t t-sm t-mid", "font-weight": 650, text: "New" }, gF);
      S("rect", { x: fx + wNew + 6, y: boxY, width: wFr, height: 32, rx: 6, class: "f-surface", stroke: "var(--bad)", "stroke-width": 2 }, gF);
      S("text", { x: fx + wNew + 6 + wFr / 2, y: boxY + 21, class: "t t-sm t-mid", "font-weight": 650, text: "Francisco" }, gF);
      S("text", { x: fx + wNew + wFr + 16, y: boxY + 21, class: "t t-sm", "font-weight": 650, style: "fill:var(--bad)", text: "incoherent" }, gF);
      S("text", { x: fx, y: boxY + 56, class: "t t-sm t-muted", text: compact ? "chance the two blanks agree: 3 of 9 = 1/3" : "chance the two blanks agree: 3 of 9 combinations = 1/3" }, gF);

      // ---- trade-off view (gT)
      var px0 = compact ? 44 : 90, px1 = compact ? W - 8 : W - 40, py0 = compact ? 66 : 62, py1 = compact ? 172 : 148;
      S("text", { x: compact ? 4 : 90, y: 18, class: "t t-sm", "font-weight": 650, text: compact ? "Toy: 4 names, 3 phrases each" : "Toy: 4 two-word names, each one of 3 phrases" }, gT);
      S("text", { x: compact ? 4 : 90, y: 38, class: "t t-sm t-muted", text: "coherent names (%)" }, gT);
      S("line", { x1: px0, x2: px1, y1: py1, y2: py1, class: "s-axis" }, gT);
      var slot = (px1 - px0) / 4, barWd = compact ? 40 : 70;
      TOY.forEach(function (d, k) {
        var cx = px0 + slot * k + slot / 2, h = (py1 - py0) * d[2] / 100;
        var rr = S("rect", { x: cx - barWd / 2, y: py1 - h, width: barWd, height: h, rx: 4, class: k === 3 ? "f-blue" : "f-orange" }, gT);
        S("text", { x: cx, y: py1 - h - 6, class: "t t-sm t-mid", "font-weight": 650, text: d[2] + "%" }, gT);
        S("text", { x: cx, y: py1 + 18, class: "t t-sm t-mid", "font-weight": 650, text: d[0] + (d[0] === 1 ? " pass" : " passes") }, gT);
        S("text", { x: cx, y: py1 + 36, class: "t t-sm t-mid t-muted", text: d[1] + "/pass" }, gT);
      });
      S("text", { x: (px0 + px1) / 2, y: py1 + (compact ? 58 : 58), class: "t t-sm t-muted t-mid", text: "forward passes (tokens committed per pass)" }, gT);

      // ---- timeline. Every step starts at an absolute time T (the previous label) so labels are exact.
      tl.addLabel("s0", 0);
      function commitA(k, pos) { tl.to([aFill[k], aTxt[k]], { opacity: 1, duration: 0.35 }, pos); }
      function commitB(group, pos) {
        group.forEach(function (p, n) {
          tl.to([bFill[p], bTxt[p], bConf[p]], { opacity: 1, duration: 0.35 }, pos + n * 0.12);
          tl.to(bM[p], { opacity: 0, duration: 0.25 }, pos + n * 0.12);
        });
      }
      function next(name, T) { var t = tl.duration() + 0.2; tl.addLabel(name, t); tl.to({}, { duration: 0.01 }, t); return t; }
      var T = 0.3;
      for (var g = 0; g < 3; g++) {
        commitA(g, T); commitB(GROUPS[g], T);
        swap(cA[g], cA[g + 1], T); swap(cB[g], cB[g + 1], T);
        T = next("s" + (g + 1), T);
      }
      for (i = 3; i < 7; i++) {
        commitA(i, T + (i - 3) * 0.3);
        swap(cA[i], cA[i + 1], T + (i - 3) * 0.3);
      }
      T = next("s4", T);
      tl.to([gA, gB], { opacity: 0, duration: 0.4 }, T);
      tl.to(gF, { opacity: 1, duration: 0.5 }, T + 0.2);
      T = next("s5", T);
      tl.to(gF, { opacity: 0, duration: 0.35 }, T);
      tl.to(gT, { opacity: 1, duration: 0.5 }, T + 0.2);
      next("s6", T);
      return tl;
    }
  };
})();
