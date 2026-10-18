/* G1.7 playground: SDEdit on the two-moons toy. A rough "sketch" (a ring of points) is
   noised to step t0 = strength × 1000 with the DDPM schedule, then denoised with DDIM
   using the exact denoiser of the moons data. Low strength keeps the sketch; high
   strength gives realistic points that forget it. */
(function () {
  var LC = window.LC, G = LC.g1;
  var NP = 48;
  function regime(s) {
    if (s === 0) return "Strength 0: nothing happens. The output is the sketch, which isn't on the data.";
    if (s <= 0.1) return "Low strength: a little noise, then denoising pulls each point onto the nearest bit of the moons. The layout of the sketch survives.";
    if (s <= 0.2) return "Middle strength: realistic, and the outputs still sit roughly where the sketch was. On this toy that is the sweet spot; on real images it is usually higher and depends on the model.";
    if (s <= 0.35) return "Higher strength: the outputs start drifting off the sketch toward the rest of the moons, so its layout is fading.";
    return "High strength: almost all of the sketch is drowned in noise, so the output is realistic but ignores where you drew.";
  }
  function init(root) {
    var stageBox = root.querySelector(".pg-stage");
    var slider = root.querySelector("input[type=range]"), out = root.querySelector("output");
    var readout = root.querySelector(".pg-readout"), hint = root.querySelector(".pg-hint");
    var layout = null, svg, fr, dots, links;
    var SK = [], E = G.noise(NP, 717);
    for (var i = 0; i < NP; i++) { var a = 2 * Math.PI * i / NP; SK.push([-0.9 + 0.55 * Math.cos(a), 0.3 + 0.55 * Math.sin(a)]); }
    function build() {
      layout = stageBox.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact";
      var W = compact ? 360 : 600, H = compact ? 272 : 344;
      var box = compact ? { x: 10, y: 8, w: 340, h: 255 } : { x: 70, y: 8, w: 440, h: 330 };
      if (svg) svg.remove();
      svg = LC.svg("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "A ring-shaped sketch of points and the SDEdit output for the chosen strength, on the two-moons toy. The readout below gives the numbers." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "400px";
      stageBox.appendChild(svg);
      fr = G.frame(svg, box);
      var g = LC.svg("g", { "clip-path": fr.clip }, svg);
      links = SK.map(function () { return LC.svg("path", { class: "s-faint", "stroke-width": 1.2 }, g); });
      G.dots(g, SK, fr, "f-ink", compact ? 2 : 2.4).forEach(function (d) { d.setAttribute("opacity", 0.45); });
      dots = G.dots(g, SK, fr, "f-orange", compact ? 2.8 : 3.2);
      LC.svg("text", { x: box.x + 10, y: box.y + 20, class: "t t-sm t-muted", text: "grey ring = your sketch · orange = output" }, svg);
      draw();
    }
    function draw() {
      var s = Math.round(parseFloat(slider.value) * 100) / 100;
      out.textContent = s.toFixed(2);
      var t0 = Math.round(s * G.T), res;
      if (t0 === 0) res = SK.map(function (p) { return [p[0], p[1]]; });
      else {
        var ab = G.AB[t0], sa = Math.sqrt(ab), s1 = Math.sqrt(1 - ab);
        var noisy = SK.map(function (p, i) { return [sa * p[0] + s1 * E[i][0], sa * p[1] + s1 * E[i][1]]; });
        res = G.ddim(noisy, 30, { t0: t0 }).map(function (t) { return t[t.length - 1]; });
      }
      G.place(dots, res, fr);
      var mv = 0, dd = 0;
      res.forEach(function (p, i) {
        links[i].setAttribute("d", "M" + fr.sx(SK[i][0]).toFixed(1) + " " + fr.sy(SK[i][1]).toFixed(1) + "L" + fr.sx(p[0]).toFixed(1) + " " + fr.sy(p[1]).toFixed(1));
        mv += Math.hypot(p[0] - SK[i][0], p[1] - SK[i][1]); dd += G.nearest(p[0], p[1]).d;
      });
      readout.textContent = "strength " + s.toFixed(2) + " → start at t = " + t0 + " (ᾱ = " + G.AB[t0].toFixed(3) + ") · avg move from sketch " + (mv / NP).toFixed(2) + " · avg distance to data " + (dd / NP).toFixed(2);
      hint.textContent = regime(s);
      root.querySelectorAll("[data-s]").forEach(function (c) { c.setAttribute("aria-pressed", String(parseFloat(c.dataset.s) === s)); });
    }
    slider.addEventListener("input", draw);
    root.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-s]"); if (!b) return;
      slider.value = b.dataset.s; draw();
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
    var root = document.getElementById("sdedit-playground");
    if (root) init(root);
  });
})();
