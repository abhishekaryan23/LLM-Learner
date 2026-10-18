/* M2.3 playground: learning-rate schedule shapes over a 100,000-step run.
   Linear warmup from 0 to the peak, then cosine decay, warmup-stable-decay (WSD, linear
   cool-down) or constant, ending at a chosen fraction of the peak. */
(function () {
  var LC = window.LC;
  var T = 100000, YMAX = 1e-3;

  function lrAt(t, s) {
    var tw = s.warm / 100 * T, min = s.peak * s.minPct / 100;
    if (t < tw) return s.peak * t / tw;
    if (s.kind === "constant") return s.peak;
    if (s.kind === "cosine") {
      var q = (t - tw) / Math.max(1, T - tw);
      return min + 0.5 * (s.peak - min) * (1 + Math.cos(Math.PI * q));
    }
    var td = s.decay / 100 * T, start = T - td;                    // WSD
    if (t < Math.max(start, tw)) return s.peak;
    var r = (t - Math.max(start, tw)) / Math.max(1, T - Math.max(start, tw));
    return s.peak + (min - s.peak) * r;
  }
  function sci(v) {
    if (v === 0) return "0";
    var e = Math.floor(Math.log10(v)), m = v / Math.pow(10, e);
    if (m >= 9.995) { m /= 10; e += 1; }
    return m.toFixed(1) + "e" + e;
  }
  var HINTS = {
    cosine: "Warmup + cosine: the classic recipe (GPT-3, Llama 2, Llama 3). The rate falls slowly at first, fastest mid-run, then gently lands.",
    wsd: "Warmup-stable-decay: hold the peak, then cool down at the end. You can stop and branch a cool-down from any checkpoint, without fixing the run length in advance.",
    constant: "No decay: training never 'settles'. The loss stays higher than with a decay, which is why almost every run cools down at the end."
  };

  function init(root) {
    var stage = root.querySelector(".pg-stage"), readout = root.querySelector(".pg-readout"), hint = root.querySelector(".pg-hint");
    var inputs = {}, outs = {};
    root.querySelectorAll("input[type=range]").forEach(function (r) { inputs[r.name] = r; outs[r.name] = root.querySelector('output[for="' + r.id + '"]'); });
    var s = { kind: "cosine" }, layout = null, svg, curve, area, warmLine, dot, sx, sy, W, H, m;

    function read() {
      s.warm = parseFloat(inputs.warm.value);
      s.peak = parseFloat(inputs.peak.value) * 1e-4;
      s.minPct = parseFloat(inputs.min.value);
      s.decay = parseFloat(inputs.decay.value);
      outs.warm.textContent = s.warm.toFixed(1) + "% (" + Math.round(s.warm / 100 * T).toLocaleString("en-US") + " steps)";
      outs.peak.textContent = sci(s.peak);
      outs.min.textContent = s.minPct + "% of peak";
      outs.decay.textContent = s.decay + "% of the run";
      inputs.decay.disabled = s.kind !== "wsd";
      inputs.min.disabled = s.kind === "constant";
      inputs.decay.closest("label").style.opacity = s.kind === "wsd" ? 1 : 0.45;
      inputs.min.closest("label").style.opacity = s.kind === "constant" ? 0.45 : 1;
    }

    function build() {
      layout = stage.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact";
      W = compact ? 360 : 640; H = compact ? 220 : 250;
      m = compact ? { l: 44, r: 12, t: 30, b: 34 } : { l: 52, r: 20, t: 30, b: 36 };
      sx = function (t) { return m.l + (t / T) * (W - m.l - m.r); };
      sy = function (v) { return m.t + (1 - v / YMAX) * (H - m.t - m.b); };
      if (svg) svg.remove();
      var S = LC.svg;
      svg = S("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Learning rate over 100,000 training steps for the chosen schedule. The readout below gives the key values." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "340px";
      stage.appendChild(svg);
      [2.5e-4, 5e-4, 7.5e-4, 1e-3].forEach(function (v) { S("line", { x1: m.l, x2: W - m.r, y1: sy(v), y2: sy(v), class: "s-grid" }, svg); });
      S("path", { d: "M" + m.l + " " + m.t + "V" + sy(0) + "H" + (W - m.r), class: "s-axis" }, svg);
      [[0, "0"], [5e-4, "5e-4"], [1e-3, "1e-3"]].forEach(function (v) { S("text", { x: m.l - 6, y: sy(v[0]) + 4, class: "t t-sm t-muted t-end", text: v[1] }, svg); });
      [[0, "0"], [50000, "50k"], [100000, "100k"]].forEach(function (v, i) {
        S("text", { x: sx(v[0]), y: sy(0) + 18, class: "t t-sm t-muted " + (i === 2 ? "t-end" : "t-mid"), text: v[1] }, svg);
      });
      S("text", { x: sx(75000), y: sy(0) + 18, class: "t t-sm t-muted t-mid", text: "step →" }, svg);
      S("text", { x: 4, y: 14, class: "t t-sm t-muted", text: "↑ learning rate" }, svg);
      area = S("path", { d: "", class: "f-blue", "fill-opacity": 0.12 }, svg);
      warmLine = S("line", { y1: m.t, y2: sy(0), class: "s-faint", "stroke-dasharray": "4 4" }, svg);
      curve = S("path", { d: "", class: "s-blue" }, svg);
      dot = S("circle", { r: 5, class: "f-orange" }, svg);
      draw();
    }

    function draw() {
      read();
      var d = exact();
      curve.setAttribute("d", d);
      area.setAttribute("d", d + "L" + sx(T) + " " + sy(0) + "L" + sx(0) + " " + sy(0) + "Z");
      var tw = s.warm / 100 * T;
      warmLine.setAttribute("x1", sx(tw)); warmLine.setAttribute("x2", sx(tw));
      warmLine.style.opacity = tw > 0 ? 1 : 0;
      dot.setAttribute("cx", sx(tw)); dot.setAttribute("cy", sy(s.peak));
      var mid = lrAt(T / 2, s), end = lrAt(T, s);
      readout.textContent = "peak " + sci(s.peak) + " at step " + Math.round(tw).toLocaleString("en-US") +
        " · step 50k: " + sci(mid) + " · final: " + sci(end);
      hint.textContent = HINTS[s.kind];
    }
    function exact() {   // sample evenly, plus the warmup corner and the WSD knee exactly
      var ts = [], n = 240, i;
      for (i = 0; i <= n; i++) ts.push(T * i / n);
      var tw = s.warm / 100 * T; ts.push(tw);
      if (s.kind === "wsd") ts.push(Math.max(T - s.decay / 100 * T, tw));
      ts.sort(function (a, b) { return a - b; });
      return ts.map(function (t, k) { return (k ? "L" : "M") + sx(t).toFixed(1) + " " + sy(lrAt(t, s)).toFixed(1); }).join("");
    }

    Object.keys(inputs).forEach(function (k) { inputs[k].addEventListener("input", draw); });
    root.querySelectorAll("[data-kind]").forEach(function (c) {
      c.addEventListener("click", function () {
        s.kind = c.dataset.kind;
        root.querySelectorAll("[data-kind]").forEach(function (o) { o.setAttribute("aria-pressed", String(o === c)); });
        draw();
      });
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
    var root = document.getElementById("lr-playground");
    if (root) init(root);
  });
})();
