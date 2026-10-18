/* P2.2 playground: gradient descent on L(θ) = θ² with a learning-rate slider.
   Update: θ ← θ − η·2θ = (1 − 2η)·θ, so η < 0.5 creeps in, 0.5 < η < 1 zig-zags in,
   η = 1 bounces forever, η > 1 blows up. */
(function () {
  var LC = window.LC;
  var T0 = 2.5, LIMIT = 4;     // start point; |θ| beyond LIMIT counts as diverged
  function L(t) { return t * t; }

  function regime(eta) {
    if (eta < 0.1) return "Tiny steps: it's heading the right way, but painfully slowly.";
    if (eta < 0.5) return "Smooth: every step goes downhill and lands closer to the bottom.";
    if (eta === 0.5) return "Lucky: on this exact bowl, η = 0.5 jumps to the bottom in one step.";
    if (eta < 1) return "Overshoots: each step jumps past the bottom, but the zig-zag still shrinks.";
    if (eta === 1) return "Stuck: it bounces between +θ and −θ forever.";
    return "Too big: every jump lands higher than the last, so it diverges.";
  }

  function init(root) {
    var stageBox = root.querySelector(".pg-stage");
    var slider = root.querySelector("input[type=range]");
    var out = root.querySelector("output");
    var readout = root.querySelector(".pg-readout");
    var hint = root.querySelector(".pg-hint");
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var thetas = [T0], diverged = false, timer = null, layout = null;
    var svg, sx, sy, pathEl, dotsG, ball, msg, W, H;

    function eta() { return parseFloat(slider.value); }

    function build() {
      layout = stageBox.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact";
      W = compact ? 360 : 640; H = compact ? 280 : 300;
      var m = compact ? { l: 36, r: 12, t: 30, b: 34 } : { l: 48, r: 20, t: 30, b: 36 };
      var X0 = -LIMIT, X1 = LIMIT, Y1 = 16;
      sx = function (t) { return m.l + ((t - X0) / (X1 - X0)) * (W - m.l - m.r); };
      sy = function (v) { return m.t + (1 - v / Y1) * (H - m.t - m.b); };
      if (svg) svg.remove();
      svg = LC.svg("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Loss curve L of theta equals theta squared, with the path gradient descent has taken. The readout below lists the current values." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "380px";
      stageBox.appendChild(svg);
      var S = LC.svg;
      [4, 8, 12].forEach(function (v) { S("line", { x1: m.l, x2: W - m.r, y1: sy(v), y2: sy(v), class: "s-grid" }, svg); });
      S("path", { d: "M" + m.l + " " + m.t + "V" + sy(0) + "H" + (W - m.r), class: "s-axis" }, svg);
      [-4, -2, 0, 2, 4].forEach(function (t) { S("text", { x: sx(t), y: sy(0) + 18, class: "t t-sm t-muted t-mid", text: t }, svg); });
      [0, 8, 16].forEach(function (v) { S("text", { x: m.l - 6, y: sy(v) + 4, class: "t t-sm t-muted t-end", text: v }, svg); });
      S("text", { x: sx(3), y: sy(0) + 18, class: "t t-sm t-muted t-mid", text: "θ →" }, svg); // between the 2 and 4 ticks
      S("text", { x: 4, y: 14, class: "t t-sm t-muted", text: "↑ L(θ) = θ²" }, svg);
      S("path", { d: LC.fnPath(L, X0, X1, sx, sy, 80), class: "s-blue" }, svg);
      pathEl = S("path", { d: "", class: "s-orange", "stroke-width": 2, opacity: 0.8 }, svg);
      dotsG = S("g", {}, svg);
      ball = S("circle", { r: compact ? 8 : 9, class: "f-orange", stroke: "var(--a-ink)", "stroke-width": 2 }, svg);
      msg = S("text", { x: W / 2, y: m.t + 28, class: "t t-lg t-orange t-mid", text: "" }, svg);
      draw();
    }

    function draw() {
      var d = "";
      while (dotsG.firstChild) dotsG.removeChild(dotsG.firstChild);
      thetas.forEach(function (t, i) {
        var c = Math.max(-LIMIT, Math.min(LIMIT, t));
        var y = sy(Math.min(16, L(c)));
        d += (i ? "L" : "M") + sx(c).toFixed(1) + " " + y.toFixed(1);
        if (i < thetas.length - 1) LC.svg("circle", { cx: sx(c), cy: y, r: 3.5, class: "f-ink", opacity: 0.55 }, dotsG);
      });
      pathEl.setAttribute("d", d);
      var last = Math.max(-LIMIT, Math.min(LIMIT, thetas[thetas.length - 1]));
      ball.setAttribute("cx", sx(last)); ball.setAttribute("cy", sy(Math.min(16, L(last))));
      msg.textContent = diverged ? "diverged!" : (Math.abs(thetas[thetas.length - 1]) < 0.01 ? "converged ✓" : "");
      var t = thetas[thetas.length - 1];
      readout.textContent = "step " + (thetas.length - 1) + " · θ = " + (diverged ? "|θ| > " + LIMIT : t.toFixed(3)) +
        " · L(θ) = " + (diverged ? "> " + LIMIT * LIMIT : L(t).toFixed(3)) + " · η = " + eta().toFixed(2);
    }

    function step() {
      if (diverged) return false;
      var t = thetas[thetas.length - 1];
      var next = t - eta() * 2 * t;
      thetas.push(next);
      if (Math.abs(next) > LIMIT) diverged = true;
      draw();
      return !diverged;
    }
    function stopRun() { clearInterval(timer); timer = null; }
    function run(n) {
      stopRun();
      if (reduce) { for (var i = 0; i < n; i++) if (!step()) break; return; }
      var k = 0;
      timer = setInterval(function () { if (!step() || ++k >= n) stopRun(); }, 140);
    }
    function reset() { stopRun(); thetas = [T0]; diverged = false; draw(); }

    function onEta() {
      var v = Math.round(eta() * 100) / 100;
      out.textContent = v.toFixed(2);
      hint.textContent = regime(v);
      root.querySelectorAll("[data-eta]").forEach(function (c) { c.setAttribute("aria-pressed", String(parseFloat(c.dataset.eta) === v)); });
      reset();
    }
    slider.addEventListener("input", onEta);
    root.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.eta) { slider.value = b.dataset.eta; onEta(); }
      else if (b.dataset.act === "step") { stopRun(); step(); }
      else if (b.dataset.act === "run") run(20);
      else if (b.dataset.act === "reset") reset();
    });

    build();
    onEta();
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        var want = stageBox.clientWidth < 560 ? "compact" : "wide";
        if (want !== layout) build();
      }).observe(stageBox);
    }
  }

  document.addEventListener("lc:ready", function () {
    var root = document.getElementById("gd-playground");
    if (root) init(root);
  });
})();
