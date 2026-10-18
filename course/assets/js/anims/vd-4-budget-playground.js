/* VD.4 playground: will this video fit in the context window?
   frames = ceil(minutes × 60 / seconds-between-frames); tokens = frames × tokens-per-frame.
   Compared with the context length (text and answer need room too; ignored here). */
(function () {
  var LC = window.LC;
  var MINS = [1, 5, 10, 30, 60, 120, 180];
  var GAPS = [0.5, 1, 2, 5, 10, 30, 60]; // seconds between sampled frames
  function fmtMin(m) { return m < 60 ? m + " min" : (m / 60) + " h"; }
  function fmtGap(g) { return g < 1 ? "2 frames / s" : g === 1 ? "1 frame / s" : "1 frame / " + g + " s"; }
  function k(n) { return n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + "M" : n >= 1000 ? Math.round(n / 1000) + "K" : String(n); }

  function init(root) {
    var stage = root.querySelector(".pg-stage");
    var sMin = root.querySelector('input[data-k="min"]'), sGap = root.querySelector('input[data-k="gap"]');
    var oMin = root.querySelector('output[data-k="min"]'), oGap = root.querySelector('output[data-k="gap"]');
    var readout = root.querySelector(".pg-readout");
    var tpf = 144, ctx = 128000, layout = null;

    function draw() {
      var mins = MINS[+sMin.value], gap = GAPS[+sGap.value];
      oMin.textContent = fmtMin(mins); oGap.textContent = fmtGap(gap);
      var frames = Math.ceil(mins * 60 / gap), need = frames * tpf, fits = need <= ctx;
      layout = stage.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact", Wd = compact ? 360 : 640, H = 92, S = LC.svg;
      var left = 12, right = Wd - 14, span = right - left, mx = Math.max(need, ctx) * 1.04, sc = span / mx;
      var svg = S("svg", { viewBox: "0 0 " + Wd + " " + H, role: "img",
        "aria-label": need.toLocaleString("en-US") + " tokens needed versus a " + ctx.toLocaleString("en-US") + "-token context: " + (fits ? "fits." : "does not fit.") });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "150px";
      S("text", { x: left, y: 14, class: "t t-sm", text: "tokens needed: " + need.toLocaleString("en-US") + (fits ? "  ✓ fits" : "  ✗ too long"), "font-weight": 600 }, svg);
      S("rect", { x: left, y: 26, width: span, height: 22, rx: 4, class: "f-surface2" }, svg);
      S("rect", { x: left, y: 26, width: Math.max(2, need * sc), height: 22, rx: 4, class: fits ? "f-blue" : "f-orange" }, svg);
      var cx = left + ctx * sc;
      S("path", { d: "M" + cx + " 22V54", class: "s-ink", "stroke-width": 2.5, "stroke-dasharray": "4 3" }, svg);
      var anchor = cx > right - 70 ? "t-end" : cx < left + 70 ? "" : "t-mid";
      S("text", { x: anchor === "t-end" ? right : anchor === "" ? left : cx, y: 72, class: "t t-sm t-muted " + anchor, text: k(ctx) + "-token context" }, svg);
      stage.innerHTML = ""; stage.appendChild(svg);

      var maxFrames = Math.floor(ctx / tpf);
      readout.textContent = fmtMin(mins) + " at " + fmtGap(gap) + " = " + frames.toLocaleString("en-US") + " frames × " + tpf + " tokens = " +
        need.toLocaleString("en-US") + " tokens (" + (need / ctx).toFixed(need / ctx < 10 ? 2 : 0) + "× the context). The context holds at most " +
        maxFrames.toLocaleString("en-US") + " frames at " + tpf + " tokens each, before the question and answer. Anything shorter than " + gap + " s can fall between samples.";
    }

    [sMin, sGap].forEach(function (s) { s.addEventListener("input", draw); });
    root.querySelectorAll("[data-tpf]").forEach(function (b) {
      b.addEventListener("click", function () {
        tpf = +b.dataset.tpf;
        root.querySelectorAll("[data-tpf]").forEach(function (c) { c.setAttribute("aria-pressed", String(c === b)); });
        draw();
      });
    });
    root.querySelectorAll("[data-ctx]").forEach(function (b) {
      b.addEventListener("click", function () {
        ctx = +b.dataset.ctx;
        root.querySelectorAll("[data-ctx]").forEach(function (c) { c.setAttribute("aria-pressed", String(c === b)); });
        draw();
      });
    });
    draw();
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        var want = stage.clientWidth < 560 ? "compact" : "wide";
        if (want !== layout) draw();
      }).observe(stage);
    }
  }

  document.addEventListener("lc:ready", function () {
    var root = document.getElementById("vd4-budget-playground");
    if (root) init(root);
  });
})();
