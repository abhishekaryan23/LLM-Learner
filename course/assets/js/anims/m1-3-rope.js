/* M1.3: why attention needs positions, sinusoidal encodings, and RoPE.
   RoPE numbers: theta = 30° per position, q starts at 20°, k at 0°, unit length.
   q at m = 2 → 80°, k at n = 5 → 150°: angle between 70°, q·k = cos 70° ≈ 0.34.
   Shift both by +3 (m = 5, n = 8): 170° and 240°, still 70° apart, same score.
   Sinusoids use ω_i = 10000^(-2i/d) with d = 16, i = 0, 1, 2 → 1, 0.316, 0.1. */
(function () {
  var LC = window.LC;
  var DEG = Math.PI / 180, TH = 30, Q0 = 20, K0 = 0;

  LC.anims["m1-3-rope"] = {
    title: "Giving attention a sense of order",
    steps: [
      "Attention only compares vectors. Nothing in $q\\cdot k$ says <em>where</em> a token sits, so “dog bites man” and “man bites dog” give <strong>dog</strong> the <strong>same</strong> output vector.",
      "Fix 1: <strong>add a position vector</strong> $p_{\\text{pos}}$ to each token's embedding before the first layer. Now dog-in-slot-0 and dog-in-slot-2 are different inputs, and their outputs differ.",
      "<strong>Sinusoidal</strong> positions (Vaswani et al., 2017): each pair of dimensions is a sine/cosine wave with its own frequency. Reading the waves at one position gives that position's vector, like the hands of many clocks.",
      "<strong>RoPE</strong> (Su et al., 2021) instead <strong>rotates</strong> the query. Each pair of dimensions is a 2-D arrow; at position $m$ it turns by $m\\,\\theta$. Here $\\theta = 30°$, so at $m = 2$ the query turns 60°.",
      "The key at position $n = 5$ turns by $5\\theta = 150°$. Their dot product depends on the angle between them: 70°, so $q\\cdot k = \\cos 70° \\approx 0.34$.",
      "Shift both tokens 3 places later. Both arrows turn a further 90°, the angle between them is <strong>still 70°</strong>, and the score is unchanged. Only the <strong>relative distance</strong> $n - m$ matters.",
      "Real RoPE uses many pairs, each with its own speed $\\theta_i = 10000^{-2i/d_k}$. At the same distance (5 tokens) fast pairs have spun far around and slow ones have barely moved: <strong>fast pairs sense nearby order, slow pairs long-range distance</strong>."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 380 } : { w: 640, h: 360 }; },
    build: function (svg, ctx) {
      var S = LC.svg, Wd = ctx.w, H = ctx.h, compact = ctx.layout === "compact";
      var tl = gsap.timeline();

      // ---------- scene A: dog bites man ----------
      var A = S("g", {}, svg);
      var boxW = compact ? 62 : 90, gap = compact ? 8 : 14, ax0 = compact ? 10 : 70;
      var cell = compact ? 16 : 20, cg = compact ? 4 : 5;
      var rows = [["dog", "bites", "man"], ["man", "bites", "dog"]];
      var rowY = compact ? [56, 168] : [52, 160], tokH = 34;
      var outX = ax0 + 3 * boxW + 2 * gap + (compact ? 36 : 70);
      var outA = [0.9, 0.35, 0.7, 0.5], outB = [0.45, 0.85, 0.3, 0.75];
      var outCellsB = [], posLbls = [];
      function cellsAt(parent, x, y, vec, cls) {
        return vec.map(function (v, d) { return S("rect", { x: x + d * (cell + cg), y: y, width: cell, height: cell, rx: 3, class: cls, "fill-opacity": (0.25 + 0.75 * v).toFixed(2) }, parent); });
      }
      rows.forEach(function (r, ri) {
        var y = rowY[ri];
        r.forEach(function (t, i) {
          var x = ax0 + i * (boxW + gap);
          S("rect", { x: x, y: y, width: boxW, height: tokH, rx: 8, class: "f-surface", stroke: t === "dog" ? "var(--a-orange)" : "var(--line)", "stroke-width": t === "dog" ? 2.5 : 1.5 }, A);
          S("text", { x: x + boxW / 2, y: y + 22, class: "t t-mid" + (compact ? " t-sm" : ""), text: t, "font-weight": t === "dog" ? 650 : 450 }, A);
          posLbls.push(S("text", { x: x + boxW / 2, y: y + tokH + 18, class: "t t-sm t-mid t-blue", text: "+ p" + i }, A));
        });
        var ay = y + tokH / 2;
        S("path", { d: "M" + (outX - (compact ? 28 : 54)) + " " + ay + "H" + (outX - 8) + "m-6 -5l6 5l-6 5", class: "s-ink", "stroke-width": 1.6 }, A);
        S("text", { x: outX + (4 * cell + 3 * cg) / 2, y: y - 8, class: "t t-sm t-mid t-muted", text: compact ? "dog's output" : "output for “dog”" }, A);
        var cs = cellsAt(A, outX, ay - cell / 2, outA, "f-orange");
        if (ri === 1) outCellsB = cs;
      });
      var sameTxt = S("text", { x: Wd / 2, y: rowY[1] + tokH + 52, class: "t t-mid t-orange", text: compact ? "identical: order is invisible" : "identical outputs: word order is invisible", "font-weight": 600 }, A);
      var diffTxt = S("text", { x: Wd / 2, y: rowY[1] + tokH + 52, class: "t t-mid t-blue", text: compact ? "with positions: outputs differ" : "with positions added, the outputs differ", "font-weight": 600 }, A);
      posLbls.forEach(function (p) { p.style.opacity = 0; });
      diffTxt.style.opacity = 0;
      tl.addLabel("s0", 0);
      tl.to(sameTxt, { opacity: 0, duration: 0.3 }, "+=0.05");
      tl.to(posLbls, { opacity: 1, duration: 0.3, stagger: 0.05 });
      outCellsB.forEach(function (c, d) { tl.to(c, { attr: { "fill-opacity": (0.25 + 0.75 * outB[d]).toFixed(2) }, duration: 0.5 }, d ? "<" : undefined); });
      tl.to(diffTxt, { opacity: 1, duration: 0.3 });
      tl.addLabel("s1");

      // ---------- scene B: sinusoids ----------
      var B = S("g", {}, svg); B.style.opacity = 0;
      var px0 = compact ? 56 : 110, px1 = compact ? 290 : 500, P = 10;
      function sxp(p) { return px0 + (p / P) * (px1 - px0); }
      var OM = [1, 0.316, 0.1], NM = ["ω = 1", "ω = 0.32", "ω = 0.1"];
      var amp = compact ? 26 : 26, mids = compact ? [118, 198, 278] : [110, 186, 262];
      var hp = 5, hx = sxp(hp);
      S("text", { x: 4, y: 24, class: "t t-sm t-muted", text: compact ? "PE = sin(pos · ω), 3 of d/2 waves" : "PE(pos, 2i) = sin(pos · ωᵢ), with ωᵢ = 10000^(−2i/d): three of the d/2 frequencies" }, B);
      S("rect", { x: hx - 11, y: mids[0] - amp - 18, width: 22, height: mids[2] - mids[0] + 2 * amp + 30, rx: 6, class: "f-surface2" }, B);
      S("text", { x: hx, y: mids[0] - amp - 26, class: "t t-sm t-mid", text: "pos 5", "font-weight": 600 }, B);
      var waves = [], vals = [];
      OM.forEach(function (w, k) {
        var mid = mids[k];
        S("line", { x1: px0, x2: px1, y1: mid, y2: mid, class: "s-grid" }, B);
        S("text", { x: 4, y: mid + 4, class: "t t-sm t-muted", text: compact ? NM[k].replace("ω = ", "ω ") : NM[k] }, B);
        var path = S("path", { d: LC.fnPath(function (p) { return Math.sin(p * w); }, 0, P, sxp, function (v) { return mid - amp * v; }, 120), class: k === 0 ? "s-orange" : "s-blue", "stroke-width": 2.5 }, B);
        waves.push(path);
        for (var p = 0; p <= P; p++) S("circle", { cx: sxp(p), cy: mid - amp * Math.sin(p * w), r: p === hp ? 4.5 : 2.5, class: p === hp ? "f-ink" : "f-faint" }, B);
        var v = Math.sin(hp * w);
        vals.push(S("text", { x: Wd - 6, y: mid + 4, class: "t t-sm t-mono t-end", text: (v < 0 ? "−" : "") + Math.abs(v).toFixed(2) }, B));
      });
      var axisLbl = S("text", { x: (px0 + px1) / 2, y: mids[2] + amp + 30, class: "t t-sm t-muted t-mid", text: "position 0 → 10" }, B);
      var colLbl = S("text", { x: Wd - 6, y: mids[0] - amp - 26, class: "t t-sm t-muted t-end", text: "p₅" }, B);
      tl.to(A, { opacity: 0, duration: 0.4 });
      tl.set(B, { opacity: 1 });
      waves.forEach(function (w, k) { LC.drawIn(tl, w, { duration: 0.7 }, k ? "<0.15" : "+=0.01"); });
      LC.popIn(tl, vals.concat([colLbl]), { duration: 0.3, stagger: 0.08 });
      tl.addLabel("s2");

      // ---------- scene C: RoPE rotation ----------
      var C = S("g", {}, svg); C.style.opacity = 0;
      var ccx = compact ? 180 : 200, ccy = compact ? 186 : 186, R = compact ? 100 : 118;
      S("text", { x: 4, y: 24, class: "t t-sm t-muted", text: compact ? "one pair of q/k dimensions" : "one pair of dimensions of q and k, drawn as 2-D arrows" }, C);
      S("circle", { cx: ccx, cy: ccy, r: R, class: "s-grid" }, C);
      S("line", { x1: ccx - R - 6, x2: ccx + R + 6, y1: ccy, y2: ccy, class: "s-grid" }, C);
      S("line", { x1: ccx, x2: ccx, y1: ccy - R - 6, y2: ccy + R + 6, class: "s-grid" }, C);
      var st = { q: Q0, k: K0, m: 0, n: 0 };
      var ghost = S("path", { d: "", class: "s-faint", "stroke-width": 2, "stroke-dasharray": "4 4" }, C);
      var arc = S("path", { d: "", class: "s-ink", "stroke-width": 1.5 }, C);
      var qLine = S("path", { d: "", class: "s-orange", "stroke-width": 3.5 }, C);
      var kLine = S("path", { d: "", class: "s-blue", "stroke-width": 3.5 }, C);
      var qLbl = S("text", { class: "t t-sm t-orange t-mid", text: "" }, C);
      var kLbl = S("text", { class: "t t-sm t-blue t-mid", text: "" }, C);
      var angLbl = S("text", { class: "t t-sm t-mid", text: "" }, C);
      function pt(a, r) { return [ccx + r * Math.cos(a * DEG), ccy - r * Math.sin(a * DEG)]; }
      function arrowD(a) {
        var tip = pt(a, R), b1 = pt(a - 5, R - 14), b2 = pt(a + 5, R - 14);
        return "M" + ccx + " " + ccy + "L" + tip[0].toFixed(1) + " " + tip[1].toFixed(1) + "M" + b1[0].toFixed(1) + " " + b1[1].toFixed(1) + "L" + tip[0].toFixed(1) + " " + tip[1].toFixed(1) + "L" + b2[0].toFixed(1) + " " + b2[1].toFixed(1);
      }
      function place() {
        qLine.setAttribute("d", arrowD(st.q));
        kLine.setAttribute("d", arrowD(st.k));
        function putLbl(el, a) {
          var c = Math.cos(a * DEG), p = pt(a, R + 10);
          el.setAttribute("class", el.getAttribute("class").replace(/ t-(mid|end)/g, "") + (c > 0.35 ? "" : c < -0.35 ? " t-end" : " t-mid"));
          el.setAttribute("x", p[0].toFixed(1)); el.setAttribute("y", (p[1] + 4 - 8 * Math.sin(a * DEG)).toFixed(1));
        }
        putLbl(qLbl, st.q); putLbl(kLbl, st.k);
        qLbl.textContent = "q · m=" + Math.round(st.m);
        kLbl.textContent = "k · n=" + Math.round(st.n);
        var a0 = st.q, a1 = st.k, r = 38;
        var p0 = pt(a0, r), p1 = pt(a1, r);
        arc.setAttribute("d", "M" + p0[0].toFixed(1) + " " + p0[1].toFixed(1) + "A" + r + " " + r + " 0 0 0 " + p1[0].toFixed(1) + " " + p1[1].toFixed(1));
        var mid = pt((a0 + a1) / 2, r + 18);
        angLbl.setAttribute("x", mid[0].toFixed(1)); angLbl.setAttribute("y", (mid[1] + 4).toFixed(1));
        angLbl.textContent = Math.round(a1 - a0) + "°";
        if (read1) readout();
      }
      ghost.setAttribute("d", arrowD(Q0));
      place();
      var read1 = null;
      var rdY = compact ? [330, 354] : [150, 178], rdX = compact ? Wd / 2 : 470;
      read1 = S("text", { x: rdX, y: rdY[0], class: "t t-sm t-mono t-mid", text: "" }, C);
      var read2 = S("text", { x: rdX, y: rdY[1], class: "t t-sm t-mono t-mid", text: "" }, C);
      var read3 = compact ? null : S("text", { x: rdX, y: rdY[1] + 28, class: "t t-sm t-mid t-muted", text: "same score as at m = 2, n = 5" }, C);
      function readout() {
        var d = Math.round(st.k - st.q);
        read1.textContent = "n − m = " + Math.round(st.n - st.m) + ", angle = " + d + "°";
        read2.textContent = "q·k = cos " + d + "° = " + Math.cos(d * DEG).toFixed(2);
      }
      readout();
      // s3: q appears at m = 0, rotates to m = 2
      kLine.style.opacity = 0; kLbl.style.opacity = 0; arc.style.opacity = 0; angLbl.style.opacity = 0;
      read1.style.opacity = 0; read2.style.opacity = 0; if (read3) read3.style.opacity = 0;
      tl.to(B, { opacity: 0, duration: 0.4 });
      tl.set(C, { opacity: 1 });
      tl.to(st, { q: Q0 + 2 * TH, m: 2, duration: 1, ease: "power2.inOut", onUpdate: place });
      tl.addLabel("s3");
      // s4: k appears at n = 0, rotates to n = 5
      tl.to([kLine, kLbl], { opacity: 1, duration: 0.3 });
      tl.to(st, { k: K0 + 5 * TH, n: 5, duration: 1.1, ease: "power2.inOut", onUpdate: place });
      tl.to([arc, angLbl, read1, read2], { opacity: 1, duration: 0.3 });
      tl.addLabel("s4");
      // s5: shift both by 3
      tl.to(ghost, { opacity: 0, duration: 0.2 });
      tl.to(st, { q: Q0 + 5 * TH, k: K0 + 8 * TH, m: 5, n: 8, duration: 1.2, ease: "power2.inOut", onUpdate: place });
      if (read3) tl.to(read3, { opacity: 1, duration: 0.3 });
      tl.addLabel("s5");

      // ---------- scene D: many speeds ----------
      var D = S("g", {}, svg); D.style.opacity = 0;
      var TH4 = [1, 0.1, 0.01, 0.001], dist = 5;
      var dr = compact ? 32 : 44, dsp = compact ? 84 : 140, dx0 = (Wd - 3 * dsp) / 2, dcy = compact ? 170 : 160;
      S("text", { x: Wd / 2, y: compact ? 70 : 60, class: "t t-mid", text: compact ? "same distance, n − m = 5" : "same distance n − m = 5, four pairs with different speeds", "font-weight": 600 }, D);
      var needles = [];
      TH4.forEach(function (t, i) {
        var x = dx0 + i * dsp;
        S("circle", { cx: x, cy: dcy, r: dr, class: "s-grid" }, D);
        S("line", { x1: x, x2: x + dr, y1: dcy, y2: dcy, class: "s-faint", "stroke-width": 1.5 }, D);
        S("text", { x: x, y: dcy - dr - 14, class: "t t-sm t-mid", text: "θ = " + t }, D);
        var ang = dist * t / DEG;
        var tip = [x + dr * Math.cos(dist * t), dcy - dr * Math.sin(dist * t)];
        needles.push(S("path", { d: "M" + x + " " + dcy + "L" + tip[0].toFixed(1) + " " + tip[1].toFixed(1), class: i === 0 ? "s-orange" : "s-blue", "stroke-width": 3 }, D));
        S("text", { x: x, y: dcy + dr + 22, class: "t t-sm t-mono t-mid", text: (ang >= 10 ? Math.round(ang) : ang.toFixed(ang >= 1 ? 1 : 2)) + "°" }, D);
      });
      var dl = compact ? ["fast: wraps around quickly,", "good for nearby order", "slow: still small at long range"] : ["fast pairs wrap around within a few tokens: precise about nearby order", "slow pairs barely turn: they can still tell distances of thousands of tokens"];
      dl.forEach(function (s, i) { S("text", { x: Wd / 2, y: dcy + dr + (compact ? 64 : 70) + i * 22, class: "t t-sm t-mid t-muted", text: s }, D); });
      tl.to(C, { opacity: 0, duration: 0.4 });
      tl.set(D, { opacity: 1 });
      needles.forEach(function (n, i) { LC.drawIn(tl, n, { duration: 0.4 }, i ? "<0.1" : "+=0.01"); });
      tl.addLabel("s6");
      return tl;
    }
  };
})();
