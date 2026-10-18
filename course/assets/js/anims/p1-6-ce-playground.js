/* P1.6 playground: rain or sun. Reality rains with probability p, the forecast says q.
   Plots cross-entropy H(p, q) as a function of q (in bits), the floor H(p), and the gap
   KL(p‖q) = H(p, q) − H(p) at the chosen q. The readout also shows the reverse KL(q‖p). */
(function () {
  var LC = window.LC;
  var YMAX = 4;
  function lg(x) { return Math.log(x) / Math.LN2; }
  function H(p) { return -(p > 0 ? p * lg(p) : 0) - (p < 1 ? (1 - p) * lg(1 - p) : 0); }
  function CE(p, q) { return -(p * lg(q) + (1 - p) * lg(1 - q)); }
  function KL(p, q) { return CE(p, q) - H(p); }

  function init(root) {
    var stageBox = root.querySelector(".pg-stage");
    var pIn = root.querySelector('input[data-k="p"]'), qIn = root.querySelector('input[data-k="q"]');
    var pOut = root.querySelector('output[data-o="p"]'), qOut = root.querySelector('output[data-o="q"]');
    var readout = root.querySelector(".pg-readout"), hint = root.querySelector(".pg-hint");
    var layout = null, svg, el = {}, sx, sy, m, W, H0;

    function build() {
      layout = stageBox.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact";
      W = compact ? 360 : 600; H0 = compact ? 250 : 260;
      m = compact ? { l: 34, r: 12, t: 46, b: 34 } : { l: 44, r: 20, t: 46, b: 36 };
      sx = function (q) { return m.l + q * (W - m.l - m.r); };
      sy = function (v) { return m.t + (1 - v / YMAX) * (H0 - m.t - m.b); };
      if (svg) svg.remove();
      var S = LC.svg;
      svg = S("svg", { viewBox: "0 0 " + W + " " + H0, role: "img", "aria-label": "Cross-entropy in bits as a function of the forecast probability of rain, with the entropy of reality as a dashed floor and the KL gap at the chosen forecast. The readout below gives the numbers." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "340px";
      stageBox.appendChild(svg);
      [1, 2, 3, 4].forEach(function (v) { S("line", { x1: m.l, x2: W - m.r, y1: sy(v), y2: sy(v), class: "s-grid" }, svg); });
      S("path", { d: "M" + m.l + " " + m.t + "V" + sy(0) + "H" + (W - m.r), class: "s-axis" }, svg);
      [0, 2, 4].forEach(function (v) { S("text", { x: m.l - 6, y: sy(v) + 4, class: "t t-sm t-muted t-end", text: v }, svg); });
      [0, 0.5, 1].forEach(function (q) { S("text", { x: sx(q), y: sy(0) + 17, class: "t t-sm t-muted t-mid", text: q }, svg); });
      S("text", { x: 4, y: 16, class: "t t-sm t-muted", text: "↑ bits" }, svg);
      S("text", { x: sx(0.75), y: sy(0) + 17, class: "t t-sm t-muted t-mid", text: "forecast q(rain) →" }, svg);
      var id = "p16pg" + Math.random().toString(36).slice(2, 8);
      var cp = S("clipPath", { id: id }, S("defs", {}, svg));
      S("rect", { x: m.l, y: m.t - 4, width: W - m.l - m.r, height: H0 - m.t - m.b + 4 }, cp);
      var plot = S("g", { "clip-path": "url(#" + id + ")" }, svg);
      el.ce = S("path", { class: "s-blue" }, plot);
      el.floor = S("path", { class: "s-ink", style: "stroke-width:1.5", "stroke-dasharray": "6 5" }, svg);
      el.gap = S("path", { class: "s-orange", style: "stroke-width:5;stroke-linecap:butt" }, plot);
      el.dot = S("circle", { r: 6, class: "f-orange", stroke: "var(--a-ink)", "stroke-width": 1.5 }, svg);
      el.fdot = S("circle", { r: 4, class: "f-ink" }, svg);
      // legend row above the plot (its own band, never on the curves)
      var lx = compact ? 46 : 70;
      S("line", { x1: lx, x2: lx + 18, y1: 30, y2: 30, class: "s-blue" }, svg);
      S("text", { x: lx + 24, y: 34, class: "t t-sm", text: "H(p,q)" }, svg);
      S("line", { x1: lx + 84, x2: lx + 102, y1: 30, y2: 30, class: "s-ink", style: "stroke-width:1.5", "stroke-dasharray": "6 5" }, svg);
      S("text", { x: lx + 108, y: 34, class: "t t-sm", text: "H(p)" }, svg);
      S("line", { x1: lx + 154, x2: lx + 172, y1: 30, y2: 30, class: "s-orange", style: "stroke-width:5;stroke-linecap:butt" }, svg);
      S("text", { x: lx + 178, y: 34, class: "t t-sm", text: "KL(p‖q)" }, svg);
      draw();
    }

    function draw() {
      var p = +pIn.value, q = +qIn.value;
      pOut.textContent = p.toFixed(2); qOut.textContent = q.toFixed(2);
      el.ce.setAttribute("d", LC.fnPath(function (x) { return CE(p, x); }, 0.005, 0.995, sx, sy, 160));
      var h = H(p), ce = CE(p, q);
      el.floor.setAttribute("d", "M" + m.l + " " + sy(h).toFixed(1) + "H" + (W - m.r));
      el.gap.setAttribute("d", ce - h < 0.003 ? "" : "M" + sx(q).toFixed(1) + " " + sy(h).toFixed(1) + "V" + sy(ce).toFixed(1));
      el.dot.setAttribute("cx", sx(q).toFixed(1)); el.dot.setAttribute("cy", sy(ce).toFixed(1));
      el.dot.style.display = ce > YMAX ? "none" : "";
      el.fdot.setAttribute("cx", sx(p).toFixed(1)); el.fdot.setAttribute("cy", sy(h).toFixed(1));
      var kpq = KL(p, q), kqp = KL(q, p);
      readout.textContent = "H(p) = " + h.toFixed(3) + " · H(p,q) = " + ce.toFixed(3) + " · KL(p‖q) = " + kpq.toFixed(3) + " · KL(q‖p) = " + kqp.toFixed(3) + " bits";
      var msg;
      if (kpq < 0.005) msg = "Forecast matches reality: cross-entropy hits its floor H(p), and the KL divergence is 0.";
      else if (kpq > 0.8) msg = "Confident and wrong: every surprise from a near-zero forecast costs many bits. Confident mistakes are punished hardest.";
      else if (Math.abs(kpq - kqp) > 0.1) msg = "Notice KL(p‖q) ≠ KL(q‖p): KL is not symmetric, so it isn't a true distance.";
      else msg = "The orange gap is the KL divergence: the extra bits you pay for using q instead of p.";
      hint.textContent = msg;
      root.querySelectorAll("[data-p]").forEach(function (c) { c.setAttribute("aria-pressed", String(+c.dataset.p === p && +c.dataset.q === q)); });
    }

    pIn.addEventListener("input", draw);
    qIn.addEventListener("input", draw);
    root.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-p]"); if (!b) return;
      pIn.value = b.dataset.p; qIn.value = b.dataset.q; draw();
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
    var root = document.getElementById("ce-playground");
    if (root) init(root);
  });
})();
