/* RL.1: the agent–environment loop on the module's gridworld, one episode, and its
   discounted return. γ = 0.9. Goal path: 6 moves, reward +1 on the last, so
   G0 = 0.9^5 = 0.59. Pit path: 5 moves, reward −1 on the last, G0 = −0.9^4 = −0.66. */
(function () {
  var LC = window.LC;
  var GW = LC.rlGrid;
  var GOAL_PATH = [[3, 0], [2, 0], [2, 1], [2, 2], [1, 2], [0, 2], [0, 3]];
  var PIT_PATH = [[3, 0], [3, 1], [3, 2], [3, 3], [2, 3], [1, 3]];

  LC.anims["rl-1-loop"] = {
    title: "The agent–environment loop, one episode",
    steps: [
      "Our <strong>gridworld</strong>: the agent (orange dot) starts bottom-left. Reaching the goal pays <strong>+1</strong>, the pit pays <strong>−1</strong>, and every other move pays 0. The grey cell is a wall.",
      "Each turn starts with the agent observing the <strong>state</strong> $s_t$, here simply which cell it is in.",
      "Its <strong>policy</strong> $\\pi(a \\mid s)$ picks an <strong>action</strong>: up.",
      "The <strong>environment</strong> answers with a <strong>reward</strong> $r_{t+1} = 0$ and the next state $s_{t+1}$. Then the loop repeats.",
      "After six moves in total the agent reaches the goal and gets +1. One run from start to a terminal state is an <strong>episode</strong>.",
      "The <strong>return</strong> adds up the rewards, each discounted by $\\gamma^k$ for being $k$ steps later. With $\\gamma = 0.9$: $G_0 = 0.9^5 \\times 1 \\approx 0.59$.",
      "A different episode walks into the pit: $G_0 = 0.9^4 \\times (-1) \\approx -0.66$. The agent's goal is a policy with the <strong>highest expected return</strong>."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 450 } : { w: 640, h: 340 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      var L = compact
        ? { ag: { x: 14, y: 26, w: 112, h: 40 }, env: { x: 234, y: 26, w: 112, h: 40 }, aY: 36, rY: 56, aLblY: 18, rLblY: 84,
            cell: 62, gx: 56, gy: 104, read: [[14, 378], [150, 378], [268, 378]], tapeX: 14, tapeY: [384, 408, 436], col0: 70, colStep: 48, sum: [396, 422] }
        : { ag: { x: 16, y: 60, w: 110, h: 44 }, env: { x: 200, y: 60, w: 110, h: 44 }, aY: 72, rY: 92, aLblY: 50, rLblY: 126,
            cell: 70, gx: 340, gy: 30, read: [[16, 174], [16, 196], [16, 218]], tapeX: 16, tapeY: [254, 278, 310], col0: 66, colStep: 44, sum: [254, 280] };

      // --- loop diagram (visible from s0)
      function box(b, label) {
        S("rect", { x: b.x, y: b.y, width: b.w, height: b.h, rx: 10, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, svg);
        S("text", { x: b.x + b.w / 2, y: b.y + b.h / 2 + 5, class: "t t-mid", "font-weight": 600, text: label }, svg);
        return S("rect", { x: b.x - 2, y: b.y - 2, width: b.w + 4, height: b.h + 4, rx: 12, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 3 }, svg);
      }
      var agHL = box(L.ag, compact ? "Agent (π)" : "Agent: policy π");
      var envHL = box(L.env, "Environment");
      var ax0 = L.ag.x + L.ag.w + 4, ax1 = L.env.x - 4;
      function harrow(y, from, to, cls) {
        var dir = to > from ? 1 : -1;
        return S("path", { d: "M" + from + " " + y + "H" + to + "M" + (to - 8 * dir) + " " + (y - 5) + "L" + to + " " + y + "L" + (to - 8 * dir) + " " + (y + 5), class: cls, "stroke-width": 2 }, svg);
      }
      harrow(L.aY, ax0, ax1, "s-faint");
      harrow(L.rY, ax1, ax0, "s-faint");
      S("text", { x: (ax0 + ax1) / 2, y: L.aLblY, class: "t t-sm t-mid t-muted", text: "action aₜ" }, svg);
      S("text", { x: (ax0 + ax1) / 2, y: L.rLblY, class: "t t-sm t-mid t-muted", text: compact ? "state, reward" : "state, reward" }, svg);
      var aHot = harrow(L.aY, ax0, ax1, "s-orange");
      var rHot = harrow(L.rY, ax1, ax0, "s-orange");

      // --- grid
      var board = GW.draw(svg, L.gx, L.gy, L.cell, { goalLabel: true, startLabel: true });
      var xy = board.xy, cell = L.cell;
      var pathG = S("g", {}, svg);
      var p0 = xy(3, 0);
      var focus = S("rect", { x: p0.x + 1.5, y: p0.y + 1.5, width: cell - 3, height: cell - 3, rx: 6, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 3 }, svg);
      var robot = S("circle", { cx: p0.cx, cy: p0.cy, r: compact ? 11 : 12, class: "f-orange", stroke: "var(--a-ink)", "stroke-width": 2 }, svg);
      tl.addLabel("s0", 0);

      // s1: observe the state
      var rd = [
        S("text", { x: L.read[0][0], y: L.read[0][1], class: "t t-sm", text: "state s₀ = start" }, svg),
        S("text", { x: L.read[1][0], y: L.read[1][1], class: "t t-sm t-orange", text: "action a₀ = ↑" }, svg),
        S("text", { x: L.read[2][0], y: L.read[2][1], class: "t t-sm", text: "reward r₁ = 0" }, svg)
      ];
      LC.popIn(tl, [agHL, focus, rd[0]], { duration: 0.4 });
      tl.addLabel("s1");

      // s2: act
      var upArrow = S("path", { d: GW.arrowPath(p0.cx, p0.y - 2, 0, cell * 0.2), class: "s-orange", "stroke-width": 3 }, svg);
      aHot.style.opacity = 0;
      tl.to(aHot, { opacity: 1, duration: 0.3 }, "+=0.02");
      LC.drawIn(tl, upArrow, { duration: 0.4 });
      LC.popIn(tl, rd[1], { duration: 0.3 });
      tl.addLabel("s2");

      // s3: environment responds
      var p1 = xy(2, 0);
      rHot.style.opacity = 0;
      envHL.style.opacity = 0;
      tl.to([agHL, aHot, upArrow], { opacity: 0, duration: 0.25 });
      tl.to([envHL, rHot], { opacity: 1, duration: 0.3 }, "<");
      tl.to(robot, { attr: { cx: p1.cx, cy: p1.cy }, duration: 0.5, ease: "power2.inOut" });
      tl.to(focus, { attr: { y: p1.y + 1.5 }, duration: 0.5, ease: "power2.inOut" }, "<");
      LC.popIn(tl, rd[2], { duration: 0.3 });
      tl.addLabel("s3");

      // s4: the rest of the episode
      function pathD(cells, endEdge) {
        var d = "";
        cells.forEach(function (rc, i) {
          var p = xy(rc[0], rc[1]), x = p.cx, y = p.cy;
          if (i === cells.length - 1) {
            var prev = xy(cells[i - 1][0], cells[i - 1][1]);
            if (endEdge === "left") { x = p.x + 6; y = prev.cy; }
            else { x = prev.cx; y = p.y + cell - 6; }
          }
          d += (i ? "L" : "M") + x + " " + y;
        });
        return d;
      }
      var goalPath = S("path", { d: pathD(GOAL_PATH, "left"), class: "s-orange", "stroke-width": 3, "stroke-opacity": 0.75 }, pathG);
      tl.to([envHL, rHot, focus].concat(rd), { opacity: 0, duration: 0.3 });
      LC.drawIn(tl, goalPath, { duration: 1.2, ease: "none" });
      GOAL_PATH.slice(2).forEach(function (rc, i) {
        var p = xy(rc[0], rc[1]);
        tl.to(robot, { attr: { cx: p.cx, cy: p.cy }, duration: 0.24, ease: "none" }, i ? ">" : "<");
      });
      tl.to(robot, { opacity: 0, duration: 0.25 });
      tl.addLabel("s4");

      // s5: the discounted return
      var tape = S("g", {}, svg);
      var rs = ["0", "0", "0", "0", "0", "+1"], gs = ["1", ".9", ".81", ".73", ".66", ".59"];
      S("text", { x: L.tapeX, y: L.tapeY[0], class: "t t-sm t-muted", text: "r" }, tape);
      S("text", { x: L.tapeX, y: L.tapeY[1], class: "t t-sm t-muted", text: "γᵏ" }, tape);
      rs.forEach(function (v, i) {
        var x = L.col0 + i * L.colStep;
        S("text", { x: x, y: L.tapeY[0], class: "t t-sm t-mono t-mid" + (i === 5 ? " t-orange" : ""), "font-weight": i === 5 ? 700 : 400, text: v }, tape);
        S("text", { x: x, y: L.tapeY[1], class: "t t-sm t-mono t-mid t-muted", text: gs[i] }, tape);
      });
      S("text", { x: L.tapeX, y: L.tapeY[2], class: "t t-orange", "font-weight": 600, text: "G₀ = 0.9⁵ × (+1) ≈ 0.59" }, tape);
      tape.style.opacity = 0;
      tl.to(tape, { opacity: 1, duration: 0.5 }, "+=0.02");
      tl.addLabel("s5");

      // s6: a worse episode
      var pitPath = S("path", { d: pathD(PIT_PATH, "bottom"), class: "s-blue", "stroke-width": 3, "stroke-opacity": 0.8 }, pathG);
      var sum1 = S("text", { x: L.tapeX, y: L.sum[0], class: "t t-sm t-orange", "font-weight": 600, text: "goal run: 6 moves, G₀ = +0.59" }, svg);
      var sum2 = S("text", { x: L.tapeX, y: L.sum[1], class: "t t-sm t-blue", "font-weight": 600, text: "pit run: 5 moves, G₀ = −0.66" }, svg);
      tl.to(tape, { opacity: 0, duration: 0.3 });
      LC.drawIn(tl, pitPath, { duration: 1.0, ease: "none" });
      LC.popIn(tl, [sum1, sum2], { duration: 0.4, stagger: 0.15 });
      tl.addLabel("s6");
      return tl;
    }
  };
})();
