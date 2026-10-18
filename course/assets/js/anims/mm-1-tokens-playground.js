/* MM.1 playground: how many visual tokens does an image cost?
   tokens = (side / patch)² / merge, where merge = 1 (one token per patch, LLaVA-style)
   or 4 (2×2 neighbouring patches merged into one token, Qwen2-VL-style).
   Side is a multiple of 112, so it divides evenly by 14, 16, 28 and 32. */
(function () {
  var LC = window.LC;
  var MAXSIDE = 1344;

  function fmt(n) { return Math.round(n).toLocaleString("en-US"); }

  function init(root) {
    var stageBox = root.querySelector(".pg-stage");
    var slider = root.querySelector("input[type=range]");
    var out = root.querySelector("output");
    var readout = root.querySelector(".pg-readout");
    var state = { patch: 14, merge: 1, ctx: 32768 };
    var layout = null, svg, refs = {};

    function build() {
      layout = stageBox.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact";
      var W = compact ? 360 : 640, H = compact ? 286 : 250;
      if (svg) svg.remove();
      svg = LC.svg("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "An image drawn to scale with its patch grid, the number of visual tokens it becomes, and the share of the context window those tokens use. The readout below lists the same numbers." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "340px";
      stageBox.appendChild(svg);
      var S = LC.svg;
      var box = compact ? { x: 12, y: 40, max: 150 } : { x: 24, y: 40, max: 168 };
      S("text", { x: box.x, y: 20, class: "t t-sm t-muted", text: "image, drawn to scale" }, svg);
      S("rect", { x: box.x, y: box.y, width: box.max, height: box.max, class: "f-none", stroke: "var(--a-faint)", "stroke-width": 1.5, "stroke-dasharray": "4 4" }, svg);
      refs.box = box;
      refs.img = S("rect", { x: box.x, y: box.y, class: "f-surface2", stroke: "var(--a-ink)", "stroke-width": 1.5 }, svg);
      refs.grid = S("path", { d: "", stroke: "var(--a-ink)", "stroke-opacity": 0.35, "stroke-width": 0.75, fill: "none" }, svg);
      refs.gridNote = S("text", { x: box.x, y: box.y + box.max + 18, class: "t t-sm t-muted", text: "" }, svg);

      var sx = compact ? 182 : 236;
      S("text", { x: sx, y: 58, class: "t t-sm t-muted", text: "visual tokens" }, svg);
      refs.big = S("text", { x: sx, y: 92, class: "t t-orange", style: "font-size:" + (compact ? 28 : 32) + "px", "font-weight": 700, text: "" }, svg);
      refs.l1 = S("text", { x: sx, y: 120, class: "t t-sm", text: "" }, svg);
      refs.l2 = S("text", { x: sx, y: 142, class: "t t-sm", text: "" }, svg);
      refs.l3 = S("text", { x: sx, y: 164, class: "t t-sm t-muted", text: "" }, svg);
      if (!compact) refs.l4 = S("text", { x: sx, y: 186, class: "t t-sm t-muted", text: "" }, svg);

      // context bar
      var bar = compact ? { x: 12, y: 250, w: 336, h: 22, ly: 240 } : { x: 236, y: 214, w: 380, h: 22, ly: 204 };
      refs.bar = bar;
      refs.barLbl = S("text", { x: bar.x, y: bar.ly, class: "t t-sm t-muted", text: "" }, svg);
      S("rect", { x: bar.x, y: bar.y, width: bar.w, height: bar.h, rx: 5, class: "f-surface2", stroke: "var(--line)", "stroke-width": 1 }, svg);
      refs.fill = S("rect", { x: bar.x, y: bar.y, width: 0, height: bar.h, rx: 5, class: "f-orange" }, svg);
      refs.pct = S("text", { x: bar.x + bar.w, y: bar.ly, class: "t t-sm t-end", "font-weight": 600, text: "" }, svg);
      draw();
    }

    function draw() {
      var side = parseInt(slider.value, 10), p = state.patch, m = state.merge;
      var n = side / p, patches = n * n, mn = Math.ceil(n / 2), tokens = m === 4 ? mn * mn : patches, ctx = state.ctx;
      var share = tokens / ctx, fit = Math.floor(ctx / tokens);
      var compact = layout === "compact", box = refs.box;
      out.textContent = side;
      // image to scale + grid
      var s = box.max * side / MAXSIDE;
      refs.img.setAttribute("width", s); refs.img.setAttribute("height", s);
      // grid lines = token boundaries (every patch, or every 2nd patch when 2×2 merged)
      var nt = m === 4 ? mn : n, cellPx = s / (m === 4 ? n / 2 : n);
      var step = 1;
      while (cellPx * step < 3) step *= 2;             // keep drawn lines ≥ 3 units apart
      var d = "", k;
      for (k = step; k < nt; k += step) {
        var o = Math.min(s, k * cellPx);
        d += "M" + (box.x + o).toFixed(1) + " " + box.y + "V" + (box.y + s).toFixed(1) + "M" + box.x + " " + (box.y + o).toFixed(1) + "H" + (box.x + s).toFixed(1);
      }
      refs.grid.setAttribute("d", d);
      refs.gridNote.textContent = "1 square = 1 token" + (step > 1 ? " (every " + step + (step === 2 ? "nd" : "th") + " line)" : "");
      // numbers
      refs.big.textContent = fmt(tokens);
      refs.l1.textContent = n + " × " + n + " = " + fmt(patches) + " patches";
      refs.l2.textContent = m === 4 ? ("2×2 merge → " + mn + "×" + mn + (n % 2 ? " (padded)" : "")) : "1 patch = 1 token";
      var tokPx = p * (m === 4 ? 2 : 1);
      refs.l3.textContent = "1 token covers " + tokPx + "×" + tokPx + " px";
      if (refs.l4) refs.l4.textContent = side + "×" + side + " px, " + p + " px patches";
      var ctxName = ctx === 4096 ? "4K" : ctx === 32768 ? "32K" : "128K";
      refs.barLbl.textContent = "share of a " + ctxName + " context";
      refs.fill.setAttribute("width", Math.min(1, share) * refs.bar.w);
      refs.pct.textContent = share > 1 ? "doesn't fit!" : (share * 100).toFixed(share < 0.1 ? 1 : 0) + "%";
      readout.textContent = side + "×" + side + " px · " + p + " px patches → " + n + "×" + n + " = " + fmt(patches) + " patches" +
        (m === 4 ? " → 2×2 merge = " + mn + "×" + mn + " = " + fmt(tokens) + " tokens" : " = " + fmt(tokens) + " tokens") +
        " · " + (share * 100).toFixed(1) + "% of " + fmt(ctx) + (fit >= 1 ? " · " + fit + " such image" + (fit === 1 ? "" : "s") + " fill it" : " · too big for this context");
    }

    function press(attr, val) {
      root.querySelectorAll("[" + attr + "]").forEach(function (c) { c.setAttribute("aria-pressed", String(c.getAttribute(attr) === String(val))); });
    }
    slider.addEventListener("input", draw);
    root.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.patch) { state.patch = +b.dataset.patch; press("data-patch", state.patch); }
      else if (b.dataset.merge) { state.merge = +b.dataset.merge; press("data-merge", state.merge); }
      else if (b.dataset.ctx) { state.ctx = +b.dataset.ctx; press("data-ctx", state.ctx); }
      else if (b.dataset.preset) {
        var v = b.dataset.preset.split(",");
        slider.value = v[0]; state.patch = +v[1]; state.merge = +v[2];
        press("data-patch", state.patch); press("data-merge", state.merge);
      } else return;
      draw();
    });
    press("data-patch", state.patch); press("data-merge", state.merge); press("data-ctx", state.ctx);
    build();
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        var want = stageBox.clientWidth < 560 ? "compact" : "wide";
        if (want !== layout) build();
      }).observe(stageBox);
    }
  }

  document.addEventListener("lc:ready", function () {
    var root = document.getElementById("mm1-tokens");
    if (root) init(root);
  });
})();
