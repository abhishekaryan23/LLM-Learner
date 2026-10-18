/* M4.2 playground: pass@k for one problem from n samples with c correct.
   Unbiased estimator (Chen et al., 2021): 1 − C(n−c, k)/C(n, k), computed as a stable product.
   Plug-in shortcut: 1 − (1 − c/n)^k. */
(function () {
  var LC = window.LC;
  function unbiased(n, c, k) {
    if (n - c < k) return 1;
    var r = 1;                                    // C(n−c,k)/C(n,k) = Π_{i=n−c+1..n} (1 − k/i)
    for (var i = n - c + 1; i <= n; i++) r *= 1 - k / i;
    return 1 - r;
  }
  function shortcut(n, c, k) { return 1 - Math.pow(1 - c / n, k); }

  function init(root) {
    var stage = root.querySelector(".pg-stage");
    var sN = root.querySelector("[data-n]"), sC = root.querySelector("[data-c]"), sK = root.querySelector("[data-k]");
    var oN = root.querySelector("[data-on]"), oC = root.querySelector("[data-oc]"), oK = root.querySelector("[data-ok]");
    var readout = root.querySelector(".pg-readout");
    var layout = null, svg, P;

    function build() {
      layout = stage.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact";
      var W = compact ? 360 : 640, H = compact ? 250 : 270;
      var m = { l: 40, r: compact ? 12 : 24, t: 48, b: 38 };
      if (svg) svg.remove();
      svg = LC.svg("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Line chart of pass@k against k for the chosen n and c: the unbiased estimate in orange and the plug-in shortcut in blue. The readout below gives the values at the chosen k." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "340px";
      stage.appendChild(svg);
      var S = LC.svg;
      var y = function (v) { return m.t + (1 - v) * (H - m.t - m.b); };
      [0, 0.5, 1].forEach(function (v) {
        S("line", { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), class: v ? "s-grid" : "s-axis" }, svg);
        S("text", { x: m.l - 6, y: y(v) + 4, class: "t t-sm t-muted t-end", text: v }, svg);
      });
      S("text", { x: 4, y: 16, class: "t t-sm t-muted", text: "↑ pass@k" }, svg);
      // legend, right-aligned in the title row
      var lx = W - m.r;
      S("text", { x: lx, y: 16, class: "t t-sm t-end", text: "shortcut" }, svg);
      S("path", { d: "M" + (lx - 82) + " 12h22", class: "s-blue", "stroke-dasharray": "5 5", "stroke-width": 2.5 }, svg);
      S("text", { x: lx - 92, y: 16, class: "t t-sm t-end", text: "unbiased" }, svg);
      S("path", { d: "M" + (lx - 172) + " 12h22", class: "s-orange" }, svg);
      P = { W: W, H: H, m: m, y: y };
      P.kLine = S("line", { y1: m.t - 6, y2: H - m.b, class: "s-faint", "stroke-width": 1.5 }, svg);
      P.naive = S("path", { d: "", class: "s-blue", "stroke-dasharray": "5 5", "stroke-width": 2.5 }, svg);
      P.unb = S("path", { d: "", class: "s-orange" }, svg);
      P.dotU = S("circle", { r: 5, class: "f-orange" }, svg);
      P.dotN = S("circle", { r: 5, class: "f-blue" }, svg);
      P.ticks = S("g", {}, svg);
      draw();
    }

    function draw() {
      var n = +sN.value;
      if (+sC.max !== n) sC.max = n;
      if (+sK.max !== n) sK.max = n;
      var c = +sC.value, k = +sK.value;
      oN.textContent = n; oC.textContent = c; oK.textContent = k;
      var m = P.m, W = P.W, H = P.H;
      var x = function (kk) { return n === 1 ? m.l : m.l + ((kk - 1) / (n - 1)) * (W - m.l - m.r); };
      var du = "", dn = "";
      for (var kk = 1; kk <= n; kk++) {
        du += (kk > 1 ? "L" : "M") + x(kk).toFixed(1) + " " + P.y(unbiased(n, c, kk)).toFixed(1);
        dn += (kk > 1 ? "L" : "M") + x(kk).toFixed(1) + " " + P.y(shortcut(n, c, kk)).toFixed(1);
      }
      P.unb.setAttribute("d", du); P.naive.setAttribute("d", dn);
      var u = unbiased(n, c, k), s = shortcut(n, c, k);
      P.dotU.setAttribute("cx", x(k)); P.dotU.setAttribute("cy", P.y(u));
      P.dotN.setAttribute("cx", x(k)); P.dotN.setAttribute("cy", P.y(s));
      P.kLine.setAttribute("x1", x(k)); P.kLine.setAttribute("x2", x(k));
      while (P.ticks.firstChild) P.ticks.removeChild(P.ticks.firstChild);
      var lab = [1, n];
      lab.forEach(function (kk, i) {
        LC.svg("text", { x: x(kk), y: H - m.b + 18, class: "t t-sm t-muted " + (i ? "t-end" : ""), text: (i ? "k = " : "") + kk }, P.ticks);
      });
      readout.textContent = "n = " + n + ", c = " + c + ", k = " + k + " → unbiased pass@" + k + " = " + u.toFixed(3) +
        " · shortcut 1 − (1 − c/n)^k = " + s.toFixed(3) + (c === 0 ? " · no sample passed, so every estimate is 0." : (n - c < k ? " · fewer than k failures exist, so any pick of k must contain a pass." : ""));
    }

    [sN, sC, sK].forEach(function (s) { s.addEventListener("input", draw); });
    build();
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        var want = stage.clientWidth < 560 ? "compact" : "wide";
        if (want !== layout) build();
      }).observe(stage);
    }
  }

  document.addEventListener("lc:ready", function () {
    var root = document.getElementById("passk-playground");
    if (root) init(root);
  });
})();
