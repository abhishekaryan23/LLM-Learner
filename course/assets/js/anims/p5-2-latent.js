/* P5.2: a two-component latent-variable model. z ∈ {A, B}, p(A) = 0.3, p(B) = 0.7;
   p(x | A) = N(−1.5, 0.7²), p(x | B) = N(1.5, 1²); p(x) = Σ_z p(x | z) p(z).
   At x = −0.5: 0.3·N = 0.0616, 0.7·N = 0.0378, p(x) = 0.0994, posterior A = 0.62.
   At x = 0.5: posterior B = 0.983. */
(function () {
  var LC = window.LC;
  var PA = 0.3, PB = 0.7, MA = -1.5, SA = 0.7, MB = 1.5, SB = 1.0;
  function N(x, m, s) { var z = (x - m) / s; return Math.exp(-0.5 * z * z) / (s * Math.sqrt(2 * Math.PI)); }

  LC.anims["p5-2-latent"] = {
    title: "Hidden cause, mixture, posterior",
    steps: [
      "A <strong>latent variable</strong> $z$ is a hidden cause we never observe. Here it takes two values, A and B, with prior $p(z)$: 30% A, 70% B.",
      "Each value of $z$ produces data its own way: $p(x \\mid A) = \\mathcal N(-1.5, 0.7^2)$ and $p(x \\mid B) = \\mathcal N(1.5, 1)$. To generate, pick $z$ first, then $x$.",
      "Weight each by its prior and add: $p(x) = \\sum_z p(x \\mid z)\\,p(z)$. This <strong>mixture</strong> (solid) is all you ever observe; which $z$ made each point is hidden.",
      "Now observe one point, $x = -0.5$. Each cause explains it with height $p(x \\mid z)\\,p(z)$: 0.062 for A and 0.038 for B.",
      "<strong>Bayes</strong>: divide each by their sum, the evidence $p(x) \\approx 0.099$. The <strong>posterior</strong> $p(z \\mid x)$ is 62% A, 38% B. The data overturned the prior.",
      "At $x = 0.5$ the posterior is 98% B. Easy here, because the sum has two terms. With a continuous, high-dimensional $z$ it becomes an integral nobody can compute exactly."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 336 } : { w: 640, h: 300 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact", W = ctx.w;
      var tl = gsap.timeline();
      // --- bars panel: p(z) / p(z | x)
      var B = compact ? { x: 12, lab: 58, w: 220, y: [30, 58], ty: 16, vx: W - 12 } : { x: 16, lab: 62, w: 120, y: [74, 110], ty: 44, vx: 236 };
      var titles = ["p(z)  (prior)", "p(z | x = −0.5)", "p(z | x = 0.5)"].map(function (t, k) {
        var e = S("text", { x: B.x, y: B.ty, class: "t t-sm t-muted", text: t }, svg);
        if (k) e.style.opacity = 0;
        return e;
      });
      var bars = [], vals = [];
      ["z = A", "z = B"].forEach(function (lab, k) {
        S("text", { x: B.x, y: B.y[k] + 13, class: "t t-sm " + (k ? "t-blue" : "t-orange"), "font-weight": 650, text: lab }, svg);
        S("rect", { x: B.x + B.lab, y: B.y[k], width: B.w, height: 18, rx: 3, class: "f-surface2" }, svg);
        bars.push(S("rect", { x: B.x + B.lab, y: B.y[k], width: 0, height: 18, rx: 3, class: k ? "f-blue" : "f-orange" }, svg));
        vals.push(S("text", { x: B.vx, y: B.y[k] + 13, class: "t t-sm t-mono t-end", text: "" }, svg));
      });
      var st = { pa: PA, x: -0.5, w: 0 };
      function setBars() {
        bars[0].setAttribute("width", (B.w * st.pa).toFixed(1));
        bars[1].setAttribute("width", (B.w * (1 - st.pa)).toFixed(1));
        vals[0].textContent = st.pa.toFixed(2); vals[1].textContent = (1 - st.pa).toFixed(2);
      }
      setBars();

      // --- density plot
      var P = compact ? { l: 30, r: 12, t: 124, h: 152, ty: 106 } : { l: 290, r: 16, t: 60, h: 180, ty: 24 };
      var X0 = -4, X1 = 4.5, Y1 = 0.62, base = P.t + P.h;
      function sx(x) { return P.l + (x - X0) / (X1 - X0) * (W - P.l - P.r); }
      function sy(v) { return P.t + (1 - v / Y1) * P.h; }
      S("text", { x: compact ? 4 : P.l - 30, y: P.ty, class: "t t-sm t-muted", text: "↑ density over x" }, svg);
      [0.2, 0.4, 0.6].forEach(function (v) {
        S("line", { x1: P.l, x2: W - P.r, y1: sy(v), y2: sy(v), class: "s-grid" }, svg);
        S("text", { x: P.l - 5, y: sy(v) + 4, class: "t t-sm t-muted t-end", text: v.toFixed(1) }, svg);
      });
      S("path", { d: "M" + P.l + " " + P.t + "V" + base + "H" + (W - P.r), class: "s-axis" }, svg);
      [-3, -2, -1, 0, 1, 2, 3, 4].forEach(function (x) { S("text", { x: sx(x), y: base + 16, class: "t t-sm t-muted t-mid", text: x < 0 ? "−" + (-x) : String(x) }, svg); });

      function compPath(k) {
        return LC.fnPath(function (x) {
          var wA = 1 + (PA - 1) * st.w, wB = 1 + (PB - 1) * st.w;
          return k ? wB * N(x, MB, SB) : wA * N(x, MA, SA);
        }, X0, X1, sx, sy, 120);
      }
      var cA = S("path", { d: compPath(0), class: "s-orange", "stroke-width": 2.5, "stroke-dasharray": "6 5" }, svg);
      var cB = S("path", { d: compPath(1), class: "s-blue", "stroke-width": 2.5, "stroke-dasharray": "6 5" }, svg);
      cA.style.opacity = 0; cB.style.opacity = 0;
      var mix = S("path", { d: LC.fnPath(function (x) { return PA * N(x, MA, SA) + PB * N(x, MB, SB); }, X0, X1, sx, sy, 120), class: "s-ink", "stroke-width": 3 }, svg);

      // legend under the axis
      var ly = base + (compact ? 42 : 42), lg = [];
      function key(x, cls, dash, txt) {
        var g = S("g", {}, svg);
        S("line", { x1: x, x2: x + 22, y1: ly - 4, y2: ly - 4, class: cls, "stroke-width": 2.5, "stroke-dasharray": dash ? "6 4" : "none" }, g);
        S("text", { x: x + 28, y: ly, class: "t t-sm t-muted", text: txt }, g);
        g.style.opacity = 0; lg.push(g);
        return g;
      }
      var kx = compact ? [8, 96, 196] : [P.l, P.l + 110, P.l + 220];
      key(kx[0], "s-orange", true, compact ? "from A" : "x from A");
      key(kx[1], "s-blue", true, compact ? "from B" : "x from B");
      key(kx[2], "s-ink", false, compact ? "p(x), sum" : "p(x) = sum");
      tl.addLabel("s0", 0);

      // s1: the two conditionals, unweighted
      tl.to([cA, cB, lg[0], lg[1]], { opacity: 1, duration: 0.5 });
      tl.addLabel("s1");

      // s2: weight by the prior, add up
      tl.to(st, { w: 1, duration: 1.0, ease: "power1.inOut", onUpdate: function () { cA.setAttribute("d", compPath(0)); cB.setAttribute("d", compPath(1)); } });
      LC.drawIn(tl, mix, { duration: 1.0 });
      LC.popIn(tl, lg[2], { duration: 0.3 });
      tl.addLabel("s2");

      // s3: observe x
      var obs = S("g", {}, svg);
      var vline = S("line", { x1: 0, x2: 0, y1: P.t + 18, y2: base, class: "s-ink", "stroke-width": 1.5, "stroke-dasharray": "3 4" }, obs);
      var obsLbl = S("text", { x: 0, y: P.t + 10, class: "t t-sm t-mid", "font-weight": 650, text: "" }, obs);
      var dA = S("circle", { r: 5, class: "f-orange", stroke: "var(--a-paper)", "stroke-width": 1.5 }, obs);
      var dB = S("circle", { r: 5, class: "f-blue", stroke: "var(--a-paper)", "stroke-width": 1.5 }, obs);
      function place() {
        var X = sx(st.x);
        vline.setAttribute("x1", X); vline.setAttribute("x2", X);
        obsLbl.setAttribute("x", X); obsLbl.textContent = "x = " + (st.x < 0 ? "−" : "") + Math.abs(st.x).toFixed(1);
        dA.setAttribute("cx", X); dA.setAttribute("cy", sy(PA * N(st.x, MA, SA)));
        dB.setAttribute("cx", X); dB.setAttribute("cy", sy(PB * N(st.x, MB, SB)));
      }
      place();
      LC.popIn(tl, obs, { duration: 0.4 });
      tl.addLabel("s3");

      // s4: posterior bars
      function post(x) { var a = PA * N(x, MA, SA), b = PB * N(x, MB, SB); return a / (a + b); }
      tl.to(titles[0], { opacity: 0, duration: 0.2 });
      tl.to(titles[1], { opacity: 1, duration: 0.3 });
      tl.to(st, { pa: post(-0.5), duration: 0.8, ease: "power2.inOut", onUpdate: setBars }, "<");
      tl.addLabel("s4");

      // s5: a different observation
      tl.to(titles[1], { opacity: 0, duration: 0.2 });
      tl.to(titles[2], { opacity: 1, duration: 0.3 });
      tl.to(st, {
        x: 0.5, duration: 1.0, ease: "power2.inOut", onUpdate: function () {
          place(); st.pa = post(st.x); setBars();
        }
      }, "<");
      tl.addLabel("s5");
      return tl;
    }
  };
})();
