/* M5.2: knowledge distillation with temperature on one next-token prediction.
   Teacher logits [5, 3, 1.5, 1, -2] for cat, kitten, lion, dog, car.
   softmax(z/1) = [0.844 0.114 0.025 0.015 0.001]; softmax(z/4) = [0.390 0.236 0.163 0.143 0.068].
   Student (T = 4) before: [0.24 0.12 0.14 0.30 0.20], KL(teacher||student) = 0.19 nats;
   after: [0.383 0.223 0.170 0.149 0.074], KL = 0.001. (Checked in Python.) */
(function () {
  var LC = window.LC;
  var CLS = ["cat", "kitten", "lion", "dog", "car"];
  var T1 = [0.844, 0.114, 0.025, 0.015, 0.001];
  var T4 = [0.390, 0.236, 0.163, 0.143, 0.068];
  var S0 = [0.24, 0.12, 0.14, 0.30, 0.20];
  var S1 = [0.383, 0.223, 0.170, 0.149, 0.074];

  LC.anims["m5-2-distill"] = {
    title: "Distillation: learning from soft targets",
    steps: [
      "A big <strong>teacher</strong> model predicts the next word after “The pet that purrs is a …”. At normal temperature ($T = 1$) almost all the probability sits on <strong>cat</strong> (0.84).",
      "A <strong>hard label</strong> says only “cat = 1, everything else 0”. All the teacher knows about the <em>other</em> words is thrown away.",
      "Divide the teacher's logits by a <strong>temperature</strong> $T = 4$ before the softmax. The distribution softens and shows the teacher's <strong>dark knowledge</strong>: kitten is far more plausible than lion or dog, and car is nonsense.",
      "The <strong>student</strong>, a smaller model, predicts at the same temperature. Early in training it's off: it likes dog and car far too much.",
      "The distillation loss is the <strong>KL divergence</strong> from teacher to student, $\\mathrm{KL}(p_T \\,\\|\\, p_S) \\approx 0.19$ nats here. Its gradient pulls every student bar toward the teacher's (arrows).",
      "After training, the student's bars match the teacher's (KL ≈ 0.001). It learned how the teacher <strong>ranks every option</strong>, not just the top one. That's why soft targets carry more signal per example than hard labels."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 318 } : { w: 640, h: 318 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var mL = compact ? 36 : 60, mR = compact ? 10 : 40, top = 64, base = 236;
      var pw = W - mL - mR, gw = pw / CLS.length, bw = compact ? 17 : 26, gap = compact ? 3 : 5;
      function y(p) { return base - p * (base - top); }
      function cx(i) { return mL + gw * (i + 0.5); }
      var tl = gsap.timeline();

      // axes
      [0.5, 1].forEach(function (v) { S("line", { x1: mL, x2: W - mR, y1: y(v), y2: y(v), class: "s-grid" }, svg); });
      S("line", { x1: mL, x2: W - mR, y1: base, y2: base, class: "s-axis" }, svg);
      [0, 0.5, 1].forEach(function (v) { S("text", { x: mL - 6, y: y(v) + 4, class: "t t-sm t-muted t-end", text: v === 1 ? "1.0" : String(v) }, svg); });
      CLS.forEach(function (c, i) { S("text", { x: cx(i), y: base + 20, class: "t t-sm t-mid", text: c, "font-weight": i === 0 ? 650 : 400 }, svg); });
      if (!compact) S("text", { x: 8, y: 40, class: "t t-sm t-muted", text: "probability" }, svg);

      function row(txt, cls) { return S("text", { x: compact ? 4 : 8, y: 18, class: "t t-sm " + (cls || ""), text: txt }, svg); }
      function info(txt, yy, cls) { return S("text", { x: compact ? 4 : 8, y: yy, class: "t t-sm " + (cls || ""), text: txt }, svg); }
      function swap(a, b) { tl.to(a, { opacity: 0, duration: 0.25 }); LC.popIn(tl, b, { duration: 0.35 }, "<0.1"); }

      var tx = function (i) { return cx(i) - gap / 2 - bw; }, sxp = function (i) { return cx(i) + gap / 2; };
      var tBars = T1.map(function (p, i) { var h = Math.max(1.5, base - y(p)); return S("rect", { x: tx(i), y: base - h, width: bw, height: h, rx: 2, class: "f-blue" }, svg); });
      var r0 = row("teacher's next-word probabilities · T = 1");
      tl.addLabel("s0", 0);

      // s1: hard label
      var hard = S("rect", { x: tx(0) - 3, y: y(1), width: bw + 6, height: base - y(1), rx: 3, class: "f-none", stroke: "var(--a-ink)", "stroke-width": 1.5, "stroke-dasharray": "4 3" }, svg);
      var i1 = info("hard label: cat = 1, everything else = 0", base + 48);
      LC.popIn(tl, [hard, i1], { duration: 0.4 });
      tl.addLabel("s1");

      // s2: temperature 4
      var r2 = row("teacher · T = 4 (softened)");
      swap(r0, r2);
      tl.to([hard, i1], { opacity: 0, duration: 0.3 }, "<");
      T4.forEach(function (p, i) { var h = base - y(p); tl.to(tBars[i], { attr: { y: base - h, height: h }, duration: 0.9, ease: "power2.inOut" }, i ? "<" : ">"); });
      var i2 = info("kitten > lion > dog ≫ car: that ranking is the signal", base + 48, "t-blue");
      LC.popIn(tl, i2, { duration: 0.35 });
      tl.addLabel("s2");

      // s3: student bars + legend
      var sBars = S0.map(function (p, i) { var h = base - y(p); return S("rect", { x: sxp(i), y: base - h, width: bw, height: h, rx: 2, class: "f-orange" }, svg); });
      var lx = compact ? 40 : 110;
      var leg = [S("rect", { x: lx, y: 31, width: 11, height: 11, rx: 2, class: "f-blue" }, svg),
                 S("text", { x: lx + 16, y: 41, class: "t t-sm", text: "teacher" }, svg),
                 S("rect", { x: lx + 76, y: 31, width: 11, height: 11, rx: 2, class: "f-orange" }, svg),
                 S("text", { x: lx + 92, y: 41, class: "t t-sm", text: "student" }, svg)];
      var r3 = row("both at T = 4");
      swap(r2, r3);
      tl.to(i2, { opacity: 0, duration: 0.25 }, "<");
      LC.popIn(tl, leg, { duration: 0.3 });
      sBars.forEach(function (b, i) { var h = +b.getAttribute("height"); b.setAttribute("height", 0); b.setAttribute("y", base); tl.to(b, { attr: { y: base - h, height: h }, duration: 0.6, ease: "power2.out" }, i ? "<0.06" : ">"); });
      tl.addLabel("s3");

      // s4: gaps + KL
      var gaps = S0.map(function (p, i) {
        var xg = sxp(i) + bw / 2;
        return S("path", { d: "M" + xg + " " + y(p) + "V" + y(T4[i]), class: "s-ink", "stroke-width": 2 }, svg);
      });
      var heads = S0.map(function (p, i) {
        var xg = sxp(i) + bw / 2, ye = y(T4[i]), dir = T4[i] > p ? 1 : -1;
        return S("path", { d: "M" + (xg - 4) + " " + (ye + 5 * dir) + "L" + xg + " " + ye + "L" + (xg + 4) + " " + (ye + 5 * dir), class: "s-ink", "stroke-width": 2 }, svg);
      });
      var i4 = info("KL(teacher ‖ student) = 0.19 nats", base + 48, "t-orange");
      gaps.forEach(function (g, i) { LC.drawIn(tl, g, { duration: 0.4 }, i ? "<0.05" : "+=0.02"); });
      LC.popIn(tl, heads.concat([i4]), { duration: 0.3 });
      tl.addLabel("s4");

      // s5: student matches
      tl.to(gaps.concat(heads), { opacity: 0, duration: 0.3 });
      S1.forEach(function (p, i) { var h = base - y(p); tl.to(sBars[i], { attr: { y: base - h, height: h }, duration: 0.9, ease: "power2.inOut" }, i ? "<" : ">"); });
      var i5 = info("after training: KL ≈ 0.001", base + 48, "t-orange");
      swap(i4, i5);
      var r5 = row("student ≈ teacher");
      tl.to(r3, { opacity: 0, duration: 0.25 }, "<");
      LC.popIn(tl, r5, { duration: 0.3 }, "<0.1");
      tl.addLabel("s5");
      return tl;
    }
  };
})();
