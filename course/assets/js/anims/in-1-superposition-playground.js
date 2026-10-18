/* IN.1 playground: the toy model of superposition (Elhage et al., 2022), n = 5 features,
   m = 2 hidden dimensions, x̂ = ReLU(Wᵀ W x + b), importance 0.8^i, features zero with
   probability 1 − p and otherwise uniform on [0, 1]. Each setting below is the best of 8
   seeds trained offline with AdamW (6,000 steps of 2,048 samples), then rotated so f1 points
   up (rotations and reflections don't change the model). Columns of W are listed per feature. */
(function () {
  var LC = window.LC;
  var DATA = [
    {"p":1.0,"W":[[0.0,1.001],[0.999,-0.0],[0.008,0.001],[0.002,-0.001],[-0.001,0.001]],"b":[-0.001,-0.004,0.497,0.5,0.496]},
    {"p":0.8,"W":[[-0.0,1.001],[0.999,0.0],[-0.002,-0.008],[-0.003,0.001],[-0.002,0.004]],"b":[0.001,0.003,0.403,0.404,0.401]},
    {"p":0.6,"W":[[-0.0,1.003],[1.001,0.002],[-0.354,0.002],[0.002,-0.013],[0.006,0.005]],"b":[-0.002,0.071,0.368,0.299,0.302]},
    {"p":0.5,"W":[[0.0,1.0],[0.996,-0.001],[-0.925,-0.006],[0.004,-0.002],[0.0,-0.001]],"b":[0.002,0.087,0.124,0.249,0.254]},
    {"p":0.4,"W":[[0.0,1.029],[1.03,0.003],[-0.002,-0.949],[-0.953,-0.003],[0.005,-0.003]],"b":[0.033,0.032,0.063,0.065,0.2]},
    {"p":0.3,"W":[[0.0,1.017],[0.003,-1.003],[-1.017,0.002],[1.001,0.001],[-0.003,0.002]],"b":[0.016,0.023,0.015,0.022,0.149]},
    {"p":0.2,"W":[[-0.0,1.015],[1.015,0.0],[-0.002,-1.001],[-1.0,0.003],[-0.001,-0.0]],"b":[0.006,0.004,0.007,0.008,0.099]},
    {"p":0.12,"W":[[-0.0,1.008],[1.01,0.001],[-0.0,-1.005],[-1.001,-0.0],[-0.008,0.001]],"b":[0.002,0.002,0.002,0.004,0.056]},
    {"p":0.09,"W":[[-0.0,1.117],[0.572,-0.96],[1.071,0.277],[-1.039,0.299],[-0.662,-0.788]],"b":[-0.194,-0.212,-0.188,-0.206,-0.19]},
    {"p":0.07,"W":[[0.0,1.127],[1.081,0.294],[-0.698,-0.878],[0.589,-0.927],[-1.018,0.32]],"b":[-0.217,-0.215,-0.247,-0.21,-0.196]},
    {"p":0.05,"W":[[-0.0,1.138],[1.088,0.304],[-0.704,-0.89],[0.604,-0.938],[-1.038,0.329]],"b":[-0.229,-0.226,-0.263,-0.227,-0.215]},
    {"p":0.03,"W":[[-0.0,1.151],[1.101,0.309],[-0.712,-0.908],[0.615,-0.953],[-1.067,0.341]],"b":[-0.245,-0.241,-0.279,-0.242,-0.243]},
    {"p":0.02,"W":[[0.0,1.159],[1.107,0.311],[-0.713,-0.923],[0.627,-0.961],[-1.084,0.346]],"b":[-0.252,-0.247,-0.289,-0.257,-0.254]},
    {"p":0.01,"W":[[-0.0,1.164],[0.679,-0.957],[-0.701,-0.938],[1.095,0.338],[-1.088,0.334]],"b":[-0.267,-0.282,-0.281,-0.26,-0.255]}
  ];
  var NAMES = ["f1", "f2", "f3", "f4", "f5"];
  var STORED = 0.3;   // a feature counts as stored if its column has length > 0.3

  function pct(p) { return (p * 100 >= 10 ? Math.round(p * 100) : Math.round(p * 100)) + "%"; }

  function init(root) {
    var stage = root.querySelector(".pg-stage");
    var slider = root.querySelector('[data-in="p"]');
    var outP = root.querySelector('[data-out="p"]');
    var readout = root.querySelector(".pg-readout");
    var mode = "one", layout = null, svg, G, L;

    function build() {
      layout = stage.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact";
      L = compact
        ? { W: 360, H: 440, cx: 180, cy: 142, u: 80, ty: 18, note: 270, bt: 302, top: 322, row: 23, lx: 28, zx: 56, sc: 170 }
        : { W: 640, H: 318, cx: 160, cy: 166, u: 96, ty: 24, note: 304, bt: 24, top: 64, row: 46, lx: 372, zx: 404, sc: 128 };
      if (svg) svg.remove();
      svg = LC.svg("svg", { viewBox: "0 0 " + L.W + " " + L.H, role: "img", "aria-label": "Feature directions of the toy model in a 2-D hidden space, and bars of the model's output for the test input. The readout below describes them." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "400px";
      stage.appendChild(svg);
      var S = LC.svg;
      S("text", { x: compact ? 8 : 20, y: L.ty, class: "t t-sm t-muted", text: "hidden space: 2 dimensions" }, svg);
      S("line", { x1: L.cx - 1.3 * L.u, x2: L.cx + 1.3 * L.u, y1: L.cy, y2: L.cy, class: "s-grid" }, svg);
      S("line", { x1: L.cx, x2: L.cx, y1: L.cy - 1.3 * L.u, y2: L.cy + 1.3 * L.u, class: "s-grid" }, svg);
      S("circle", { cx: L.cx, cy: L.cy, r: L.u, class: "f-none", stroke: "var(--line)", "stroke-width": 1, "stroke-dasharray": "3 4" }, svg);
      S("text", { x: compact ? L.lx - 20 : L.lx - 4, y: L.bt, class: "t t-sm t-muted", text: "output x̂ (grey tick = correct)" }, svg);
      S("line", { x1: L.zx, x2: L.zx, y1: L.top - 4, y2: L.top + 5 * L.row - 8, class: "s-axis" }, svg);
      G = { arrows: S("g", {}, svg), bars: S("g", {}, svg) };
      G.note = S("text", { x: L.cx, y: L.note, class: "t t-sm t-mid t-muted", text: "" }, svg);
      G.rows = NAMES.map(function (n, i) {
        var y = L.top + i * L.row, bh = L.row - (compact ? 9 : 18);
        var lbl = S("text", { x: L.lx, y: y + bh / 2 + 4.5, class: "t t-sm t-mid", "font-weight": 650, text: n }, svg);
        var r = S("rect", { x: L.zx, y: y, width: 0, height: bh, rx: 3, class: "f-blue" }, svg);
        var tick = S("line", { x1: L.zx, x2: L.zx, y1: y - 3, y2: y + bh + 3, style: "stroke:var(--ink-2)", "stroke-width": 2.5 }, svg);
        var v = S("text", { x: L.zx + 6, y: y + bh / 2 + 4.5, class: "t t-sm t-mono", text: "" }, svg);
        return { lbl: lbl, r: r, tick: tick, v: v };
      });
      draw();
    }

    function draw() {
      var d = DATA[+slider.value], S = LC.svg;
      var inp = mode === "one" ? [1, 0, 0, 0, 0] : [1, 1, 0, 0, 0];
      outP.textContent = pct(d.p);
      while (G.arrows.firstChild) G.arrows.removeChild(G.arrows.firstChild);
      var stored = [], dropped = [];
      d.W.forEach(function (w, i) {
        var len = Math.hypot(w[0], w[1]);
        if (len < STORED) { dropped.push(NAMES[i]); return; }
        stored.push(i);
        var on = inp[i] > 0, ux = w[0] / len, uy = w[1] / len;
        var tx = L.cx + w[0] * L.u, ty = L.cy - w[1] * L.u;
        var bx = tx - ux * 10, by = ty + uy * 10;
        S("line", { x1: L.cx, y1: L.cy, x2: bx.toFixed(1), y2: by.toFixed(1), class: on ? "s-orange" : "s-blue" }, G.arrows);
        var nx = -uy * 5.5, ny = -ux * 5.5;
        S("path", { d: "M" + tx.toFixed(1) + " " + ty.toFixed(1) + "L" + (bx + nx).toFixed(1) + " " + (by + ny).toFixed(1) + "L" + (bx - nx).toFixed(1) + " " + (by - ny).toFixed(1) + "Z", class: on ? "f-orange" : "f-blue" }, G.arrows);
        S("text", { x: (tx + ux * 16).toFixed(1), y: (ty - uy * 16 + 4.5).toFixed(1), class: "t t-sm t-mid " + (on ? "t-orange" : "t-blue"), "font-weight": 650, text: NAMES[i] }, G.arrows);
      });
      G.note.textContent = dropped.length ? "not stored: " + dropped.join(", ") : "all 5 stored";
      // forward pass
      var h = [0, 0];
      d.W.forEach(function (w, i) { h[0] += w[0] * inp[i]; h[1] += w[1] * inp[i]; });
      var out = d.W.map(function (w, i) { return Math.max(0, w[0] * h[0] + w[1] * h[1] + d.b[i]); });
      var err = out.reduce(function (s, v, i) { return s + (v - inp[i]) * (v - inp[i]); }, 0);
      G.rows.forEach(function (row, i) {
        var w = out[i] * L.sc;
        row.r.setAttribute("width", w.toFixed(1));
        row.r.setAttribute("class", inp[i] ? "f-orange" : "f-blue");
        row.lbl.setAttribute("class", "t t-sm t-mid " + (inp[i] ? "t-orange" : "t-blue"));
        var tx = L.zx + inp[i] * L.sc;
        row.tick.setAttribute("x1", tx); row.tick.setAttribute("x2", tx);
        row.v.textContent = out[i].toFixed(2);
        row.v.setAttribute("x", (L.zx + Math.max(w, inp[i] * L.sc) + 7).toFixed(1));
      });
      // overlaps among stored features
      var worst = 0, opp = false;
      for (var a = 0; a < stored.length; a++) for (var b = a + 1; b < stored.length; b++) {
        var wa = d.W[stored[a]], wb = d.W[stored[b]];
        var c = (wa[0] * wb[0] + wa[1] * wb[1]) / (Math.hypot(wa[0], wa[1]) * Math.hypot(wb[0], wb[1]));
        if (c > worst) worst = c;
        if (c < -0.95) opp = true;
      }
      var txt = "On " + pct(d.p) + " of the time: " + stored.length + " of 5 features stored. ";
      txt += stored.length <= 2 ? "Stored features are perpendicular (no interference); the rest just output a constant guess. "
        : "Worst overlap between stored features: cos = " + worst.toFixed(2) + (opp ? " (some pairs point in opposite directions, cos ≈ −1). " : ". ");
      if (mode === "two") {
        var w1 = d.W[0], w2 = d.W[1];
        var l1 = Math.hypot(w1[0], w1[1]), l2 = Math.hypot(w2[0], w2[1]);
        if (l1 > STORED && l2 > STORED) {
          var ang = Math.round(Math.acos(Math.max(-1, Math.min(1, (w1[0] * w2[0] + w1[1] * w2[1]) / (l1 * l2)))) * 180 / Math.PI);
          txt += "f1 and f2 are " + ang + "° apart" + (ang > 130 ? ", so together they largely cancel out. " : ang < 85 ? ", so each picks up the other's reading. " : ". ");
        }
      }
      txt += "Test squared error: " + err.toFixed(3) + ".";
      readout.textContent = txt;
    }

    slider.addEventListener("input", draw);
    root.addEventListener("click", function (e) {
      var b = e.target.closest("[data-input]"); if (!b) return;
      mode = b.dataset.input;
      root.querySelectorAll("[data-input]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      draw();
    });
    build();
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        var want = stage.clientWidth < 560 ? "compact" : "wide";
        if (want !== layout) build();
      }).observe(stage);
    }
  }

  document.addEventListener("lc:ready", function () {
    var root = document.getElementById("in-1-superposition");
    if (root) init(root);
  });
})();
