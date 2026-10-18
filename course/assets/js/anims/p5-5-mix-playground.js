/* P5.5 playground: mix three sine waves and see the waveform and its spectrum.
   Sampling rate fs = 40 Hz over a 1 s window → N = 40 samples, DFT bins 0…20 Hz (1 Hz apart).
   Amplitude per bin = 2|X[k]|/N (|X[k]|/N at 0 and at the Nyquist bin). Frequencies are whole numbers of Hz,
   so each tone lands exactly on a bin (no leakage). Above 20 Hz a tone aliases to 40 − f. */
(function () {
  var LC = window.LC;
  var FS = 40, N = 40, NYQ = 20;

  function init(root) {
    var stageBox = root.querySelector(".pg-stage");
    var fr = [0, 1, 2].map(function (i) { return root.querySelector('[data-f="' + i + '"]'); });
    var am = [0, 1, 2].map(function (i) { return root.querySelector('[data-a="' + i + '"]'); });
    var readout = root.querySelector(".pg-readout");
    var layout = null, svg, wavePath, dotsG, bars = [], sxW, syW, bx, by, bBase, bTop;

    function waves() { return [0, 1, 2].map(function (i) { return { f: +fr[i].value, a: +am[i].value }; }); }
    function sig(t, W) { var s = 0; W.forEach(function (w) { s += w.a * Math.sin(2 * Math.PI * w.f * t); }); return s; }

    function build() {
      layout = stageBox.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact", S = LC.svg;
      var W = compact ? 360 : 640, H = compact ? 342 : 264;
      var P1 = compact ? { l: 30, r: 340, t: 52, h: 110, ty: 16 } : { l: 34, r: 330, t: 52, h: 170, ty: 16 };
      var P2 = compact ? { l: 30, r: 340, t: 234, h: 76, ty: 204 } : { l: 380, r: 620, t: 74, h: 140, ty: 16 };
      sxW = function (t) { return P1.l + t * (P1.r - P1.l); };
      syW = function (v) { return P1.t + P1.h / 2 - v / 3.2 * (P1.h / 2); };
      if (svg) svg.remove();
      svg = S("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "One second of the mixed waveform with its 40 samples, and the spectrum: one bar per frequency from 0 to 20 hertz. The readout below lists the tones." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "360px";
      stageBox.appendChild(svg);
      // waveform panel
      S("text", { x: 4, y: P1.ty, class: "t t-sm t-muted", text: "waveform x(t), 1 second" }, svg);
      S("text", { x: 4, y: P1.ty + 18, class: "t t-sm t-orange", text: "dots = 40 samples (fs = 40 Hz)" }, svg);
      S("line", { x1: P1.l, x2: P1.r, y1: syW(0), y2: syW(0), class: "s-axis" }, svg);
      [[-3, "−3"], [3, "3"]].forEach(function (p) { S("text", { x: P1.l - 5, y: syW(p[0]) + 4, class: "t t-sm t-muted t-end", text: p[1] }, svg); S("line", { x1: P1.l, x2: P1.r, y1: syW(p[0]), y2: syW(p[0]), class: "s-grid" }, svg); });
      [[0, "0", "t-mid"], [1, "1 s", "t-end"]].forEach(function (p) { S("text", { x: sxW(p[0]), y: P1.t + P1.h + 16, class: "t t-sm t-muted " + p[2], text: p[1] }, svg); });
      wavePath = S("path", { class: "s-blue", "stroke-width": 1.8 }, svg);
      dotsG = S("g", {}, svg);
      // spectrum panel
      S("text", { x: compact ? 4 : P2.l - 26, y: P2.ty, class: "t t-sm t-muted", text: "spectrum: amplitude at each frequency" }, svg);
      bx = function (f) { return P2.l + (f + 0.5) / (NYQ + 1) * (P2.r - P2.l); };
      bBase = P2.t + P2.h; bTop = P2.t;
      by = function (v) { return bBase - Math.min(v, 1.6) / 1.6 * P2.h; };
      [0.5, 1, 1.5].forEach(function (v) { S("line", { x1: P2.l, x2: P2.r, y1: by(v), y2: by(v), class: "s-grid" }, svg); });
      [[0, "0"], [1, "1"]].forEach(function (p) { S("text", { x: P2.l - 5, y: by(p[0]) + 4, class: "t t-sm t-muted t-end", text: p[1] }, svg); });
      bars = [];
      var bw = (P2.r - P2.l) / (NYQ + 1) * 0.62;
      for (var k = 0; k <= NYQ; k++) bars.push(S("rect", { x: bx(k) - bw / 2, width: bw, y: bBase, height: 0, rx: 2, class: "f-blue" }, svg));
      S("line", { x1: P2.l, x2: P2.r, y1: bBase, y2: bBase, class: "s-axis" }, svg);
      [[0, "0"], [5, "5"], [10, "10"], [15, "15"], [20, "20 Hz"]].forEach(function (p) { S("text", { x: bx(p[0]), y: bBase + 16, class: "t t-sm t-muted " + (p[0] === 20 ? "t-end" : "t-mid"), text: p[1] }, svg); });
      if (!compact) S("text", { x: P2.r, y: bBase + 34, class: "t t-sm t-muted t-end", text: "20 Hz = Nyquist (fs/2)" }, svg);
      draw();
    }

    function draw() {
      var W = waves(), d = "";
      for (var i = 0; i <= 400; i++) { var t = i / 400; d += (i ? "L" : "M") + sxW(t).toFixed(1) + " " + syW(sig(t, W)).toFixed(1); }
      wavePath.setAttribute("d", d);
      while (dotsG.firstChild) dotsG.removeChild(dotsG.firstChild);
      var xs = [];
      for (var n = 0; n < N; n++) {
        var v = sig(n / FS, W); xs.push(v);
        LC.svg("circle", { cx: sxW(n / FS), cy: syW(v), r: 2.6, class: "f-orange" }, dotsG);
      }
      // DFT of the 40 samples
      for (var k = 0; k <= NYQ; k++) {
        var re = 0, im = 0;
        for (var j = 0; j < N; j++) { re += xs[j] * Math.cos(2 * Math.PI * k * j / N); im -= xs[j] * Math.sin(2 * Math.PI * k * j / N); }
        var amp = Math.sqrt(re * re + im * im) / N * (k === 0 || k === NYQ ? 1 : 2);
        if (amp < 1e-9) amp = 0;
        bars[k].setAttribute("y", by(amp).toFixed(1)); bars[k].setAttribute("height", (bBase - by(amp)).toFixed(1));
      }
      [0, 1, 2].forEach(function (i) {
        root.querySelector('[data-fo="' + i + '"]').textContent = W[i].f;
        root.querySelector('[data-ao="' + i + '"]').textContent = W[i].a.toFixed(1);
      });
      var notes = W.map(function (w, i) {
        var s = "tone " + (i + 1) + ": " + w.f + " Hz × " + w.a.toFixed(1);
        if (w.a === 0) return s + " (silent)";
        if (w.f > NYQ) return s + " → above Nyquist, aliases to " + (FS - w.f) + " Hz";
        if (w.f === NYQ) return s + " → exactly at Nyquist: every sample of this sine is 0";
        return s;
      });
      readout.textContent = notes.join(" · ");
    }

    root.addEventListener("input", function (e) { if (e.target.matches("input[type=range]")) draw(); });
    root.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-preset]"); if (!b) return;
      var P = { chord: [[3, 1], [7, 0.5], [12, 0.3]], alias: [[3, 1], [27, 0.6], [12, 0]], single: [[5, 1], [10, 0], [15, 0]] }[b.dataset.preset];
      P.forEach(function (p, i) { fr[i].value = p[0]; am[i].value = p[1]; });
      root.querySelectorAll("[data-preset]").forEach(function (c) { c.setAttribute("aria-pressed", String(c === b)); });
      draw();
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
    var root = document.getElementById("p5-5-mix-playground");
    if (root) init(root);
  });
})();
