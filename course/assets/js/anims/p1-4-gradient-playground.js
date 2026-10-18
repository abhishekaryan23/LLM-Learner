/* P1.4 playground: move a point on the contour map of f(x, y) = x² + 3y² (sliders, or tap the map)
   and see ∇f = (2x, 6y), drawn perpendicular to the contour through the point.
   "Descent step" applies P ← P − 0.1·∇f, so x shrinks by 0.8× and y by 0.4× per step. */
(function () {
  var LC = window.LC;
  var ETA = 0.1, K = 0.15, CAP = 1.0;
  function f(x, y) { return x * x + 3 * y * y; }

  function init(root) {
    var stageBox = root.querySelector(".pg-stage");
    var xIn = root.querySelector('input[data-k="x"]'), yIn = root.querySelector('input[data-k="y"]');
    var xOut = root.querySelector('output[data-o="x"]'), yOut = root.querySelector('output[data-o="y"]');
    var readout = root.querySelector(".pg-readout"), hint = root.querySelector(".pg-hint");
    var layout = null, svg, el = {}, px, py, inv, trail = [];
    var X0 = -3.4, X1 = 3.4, Y0 = -2.2, Y1 = 2.2;

    function build() {
      layout = stageBox.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact";
      var W = compact ? 360 : 600, plotW = compact ? 340 : 520, plotL = compact ? 10 : 40, plotT = 8;
      var u = plotW / (X1 - X0), plotH = (Y1 - Y0) * u, H = Math.round(plotH + 16);
      px = function (x) { return plotL + (x - X0) * u; };
      py = function (y) { return plotT + (Y1 - y) * u; };
      inv = function (sx, sy) { return [X0 + (sx - plotL) / u, Y1 - (sy - plotT) / u]; };
      if (svg) svg.remove();
      var S = LC.svg;
      svg = S("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Contour map of f(x, y) = x squared plus 3 y squared, with a movable point and its gradient arrow. Tap the map to move the point; the readout below gives the numbers." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto"; svg.style.cursor = "crosshair";
      svg.style.maxHeight = compact ? "none" : "380px";
      stageBox.appendChild(svg);
      var id = "p14pg" + Math.random().toString(36).slice(2, 8);
      var cp = S("clipPath", { id: id }, S("defs", {}, svg));
      S("rect", { x: plotL, y: plotT, width: plotW, height: plotH, rx: 8 }, cp);
      var g = S("g", { "clip-path": "url(#" + id + ")" }, svg);
      S("rect", { x: plotL, y: plotT, width: plotW, height: plotH, rx: 8, class: "f-none", stroke: "var(--line)" }, svg);
      S("line", { x1: plotL, x2: plotL + plotW, y1: py(0), y2: py(0), class: "s-grid" }, g);
      S("line", { x1: px(0), x2: px(0), y1: plotT, y2: plotT + plotH, class: "s-grid" }, g);
      [1, 4, 9, 16].forEach(function (c) { S("ellipse", { cx: px(0), cy: py(0), rx: Math.sqrt(c) * u, ry: Math.sqrt(c / 3) * u, class: "s-faint" }, g); });
      el.u = u;
      el.cont = S("ellipse", { cx: px(0), cy: py(0), class: "s-ink", style: "stroke-width:2" }, g);
      el.tan = S("path", { class: "s-ink", style: "stroke-width:1.5", "stroke-dasharray": "5 4" }, g);
      el.trail = S("path", { class: "s-orange", style: "stroke-width:2;stroke-opacity:.7" }, g);
      el.trailDots = S("g", {}, g);
      el.grad = S("path", { class: "s-orange", style: "stroke-width:3.5" }, g);
      el.dot = S("circle", { r: 7, class: "f-ink" }, svg);
      svg.addEventListener("click", function (e) {
        var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
        var loc = pt.matrixTransform(svg.getScreenCTM().inverse()), d = inv(loc.x, loc.y);
        setPoint(d[0], d[1], true);
      });
      draw();
    }

    function setPoint(x, y, clearTrail) {
      x = Math.max(+xIn.min, Math.min(+xIn.max, Math.round(x * 10) / 10));
      y = Math.max(+yIn.min, Math.min(+yIn.max, Math.round(y * 10) / 10));
      xIn.value = x; yIn.value = y;
      if (clearTrail) trail = [];
      draw();
    }

    function draw(px0, py0) {
      var x = px0 != null ? px0 : +xIn.value, y = py0 != null ? py0 : +yIn.value;
      xOut.textContent = x.toFixed(2).replace(/0$/, ""); yOut.textContent = y.toFixed(2).replace(/0$/, "");
      var gx = 2 * x, gy = 6 * y, gn = Math.hypot(gx, gy), val = f(x, y), u = el.u;
      el.dot.setAttribute("cx", px(x)); el.dot.setAttribute("cy", py(y));
      el.cont.setAttribute("rx", (Math.sqrt(val) * u).toFixed(2)); el.cont.setAttribute("ry", (Math.sqrt(val / 3) * u).toFixed(2));
      if (gn > 1e-6) {
        var len = Math.min(gn * K, CAP), ux = gx / gn, uy = gy / gn;
        var ex = x + ux * len, ey = y + uy * len, X2 = px(ex), Y2 = py(ey), a = Math.atan2(Y2 - py(y), X2 - px(x)), hl = 10;
        el.grad.setAttribute("d", "M" + px(x).toFixed(1) + " " + py(y).toFixed(1) + "L" + (X2 - 7 * Math.cos(a)).toFixed(1) + " " + (Y2 - 7 * Math.sin(a)).toFixed(1) +
          "M" + (X2 - hl * Math.cos(a - 0.45)).toFixed(1) + " " + (Y2 - hl * Math.sin(a - 0.45)).toFixed(1) + "L" + X2.toFixed(1) + " " + Y2.toFixed(1) +
          "L" + (X2 - hl * Math.cos(a + 0.45)).toFixed(1) + " " + (Y2 - hl * Math.sin(a + 0.45)).toFixed(1));
        el.tan.setAttribute("d", "M" + px(x - uy * 0.9).toFixed(1) + " " + py(y + ux * 0.9).toFixed(1) + "L" + px(x + uy * 0.9).toFixed(1) + " " + py(y - ux * 0.9).toFixed(1));
      } else { el.grad.setAttribute("d", ""); el.tan.setAttribute("d", ""); }
      el.trail.setAttribute("d", trail.length ? trail.concat([[x, y]]).map(function (p, i) { return (i ? "L" : "M") + px(p[0]).toFixed(1) + " " + py(p[1]).toFixed(1); }).join("") : "");
      while (el.trailDots.firstChild) el.trailDots.removeChild(el.trailDots.firstChild);
      trail.forEach(function (p) { LC.svg("circle", { cx: px(p[0]), cy: py(p[1]), r: 3.5, class: "f-orange" }, el.trailDots); });
      readout.textContent = "P = (" + x.toFixed(2) + ", " + y.toFixed(2) + ") · f = " + val.toFixed(3) + " · ∇f = (" + gx.toFixed(2) + ", " + gy.toFixed(2) + ") · |∇f| = " + gn.toFixed(2);
      hint.textContent = gn < 0.05 ? "You're at the bottom: the gradient is (almost) zero, so there's no uphill direction left."
        : (Math.abs(gy) > 2.5 * Math.abs(gx) ? "The steep y-direction dominates: the gradient points mostly up or down, still at right angles to the solid contour."
        : "The orange gradient is always at right angles to the solid contour through your point. Try a descent step.");
      el.cur = [x, y];
    }

    function step() {
      var p = el.cur, nx = p[0] - ETA * 2 * p[0], ny = p[1] - ETA * 6 * p[1];
      trail.push(p.slice());
      xIn.value = Math.round(nx * 10) / 10; yIn.value = Math.round(ny * 10) / 10;   // sliders show the nearest tick
      draw(nx, ny);
    }

    xIn.addEventListener("input", function () { trail = []; draw(); });
    yIn.addEventListener("input", function () { trail = []; draw(); });
    root.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-act]"); if (!b) return;
      if (b.dataset.act === "step") step();
      else if (b.dataset.act === "reset") { xIn.value = 2; yIn.value = 1; trail = []; draw(); }
    });
    build();
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        var want = stageBox.clientWidth < 560 ? "compact" : "wide";
        if (want !== layout) { var c = el.cur; build(); draw(c[0], c[1]); }
      }).observe(stageBox);
    }
  }

  document.addEventListener("lc:ready", function () {
    var root = document.getElementById("grad-playground");
    if (root) init(root);
  });
})();
