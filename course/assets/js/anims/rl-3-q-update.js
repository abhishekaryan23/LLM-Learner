/* RL.3: one tabular Q-learning update on the module gridworld, mid-training.
   s = the cell below "left of goal" (row 1, col 2), action up, s' = row 0, col 2, r = 0.
   Q(s,·) = [↑ .20, ↓ .10, ← .05, → −.50];  Q(s',·) = [↑ .30, ↓ .15, ← .25, → .50].
   target = 0 + 0.9 × 0.50 = 0.45;  δ = 0.45 − 0.20 = 0.25;  Q ← 0.20 + 0.5 × 0.25 = 0.325.
   Final step: after many episodes max_a Q(s,a) converges to V* (0.9^(d−1)). */
(function () {
  var LC = window.LC;
  var GW = LC.rlGrid;
  var QS = [0.2, 0.1, 0.05, -0.5], QS2 = [0.3, 0.15, 0.25, 0.5];
  var VSTAR = GW.valueIteration(0.9, 50).pop();
  function f3(v) { return (v < 0 ? "−" : "") + Math.abs(v).toFixed(3); }

  LC.anims["rl-3-q-update"] = {
    title: "One Q-learning update, by the numbers",
    steps: [
      "Q-learning keeps a <strong>Q-table</strong>: one estimate $Q(s,a)$ for every state and action. We're mid-training, with the agent at $s$, just below the cell next to the goal.",
      "It acts <strong>$\\varepsilon$-greedily</strong>: with probability $1-\\varepsilon$ it takes the action with the highest $Q$, here up (0.200); otherwise a random one.",
      "The environment moves it to $s'$ with reward $r = 0$. Now the agent looks up its own estimates for $s'$.",
      "The <strong>TD target</strong> is the reward plus the discounted best estimate at $s'$: $0 + 0.9 \\times 0.500 = 0.45$. It uses the <strong>max</strong>, whatever the agent does next.",
      "The <strong>TD error</strong> $\\delta$ is target minus current estimate: $0.45 - 0.200 = +0.25$. Positive means \"better than I thought\".",
      "Move the estimate a fraction $\\alpha = 0.5$ of the way: $Q(s,\\uparrow) \\leftarrow 0.200 + 0.5 \\times 0.25 = 0.325$. One sample, no model of the environment needed.",
      "Repeat over many episodes and the estimates converge to $Q^*$. Their max per cell is exactly $V^*$ from value iteration, learned from experience alone."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 374 } : { w: 640, h: 290 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      var L = compact
        ? { cell: 40, gx: 12, gy: 44, tx: 196, tw: 150, h1: 30, r1: 54, h2: 160, r2: 184, rowH: 22, numFs: 10 }
        : { cell: 52, gx: 20, gy: 36, tx: 262, tw: 130, h1: 30, r1: 56, h2: 162, r2: 188, rowH: 24, numFs: 12 };
      var board = GW.draw(svg, L.gx, L.gy, L.cell, {});
      var cell = L.cell, ps = board.xy(1, 2), ps2 = board.xy(0, 2);
      // heat of V* for the last step (hidden until then)
      var heat = S("g", {}, svg); heat.style.opacity = 0;
      for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) {
        if (GW.isWall(r, c) || GW.isTerminal(r, c)) continue;
        var p = board.xy(r, c), v = VSTAR[r][c];
        S("rect", { x: p.x + 1.5, y: p.y + 1.5, width: cell - 3, height: cell - 3, rx: 6, class: "f-blue", "fill-opacity": (0.06 + 0.5 * v).toFixed(2) }, heat);
        S("text", { x: p.cx, y: p.cy + 4, class: "t t-mono t-mid t-nohalo", "font-size": L.numFs, text: compact ? v.toFixed(2).replace(/^0/, "") : v.toFixed(2) }, heat);
      }
      var sRing = S("rect", { x: ps.x + 1.5, y: ps.y + 1.5, width: cell - 3, height: cell - 3, rx: 6, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 2.5 }, svg);
      var s2Ring = S("rect", { x: ps2.x + 1.5, y: ps2.y + 1.5, width: cell - 3, height: cell - 3, rx: 6, class: "f-none", stroke: "var(--a-blue)", "stroke-width": 2.5 }, svg);
      var robot = S("circle", { cx: ps.cx, cy: ps.cy, r: compact ? 8 : 10, class: "f-orange", stroke: "var(--a-ink)", "stroke-width": 2 }, svg);
      var sLbl = S("text", { x: L.gx, y: L.gy + 4 * cell + 20, class: "t t-sm t-orange", text: "s = orange cell" }, svg);
      var s2Lbl = S("text", { x: L.gx, y: L.gy + 4 * cell + 38, class: "t t-sm t-blue", text: "s′ = blue cell" }, svg);

      function table(y0, ry, title, vals, cls) {
        var g = S("g", {}, svg), rows = [], hl = [];
        S("text", { x: L.tx, y: y0, class: "t t-sm " + cls, "font-weight": 650, text: title }, g);
        vals.forEach(function (v, a) {
          var y = ry + a * L.rowH;
          hl.push(S("rect", { x: L.tx - 4, y: y - 15, width: L.tw, height: L.rowH - 2, rx: 5, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 2 }, g));
          S("text", { x: L.tx + 8, y: y, class: "t t-sm t-mid", text: GW.ARROW[a] }, g);
          rows.push(S("text", { x: L.tx + L.tw - 14, y: y, class: "t t-sm t-mono t-end", text: f3(v) }, g));
        });
        hl.forEach(function (h) { h.style.opacity = 0; });
        return { g: g, rows: rows, hl: hl };
      }
      var T1 = table(L.h1, L.r1, compact ? "Q(s, ·)" : "Q(s, ·) at s", QS, "t-orange");
      var T2 = table(L.h2, L.r2, compact ? "Q(s′, ·)  r = 0" : "Q(s′, ·) at s′   r = 0", QS2, "t-blue");
      T2.g.style.opacity = 0;
      s2Ring.style.opacity = 0; s2Lbl.style.opacity = 0;

      var EQ = compact
        ? [["target: 0 + 0.9 × 0.500 = 0.45"], ["TD error δ: 0.45 − 0.200 = +0.25"], ["new Q(s,↑): 0.200 + 0.5 × 0.25 = 0.325"]]
        : [["TD target", "0 + 0.9 × 0.500 = 0.45"], ["TD error δ", "0.45 − 0.200 = +0.25"], ["update (α = 0.5)", "0.200 + 0.5 × 0.25 = 0.325"]];
      var eqEls = EQ.map(function (e, i) {
        if (compact) return [S("text", { x: 12, y: 290 + i * 26, class: "t", text: e[0] }, svg)];
        return [S("text", { x: 420, y: 56 + i * 64, class: "t t-sm t-muted", text: e[0] }, svg),
                S("text", { x: 420, y: 80 + i * 64, class: "t", text: e[1] }, svg)];
      });
      eqEls.forEach(function (els) { els.forEach(function (e) { e.style.opacity = 0; }); });
      tl.addLabel("s0", 0);

      // s1: ε-greedy picks ↑
      tl.to(T1.hl[0], { opacity: 1, duration: 0.4 });
      tl.addLabel("s1");

      // s2: move to s'
      var mv = S("path", { d: GW.arrowPath(ps.cx, ps.y, 0, cell * 0.28), class: "s-orange", "stroke-width": 2.5 }, svg);
      LC.drawIn(tl, mv, { duration: 0.4 }, "+=0.02");
      tl.to(robot, { attr: { cy: ps2.cy }, duration: 0.5, ease: "power2.inOut" });
      tl.to(mv, { opacity: 0, duration: 0.2 }, "<");
      tl.to([T2.g, s2Ring, s2Lbl], { opacity: 1, duration: 0.4 });
      tl.addLabel("s2");

      // s3: max at s' and the target
      tl.to(T2.hl[3], { opacity: 1, duration: 0.3 });
      LC.popIn(tl, eqEls[0], { duration: 0.4 });
      tl.addLabel("s3");

      // s4: TD error
      LC.popIn(tl, eqEls[1], { duration: 0.4 });
      tl.addLabel("s4");

      // s5: update
      LC.popIn(tl, eqEls[2], { duration: 0.4 });
      var st = { p: 0 };
      tl.to(st, { p: 1, duration: 0.6, onUpdate: function () {
        T1.rows[0].textContent = st.p > 0.5 ? "0.325" : "0.200";
        T1.rows[0].setAttribute("font-weight", st.p > 0.5 ? 700 : 400);
      } });
      tl.addLabel("s5");

      // s6: many episodes later
      tl.to([robot, sRing, s2Ring, sLbl, s2Lbl, T2.hl[3]], { opacity: 0, duration: 0.3 });
      tl.to(heat, { opacity: 1, duration: 0.6 });
      var conv = S("text", { x: L.gx, y: L.gy + 4 * cell + 20, class: "t t-sm", text: "max over a of Q = V*" }, svg);
      LC.popIn(tl, conv, { duration: 0.3 });
      tl.addLabel("s6");
      return tl;
    }
  };
})();
