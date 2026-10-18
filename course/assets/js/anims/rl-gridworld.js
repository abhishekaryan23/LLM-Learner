/* RL module: the one gridworld every RL lesson reuses (shared by the rl-* animations
   and playgrounds). 4 × 4 cells, rows counted from the top:
     row 0:  .  .  .  G      G = goal, reward +1, episode ends
     row 1:  .  #  .  P      P = pit,  reward −1, episode ends;  # = wall
     row 2:  .  .  .  .
     row 3:  S  .  .  .      S = start
   Moves are deterministic (up/down/left/right). Bumping into the wall or the edge
   leaves the agent where it is. Every other move gives reward 0. γ = 0.9.
   Optimal values: V*(s) = 0.9^(steps to goal − 1), e.g. 0.59 at the start. */
(function () {
  var LC = window.LC;
  var R = 4, C = 4, GOAL = [0, 3], PIT = [1, 3], WALL = [1, 1], START = [3, 0];
  var ACTS = [[-1, 0], [1, 0], [0, -1], [0, 1]];        // up, down, left, right
  var ARROW = ["↑", "↓", "←", "→"];
  function same(a, r, c) { return a[0] === r && a[1] === c; }
  function isWall(r, c) { return same(WALL, r, c); }
  function isTerminal(r, c) { return same(GOAL, r, c) || same(PIT, r, c); }
  function step(r, c, a) {
    var nr = r + ACTS[a][0], nc = c + ACTS[a][1];
    if (nr < 0 || nr >= R || nc < 0 || nc >= C || isWall(nr, nc)) { nr = r; nc = c; }
    var rew = same(GOAL, nr, nc) ? 1 : (same(PIT, nr, nc) ? -1 : 0);
    return { r: nr, c: nc, rew: rew, done: isTerminal(nr, nc) };
  }
  // Value iteration; returns the value table after each sweep (sweeps[0] = all zeros).
  function valueIteration(gamma, maxSweeps) {
    var V = [], sweeps = [];
    for (var r = 0; r < R; r++) { V.push([]); for (var c = 0; c < C; c++) V[r].push(0); }
    sweeps.push(V.map(function (row) { return row.slice(); }));
    for (var k = 0; k < (maxSweeps || 100); k++) {
      var N = V.map(function (row) { return row.slice(); }), delta = 0;
      for (r = 0; r < R; r++) for (c = 0; c < C; c++) {
        if (isWall(r, c) || isTerminal(r, c)) continue;
        var best = -Infinity;
        for (var a = 0; a < 4; a++) { var s = step(r, c, a); best = Math.max(best, s.rew + gamma * (s.done ? 0 : V[s.r][s.c])); }
        N[r][c] = best; delta = Math.max(delta, Math.abs(best - V[r][c]));
      }
      V = N; sweeps.push(V.map(function (row) { return row.slice(); }));
      if (delta < 1e-9) break;
    }
    return sweeps;
  }
  // Greedy actions (all ties) for a value table.
  function greedy(V, gamma, r, c) {
    var q = [0, 1, 2, 3].map(function (a) { var s = step(r, c, a); return s.rew + gamma * (s.done ? 0 : V[s.r][s.c]); });
    var m = Math.max.apply(null, q);
    return [0, 1, 2, 3].filter(function (a) { return Math.abs(q[a] - m) < 1e-9; });
  }

  /* Draw the board. Returns helpers: xy(r,c) -> {x, y, cx, cy}, cells[r][c] (rects), g. */
  function draw(parent, x0, y0, cell, opts) {
    opts = opts || {};
    var S = LC.svg, g = S("g", {}, parent), cells = [];
    function xy(r, c) { return { x: x0 + c * cell, y: y0 + r * cell, cx: x0 + c * cell + cell / 2, cy: y0 + r * cell + cell / 2 }; }
    for (var r = 0; r < R; r++) {
      cells.push([]);
      for (var c = 0; c < C; c++) {
        var p = xy(r, c), cls = "f-surface", extra = {};
        if (isWall(r, c)) cls = "f-faint";
        cells[r].push(S("rect", Object.assign({ x: p.x + 1.5, y: p.y + 1.5, width: cell - 3, height: cell - 3, rx: 6, class: cls, stroke: "var(--line)", "stroke-width": 1.5 }, extra), g));
        if (same(GOAL, r, c)) {
          S("rect", { x: p.x + 1.5, y: p.y + 1.5, width: cell - 3, height: cell - 3, rx: 6, class: "f-orange", "fill-opacity": 0.2, stroke: "var(--a-orange)", "stroke-width": 2 }, g);
          S("text", { x: p.cx, y: p.cy + (opts.goalLabel ? 0 : 5), class: "t t-mid t-orange t-nohalo", "font-weight": 700, text: "+1" }, g);
          if (opts.goalLabel) S("text", { x: p.cx, y: p.cy + 15, class: "t t-sm t-mid t-orange t-nohalo", text: "goal" }, g);
        } else if (same(PIT, r, c)) {
          S("rect", { x: p.x + 1.5, y: p.y + 1.5, width: cell - 3, height: cell - 3, rx: 6, class: "f-ink", "fill-opacity": 0.14, stroke: "var(--a-ink)", "stroke-width": 2 }, g);
          S("text", { x: p.cx, y: p.cy + (opts.goalLabel ? 0 : 5), class: "t t-mid t-nohalo", "font-weight": 700, text: "−1" }, g);
          if (opts.goalLabel) S("text", { x: p.cx, y: p.cy + 15, class: "t t-sm t-mid t-nohalo", text: "pit" }, g);
        } else if (isWall(r, c) && opts.wallLabel) {
          S("text", { x: p.cx, y: p.cy + 4, class: "t t-sm t-mid t-muted t-nohalo", text: "wall" }, g);
        }
      }
    }
    if (opts.startLabel) {
      var st = xy(START[0], START[1]);
      S("text", { x: st.x + 6, y: st.y + cell - 6, class: "t t-sm t-muted t-nohalo", text: "start" }, g);
    }
    return { g: g, xy: xy, cells: cells };
  }

  /* A small arrow (path) pointing in direction a, centred at (cx, cy), half-length h. */
  function arrowPath(cx, cy, a, h) {
    var dx = ACTS[a][1], dy = ACTS[a][0], hw = h * 0.55;
    var tx = cx + dx * h, ty = cy + dy * h, bx = cx - dx * h, by = cy - dy * h;
    var px = -dy, py = dx; // perpendicular
    return "M" + bx + " " + by + "L" + tx + " " + ty +
      "M" + (tx - dx * hw + px * hw * 0.8) + " " + (ty - dy * hw + py * hw * 0.8) + "L" + tx + " " + ty +
      "L" + (tx - dx * hw - px * hw * 0.8) + " " + (ty - dy * hw - py * hw * 0.8);
  }

  LC.rlGrid = { R: R, C: C, GOAL: GOAL, PIT: PIT, WALL: WALL, START: START, ACTS: ACTS, ARROW: ARROW,
    isWall: isWall, isTerminal: isTerminal, step: step, valueIteration: valueIteration, greedy: greedy,
    draw: draw, arrowPath: arrowPath };
})();
