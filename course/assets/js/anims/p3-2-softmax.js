/* P3.2: softmax step by step on four next-token candidates.
   logits z = [3.0, 1.5, 1.0, -1.0]; exp(z) = [20.09, 4.48, 2.72, 0.37], sum 27.65;
   p = [0.726, 0.162, 0.098, 0.013]. T = 0.5 -> [0.936, 0.047, 0.017, 0.0003];
   T = 2 -> [0.506, 0.239, 0.186, 0.069]. All checked in Python. */
(function () {
  var LC = window.LC;
  var TOK = ["mat", "floor", "sofa", "moon"];
  var Z = [3.0, 1.5, 1.0, -1.0];
  function softmax(z, T) {
    T = T || 1;
    var m = Math.max.apply(null, z), e = z.map(function (v) { return Math.exp((v - m) / T); });
    var s = e.reduce(function (a, b) { return a + b; }, 0);
    return e.map(function (v) { return v / s; });
  }
  var E = Z.map(Math.exp), SUM = E.reduce(function (a, b) { return a + b; }, 0);
  var P1 = softmax(Z), P05 = softmax(Z, 0.5), P2 = softmax(Z, 2);
  function num(v, d) { var s = Math.abs(v).toFixed(d); return (v < -1e-9 ? "−" : "") + s; }

  LC.anims["p3-2-softmax"] = {
    title: "Softmax: from scores to probabilities",
    steps: [
      "The model has read <em>“The cat sat on the”</em> and outputs a score, a <strong>logit</strong>, for each candidate next token. Logits can be any real number, even negative.",
      "Step 1: <strong>exponentiate</strong>. $e^z$ is always positive, and it stretches gaps: a logit lead of 1.5 becomes a ratio of $e^{1.5} \\approx 4.5\\times$.",
      "Step 2: <strong>add them up</strong>. The total, $\\sum_j e^{z_j} = 27.65$, is the normaliser.",
      "Step 3: <strong>divide</strong> each by the total. Now every value is between 0 and 1 and they <strong>sum to 1</strong>: a probability distribution. “mat” gets 73%.",
      "Subtract the same number from every logit (here the max, 3) and nothing changes: $e^{z-c} = e^z e^{-c}$, and the $e^{-c}$ cancels. Real code does this so the biggest exponent is $e^0 = 1$ and nothing overflows.",
      "Divide the logits by a <strong>temperature</strong> $T$ before softmax. $T = 0.5$ doubles the gaps, so the distribution gets <strong>sharper</strong>: “mat” now gets 94%.",
      "$T = 2$ halves the gaps, so it gets <strong>flatter</strong>: even “moon” gets 7%. This is the temperature knob you set when sampling from an LLM (M1.5)."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 300 } : { w: 640, h: 300 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var left = compact ? 44 : 70, right = compact ? 8 : 40;
      var colW = (W - left - right) / 4, barW = compact ? 44 : 64;
      function cx(i) { return left + colW * (i + 0.5); }
      var top = 84, bottom = 214;          // plot band; value labels live above bars
      var tl = gsap.timeline();
      var sm = compact ? " t-sm" : "";

      // header rows
      S("text", { x: 4, y: 18, class: "t t-muted" + sm, text: "“The cat sat on the ___”" }, svg);
      S("text", { x: 4, y: 236, class: "t t-sm t-muted", text: compact ? "token" : "next token" }, svg);
      TOK.forEach(function (t, i) { S("text", { x: cx(i), y: 236, class: "t t-mid" + sm, "font-weight": i === 0 ? 650 : 450, text: t }, svg); });

      // views: values -> bar geometry
      function geomLogit(v) {          // zero line inside the band, range [-1.5, 3.5]
        var y0 = top + (3.5 / 5) * (bottom - top), k = (bottom - top) / 5;
        return v >= 0 ? { y: y0 - v * k, h: v * k, base: y0 } : { y: y0, h: -v * k, base: y0 };
      }
      function geomScaled(max) { return function (v) { var h = (v / max) * (bottom - top); return { y: bottom - h, h: h, base: bottom }; }; }
      var VIEWS = [
        { vals: Z, g: geomLogit, lab: function (v) { return num(v, 1); } },
        { vals: E, g: geomScaled(21), lab: function (v) { return v.toFixed(v < 1 ? 2 : 1); } },
        { vals: P1, g: geomScaled(1), lab: function (v) { return v.toFixed(2); } },
        { vals: P05, g: geomScaled(1), lab: function (v) { return v < 0.005 ? "<0.01" : v.toFixed(2); } },
        { vals: P2, g: geomScaled(1), lab: function (v) { return v.toFixed(2); } }
      ];
      var g0 = VIEWS[0].g(0);
      var base = S("line", { x1: left - 6, x2: W - right + 4, y1: g0.base, y2: g0.base, class: "s-axis" }, svg);
      var bars = Z.map(function (v, i) {
        var g = VIEWS[0].g(v);
        return S("rect", { x: cx(i) - barW / 2, y: g.y, width: barW, height: g.h, rx: 3, class: i === 0 ? "f-orange" : "f-blue" }, svg);
      });
      function valueLabels(view) {
        return view.vals.map(function (v, i) {
          var g = view.g(v), neg = v < 0 && view === VIEWS[0];
          var t = S("text", { x: cx(i), y: neg ? g.y + g.h + 15 : g.y - 6, class: "t t-mono t-mid" + sm, text: view.lab(v) }, svg);
          return t;
        });
      }
      var labs = VIEWS.map(valueLabels);
      labs.forEach(function (set, k) { if (k) set.forEach(function (t) { t.style.opacity = 0; }); });

      // row 2: what is being shown (left) + a note (right)
      function head(txt, cls) {
        var t = S("text", { x: 4, y: 44, class: "t" + sm + " " + (cls || "t-orange"), "font-weight": 650, text: txt }, svg);
        t.style.opacity = 0; return t;
      }
      function note(txt) {
        var t = S("text", { x: W - 4, y: 44, class: "t t-end t-muted" + sm, text: txt }, svg);
        t.style.opacity = 0; return t;
      }
      // z row (bottom): the numbers that go into exp(), per step
      function zrow(label, vals) {
        var g = S("g", {}, svg);
        S("text", { x: 4, y: 266, class: "t t-sm t-muted", text: label }, g);
        vals.forEach(function (v, i) { S("text", { x: cx(i), y: 266, class: "t t-mono t-mid" + sm, text: num(v, Math.abs(v * 10 - Math.round(v * 10)) > 1e-6 ? 2 : 1) }, g); });
        g.style.opacity = 0; return g;
      }
      var H = [head("logits z"), head("exp(z)"), head("add up: 27.65"), head("p = exp(z) / 27.65"),
        head(compact ? "subtract max: same p" : "subtract the max: same p"), head("T = 0.5: sharper"), head("T = 2: flatter")];
      var N = [note("sums to 1"), note("unchanged ✓")];
      var ZR = [zrow("z", Z), zrow("z − 3", Z.map(function (v) { return v - 3; })),
        zrow("z / T", Z.map(function (v) { return v / 0.5; })), zrow("z / T", Z.map(function (v) { return v / 2; }))];
      var sumBar = S("g", {}, svg);
      (function () { // a thin stacked bar showing the four exp values adding up
        var x0 = left, x1 = W - right, y = 56, acc = 0;
        E.forEach(function (v, i) {
          var w = (v / SUM) * (x1 - x0);
          S("rect", { x: x0 + acc, y: y, width: Math.max(1, w - 1), height: 8, rx: 2, class: i === 0 ? "f-orange" : "f-blue", "fill-opacity": i === 0 ? 1 : 0.55 }, sumBar);
          acc += w;
        });
      })();
      sumBar.style.opacity = 0;
      H[0].style.opacity = 1; ZR[0].style.opacity = 1;
      tl.addLabel("s0", 0);

      function toView(k, from) {
        var v = VIEWS[k];
        tl.to(labs[from], { opacity: 0, duration: 0.25 });
        bars.forEach(function (b, i) { var g = v.g(v.vals[i]); tl.to(b, { attr: { y: g.y, height: g.h }, duration: 0.8, ease: "power2.inOut" }, i ? "<" : ">"); });
        tl.to(base, { attr: { y1: v.g(0).base, y2: v.g(0).base }, duration: 0.8, ease: "power2.inOut" }, "<");
        tl.to(labs[k], { opacity: 1, duration: 0.3 });
      }
      function swap(a, b) { tl.to(a, { opacity: 0, duration: 0.25 }); tl.to(b, { opacity: 1, duration: 0.3 }, "<0.1"); }

      // s1 exp
      swap(H[0], H[1]);
      toView(1, 0);
      tl.addLabel("s1");
      // s2 sum
      swap(H[1], H[2]);
      tl.to(sumBar, { opacity: 1, duration: 0.4 });
      tl.addLabel("s2");
      // s3 divide
      swap(H[2], H[3]);
      tl.to(sumBar, { opacity: 0, duration: 0.3 }, "<");
      toView(2, 1);
      tl.to(N[0], { opacity: 1, duration: 0.3 });
      tl.addLabel("s3");
      // s4 shift invariance
      swap(H[3], H[4]);
      tl.to(N[0], { opacity: 0, duration: 0.2 }, "<");
      swap(ZR[0], ZR[1]);
      tl.to(N[1], { opacity: 1, duration: 0.3 });
      tl.fromTo(bars, { opacity: 1 }, { opacity: 0.45, duration: 0.25, yoyo: true, repeat: 1 });
      tl.addLabel("s4");
      // s5 T = 0.5
      swap(H[4], H[5]);
      tl.to(N[1], { opacity: 0, duration: 0.2 }, "<");
      swap(ZR[1], ZR[2]);
      toView(3, 2);
      tl.addLabel("s5");
      // s6 T = 2
      swap(H[5], H[6]);
      swap(ZR[2], ZR[3]);
      toView(4, 3);
      tl.addLabel("s6");
      return tl;
    }
  };
})();
