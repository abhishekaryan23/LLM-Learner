/* RL.3 playground: tabular Q-learning on the module gridworld.
   Q(s,a) ← Q(s,a) + α [r + γ max_a' Q(s',a') − Q(s,a)], α = 0.5, γ = 0.9,
   ε-greedy behaviour (ties broken at random), episodes start bottom-left, cap 200 moves.
   Each cell shows max_a Q(s,a) and the greedy arrow; the readout compares the greedy
   policy with the optimal one from value iteration. */
(function () {
  var LC = window.LC;
  var ALPHA = 0.5, GAMMA = 0.9, CAP = 200;

  function init(root) {
    var GW = LC.rlGrid;
    var stage = root.querySelector(".pg-stage");
    var slider = root.querySelector("input[type=range]");
    var out = root.querySelector("output");
    var readout = root.querySelector(".pg-readout");
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var VSTAR = GW.valueIteration(GAMMA, 50).pop();
    var Q, episodes, last, trail, robot, layout = null, timer = null;

    function reset() {
      stop();
      Q = []; for (var i = 0; i < 16; i++) Q.push([0, 0, 0, 0]);
      episodes = 0; last = null; trail = []; robot = null;
      draw();
    }
    function eps() { return Math.round(parseFloat(slider.value) * 100) / 100; }
    function argmaxes(q) { var m = Math.max.apply(null, q), o = []; for (var a = 0; a < 4; a++) if (q[a] === m) o.push(a); return o; }
    function act(s) {
      if (Math.random() < eps()) return Math.floor(Math.random() * 4);
      var b = argmaxes(Q[s]); return b[Math.floor(Math.random() * b.length)];
    }
    // one environment step + Q update; returns the transition
    function stepFrom(r, c) {
      var s = r * 4 + c, a = act(s), n = GW.step(r, c, a);
      var target = n.rew + (n.done ? 0 : GAMMA * Math.max.apply(null, Q[n.r * 4 + n.c]));
      Q[s][a] += ALPHA * (target - Q[s][a]);
      return n;
    }
    function runEpisode(record) {
      var r = GW.START[0], c = GW.START[1], G = 0, k = 0, path = [[r, c]];
      while (k < CAP) {
        var n = stepFrom(r, c);
        G += Math.pow(GAMMA, k) * n.rew; k++;
        r = n.r; c = n.c; if (record) path.push([r, c]);
        if (n.done) break;
      }
      episodes++;
      last = { steps: k, G: G, end: GW.isTerminal(r, c) ? (r === GW.GOAL[0] && c === GW.GOAL[1] ? "goal" : "pit") : "cap" };
      return path;
    }
    function matches() {
      var ok = 0, tot = 0;
      for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) {
        if (GW.isWall(r, c) || GW.isTerminal(r, c)) continue;
        tot++;
        var b = argmaxes(Q[r * 4 + c]);
        if (b.length < 4) {
          var opt = GW.greedy(VSTAR, GAMMA, r, c);
          if (b.every(function (a) { return opt.indexOf(a) >= 0; })) ok++;
        }
      }
      return [ok, tot];
    }

    function draw() {
      layout = stage.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact", S = LC.svg;
      var W = compact ? 360 : 640, H = 304, cell = 72, gx = compact ? 36 : 36, gy = 8;
      var svg = S("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Gridworld with the learned best Q-value and greedy action in each cell after " + episodes + " episodes." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "360px";
      var board = GW.draw(svg, gx, gy, cell, { goalLabel: true });
      for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) {
        if (GW.isWall(r, c) || GW.isTerminal(r, c)) continue;
        var p = board.xy(r, c), q = Q[r * 4 + c], m = Math.max.apply(null, q), b = argmaxes(q);
        if (m > 0) S("rect", { x: p.x + 1.5, y: p.y + 1.5, width: cell - 3, height: cell - 3, rx: 6, class: "f-blue", "fill-opacity": (0.06 + 0.5 * Math.min(1, m)).toFixed(3) }, svg);
        S("text", { x: p.cx, y: p.cy - 8, class: "t t-mono t-mid t-nohalo" + (m === 0 && b.length === 4 ? " t-muted" : ""), text: (m < 0 ? "−" : "") + Math.abs(m).toFixed(2) }, svg);
        if (b.length < 4) {
          var sx = 0, sy = 0;
          b.forEach(function (a) { sx += GW.ACTS[a][1]; sy += GW.ACTS[a][0]; });
          var ox = p.cx - 7 * sx, oy = p.cy + 17 - 6 * sy;
          if (b.length === 1 && sy === 0) oy = p.cy + 18;
          b.forEach(function (a) {
            var dx = GW.ACTS[a][1], dy = GW.ACTS[a][0], L = 14, tx = ox + dx * L, ty = oy + dy * L;
            S("path", { d: "M" + ox + " " + oy + "L" + tx + " " + ty + "M" + (tx - dx * 5 - dy * 4) + " " + (ty - dy * 5 - dx * 4) + "L" + tx + " " + ty + "L" + (tx - dx * 5 + dy * 4) + " " + (ty - dy * 5 + dx * 4), class: "s-orange", "stroke-width": 2.5 }, svg);
          });
        }
      }
      if (trail.length > 1) {
        var d = trail.map(function (rc, i) { var p = board.xy(rc[0], rc[1]); return (i ? "L" : "M") + (p.x + 11) + " " + (p.y + 10); }).join("");
        S("path", { d: d, class: "s-ink", "stroke-width": 1.5, "stroke-opacity": 0.45 }, svg);
      }
      if (robot) { var rp = board.xy(robot[0], robot[1]); S("circle", { cx: rp.x + 11, cy: rp.y + 10, r: 6, class: "f-orange", stroke: "var(--a-ink)", "stroke-width": 1.5 }, svg); }
      var mt = matches();
      if (!compact) {
        var px = 360;
        S("text", { x: px, y: 40, class: "t t-sm t-muted", text: "episodes played" }, svg);
        S("text", { x: px, y: 68, class: "t t-lg", text: String(episodes) }, svg);
        S("text", { x: px, y: 110, class: "t t-sm t-muted", text: "greedy arrows that are optimal" }, svg);
        S("text", { x: px, y: 138, class: "t t-lg", text: mt[0] + " of " + mt[1] + " cells" }, svg);
        S("text", { x: px, y: 180, class: "t t-sm t-muted", text: "last episode" }, svg);
        S("text", { x: px, y: 206, class: "t t-lg", text: last ? last.steps + " moves → " + last.end : "–" }, svg);
        S("text", { x: px, y: 250, class: "t t-sm t-muted", text: "α = 0.5 · γ = 0.9 · cap 200 moves" }, svg);
      }
      stage.innerHTML = ""; stage.appendChild(svg);
      var msg = "Episodes: " + episodes + " · optimal greedy arrows: " + mt[0] + "/" + mt[1] + ".";
      if (last) msg += " Last episode: " + last.steps + " moves, ended " + (last.end === "cap" ? "at the 200-move cap" : "in the " + last.end) + ", return " + last.G.toFixed(2) + ".";
      else msg += " Every Q starts at 0, so the first episode is a random walk.";
      readout.textContent = msg;
    }

    function stop() { clearInterval(timer); timer = null; }
    function animateEpisode() {
      stop();
      if (reduce) { trail = runEpisode(true); robot = null; draw(); return; }
      var r = GW.START[0], c = GW.START[1], G = 0, k = 0;
      trail = [[r, c]]; robot = [r, c];
      timer = setInterval(function () {
        var n = stepFrom(r, c); G += Math.pow(GAMMA, k) * n.rew; k++;
        r = n.r; c = n.c; trail.push([r, c]); robot = [r, c];
        if (n.done || k >= CAP) {
          stop(); episodes++; robot = null;
          last = { steps: k, G: G, end: n.done ? (n.rew > 0 ? "goal" : "pit") : "cap" };
        }
        draw();
      }, 70);
    }

    root.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.act === "one") animateEpisode();
      else if (b.dataset.act === "many") { stop(); for (var i = 0; i < 49; i++) runEpisode(false); trail = runEpisode(true); robot = null; draw(); }
      else if (b.dataset.act === "reset") reset();
    });
    slider.addEventListener("input", function () { out.textContent = eps().toFixed(2); });
    out.textContent = eps().toFixed(2);
    reset();
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        var want = stage.clientWidth < 560 ? "compact" : "wide";
        if (want !== layout) draw();
      }).observe(stage);
    }
  }

  document.addEventListener("lc:ready", function () {
    var root = document.getElementById("qlearn-playground");
    if (root && LC.rlGrid) init(root);
  });
})();
