/* M3.7 playground: rough GPU memory to fine-tune a model, excluding activations.
   Bytes per base parameter:
     Full fine-tuning, mixed-precision AdamW: 2 (bf16 weights) + 2 (bf16 grads) + 12 (fp32 master copy + Adam m, v) = 16
     LoRA:  2 (frozen bf16 base) + adapters
     QLoRA: 0.5 (4-bit NF4 base) + 0.127/8 (double-quantised block constants) + adapters
   Adapters ≈ 0.6% of the base parameters (r = 16 on every linear layer of a Llama-2-7B-style model),
   each trainable parameter costing ~16 bytes (weights, grads, optimizer state). */
(function () {
  var LC = window.LC;
  var SIZES = [1, 3, 7, 13, 34, 70];
  var GPUS = [24, 48, 80];
  var XMAX = 160, ADAPT = 0.006 * 16;
  var METHODS = [
    { name: "Full fine-tune", base: 2, train: 14 },
    { name: "LoRA", base: 2, train: ADAPT },
    { name: "QLoRA", base: 0.5 + 0.127 / 8, train: ADAPT }
  ];
  function gb(v) { return v >= 100 ? Math.round(v).toLocaleString("en-US") : v.toFixed(1); }

  function init(root) {
    var stage = root.querySelector(".pg-stage");
    var slider = root.querySelector("input[type=range]");
    var out = root.querySelector("output");
    var readout = root.querySelector(".pg-readout");
    var gpu = 80, layout = null;

    function draw() {
      var P = SIZES[+slider.value];
      out.textContent = P + "B";
      layout = stage.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact";
      var W = compact ? 360 : 640, H = 270, S = LC.svg;
      var left = 12, right = W - 14, sc = (right - left) / XMAX;
      var svg = S("svg", { viewBox: "0 0 " + W + " " + H, role: "img",
        "aria-label": "Estimated fine-tuning memory for a " + P + " billion parameter model: " +
          METHODS.map(function (m) { return m.name + " " + gb(P * (m.base + m.train)) + " GB"; }).join(", ") + ". GPU line at " + gpu + " GB." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "320px";
      var gx = left + gpu * sc;
      S("text", { x: Math.min(right, Math.max(left + 40, gx)), y: 16, class: "t t-sm " + (gx > right - 40 ? "t-end" : "t-mid"), text: gpu + " GB GPU", "font-weight": 600 }, svg);
      METHODS.forEach(function (m, i) {
        var ly = 46 + i * 62, by = ly + 8, bh = 22;
        var base = P * m.base, train = P * m.train, tot = base + train, fits = tot <= gpu;
        S("text", { x: left, y: ly, class: "t t-sm", text: m.name + " · ≈" + gb(tot) + " GB · " + (fits ? "✓ fits" : "✗ too big"), "font-weight": 600 }, svg);
        S("rect", { x: left, y: by, width: right - left, height: bh, rx: 4, class: "f-surface2" }, svg);
        var wb = Math.min(base, XMAX) * sc;
        S("rect", { x: left, y: by, width: Math.max(1, wb), height: bh, rx: 4, class: "f-blue" }, svg);
        var wt = Math.max(0, Math.min(tot, XMAX) * sc - wb);
        if (wt > 0.5) S("rect", { x: left + wb, y: by, width: wt, height: bh, class: "f-orange" }, svg);
        if (tot > XMAX) S("text", { x: right - 6, y: by + 16, class: "t t-sm t-end t-nohalo", text: "off the scale →", style: "fill:#fff", "font-weight": 600 }, svg);
        S("path", { d: "M" + gx + " " + (by - 5) + "V" + (by + bh + 5), class: "s-ink", "stroke-width": 2.5, "stroke-dasharray": "3 3" }, svg);
      });
      var axY = 46 + 2 * 62 + 8 + 22 + 10;
      S("path", { d: "M" + left + " " + axY + "H" + right, class: "s-axis" }, svg);
      [0, 40, 80, 120, 160].forEach(function (v, k) {
        var x = left + v * sc;
        S("path", { d: "M" + x + " " + axY + "v5", class: "s-axis" }, svg);
        S("text", { x: x, y: axY + 19, class: "t t-sm t-muted " + (k === 0 ? "" : k === 4 ? "t-end" : "t-mid"), text: v + (k === 4 ? " GB" : "") }, svg);
      });
      var lgY = H - 12;
      S("rect", { x: left, y: lgY - 10, width: 12, height: 12, rx: 2, class: "f-blue" }, svg);
      S("text", { x: left + 18, y: lgY, class: "t t-sm", text: "model weights" }, svg);
      var l2 = left + (compact ? 120 : 140);
      S("rect", { x: l2, y: lgY - 10, width: 12, height: 12, rx: 2, class: "f-orange" }, svg);
      S("text", { x: l2 + 18, y: lgY, class: "t t-sm", text: compact ? "grads + fp32 copy + Adam" : "trainable: grads + fp32 master copy + optimizer" }, svg);
      stage.innerHTML = ""; stage.appendChild(svg);

      var f = P * 16, l = P * (2 + ADAPT), q = P * (METHODS[2].base + ADAPT);
      readout.textContent = P + "B parameters: full fine-tuning ≈ " + gb(f) + " GB, LoRA ≈ " + gb(l) + " GB, QLoRA ≈ " + gb(q) +
        " GB, before activations (which grow with batch size and sequence length).";
    }

    slider.addEventListener("input", draw);
    root.querySelectorAll("[data-gpu]").forEach(function (b) {
      b.addEventListener("click", function () {
        gpu = +b.dataset.gpu;
        root.querySelectorAll("[data-gpu]").forEach(function (c) { c.setAttribute("aria-pressed", String(c === b)); });
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
    var root = document.getElementById("lora-mem-playground");
    if (root) init(root);
  });
})();
