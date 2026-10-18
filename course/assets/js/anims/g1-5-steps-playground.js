/* G1.5 playground: sample the two-moons toy by integrating the exact flow-matching
   velocity with N Euler steps. Few steps cut the curved paths short; more steps follow them. */
(function () {
  var LC = window.LC, G = LC.g1;
  var NS = 100, NT = 12;
  function regime(n) {
    if (n === 1) return "One step: every sample jumps to where the average velocity at t = 0 points, the mean of the data.";
    if (n <= 3) return "A few straight jumps can't follow the curved paths: samples land between and around the moons.";
    if (n <= 8) return "The moons appear, but slightly smeared: each jump still cuts the corners of the curved paths.";
    return "Enough steps to follow the curves: samples sit on the moons. More steps now cost time without visible gain.";
  }
  function init(root) {
    var stageBox = root.querySelector(".pg-stage");
    var slider = root.querySelector("input[type=range]"), out = root.querySelector("output");
    var readout = root.querySelector(".pg-readout"), hint = root.querySelector(".pg-hint");
    var layout = null, svg, fr, dots, trails = [];
    var Z = G.noise(NS, 909);
    function build() {
      layout = stageBox.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact";
      var W = compact ? 360 : 600, H = compact ? 272 : 344;
      var box = compact ? { x: 10, y: 8, w: 340, h: 255 } : { x: 70, y: 8, w: 440, h: 330 };
      if (svg) svg.remove();
      svg = LC.svg("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Samples of the two-moons toy produced by Euler integration of a flow-matching model, with a few sample paths drawn. The readout below gives the number of steps and how close samples are to the data." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "400px";
      stageBox.appendChild(svg);
      fr = G.frame(svg, box);
      var g = LC.svg("g", { "clip-path": fr.clip }, svg);
      trails = [];
      for (var i = 0; i < NT; i++) trails.push(LC.svg("path", { class: "s-blue", "stroke-width": 1.5, opacity: 0.7 }, g));
      dots = G.dots(g, Z, fr, "f-orange", compact ? 2.6 : 3);
      draw();
    }
    function draw() {
      var n = +slider.value;
      out.textContent = n;
      var tr = G.euler(Z, n), dist = 0;
      var fin = tr.map(function (t) { return t[t.length - 1]; });
      G.place(dots, fin, fr);
      for (var i = 0; i < NT; i++) trails[i].setAttribute("d", G.polyline(tr[i], fr));
      fin.forEach(function (p) { dist += G.nearest(p[0], p[1]).d; });
      readout.textContent = "Euler steps = network calls = " + n + " · avg distance to data " + (dist / NS).toFixed(2) + " (real data ≈ 0.13)";
      hint.textContent = regime(n);
      root.querySelectorAll("[data-n]").forEach(function (c) { c.setAttribute("aria-pressed", String(+c.dataset.n === n)); });
    }
    slider.addEventListener("input", draw);
    root.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-n]"); if (!b) return;
      slider.value = b.dataset.n; draw();
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
    var root = document.getElementById("fm-playground");
    if (root) init(root);
  });
})();
