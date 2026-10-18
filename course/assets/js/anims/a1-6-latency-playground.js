/* A1.6 playground: a cascaded voice assistant's response-latency budget.
   total = endpoint + ASR + LLM first token + TTS first audio + network (all on the critical path). */
(function () {
  var LC = window.LC;
  var KEYS = ["ep", "asr", "llm", "tts", "net"];
  var NAMES = { compact: ["wait", "ASR", "LLM", "TTS", "network"], wide: ["endpointing wait", "ASR finalize", "LLM first token", "TTS first audio", "network"] };
  function fmt(n) { return Math.round(n).toLocaleString("en-US"); }

  function init(root) {
    var stageBox = root.querySelector(".pg-stage"), readout = root.querySelector(".pg-readout");
    var ins = {}, outs = {};
    KEYS.forEach(function (k) { ins[k] = root.querySelector('[data-in="' + k + '"]'); outs[k] = root.querySelector('[data-out="' + k + '"]'); });
    var layout = null, svg, W, H, lx, rx, bars = [], vals = [], totalBar, totalVal, gAxis, human, humanLbl;

    function build() {
      layout = stageBox.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact", S = LC.svg;
      W = compact ? 360 : 640; H = 214;
      lx = compact ? 64 : 130; rx = W - (compact ? 58 : 76);
      if (svg) svg.remove();
      svg = S("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Stacked timeline of the five latency stages and their total. The readout below gives the numbers." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "340px";
      stageBox.appendChild(svg);
      gAxis = S("g", {}, svg);
      human = S("line", { y1: 26, y2: 182, class: "s-orange", "stroke-width": 1.5, "stroke-dasharray": "4 4" }, svg);
      humanLbl = S("text", { y: 16, class: "t t-sm t-orange", text: compact ? "human ≈ 200 ms" : "typical human gap ≈ 200 ms" }, svg);
      bars = []; vals = [];
      NAMES[layout].forEach(function (n, i) {
        var y = 40 + i * 24;
        S("text", { x: lx - 8, y: y + 4, class: "t t-sm t-end", text: n }, svg);
        bars.push(S("rect", { y: y - 7, height: 14, rx: 3, class: i % 2 ? "f-blue" : "f-ink" }, svg));
        vals.push(S("text", { x: W - 6, y: y + 4, class: "t t-sm t-mono t-end", text: "" }, svg));
      });
      S("text", { x: lx - 8, y: 168, class: "t t-sm t-end", text: "total" }, svg);
      totalBar = S("rect", { x: lx, y: 160, height: 16, rx: 3, class: "f-orange" }, svg);
      totalVal = S("text", { x: W - 6, y: 172, class: "t t-sm t-mono t-end", text: "" }, svg);
      draw();
    }

    function draw() {
      var v = KEYS.map(function (k) { return parseFloat(ins[k].value); });
      KEYS.forEach(function (k, i) { outs[k].textContent = String(v[i]); });
      var total = v.reduce(function (a, b) { return a + b; }, 0);
      var max = Math.max(1500, Math.ceil(total / 500) * 500);
      function X(ms) { return lx + ms / max * (rx - lx); }
      var S = LC.svg;
      while (gAxis.firstChild) gAxis.removeChild(gAxis.firstChild);
      S("line", { x1: lx, x2: rx, y1: 186, y2: 186, class: "s-axis" }, gAxis);
      var step = max <= 2000 ? 500 : 1000;
      for (var t = 0; t <= max; t += step) {
        S("line", { x1: X(t), x2: X(t), y1: 26, y2: 186, class: "s-grid" }, gAxis);
        S("text", { x: X(t), y: 202, class: "t t-sm t-muted " + (t === max ? "t-end" : "t-mid"), text: t === max ? fmt(t) + " ms" : fmt(t) }, gAxis);
      }
      var acc = 0;
      v.forEach(function (ms, i) {
        bars[i].setAttribute("x", X(acc)); bars[i].setAttribute("width", Math.max(1.5, X(acc + ms) - X(acc)));
        vals[i].textContent = fmt(ms) + " ms";
        acc += ms;
      });
      totalBar.setAttribute("width", X(total) - X(0));
      totalVal.textContent = fmt(total) + " ms";
      human.setAttribute("x1", X(200)); human.setAttribute("x2", X(200));
      humanLbl.setAttribute("x", X(200) - 4);
      root.querySelectorAll("[data-p]").forEach(function (c) {
        var p = c.dataset.p.split(",").map(parseFloat);
        c.setAttribute("aria-pressed", String(p.every(function (x, i) { return x === v[i]; })));
      });
      var big = KEYS[v.indexOf(Math.max.apply(null, v))];
      var names = { ep: "the endpointing wait", asr: "ASR", llm: "the LLM's first token", tts: "TTS first audio", net: "the network" };
      readout.textContent = "First audio after " + fmt(total) + " ms · " + (Math.round(total / 20) / 10) + "× a 200 ms human gap · biggest stage: " + names[big] +
        " · GPT-4o reported ≈320 ms average, Moshi ≈200 ms (end-to-end models, no stages)";
    }

    KEYS.forEach(function (k) { ins[k].addEventListener("input", draw); });
    root.addEventListener("click", function (e) {
      var c = e.target.closest("button[data-p]"); if (!c) return;
      c.dataset.p.split(",").forEach(function (x, i) { ins[KEYS[i]].value = x; });
      draw();
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
    var root = document.getElementById("a1-6-latency-playground");
    if (root) init(root);
  });
})();
