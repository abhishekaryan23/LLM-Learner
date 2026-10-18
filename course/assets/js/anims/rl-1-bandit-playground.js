/* RL.1 playground: a four-armed Bernoulli bandit. Arm k pays 1 with probability P[k]
   (hidden until revealed), else 0. Estimates are sample averages Q = total / pulls.
   The ε-greedy agent continues from the learner's estimates: with probability ε it pulls
   a random arm, otherwise the arm with the highest Q (ties broken at random).
   Calibration (2,000 simulated runs of 500 pulls from scratch): ε = 0 averages ≈ 0.54,
   ε = 0.1 ≈ 0.65, ε = 1 ≈ 0.475 (the mean of the four arms); the best arm pays 0.70. */
(function () {
  var LC = window.LC;
  var P = [0.25, 0.55, 0.40, 0.70], NAMES = ["A", "B", "C", "D"];

  function hintFor(e) {
    if (e === 0) return "ε = 0 is pure greedy: it never explores, so an early lucky streak can lock it onto a mediocre arm for good.";
    if (e <= 0.2) return "Small ε: mostly exploit the current favourite, sometimes explore. Usually finds the best arm and keeps the average high.";
    if (e < 1) return "Large ε: lots of exploring. The estimates get accurate, but many pulls are wasted on arms it already knows are worse.";
    return "ε = 1 is pure random: the average settles near 0.475, the mean of all four arms.";
  }

  function init(root) {
    var stage = root.querySelector(".pg-stage");
    var slider = root.querySelector("input[type=range]");
    var out = root.querySelector("output");
    var readout = root.querySelector(".pg-readout");
    var hint = root.querySelector(".pg-hint");
    var revealBtn = root.querySelector("[data-act=reveal]");
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var N, T, hist, revealed = false, layout = null, timer = null, agentRun = null;

    function reset() {
      stopRun();
      N = [0, 0, 0, 0]; T = [0, 0, 0, 0]; hist = []; agentRun = null;
      draw("Pull some arms yourself, or let the agent play.");
    }
    function Q(k) { return N[k] ? T[k] / N[k] : 0; }
    function pull(k) {
      var r = Math.random() < P[k] ? 1 : 0;
      N[k]++; T[k] += r;
      var prev = hist.length ? hist[hist.length - 1] : 0, n = hist.length + 1;
      hist.push(prev + (r - prev) / n);   // running average reward
      return r;
    }
    function agentPick(eps) {
      if (Math.random() < eps) return { k: Math.floor(Math.random() * 4), explore: true };
      var m = Math.max(Q(0), Q(1), Q(2), Q(3)), best = [];
      for (var k = 0; k < 4; k++) if (Q(k) === m) best.push(k);
      return { k: best[Math.floor(Math.random() * best.length)], explore: false };
    }
    function eps() { return Math.round(parseFloat(slider.value) * 100) / 100; }

    function draw(msg) {
      layout = stage.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact", S = LC.svg;
      var W = compact ? 360 : 640, H = compact ? 372 : 262;
      var svg = S("svg", { viewBox: "0 0 " + W + " " + H, role: "img",
        "aria-label": "Estimated value of each arm and the running average reward. " + NAMES.map(function (n, k) { return n + ": " + Q(k).toFixed(2) + " from " + N[k] + " pulls"; }).join(", ") });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "320px";

      // --- bars: estimated value per arm
      var B = compact ? { x0: 34, x1: 350, top: 44, base: 164, title: 16 } : { x0: 40, x1: 300, top: 50, base: 172, title: 18 };
      var colW = (B.x1 - B.x0) / 4, bw = Math.min(46, colW * 0.5), bh = B.base - B.top;
      S("text", { x: 4, y: B.title, class: "t t-sm t-muted", text: "estimated value Q (average payout)" }, svg);
      S("path", { d: "M" + B.x0 + " " + B.base + "H" + B.x1, class: "s-axis" }, svg);
      [0, 1].forEach(function (v) { S("text", { x: B.x0 - 6, y: B.base - v * bh + 4, class: "t t-sm t-muted t-end", text: v }, svg); });
      S("line", { x1: B.x0, x2: B.x1, y1: B.top, y2: B.top, class: "s-grid" }, svg);
      var mQ = Math.max(Q(0), Q(1), Q(2), Q(3));
      for (var k = 0; k < 4; k++) {
        var cx = B.x0 + colW * (k + 0.5), h = Q(k) * bh, fav = N[k] && Q(k) === mQ;
        if (h > 0.5) S("rect", { x: cx - bw / 2, y: B.base - h, width: bw, height: h, rx: 3, class: fav ? "f-orange" : "f-blue", "fill-opacity": fav ? 0.9 : 0.6 }, svg);
        if (revealed) S("line", { x1: cx - bw / 2 - 5, x2: cx + bw / 2 + 5, y1: B.base - P[k] * bh, y2: B.base - P[k] * bh, class: "s-ink", "stroke-width": 2.5, "stroke-dasharray": "4 3" }, svg);
        S("text", { x: cx, y: B.base - Math.max(h, revealed ? P[k] * bh : 0) - 8, class: "t t-sm t-mono t-mid", text: N[k] ? Q(k).toFixed(2) : "?" }, svg);
        S("text", { x: cx, y: B.base + 18, class: "t t-mid", "font-weight": 650, text: NAMES[k] }, svg);
        S("text", { x: cx, y: B.base + 35, class: "t t-sm t-mid t-muted", text: N[k] + (compact ? "×" : " pulls") }, svg);
        if (revealed) S("text", { x: cx, y: B.base + 52, class: "t t-sm t-mid", text: "true " + P[k].toFixed(2).replace(/^0/, "") }, svg);
      }

      // --- running average reward
      var C = compact ? { x0: 34, x1: 350, top: 262, base: 336, title: 246 } : { x0: 372, x1: 626, top: 44, base: 172, title: 18 };
      var ch = C.base - C.top, n = hist.length, xmax = Math.max(100, Math.ceil(n / 100) * 100);
      S("text", { x: compact ? 4 : C.x0 - 26, y: C.title, class: "t t-sm t-muted", text: "running average reward" }, svg);
      if (revealed) S("text", { x: C.x1, y: C.title, class: "t t-sm t-end", text: "- - best arm 0.70" }, svg);
      S("path", { d: "M" + C.x0 + " " + C.top + "V" + C.base + "H" + C.x1, class: "s-axis" }, svg);
      [0, 1].forEach(function (v) { S("text", { x: C.x0 - 6, y: C.base - v * ch + 4, class: "t t-sm t-muted t-end", text: v }, svg); });
      S("text", { x: C.x0, y: C.base + 18, class: "t t-sm t-muted t-mid", text: "0" }, svg);
      S("text", { x: C.x1, y: C.base + 18, class: "t t-sm t-muted t-end", text: xmax + " pulls" }, svg);
      if (revealed) S("line", { x1: C.x0, x2: C.x1, y1: C.base - 0.7 * ch, y2: C.base - 0.7 * ch, class: "s-ink", "stroke-width": 1.5, "stroke-dasharray": "5 4" }, svg);
      if (n) {
        var d = "", stepN = Math.max(1, Math.floor(n / 300));
        for (var i = 0; i < n; i += stepN) d += (i ? "L" : "M") + (C.x0 + (i + 1) / xmax * (C.x1 - C.x0)).toFixed(1) + " " + (C.base - hist[i] * ch).toFixed(1);
        d += "L" + (C.x0 + n / xmax * (C.x1 - C.x0)).toFixed(1) + " " + (C.base - hist[n - 1] * ch).toFixed(1);
        S("path", { d: d, class: "s-orange", "stroke-width": 2.5 }, svg);
      }
      stage.innerHTML = ""; stage.appendChild(svg);

      var tot = T.reduce(function (a, b) { return a + b; }, 0), pulls = N.reduce(function (a, b) { return a + b; }, 0);
      var line = "Pulls: " + pulls + " · total reward " + tot + " · average " + (pulls ? (tot / pulls).toFixed(2) : "–") + ".";
      if (msg) line += " " + msg;
      readout.textContent = line;
    }

    function stopRun() { clearInterval(timer); timer = null; }
    function runAgent(count) {
      stopRun();
      var e = eps(), done = 0, explored = 0, reward = 0;
      function one() {
        var pk = agentPick(e); if (pk.explore) explored++;
        reward += pull(pk.k); done++;
      }
      function report() {
        return "Agent (ε = " + e.toFixed(2) + "): " + done + " pulls, " + explored + " of them exploring, average reward " + (reward / done).toFixed(2) +
          (revealed ? " (best possible ≈ 0.70)." : ". Reveal the odds to compare.");
      }
      if (reduce) { for (var i = 0; i < count; i++) one(); draw(report()); return; }
      timer = setInterval(function () {
        for (var j = 0; j < 4 && done < count; j++) one();
        draw(report());
        if (done >= count) stopRun();
      }, 30);
    }

    root.addEventListener("click", function (ev) {
      var b = ev.target.closest("button"); if (!b) return;
      if (b.dataset.arm != null) {
        stopRun();
        var k = +b.dataset.arm, r = pull(k);
        draw("Arm " + NAMES[k] + " paid " + r + ". Its estimate is now " + Q(k).toFixed(2) + " from " + N[k] + (N[k] === 1 ? " pull." : " pulls."));
      } else if (b.dataset.act === "run") runAgent(100);
      else if (b.dataset.act === "reveal") {
        revealed = !revealed;
        revealBtn.setAttribute("aria-pressed", String(revealed));
        revealBtn.textContent = revealed ? "Hide true odds" : "Reveal true odds";
        draw(revealed ? "True payout odds: A .25, B .55, C .40, D .70." : "");
      } else if (b.dataset.act === "reset") reset();
    });
    slider.addEventListener("input", function () {
      out.textContent = eps().toFixed(2);
      hint.textContent = hintFor(eps());
    });

    out.textContent = eps().toFixed(2);
    hint.textContent = hintFor(eps());
    reset();
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        var want = stage.clientWidth < 560 ? "compact" : "wide";
        if (want !== layout) draw();
      }).observe(stage);
    }
  }

  document.addEventListener("lc:ready", function () {
    var root = document.getElementById("bandit-playground");
    if (root) init(root);
  });
})();
