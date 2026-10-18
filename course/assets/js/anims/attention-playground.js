/* M1.1 playground: pick a query token, see its attention weights, and see what
   happens to softmax when scores are NOT divided by sqrt(d_k).
   Model: the "unit" scores in LC.attnData are q·k/sqrt(d_k). Without scaling, a raw
   dot product of d_k-dimensional vectors is about sqrt(d_k) times bigger. */
(function () {
  var LC = window.LC;
  var DKS = [4, 16, 64, 256, 1024];

  function init(box) {
    var D = LC.attnData; if (!D) return;
    var toks = D.toks, q = toks.length - 1, scaled = true, dk = 2;
    box.insertAdjacentHTML("beforeend",
      '<div class="chips" role="group" aria-label="Query token"></div>' +
      '<div class="pg-stage" style="margin-top:12px"></div>' +
      '<div class="pg-controls">' +
        '<label><span>Key/query size $d_k$ = <b class="dk-val"></b></span><input type="range" min="0" max="' + (DKS.length - 1) + '" step="1" value="2" aria-label="Key and query size"></label>' +
        '<div class="pg-buttons"><button type="button" class="chip scale-chip" aria-pressed="true">Divide by √dₖ: on</button></div>' +
      '</div>' +
      '<p class="pg-readout" aria-live="polite"></p>');
    var chips = box.querySelector(".chips"), stage = box.querySelector(".pg-stage");
    var slider = box.querySelector("input[type=range]"), dkVal = box.querySelector(".dk-val");
    var scaleChip = box.querySelector(".scale-chip"), readout = box.querySelector(".pg-readout");
    toks.forEach(function (t, i) {
      var b = LC.el('<button type="button" class="chip" aria-pressed="' + (i === q) + '">' + LC.escape(t) + "</button>");
      b.addEventListener("click", function () { q = i; chips.querySelectorAll(".chip").forEach(function (c, j) { c.setAttribute("aria-pressed", String(j === q)); }); draw(); });
      chips.appendChild(b);
    });
    slider.addEventListener("input", function () { dk = +slider.value; draw(); });
    scaleChip.addEventListener("click", function () { scaled = !scaled; scaleChip.setAttribute("aria-pressed", String(scaled)); scaleChip.textContent = "Divide by √dₖ: " + (scaled ? "on" : "off"); draw(); });

    function draw() {
      var d = DKS[dk];
      dkVal.textContent = d;
      var unit = D.rows[q];
      var factor = scaled ? 1 : Math.sqrt(d);
      var w = D.softmax(unit.map(function (s) { return s * factor; }));
      var W = Math.max(280, Math.round(stage.clientWidth || 320));
      var rowH = 34, labW = 54, valW = 52, trackW = W - labW - valW - 8;
      var svg = LC.svg("svg", { viewBox: "0 0 " + W + " " + (toks.length * rowH + 4), width: "100%", role: "img",
        "aria-label": "Attention weights for query " + toks[q] + ": " + toks.map(function (t, j) { return t + " " + (j <= q ? w[j].toFixed(2) : "masked"); }).join(", ") });
      toks.forEach(function (t, j) {
        var y = j * rowH + 4;
        LC.svg("text", { x: labW - 8, y: y + 19, class: "t t-end", "font-weight": j === q ? 650 : 400, text: t }, svg);
        LC.svg("rect", { x: labW, y: y + 5, width: trackW, height: 20, rx: 5, class: "f-surface2" }, svg);
        if (j <= q) {
          LC.svg("rect", { x: labW, y: y + 5, width: Math.max(2, trackW * w[j]), height: 20, rx: 5, class: w[j] === Math.max.apply(null, w) ? "f-orange" : "f-blue" }, svg);
          LC.svg("text", { x: W - 4, y: y + 19, class: "t t-mono t-end", text: w[j].toFixed(2) }, svg);
        } else {
          LC.svg("text", { x: labW + 8, y: y + 19, class: "t t-sm t-muted", text: "future (masked)" }, svg);
        }
      });
      stage.innerHTML = ""; stage.appendChild(svg);
      var max = Math.max.apply(null, w);
      var ent = -w.reduce(function (a, p) { return a + (p > 0 ? p * Math.log2(p) : 0); }, 0);
      var msg = "Top weight " + max.toFixed(2) + " · entropy " + ent.toFixed(2) + " bits. ";
      if (q === 0) msg += "The first token can only attend to itself.";
      else if (max > 0.97) msg += "Saturated: softmax is nearly one-hot, so gradients to the other tokens almost vanish.";
      else if (!scaled) msg += "Raw dot products grow like √dₖ. Try a bigger dₖ and watch it saturate.";
      else msg += "Scaled: the spread of scores stays about the same for any dₖ.";
      readout.textContent = msg;
    }
    if (LC.renderMath) LC.renderMath(box);
    draw();
    if ("ResizeObserver" in window) {
      var lw = 0;
      new ResizeObserver(function () { var cw = stage.clientWidth; if (Math.abs(cw - lw) > 4) { lw = cw; draw(); } }).observe(stage);
    }
  }

  document.addEventListener("lc:ready", function () {
    document.querySelectorAll("[data-attn-playground]").forEach(init);
  });
})();
