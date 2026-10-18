/* P6.3 playground: size of a gradient after travelling back t steps when every step
   multiplies it by the same factor f: |g_t| = f^t (log scale). Optional clipping caps the
   norm at 5 (it can only shrink big gradients, never revive vanished ones). */
(function () {
  var LC = window.LC;
  var YMIN = -10, YMAX = 10, CLIP = 5;

  function sci(v) {
    if (v === 0) return "0";
    if (v >= 0.001 && v < 10000) return v < 1 ? v.toPrecision(2) : (v < 100 ? v.toFixed(1) : Math.round(v).toLocaleString("en-US"));
    var e = Math.floor(Math.log10(v)), m = v / Math.pow(10, e);
    return m.toFixed(1) + "e" + e;
  }

  function init(root) {
    var stageBox = root.querySelector(".pg-stage");
    var inF = root.querySelector('[data-in="f"]'), inT = root.querySelector('[data-in="t"]');
    var outF = root.querySelector('[data-out="f"]'), outT = root.querySelector('[data-out="t"]');
    var readout = root.querySelector(".pg-readout");
    var clipBtn = root.querySelector("[data-clip]");
    var clip = false, layout = null, svg, curve, clipLine, endDot, sx, sy, m, Wd, H;

    function build() {
      layout = stageBox.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact";
      Wd = compact ? 360 : 640; H = compact ? 256 : 276;
      m = compact ? { l: 46, r: 14, t: 34, b: 40 } : { l: 56, r: 22, t: 34, b: 42 };
      if (svg) svg.remove();
      svg = LC.svg("svg", { viewBox: "0 0 " + Wd + " " + H, role: "img", "aria-label": "Log-scale plot of gradient size against steps back in time. The readout below gives the current numbers." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "360px";
      stageBox.appendChild(svg);
      var S = LC.svg;
      sx = function (t) { return m.l + (t / 100) * (Wd - m.l - m.r); };
      sy = function (lg) { return m.t + (1 - (lg - YMIN) / (YMAX - YMIN)) * (H - m.t - m.b); };
      // shaded zones
      S("rect", { x: m.l, y: sy(YMAX), width: Wd - m.l - m.r, height: sy(2) - sy(YMAX), class: "f-orange", opacity: 0.1 }, svg);
      S("rect", { x: m.l, y: sy(-2), width: Wd - m.l - m.r, height: sy(YMIN) - sy(-2), class: "f-blue", opacity: 0.1 }, svg);
      [-8, -4, 0, 4, 8].forEach(function (lg) {
        S("line", { x1: m.l, x2: Wd - m.r, y1: sy(lg), y2: sy(lg), class: "s-grid" }, svg);
        S("text", { x: m.l - 6, y: sy(lg) + 4, class: "t t-sm t-muted t-end", text: lg === 0 ? "1" : "1e" + lg }, svg);
      });
      S("path", { d: "M" + m.l + " " + m.t + "V" + (H - m.b) + "H" + (Wd - m.r), class: "s-axis" }, svg);
      [0, 25, 50, 75, 100].forEach(function (t) { S("text", { x: sx(t), y: H - m.b + 17, class: "t t-sm t-muted t-mid", text: t }, svg); });
      S("text", { x: 4, y: 16, class: "t t-sm t-muted", text: "↑ gradient size (log scale)" }, svg);
      S("text", { x: Wd - m.r, y: H - 6, class: "t t-sm t-muted t-end", text: "steps back →" }, svg);
      S("text", { x: m.l + 6, y: sy(YMAX) + 15, class: "t t-sm t-orange", text: "exploding" }, svg);
      S("text", { x: m.l + 6, y: sy(YMIN) - 7, class: "t t-sm t-blue", text: "vanishing" }, svg);
      var clipG = S("clipPath", { id: "p63-clip-" + layout }, svg);
      S("rect", { x: m.l, y: m.t, width: Wd - m.l - m.r, height: H - m.t - m.b }, clipG);
      clipLine = S("line", { x1: m.l, x2: Wd - m.r, y1: sy(Math.log10(CLIP)), y2: sy(Math.log10(CLIP)), class: "s-orange", "stroke-width": 1.5, "stroke-dasharray": "5 5" }, svg);
      curve = S("path", { d: "", class: "s-blue", "clip-path": "url(#p63-clip-" + layout + ")" }, svg);
      endDot = S("circle", { r: compact ? 5 : 6, class: "f-orange", stroke: "var(--a-ink)", "stroke-width": 1.5 }, svg);
      draw();
    }

    function val(f, t) { var v = Math.pow(f, t); return clip ? Math.min(v, CLIP) : v; }

    function draw() {
      var f = parseFloat(inF.value), T = parseInt(inT.value, 10);
      outF.textContent = f.toFixed(2); outT.textContent = T;
      var d = "", lgEnd = 0;
      for (var t = 0; t <= T; t++) {
        var lg = Math.log10(val(f, t));
        var yy = sy(Math.max(YMIN - 1, Math.min(YMAX + 1, lg)));
        d += (t ? "L" : "M") + sx(t).toFixed(1) + " " + yy.toFixed(1);
        lgEnd = lg;
      }
      curve.setAttribute("d", d);
      endDot.setAttribute("cx", sx(T)); endDot.setAttribute("cy", sy(Math.max(YMIN, Math.min(YMAX, lgEnd))));
      clipLine.style.display = clip ? "" : "none";
      var raw = Math.pow(f, T);
      var verdict = raw < 0.01 ? "vanishing: almost no signal from that far back" : raw > 100 ? (clip ? "exploding, but the update is capped" : "exploding") : "the signal survives";
      readout.textContent = f.toFixed(2) + "^" + T + " = " + sci(raw) + (clip && raw > CLIP ? " → clipped to " + CLIP : "") + " · " + verdict;
      root.querySelectorAll("[data-f]").forEach(function (c) {
        c.setAttribute("aria-pressed", String(Math.abs(parseFloat(c.dataset.f) - f) < 1e-9 && parseInt(c.dataset.t, 10) === T));
      });
      clipBtn.setAttribute("aria-pressed", String(clip));
    }

    inF.addEventListener("input", draw);
    inT.addEventListener("input", draw);
    root.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.hasAttribute("data-clip")) { clip = !clip; draw(); }
      else if (b.dataset.f) { inF.value = b.dataset.f; inT.value = b.dataset.t; draw(); }
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
    var root = document.getElementById("p6-3-vanish");
    if (root) init(root);
  });
})();
