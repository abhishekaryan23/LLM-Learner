/* A1.3 playground: codec bitrate = frame rate × codebooks × log2(codebook size),
   tokens/s = frame rate × codebooks, compared on log scales with 24 kHz 16-bit PCM,
   raw samples and spoken text (~3 tokens/s). */
(function () {
  var LC = window.LC;
  function fmtInt(n) { return Math.round(n).toLocaleString("en-US"); }
  function fmtRate(bps) { return bps >= 1000 ? (Math.round(bps / 100) / 10) + " kbit/s" : fmtInt(bps) + " bit/s"; }

  function init(root) {
    var stageBox = root.querySelector(".pg-stage");
    var inFr = root.querySelector('[data-in="fr"]'), inQ = root.querySelector('[data-in="q"]'), inB = root.querySelector('[data-in="b"]');
    var oFr = root.querySelector('[data-out="fr"]'), oQ = root.querySelector('[data-out="q"]'), oK = root.querySelector('[data-out="k"]');
    var readout = root.querySelector(".pg-readout");
    var layout = null, svg, W, H, sx, rows = {};

    function build() {
      layout = stageBox.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact";
      W = compact ? 360 : 640; H = 300;
      var l = 10, r = compact ? 14 : 20;
      sx = function (v) { return l + Math.max(0, Math.log10(Math.max(v, 1))) / 6 * (W - l - r); };
      if (svg) svg.remove();
      svg = LC.svg("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Log-scale bars comparing the codec's bitrate with raw PCM, and its tokens per second with raw samples and text. The readout below gives the numbers." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "380px";
      stageBox.appendChild(svg);
      var S = LC.svg;
      for (var d = 0; d <= 6; d++) {
        S("line", { x1: sx(Math.pow(10, d)), x2: sx(Math.pow(10, d)), y1: 28, y2: 268, class: "s-grid" }, svg);
        S("text", { x: sx(Math.pow(10, d)), y: 286, class: "t t-sm t-muted " + (d === 0 ? "" : d === 6 ? "t-end" : "t-mid"), text: ["1", "10", "100", "1k", "10k", "100k", "1M"][d] }, svg);
      }
      S("text", { x: l, y: 18, class: "t t-sm t-muted", text: "bits per second" }, svg);
      S("text", { x: l, y: 136, class: "t t-sm t-muted", text: compact ? "positions per second" : "positions (tokens or samples) per second" }, svg);
      function row(key, y, label, cls) {
        S("text", { x: l, y: y, class: "t t-sm", text: label }, svg);
        var val = S("text", { x: W - r, y: y, class: "t t-sm t-mono t-end", text: "" }, svg);
        var bar = S("rect", { x: l, y: y + 6, width: 1, height: 16, rx: 3, class: cls }, svg);
        rows[key] = { val: val, bar: bar };
      }
      row("pcm", 42, compact ? "16-bit PCM, 24 kHz" : "raw 16-bit PCM at 24 kHz", "f-ink");
      row("bits", 86, "this codec", "f-orange");
      row("samples", 160, compact ? "raw samples, 24 kHz" : "raw samples at 24 kHz", "f-ink");
      row("tokens", 204, compact ? "this codec's tokens" : "this codec's tokens", "f-blue");
      row("text", 248, compact ? "text of the speech" : "text tokens for the same speech (≈3/s)", "f-faint");
      draw();
    }

    function set(key, v, txt) { rows[key].bar.setAttribute("width", Math.max(3, sx(v) - sx(1))); rows[key].val.textContent = txt; }

    function draw() {
      var fr = parseFloat(inFr.value), q = parseInt(inQ.value, 10), b = parseInt(inB.value, 10);
      var k = Math.pow(2, b), bps = fr * q * b, tps = fr * q;
      oFr.textContent = String(fr); oQ.textContent = String(q); oK.textContent = fmtInt(k);
      root.querySelectorAll("[data-p]").forEach(function (c) {
        var p = c.dataset.p.split(",").map(parseFloat);
        c.setAttribute("aria-pressed", String(p[0] === fr && p[1] === q && p[2] === b));
      });
      set("pcm", 384000, "384 kbit/s");
      set("bits", bps, fmtRate(bps));
      set("samples", 24000, "24,000");
      set("tokens", tps, fmtInt(tps));
      set("text", 3, "≈ 3");
      readout.textContent = fr + " × " + q + " × " + b + " bits = " + fmtInt(bps) + " bit/s · " + fmtInt(tps) + " tokens/s · " +
        (384000 / bps >= 100 ? fmtInt(384000 / bps) : Math.round(384000 / bps * 10) / 10) + "× smaller than 24 kHz PCM · 1 minute = " + fmtInt(tps * 60) + " tokens";
    }

    [inFr, inQ, inB].forEach(function (i) { i.addEventListener("input", draw); });
    root.addEventListener("click", function (e) {
      var c = e.target.closest("button[data-p]"); if (!c) return;
      var p = c.dataset.p.split(",");
      inFr.value = p[0]; inQ.value = p[1]; inB.value = p[2]; draw();
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
    var root = document.getElementById("a1-3-codec-playground");
    if (root) init(root);
  });
})();
