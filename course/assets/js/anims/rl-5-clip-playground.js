/* RL.5 playground: PPO's clipped surrogate for one token,
   L(ρ) = min(ρ·A, clip(ρ, 1 − ε, 1 + ε)·A), ε = 0.2, as the ratio ρ = π_new/π_old varies.
   The objective's slope in ρ is A where the unclipped term is the min, 0 where it is clipped. */
(function () {
  var LC = window.LC;
  var EPS = 0.2, R0 = 0.5, R1 = 1.5;
  function clip(r) { return Math.max(1 - EPS, Math.min(1 + EPS, r)); }
  function obj(r, A) { return Math.min(r * A, clip(r) * A); }
  function f2(v) { return (v < 0 ? "−" : "") + Math.abs(v).toFixed(2); }

  function init(root) {
    var stage = root.querySelector(".pg-stage");
    var slider = root.querySelector("input[type=range]");
    var out = root.querySelector("output");
    var readout = root.querySelector(".pg-readout");
    var A = 1, layout = null;

    function rho() { return Math.round(parseFloat(slider.value) * 100) / 100; }

    function draw() {
      layout = stage.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact", S = LC.svg, r = rho();
      var W = compact ? 360 : 640, H = compact ? 262 : 262;
      var m = compact ? { l: 46, r: 14, t: 52, b: 38 } : { l: 60, r: 30, t: 52, b: 38 };
      var lo = A > 0 ? 0.4 : -1.6, hi = A > 0 ? 1.6 : -0.4;
      var sx = function (x) { return m.l + (x - R0) / (R1 - R0) * (W - m.l - m.r); };
      var sy = function (y) { return m.t + (hi - y) / (hi - lo) * (H - m.t - m.b); };
      var svg = S("svg", { viewBox: "0 0 " + W + " " + H, role: "img",
        "aria-label": "PPO clipped objective for advantage " + (A > 0 ? "plus one" : "minus one") + " at ratio " + r.toFixed(2) + ": " + f2(obj(r, A)) });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "320px";
      // trust region band
      S("rect", { x: sx(1 - EPS), y: m.t, width: sx(1 + EPS) - sx(1 - EPS), height: H - m.t - m.b, class: "f-blue", "fill-opacity": 0.08 }, svg);
      S("text", { x: 4, y: 16, class: "t t-sm t-muted", text: "objective for this token (A = " + (A > 0 ? "+1" : "−1") + ")" }, svg);
      S("text", { x: W - m.r, y: 16, class: "t t-sm t-blue t-end", text: compact ? "band: 0.8–1.2" : "shaded: 1 ± ε = 0.8 to 1.2" }, svg);
      S("path", { d: "M" + m.l + " " + m.t + "V" + (H - m.b) + "H" + (W - m.r), class: "s-axis" }, svg);
      [0.5, 0.8, 1, 1.2, 1.5].forEach(function (x) { S("text", { x: sx(x), y: H - m.b + 18, class: "t t-sm t-muted t-mid", text: x === 1 ? "1.0" : String(x) }, svg); });
      S("text", { x: W - m.r, y: H - 4, class: "t t-sm t-muted t-end", text: "ratio ρ →" }, svg);
      var yt = A > 0 ? [0.5, 1, 1.5] : [-1.5, -1, -0.5];
      yt.forEach(function (v) {
        S("line", { x1: m.l, x2: W - m.r, y1: sy(v), y2: sy(v), class: "s-grid" }, svg);
        S("text", { x: m.l - 6, y: sy(v) + 4, class: "t t-sm t-muted t-end", text: f2(v).replace(".00", "").replace(/0$/, "") }, svg);
      });
      // unclipped ρA (faint) and PPO's min (orange)
      S("path", { d: LC.fnPath(function (x) { return x * A; }, R0, R1, sx, sy, 2), class: "s-ink", "stroke-width": 2, "stroke-dasharray": "6 5", "stroke-opacity": 0.6 }, svg);
      S("path", { d: LC.fnPath(function (x) { return obj(x, A); }, R0, R1, sx, sy, 100), class: "s-orange", "stroke-width": 3.5 }, svg);
      // legend row (kept out of the plot so the moving marker never crosses a label)
      S("path", { d: "M4 31H24", class: "s-orange", "stroke-width": 3.5 }, svg);
      S("text", { x: 30, y: 35, class: "t t-sm", text: "PPO objective" }, svg);
      S("path", { d: "M128 31H148", class: "s-ink", "stroke-width": 2, "stroke-dasharray": "6 5", "stroke-opacity": 0.6 }, svg);
      S("text", { x: 154, y: 35, class: "t t-sm t-muted", text: "ρ·A, no clip" }, svg);
      // current point
      S("line", { x1: sx(r), x2: sx(r), y1: m.t, y2: H - m.b, class: "s-ink", "stroke-width": 1.5, "stroke-opacity": 0.5 }, svg);
      S("circle", { cx: sx(r), cy: sy(obj(r, A)), r: 7, class: "f-orange", stroke: "var(--a-ink)", "stroke-width": 2 }, svg);
      stage.innerHTML = ""; stage.appendChild(svg);

      var plain = r * A, clipped = clip(r) * A, o = Math.min(plain, clipped);
      var flat = clipped < plain - 1e-9;
      var msg = "ρ = " + r.toFixed(2) + " · ρA = " + f2(plain) + " · clip(ρ)·A = " + f2(clipped) + " · objective = min = " + f2(o) + ". ";
      if (flat) msg += A > 0
        ? "Clipped: the token's probability already rose " + Math.round((r - 1) * 100) + "%, past the 20% limit, so the gradient is 0. No further push this update."
        : "Clipped: the token's probability already fell " + Math.round((1 - r) * 100) + "%, past the 20% limit, so the gradient is 0. No further push this update.";
      else if (A > 0 && r < 1 - EPS) msg += "Not clipped: the probability has dropped although the token was good. The min keeps the full gradient to pull it back up.";
      else if (A < 0 && r > 1 + EPS) msg += "Not clipped: the probability has risen although the token was bad. The min keeps the full (pessimistic) gradient to push it back down.";
      else msg += "Inside the band: ordinary policy-gradient push, slope A = " + (A > 0 ? "+1" : "−1") + (A > 0 ? " (raise this token)." : " (lower this token).");
      readout.textContent = msg;
      out.textContent = r.toFixed(2);
      root.querySelectorAll("[data-adv]").forEach(function (b) { b.setAttribute("aria-pressed", String(+b.dataset.adv === A)); });
    }

    slider.addEventListener("input", draw);
    root.addEventListener("click", function (e) {
      var b = e.target.closest("[data-adv]"); if (!b) return;
      A = +b.dataset.adv; draw();
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
    var root = document.getElementById("clip-playground");
    if (root) init(root);
  });
})();
