/* M3.5 playground: mark which of G = 8 sampled answers the verifier accepts and watch the
   group-relative advantages A_i = (r_i − mean) / (std + eps). The "divide by std" switch
   shows the Dr. GRPO variant (mean-centring only). Population std (divide by G). */
(function () {
  var LC = window.LC;
  var G = 8, EPS = 1e-4, AMAX = 2.8;

  function stats(r, useStd) {
    var m = r.reduce(function (a, b) { return a + b; }, 0) / r.length;
    var s = Math.sqrt(r.reduce(function (a, x) { return a + (x - m) * (x - m); }, 0) / r.length);
    var adv = r.map(function (x) { return useStd ? (x - m) / (s + EPS) : x - m; });
    return { mean: m, std: s, adv: adv };
  }
  function sgn(v) { return Math.abs(v) < 0.005 ? "0.00" : (v > 0 ? "+" : "−") + Math.abs(v).toFixed(2); }

  function init(root) {
    var stage = root.querySelector(".pg-stage");
    var toggles = root.querySelector(".grpo-toggles");
    var stdChip = root.querySelector("[data-act=std]");
    var readout = root.querySelector(".pg-readout");
    var r = [1, 0, 0, 1, 0, 0, 0, 0], useStd = true, layout = null;

    for (var i = 0; i < G; i++) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.dataset.i = i; b.style.minHeight = "44px";
      toggles.appendChild(b);
    }
    function syncChips() {
      toggles.querySelectorAll("button").forEach(function (b, i) {
        b.setAttribute("aria-pressed", String(!!r[i]));
        b.textContent = "#" + (i + 1) + (r[i] ? " ✓" : " ✗");
        b.setAttribute("aria-label", "Answer " + (i + 1) + ": " + (r[i] ? "correct" : "wrong") + ". Tap to toggle.");
      });
      stdChip.setAttribute("aria-pressed", String(useStd));
      stdChip.textContent = "Divide by std: " + (useStd ? "on" : "off");
    }

    function draw() {
      layout = stage.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact";
      var W = compact ? 360 : 640, H = 240, S = LC.svg;
      var st = stats(r, useStd);
      var svg = S("svg", { viewBox: "0 0 " + W + " " + H, role: "img",
        "aria-label": "Advantage per answer: " + st.adv.map(function (a, i) { return "#" + (i + 1) + " " + sgn(a); }).join(", ") });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "300px";
      var zeroY = 118, K = 66 / AMAX, left = compact ? 26 : 60, right = W - 10;
      var colW = (right - left) / G, bw = Math.min(30, colW * 0.55);
      S("text", { x: 4, y: 16, class: "t t-sm t-muted", text: "advantage of each answer" + (useStd ? "" : " (not divided by std)") }, svg);
      S("text", { x: left - 8, y: zeroY + 4, class: "t t-sm t-muted t-end", text: "0" }, svg);
      S("path", { d: "M" + left + " " + zeroY + "H" + right, class: "s-axis" }, svg);
      st.adv.forEach(function (a, i) {
        var x = left + colW * (i + 0.5), h = Math.abs(a) * K;
        if (h > 0.5) S("rect", { x: x - bw / 2, y: a > 0 ? zeroY - h : zeroY, width: bw, height: h, rx: 3, class: a > 0 ? "f-orange" : "f-blue" }, svg);
        var y = a > 0.005 ? zeroY - h - 7 : (a < -0.005 ? zeroY + h + 15 : zeroY - 7);
        S("text", { x: x, y: y, class: "t t-sm t-mono t-mid" + (a > 0.005 ? " t-orange" : a < -0.005 ? " t-blue" : " t-muted"), text: compact ? sgn(a).replace(/^([+−])0\./, "$1.") : sgn(a) }, svg);
        S("text", { x: x, y: 228, class: "t t-sm t-mid" + (r[i] ? " t-orange" : " t-muted"), text: "#" + (i + 1) + (r[i] ? "✓" : "✗") }, svg);
      });
      stage.innerHTML = ""; stage.appendChild(svg);

      var k = r.reduce(function (a, b) { return a + b; }, 0);
      var msg = k + " of " + G + " correct · mean " + st.mean.toFixed(2) + " · std " + st.std.toFixed(2) + ". ";
      if (k === 0 || k === G) msg += "Every answer got the same reward, so every advantage is 0: this prompt teaches the model nothing this step.";
      else msg += "Correct answers get " + sgn(st.adv[r.indexOf(1)]) + ", wrong ones " + sgn(st.adv[r.indexOf(0)]) + ". " +
        (useStd ? (k === 1 ? "A lone correct answer gets a big push: rare successes on hard prompts are amplified." : "Try 1 of 8 correct, then 7 of 8.")
                : "Without the std, the advantages sum to zero but keep the reward's scale.");
      readout.textContent = msg;
    }

    toggles.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      var i = +b.dataset.i; r[i] = r[i] ? 0 : 1; syncChips(); draw();
    });
    stdChip.addEventListener("click", function () { useStd = !useStd; syncChips(); draw(); });
    root.querySelectorAll("[data-preset]").forEach(function (b) {
      b.addEventListener("click", function () {
        var n = +b.dataset.preset;
        r = r.map(function (_, i) { return i < n ? 1 : 0; });
        syncChips(); draw();
      });
    });

    syncChips(); draw();
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        var want = stage.clientWidth < 560 ? "compact" : "wide";
        if (want !== layout) draw();
      }).observe(stage);
    }
  }

  document.addEventListener("lc:ready", function () {
    var root = document.getElementById("grpo-playground");
    if (root) init(root);
  });
})();
