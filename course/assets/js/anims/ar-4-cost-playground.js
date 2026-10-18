/* AR.4 playground: memory and prefill cost versus context length for a 48-layer model
   (d = 4096 = 32 heads x 128, 8 KV heads, bf16).
   Attention layer KV cache: 2 x 8 x 128 x 2 = 4,096 bytes per token.
   Linear layer state: 32 heads x 128 x 128 x 2 bytes = 1 MiB, constant.
   Token-mixing prefill FLOPs per layer: causal attention ~ 2 n^2 d; linear ~ 4 n d d_h. */
(function () {
  var LC = window.LC;
  var LAYERS = 48, D = 4096, DH = 128, KV_TOK = 4096, STATE = 32 * 128 * 128 * 2;
  var MIXES = [48, 12, 6, 0], NAMES = { 48: "All attention", 12: "Hybrid 1:3", 6: "Hybrid 1:7", 0: "All linear" };
  function mem(a, n) { return a * KV_TOK * n + (LAYERS - a) * STATE; }
  function flops(a, n) { return a * 2 * n * n * D + (LAYERS - a) * 4 * n * D * DH; }
  function fmtB(b) {
    var u = [[1e12, "TB"], [1e9, "GB"], [1e6, "MB"], [1e3, "KB"]];
    for (var i = 0; i < u.length; i++) if (b >= u[i][0]) { var v = b / u[i][0]; return (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)) + " " + u[i][1]; }
    return b + " B";
  }
  function fmtN(n) { return n >= 1048576 ? (n / 1048576) + "M" : (n / 1024) + "K"; }
  function fmtF(f) { var e = Math.floor(Math.log10(f)); return (f / Math.pow(10, e)).toFixed(1) + "e" + e; }

  function init(root) {
    var stage = root.querySelector(".pg-stage"), inN = root.querySelector('[data-in="n"]'), outN = root.querySelector('[data-out="n"]');
    var readout = root.querySelector(".pg-readout");
    var mix = 6, layout = null, svg, paths = {}, vline, dot, sx, sy;

    function build() {
      layout = stage.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact";
      var W = compact ? 360 : 640, H = compact ? 250 : 270;
      var m = compact ? { l: 50, r: 12, t: 30, b: 40 } : { l: 62, r: 24, t: 30, b: 40 };
      sx = function (lg2) { return m.l + (lg2 - 10) / 10 * (W - m.l - m.r); };
      sy = function (lg10) { return m.t + (1 - (lg10 - 7) / 5) * (H - m.t - m.b); };
      if (svg) svg.remove();
      var S = LC.svg;
      svg = S("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Log-log plot of memory per sequence against context length for four layer mixes. The readout below gives the numbers." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "380px";
      stage.appendChild(svg);
      [[7, "10 MB"], [8, "100 MB"], [9, "1 GB"], [10, "10 GB"], [11, "100 GB"], [12, "1 TB"]].forEach(function (r) {
        S("line", { x1: m.l, x2: W - m.r, y1: sy(r[0]), y2: sy(r[0]), class: "s-grid" }, svg);
        S("text", { x: m.l - 6, y: sy(r[0]) + 4, class: "t t-sm t-muted t-end", text: r[1] }, svg);
      });
      S("path", { d: "M" + m.l + " " + m.t + "V" + (H - m.b) + "H" + (W - m.r), class: "s-axis" }, svg);
      [[10, "1K"], [13, "8K"], [16, "64K"], [20, "1M"]].forEach(function (r) {
        S("text", { x: sx(r[0]), y: H - m.b + 17, class: "t t-sm t-muted t-mid", text: r[1] }, svg);
      });
      S("text", { x: 4, y: 16, class: "t t-sm t-muted", text: "↑ memory per sequence (KV cache + states)" }, svg);
      S("text", { x: W - m.r, y: H - 6, class: "t t-sm t-muted t-end", text: "context length →" }, svg);
      MIXES.forEach(function (a) {
        var d = "";
        for (var k = 0; k <= 40; k++) { var lg2 = 10 + k / 4; d += (k ? "L" : "M") + sx(lg2).toFixed(1) + " " + sy(Math.log10(mem(a, Math.pow(2, lg2)))).toFixed(1); }
        paths[a] = S("path", { d: d, class: "s-faint", "stroke-width": 2 }, svg);
      });
      vline = S("line", { y1: m.t, y2: H - m.b, class: "s-ink", "stroke-width": 1, "stroke-dasharray": "4 4" }, svg);
      dot = S("circle", { r: compact ? 5 : 6, class: "f-orange", stroke: "var(--a-ink)", "stroke-width": 1.5 }, svg);
      draw();
    }

    function draw() {
      var lg2 = 10 + (+inN.value), n = Math.pow(2, lg2);
      outN.textContent = fmtN(n);
      MIXES.forEach(function (a) {
        var on = a === mix;
        paths[a].setAttribute("class", on ? "s-orange" : "s-faint");
        paths[a].setAttribute("stroke-width", on ? 3 : 2);
        if (on) paths[a].parentNode.appendChild(paths[a]);
      });
      svg.appendChild(vline); svg.appendChild(dot);
      vline.setAttribute("x1", sx(lg2)); vline.setAttribute("x2", sx(lg2));
      dot.setAttribute("cx", sx(lg2)); dot.setAttribute("cy", sy(Math.log10(mem(mix, n))));
      var mm = mem(mix, n), mf = mem(48, n), ff = flops(mix, n), fa = flops(48, n);
      readout.textContent = NAMES[mix] + " at " + fmtN(n) + " tokens: memory " + fmtB(mm) +
        (mix === 48 ? "" : " (all attention: " + fmtB(mf) + ", " + (mf / mm).toFixed(1) + "× more)") +
        " · prefill token-mixing ≈ " + fmtF(ff) + " FLOPs" + (mix === 48 ? "" : " (" + (fa / ff).toFixed(1) + "× fewer than all attention)") + ".";
      root.querySelectorAll("[data-mix]").forEach(function (c) { c.setAttribute("aria-pressed", String(+c.dataset.mix === mix)); });
    }

    inN.addEventListener("input", draw);
    root.addEventListener("click", function (e) {
      var b = e.target.closest("[data-mix]"); if (!b) return;
      mix = +b.dataset.mix; draw();
    });
    build();
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        var want = stage.clientWidth < 560 ? "compact" : "wide";
        if (want !== layout) build();
      }).observe(stage);
    }
  }

  document.addEventListener("lc:ready", function () {
    var root = document.getElementById("ar4-cost");
    if (root) init(root);
  });
})();
