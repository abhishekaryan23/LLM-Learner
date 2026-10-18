/* P5.3: a 3-state weather Markov chain. P = [[.7,.2,.1],[.2,.6,.2],[.2,.4,.4]] (rows = today).
   From Sunny: π1 = (.7,.2,.1), π2 = (.55,.30,.15), π3 = (.475,.35,.175) … → π = (.4,.4,.2) (πP = π).
   From Rainy: (.2,.4,.4), (.3,.44,.26), … → same π.
   Walker: numpy default_rng(5), 10,000 days from Sunny: first 16 states 0 1 2 1 1 0 0 0 0 0 2 2 1 1 2 2,
   share of days (0.404, 0.400, 0.196). */
(function () {
  var LC = window.LC;
  var P = [[0.7, 0.2, 0.1], [0.2, 0.6, 0.2], [0.2, 0.4, 0.4]];
  var NAMES = ["Sunny", "Cloudy", "Rainy"];
  var TRAJ = [0, 1, 2, 1, 1, 0, 0, 0, 0, 0, 2, 2, 1, 1, 2, 2];
  var FREQ = [0.404, 0.400, 0.196];
  function stepDist(p) { return [0, 1, 2].map(function (j) { return p[0] * P[0][j] + p[1] * P[1][j] + p[2] * P[2][j]; }); }
  function run(p0, n) { var out = [p0]; for (var i = 0; i < n; i++) out.push(stepDist(out[out.length - 1])); return out; }

  LC.anims["p5-3-markov"] = {
    title: "A Markov chain forgets its start",
    steps: [
      "Three weather <strong>states</strong>. The <strong>transition matrix</strong> $P$ holds tomorrow's chances given today: row = today, column = tomorrow. Every row sums to 1.",
      "Today is sunny for sure. As a distribution over the states: $\\pi_0 = (1, 0, 0)$.",
      "One step: $\\pi_1 = \\pi_0 P$. With all the mass on Sunny, that's just the Sunny row: $(0.7, 0.2, 0.1)$.",
      "Two steps: $\\pi_2 = \\pi_1 P = 0.7\\,(\\text{Sunny row}) + 0.2\\,(\\text{Cloudy row}) + 0.1\\,(\\text{Rainy row}) = (0.55, 0.30, 0.15)$.",
      "Keep multiplying. By about day 10 the bars stop moving at $(0.4, 0.4, 0.2)$: the <strong>stationary distribution</strong> $\\pi$, the one with $\\pi P = \\pi$ (dashed marks).",
      "Start from a rainy day instead, $\\pi_0 = (0, 0, 1)$. It converges to the same $\\pi$: the chain <strong>forgets where it started</strong>.",
      "Now a single walker: each day, <strong>sample</strong> tomorrow from today's row. Over 10,000 days it spends about 40%, 40% and 20% of its days in the three states, matching $\\pi$."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 372 } : { w: 640, h: 300 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact", W = ctx.w;
      var tl = gsap.timeline();
      // ---- matrix
      var M = compact ? { lx: 12, cx: [130, 210, 290], cw: 72, hy: 44, y0: 70, rh: 26, ty: 16 }
                      : { lx: 20, cx: [128, 200, 272], cw: 66, hy: 70, y0: 96, rh: 28, ty: 40 };
      S("text", { x: M.lx, y: M.ty, class: "t t-sm t-muted", text: "P: row = today, column = tomorrow" }, svg);
      NAMES.forEach(function (n, j) { S("text", { x: M.cx[j], y: M.hy, class: "t t-sm t-mid t-muted", text: n }, svg); });
      var rowHL = S("rect", { x: M.cx[0] - M.cw / 2 - 52, y: M.y0 - 17, width: M.cx[2] - M.cx[0] + M.cw + 52, height: M.rh - 2, rx: 6, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 2 }, svg);
      rowHL.style.opacity = 0;
      P.forEach(function (row, i) {
        var y = M.y0 + i * M.rh;
        S("text", { x: M.cx[0] - M.cw / 2 - 6, y: y, class: "t t-sm t-end", "font-weight": 600, text: NAMES[i] }, svg);
        row.forEach(function (v, j) {
          S("rect", { x: M.cx[j] - M.cw / 2 + 3, y: y - 16, width: M.cw - 6, height: M.rh - 4, rx: 4, class: "f-blue", "fill-opacity": (0.08 + 0.5 * v).toFixed(2) }, svg);
          S("text", { x: M.cx[j], y: y, class: "t t-sm t-mono t-mid t-nohalo", text: v.toFixed(1) }, svg);
        });
      });

      // ---- bars: π_t
      var B = compact ? { cx: [130, 210, 290], bw: 50, base: 330, hmax: 136, ty: 168, lab: 350 }
                      : { cx: [420, 500, 580], bw: 52, base: 250, hmax: 150, ty: 40, lab: 270 };
      var titles = ["πₜ = chance of each state on day t", "one walker: share of days spent"].map(function (t, k) {
        var e = S("text", { x: compact ? M.lx : 372, y: B.ty, class: "t t-sm t-muted", text: t }, svg);
        if (k) e.style.opacity = 0;
        return e;
      });
      var read = S("text", { x: compact ? W - 12 : W - 16, y: compact ? B.ty + 20 : B.ty + 20, class: "t t-sm t-mono t-end", text: "" }, svg);
      S("line", { x1: B.cx[0] - 40, x2: B.cx[2] + 40, y1: B.base, y2: B.base, class: "s-axis" }, svg);
      var bars = [], vals = [], labs = [];
      NAMES.forEach(function (n, j) {
        bars.push(S("rect", { x: B.cx[j] - B.bw / 2, width: B.bw, y: B.base, height: 0, rx: 3, class: j === 2 ? "f-orange" : "f-blue", "fill-opacity": j === 1 ? 0.6 : 1 }, svg));
        vals.push(S("text", { x: B.cx[j], y: B.base - 6, class: "t t-sm t-mono t-mid", text: "" }, svg));
        labs.push(S("text", { x: B.cx[j], y: B.lab, class: "t t-sm t-mid", "font-weight": 600, text: n }, svg));
      });
      var stat = [0.4, 0.4, 0.2].map(function (v, j) {
        var y = B.base - v * B.hmax;
        var d = S("path", { d: "M" + (B.cx[j] - B.bw / 2 - 8) + " " + y + "H" + (B.cx[j] + B.bw / 2 + 8), class: "s-ink", "stroke-width": 2, "stroke-dasharray": "4 3" }, svg);
        d.style.opacity = 0;
        return d;
      });
      var walker = S("rect", { x: B.cx[0] - 30, y: B.lab - 14, width: 60, height: 20, rx: 10, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 2.5 }, svg);
      walker.style.opacity = 0;

      var st = { a: 0, b: 0, c: 0, t: 0, mode: 0, h: 0 };
      function draw() {
        var p = [st.a, st.b, st.c];
        bars.forEach(function (r, j) {
          var h = p[j] * B.hmax;
          r.setAttribute("y", (B.base - h).toFixed(1)); r.setAttribute("height", h.toFixed(1));
          vals[j].setAttribute("y", (B.base - h - 9).toFixed(1));
          vals[j].textContent = p[j] > 0.001 ? p[j].toFixed(2) : "0";
        });
        read.textContent = st.mode ? "day " + Math.round(st.h) : "t = " + Math.round(st.t);
        if (st.mode) walker.setAttribute("x", B.cx[TRAJ[Math.min(TRAJ.length - 1, Math.round(st.h))]] - 30);
      }
      draw();
      function goTo(p, t, dur, pos) {
        return tl.to(st, { a: p[0], b: p[1], c: p[2], t: t, duration: dur, ease: "power1.inOut", onUpdate: draw }, pos);
      }
      tl.addLabel("s0", 0);

      // s1: π0 = (1, 0, 0)
      goTo([1, 0, 0], 0, 0.6);
      tl.addLabel("s1");
      // s2: π1 = Sunny row
      var A = run([1, 0, 0], 12);
      tl.to(rowHL, { opacity: 1, duration: 0.3 });
      goTo(A[1], 1, 0.8);
      tl.addLabel("s2");
      // s3: π2
      tl.to(rowHL, { opacity: 0, duration: 0.2 });
      goTo(A[2], 2, 0.8);
      tl.addLabel("s3");
      // s4: converge
      for (var k = 3; k <= 12; k++) goTo(A[k], k, 0.22);
      tl.to(stat, { opacity: 1, duration: 0.4 });
      tl.addLabel("s4");
      // s5: from Rainy
      var R = run([0, 0, 1], 12);
      goTo(R[0], 0, 0.5);
      for (var k2 = 1; k2 <= 12; k2++) goTo(R[k2], k2, k2 < 3 ? 0.5 : 0.22);
      tl.addLabel("s5");
      // s6: one walker, sampled path; then the share of 10,000 days
      tl.to(titles[0], { opacity: 0, duration: 0.2 });
      tl.to(titles[1], { opacity: 1, duration: 0.3 });
      tl.set(st, { mode: 1, h: 0, onComplete: draw });
      tl.to(walker, { opacity: 1, duration: 0.2 });
      tl.to(st, { h: TRAJ.length - 1, duration: 2.0, ease: "none", onUpdate: draw });
      tl.to(st, { a: FREQ[0], b: FREQ[1], c: FREQ[2], duration: 0.4, onUpdate: function () { draw(); read.textContent = "10,000 days"; } });
      tl.addLabel("s6");
      return tl;
    }
  };
})();
