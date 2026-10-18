/* H1.1 playground: train Rosenblatt's perceptron on AND / OR / XOR, or switch to a
   2-4-1 network trained by backprop (tanh hidden units, sigmoid output, cross-entropy,
   full-batch gradient descent). The shading shows where the model answers 1. */
(function () {
  var LC = window.LC;
  var DATA = {
    and: [[0, 0, 0], [0, 1, 0], [1, 0, 0], [1, 1, 1]],
    or: [[0, 0, 0], [0, 1, 1], [1, 0, 1], [1, 1, 1]],
    xor: [[0, 0, 0], [0, 1, 1], [1, 0, 1], [1, 1, 0]]
  };
  var NAMES = { and: "AND", or: "OR", xor: "XOR" };
  var ETA = 0.5, MAX_EPOCHS = 25, HID = 4, LR = 1.0, MLP_STEPS = 2500, MLP_CHUNK = 50;
  var D0 = -0.35, D1 = 1.35, G = 17;

  function mulberry(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function sig(z) { return 1 / (1 + Math.exp(-z)); }

  /* ---- a tiny 2-HID-1 network with backprop ---- */
  function Net(seed) {
    var r = mulberry(seed), n = this;
    n.W1 = []; n.b1 = []; n.W2 = []; n.b2 = 0;
    for (var j = 0; j < HID; j++) { n.W1.push([(r() * 2 - 1) * 1.5, (r() * 2 - 1) * 1.5]); n.b1.push((r() * 2 - 1) * 0.5); n.W2.push((r() * 2 - 1) * 1.5); }
  }
  Net.prototype.forward = function (x) {
    var h = this.W1.map(function (w, j) { return Math.tanh(w[0] * x[0] + w[1] * x[1] + this.b1[j]); }, this);
    var z = this.b2; for (var j = 0; j < HID; j++) z += this.W2[j] * h[j];
    return { h: h, p: sig(z) };
  };
  Net.prototype.step = function (data) {
    var gW1 = this.W1.map(function () { return [0, 0]; }), gb1 = this.b1.map(function () { return 0; }), gW2 = this.W2.map(function () { return 0; }), gb2 = 0, loss = 0;
    for (var i = 0; i < data.length; i++) {
      var x = data[i], f = this.forward(x), y = x[2];
      loss -= y * Math.log(f.p + 1e-12) + (1 - y) * Math.log(1 - f.p + 1e-12);
      var dz = f.p - y;                       // d loss / d output pre-activation
      gb2 += dz;
      for (var j = 0; j < HID; j++) {
        gW2[j] += dz * f.h[j];
        var dh = dz * this.W2[j] * (1 - f.h[j] * f.h[j]);   // back through tanh
        gW1[j][0] += dh * x[0]; gW1[j][1] += dh * x[1]; gb1[j] += dh;
      }
    }
    var m = data.length;
    for (var k = 0; k < HID; k++) {
      this.W1[k][0] -= LR * gW1[k][0] / m; this.W1[k][1] -= LR * gW1[k][1] / m; this.b1[k] -= LR * gb1[k] / m; this.W2[k] -= LR * gW2[k] / m;
    }
    this.b2 -= LR * gb2 / m;
    return loss / m;
  };
  LC.h1Net = Net; // exposed for QA

  function init(root) {
    var stageBox = root.querySelector(".pg-stage");
    var readout = root.querySelector(".pg-readout");
    var hint = root.querySelector(".pg-hint");
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var ds = "and", model = "perc", layout = null, timer = null, seed = 1;
    var w, epoch, idx, net, iters, loss, lastI = -1;
    var svg, cellsG, cells = [], line, ring, ptsG, X, Y;

    function data() { return DATA[ds]; }
    function wrong() {
      return data().filter(function (p) { return predict(p) !== p[2]; }).length;
    }
    function predict(p) { return model === "perc" ? (w[0] * p[0] + w[1] * p[1] + w[2] > 0 ? 1 : 0) : (net.forward(p).p > 0.5 ? 1 : 0); }
    function prob(p) { return model === "perc" ? (w[0] * p[0] + w[1] * p[1] + w[2] > 0 ? 1 : 0) : net.forward(p).p; }

    function reset() {
      stop();
      w = [0.3, -0.2, 0.1]; epoch = 0; idx = 0; lastI = -1;
      net = new Net(seed); iters = 0; loss = null;
      draw();
    }

    function build() {
      layout = stageBox.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact", W = compact ? 360 : 640, H = compact ? 296 : 300;
      var s = compact ? 236 : 256, px = compact ? 62 : 70, py = 12;
      X = function (v) { return px + ((v - D0) / (D1 - D0)) * s; };
      Y = function (v) { return py + (1 - (v - D0) / (D1 - D0)) * s; };
      if (svg) svg.remove();
      var S = LC.svg;
      svg = S("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Four input points of a logic function and the region where the model answers 1. The readout below says how many points are wrong." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "380px";
      stageBox.appendChild(svg);
      cellsG = S("g", {}, svg); cells = [];
      var cs = s / G;
      for (var a = 0; a < G; a++) for (var b = 0; b < G; b++) {
        var cx = D0 + (a + 0.5) * (D1 - D0) / G, cy = D0 + (b + 0.5) * (D1 - D0) / G;
        cells.push({ x: cx, y: cy, el: S("rect", { x: px + a * cs, y: py + (G - 1 - b) * cs, width: cs + 0.3, height: cs + 0.3, class: "f-blue", "fill-opacity": 0 }, cellsG) });
      }
      S("rect", { x: px, y: py, width: s, height: s, class: "f-none", stroke: "var(--line)", "stroke-width": 1.5 }, svg);
      line = S("path", { d: "", class: "s-ink", "stroke-width": 2.5 }, svg);
      ptsG = S("g", {}, svg);
      ring = S("circle", { r: 15, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 3, opacity: 0 }, svg);
      [0, 1].forEach(function (v) {
        S("text", { x: X(v), y: py + s + 18, class: "t t-sm t-muted t-mid", text: v }, svg);
        S("text", { x: px - 8, y: Y(v) + 4, class: "t t-sm t-muted t-end", text: v }, svg);
      });
      S("text", { x: px + s, y: py + s + 18, class: "t t-sm t-muted t-end", text: "x₁ →" }, svg);
      S("text", { x: px - 8, y: py + 12, class: "t t-sm t-muted t-end", text: "x₂ ↑" }, svg);
      if (!compact) {
        var lx = px + s + 40;
        S("circle", { cx: lx + 8, cy: py + 40, r: 8, class: "f-blue" }, svg);
        S("text", { x: lx + 24, y: py + 45, class: "t t-sm", text: "target 1" }, svg);
        S("rect", { x: lx, y: py + 64, width: 15, height: 15, rx: 2, class: "f-orange" }, svg);
        S("text", { x: lx + 24, y: py + 76, class: "t t-sm", text: "target 0" }, svg);
        S("rect", { x: lx, y: py + 96, width: 15, height: 15, rx: 2, class: "f-blue", "fill-opacity": 0.3 }, svg);
        S("text", { x: lx + 24, y: py + 108, class: "t t-sm", text: "shaded: model says 1" }, svg);
        S("path", { d: "M" + lx + " " + (py + 135) + "h16", class: "s-ink", "stroke-width": 2.5 }, svg);
        S("text", { x: lx + 24, y: py + 139, class: "t t-sm", text: "perceptron's line" }, svg);
      }
      draw();
    }

    function segment() {
      var pts = [];
      function add(x, y) { if (x >= D0 - 1e-9 && x <= D1 + 1e-9 && y >= D0 - 1e-9 && y <= D1 + 1e-9) pts.push([x, y]); }
      if (Math.abs(w[1]) > 1e-9) { add(D0, -(w[2] + w[0] * D0) / w[1]); add(D1, -(w[2] + w[0] * D1) / w[1]); }
      if (Math.abs(w[0]) > 1e-9) { add(-(w[2] + w[1] * D0) / w[0], D0); add(-(w[2] + w[1] * D1) / w[0], D1); }
      if (pts.length < 2) return "";
      pts.sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
      var A = pts[0], B = pts[pts.length - 1];
      return "M" + X(A[0]).toFixed(1) + " " + Y(A[1]).toFixed(1) + "L" + X(B[0]).toFixed(1) + " " + Y(B[1]).toFixed(1);
    }

    function draw() {
      if (!svg) return;
      cells.forEach(function (c) { c.el.setAttribute("fill-opacity", (0.03 + 0.27 * prob([c.x, c.y])).toFixed(3)); });
      line.setAttribute("d", model === "perc" ? segment() : "");
      while (ptsG.firstChild) ptsG.removeChild(ptsG.firstChild);
      data().forEach(function (p) {
        if (p[2]) LC.svg("circle", { cx: X(p[0]), cy: Y(p[1]), r: 9, class: "f-blue" }, ptsG);
        else LC.svg("rect", { x: X(p[0]) - 8, y: Y(p[1]) - 8, width: 16, height: 16, rx: 2, class: "f-orange" }, ptsG);
      });
      if (lastI >= 0 && model === "perc") { var q = data()[lastI]; ring.setAttribute("cx", X(q[0])); ring.setAttribute("cy", Y(q[1])); ring.setAttribute("opacity", 1); }
      else ring.setAttribute("opacity", 0);
      var n = wrong();
      if (model === "perc") {
        readout.textContent = "epoch " + epoch + " · w₁ = " + w[0].toFixed(2) + ", w₂ = " + w[1].toFixed(2) + ", b = " + w[2].toFixed(2) + " · wrong: " + n + " of 4";
        if (n === 0) hint.textContent = "Converged: a single line separates " + NAMES[ds] + ". The perceptron rule always gets here when such a line exists.";
        else if (epoch >= MAX_EPOCHS) hint.textContent = "After " + MAX_EPOCHS + " epochs it still gets " + n + " wrong. For XOR no line works, so the rule never settles. Try the hidden layer.";
        else hint.textContent = "Step = check the next point and correct the weights if it's wrong. Train = keep going until 0 mistakes (or " + MAX_EPOCHS + " epochs).";
      } else {
        readout.textContent = "step " + iters + " · loss " + (loss == null ? "–" : loss.toFixed(3)) + " · wrong: " + n + " of 4";
        if (n === 0 && iters > 0) hint.textContent = "Solved: the hidden units bend the boundary, so even " + NAMES[ds] + " works. Backprop found the weights; nobody set them by hand.";
        else hint.textContent = "Step = 50 gradient-descent updates (backprop computes the gradients). Train = " + MLP_STEPS + " updates.";
      }
    }

    function percStep() {
      var d = data();
      if (wrong() === 0 || epoch >= MAX_EPOCHS) return false;
      var p = d[idx], e = p[2] - (w[0] * p[0] + w[1] * p[1] + w[2] > 0 ? 1 : 0);
      if (e) { w = [w[0] + ETA * e * p[0], w[1] + ETA * e * p[1], w[2] + ETA * e]; lastI = idx; } else lastI = -1;
      idx = (idx + 1) % d.length; if (idx === 0) epoch++;
      return true;
    }
    function mlpStep(k) {
      if (iters >= MLP_STEPS) return false;
      for (var i = 0; i < k && iters < MLP_STEPS; i++) { loss = net.step(data()); iters++; }
      return true;
    }
    function stop() { clearInterval(timer); timer = null; }
    function step() { stop(); if (model === "perc") percStep(); else mlpStep(MLP_CHUNK); draw(); }
    function train() {
      stop();
      var tick = function () { var more = model === "perc" ? percStep() : mlpStep(MLP_CHUNK); draw(); return more; };
      if (reduce) { while (tick()) { /* run to the end */ } return; }
      timer = setInterval(function () { if (!tick()) stop(); }, model === "perc" ? 120 : 40);
    }
    function press(group, val) {
      root.querySelectorAll("[data-" + group + "]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset[group] === val)); });
    }
    root.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b || !root.contains(b)) return;
      if (b.dataset.ds) { ds = b.dataset.ds; press("ds", ds); reset(); }
      else if (b.dataset.model) { model = b.dataset.model; press("model", model); reset(); }
      else if (b.dataset.act === "step") step();
      else if (b.dataset.act === "train") train();
      else if (b.dataset.act === "reset") { seed++; reset(); }
    });

    press("ds", ds); press("model", model);
    reset();
    build();
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        var want = stageBox.clientWidth < 560 ? "compact" : "wide";
        if (want !== layout) build();
      }).observe(stageBox);
    }
  }

  document.addEventListener("lc:ready", function () {
    var root = document.getElementById("h1-1-playground");
    if (root) init(root);
  });
})();
