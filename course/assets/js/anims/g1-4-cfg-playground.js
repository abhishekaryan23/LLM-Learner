/* G1.4 playground: classifier-free guidance on the two-moons toy. Each moon is a class.
   Samples come from deterministic DDIM (25 steps) with the exact guided noise
   eps_u + w (eps_c − eps_u), so the picture is the true effect of the guidance scale w. */
(function () {
  var LC = window.LC, G = LC.g1;
  var N = 120, STEPS = 25;
  function regime(w) {
    if (w === 0) return "w = 0: the unconditional model. The class is ignored, so samples cover both moons.";
    if (w < 1) return "0 < w < 1: a blend of unconditional and conditional. Some samples still land on the other moon.";
    if (w === 1) return "w = 1: the plain conditional model, no extra push. Samples cover the whole target moon.";
    if (w <= 4) return "w > 1: guidance extrapolates past the conditional model. Samples crowd toward the part of the moon furthest from the other class: fidelity up, diversity down.";
    return "Strong guidance: samples bunch into a small, extreme region and start drifting off the data, the toy version of over-saturated, samey images.";
  }

  function init(root) {
    var stageBox = root.querySelector(".pg-stage");
    var slider = root.querySelector("input[type=range]"), out = root.querySelector("output");
    var readout = root.querySelector(".pg-readout"), hint = root.querySelector(".pg-hint");
    var layout = null, svg, fr, dots, band, tag, cls = 0, raf = 0;
    var Z = G.noise(N, 404);

    function build() {
      layout = stageBox.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact";
      var W = compact ? 360 : 600, H = compact ? 272 : 344;
      var box = compact ? { x: 10, y: 8, w: 340, h: 255 } : { x: 70, y: 8, w: 440, h: 330 };
      if (svg) svg.remove();
      svg = LC.svg("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Samples from the two-moons toy under classifier-free guidance. The readout below gives the share of samples on the target moon and their spread." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "400px";
      stageBox.appendChild(svg);
      fr = G.frame(svg, box);
      band = LC.svg("path", { class: "s-orange", "stroke-width": compact ? 16 : 20, "stroke-linecap": "round", "stroke-linejoin": "round", opacity: 0.28 }, svg);
      tag = LC.svg("text", { x: box.x + 10, y: box.y + 20, class: "t t-sm t-orange", text: "" }, svg);
      var g = LC.svg("g", { "clip-path": fr.clip }, svg);
      dots = G.dots(g, Z, fr, "f-blue", compact ? 2.6 : 3);
      draw();
    }

    function draw() {
      var w = Math.round(parseFloat(slider.value) * 10) / 10;
      out.textContent = w.toFixed(1);
      var d = "";
      for (var k = 0; k < G.K; k++) { var c = G.C[cls * G.K + k]; d += (k ? "L" : "M") + fr.sx(c[0]).toFixed(1) + " " + fr.sy(c[1]).toFixed(1); }
      band.setAttribute("d", d);
      tag.textContent = "target class: " + (cls === 0 ? "upper moon" : "lower moon");
      var tr = G.ddim(Z, STEPS, { w: w, cls: cls });
      var fin = tr.map(function (t) { return t[t.length - 1]; });
      G.place(dots, fin, fr);
      var on = 0, mx = 0, my = 0, dist = 0;
      fin.forEach(function (p) { var n = G.nearest(p[0], p[1]); if (n.cls === cls) on++; dist += n.d; mx += p[0]; my += p[1]; });
      mx /= N; my /= N;
      var v = 0; fin.forEach(function (p) { v += (p[0] - mx) * (p[0] - mx) + (p[1] - my) * (p[1] - my); });
      readout.textContent = "w = " + w.toFixed(1) + " · on target moon " + Math.round(100 * on / N) + "% · spread " + Math.sqrt(v / N).toFixed(2) + " · avg distance to data " + (dist / N).toFixed(2);
      hint.textContent = regime(w);
      root.querySelectorAll("[data-w]").forEach(function (c) { c.setAttribute("aria-pressed", String(parseFloat(c.dataset.w) === w)); });
      root.querySelectorAll("[data-cls]").forEach(function (c) { c.setAttribute("aria-pressed", String(+c.dataset.cls === cls)); });
    }
    function schedule() { if (raf) return; raf = requestAnimationFrame(function () { raf = 0; draw(); }); }

    slider.addEventListener("input", schedule);
    root.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.w != null) { slider.value = b.dataset.w; draw(); }
      else if (b.dataset.cls != null) { cls = +b.dataset.cls; draw(); }
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
    var root = document.getElementById("cfg-playground");
    if (root) init(root);
  });
})();
