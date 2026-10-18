/* P2.1 playground: move a line with two sliders and watch the squared errors and MSE.
   An optional outlier shows how squaring lets one bad point dominate the loss. */
(function () {
  var LC = window.LC;
  var BASE_X = [1, 2, 3, 4, 5], BASE_Y = [1.5, 3.5, 3, 5, 5.5];
  var OUT = [4.5, 0.2];          // the optional outlier
  var X0 = 0, X1 = 6, Y0 = -1, Y1 = 7;

  function fitLS(xs, ys) {
    var n = xs.length, mx = 0, my = 0, sxy = 0, sxx = 0;
    xs.forEach(function (x, i) { mx += x / n; my += ys[i] / n; });
    xs.forEach(function (x, i) { sxy += (x - mx) * (ys[i] - my); sxx += (x - mx) * (x - mx); });
    var w = sxy / sxx;
    return { w: w, b: my - w * mx };
  }

  function init(root) {
    var stageBox = root.querySelector(".pg-stage");
    var sw = root.querySelector('input[data-k="w"]'), sb = root.querySelector('input[data-k="b"]');
    var ow = root.querySelector('output[data-o="w"]'), ob = root.querySelector('output[data-o="b"]');
    var readout = root.querySelector(".pg-readout"), hint = root.querySelector(".pg-hint");
    var outBtn = root.querySelector('[data-act="outlier"]');
    var withOutlier = false, layout = null;
    var svg, sx, sy, line, sqG, resG, ptsG, m, Wd, Ht, clipId = "mse-pg-clip";

    function data() {
      return withOutlier ? { x: BASE_X.concat([OUT[0]]), y: BASE_Y.concat([OUT[1]]) } : { x: BASE_X, y: BASE_Y };
    }

    function build() {
      layout = stageBox.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact";
      Wd = compact ? 360 : 640; Ht = compact ? 300 : 320;
      m = compact ? { l: 34, r: 12, t: 30, b: 32 } : { l: 44, r: 20, t: 30, b: 34 };
      sx = function (x) { return m.l + ((x - X0) / (X1 - X0)) * (Wd - m.l - m.r); };
      sy = function (y) { return m.t + (1 - (y - Y0) / (Y1 - Y0)) * (Ht - m.t - m.b); };
      if (svg) svg.remove();
      var S = LC.svg;
      svg = S("svg", { viewBox: "0 0 " + Wd + " " + Ht, role: "img", "aria-label": "Scatter plot of the data points with your line. Orange squares show each point's squared error. The readout below gives the mean squared error." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "400px";
      stageBox.appendChild(svg);
      var defs = S("defs", {}, svg), cp = S("clipPath", { id: clipId }, defs);
      S("rect", { x: m.l, y: m.t, width: Wd - m.l - m.r, height: Ht - m.t - m.b }, cp);
      [0, 2, 4, 6].forEach(function (v) { S("line", { x1: m.l, x2: Wd - m.r, y1: sy(v), y2: sy(v), class: "s-grid" }, svg); });
      S("path", { d: "M" + m.l + " " + m.t + "V" + (Ht - m.b) + "H" + (Wd - m.r), class: "s-axis" }, svg);
      [0, 2, 4, 6].forEach(function (v) { S("text", { x: m.l - 6, y: sy(v) + 4, class: "t t-sm t-muted t-end", text: v }, svg); });
      [1, 2, 3, 4, 5].forEach(function (v) { S("text", { x: sx(v), y: Ht - m.b + 18, class: "t t-sm t-muted t-mid", text: v }, svg); });
      S("text", { x: Wd - m.r, y: Ht - m.b + 18, class: "t t-sm t-muted t-end", text: "x →" }, svg);
      S("text", { x: 4, y: 16, class: "t t-sm t-muted", text: "↑ y" }, svg);
      var clipped = S("g", { "clip-path": "url(#" + clipId + ")" }, svg);
      sqG = S("g", {}, clipped);
      resG = S("g", {}, clipped);
      line = S("path", { class: "s-blue" }, clipped);
      ptsG = S("g", {}, svg);
      draw();
    }

    function draw() {
      var w = parseFloat(sw.value), b = parseFloat(sb.value), d = data(), S = LC.svg;
      ow.textContent = w.toFixed(2); ob.textContent = b.toFixed(2);
      line.setAttribute("d", "M" + sx(X0) + " " + sy(w * X0 + b) + "L" + sx(X1) + " " + sy(w * X1 + b));
      [sqG, resG, ptsG].forEach(function (g) { while (g.firstChild) g.removeChild(g.firstChild); });
      var unit = sy(0) - sy(1); // px per y unit
      var sum2 = 0, sum1 = 0, outSq = 0;
      d.x.forEach(function (x, i) {
        var yh = w * x + b, e = d.y[i] - yh, side = Math.abs(e) * unit;
        sum2 += e * e; sum1 += Math.abs(e);
        if (i >= BASE_X.length) outSq = e * e;
        if (side > 0.5) {
          S("rect", { x: sx(x), y: Math.min(sy(d.y[i]), sy(yh)), width: side, height: side, class: "f-orange", "fill-opacity": 0.16, stroke: "var(--a-orange)", "stroke-width": 1.2 }, sqG);
          var r = S("line", { x1: sx(x), x2: sx(x), y1: sy(d.y[i]), y2: sy(yh), class: "s-orange" }, resG);
          r.style.strokeLinecap = "butt"; r.setAttribute("stroke-width", 2);
        }
        S("circle", { cx: sx(x), cy: sy(d.y[i]), r: 5.5, class: i >= BASE_X.length ? "f-orange" : "f-ink", stroke: "var(--a-paper)", "stroke-width": 1.5 }, ptsG);
      });
      var n = d.x.length, mse = sum2 / n, mae = sum1 / n;
      var best = fitLS(d.x, d.y), bestMse = 0;
      d.x.forEach(function (x, i) { var e = d.y[i] - (best.w * x + best.b); bestMse += e * e / n; });
      readout.textContent = "MSE = " + mse.toFixed(2) + " · MAE = " + mae.toFixed(2) + " · best possible MSE = " + bestMse.toFixed(2);
      var ratio = mse / bestMse;
      var msg;
      if (ratio < 1.02) msg = "That's the least-squares line: no other w and b give a lower MSE on these points.";
      else if (ratio < 1.5) msg = "Close! You're within " + Math.round((ratio - 1) * 100) + "% of the lowest possible MSE.";
      else msg = "Your MSE is " + ratio.toFixed(1) + "× the lowest possible. Try shrinking the biggest squares first.";
      if (withOutlier && mse > 0) msg += " The orange outlier alone makes up " + Math.round((outSq / n) / mse * 100) + "% of the MSE.";
      hint.textContent = msg;
    }

    function set(w, b) { sw.value = w; sb.value = b; draw(); }
    sw.addEventListener("input", draw);
    sb.addEventListener("input", draw);
    root.addEventListener("click", function (e) {
      var btn = e.target.closest("button"); if (!btn) return;
      if (btn.dataset.act === "best") { var f = fitLS(data().x, data().y); set(f.w.toFixed(2), f.b.toFixed(2)); }
      else if (btn.dataset.act === "reset") set(0.5, 0.5);
      else if (btn.dataset.act === "outlier") {
        withOutlier = !withOutlier;
        btn.setAttribute("aria-pressed", String(withOutlier));
        draw();
      }
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
    var root = document.getElementById("mse-playground");
    if (root) init(root);
  });
})();
