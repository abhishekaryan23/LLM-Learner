/* G1.1 playground: drag a point around a 2-D latent plane and watch the toy decoder
   (LC.g1shape, from g1-1-vae.js) redraw the shape. Nearby codes give similar shapes;
   codes far outside N(0, I) decode to junk because no training code ever landed there. */
(function () {
  var LC = window.LC;
  function hintFor(r) {
    if (r < 1) return "Inside 1σ: the most common kind of code. The decoder has seen lots of these.";
    if (r < 2) return "Between 1σ and 2σ: still well covered by the prior, so the shape is clean.";
    if (r < 2.6) return "Near the edge of the prior: rarer codes, but still decodes sensibly.";
    return "Far outside N(0, I): no training code ever landed here, so the decoder produces junk.";
  }

  function init(root) {
    var stageBox = root.querySelector(".pg-stage");
    var z1In = root.querySelector('input[data-k="z1"]'), z2In = root.querySelector('input[data-k="z2"]');
    var z1Out = root.querySelector('output[data-o="z1"]'), z2Out = root.querySelector('output[data-o="z2"]');
    var readout = root.querySelector(".pg-readout"), hint = root.querySelector(".pg-hint");
    var layout = null, svg, el = {}, pl, sh, rnd = LC.g1 ? LC.g1.rng(42) : Math.random;

    function px(z) { return pl.x + (z + 4) / 8 * pl.s; }
    function py(z) { return pl.y + (4 - z) / 8 * pl.s; }
    function toZ(evt) {
      var pt = svg.createSVGPoint(); pt.x = evt.clientX; pt.y = evt.clientY;
      var p = pt.matrixTransform(svg.getScreenCTM().inverse());
      return [Math.max(-4, Math.min(4, (p.x - pl.x) / pl.s * 8 - 4)), Math.max(-4, Math.min(4, 4 - (p.y - pl.y) / pl.s * 8))];
    }

    function build() {
      layout = stageBox.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact", W = compact ? 360 : 600, H = compact ? 262 : 330;
      pl = compact ? { x: 8, y: 34, s: 210 } : { x: 14, y: 34, s: 280 };
      sh = compact ? { x: 232, y: 70, s: 120 } : { x: 350, y: 64, s: 220 };
      if (svg) svg.remove();
      var S = LC.svg;
      svg = S("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "A latent plane with dashed rings at 1, 2 and 3 standard deviations, a draggable point, and the shape the decoder draws for that point. Use the sliders below for keyboard control." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto"; svg.style.touchAction = "none";
      svg.style.maxHeight = compact ? "none" : "380px";
      stageBox.appendChild(svg);
      S("text", { x: pl.x, y: 20, class: "t t-sm t-muted", text: compact ? "latent z (drag the dot)" : "latent plane z: drag the dot" }, svg);
      S("text", { x: sh.x + sh.s / 2, y: sh.y - 12, class: "t t-sm t-muted t-mid", text: "decoded image" }, svg);
      S("rect", { x: pl.x, y: pl.y, width: pl.s, height: pl.s, rx: 8, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, svg);
      S("line", { x1: pl.x, x2: pl.x + pl.s, y1: py(0), y2: py(0), class: "s-grid" }, svg);
      S("line", { x1: px(0), x2: px(0), y1: pl.y, y2: pl.y + pl.s, class: "s-grid" }, svg);
      [1, 2, 3].forEach(function (k) {
        S("circle", { cx: px(0), cy: py(0), r: k * pl.s / 8, class: "f-none", stroke: "var(--a-ink)", "stroke-width": 1, "stroke-dasharray": "4 4", opacity: 0.55 }, svg);
        S("text", { x: px(0) + 4, y: py(k) - 4 + (k === 1 ? 0 : 0), class: "t t-sm t-muted", text: k + "σ" }, svg);
      });
      // a few "training codes" sampled from the prior
      var r = LC.g1.rng(7);
      for (var i = 0; i < 40; i++) {
        var a = LC.g1.gauss(r), b = LC.g1.gauss(r);
        if (Math.abs(a) < 3.8 && Math.abs(b) < 3.8) S("circle", { cx: px(a), cy: py(b), r: 2.2, class: "f-blue", opacity: 0.45 }, svg);
      }
      S("rect", { x: sh.x, y: sh.y, width: sh.s, height: sh.s, rx: 10, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, svg);
      el.shape = S("path", { class: "f-orange", "fill-opacity": 0.85 }, svg);
      el.handle = S("circle", { r: 9, class: "f-orange", stroke: "var(--a-ink)", "stroke-width": 2, style: "cursor:grab" }, svg);
      var dragging = false;
      svg.addEventListener("pointerdown", function (e) {
        var z = toZ(e), inPlane = e.offsetX != null;
        var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
        var p = pt.matrixTransform(svg.getScreenCTM().inverse());
        if (!inPlane || p.x < pl.x || p.x > pl.x + pl.s || p.y < pl.y || p.y > pl.y + pl.s) return;
        dragging = true; svg.setPointerCapture(e.pointerId); set(z);
      });
      svg.addEventListener("pointermove", function (e) { if (dragging) set(toZ(e)); });
      ["pointerup", "pointercancel"].forEach(function (t) { svg.addEventListener(t, function () { dragging = false; }); });
      draw();
    }

    function set(z) { z1In.value = z[0].toFixed(1); z2In.value = z[1].toFixed(1); draw(); }

    function draw() {
      var z1 = +z1In.value, z2 = +z2In.value, rr = Math.hypot(z1, z2);
      z1Out.textContent = z1.toFixed(1); z2Out.textContent = z2.toFixed(1);
      el.handle.setAttribute("cx", px(z1).toFixed(1)); el.handle.setAttribute("cy", py(z2).toFixed(1));
      el.shape.setAttribute("d", LC.g1shape(z1, z2, sh.x + sh.s / 2, sh.y + sh.s / 2, sh.s * 0.3));
      var dens = Math.exp(-0.5 * rr * rr) / (2 * Math.PI);
      readout.textContent = "z = (" + z1.toFixed(1) + ", " + z2.toFixed(1) + ") · distance from 0 = " + rr.toFixed(2) + "σ · prior density = " + dens.toFixed(3);
      hint.textContent = hintFor(rr);
    }

    z1In.addEventListener("input", draw);
    z2In.addEventListener("input", draw);
    root.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-act]"); if (!b) return;
      if (b.dataset.act === "sample") {
        var a, c;
        do { a = LC.g1.gauss(rnd); c = LC.g1.gauss(rnd); } while (Math.abs(a) > 4 || Math.abs(c) > 4);
        set([a, c]);
      } else if (b.dataset.act === "far") set([3.6, -3.2]);
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
    var root = document.getElementById("vae-playground");
    if (root) init(root);
  });
})();
