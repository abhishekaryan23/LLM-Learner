/* M1.3 playground: RoPE in one pair of dimensions. The query (unit length, starting
   angle 20°) sits at position m and is rotated by m·θ; the key (unit, starting at 0°)
   sits at position n and is rotated by n·θ. Their dot product is cos((n − m)·θ − 20°),
   so it depends only on the relative distance n − m. The chart plots exactly that. */
(function () {
  var LC = window.LC;
  var DEG = Math.PI / 180, Q0 = 20, MAXP = 12;
  var SPEEDS = [{ th: 30, lbl: "Fast · 30°/token" }, { th: 10, lbl: "Medium · 10°/token" }, { th: 2, lbl: "Slow · 2°/token" }];

  function init(box) {
    var m = 2, n = 5, sp = 0;
    box.insertAdjacentHTML("beforeend",
      '<div class="chips" role="group" aria-label="Rotation speed of this pair"></div>' +
      '<div class="pg-stage" style="margin-top:12px"></div>' +
      '<div class="pg-controls">' +
        '<div style="display:grid;gap:4px"><label><span>Query position m = <output class="m-out"></output></span><input type="range" class="m-in" min="0" max="' + MAXP + '" step="1" value="2"></label>' +
        '<label><span>Key position n = <output class="n-out"></output></span><input type="range" class="n-in" min="0" max="' + MAXP + '" step="1" value="5"></label></div>' +
        '<div class="pg-buttons"><button type="button" class="btn" data-shift="-1">Shift both −1</button><button type="button" class="btn btn-primary" data-shift="1">Shift both +1</button></div>' +
      '</div>' +
      '<p class="pg-readout" aria-live="polite"></p>');
    var chips = box.querySelector(".chips"), stage = box.querySelector(".pg-stage");
    var mIn = box.querySelector(".m-in"), nIn = box.querySelector(".n-in");
    var mOut = box.querySelector(".m-out"), nOut = box.querySelector(".n-out");
    var readout = box.querySelector(".pg-readout");
    SPEEDS.forEach(function (s, i) {
      var b = LC.el('<button type="button" class="chip" aria-pressed="' + (i === sp) + '">' + LC.escape(s.lbl) + "</button>");
      b.addEventListener("click", function () { sp = i; chips.querySelectorAll(".chip").forEach(function (c, j) { c.setAttribute("aria-pressed", String(j === sp)); }); draw(); });
      chips.appendChild(b);
    });
    mIn.addEventListener("input", function () { m = +mIn.value; draw(); });
    nIn.addEventListener("input", function () { n = +nIn.value; draw(); });
    box.querySelectorAll("[data-shift]").forEach(function (b) {
      b.addEventListener("click", function () {
        var d = +b.getAttribute("data-shift");
        if (Math.min(m, n) + d < 0 || Math.max(m, n) + d > MAXP) { readout.textContent = "Can't shift further: positions run from 0 to " + MAXP + "."; return; }
        m += d; n += d; mIn.value = m; nIn.value = n; draw();
      });
    });

    function draw() {
      var S = LC.svg, th = SPEEDS[sp].th;
      mOut.textContent = m; nOut.textContent = n;
      var compact = (stage.clientWidth || 320) < 560;
      var W = compact ? 360 : 640, H = compact ? 380 : 290;
      var cx = compact ? 180 : 160, cy = compact ? 122 : 150, R = compact ? 82 : 100;
      var qa = Q0 + m * th, ka = n * th, rel = n - m, ang = rel * th - Q0, score = Math.cos(ang * DEG);
      var svg = S("svg", { viewBox: "0 0 " + W + " " + H, width: "100%", role: "img",
        "aria-label": "Query at position " + m + " and key at position " + n + ", " + Math.round(((ang % 360) + 360) % 360) + " degrees apart; dot product " + score.toFixed(2) + ". The chart shows the dot product against n minus m." });
      svg.style.display = "block"; svg.style.maxHeight = compact ? "none" : "360px";
      function pt(a, r) { return [cx + r * Math.cos(a * DEG), cy - r * Math.sin(a * DEG)]; }
      function arrow(a, cls) {
        var t = pt(a, R), b1 = pt(a - 6, R - 14), b2 = pt(a + 6, R - 14);
        S("path", { d: "M" + cx + " " + cy + "L" + t[0] + " " + t[1] + "M" + b1[0] + " " + b1[1] + "L" + t[0] + " " + t[1] + "L" + b2[0] + " " + b2[1], class: cls, "stroke-width": 3.5 }, svg);
      }
      S("circle", { cx: cx, cy: cy, r: R, class: "s-grid" }, svg);
      S("line", { x1: cx - R, x2: cx + R, y1: cy, y2: cy, class: "s-grid" }, svg);
      S("line", { x1: cx, x2: cx, y1: cy - R, y2: cy + R, class: "s-grid" }, svg);
      arrow(ka, "s-blue");
      arrow(qa, "s-orange");
      // labels: push them apart if the arrows nearly coincide
      var lq = pt(qa, R + 13), lk = pt(ka, R + 13);
      if (Math.hypot(lq[0] - lk[0], lq[1] - lk[1]) < 20) lk = pt(ka, R + 30);
      S("text", { x: lq[0], y: lq[1] + 4, class: "t t-sm t-orange t-mid", text: "q" }, svg);
      S("text", { x: lk[0], y: lk[1] + 4, class: "t t-sm t-blue t-mid", text: "k" }, svg);

      // chart: q·k against n − m
      var c = compact ? { x0: 40, x1: 346, y0: 264, y1: 350 } : { x0: 340, x1: 624, y0: 46, y1: 230 };
      function sx(d) { return c.x0 + (d + MAXP) / (2 * MAXP) * (c.x1 - c.x0); }
      function sy(v) { return c.y0 + (1 - v) / 2 * (c.y1 - c.y0); }
      S("text", { x: c.x0 - 34 < 0 ? 4 : c.x0 - 34, y: c.y0 - 14, class: "t t-sm t-muted", text: "↑ q·k" }, svg);
      S("line", { x1: c.x0, x2: c.x1, y1: sy(0), y2: sy(0), class: "s-grid" }, svg);
      S("path", { d: "M" + c.x0 + " " + c.y0 + "V" + c.y1 + "H" + c.x1, class: "s-axis" }, svg);
      [1, 0, -1].forEach(function (v) { S("text", { x: c.x0 - 6, y: sy(v) + 4, class: "t t-sm t-muted t-end", text: v > 0 ? "1" : v < 0 ? "−1" : "0" }, svg); });
      [-MAXP, 0, MAXP].forEach(function (d) { S("text", { x: sx(d), y: c.y1 + 21, class: "t t-sm t-muted t-mid", text: d > 0 ? "+" + d : d < 0 ? "−" + -d : "0" }, svg); });
      S("text", { x: sx(MAXP / 2), y: c.y1 + 21, class: "t t-sm t-muted t-mid", text: "n − m →" }, svg);
      S("path", { d: LC.fnPath(function (d) { return Math.cos((d * th - Q0) * DEG); }, -MAXP, MAXP, sx, sy, 240), class: "s-blue", "stroke-width": 2 }, svg);
      S("circle", { cx: sx(rel), cy: sy(score), r: 6.5, class: "f-orange", stroke: "var(--a-ink)", "stroke-width": 1.5 }, svg);
      stage.innerHTML = ""; stage.appendChild(svg);
      readout.textContent = "n − m = " + rel + " · angle between = " + rel + "×" + th + "° − 20° = " + ang + "° · q·k = " + score.toFixed(2);
    }
    draw();
    if ("ResizeObserver" in window) {
      var lw = 0;
      new ResizeObserver(function () { var w = stage.clientWidth; if (Math.abs(w - lw) > 4) { lw = w; draw(); } }).observe(stage);
    }
  }

  document.addEventListener("lc:ready", function () {
    document.querySelectorAll("[data-rope-playground]").forEach(init);
  });
})();
