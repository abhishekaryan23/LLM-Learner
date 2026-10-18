/* AR.1: DeepSeekMoE-style expert design, then bias-based balancing (DeepSeek-V3).
   8 experts top-2 (C(8,2) = 28 combinations) -> split into 32 quarter-size experts,
   top-8 (same compute, C(32,8) = 10,518,300) -> 1 shared + 7 routed.
   Then loads of 128 assignments over 8 experts (mean 16): [30,9,24,6,19,8,22,10]
   -> bias nudges -> [17,15,16,16,17,15,16,16]. */
(function () {
  var LC = window.LC;
  var LIT8 = [2, 5], LIT32 = [1, 6, 9, 14, 18, 22, 27, 30];
  var LOAD0 = [30, 9, 24, 6, 19, 8, 22, 10], LOAD1 = [17, 15, 16, 16, 17, 15, 16, 16], MEAN = 16;

  LC.anims["ar-1-fine"] = {
    title: "Fine-grained, shared and bias-balanced experts",
    steps: [
      "A classic MoE layer: <strong>8 experts</strong>, each token uses the <strong>top 2</strong>. There are only $\\binom{8}{2} = 28$ possible pairs, so each expert must cover a broad mix of patterns.",
      "<strong>Fine-grained experts:</strong> split each expert into 4 quarter-size experts (32 in all) and activate 8. A quarter-size expert costs a quarter of the compute, so 8 of them cost the same as 2 big ones.",
      "Same compute, vastly more choices: $\\binom{32}{8} = 10{,}518{,}300$ combinations instead of 28. (DeepSeekMoE's example: 2 of 16 gives 120, 8 of 64 gives about 4.4 billion.)",
      "A <strong>shared expert</strong> processes every token and holds common knowledge. To keep compute fixed, one fewer routed expert is activated: 1 shared + 7 routed.",
      "Now balancing. 128 assignments over 8 experts should average 16 (dashed). Some experts are overloaded (orange). DeepSeek-V3 ranks experts by $s_i + b_i$ and, after each step, lowers $b_i$ by $\\gamma$ for overloaded experts and raises it for underloaded ones.",
      "After many small nudges the loads hover near 16. The bias only changed <strong>which</strong> experts win the top-k; the gate values still come from the raw scores $s_i$. No auxiliary loss gradient was needed."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 312 } : { w: 640, h: 312 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var m = compact ? 12 : 40, mid = W / 2;
      var tl = gsap.timeline();
      var rowY = 112, rowH = 44;
      function readout(t) { var n = S("text", { x: compact ? 4 : 8, y: 18, class: "t t-sm", text: t }, svg); return n; }
      function swapR(a, b, pos) { tl.to(a, { opacity: 0, duration: 0.25 }, pos); LC.popIn(tl, b, { duration: 0.35 }, "<0.1"); }

      // s0: 8 experts
      var big = S("g", {}, svg), bigLit = [];
      var pitch8 = (W - 2 * m) / 8, bw8 = pitch8 - (compact ? 6 : 10);
      for (var i = 0; i < 8; i++) {
        var x = m + pitch8 * i + (pitch8 - bw8) / 2;
        S("rect", { x: x, y: rowY, width: bw8, height: rowH, rx: 7, class: "f-surface", stroke: "var(--a-blue)", "stroke-width": 1.5 }, big);
        var lit = LIT8.indexOf(i) >= 0;
        if (lit) bigLit.push(S("rect", { x: x, y: rowY, width: bw8, height: rowH, rx: 7, class: "f-orange" }, big));
        S("text", { x: x + bw8 / 2, y: rowY + 27, class: "t t-sm t-mid t-nohalo", text: "E" + (i + 1), style: lit ? "fill:#fff" : "" }, big);
      }
      var cap8 = S("text", { x: mid, y: rowY + rowH + 24, class: "t t-sm t-mid t-muted", text: "8 experts · 2 active" }, svg);
      var r0 = readout("classic: top-2 of 8 experts");
      tl.addLabel("s0", 0);

      // s1: 32 small experts
      var small = S("g", {}, svg), smallBox = [], smallLit = {};
      var pitch32 = (W - 2 * m) / 32, bw32 = pitch32 - (compact ? 2 : 3);
      for (i = 0; i < 32; i++) {
        var xs = m + pitch32 * i + (pitch32 - bw32) / 2;
        var on = LIT32.indexOf(i) >= 0;
        smallBox.push(S("rect", { x: xs, y: rowY, width: bw32, height: rowH, rx: 3, class: on ? "f-orange" : "f-surface", stroke: on ? "none" : "var(--a-blue)", "stroke-width": 1 }, small));
        if (on) smallLit[i] = smallBox[i];
      }
      small.style.opacity = 0;
      var cap32 = S("text", { x: mid, y: rowY + rowH + 24, class: "t t-sm t-mid t-muted", text: "32 quarter-size experts · 8 active" }, svg);
      cap32.style.opacity = 0;
      var r1 = readout("fine-grained: top-8 of 32 small experts");
      tl.to([big, cap8], { opacity: 0, duration: 0.4 });
      swapR(r0, r1, "<");
      tl.to([small, cap32], { opacity: 1, duration: 0.5 }, "-=0.1");
      tl.addLabel("s1");

      // s2: combinations
      var combY = rowY + rowH + 62;
      var c1 = S("text", { x: compact ? m : mid - 150, y: combY, class: "t t-mono", text: "C(8,2)  = 28" }, svg);
      var c2 = S("text", { x: compact ? m : mid - 150, y: combY + 26, class: "t t-mono t-orange", "font-weight": 650, text: "C(32,8) = 10,518,300" }, svg);
      var r2 = readout("same compute, more combinations");
      swapR(r1, r2);
      LC.popIn(tl, [c1], { duration: 0.35 });
      LC.popIn(tl, [c2], { duration: 0.45 });
      tl.addLabel("s2");

      // s3: shared expert
      var sh = S("g", {}, svg);
      var shW = compact ? 132 : 170;
      S("rect", { x: mid - shW / 2, y: 40, width: shW, height: 36, rx: 8, class: "f-blue" }, sh);
      S("text", { x: mid, y: 63, class: "t t-sm t-mid t-nohalo", style: "fill:#fff", "font-weight": 650, text: "shared expert" }, sh);
      var shLine = S("path", { d: "M" + mid + " 76V" + (rowY - 4), class: "s-ink", "stroke-dasharray": "4 4" }, svg);
      var r3 = readout("1 shared + 7 routed");
      swapR(r2, r3);
      tl.to([c1, c2], { opacity: 0, duration: 0.3 }, "<");
      LC.popIn(tl, [sh], { duration: 0.4 });
      LC.drawIn(tl, shLine, { duration: 0.3 });
      tl.to(smallLit[30], { attr: { class: "f-surface" }, duration: 0.01 }, "+=0.1");
      tl.set(smallLit[30], { attr: { stroke: "var(--a-blue)" } }, "<");
      tl.to(cap32, { opacity: 0, duration: 0.2 }, "<");
      var cap3 = S("text", { x: mid, y: rowY + rowH + 24, class: "t t-sm t-mid t-muted", text: "every token: shared + 7 of 32" }, svg);
      LC.popIn(tl, [cap3], { duration: 0.3 });
      tl.addLabel("s3");

      // s4: loads + bias nudges
      var bars = S("g", {}, svg);
      bars.style.opacity = 0;
      var base = 222, top = 44, unit = (base - top) / 32;
      var pitch = (W - 2 * m) / 8, bw = compact ? 26 : 40;
      function cx(j) { return m + pitch * (j + 0.5); }
      var rects = LOAD0.map(function (n, j) {
        return S("rect", { x: cx(j) - bw / 2, y: base - n * unit, width: bw, height: n * unit, rx: 3, class: n > MEAN ? "f-orange" : "f-blue" }, bars);
      });
      LOAD0.forEach(function (n, j) { S("text", { x: cx(j), y: base + 18, class: "t t-sm t-mid", text: "E" + (j + 1) }, bars); });
      S("line", { x1: m, x2: W - m, y1: base, y2: base, class: "s-axis" }, bars);
      S("line", { x1: m - 4, x2: W - m + 4, y1: base - MEAN * unit, y2: base - MEAN * unit, class: "s-ink", "stroke-width": 1.5, "stroke-dasharray": "5 4" }, bars);
      var biasT = LOAD0.map(function (n, j) {
        var t = S("text", { x: cx(j), y: base + 58, class: "t t-sm t-mono t-mid " + (n > MEAN ? "t-orange" : "t-blue"), text: n > MEAN ? "b−γ" : "b+γ" }, svg);
        t.style.opacity = 0; return t;
      });
      var loadT = LOAD0.map(function (n, j) {
        var t = S("text", { x: cx(j), y: base + 37, class: "t t-sm t-mono t-mid t-muted", text: String(n) }, svg);
        t.style.opacity = 0; return t;
      });
      var r4 = readout("rank by s + b; nudge b by ±γ each step");
      swapR(r3, r4);
      tl.to([small, sh, shLine, cap3], { opacity: 0, duration: 0.4 }, "<");
      tl.to(bars, { opacity: 1, duration: 0.4 });
      LC.popIn(tl, loadT, { duration: 0.3, stagger: 0.04 });
      LC.popIn(tl, biasT, { duration: 0.3, stagger: 0.05 });
      tl.addLabel("s4");

      // s5: balanced
      var loadT1 = LOAD1.map(function (n, j) {
        var t = S("text", { x: cx(j), y: base + 37, class: "t t-sm t-mono t-mid t-muted", text: String(n) }, svg);
        t.style.opacity = 0; return t;
      });
      var r5 = readout("balanced; gates still use s");
      swapR(r4, r5);
      tl.to(biasT.concat(loadT), { opacity: 0, duration: 0.3 }, "<");
      LOAD1.forEach(function (n, j) {
        tl.to(rects[j], { attr: { y: base - n * unit, height: n * unit }, duration: 0.8, ease: "power2.inOut" }, j ? "<" : undefined);
      });
      LOAD1.forEach(function (n, j) { tl.set(rects[j], { attr: { class: "f-blue" } }, j ? "<" : ">"); });
      LC.popIn(tl, loadT1, { duration: 0.3, stagger: 0.03 });
      tl.addLabel("s5");
      return tl;
    }
  };
})();
