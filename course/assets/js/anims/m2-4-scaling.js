/* M2.4: scaling-law curves and IsoFLOP profiles.
   Illustrative curves from a Chinchilla-style formula L(N, D) = E + A/N^a + B/D^a with
   E = 1.69, A = 406.4, a = 0.34 and B = A·20^a, chosen so the optimum is exactly 20 tokens
   per parameter (the shape matters here, not the constants). D = C / (6N). */
(function () {
  var LC = window.LC;
  var E = 1.69, A = 406.4, AL = 0.34, B = A * Math.pow(20, AL);
  function L(N, D) { return E + A / Math.pow(N, AL) + B / Math.pow(D, AL); }
  function Lc(N, C) { return L(N, C / (6 * N)); }
  function Nopt(C) { return Math.sqrt(C / 120); }               // C = 6·N·20N
  var SUP = { "7": "⁷", "8": "⁸", "9": "⁹", "1": "¹", "0": "⁰", "2": "²", "3": "³" };
  function pow10(e) { return "10" + String(e).split("").map(function (c) { return SUP[c]; }).join(""); }
  function nName(n) { return n >= 1e9 ? (n / 1e9) + "B" : (n / 1e6) + "M"; }

  LC.anims["m2-4-scaling"] = {
    title: "Scaling laws: loss vs compute, and the best model size",
    steps: [
      "Both axes are <strong>logarithmic</strong>: each tick is 10× more training compute. We'll plot the loss models reach (illustrative curves from a Chinchilla-style formula).",
      "Train one 300M-parameter model on more and more tokens. Loss falls fast, then <strong>flattens</strong>: the model's size limits it.",
      "Smaller models flatten early and high; bigger ones cost more to get going but keep improving <strong>for longer</strong>.",
      "The lower edge of all the curves is the <strong>compute-optimal frontier</strong>: the best loss any model size can buy with each budget. It's close to a straight line on log-log axes, a <strong>power law</strong> (Kaplan et al., 2020).",
      "Now fix the budget at $10^{21}$ FLOPs and vary the model size (tokens $= C/6N$). Too small a model can't use the data; too big a model sees too few tokens. The bottom of this <strong>IsoFLOP</strong> curve is the best size.",
      "Repeat for budgets from $10^{19}$ to $10^{22}$ FLOPs. Each budget has its own best size, marked with a dot.",
      "The best size grows like $\\sqrt{C}$: <strong>10× the compute → about 3.2× the parameters and 3.2× the tokens</strong>. Hoffmann et al. (2022) found this split, about <strong>20 tokens per parameter</strong>."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 330 } : { w: 640, h: 330 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, H = ctx.h, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      var uid = Math.random().toString(36).slice(2);
      var defs = S("defs", {}, svg);

      function panel(opt) {
        var g = S("g", {}, svg);
        var m = opt.m, pw = W - m.l - m.r, ph = H - m.t - m.b;
        var sx = function (lx) { return m.l + (lx - opt.x0) / (opt.x1 - opt.x0) * pw; };
        var sy = function (v) { var t = opt.logY ? (Math.log10(v) - Math.log10(opt.y0)) / (Math.log10(opt.y1) - Math.log10(opt.y0)) : (v - opt.y0) / (opt.y1 - opt.y0); return m.t + (1 - t) * ph; };
        opt.yt.forEach(function (v) {
          S("line", { x1: m.l, x2: W - m.r, y1: sy(v), y2: sy(v), class: "s-grid" }, g);
          S("text", { x: m.l - 6, y: sy(v) + 4, class: "t t-sm t-muted t-end", text: v.toFixed(1) }, g);
        });
        S("path", { d: "M" + m.l + " " + m.t + "V" + (m.t + ph) + "H" + (W - m.r), class: "s-axis" }, g);
        opt.xt.forEach(function (x) { S("text", { x: sx(x[0]), y: m.t + ph + 18, class: "t t-sm t-muted t-mid", text: x[1] }, g); });
        S("text", { x: W - m.r, y: H - 6, class: "t t-sm t-muted t-end", text: opt.xTitle }, g);
        S("text", { x: 4, y: 16, class: "t t-sm t-muted", text: "↑ loss" + (opt.logY ? " (log scale)" : "") }, g);
        var cid = "c" + opt.id + uid, cp = S("clipPath", { id: cid }, defs);
        S("rect", { x: m.l, y: m.t, width: pw, height: ph }, cp);
        var plot = S("g", { "clip-path": "url(#" + cid + ")" }, g);
        return { g: g, plot: plot, sx: sx, sy: sy, m: m, pw: pw, ph: ph };
      }
      function curve(P, f, a, b, cls, n) {
        var d = "";
        for (var i = 0; i <= (n || 120); i++) { var x = a + (b - a) * i / (n || 120); d += (i ? "L" : "M") + P.sx(x).toFixed(1) + " " + P.sy(f(x)).toFixed(1); }
        return S("path", { d: d, class: cls, "stroke-width": 2.5 }, P.plot);
      }

      // ---------- panel A: loss vs compute ----------
      var PA = panel({ id: "a", m: compact ? { l: 34, r: 44, t: 48, b: 46 } : { l: 44, r: 60, t: 48, b: 46 },
        x0: 17.5, x1: 22.5, y0: 1.8, y1: 4.6, logY: true, yt: [2, 3, 4],
        xt: compact ? [[18, pow10(18)], [20, pow10(20)], [22, pow10(22)]] : [[18, pow10(18)], [19, pow10(19)], [20, pow10(20)], [21, pow10(21)], [22, pow10(22)]],
        xTitle: "training compute C (FLOPs) →" });
      var SIZES = [3e8, 3e7, 3e9];
      var curvesA = SIZES.map(function (N, i) {
        var p = curve(PA, function (lc) { return Lc(N, Math.pow(10, lc)); }, 17.5, 22.5, i === 0 ? "s-blue" : "s-ink");
        var yEnd = PA.sy(Lc(N, Math.pow(10, 22.5)));
        var lbl = S("text", { x: W - PA.m.r + 6, y: yEnd + 4, class: "t t-sm" + (i === 0 ? " t-blue" : ""), text: nName(N) }, PA.g);
        return { p: p, l: lbl };
      });
      var front = curve(PA, function (lc) { var C = Math.pow(10, lc); return Lc(Nopt(C), C); }, 17.5, 22.5, "s-orange");
      front.setAttribute("stroke-dasharray", "7 6");
      var legA = S("g", {}, PA.g);
      S("path", { d: "M" + PA.m.l + " 32h22", class: "s-orange", "stroke-width": 2.5, "stroke-dasharray": "7 6" }, legA);
      S("text", { x: PA.m.l + 28, y: 36, class: "t t-sm t-orange", text: "frontier: best loss per budget" }, legA);
      tl.addLabel("s0", 0);

      // s1
      LC.drawIn(tl, curvesA[0].p, { duration: 1 });
      LC.popIn(tl, curvesA[0].l, { duration: 0.3 });
      tl.addLabel("s1");
      // s2
      LC.drawIn(tl, curvesA[1].p, { duration: 0.9 });
      LC.popIn(tl, curvesA[1].l, { duration: 0.2 });
      LC.drawIn(tl, curvesA[2].p, { duration: 0.9 });
      LC.popIn(tl, curvesA[2].l, { duration: 0.2 });
      tl.addLabel("s2");
      // s3: frontier (dashed, so fade it in rather than draw it)
      LC.popIn(tl, [front, legA], { duration: 0.6 });
      tl.addLabel("s3");

      // ---------- panel B: IsoFLOP profiles ----------
      var PB = panel({ id: "b", m: compact ? { l: 34, r: 26, t: 48, b: 46 } : { l: 44, r: 24, t: 48, b: 46 },
        x0: 7.5, x1: 11, y0: 1.85, y1: 3.4, logY: false, yt: [2, 2.5, 3],
        xt: [[8, "100M"], [9, "1B"], [10, "10B"], [11, "100B"]],
        xTitle: "parameters N (log scale) →" });
      PB.g.style.opacity = 0;
      var BUD = [19, 20, 21, 22];
      var iso = BUD.map(function (e) {
        var C = Math.pow(10, e), n = Nopt(C);
        var p = curve(PB, function (ln) { return Lc(Math.pow(10, ln), C); }, 7.5, 11, e === 21 ? "s-blue" : "s-ink");
        var dot = S("circle", { cx: PB.sx(Math.log10(n)), cy: PB.sy(Lc(n, C)), r: 5, class: "f-orange" }, PB.g);
        var lbl = S("text", { x: PB.sx(Math.log10(n)) + 7, y: PB.sy(Lc(n, C)) - 10, class: "t t-sm" + (e === 21 ? " t-blue" : ""), text: pow10(e) }, PB.g);
        return { p: p, dot: dot, l: lbl };
      });
      var small = S("text", { x: PB.m.l + 6, y: PB.m.t + 16, class: "t t-sm t-muted", text: "← too small" }, PB.g);
      var big = S("text", { x: W - PB.m.r - 6, y: PB.m.t + 16, class: "t t-sm t-muted t-end", text: "too big →" }, PB.g);
      var legB = S("text", { x: PB.m.l, y: 36, class: "t t-sm t-muted", text: compact ? "one curve per compute budget" : "one curve per compute budget (FLOPs), dot = best size" }, PB.g);
      var optD = BUD.map(function (e) { var C = Math.pow(10, e), n = Nopt(C); return PB.sx(Math.log10(n)).toFixed(1) + " " + PB.sy(Lc(n, C)).toFixed(1); });
      var optLine = S("path", { d: "M" + optD.join("L"), class: "s-orange", "stroke-width": 2.5 }, PB.g);
      var rule = S("text", { x: PB.m.l, y: 36, class: "t t-sm t-orange", "font-weight": 650, text: compact ? "N, D ∝ √C · D ≈ 20 N" : "best N and D both grow like √C · D ≈ 20 N · C ≈ 6ND" }, PB.g);
      [small, big, legB, rule].concat(iso.map(function (o) { return o.dot; }), iso.map(function (o) { return o.l; })).forEach(function (e) { e.style.opacity = 0; });

      // s4: switch panels, one IsoFLOP curve
      tl.to(PA.g, { opacity: 0, duration: 0.4 });
      tl.to(PB.g, { opacity: 1, duration: 0.4 });
      var c21 = iso[2];
      LC.drawIn(tl, c21.p, { duration: 1 });
      LC.popIn(tl, [c21.dot, c21.l, small, big], { duration: 0.3 });
      tl.addLabel("s4");
      // s5: the other budgets
      tl.to([small, big], { opacity: 0, duration: 0.25 });
      [0, 1, 3].forEach(function (k, j) {
        LC.drawIn(tl, iso[k].p, { duration: 0.7 }, j ? "<0.2" : undefined);
      });
      LC.popIn(tl, [0, 1, 3].map(function (k) { return iso[k].dot; }).concat([0, 1, 3].map(function (k) { return iso[k].l; }), [legB]), { duration: 0.3 });
      tl.addLabel("s5");
      // s6: the optimum line + rule
      tl.to(legB, { opacity: 0, duration: 0.2 });
      LC.drawIn(tl, optLine, { duration: 0.8 });
      tl.to(iso.map(function (o) { return o.dot; }), { attr: { r: 6 }, duration: 0.2 }, "<");
      LC.popIn(tl, rule, { duration: 0.3 });
      tl.addLabel("s6");
      return tl;
    }
  };
})();
