/* M5.5 playground: how acceptance rate α, draft length k and draft cost c set the speedup.
   Model (Leviathan et al., 2023, with i.i.d. acceptance): tokens per target pass
   E = (1 − α^(k+1)) / (1 − α); one round costs 1 target pass + k draft passes of relative
   cost c, so the speedup over plain decoding is E / (1 + c·k). Verifying k tokens is assumed
   to cost the same as one ordinary step (true while decoding is memory-bound). */
(function () {
  var LC = window.LC;
  var KMAX = 10;
  function E(a, k) { return a >= 1 ? k + 1 : (1 - Math.pow(a, k + 1)) / (1 - a); }
  function speed(a, k, c) { return E(a, k) / (1 + c * k); }

  function init(root) {
    var stage = root.querySelector(".pg-stage");
    var sA = root.querySelector('[name="alpha"]'), sK = root.querySelector('[name="k"]'), sC = root.querySelector('[name="c"]');
    var oA = root.querySelector('[data-out="alpha"]'), oK = root.querySelector('[data-out="k"]'), oC = root.querySelector('[data-out="c"]');
    var readout = root.querySelector(".pg-readout"), hint = root.querySelector(".pg-hint");
    var layout = null, svg, parts;

    function build() {
      layout = stage.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact";
      var W = compact ? 360 : 640, H = compact ? 250 : 270;
      var m = compact ? { l: 34, r: 14, t: 44, b: 44 } : { l: 44, r: 20, t: 44, b: 44 };
      if (svg) svg.remove();
      svg = LC.svg("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Expected tokens per target pass and overall speedup as the draft length k goes from 1 to 10. The readout below gives the exact values." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "360px";
      stage.appendChild(svg);
      var S = LC.svg;
      // legend row (own row above the plot)
      S("line", { x1: 6, x2: 24, y1: 14, y2: 14, class: "s-blue", "stroke-width": 5 }, svg);
      S("text", { x: 30, y: 18, class: "t t-sm", text: compact ? "tokens / target pass" : "tokens per target pass" }, svg);
      var lx = compact ? 168 : 210;
      S("line", { x1: lx, x2: lx + 18, y1: 14, y2: 14, class: "s-orange", "stroke-dasharray": "7 5" }, svg);
      S("text", { x: lx + 24, y: 18, class: "t t-sm", text: compact ? "speedup (×)" : "overall speedup (×)" }, svg);
      parts = { W: W, H: H, m: m, grid: S("g", {}, svg), lines: S("g", {}, svg) };
      S("text", { x: W - m.r, y: H - 6, class: "t t-sm t-muted t-end", text: "draft length k →" }, svg);
      draw();
    }

    function draw() {
      var a = parseFloat(sA.value), k = parseInt(sK.value, 10), c = parseFloat(sC.value);
      oA.textContent = a.toFixed(2); oK.textContent = k; oC.textContent = c.toFixed(2);
      var P = parts, m = P.m, S = LC.svg;
      var ks = []; for (var i = 1; i <= KMAX; i++) ks.push(i);
      var top = Math.max(2, Math.ceil(E(a, KMAX)));
      var stepY = top > 6 ? 2 : 1;
      if (top % stepY) top += stepY - (top % stepY);
      function sx(kk) { return m.l + (kk - 1) / (KMAX - 1) * (P.W - m.l - m.r); }
      function sy(v) { return m.t + (1 - v / top) * (P.H - m.t - m.b); }
      while (P.grid.firstChild) P.grid.removeChild(P.grid.firstChild);
      while (P.lines.firstChild) P.lines.removeChild(P.lines.firstChild);
      for (var v = 0; v <= top; v += stepY) {
        S("line", { x1: m.l, x2: P.W - m.r, y1: sy(v), y2: sy(v), class: "s-grid" }, P.grid);
        S("text", { x: m.l - 6, y: sy(v) + 4, class: "t t-sm t-muted t-end", text: v }, P.grid);
      }
      ks.forEach(function (kk) { S("text", { x: sx(kk), y: P.H - m.b + 18, class: "t t-sm t-muted t-mid", text: kk }, P.grid); });
      S("line", { x1: sx(k), x2: sx(k), y1: m.t, y2: P.H - m.b, class: "s-faint", "stroke-dasharray": "4 4" }, P.grid);
      [[function (kk) { return E(a, kk); }, "s-blue", "f-blue"], [function (kk) { return speed(a, kk, c); }, "s-orange", "f-orange"]].forEach(function (L) {
        var d = ks.map(function (kk, j) { return (j ? "L" : "M") + sx(kk).toFixed(1) + " " + sy(L[0](kk)).toFixed(1); }).join("");
        // speedup is dashed and the blue line drawn wider, so both stay visible when they coincide (c = 0)
        S("path", L[1] === "s-orange" ? { d: d, class: L[1], "stroke-dasharray": "7 5" } : { d: d, class: L[1], "stroke-width": 5 }, P.lines);
        ks.forEach(function (kk) {
          S("circle", { cx: sx(kk), cy: sy(L[0](kk)), r: kk === k ? 6.5 : 3, class: L[2], stroke: kk === k ? "var(--a-paper)" : "none", "stroke-width": 2 }, P.lines);
        });
      });
      var e = E(a, k), sp = speed(a, k, c), best = 1, bestS = 0;
      ks.forEach(function (kk) { var s = speed(a, kk, c); if (s > bestS + 1e-9) { bestS = s; best = kk; } });
      readout.textContent = "k = " + k + ": " + e.toFixed(2) + " tokens per target pass; one round costs 1 + " + k + " × " + c.toFixed(2) +
        " = " + (1 + c * k).toFixed(2) + " target passes → about " + sp.toFixed(2) + "× faster. Best k here: " + best + " (" + bestS.toFixed(2) + "×).";
      var msg;
      if (sp < 1) msg = "Slower than no speculation: the drafts cost more than the accepted tokens save.";
      else if (k > best + 1) msg = "Past the best k: extra drafts are rarely accepted (each needs all earlier ones accepted) but still cost time.";
      else if (a <= 0.5) msg = "Low acceptance: most rounds stop at the first or second draft, so long drafts are wasted.";
      else if (c === 0) msg = "With free drafts the speedup equals the tokens per pass, and more drafts never hurt.";
      else msg = "Each extra draft token adds less than the one before: the gain flattens as α^k shrinks.";
      hint.textContent = msg;
    }

    [sA, sK, sC].forEach(function (s) { s.addEventListener("input", draw); });
    build();
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        var want = stage.clientWidth < 560 ? "compact" : "wide";
        if (want !== layout) build();
      }).observe(stage);
    }
  }

  document.addEventListener("lc:ready", function () {
    var root = document.getElementById("spec-playground");
    if (root) init(root);
  });
})();
