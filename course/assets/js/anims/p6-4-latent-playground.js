/* P6.4 playground: a 2-D latent space. Dragging the code z decodes into a shape.
   The "decoder" is a formula, not a network: a shape's outline is a radius r(θ), and
   the VAE decoder blends four prototype outlines bilinearly over the square [-2, 2]².
   The plain-autoencoder mode only decodes well near its four tight clusters of training
   codes; elsewhere the outline turns into a scribble, like the gaps in a real AE. */
(function () {
  var LC = window.LC;
  var NA = 96, ZMAX = 2.4;
  var TAU = Math.PI * 2;

  function polyR(n, rot) {   // regular n-gon radius function (circumradius 1)
    return function (t) {
      var a = ((t - rot) % (TAU / n) + TAU / n) % (TAU / n) - Math.PI / n;
      return Math.cos(Math.PI / n) / Math.cos(a);
    };
  }
  var PROTOS = [
    { name: "circle", r: function () { return 0.86; } },
    { name: "square", r: (function (p) { return function (t) { return 0.98 * p(t); }; })(polyR(4, Math.PI / 4)) },
    { name: "triangle", r: (function (p) { return function (t) { return 1.08 * p(t); }; })(polyR(3, -Math.PI / 2)) },
    { name: "flower", r: function (t) { return 0.74 + 0.24 * Math.cos(5 * (t + Math.PI / 2)); } }
  ];
  // corners: top-left circle, top-right square, bottom-left triangle, bottom-right flower
  var CORNER = [[-2, 2], [2, 2], [-2, -2], [2, -2]];
  var PROTO_R = PROTOS.map(function (p) { var a = []; for (var k = 0; k < NA; k++) a.push(p.r(k / NA * TAU)); return a; });

  // plain-AE: four tight clusters at irregular spots
  var CLUSTERS = [[-1.5, 1.2], [1.1, 1.7], [-0.6, -1.6], [1.7, -0.5]];
  function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  var R1 = rng(7), R2 = rng(11);
  function gauss(r) { var u = Math.max(1e-9, r()), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); }
  var VAE_CODES = [], AE_CODES = [];
  for (var i = 0; i < 40; i++) VAE_CODES.push([gauss(R1), gauss(R1)]);
  for (var j = 0; j < 40; j++) { var c = CLUSTERS[j % 4]; AE_CODES.push([c[0] + 0.12 * gauss(R2), c[1] + 0.12 * gauss(R2)]); }

  function weightsVAE(z1, z2) {
    var u = Math.max(0, Math.min(1, (z1 + 2) / 4)), v = Math.max(0, Math.min(1, (z2 + 2) / 4));
    return [(1 - u) * v, u * v, (1 - u) * (1 - v), u * (1 - v)];
  }
  function decode(mode, z1, z2) {
    var out = [], info;
    if (mode === "vae") {
      var w = weightsVAE(z1, z2);
      for (var k = 0; k < NA; k++) out.push(w[0] * PROTO_R[0][k] + w[1] * PROTO_R[1][k] + w[2] * PROTO_R[2][k] + w[3] * PROTO_R[3][k]);
      info = w;
    } else {
      var best = 0, bd = 1e9;
      CLUSTERS.forEach(function (c, q) { var d = Math.hypot(z1 - c[0], z2 - c[1]); if (d < bd) { bd = d; best = q; } });
      var p = [1, 0, 3, 2][best];   // cluster → prototype (deliberately not matching the corners)
      var amp = Math.min(0.55, Math.max(0, bd - 0.3) * 0.7);
      for (var m = 0; m < NA; m++) {
        var t = m / NA * TAU;
        var n = Math.sin(7 * t + 3.1 * z1) * Math.cos(11 * t - 4.3 * z2) + 0.6 * Math.sin(17 * t + 2.3 * z1 * z2 + 1.7);
        out.push(Math.max(0.12, PROTO_R[p][m] * (1 - 0.25 * amp) + amp * 0.55 * n));
      }
      info = { proto: p, dist: bd, amp: amp };
    }
    return { r: out, info: info };
  }
  function pathFor(rs, cx, cy, scale) {
    var d = "";
    for (var k = 0; k < NA; k++) {
      var t = k / NA * TAU;
      d += (k ? "L" : "M") + (cx + scale * rs[k] * Math.cos(t)).toFixed(1) + " " + (cy - scale * rs[k] * Math.sin(t)).toFixed(1);
    }
    return d + "Z";
  }

  function init(root) {
    var stageBox = root.querySelector(".pg-stage");
    var in1 = root.querySelector('[data-in="z1"]'), in2 = root.querySelector('[data-in="z2"]');
    var o1 = root.querySelector('[data-out="z1"]'), o2 = root.querySelector('[data-out="z2"]');
    var readout = root.querySelector(".pg-readout");
    var mode = "vae", layout = null, svg, thumbs, codesG, priorG, handle, big, M, P;

    function mx(z) { return M.x + (z + ZMAX) / (2 * ZMAX) * M.s; }
    function my(z) { return M.y + (1 - (z + ZMAX) / (2 * ZMAX)) * M.s; }

    function build() {
      layout = stageBox.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact";
      var W = compact ? 360 : 640, H = compact ? 262 : 340;
      M = compact ? { x: 8, y: 26, s: 206 } : { x: 24, y: 30, s: 290 };
      P = compact ? { x: 228, y: 26, w: 124, h: 206 } : { x: 350, y: 30, w: 266, h: 290 };
      if (svg) svg.remove();
      svg = LC.svg("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "A square latent map with a draggable point, and the shape that point decodes to. The readout below describes it." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto"; svg.style.touchAction = "none";
      svg.style.maxHeight = compact ? "none" : "400px";
      stageBox.appendChild(svg);
      var S = LC.svg;
      S("text", { x: M.x, y: compact ? 16 : 20, class: "t t-sm t-muted", text: "latent space: drag the dot" }, svg);
      S("text", { x: P.x + P.w / 2, y: compact ? 16 : 20, class: "t t-sm t-muted t-mid", text: "decoded" }, svg);
      S("rect", { x: M.x, y: M.y, width: M.s, height: M.s, rx: 8, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, svg);
      S("line", { x1: mx(0), x2: mx(0), y1: M.y, y2: M.y + M.s, class: "s-grid" }, svg);
      S("line", { x1: M.x, x2: M.x + M.s, y1: my(0), y2: my(0), class: "s-grid" }, svg);
      S("text", { x: M.x + M.s, y: M.y + M.s + 16, class: "t t-sm t-muted t-end", text: "z₁ →" }, svg);
      S("text", { x: M.x, y: M.y + M.s + 16, class: "t t-sm t-muted", text: "↑ z₂" }, svg);
      priorG = S("g", {}, svg);
      [1, 2].forEach(function (k) {
        S("circle", { cx: mx(0), cy: my(0), r: k / (2 * ZMAX) * M.s, class: "f-none", stroke: "var(--a-blue)", "stroke-width": 1.2, "stroke-dasharray": "4 4", opacity: 0.6 }, priorG);
      });
      thumbs = S("g", {}, svg);
      codesG = S("g", {}, svg);
      S("rect", { x: P.x, y: P.y, width: P.w, height: P.h, rx: 8, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, svg);
      big = S("path", { d: "", class: "f-orange", "fill-opacity": 0.85, stroke: "var(--a-ink)", "stroke-width": 2, "stroke-linejoin": "round" }, svg);
      handle = S("circle", { r: compact ? 9 : 10, class: "f-orange", stroke: "var(--a-ink)", "stroke-width": 2.5 }, svg);
      handle.style.cursor = "grab";
      drawStatic();
      draw();

      var dragging = false;
      function setFromEvent(e) {
        var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
        var q = pt.matrixTransform(svg.getScreenCTM().inverse());
        var z1 = ((q.x - M.x) / M.s) * 2 * ZMAX - ZMAX, z2 = (1 - (q.y - M.y) / M.s) * 2 * ZMAX - ZMAX;
        in1.value = Math.max(-ZMAX, Math.min(ZMAX, z1)).toFixed(2);
        in2.value = Math.max(-ZMAX, Math.min(ZMAX, z2)).toFixed(2);
        draw();
      }
      function inMap(e) {
        var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
        var q = pt.matrixTransform(svg.getScreenCTM().inverse());
        return q.x >= M.x - 10 && q.x <= M.x + M.s + 10 && q.y >= M.y - 10 && q.y <= M.y + M.s + 10;
      }
      svg.addEventListener("pointerdown", function (e) {
        if (!inMap(e)) return;
        dragging = true; svg.setPointerCapture(e.pointerId); setFromEvent(e); e.preventDefault();
      });
      svg.addEventListener("pointermove", function (e) { if (dragging) setFromEvent(e); });
      svg.addEventListener("pointerup", function () { dragging = false; });
      svg.addEventListener("pointercancel", function () { dragging = false; });
    }

    function drawStatic() {
      while (thumbs.firstChild) thumbs.removeChild(thumbs.firstChild);
      while (codesG.firstChild) codesG.removeChild(codesG.firstChild);
      var G = 5, step = M.s / G;
      for (var a = 0; a < G; a++) for (var b = 0; b < G; b++) {
        var cx = M.x + step * (b + 0.5), cy = M.y + step * (a + 0.5);
        var z1 = ((cx - M.x) / M.s) * 2 * ZMAX - ZMAX, z2 = (1 - (cy - M.y) / M.s) * 2 * ZMAX - ZMAX;
        LC.svg("path", { d: pathFor(decode(mode, z1, z2).r, cx, cy, step * 0.3), style: "fill:var(--ink-2)", "fill-opacity": 0.35 }, thumbs);
      }
      (mode === "vae" ? VAE_CODES : AE_CODES).forEach(function (p) {
        if (Math.abs(p[0]) > ZMAX || Math.abs(p[1]) > ZMAX) return;
        LC.svg("circle", { cx: mx(p[0]), cy: my(p[1]), r: 2.6, class: "f-blue", opacity: 0.8 }, codesG);
      });
      priorG.style.display = mode === "vae" ? "" : "none";
      root.querySelectorAll("[data-mode]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.mode === mode)); });
    }

    function draw() {
      var z1 = parseFloat(in1.value), z2 = parseFloat(in2.value);
      o1.textContent = z1.toFixed(2); o2.textContent = z2.toFixed(2);
      handle.setAttribute("cx", mx(z1)); handle.setAttribute("cy", my(z2));
      var dec = decode(mode, z1, z2);
      big.setAttribute("d", pathFor(dec.r, P.x + P.w / 2, P.y + P.h / 2, Math.min(P.w, P.h) * 0.36));
      var txt;
      if (mode === "vae") {
        var parts = dec.info.map(function (w, k) { return { w: w, n: PROTOS[k].name }; }).filter(function (p) { return p.w >= 0.05; })
          .sort(function (a, b) { return b.w - a.w; }).map(function (p) { return Math.round(p.w * 100) + "% " + p.n; });
        txt = "z = (" + z1.toFixed(2) + ", " + z2.toFixed(2) + ") → a blend: " + parts.join(", ") + ". Every point decodes to something shape-like.";
      } else {
        var near = PROTOS[dec.info.proto].name;
        txt = "z = (" + z1.toFixed(2) + ", " + z2.toFixed(2) + ") → nearest training codes are " + near + "s, " + dec.info.dist.toFixed(2) + " away" +
          (dec.info.amp < 0.05 ? ": a clean " + near + "." : dec.info.amp < 0.3 ? ": a distorted " + near + "." : ": in a gap, so the decoder outputs a scribble.");
      }
      readout.textContent = txt;
    }

    in1.addEventListener("input", draw);
    in2.addEventListener("input", draw);
    root.addEventListener("click", function (e) {
      var b = e.target.closest("[data-mode]"); if (!b) return;
      mode = b.dataset.mode; drawStatic(); draw();
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
    var root = document.getElementById("p6-4-latent");
    if (root) init(root);
  });
})();
