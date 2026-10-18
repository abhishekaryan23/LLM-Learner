/* Capstone: the fine-tune -> evaluate -> optimize pipeline on an illustrative ticket-routing task.
   Eval set n = 200. Accuracies with 95% normal-approximation CIs:
     base 124/200 = 62% [55.3, 68.7]; LoRA 150/200 = 75% [69.0, 81.0]; LoRA + 4-bit 146/200 = 73% [66.8, 79.2].
   Paired differences (discordant pairs b, c): LoRA vs base b=34, c=8 -> +13 pp [+6.9, +19.1];
   4-bit vs LoRA b=6, c=10 -> -2 pp [-5.9, +1.9]. */
(function () {
  var LC = window.LC;
  var NODES = ["Task", "Eval set", "Baseline", "Fine-tune", "Evaluate", "Prefs?", "Quantize", "Decide"];
  var ROWS = [
    { name: "Base model, few-shot", acc: 62, lo: 55.3, hi: 68.7, note: "" },
    { name: "LoRA fine-tune", acc: 75, lo: 69.0, hi: 81.0, note: "+13 pp [+7, +19]" },
    { name: "LoRA + 4-bit", acc: 73, lo: 66.8, hi: 79.2, note: "−2 pp [−6, +2]" }
  ];

  LC.anims["cap-1-pipeline"] = {
    title: "The capstone pipeline, end to end",
    steps: [
      "Eight moves. Start <strong>narrow</strong>: one task with a checkable answer. Our running example: route support tickets to one of 8 teams.",
      "Build the <strong>eval set first</strong> (M4.7): 200 labelled tickets, held out and frozen before you train anything, so nothing can leak into training.",
      "<strong>Baseline</strong>: the base model with a few-shot prompt gets 62%, 95% CI [55%, 69%]. Every later number is compared with this one.",
      "<strong>Fine-tune</strong> with LoRA (M3.7) on 2,000 <em>different</em> tickets: plain SFT (M3.1). Keep a small validation split for choosing the checkpoint.",
      "<strong>Evaluate</strong> on the same 200 tickets: 75%. Both models answered the same questions, so use a <strong>paired</strong> comparison (M4.6): +13 points, CI [+7, +19]. A real gain.",
      "<strong>Preference tuning</strong> (DPO, M3.4) is optional. With exactly one right answer per ticket there's little to prefer, so this run skips it.",
      "<strong>Quantize</strong> to 4-bit (M5.1): roughly 3× smaller. 73%: −2 points, CI [−6, +2]. No significant drop, but a 6-point loss isn't ruled out.",
      "<strong>Decide</strong> and write it up: accuracy with CIs, size, latency and cost (M5.6). Ship if the worst case is acceptable; if not, get more eval data or keep 8-bit."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 474 } : { w: 640, h: 440 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      var T = 18, nh = 34, fs = compact ? " t-sm" : "";

      // ---- pipeline nodes: snake of 2 rows (compact) or 1 row (wide)
      var pos = [];
      if (compact) {
        var nw = 76, gap = 14, x0 = (W - (4 * nw + 3 * gap)) / 2;
        for (var i = 0; i < 8; i++) {
          var row = i < 4 ? 0 : 1, col = row ? 7 - i : i;
          pos.push({ x: x0 + col * (nw + gap), y: T + 4 + row * 66, w: nw });
        }
      } else {
        var nw2 = 68, gap2 = 10, x02 = (W - (8 * nw2 + 7 * gap2)) / 2;
        for (var j = 0; j < 8; j++) pos.push({ x: x02 + j * (nw2 + gap2), y: T + 4, w: nw2 });
      }
      function arrow(x0, y0, x1, y1) {
        var a = Math.atan2(y1 - y0, x1 - x0), h = 6;
        var d = "M" + x0 + " " + y0 + "L" + x1 + " " + y1 +
          "M" + (x1 - h * Math.cos(a - 0.5)) + " " + (y1 - h * Math.sin(a - 0.5)) + "L" + x1 + " " + y1 +
          "L" + (x1 - h * Math.cos(a + 0.5)) + " " + (y1 - h * Math.sin(a + 0.5));
        return S("path", { d: d, class: "s-faint", "stroke-width": 1.5 }, svg);
      }
      for (var k = 0; k < 7; k++) {
        var p = pos[k], q = pos[k + 1];
        if (q.y > p.y) arrow(p.x + p.w / 2, p.y + nh + 2, q.x + q.w / 2, q.y - 2);
        else if (q.x > p.x) arrow(p.x + p.w + 1, p.y + nh / 2, q.x - 1, q.y + nh / 2);
        else arrow(p.x - 1, p.y + nh / 2, q.x + q.w + 1, q.y + nh / 2);
      }
      var act = [], done = [];
      NODES.forEach(function (n, i) {
        var p = pos[i];
        var r = S("rect", { x: p.x, y: p.y, width: p.w, height: nh, rx: 9, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, svg);
        if (i === 5) r.setAttribute("stroke-dasharray", "4 3");
        var dn = S("rect", { x: p.x, y: p.y, width: p.w, height: nh, rx: 9, class: "f-none", stroke: "var(--a-blue)", "stroke-width": 2 }, svg);
        var ac = S("rect", { x: p.x - 2, y: p.y - 2, width: p.w + 4, height: nh + 4, rx: 10, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 3 }, svg);
        dn.style.opacity = 0; ac.style.opacity = 0;
        S("text", { x: p.x + p.w / 2, y: p.y + 22, class: "t t-sm t-mid", text: n, "font-weight": 600 }, svg);
        act.push(ac); done.push(dn);
      });
      act[0].style.opacity = 1;
      function advance(i) { // make node i active, node i-1 done
        tl.to(act[i - 1], { opacity: 0, duration: 0.2 }, "+=0.02");
        tl.to(done[i - 1], { opacity: 1, duration: 0.2 }, "<");
        tl.to(act[i], { opacity: 1, duration: 0.3 }, "<");
      }

      // ---- panel geometry
      var L = compact ? 16 : 24, R = W - (compact ? 16 : 24);
      var y0 = compact ? T + 4 + 66 + nh + 34 : T + 4 + nh + 40;
      var info1Y = y0, info2Y = y0 + 22;
      var titleY = y0 + (compact ? 54 : 58), rowY = titleY + (compact ? 26 : 30), rowStep = compact ? 48 : 50;
      var axY = rowY + 2 * rowStep + 32;
      var notesY = axY + (compact ? 42 : 46), noteStep = 22;
      function ax(v) { return L + 4 + (v - 50) / 40 * (R - L - 8); }
      tl.addLabel("s0", 0);

      // s1: eval set
      advance(1);
      var info1 = S("text", { x: L, y: info1Y, class: "t" + fs, text: "Eval: 200 held-out tickets, frozen first" }, svg);
      LC.popIn(tl, info1, { duration: 0.4 });
      tl.addLabel("s1");

      // s2: chart frame + baseline row
      advance(2);
      var title = S("text", { x: L, y: titleY, class: "t t-sm t-muted", text: "accuracy on the eval set · dot = estimate, bar = 95% CI" }, svg);
      if (compact) title.textContent = "accuracy on eval set (bar = 95% CI)";
      var axis = S("path", { d: "M" + ax(50) + " " + axY + "H" + ax(90), class: "s-axis" }, svg);
      var ticks = [];
      [50, 60, 70, 80, 90].forEach(function (v) {
        ticks.push(S("path", { d: "M" + ax(v) + " " + axY + "v5", class: "s-axis" }, svg));
        ticks.push(S("text", { x: ax(v), y: axY + 20, class: "t t-sm t-muted t-mid", text: v + "%" }, svg));
      });
      function chartRow(i) {
        var r = ROWS[i], ly = rowY + i * rowStep, wy = ly + 15;
        var lbl = S("text", { x: L, y: ly, class: "t" + fs, text: r.name + " · " + r.acc + "%" + (r.note ? " · " + r.note : ""), "font-weight": i === 0 ? 400 : 600 }, svg);
        var wh = S("path", { d: "M" + ax(r.lo) + " " + (wy - 5) + "V" + (wy + 5) + "M" + ax(r.lo) + " " + wy + "H" + ax(r.hi) + "M" + ax(r.hi) + " " + (wy - 5) + "V" + (wy + 5), class: i ? "s-orange" : "s-blue", "stroke-width": 2.5 }, svg);
        var dot = S("circle", { cx: ax(r.acc), cy: wy, r: 6, class: i ? "f-orange" : "f-blue" }, svg);
        LC.popIn(tl, lbl, { duration: 0.3 });
        LC.drawIn(tl, wh, { duration: 0.5 });
        LC.popIn(tl, dot, { duration: 0.25 });
      }
      LC.popIn(tl, [title, axis].concat(ticks), { duration: 0.4 });
      chartRow(0);
      tl.addLabel("s2");

      // s3: fine-tune
      advance(3);
      var info2 = S("text", { x: L, y: info2Y, class: "t" + fs, text: "Train: 2,000 other tickets → LoRA, r = 16" }, svg);
      LC.popIn(tl, info2, { duration: 0.4 });
      tl.addLabel("s3");

      // s4: evaluate
      advance(4);
      chartRow(1);
      tl.addLabel("s4");

      // s5: optional preference tuning
      advance(5);
      var n5 = S("text", { x: L, y: notesY, class: "t t-muted" + fs, text: "Prefs: skipped (one right answer per ticket)" }, svg);
      LC.popIn(tl, n5, { duration: 0.4 });
      tl.addLabel("s5");

      // s6: quantize
      advance(6);
      chartRow(2);
      var n6 = S("text", { x: L, y: notesY + noteStep, class: "t" + fs, text: "Size: 3.0 GB (bf16) → about 1 GB (4-bit)" }, svg);
      LC.popIn(tl, n6, { duration: 0.4 });
      tl.addLabel("s6");

      // s7: decide
      advance(7);
      var n7 = S("text", { x: L, y: notesY + 2 * noteStep, class: "t t-orange" + fs, text: "Report: accuracy ± CI · size · latency · cost", "font-weight": 650 }, svg);
      LC.popIn(tl, n7, { duration: 0.4 });
      tl.addLabel("s7");
      return tl;
    }
  };
})();
