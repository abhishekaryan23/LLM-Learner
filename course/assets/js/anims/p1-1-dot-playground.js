/* P1.1 playground: a = (3, 1) is fixed; the learner turns and stretches b and watches
   a·b, |a||b| and cos θ. Turning changes the dot product AND the cosine; stretching
   changes the dot product but NOT the cosine similarity. */
(function () {
  var LC = window.LC;
  var A = [3, 1], NA = Math.sqrt(10), ANG_A = Math.atan2(1, 3), DEG = Math.PI / 180;

  function hintFor(c) {
    if (c > 0.985) return "Same direction: the dot product is as big as it can be for these lengths (cos θ ≈ 1).";
    if (c > 0.05) return "Pointing roughly the same way: positive dot product.";
    if (c > -0.05) return "Perpendicular: no shadow, so the dot product is (about) zero.";
    if (c > -0.985) return "Pointing apart: the shadow falls behind the origin, so the dot product is negative.";
    return "Opposite directions: the most negative it can be (cos θ ≈ −1).";
  }

  function init(root) {
    var stageBox = root.querySelector(".pg-stage");
    var angIn = root.querySelector('input[data-k="ang"]'), lenIn = root.querySelector('input[data-k="len"]');
    var angOut = root.querySelector('output[data-o="ang"]'), lenOut = root.querySelector('output[data-o="len"]');
    var readout = root.querySelector(".pg-readout"), hint = root.querySelector(".pg-hint");
    var layout = null, svg, el = {}, px, py, ox, oy;

    function build() {
      layout = stageBox.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact";
      var W = compact ? 360 : 600, X0 = -3.4, X1 = 3.8, Y0 = -2.6, Y1 = 2.6;
      var plotW = compact ? 340 : 330, plotL = compact ? 10 : 14, plotT = 10;
      var u = plotW / (X1 - X0), plotH = (Y1 - Y0) * u;
      var H = compact ? Math.round(plotT + plotH + 70) : Math.round(plotT + plotH + 10);
      px = function (x) { return plotL + (x - X0) * u; };
      py = function (y) { return plotT + (Y1 - y) * u; };
      ox = px(0); oy = py(0);
      if (svg) svg.remove();
      var S = LC.svg;
      svg = S("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Vector a fixed at (3, 1) and a movable vector b, with the shadow of b on a and a gauge for cos theta. The readout below gives the numbers." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "360px";
      stageBox.appendChild(svg);
      for (var gx = -3; gx <= 3; gx++) if (gx) S("line", { x1: px(gx), x2: px(gx), y1: py(Y0), y2: py(Y1), class: "s-grid" }, svg);
      for (var gy = -2; gy <= 2; gy++) if (gy) S("line", { x1: px(X0), x2: px(X1), y1: py(gy), y2: py(gy), class: "s-grid" }, svg);
      S("line", { x1: px(X0), x2: px(X1), y1: oy, y2: oy, class: "s-axis" }, svg);
      S("line", { x1: ox, x2: ox, y1: py(Y0), y2: py(Y1), class: "s-axis" }, svg);
      el.drop = S("path", { class: "s-faint", "stroke-dasharray": "4 4" }, svg);
      el.shadow = S("path", { class: "s-orange", style: "stroke-width:9;stroke-opacity:.45;stroke-linecap:butt" }, svg);
      el.arc = S("path", { class: "s-ink", "stroke-width": 1.5 }, svg);
      var ad = arrowD(A[0], A[1]);
      S("path", { d: ad, class: "s-blue" }, svg);
      S("text", { x: px(3) + 6, y: py(1) - 10, class: "t t-blue", "font-weight": 650, text: "a" }, svg);
      el.b = S("path", { class: "s-orange" }, svg);
      el.bl = S("text", { class: "t t-orange t-mid", "font-weight": 650, text: "b" }, svg);
      // cos θ gauge: below the plane (compact) or to its right (wide)
      var gx0, gx1, gyy;
      if (compact) { gx0 = 40; gx1 = W - 40; gyy = plotT + plotH + 40; }
      else { gx0 = 400; gx1 = W - 24; gyy = H / 2; }
      el.gauge = { x0: gx0, x1: gx1, y: gyy };
      S("text", { x: (gx0 + gx1) / 2, y: gyy - 22, class: "t t-sm t-muted t-mid", text: "cosine similarity = cos θ" }, svg);
      S("line", { x1: gx0, x2: gx1, y1: gyy, y2: gyy, class: "s-axis" }, svg);
      [-1, 0, 1].forEach(function (v) {
        var x = gx0 + (v + 1) / 2 * (gx1 - gx0);
        S("line", { x1: x, x2: x, y1: gyy - 5, y2: gyy + 5, class: "s-axis" }, svg);
        S("text", { x: x, y: gyy + 21, class: "t t-sm t-muted t-mid", text: v === -1 ? "−1" : String(v) }, svg);
      });
      el.marker = S("circle", { r: 8, cy: gyy, class: "f-orange", stroke: "var(--a-ink)", "stroke-width": 2 }, svg);
      draw();
    }

    function arrowD(x, y) {
      var x2 = px(x), y2 = py(y), ang = Math.atan2(y2 - oy, x2 - ox), hl = 11;
      var bx = x2 - hl * Math.cos(ang), by = y2 - hl * Math.sin(ang);
      return "M" + ox + " " + oy + "L" + bx.toFixed(2) + " " + by.toFixed(2) +
        "M" + (x2 - hl * Math.cos(ang - 0.45)).toFixed(2) + " " + (y2 - hl * Math.sin(ang - 0.45)).toFixed(2) +
        "L" + x2.toFixed(2) + " " + y2.toFixed(2) +
        "L" + (x2 - hl * Math.cos(ang + 0.45)).toFixed(2) + " " + (y2 - hl * Math.sin(ang + 0.45)).toFixed(2);
    }

    function draw() {
      var rel = +angIn.value, len = +lenIn.value;
      var ang = ANG_A + rel * DEG, bx = len * Math.cos(ang), by = len * Math.sin(ang);
      var dot = A[0] * bx + A[1] * by, cos = dot / (NA * len);
      var theta = rel <= 180 ? rel : 360 - rel;
      angOut.textContent = theta + "°"; lenOut.textContent = len.toFixed(1);
      el.b.setAttribute("d", arrowD(bx, by));
      var tx = px(bx), ty = py(by), dl = Math.hypot(tx - ox, ty - oy) || 1;
      el.bl.setAttribute("x", (tx + (tx - ox) / dl * 16).toFixed(1));
      el.bl.setAttribute("y", (ty + (ty - oy) / dl * 16 + 5).toFixed(1));
      var r = 26, sweep = rel <= 180 ? 0 : 1;
      el.arc.setAttribute("d", theta < 2 ? "" : "M" + (ox + r * Math.cos(ANG_A)).toFixed(2) + " " + (oy - r * Math.sin(ANG_A)).toFixed(2) +
        "A" + r + " " + r + " 0 0 " + sweep + " " + (ox + r * Math.cos(ang)).toFixed(2) + " " + (oy - r * Math.sin(ang)).toFixed(2));
      var proj = dot / NA, fx = proj * A[0] / NA, fy = proj * A[1] / NA;
      el.drop.setAttribute("d", "M" + tx.toFixed(2) + " " + ty.toFixed(2) + "L" + px(fx).toFixed(2) + " " + py(fy).toFixed(2));
      el.shadow.setAttribute("d", "M" + ox + " " + oy + "L" + px(fx).toFixed(2) + " " + py(fy).toFixed(2));
      var G = el.gauge;
      el.marker.setAttribute("cx", (G.x0 + (cos + 1) / 2 * (G.x1 - G.x0)).toFixed(1));
      readout.textContent = "b = (" + bx.toFixed(2) + ", " + by.toFixed(2) + ") · a·b = " + dot.toFixed(2) +
        " · |a||b| = " + (NA * len).toFixed(2) + " · cos θ = " + cos.toFixed(3);
      hint.textContent = hintFor(cos);
      root.querySelectorAll("[data-ang]").forEach(function (c) { c.setAttribute("aria-pressed", String(+c.dataset.ang === rel)); });
    }

    angIn.addEventListener("input", draw);
    lenIn.addEventListener("input", draw);
    root.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-ang]"); if (!b) return;
      angIn.value = b.dataset.ang; draw();
    });
    build();
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        var want = stageBox.clientWidth < 560 ? "compact" : "wide";
        if (want !== layout) build();
      }).observe(stageBox);
    }
  }

  document.addEventListener("lc:ready", function () {
    var root = document.getElementById("dot-playground");
    if (root) init(root);
  });
})();
