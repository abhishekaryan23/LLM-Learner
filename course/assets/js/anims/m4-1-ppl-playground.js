/* M4.1 playground: drag the probability the model gave each of 4 actual tokens and
   watch the surprise bars, their mean (the loss) and the perplexity e^mean update. */
(function () {
  var LC = window.LC;
  var MAXS = -Math.log(0.01);   // 4.61: the tallest possible bar (p = 0.01)

  function init(root) {
    var stage = root.querySelector(".pg-stage");
    var sliders = [].slice.call(root.querySelectorAll("input[type=range]"));
    var outs = sliders.map(function (s) { return s.parentNode.querySelector("output"); });
    var readout = root.querySelector(".pg-readout");
    var layout = null, svg, parts;

    function build() {
      layout = stage.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact";
      var W = compact ? 360 : 640, H = 214;
      var m = { l: compact ? 76 : 96, r: compact ? 8 : 24, t: 48, b: 64 };
      var colW = (W - m.l - m.r) / 4, base = H - m.b, ph = base - m.t;
      if (svg) svg.remove();
      svg = LC.svg("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Bar chart of each token's surprise, minus log p, with a dashed line at their mean. The readout below gives the perplexity." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "300px";
      stage.appendChild(svg);
      var S = LC.svg;
      S("text", { x: 4, y: 16, class: "t t-sm t-muted", text: "↑ surprise −ln p (nats)" }, svg);
      S("line", { x1: m.l, x2: W - m.r, y1: base, y2: base, class: "s-axis" }, svg);
      S("text", { x: m.l - 10, y: base + 22, class: "t t-sm t-muted t-end", text: "p" }, svg);
      S("text", { x: m.l - 10, y: base + 44, class: "t t-sm t-muted t-end", text: "−ln p" }, svg);
      parts = { bars: [], pT: [], sT: [], tok: [] };
      for (var i = 0; i < 4; i++) {
        var x = m.l + colW * i + colW / 2;
        parts.bars.push(S("rect", { x: x - colW * 0.28, width: colW * 0.56, y: base, height: 0, rx: 3, class: "f-orange" }, svg));
        parts.pT.push(S("text", { x: x, y: base + 22, class: "t t-sm t-mono t-mid", text: "" }, svg));
        parts.sT.push(S("text", { x: x, y: base + 44, class: "t t-sm t-mono t-mid", text: "" }, svg));
      }
      parts.mean = S("path", { d: "", class: "s-ink", "stroke-dasharray": "6 5" }, svg);
      parts.meanT = S("text", { x: m.l - 10, y: 0, class: "t t-sm t-end", text: "" }, svg);
      parts.geo = { m: m, W: W, base: base, ph: ph };
      draw();
    }

    function draw() {
      var g = parts.geo;
      var ps = sliders.map(function (s) { return parseFloat(s.value); });
      var sur = ps.map(function (p) { return -Math.log(p); });
      var mean = sur.reduce(function (a, b) { return a + b; }, 0) / 4;
      var ppl = Math.exp(mean);
      function sy(v) { return g.base - (v / MAXS) * g.ph; }
      ps.forEach(function (p, i) {
        var h = g.base - sy(sur[i]);
        parts.bars[i].setAttribute("y", g.base - h); parts.bars[i].setAttribute("height", Math.max(0, h));
        parts.pT[i].textContent = p.toFixed(2);
        parts.sT[i].textContent = sur[i].toFixed(2);
        outs[i].textContent = p.toFixed(2);
      });
      var y = sy(mean);
      parts.mean.setAttribute("d", "M" + g.m.l + " " + y.toFixed(1) + "H" + (g.W - g.m.r));
      parts.meanT.setAttribute("y", (y + 4).toFixed(1));
      parts.meanT.textContent = "mean " + mean.toFixed(2);
      readout.textContent = "Mean surprise " + mean.toFixed(2) + " nats → perplexity e^" + mean.toFixed(2) + " = " + ppl.toFixed(2) +
        ". As unsure as choosing among about " + (ppl < 9.95 ? ppl.toFixed(1) : Math.round(ppl)) + " equally likely tokens.";
      root.querySelectorAll("[data-preset]").forEach(function (c) {
        c.setAttribute("aria-pressed", String(c.dataset.preset === ps.map(function (p) { return p.toFixed(2); }).join(",")));
      });
    }

    sliders.forEach(function (s) { s.addEventListener("input", draw); });
    root.addEventListener("click", function (e) {
      var b = e.target.closest("[data-preset]"); if (!b) return;
      b.dataset.preset.split(",").forEach(function (v, i) { sliders[i].value = v; });
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
    var root = document.getElementById("ppl-playground");
    if (root) init(root);
  });
})();
