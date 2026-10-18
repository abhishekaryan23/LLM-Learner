/* SY.5 playground: reliability compounds over a multi-step task.
   If each step succeeds independently with probability p and any error sinks the task,
   P(task) = p^n. "Check and retry once" toy: a perfect check catches a failed step and the
   step is retried once, independently, so the per-step success becomes 1 − (1 − p)^2. */
(function () {
  var LC = window.LC;
  var NMAX = 50;

  function init(root) {
    var stage = root.querySelector(".pg-stage");
    var sP = root.querySelector("[data-p]"), sN = root.querySelector("[data-n]");
    var oP = root.querySelector("[data-op]"), oN = root.querySelector("[data-on]");
    var bR = root.querySelector('[data-act="retry"]');
    var readout = root.querySelector(".pg-readout");
    var layout = null, svg, P, retry = false;

    function build() {
      layout = stage.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact";
      var W = compact ? 360 : 640, H = compact ? 262 : 290;
      var m = { l: 44, r: compact ? 14 : 24, t: 58, b: 46 };
      if (svg) svg.remove();
      svg = LC.svg("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Line chart of the chance a task succeeds against the number of steps, for the chosen per-step success rate. The readout below gives the value at the chosen number of steps." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "360px";
      stage.appendChild(svg);
      var S = LC.svg;
      var x = function (n) { return m.l + (n / NMAX) * (W - m.l - m.r); };
      var y = function (v) { return m.t + (1 - v) * (H - m.t - m.b); };
      [0, 0.5, 1].forEach(function (v) {
        S("line", { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), class: v ? "s-grid" : "s-axis" }, svg);
        S("text", { x: m.l - 6, y: y(v) + 4, class: "t t-sm t-muted t-end", text: Math.round(v * 100) + "%" }, svg);
      });
      [0, 10, 20, 30, 40, 50].forEach(function (n) {
        S("text", { x: x(n), y: H - m.b + 18, class: "t t-sm t-muted t-mid", text: n }, svg);
      });
      S("text", { x: (m.l + W - m.r) / 2, y: H - 6, class: "t t-sm t-muted t-mid", text: "steps in the task, n →" }, svg);
      S("text", { x: 4, y: 16, class: "t t-sm t-muted", text: "↑ chance the whole task succeeds" }, svg);
      var lg = 38, lx = compact ? 8 : 44;
      S("path", { d: "M" + lx + " " + (lg - 4) + "h22", class: "s-orange" }, svg);
      S("text", { x: lx + 28, y: lg, class: "t t-sm", text: "no checks: pⁿ" }, svg);
      P = { W: W, H: H, m: m, x: x, y: y };
      P.legR = S("g", {}, svg);
      S("path", { d: "M" + (lx + 136) + " " + (lg - 4) + "h22", class: "s-blue", "stroke-dasharray": "6 5", "stroke-width": 2.5 }, P.legR);
      S("text", { x: lx + 164, y: lg, class: "t t-sm", text: "check + retry once" }, P.legR);
      P.nLine = S("line", { y1: m.t - 4, y2: H - m.b, class: "s-faint", "stroke-width": 1.5 }, svg);
      P.ret = S("path", { d: "", class: "s-blue", "stroke-dasharray": "6 5", "stroke-width": 2.5 }, svg);
      P.base = S("path", { d: "", class: "s-orange" }, svg);
      P.dotR = S("circle", { r: 5, class: "f-blue" }, svg);
      P.dot = S("circle", { r: 5.5, class: "f-orange" }, svg);
      draw();
    }

    function pct(v) { return v < 0.001 ? "under 0.1%" : (v * 100).toFixed(1) + "%"; }

    function draw() {
      var p = +sP.value, n = +sN.value, q = 1 - Math.pow(1 - p, 2);
      oP.textContent = p.toFixed(3); oN.textContent = n;
      var d0 = "", d1 = "";
      for (var k = 0; k <= NMAX; k++) {
        d0 += (k ? "L" : "M") + P.x(k).toFixed(1) + " " + P.y(Math.pow(p, k)).toFixed(1);
        d1 += (k ? "L" : "M") + P.x(k).toFixed(1) + " " + P.y(Math.pow(q, k)).toFixed(1);
      }
      P.base.setAttribute("d", d0); P.ret.setAttribute("d", d1);
      var show = retry ? "" : "none";
      P.ret.style.display = show; P.dotR.style.display = show; P.legR.style.display = show;
      var a = Math.pow(p, n), b = Math.pow(q, n);
      P.dot.setAttribute("cx", P.x(n)); P.dot.setAttribute("cy", P.y(a));
      P.dotR.setAttribute("cx", P.x(n)); P.dotR.setAttribute("cy", P.y(b));
      P.nLine.setAttribute("x1", P.x(n)); P.nLine.setAttribute("x2", P.x(n));
      var txt = "Each step right " + (p * 100).toFixed(1) + "% of the time, " + n + " step" + (n > 1 ? "s" : "") + ": " + p.toFixed(3) + "^" + n + " = " + pct(a) + " of tasks finish with no error.";
      var half = Math.log(0.5) / Math.log(p);
      if (p < 1 && isFinite(half)) txt += " Half of all tasks fail by step " + Math.ceil(half) + ".";
      if (retry) txt += " With a check and one retry per step, each step is right " + (q * 100).toFixed(2) + "% of the time and the task succeeds " + pct(b) + ".";
      readout.textContent = txt;
    }

    sP.addEventListener("input", draw);
    sN.addEventListener("input", draw);
    bR.addEventListener("click", function () {
      retry = !retry;
      bR.setAttribute("aria-pressed", String(retry));
      bR.textContent = "Check and retry each step: " + (retry ? "on" : "off");
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
    var root = document.getElementById("sy5-reliability");
    if (root) init(root);
  });
})();
