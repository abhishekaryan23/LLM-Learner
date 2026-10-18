/* V1.4 playground: intersection over union. The blue "truth" box is fixed; move and
   resize the orange "prediction" with sliders, by dragging it, or with presets.
   World is 100 × 50 units; truth = (22, 10)–(54, 36), area 832. */
(function () {
  var LC = window.LC;
  var A = { x: 22, y: 10, w: 32, h: 26 }, WX = 100, WY = 50;
  var PRESETS = [["Perfect", 22, 10, 1], ["Good enough", 26, 12, 1], ["Shifted", 38, 10, 1], ["Too big", 14, 4, 1.5], ["Miss", 60, 20, 1]];

  function init(box) {
    box.insertAdjacentHTML("beforeend",
      '<div class="pg-stage" style="margin-top:10px"></div>' +
      '<div class="pg-controls"><div style="display:grid;gap:6px">' +
        '<label><span>Prediction left edge x = <output data-o="x"></output></span><input type="range" data-k="x" min="0" max="68" step="1" value="34"></label>' +
        '<label><span>Prediction top edge y = <output data-o="y"></output></span><input type="range" data-k="y" min="0" max="24" step="1" value="16"></label>' +
        '<label><span>Prediction size × <output data-o="s"></output></span><input type="range" data-k="s" min="0.4" max="1.8" step="0.05" value="1"></label>' +
      '</div></div>' +
      '<div class="chips" role="group" aria-label="Presets" style="margin-top:12px"></div>' +
      '<p class="pg-readout" aria-live="polite"></p>');
    var stage = box.querySelector(".pg-stage"), readout = box.querySelector(".pg-readout"), chips = box.querySelector(".chips");
    var sl = {}, outs = {};
    box.querySelectorAll("input[type=range]").forEach(function (i) { sl[i.dataset.k] = i; });
    box.querySelectorAll("output").forEach(function (o) { outs[o.dataset.o] = o; });
    PRESETS.forEach(function (p) {
      var b = LC.el('<button type="button" class="chip" aria-pressed="false"></button>');
      b.textContent = p[0];
      b.addEventListener("click", function () { sl.s.value = p[3]; limits(); sl.x.value = p[1]; sl.y.value = p[2]; draw(); });
      chips.appendChild(b);
    });
    var layout = null, svg, k, ox, oy, rB, rI, iouTxt, H;

    function B() { var s = +sl.s.value; return { x: +sl.x.value, y: +sl.y.value, w: A.w * s, h: A.h * s }; }
    function limits() {
      var s = +sl.s.value;
      sl.x.max = Math.floor(WX - A.w * s); sl.y.max = Math.floor(WY - A.h * s);
      if (+sl.x.value > +sl.x.max) sl.x.value = sl.x.max;
      if (+sl.y.value > +sl.y.max) sl.y.value = sl.y.max;
    }

    function build() {
      layout = stage.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact", S = LC.svg;
      var W = compact ? 360 : 640;
      k = compact ? 3.4 : 5.6; ox = (W - WX * k) / 2; oy = 34;
      H = oy + WY * k + 34;
      if (svg) svg.remove();
      svg = S("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "A blue ground-truth box and an orange predicted box; their overlap is shaded. The readout below gives the intersection, union and IoU." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "400px";
      stage.appendChild(svg);
      // legend row (fixed position, never collides with the moving boxes)
      var lx = compact ? 8 : ox;
      [["var(--a-blue)", "truth"], ["var(--a-orange)", "prediction"], ["var(--a-ink)", "overlap"]].forEach(function (it, i) {
        var x = lx + i * (compact ? 112 : 140);
        S("rect", { x: x, y: 8, width: 14, height: 14, rx: 3, fill: it[0], "fill-opacity": i === 2 ? 0.4 : 0.8 }, svg);
        S("text", { x: x + 20, y: 20, class: "t t-sm", text: it[1] }, svg);
      });
      S("rect", { x: ox, y: oy, width: WX * k, height: WY * k, rx: 4, class: "f-surface2", stroke: "var(--line)" }, svg);
      for (var gx = 10; gx < WX; gx += 10) S("line", { x1: ox + gx * k, x2: ox + gx * k, y1: oy, y2: oy + WY * k, class: "s-grid" }, svg);
      for (var gy = 10; gy < WY; gy += 10) S("line", { x1: ox, x2: ox + WX * k, y1: oy + gy * k, y2: oy + gy * k, class: "s-grid" }, svg);
      S("rect", { x: ox + A.x * k, y: oy + A.y * k, width: A.w * k, height: A.h * k, fill: "var(--a-blue)", "fill-opacity": 0.12, stroke: "var(--a-blue)", "stroke-width": 3 }, svg);
      rI = S("rect", { fill: "var(--a-ink)", "fill-opacity": 0.4 }, svg);
      rB = S("rect", { fill: "var(--a-orange)", "fill-opacity": 0.15, stroke: "var(--a-orange)", "stroke-width": 3, "stroke-dasharray": "7 4", style: "cursor:grab;touch-action:none" }, svg);
      iouTxt = S("text", { x: W / 2, y: H - 10, class: "t t-mid", "font-weight": 600, text: "" }, svg);
      // drag the prediction box
      var drag = null;
      rB.addEventListener("pointerdown", function (e) {
        var pt = toWorld(e), b = B();
        drag = { dx: pt.x - b.x, dy: pt.y - b.y };
        rB.setPointerCapture(e.pointerId); e.preventDefault();
      });
      rB.addEventListener("pointermove", function (e) {
        if (!drag) return;
        var pt = toWorld(e);
        sl.x.value = Math.round(Math.max(0, Math.min(+sl.x.max, pt.x - drag.dx)));
        sl.y.value = Math.round(Math.max(0, Math.min(+sl.y.max, pt.y - drag.dy)));
        draw();
      });
      ["pointerup", "pointercancel"].forEach(function (t) { rB.addEventListener(t, function () { drag = null; }); });
      draw();
    }
    function toWorld(e) {
      var r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal, f = vb.width / r.width;
      return { x: ((e.clientX - r.left) * f - ox) / k, y: ((e.clientY - r.top) * f - oy) / k };
    }

    function draw() {
      limits();
      var b = B();
      outs.x.textContent = b.x; outs.y.textContent = b.y; outs.s.textContent = (+sl.s.value).toFixed(2);
      rB.setAttribute("x", ox + b.x * k); rB.setAttribute("y", oy + b.y * k);
      rB.setAttribute("width", b.w * k); rB.setAttribute("height", b.h * k);
      var ix0 = Math.max(A.x, b.x), iy0 = Math.max(A.y, b.y), ix1 = Math.min(A.x + A.w, b.x + b.w), iy1 = Math.min(A.y + A.h, b.y + b.h);
      var iw = Math.max(0, ix1 - ix0), ih = Math.max(0, iy1 - iy0), inter = iw * ih;
      rI.setAttribute("x", ox + ix0 * k); rI.setAttribute("y", oy + iy0 * k);
      rI.setAttribute("width", iw * k); rI.setAttribute("height", ih * k);
      var union = A.w * A.h + b.w * b.h - inter, iou = inter / union;
      iouTxt.textContent = "IoU = " + iou.toFixed(2);
      iouTxt.setAttribute("class", "t t-mid " + (iou >= 0.5 ? "t-blue" : "t-orange"));
      var verdict = iou >= 0.75 ? "a match even at the strict 0.75 threshold (COCO's AP75)" : iou >= 0.5 ? "a match at the usual 0.5 threshold (not at 0.75)" : "a miss at 0.5: this detection would count as a false positive";
      readout.textContent = "intersection " + Math.round(inter) + " · union " + Math.round(union) + " · IoU " + iou.toFixed(3) + " → " + verdict;
      chips.querySelectorAll(".chip").forEach(function (c, i) {
        var p = PRESETS[i];
        c.setAttribute("aria-pressed", String(+sl.x.value === p[1] && +sl.y.value === p[2] && Math.abs(+sl.s.value - p[3]) < 1e-9));
      });
    }

    box.querySelectorAll("input[type=range]").forEach(function (i) { i.addEventListener("input", draw); });
    build();
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        var want = stage.clientWidth < 560 ? "compact" : "wide";
        if (want !== layout) build();
      }).observe(stage);
    }
  }

  document.addEventListener("lc:ready", function () {
    document.querySelectorAll("[data-iou-playground]").forEach(init);
  });
})();
