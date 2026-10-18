/* A1.1 playground: sample a tone at a chosen rate and show the alias.
   x(t) = sin(2π f t + φ). Sampled at fs, the samples equal sin(2π δ n/fs + φ) with
   δ = f − k·fs, k = round(f/fs). |δ| is the frequency you'd hear back. */
(function () {
  var LC = window.LC;
  var DUR = 2, PH = 0.5; // window in ms, phase

  function init(root) {
    var stageBox = root.querySelector(".pg-stage");
    var inFs = root.querySelector('[data-in="fs"]'), inF = root.querySelector('[data-in="f"]');
    var outFs = root.querySelector('[data-out="fs"]'), outF = root.querySelector('[data-out="f"]');
    var readout = root.querySelector(".pg-readout"), hint = root.querySelector(".pg-hint");
    var layout = null, svg, W, H, sx, sy, gWave, gSamp, legA, legB, m;

    function build() {
      layout = stageBox.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact";
      W = compact ? 360 : 640; H = compact ? 276 : 286;
      m = compact ? { l: 30, r: 10, t: 64, b: 44 } : { l: 40, r: 16, t: 54, b: 44 };
      sx = function (t) { return m.l + (t / DUR) * (W - m.l - m.r); };
      sy = function (v) { return m.t + (1 - (v + 1.1) / 2.2) * (H - m.t - m.b); };
      if (svg) svg.remove();
      svg = LC.svg("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "A tone over 2 milliseconds with its samples and the lowest-frequency wave through the samples. The readout below states the alias frequency." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "360px";
      stageBox.appendChild(svg);
      var S = LC.svg;
      S("line", { x1: m.l, x2: W - m.r, y1: sy(0), y2: sy(0), class: "s-grid" }, svg);
      S("path", { d: "M" + m.l + " " + (m.t - 4) + "V" + (H - m.b), class: "s-axis" }, svg);
      [0, 0.5, 1, 1.5, 2].forEach(function (t) { S("text", { x: sx(t), y: H - m.b + 18, class: "t t-sm t-muted t-mid", text: t }, svg); });
      S("text", { x: W - m.r, y: H - 5, class: "t t-sm t-muted t-end", text: "time (ms) →" }, svg);
      // legend rows (own rows above the plot)
      S("line", { x1: 6, x2: 24, y1: 14, y2: 14, class: "s-blue", "stroke-width": 2.5 }, svg);
      legA = S("text", { x: 30, y: 18, class: "t t-sm", text: "" }, svg);
      var ly = compact ? 36 : 14, lx = compact ? 6 : W / 2 + 10;
      S("line", { x1: lx, x2: lx + 18, y1: ly, y2: ly, class: "s-orange", "stroke-width": 2.5, "stroke-dasharray": "5 4" }, svg);
      legB = S("text", { x: lx + 24, y: ly + 4, class: "t t-sm t-orange", text: "" }, svg);
      gWave = S("g", {}, svg);
      gSamp = S("g", {}, svg);
      draw();
    }

    function draw() {
      var fs = parseFloat(inFs.value), f = parseFloat(inF.value);
      outFs.textContent = String(fs); outF.textContent = String(f);
      root.querySelectorAll("[data-fs]").forEach(function (c) { c.setAttribute("aria-pressed", String(parseFloat(c.dataset.fs) === fs)); });
      var k = Math.round(f / fs), d = f - k * fs, fa = Math.abs(d);
      var S = LC.svg, compact = layout === "compact";
      while (gWave.firstChild) gWave.removeChild(gWave.firstChild);
      while (gSamp.firstChild) gSamp.removeChild(gSamp.firstChild);
      S("path", { d: LC.fnPath(function (t) { return Math.sin(2 * Math.PI * f * t + PH); }, 0, DUR, sx, sy, 600), class: "s-blue", "stroke-width": 2, opacity: 0.8 }, gWave);
      S("path", { d: LC.fnPath(function (t) { return Math.sin(2 * Math.PI * d * t + PH); }, 0, DUR, sx, sy, 400), class: "s-orange", "stroke-width": 2.5, "stroke-dasharray": "6 5" }, gWave);
      var n = Math.floor(DUR * fs + 1e-9), r = fs > 30 ? 2.2 : 3.5;
      for (var i = 0; i < n; i++) {
        var t = i / fs, v = Math.sin(2 * Math.PI * f * t + PH);
        S("line", { x1: sx(t), x2: sx(t), y1: sy(0), y2: sy(v), class: "s-ink", "stroke-width": 1, opacity: 0.45 }, gSamp);
        S("circle", { cx: sx(t), cy: sy(v), r: r, class: "f-orange" }, gSamp);
      }
      var aliased = f > fs / 2 + 1e-9, atLimit = Math.abs(f - fs / 2) < 1e-9;
      legA.textContent = (compact ? "tone: " : "real tone: ") + f + " kHz";
      legB.textContent = (compact ? "samples say: " : "what the samples say: ") + fmt(fa) + " kHz" + (aliased ? " (alias!)" : "");
      readout.textContent = "fs = " + fs + " kHz · Nyquist limit fs/2 = " + fmt(fs / 2) + " kHz · " + n + " samples in 2 ms · heard as " + fmt(fa) + " kHz";
      if (atLimit) hint.textContent = "Exactly at the limit: the samples are ambiguous (here they can't tell the tone's phase). Real systems keep a safety margin below fs/2.";
      else if (aliased) hint.textContent = "Aliased: " + f + " kHz is above fs/2, so its samples are identical to " + (fa < 1e-9 ? "a constant (0 kHz: no wiggle at all)" : "a " + fmt(fa) + " kHz tone") + " (|" + f + " − " + k + "×" + fs + "|). Nothing after sampling can undo this; filter before you sample.";
      else hint.textContent = "Captured: " + f + " kHz is below fs/2 = " + fmt(fs / 2) + " kHz, so the samples pin down the original tone exactly; the dashed curve lies on the blue one.";
    }
    function fmt(x) { return (Math.round(x * 100) / 100).toString(); }

    inFs.addEventListener("input", draw);
    inF.addEventListener("input", draw);
    root.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-fs]"); if (!b) return;
      inFs.value = b.dataset.fs; draw();
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
    var root = document.getElementById("a1-1-alias-playground");
    if (root) init(root);
  });
})();
