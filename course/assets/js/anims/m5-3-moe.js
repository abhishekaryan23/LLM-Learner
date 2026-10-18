/* M5.3: a mixture-of-experts layer. One token is routed: router softmax over 8
   experts, top-2 (E3 0.31, E6 0.19, renormalized to 0.62 / 0.38), weighted sum.
   Then a batch of 12 tokens = 24 expert slots: unbalanced loads [2,1,7,2,1,6,3,2]
   against a capacity of ceil(1.25 * 24 / 8) = 4 (5 slots dropped), then balanced loads. */
(function () {
  var LC = window.LC;
  var E = 8;
  var P = [0.05, 0.08, 0.31, 0.06, 0.07, 0.19, 0.10, 0.14]; // sums to 1
  var TOP = [2, 5];
  var LOAD0 = [2, 1, 7, 2, 1, 6, 3, 2], LOAD1 = [3, 3, 3, 3, 3, 3, 3, 3], CAP = 4;

  LC.anims["m5-3-moe"] = {
    title: "A mixture-of-experts layer, step by step",
    steps: [
      "In a normal transformer block, every token goes through the same <strong>MLP</strong> (feed-forward network), and every one of its parameters is used for every token.",
      "A <strong>mixture-of-experts</strong> (MoE) layer replaces that MLP with several smaller MLPs, the <strong>experts</strong>, plus a tiny <strong>router</strong>. Attention stays shared.",
      "The router is one linear layer plus a softmax: $p = \\mathrm{softmax}(W_r\\,x)$. It gives this token a score for each of the 8 experts.",
      "Keep the <strong>top-k</strong> (here $k = 2$): E3 and E6. Their scores are renormalized into <strong>gates</strong>: $0.31/0.50 = 0.62$ and $0.19/0.50 = 0.38$.",
      "Only those 2 experts run. The output is the gate-weighted sum $y = 0.62\\,E_3(x) + 0.38\\,E_6(x)$. The other 6 experts cost <strong>no compute</strong> for this token, but they still sit in memory.",
      "Now a batch of 12 tokens, each picking 2 experts: 24 slots. Routers love favourites: E3 and E6 get 7 and 6. Each expert has a <strong>capacity</strong> (dashed, here 4), and slots beyond it are <strong>dropped</strong> (orange).",
      "A <strong>load-balancing</strong> loss (or a bias tweak) teaches the router to spread tokens evenly: 3 slots each, nothing dropped, and every expert keeps getting trained."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 420 } : { w: 640, h: 420 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var m = compact ? 12 : 40, pitch = (W - 2 * m) / E, bw = compact ? 36 : 56;
      function cx(i) { return m + pitch * (i + 0.5); }
      var tl = gsap.timeline();
      var mid = W / 2;
      var expY = 212, expH = 40, probBase = 200, probMax = 56;
      function readout(t) { return S("text", { x: compact ? 4 : 8, y: 18, class: "t t-sm", text: t }, svg); }
      function swapR(a, b, pos) { tl.to(a, { opacity: 0, duration: 0.25 }, pos); LC.popIn(tl, b, { duration: 0.35 }, "<0.1"); }

      // token
      var tok = S("g", {}, svg);
      S("rect", { x: mid - 36, y: 34, width: 72, height: 30, rx: 8, class: "f-surface", stroke: "var(--a-orange)", "stroke-width": 2 }, tok);
      S("text", { x: mid, y: 54, class: "t t-mid t-nohalo", text: "cat", "font-weight": 650 }, tok);

      // s0: dense MLP
      var dense = S("g", {}, svg);
      S("path", { d: "M" + mid + " 64V" + (expY - 74), class: "s-ink" }, dense);
      S("rect", { x: m, y: expY - 70, width: W - 2 * m, height: 110, rx: 12, class: "f-blue", "fill-opacity": 0.18, stroke: "var(--a-blue)", "stroke-width": 2 }, dense);
      S("text", { x: mid, y: expY - 20, class: "t t-mid t-nohalo", text: "one big MLP", "font-weight": 650 }, dense);
      S("text", { x: mid, y: expY + 2, class: "t t-sm t-mid t-nohalo t-muted", text: "all parameters, every token" }, dense);
      var r0 = readout("dense block: one MLP for every token");
      tl.addLabel("s0", 0);

      // s1: router + experts
      var router = S("g", {}, svg);
      S("rect", { x: mid - 70, y: 86, width: 140, height: 28, rx: 8, class: "f-surface2", stroke: "var(--a-ink)", "stroke-width": 1.5 }, router);
      S("text", { x: mid, y: 105, class: "t t-sm t-mid t-nohalo", text: "router" }, router);
      var tokLine = S("path", { d: "M" + mid + " 64V86", class: "s-ink" }, svg);
      var experts = [], expFill = [];
      for (var i = 0; i < E; i++) {
        var g = S("g", {}, svg);
        S("rect", { x: cx(i) - bw / 2, y: expY, width: bw, height: expH, rx: 8, class: "f-surface", stroke: "var(--a-blue)", "stroke-width": 1.5 }, g);
        var f = S("rect", { x: cx(i) - bw / 2, y: expY, width: bw, height: expH, rx: 8, class: "f-blue" }, g);
        f.style.opacity = 0; expFill.push(f);
        experts.push(g);
      }
      var eLbl = [];
      for (i = 0; i < E; i++) eLbl.push(S("text", { x: cx(i), y: expY + 25, class: "t t-sm t-mid t-nohalo", text: "E" + (i + 1) }, svg));
      var r1 = readout("MoE: 8 expert MLPs + a router");
      tl.to(dense, { opacity: 0, duration: 0.4 });
      swapR(r0, r1, "<");
      LC.popIn(tl, [router], { duration: 0.3 });
      LC.drawIn(tl, tokLine, { duration: 0.3 }, "+=0.01");
      LC.popIn(tl, experts.concat(eLbl), { duration: 0.3, stagger: 0.04 });
      tl.addLabel("s1");

      // s2: router probabilities
      var pmax = Math.max.apply(null, P);
      var pBars = P.map(function (p, i) {
        var h = (p / pmax) * probMax;
        return S("rect", { x: cx(i) - bw * 0.3, y: probBase - h, width: bw * 0.6, height: h, rx: 2, class: TOP.indexOf(i) >= 0 ? "f-orange" : "f-blue", "fill-opacity": 0.85 }, svg);
      });
      var pBase = S("line", { x1: m, x2: W - m, y1: probBase, y2: probBase, class: "s-grid" }, svg);
      var r2 = readout("router: p = softmax(W_r · x)");
      swapR(r1, r2);
      LC.popIn(tl, [pBase], { duration: 0.2 });
      pBars.forEach(function (b, i) {
        var h = +b.getAttribute("height"); b.setAttribute("height", 0); b.setAttribute("y", probBase);
        tl.to(b, { attr: { y: probBase - h, height: h }, duration: 0.5, ease: "power2.out" }, i ? "<0.04" : ">");
      });
      tl.addLabel("s2");

      // s3: top-2 + gate values
      var pLbl = TOP.map(function (i) { return S("text", { x: cx(i), y: probBase - (P[i] / pmax) * probMax - 6, class: "t t-sm t-mono t-mid t-orange", text: P[i].toFixed(2) }, svg); });
      var r3 = readout("top-2: E3, E6 → gates 0.62, 0.38");
      swapR(r2, r3);
      tl.to(pBars.filter(function (_, i) { return TOP.indexOf(i) < 0; }), { opacity: 0.3, duration: 0.3 }, "<");
      LC.popIn(tl, pLbl, { duration: 0.3 });
      tl.to(TOP.map(function (i) { return expFill[i]; }), { opacity: 1, duration: 0.4 });
      var wLbl = TOP.map(function (i) { var t = S("text", { x: cx(i), y: expY + 25, class: "t t-sm t-mid t-nohalo", text: "E" + (i + 1), style: "fill:var(--a-paper)", "font-weight": 650 }, svg); t.style.opacity = 0; return t; });
      tl.to(TOP.map(function (i) { return eLbl[i]; }), { opacity: 0, duration: 0.3 }, "<");
      tl.to(wLbl, { opacity: 1, duration: 0.3 }, "<");
      tl.addLabel("s3");

      // s4: run 2 experts, combine
      var outY = 300;
      var outLines = TOP.map(function (i) { return S("path", { d: "M" + cx(i) + " " + (expY + expH) + "C" + cx(i) + " " + (outY - 10) + " " + mid + " " + (expY + expH + 10) + " " + mid + " " + (outY - 14), class: "s-orange", "stroke-width": 2.5 }, svg); });
      var outNode = S("circle", { cx: mid, cy: outY, r: 14, class: "f-orange" }, svg);
      var outT = S("text", { x: mid, y: outY + 5, class: "t t-mid t-nohalo", text: "y", style: "fill:var(--a-paper)", "font-weight": 700 }, svg);
      var formula = S("text", { x: mid, y: outY + 40, class: "t t-sm t-mono t-mid", text: "y = 0.62·E3(x) + 0.38·E6(x)" }, svg);
      var idle = S("text", { x: mid, y: outY + 60, class: "t t-sm t-mid t-muted", text: "6 experts idle for this token" }, svg);
      var r4 = readout("only 2 of 8 experts run");
      swapR(r3, r4);
      outLines.forEach(function (p, i) { LC.drawIn(tl, p, { duration: 0.6 }, i ? "<0.1" : "+=0.02"); });
      LC.popIn(tl, [outNode, outT], { duration: 0.3 });
      LC.popIn(tl, [formula, idle], { duration: 0.35, stagger: 0.15 });
      tl.addLabel("s4");

      // s5: batch of tokens, unbalanced loads vs capacity
      var unit = 12, loadBase = 384;
      var chips = S("g", {}, svg);
      var cw = compact ? 20 : 30, cg = compact ? 6 : 12, cx0 = mid - (12 * cw + 11 * cg) / 2;
      for (var k = 0; k < 12; k++) S("rect", { x: cx0 + k * (cw + cg), y: 40, width: cw, height: 20, rx: 5, class: "f-surface", stroke: "var(--a-orange)", "stroke-width": 1.5 }, chips);
      function stacks(loads) {
        var g = S("g", {}, svg);
        loads.forEach(function (n, i) {
          for (var u = 0; u < n; u++) {
            S("rect", { x: cx(i) - bw * 0.4, y: loadBase - (u + 1) * unit + 1, width: bw * 0.8, height: unit - 2, rx: 2, class: u < CAP ? "f-blue" : "f-orange" }, g);
          }
          S("text", { x: cx(i), y: loadBase + 18, class: "t t-sm t-mono t-mid" + (n > CAP ? " t-orange" : ""), text: String(n) }, g);
        });
        return g;
      }
      var st0 = stacks(LOAD0), st1 = stacks(LOAD1);
      var capLine = S("path", { d: "M" + m + " " + (loadBase - CAP * unit - 1) + "H" + (W - m), class: "s-ink", "stroke-width": 1.5, "stroke-dasharray": "5 4", opacity: 0.8 }, svg);
      var r5 = readout("12 tokens × top-2 = 24 slots · capacity 4");
      var drop0 = S("text", { x: mid, y: 278, class: "t t-sm t-mid t-orange", text: "5 slots over capacity → dropped" }, svg);
      swapR(r4, r5);
      tl.to([tok, tokLine, outNode, outT, formula, idle, pBase].concat(outLines, pBars, pLbl), { opacity: 0, duration: 0.35 }, "<");
      tl.to(TOP.map(function (i) { return expFill[i]; }), { opacity: 0, duration: 0.35 }, "<");
      tl.to(wLbl, { opacity: 0, duration: 0.3 }, "<");
      tl.to(TOP.map(function (i) { return eLbl[i]; }), { opacity: 1, duration: 0.3 }, "<");
      LC.popIn(tl, [chips], { duration: 0.3 });
      LC.popIn(tl, [st0], { duration: 0.5 });
      LC.popIn(tl, [capLine, drop0], { duration: 0.3 });
      tl.addLabel("s5");

      // s6: balanced
      var r6 = readout("balanced: 3 slots each, none dropped");
      var drop1 = S("text", { x: mid, y: 278, class: "t t-sm t-mid t-blue", text: "0 dropped · every expert trained" }, svg);
      swapR(r5, r6);
      tl.to([st0, drop0], { opacity: 0, duration: 0.35 }, "<");
      LC.popIn(tl, [st1, drop1], { duration: 0.5 });
      tl.addLabel("s6");
      return tl;
    }
  };
})();
