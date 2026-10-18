/* RL.2 playground: the discount factor γ. Runs value iteration to convergence on the
   module gridworld for the chosen γ and draws V*(s) plus the greedy arrows (ties drawn).
   With deterministic moves V*(s) = γ^(d−1), d = moves to the goal; at γ = 1 every
   non-pit move is optimal because waiting costs nothing. */
(function () {
  var LC = window.LC;

  function init(root) {
    var GW = LC.rlGrid;
    var stage = root.querySelector(".pg-stage");
    var slider = root.querySelector("input[type=range]");
    var out = root.querySelector("output");
    var readout = root.querySelector(".pg-readout");
    var layout = null;

    function gamma() { return Math.round(parseFloat(slider.value) * 100) / 100; }

    function draw() {
      layout = stage.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact", S = LC.svg, g = gamma();
      var W = compact ? 360 : 640, H = compact ? 304 : 304, cell = 72, gx = compact ? 36 : 36, gy = 8;
      var sweeps = GW.valueIteration(g, 500), V = sweeps[sweeps.length - 1];
      var svg = S("svg", { viewBox: "0 0 " + W + " " + H, role: "img",
        "aria-label": "Converged values and greedy policy for gamma " + g.toFixed(2) + ". The value of the start cell is " + V[3][0].toFixed(3) + "." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "360px";
      var board = GW.draw(svg, gx, gy, cell, { goalLabel: true });
      var ties = 0;
      for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) {
        if (GW.isWall(r, c) || GW.isTerminal(r, c)) continue;
        var p = board.xy(r, c), v = V[r][c];
        S("rect", { x: p.x + 1.5, y: p.y + 1.5, width: cell - 3, height: cell - 3, rx: 6, class: "f-blue", "fill-opacity": (0.06 + 0.5 * v).toFixed(3) }, svg);
        S("text", { x: p.cx, y: p.cy - 8, class: "t t-mono t-mid t-nohalo", text: v.toFixed(2) }, svg);
        var best = GW.greedy(V, g, r, c), sx = 0, sy = 0;
        if (best.length > 1) ties++;
        best.forEach(function (a) { sx += GW.ACTS[a][1]; sy += GW.ACTS[a][0]; });
        var ox = p.cx - 7 * sx, oy = p.cy + 17 - 6 * sy;
        if (best.length === 1 && sy === 0) oy = p.cy + 18;
        best.forEach(function (a) {
          var dx = GW.ACTS[a][1], dy = GW.ACTS[a][0], L = 14, tx = ox + dx * L, ty = oy + dy * L;
          S("path", { d: "M" + ox + " " + oy + "L" + tx + " " + ty + "M" + (tx - dx * 5 - dy * 4) + " " + (ty - dy * 5 - dx * 4) + "L" + tx + " " + ty + "L" + (tx - dx * 5 + dy * 4) + " " + (ty - dy * 5 + dx * 4), class: "s-orange", "stroke-width": 2.5 }, svg);
        });
      }
      if (!compact) {
        var px = 360;
        S("text", { x: px, y: 40, class: "t t-sm t-muted", text: "value of the start cell" }, svg);
        S("text", { x: px, y: 68, class: "t t-lg", text: "V(start) = " + V[3][0].toFixed(3) }, svg);
        S("text", { x: px, y: 110, class: "t t-sm t-muted", text: "rough look-ahead 1/(1 − γ)" }, svg);
        S("text", { x: px, y: 136, class: "t t-lg", text: g >= 1 ? "unlimited" : "≈ " + (1 / (1 - g)).toFixed(g > 0.95 ? 0 : 1) + " steps" }, svg);
        S("text", { x: px, y: 178, class: "t t-sm t-muted", text: "sweeps until converged" }, svg);
        S("text", { x: px, y: 204, class: "t t-lg", text: String(sweeps.length - 2) }, svg);
      }
      stage.innerHTML = ""; stage.appendChild(svg);
      var msg = "γ = " + g.toFixed(2) + " · V(start) = " + V[3][0].toFixed(3) + " (= γ⁵). ";
      if (g >= 1) msg += "With γ = 1 and no cost per move, a long route is worth exactly as much as a short one, so almost every move ties: the agent has no reason to hurry. Real tasks add a small cost per step or keep γ below 1.";
      else if (g < 0.5) msg += "Small γ: values shrink fast with distance, so far-away cells barely see the goal (the arrows still point the right way, but the values are tiny).";
      else if (g < 0.95) msg += "Each extra step back multiplies the value by γ. Shorter paths win, so the arrows take a shortest route" + (ties ? " (" + ties + " cells have two equally short routes)." : ".");
      else msg += "γ near 1: far-sighted. Values stay high even far from the goal, and value iteration needs more sweeps to settle in larger worlds.";
      readout.textContent = msg;
      out.textContent = g.toFixed(2);
      root.querySelectorAll("[data-gamma]").forEach(function (b) { b.setAttribute("aria-pressed", String(parseFloat(b.dataset.gamma) === g)); });
    }

    slider.addEventListener("input", draw);
    root.addEventListener("click", function (e) {
      var b = e.target.closest("[data-gamma]"); if (!b) return;
      slider.value = b.dataset.gamma; draw();
    });
    draw();
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        var want = stage.clientWidth < 560 ? "compact" : "wide";
        if (want !== layout) draw();
      }).observe(stage);
    }
  }

  document.addEventListener("lc:ready", function () {
    var root = document.getElementById("gamma-playground");
    if (root && LC.rlGrid) init(root);
  });
})();
