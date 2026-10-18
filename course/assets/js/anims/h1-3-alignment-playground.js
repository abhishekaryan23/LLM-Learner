/* H1.3 playground: tap a word of the French translation to see where attention looks
   in the English source. The weights are illustrative, shaped like the alignments in
   Bahdanau, Cho & Bengio (2014), Fig. 3 (same sentence pair). "One vector" mode shows
   the 2014 seq2seq bottleneck: every output word sees the same single summary. */
(function () {
  var LC = window.LC;
  var SRC = ["The", "agreement", "on", "the", "European", "Economic", "Area", "was", "signed", "in", "August", "1992", "."];
  var TGT = ["L'", "accord", "sur", "la", "zone", "économique", "européenne", "a", "été", "signé", "en", "août", "1992", "."];
  var MAIN = [
    [[0, 0.80], [1, 0.12]], [[1, 0.85], [0, 0.06]], [[2, 0.82], [3, 0.08]], [[3, 0.70], [4, 0.12], [6, 0.08]],
    [[6, 0.74], [5, 0.10], [4, 0.06]], [[5, 0.80], [6, 0.08], [4, 0.06]], [[4, 0.82], [5, 0.08]],
    [[7, 0.78], [8, 0.10]], [[7, 0.55], [8, 0.35]], [[8, 0.86], [7, 0.06]], [[9, 0.84], [10, 0.08]],
    [[10, 0.88], [9, 0.05]], [[11, 0.90]], [[12, 0.92]]
  ];
  var WTS = MAIN.map(function (m) {
    var w = SRC.map(function () { return 0; }), used = 0;
    m.forEach(function (p) { w[p[0]] = p[1]; used += p[1]; });
    var rest = SRC.length - m.length;
    return w.map(function (v) { return v || (1 - used) / rest; });
  });

  function init(root) {
    var stageBox = root.querySelector(".pg-stage");
    var wordsBox = root.querySelector(".h1-3-words");
    var readout = root.querySelector(".pg-readout");
    var hint = root.querySelector(".pg-hint");
    var sel = 4, mode = "att", layout = null, svg, bars = [], vals = [], oneG;

    TGT.forEach(function (t, i) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.dataset.tgt = i; b.textContent = t;
      b.style.minHeight = "44px"; b.style.minWidth = "44px";
      b.setAttribute("aria-pressed", String(i === sel));
      wordsBox.appendChild(b);
    });

    function build() {
      layout = stageBox.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact", W = compact ? 360 : 640, rh = compact ? 22 : 21;
      var H = 14 + SRC.length * rh + 6, lx = compact ? 96 : 170, bx = lx + 10, bmax = compact ? 190 : 330;
      if (svg) svg.remove();
      var S = LC.svg;
      svg = S("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Attention weights over the 13 English source words for the selected French word. The readout below lists the largest ones." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "400px";
      stageBox.appendChild(svg);
      bars = []; vals = [];
      oneG = S("g", {}, svg);
      var boxX = bx + bmax - 40, boxY = 14 + SRC.length * rh / 2;
      SRC.forEach(function (w, j) {
        var y = 14 + j * rh;
        S("text", { x: lx, y: y + rh / 2 + 4, class: "t t-sm t-end", text: w }, svg);
        bars.push(S("rect", { x: bx, y: y + 3, width: 0, height: rh - 6, rx: 3, class: "f-orange" }, svg));
        vals.push(S("text", { x: bx, y: y + rh / 2 + 4, class: "t t-sm t-mono t-muted", text: "" }, svg));
        S("line", { x1: bx + 4, y1: y + rh / 2, x2: boxX - 40, y2: boxY, class: "s-faint", "stroke-width": 1.2 }, oneG);
      });
      S("rect", { x: boxX - 40, y: boxY - 15, width: 80, height: 30, rx: 6, class: "f-ink" }, oneG);
      S("text", { x: boxX, y: boxY + 4, class: "t t-sm t-mid t-nohalo", style: "fill:var(--a-paper)", text: "1 vector" }, oneG);
      svg._bmax = bmax; svg._bx = bx;
      draw();
    }

    function draw() {
      var w = WTS[sel], att = mode === "att";
      oneG.style.display = att ? "none" : "";
      bars.forEach(function (b, j) {
        b.setAttribute("width", att ? Math.max(1, w[j] * svg._bmax).toFixed(1) : 0);
        vals[j].setAttribute("x", (svg._bx + (att ? w[j] * svg._bmax : 0) + 6).toFixed(1));
        vals[j].textContent = att ? w[j].toFixed(2) : "";
      });
      wordsBox.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(+b.dataset.tgt === sel)); });
      root.querySelectorAll("[data-mode]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.mode === mode)); });
      if (att) {
        var top = w.map(function (v, j) { return [v, j]; }).sort(function (a, b) { return b[0] - a[0]; }).slice(0, 3);
        readout.textContent = "“" + TGT[sel] + "” looks at: " + top.map(function (p) { return SRC[p[1]] + " " + p[0].toFixed(2); }).join(" · ");
        hint.textContent = sel >= 4 && sel <= 6
          ? "Notice the order: “zone économique européenne” reverses “European Economic Area”, and attention follows."
          : "Weights are positive and sum to 1 across the 13 English words (illustrative values).";
      } else {
        readout.textContent = "“" + TGT[sel] + "” sees: the same single summary vector as every other word";
        hint.textContent = "2014 seq2seq: the whole sentence is squeezed into one vector before any French is written. Long sentences lose detail.";
      }
    }

    root.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b || !root.contains(b)) return;
      if (b.dataset.tgt != null) { sel = +b.dataset.tgt; draw(); }
      else if (b.dataset.mode) { mode = b.dataset.mode; draw(); }
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
    var root = document.getElementById("h1-3-playground");
    if (root) init(root);
  });
})();
