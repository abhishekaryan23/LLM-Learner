/* M4.5 playground: online Elo vs a Bradley–Terry fit on the same battles.
   Model A is truly 100 Elo points stronger than B, so it wins each battle with
   p = 1/(1+10^(-100/400)) ≈ 0.64. Both start at 1500. Online Elo moves the gap by
   2K(S − E) per battle (each side moves K(S − E)). For two models, the Bradley–Terry
   maximum-likelihood gap is 400·log10(wins / losses): it uses every vote at once and
   ignores their order. */
(function () {
  var LC = window.LC;
  var N = 400, TRUE_GAP = 100, YMIN = -100, YMAX = 300;
  var PWIN = 1 / (1 + Math.pow(10, -TRUE_GAP / 400));

  function rng(seed) { // mulberry32
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function init(root) {
    var stageBox = root.querySelector(".pg-stage");
    var slider = root.querySelector("input[type=range]");
    var out = root.querySelector("output");
    var readout = root.querySelector(".pg-readout");
    var seed = 7, outcomes = [], layout = null, svg, parts = {};

    function newBattles() {
      var r = rng(seed++);
      outcomes = [];
      for (var i = 0; i < N; i++) outcomes.push(r() < PWIN ? 1 : 0);
    }
    function shuffle() {
      var r = rng(seed++ * 7919);
      for (var i = outcomes.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = outcomes[i]; outcomes[i] = outcomes[j]; outcomes[j] = t; }
    }

    function build() {
      layout = stageBox.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact";
      var W = compact ? 360 : 640, H = compact ? 290 : 270;
      var m = compact ? { l: 40, r: 12, t: 66, b: 40 } : { l: 48, r: 20, t: 46, b: 40 };
      var sx = function (i) { return m.l + (i / N) * (W - m.l - m.r); };
      var sy = function (g) { return m.t + (1 - (g - YMIN) / (YMAX - YMIN)) * (H - m.t - m.b); };
      if (svg) svg.remove();
      svg = LC.svg("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Estimated rating gap between A and B after each battle: the online Elo path, the Bradley–Terry estimate from all battles, and the true gap of 100. The readout below gives the numbers." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "360px";
      stageBox.appendChild(svg);
      var S = LC.svg;
      [0, 100, 200].forEach(function (g) { S("line", { x1: m.l, x2: W - m.r, y1: sy(g), y2: sy(g), class: "s-grid" }, svg); });
      S("path", { d: "M" + m.l + " " + m.t + "V" + (H - m.b) + "H" + (W - m.r), class: "s-axis" }, svg);
      [-100, 0, 100, 200, 300].forEach(function (g) { S("text", { x: m.l - 6, y: sy(g) + 4, class: "t t-sm t-muted t-end", text: g < 0 ? "−" + -g : g }, svg); });
      [0, 100, 200, 300, 400].forEach(function (i) { S("text", { x: sx(i), y: H - m.b + 18, class: "t t-sm t-muted t-mid", text: i }, svg); });
      S("text", { x: W - m.r, y: H - 4, class: "t t-sm t-muted t-end", text: "battle →" }, svg);
      // legend rows (kept above the plot so they never sit on a line)
      var ly1 = 14, ly2 = compact ? 32 : 14;
      function key(x, y, cls, dash, label, tcls) {
        var a = { x1: x, x2: x + 18, y1: y - 4, y2: y - 4, class: cls, "stroke-width": 2.5 };
        if (dash) a["stroke-dasharray"] = dash;
        S("line", a, svg);
        S("text", { x: x + 24, y: y, class: "t t-sm " + (tcls || ""), text: label }, svg);
      }
      key(4, ly1, "s-blue", null, "online Elo gap", "t-blue");
      key(compact ? 150 : 150, ly1, "s-orange", "6 4", "BT on all battles", "t-orange");
      key(compact ? 4 : 300, ly2, "s-ink", "2 4", "true gap = 100");
      S("text", { x: 4, y: compact ? 50 : 36, class: "t t-sm t-muted", text: "↑ estimated gap (Elo points)" }, svg);
      S("line", { x1: m.l, x2: W - m.r, y1: sy(TRUE_GAP), y2: sy(TRUE_GAP), class: "s-ink", "stroke-dasharray": "2 4", "stroke-width": 2 }, svg);
      parts.bt = S("line", { x1: m.l, x2: W - m.r, class: "s-orange", "stroke-dasharray": "6 4", "stroke-width": 2.5 }, svg);
      parts.elo = S("path", { class: "s-blue", style: "stroke-width:2" }, svg);
      parts.sx = sx; parts.sy = sy;
      draw();
    }

    function clampY(g) { return Math.max(YMIN, Math.min(YMAX, g)); }
    function draw() {
      var K = parseFloat(slider.value), g = 0, d = "M" + parts.sx(0).toFixed(1) + " " + parts.sy(0).toFixed(1);
      outcomes.forEach(function (s, i) {
        var e = 1 / (1 + Math.pow(10, -g / 400));
        g += 2 * K * (s - e);
        d += "L" + parts.sx(i + 1).toFixed(1) + " " + parts.sy(clampY(g)).toFixed(1);
      });
      parts.elo.setAttribute("d", d);
      var w = outcomes.reduce(function (a, b) { return a + b; }, 0);
      var bt = 400 * Math.log10(w / (N - w));
      parts.bt.setAttribute("y1", parts.sy(clampY(bt))); parts.bt.setAttribute("y2", parts.sy(clampY(bt)));
      out.textContent = K;
      readout.textContent = "A won " + w + " of " + N + " · Elo ends at " + Math.round(g) + " · BT says " + Math.round(bt) + " · true 100";
    }

    slider.addEventListener("input", draw);
    root.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.act === "new") { newBattles(); draw(); }
      else if (b.dataset.act === "shuffle") { shuffle(); draw(); }
    });

    newBattles();
    build();
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        var want = stageBox.clientWidth < 560 ? "compact" : "wide";
        if (want !== layout) build();
      }).observe(stageBox);
    }
  }

  document.addEventListener("lc:ready", function () {
    var root = document.getElementById("elo-playground");
    if (root) init(root);
  });
})();
