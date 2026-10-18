/* IN.3 playground: the sparsity–reconstruction trade-off. Each setting is a real SAE trained
   offline (PyTorch, Adam, 1,500 steps of 512 samples) on synthetic data: 64 true unit-norm
   feature directions in 32 dimensions, each active with probability 0.05 at a strength drawn
   uniformly from [0.5, 1.5] (3.2 active per input on average). SAE: 128 latents, ReLU encoder,
   unit-norm decoder columns, loss = squared error + λ × L1. Same setup as the IN.3 notebook.
   nmse = reconstruction error / data variance; l0 = mean active latents; rec = true features
   whose best-matching decoder column has cosine > 0.9; f = the latents for one test input
   (true features 50, 56 and 59); match = latents matching those three. */
(function () {
  var LC = window.LC;
  var DATA = [
    {"lam":0.0,"nmse":0.0003,"l0":93.87,"mmcs":0.491,"rec":0,"dead":0,"match":[],"f":[0.0,0.16,0.25,0.53,0.3,0.11,0.19,0.0,0.34,0.03,0.48,0.16,0.26,0.0,0.0,0.24,0.69,0.34,0.18,0.18,0.0,0.28,0.13,0.0,0.0,0.2,0.0,0.06,0.24,0.0,0.0,0.34,0.54,0.0,0.15,0.16,0.45,0.61,0.35,0.54,0.23,0.18,0.38,0.34,0.3,0.0,0.0,0.3,0.34,0.0,0.57,0.52,0.16,0.0,0.18,0.18,0.2,0.0,0.05,0.21,0.0,0.26,0.12,0.53,0.0,0.06,0.0,0.0,0.39,0.0,0.72,0.03,0.4,0.2,0.54,0.2,0.0,0.16,0.22,0.13,0.32,0.21,0.33,0.24,0.19,0.27,0.47,0.0,0.0,0.21,0.72,0.19,0.13,0.41,0.0,0.38,0.38,0.06,0.0,0.0,0.55,0.0,0.12,0.0,0.0,0.22,0.1,0.35,0.19,0.36,0.15,0.45,0.43,0.0,0.19,0.5,0.08,0.42,0.3,0.17,0.26,0.45,0.0,0.24,0.4,0.0,0.14,0.0]},
    {"lam":0.01,"nmse":0.0005,"l0":55.98,"mmcs":0.626,"rec":0,"dead":0,"match":[],"f":[0.04,0.0,0.0,0.15,0.0,0.0,0.0,0.0,0.06,0.03,0.09,0.0,0.0,0.0,0.02,0.0,0.42,0.03,0.0,0.0,0.0,0.0,0.0,0.01,0.75,0.13,0.27,0.0,0.0,0.0,0.0,0.1,0.0,0.0,0.0,0.0,0.03,0.27,0.0,0.36,0.0,0.0,0.12,0.11,0.0,0.18,0.05,0.0,0.0,0.0,0.29,0.0,0.0,0.0,0.0,0.01,0.0,0.02,0.0,0.11,0.43,0.1,0.07,0.0,0.05,0.0,0.16,0.0,0.0,0.0,0.73,0.0,0.08,0.17,0.01,0.0,0.02,0.41,0.15,0.03,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.08,0.0,0.02,0.0,0.0,0.0,0.0,0.12,0.0,0.02,0.0,0.0,0.0,0.0,0.0,0.0,0.02,0.0,0.0,0.01,0.0,0.01,0.0,0.3,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.04,0.02,0.0,0.0,0.01,0.0,0.0,0.02,0.01]},
    {"lam":0.03,"nmse":0.0045,"l0":47.95,"mmcs":0.786,"rec":4,"dead":0,"match":[],"f":[0.0,0.0,0.0,0.25,0.01,0.0,0.0,0.0,0.03,0.11,0.0,0.06,0.0,0.0,0.0,0.0,0.47,0.04,0.0,0.0,0.0,0.0,0.0,0.0,0.6,0.11,0.03,0.0,0.0,0.0,0.0,0.02,0.0,0.0,0.01,0.0,0.0,0.0,0.08,0.05,0.0,0.0,0.0,0.0,0.14,0.31,0.09,0.0,0.0,0.0,0.0,0.01,0.0,0.0,0.0,0.09,0.0,0.02,0.0,0.29,0.59,0.0,0.01,0.0,0.32,0.0,0.13,0.0,0.0,0.02,0.54,0.0,0.0,0.16,0.01,0.0,0.04,0.43,0.08,0.06,0.0,0.0,0.0,0.01,0.0,0.0,0.03,0.02,0.0,0.0,0.03,0.07,0.0,0.06,0.0,0.11,0.0,0.14,0.08,0.0,0.0,0.0,0.0,0.03,0.0,0.0,0.0,0.02,0.0,0.0,0.0,0.13,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.02,0.0,0.0,0.0,0.0,0.0]},
    {"lam":0.06,"nmse":0.0177,"l0":35.41,"mmcs":0.892,"rec":35,"dead":0,"match":[77],"f":[0.0,0.0,0.0,0.11,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.04,0.0,0.0,0.0,0.0,0.16,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.41,0.05,0.0,0.0,0.0,0.02,0.0,0.02,0.0,0.0,0.0,0.0,0.03,0.0,0.08,0.0,0.01,0.0,0.0,0.0,0.0,0.21,0.0,0.04,0.0,0.0,0.0,0.0,0.0,0.03,0.0,0.01,0.0,0.0,0.0,0.34,0.67,0.0,0.0,0.0,0.2,0.03,0.0,0.0,0.0,0.0,0.46,0.0,0.02,0.04,0.0,0.0,0.08,0.45,0.03,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.46,0.02,0.0,0.0,0.0,0.06,0.01,0.0,0.0,0.03,0.0,0.05,0.11,0.0,0.0,0.0,0.0,0.07,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.37,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.04,0.0,0.0,0.0,0.0,0.0,0.0,0.0]},
    {"lam":0.1,"nmse":0.0399,"l0":24.89,"mmcs":0.935,"rec":53,"dead":0,"match":[77,60,51],"f":[0.11,0.0,0.0,0.09,0.0,0.0,0.0,0.0,0.0,0.13,0.0,0.0,0.0,0.0,0.0,0.0,0.15,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.09,0.03,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.02,0.0,0.0,0.01,0.04,0.02,0.0,0.11,0.0,0.0,0.0,0.0,0.0,0.6,0.0,0.19,0.0,0.0,0.0,0.0,0.0,0.27,0.88,0.0,0.0,0.0,0.1,0.0,0.0,0.0,0.0,0.03,0.28,0.0,0.0,0.0,0.0,0.0,0.0,0.41,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.18,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.09,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.01,0.0,0.27,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.07,0.0,0.0,0.0,0.0,0.0,0.02,0.0]},
    {"lam":0.2,"nmse":0.0735,"l0":14.42,"mmcs":0.967,"rec":64,"dead":0,"match":[59,60,51],"f":[0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.06,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.01,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.06,0.0,0.0,0.0,0.03,0.0,0.0,0.04,0.04,0.0,0.0,0.0,0.0,0.54,0.0,0.07,0.0,0.0,0.0,0.0,0.0,0.27,0.64,0.0,0.0,0.02,0.0,0.0,0.0,0.0,0.0,0.0,0.59,0.0,0.0,0.0,0.0,0.0,0.0,0.21,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.36,0.0,0.0,0.03,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.03,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.04,0.0,0.0,0.0,0.0,0.27,0.01,0.0]},
    {"lam":0.3,"nmse":0.1009,"l0":10.81,"mmcs":0.973,"rec":64,"dead":0,"match":[63,70,51],"f":[0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.02,0.0,0.0,0.0,0.0,0.0,0.0,0.02,0.0,0.0,0.0,0.0,0.0,0.51,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.26,0.49,0.0,0.0,0.34,0.0,0.0,0.0,0.0,0.0,0.0,0.74,0.0,0.0,0.0,0.0,0.0,0.0,0.07,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.39,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0]},
    {"lam":0.5,"nmse":0.1605,"l0":7.73,"mmcs":0.969,"rec":64,"dead":0,"match":[59,70,87],"f":[0.0,0.0,0.0,0.13,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.09,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.02,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.3,0.01,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,1.0,0.0,0.0,0.0,0.0,0.0,0.0,0.29,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.64,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0]},
    {"lam":0.8,"nmse":0.2709,"l0":5.69,"mmcs":0.96,"rec":64,"dead":1,"match":[77,12,24],"f":[0.0,0.0,0.0,0.35,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.69,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.56,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.21,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.25,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0]},
    {"lam":1.2,"nmse":0.4433,"l0":4.24,"mmcs":0.943,"rec":61,"dead":4,"match":[96,3],"f":[0.0,0.0,0.0,0.73,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.06,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.05,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.39,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.21,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0]}
  ];
  var NT = 64, TRUE_L0 = 3.2;

  function init(root) {
    var stage = root.querySelector(".pg-stage");
    var slider = root.querySelector('[data-in="lam"]');
    var outL = root.querySelector('[data-out="lam"]');
    var readout = root.querySelector(".pg-readout");
    var layout = null, svg, G, P, Q;

    function lx(v) { return P.x0 + (Math.log10(v) - Math.log10(3)) / (Math.log10(120) - Math.log10(3)) * P.w; }
    function ly(v) { return P.y0 + P.h - v / 0.5 * P.h; }

    function build() {
      layout = stage.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact";
      var W = compact ? 360 : 640, H = compact ? 420 : 304;
      P = compact ? { x0: 52, y0: 40, w: 286, h: 160 } : { x0: 60, y0: 44, w: 260, h: 192 };
      Q = compact ? { x0: 20, y0: 296, w: 320, h: 70, ty: 282 } : { x0: 356, y0: 70, w: 268, h: 120, ty: 44 };
      if (svg) svg.remove();
      svg = LC.svg("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "A plot of reconstruction error against the average number of active latents for SAEs trained with different sparsity penalties, and the latent activations for one test input. The readout below describes them." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "400px";
      stage.appendChild(svg);
      var S = LC.svg;
      S("text", { x: P.x0 - 40, y: compact ? 18 : 22, class: "t t-sm t-muted", text: "reconstruction error (% of variance)" }, svg);
      S("line", { x1: P.x0, x2: P.x0 + P.w, y1: P.y0 + P.h, y2: P.y0 + P.h, class: "s-axis" }, svg);
      S("line", { x1: P.x0, x2: P.x0, y1: P.y0, y2: P.y0 + P.h, class: "s-axis" }, svg);
      [0, 0.2, 0.4].forEach(function (v) {
        S("line", { x1: P.x0, x2: P.x0 + P.w, y1: ly(v), y2: ly(v), class: "s-grid" }, svg);
        S("text", { x: P.x0 - 6, y: ly(v) + 4, class: "t t-sm t-muted t-end", text: Math.round(v * 100) + "%" }, svg);
      });
      [3, 10, 30, 100].forEach(function (v) {
        S("line", { x1: lx(v), x2: lx(v), y1: P.y0 + P.h, y2: P.y0 + P.h + 5, class: "s-axis" }, svg);
        S("text", { x: lx(v), y: P.y0 + P.h + 19, class: "t t-sm t-muted t-mid", text: String(v) }, svg);
      });
      S("text", { x: P.x0 + P.w, y: P.y0 + P.h + 38, class: "t t-sm t-muted t-end", text: "active latents per input (log scale) →" }, svg);
      // true L0 marker
      S("line", { x1: lx(TRUE_L0), x2: lx(TRUE_L0), y1: P.y0, y2: P.y0 + P.h, class: "s-grid", "stroke-dasharray": "4 4", style: "stroke:var(--a-orange)" }, svg);
      S("text", { x: lx(TRUE_L0) + 5, y: P.y0 + P.h - 8, class: "t t-sm t-orange", text: "true: 3.2" }, svg);
      var d = "";
      DATA.forEach(function (r, i) { d += (i ? "L" : "M") + lx(r.l0).toFixed(1) + " " + ly(r.nmse).toFixed(1); });
      S("path", { d: d, class: "s-blue", "stroke-width": 2, opacity: 0.5 }, svg);
      DATA.forEach(function (r) { S("circle", { cx: lx(r.l0), cy: ly(r.nmse), r: 3.5, class: "f-blue", opacity: 0.6 }, svg); });
      G = {};
      G.dot = S("circle", { r: 7, class: "f-orange", stroke: "var(--a-paper)", "stroke-width": 2 }, svg);
      // strip
      S("text", { x: Q.x0, y: Q.ty, class: "t t-sm t-muted", text: "one input's 128 latents (orange = matches a true feature)" }, svg);
      if (!compact) {
        // wrap long title on the narrow right panel
        svg.lastChild.textContent = "one input's 128 latents";
        S("text", { x: Q.x0, y: Q.ty + 16, class: "t t-sm t-muted", text: "orange = matches a true feature" }, svg);
      }
      S("line", { x1: Q.x0, x2: Q.x0 + Q.w, y1: Q.y0 + Q.h, y2: Q.y0 + Q.h, class: "s-axis" }, svg);
      G.bars = [];
      var bw = Q.w / 128;
      for (var k = 0; k < 128; k++) G.bars.push(S("rect", { x: (Q.x0 + k * bw).toFixed(2), y: Q.y0 + Q.h, width: Math.max(1, bw - 0.6).toFixed(2), height: 0, class: "f-blue" }, svg));
      G.cnt = S("text", { x: Q.x0 + Q.w, y: Q.y0 + Q.h + 18, class: "t t-sm t-end", text: "" }, svg);
      draw();
    }

    function draw() {
      var r = DATA[+slider.value];
      outL.textContent = r.lam;
      G.dot.setAttribute("cx", lx(r.l0)); G.dot.setAttribute("cy", ly(r.nmse));
      var mx = Math.max.apply(null, DATA.map(function (q) { return Math.max.apply(null, q.f); }));
      var act = 0;
      r.f.forEach(function (v, k) {
        var h = Math.min(1, v / mx) * Q.h;
        G.bars[k].setAttribute("y", (Q.y0 + Q.h - h).toFixed(1));
        G.bars[k].setAttribute("height", h.toFixed(1));
        G.bars[k].setAttribute("class", r.match.indexOf(k) >= 0 ? "f-orange" : "f-blue");
        if (v > 0) act++;
      });
      G.cnt.textContent = act + " of 128 active";
      readout.textContent = "λ = " + r.lam + ": " + r.l0.toFixed(1) + " latents active per input on average (the data has 3.2 true features per input); reconstruction error " +
        (r.nmse * 100).toFixed(1) + "% of variance; " + r.rec + " of " + NT + " true features recovered (cosine > 0.9)" + (r.dead ? "; " + r.dead + " dead latent" + (r.dead > 1 ? "s" : "") : "") + ".";
    }

    slider.addEventListener("input", draw);
    build();
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        var want = stage.clientWidth < 560 ? "compact" : "wide";
        if (want !== layout) build();
      }).observe(stage);
    }
  }

  document.addEventListener("lc:ready", function () {
    var root = document.getElementById("in-3-tradeoff");
    if (root) init(root);
  });
})();
