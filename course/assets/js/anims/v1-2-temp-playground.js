/* V1.2 playground: a 4 × 4 CLIP similarity matrix. Drag the temperature and watch
   the row (image → text) or column (text → image) softmaxes sharpen or flatten.
   "One mix-up" makes the cat image slightly closer to "a dog" than to "a cat": then
   a very low temperature is punished, and the loss is lowest at a middle value
   (about tau = 0.03 for these numbers, checked in Python). */
(function () {
  var LC = window.LC;
  var MIX = [[0.31, 0.24, 0.12, 0.15], [0.30, 0.26, 0.11, 0.14], [0.10, 0.09, 0.33, 0.13], [0.14, 0.12, 0.15, 0.28]];

  function tauOf(v) { return Math.pow(10, -2 + 2 * v / 100); }

  function init(box) {
    var D = LC.clipData; if (!D) return;
    box.insertAdjacentHTML("beforeend",
      '<div class="chips" role="group" aria-label="Which batch" style="margin-top:8px">' +
        '<button type="button" class="chip" data-batch="clean" aria-pressed="true">Clean batch</button>' +
        '<button type="button" class="chip" data-batch="mix" aria-pressed="false">One mix-up</button></div>' +
      '<div class="pg-stage" style="margin-top:10px"></div>' +
      '<div class="pg-controls">' +
        '<label><span>Temperature τ = <output>0.07</output></span>' +
        '<input type="range" min="0" max="100" step="1" value="42" aria-label="Temperature, from 0.01 to 1 on a log scale"></label>' +
        '<div class="chips" role="group" aria-label="Softmax direction">' +
          '<button type="button" class="chip" data-dir="row" aria-pressed="true">Rows: image → text</button>' +
          '<button type="button" class="chip" data-dir="col" aria-pressed="false">Columns: text → image</button></div>' +
      '</div>' +
      '<p class="pg-readout" aria-live="polite"></p>' +
      '<p class="pg-hint" style="margin:4px 0 0"></p>');
    var stage = box.querySelector(".pg-stage"), slider = box.querySelector("input[type=range]");
    var out = box.querySelector("output"), readout = box.querySelector(".pg-readout"), hint = box.querySelector(".pg-hint");
    var batch = "clean", dir = "row", layout = null, svg, rects, texts, note;

    function build() {
      layout = stage.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact", S = LC.svg;
      var W = compact ? 360 : 640, cs = compact ? 56 : 60, cg = 4;
      var mx = compact ? 98 : 190, my = 34, icX = compact ? 40 : 150;
      var H = my + 4 * cs + 3 * cg + 30;
      if (svg) svg.remove();
      svg = S("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Four images (dog, cat, car, tree) as rows and four captions as columns. Each cell shows a softmax probability; the readout below lists the losses." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "380px";
      stage.appendChild(svg);
      function ccx(j) { return mx + j * (cs + cg) + cs / 2; }
      function rcy(i) { return my + i * (cs + cg) + cs / 2; }
      D.caps.forEach(function (c, j) { S("text", { x: ccx(j), y: 18, class: "t t-sm t-mid", text: "“" + c + "”" }, svg); });
      D.kinds.forEach(function (k, i) { D.icon(k, icX, rcy(i), compact ? 38 : 42, svg); });
      rects = []; texts = [];
      for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) {
        rects.push(S("rect", { x: ccx(j) - cs / 2, y: rcy(i) - cs / 2, width: cs, height: cs, rx: 6, class: "f-blue" }, svg));
        texts.push(S("text", { x: ccx(j), y: rcy(i) + 4.5, class: "t t-mono t-mid t-nohalo", "font-size": 12.5, text: "" }, svg));
      }
      [0, 1, 2, 3].forEach(function (i) {
        S("rect", { x: ccx(i) - cs / 2 - 2, y: rcy(i) - cs / 2 - 2, width: cs + 4, height: cs + 4, rx: 8, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 2.5 }, svg);
      });
      note = S("text", { x: mx + (4 * cs + 3 * cg) / 2, y: H - 8, class: "t t-sm t-muted t-mid", text: "" }, svg);
      draw();
    }

    function loss(P) { return -[0, 1, 2, 3].reduce(function (a, i) { return a + Math.log(Math.max(1e-12, P[i][i])); }, 0) / 4; }

    function draw() {
      var tau = tauOf(+slider.value), M = batch === "mix" ? MIX : D.sim;
      var R = D.rowsP(M, tau), C = D.colsP(M, tau), P = dir === "row" ? R : C;
      out.textContent = tau < 0.1 ? tau.toFixed(3) : tau.toFixed(2);
      for (var k = 0; k < 16; k++) {
        var p = P[Math.floor(k / 4)][k % 4], op = 0.06 + 0.92 * p;
        rects[k].setAttribute("fill-opacity", op.toFixed(3));
        texts[k].textContent = p.toFixed(2);
        texts[k].style.fill = op > 0.78 ? "var(--a-paper)" : "";
      }
      note.textContent = dir === "row" ? "each row sums to 1 (image → caption)" : "each column sums to 1 (caption → image)";
      var li = loss(R), lt = loss(C);
      readout.textContent = "τ = " + out.textContent + " (logit scale " + (1 / tau).toFixed(1) + ") · image→text loss " + li.toFixed(2) +
        " · text→image " + lt.toFixed(2) + " · CLIP loss " + ((li + lt) / 2).toFixed(2);
      var msg;
      if (tau > 0.4) msg = "High τ: every probability is close to 0.25. The model can barely tell the captions apart, so the loss is near ln 4 ≈ 1.39.";
      else if (batch === "mix" && tau < 0.02) msg = "Very low τ with a mix-up: the cat row confidently picks “a dog”, and cross-entropy punishes that hard. The loss is rising again.";
      else if (tau < 0.02) msg = "Very low τ: nearly one-hot. Every match here is right, so the loss is tiny; real batches always contain some mistakes.";
      else msg = batch === "mix" ? "Look at the cat row: “a dog” scores higher than “a cat”. For this batch the loss is lowest around τ ≈ 0.03." : "Lower τ sharpens each softmax. CLIP learns τ during training; it starts at 0.07.";
      hint.textContent = msg;
    }

    slider.addEventListener("input", draw);
    box.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b || !box.contains(b)) return;
      if (b.dataset.batch) { batch = b.dataset.batch; box.querySelectorAll("[data-batch]").forEach(function (c) { c.setAttribute("aria-pressed", String(c === b)); }); draw(); }
      if (b.dataset.dir) { dir = b.dataset.dir; box.querySelectorAll("[data-dir]").forEach(function (c) { c.setAttribute("aria-pressed", String(c === b)); }); draw(); }
    });
    build();
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        var want = stage.clientWidth < 560 ? "compact" : "wide";
        if (want !== layout) build();
      }).observe(stage);
    }
  }

  document.addEventListener("lc:ready", function () {
    document.querySelectorAll("[data-clip-playground]").forEach(init);
  });
})();
