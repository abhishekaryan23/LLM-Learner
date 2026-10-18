/* RL.2: value iteration on the module gridworld (γ = 0.9, deterministic moves).
   Sweep k makes every state within k moves of the goal non-zero; sweep 6 reaches the
   start (0.9^5 = 0.59) and sweep 7 changes nothing, so it has converged.
   The last step extracts the greedy policy (all tied best actions are drawn). */
(function () {
  var LC = window.LC;
  var GW = LC.rlGrid, GAMMA = 0.9;
  var SW = GW.valueIteration(GAMMA, 50);   // SW[0] = zeros … SW[6] = converged, SW[7] = same
  var NOTES = [
    "start: V = 0 in every cell",
    "next to the goal: +1 + 0.9 × 0 = 1.00",
    "one more step back: 0 + 0.9 × 1.00 = 0.90",
    "0 + 0.9 × 0.90 = 0.81",
    "0 + 0.9 × 0.81 = 0.73",
    "0 + 0.9 × 0.73 = 0.66",
    "start: 0.9 × 0.66 = 0.59. Converged.",
    "greedy policy: go toward the best neighbour"
  ];
  function fmt(v) { return v === 0 ? "0" : v.toFixed(2); }

  LC.anims["rl-2-value-iteration"] = {
    title: "Value iteration: values flow back from the goal",
    steps: [
      "Start with $V(s) = 0$ everywhere. Each <strong>sweep</strong> updates every cell with the <strong>Bellman optimality backup</strong> $V(s) \\leftarrow \\max_a \\big[r + \\gamma V(s')\\big]$, using the old values.",
      "Sweep 1: only the cell next to the goal finds an action worth anything: step right for $+1$. Its value becomes <strong>1.00</strong>. (Stepping into the pit is worth $-1$, so the max ignores it.)",
      "Sweep 2: cells one step further back can now reach a 1.00 cell: $0 + 0.9 \\times 1.00 = 0.90$. Value is <strong>propagating</strong> backwards.",
      "Sweep 3: $0.9 \\times 0.90 = 0.81$. Every sweep pushes the frontier one move further from the goal.",
      "Sweep 4: four cells reach $0.73$, including the one just below the pit: it is better to walk around than to step in.",
      "Sweep 5: $0.66$. The far corner and the cells near the start fill in.",
      "Sweep 6 reaches the start: $0.9^5 \\approx 0.59$, the same return you computed in the last lesson. A 7th sweep changes nothing: the values have <strong>converged</strong> to $V^*$.",
      "Read off the <strong>greedy policy</strong>: in each cell take the action whose $r + \\gamma V(s')$ is largest. Two arrows mean a tie: both routes are equally short."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 366 } : { w: 640, h: 336 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact";
      var cell = 72, gx = compact ? 36 : 36, gy = compact ? 40 : 28;
      var tl = gsap.timeline();
      var board = GW.draw(svg, gx, gy, cell, { goalLabel: true });
      var heat = [], txt = [], ring = [], arrows = [];
      var heatG = S("g", {}, svg), txtG = S("g", {}, svg), ringG = S("g", {}, svg), arrG = S("g", {}, svg);
      for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) {
        if (GW.isWall(r, c) || GW.isTerminal(r, c)) continue;
        var p = board.xy(r, c), key = r * 4 + c;
        heat[key] = S("rect", { x: p.x + 1.5, y: p.y + 1.5, width: cell - 3, height: cell - 3, rx: 6, class: "f-blue", "fill-opacity": 0 }, heatG);
        txt[key] = S("text", { x: p.cx, y: p.cy + 5, class: "t t-mono t-mid t-nohalo", text: "0" }, txtG);
        ring[key] = S("rect", { x: p.x + 1.5, y: p.y + 1.5, width: cell - 3, height: cell - 3, rx: 6, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 3, "stroke-opacity": 0 }, ringG);
        // greedy arrows (drawn at the last step)
        var best = GW.greedy(SW[SW.length - 1], GAMMA, r, c), sx = 0, sy = 0;
        best.forEach(function (a) { sx += GW.ACTS[a][1]; sy += GW.ACTS[a][0]; });
        var ox = p.cx - 7 * sx, oy = p.cy + 17 - 6 * sy;
        if (best.length === 1 && sy === 0) oy = p.cy + 18;
        best.forEach(function (a) {
          var dx = GW.ACTS[a][1], dy = GW.ACTS[a][0], L = 14, tx = ox + dx * L, ty = oy + dy * L;
          var d = "M" + ox + " " + oy + "L" + tx + " " + ty +
            "M" + (tx - dx * 5 - dy * 4) + " " + (ty - dy * 5 - dx * 4) + "L" + tx + " " + ty + "L" + (tx - dx * 5 + dy * 4) + " " + (ty - dy * 5 + dx * 4);
          arrows.push(S("path", { d: d, class: "s-orange", "stroke-width": 2.5 }, arrG));
        });
      }
      // header / side panel
      var sweepLbl, note;
      if (compact) {
        sweepLbl = S("text", { x: gx, y: 24, class: "t", "font-weight": 650, text: "sweep 0" }, svg);
        S("text", { x: gx + 120, y: 24, class: "t t-sm t-muted", text: "γ = 0.9" }, svg);
        note = S("text", { x: gx, y: gy + 4 * cell + 26, class: "t t-sm", text: NOTES[0] }, svg);
      } else {
        var px = 360;
        S("text", { x: px, y: 50, class: "t t-sm t-muted", text: "Bellman optimality backup, γ = 0.9" }, svg);
        S("text", { x: px, y: 78, class: "t", text: "V(s) ← max over a of [ r + γ·V(s′) ]" }, svg);
        sweepLbl = S("text", { x: px, y: 136, class: "t t-lg", text: "sweep 0" }, svg);
        note = S("text", { x: px, y: 164, class: "t t-sm", text: NOTES[0] }, svg);
        S("text", { x: px, y: 220, class: "t t-sm t-muted", text: "number in a cell = its value V(s)" }, svg);
        S("text", { x: px, y: 242, class: "t t-sm t-muted", text: "darker blue = higher value" }, svg);
      }

      var st = { k: 0, up: 0 };
      function render() {
        var k = Math.min(st.k, 6), i0 = Math.floor(k), i1 = Math.min(6, i0 + 1), f = k - i0, kr = Math.round(k);
        for (var key in txt) {
          var r = Math.floor(key / 4), c = key % 4;
          var v = SW[i0][r][c] + (SW[i1][r][c] - SW[i0][r][c]) * f, vr = SW[kr][r][c];
          heat[key].setAttribute("fill-opacity", (v > 0 ? 0.06 + 0.5 * v : 0).toFixed(3));
          txt[key].textContent = fmt(vr);
          txt[key].setAttribute("class", "t t-mono t-mid t-nohalo" + (vr === 0 ? " t-muted" : ""));
          txt[key].setAttribute("y", (board.xy(r, c).cy + 5 - 13 * st.up).toFixed(1));
          var changed = kr > 0 && kr <= 6 && SW[kr][r][c] !== SW[kr - 1][r][c] && st.up < 0.5;
          ring[key].setAttribute("stroke-opacity", changed ? 1 : 0);
        }
        var step = st.up > 0.5 ? 7 : kr;
        sweepLbl.textContent = st.up > 0.5 ? "converged: V*" : "sweep " + kr;
        note.textContent = NOTES[step];
      }
      render();
      tl.addLabel("s0", 0);
      for (var i = 1; i <= 6; i++) {
        tl.to(st, { k: i, duration: 0.8, ease: "power1.inOut", onUpdate: render });
        tl.addLabel("s" + i);
      }
      tl.to(st, { up: 1, duration: 0.5, ease: "power1.inOut", onUpdate: render });
      arrows.forEach(function (a, j) { LC.drawIn(tl, a, { duration: 0.4 }, j ? "<0.03" : "+=0.02"); });
      tl.addLabel("s7");
      return tl;
    }
  };
})();
