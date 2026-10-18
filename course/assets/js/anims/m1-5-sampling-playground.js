/* M1.5 playground: temperature, top-k and top-p (nucleus) sampling on one fixed set of
   next-token logits after "I sat by the river". Order, as in common libraries:
   divide logits by T → softmax → keep top-k → keep the smallest top-p nucleus → renormalize.
   Logits are illustrative. */
(function () {
  var LC = window.LC;
  var TOK = ["bank", "side", "and", "for", "in", "watching", "all", "quietly"];
  var LOGIT = [3.0, 2.2, 1.8, 1.4, 1.0, 0.6, 0.2, -0.2];
  var PRESETS = [
    { lbl: "Greedy", T: 1, k: 1, p: 1 },
    { lbl: "T 0.7 · top-p 0.9", T: 0.7, k: 8, p: 0.9 },
    { lbl: "Plain T = 1", T: 1, k: 8, p: 1 },
    { lbl: "Hot T = 1.8", T: 1.8, k: 8, p: 1 }
  ];

  function dist(T, k, p) {
    var z = LOGIT.map(function (l) { return l / T; });
    var m = Math.max.apply(null, z), e = z.map(function (v) { return Math.exp(v - m); });
    var s = e.reduce(function (a, b) { return a + b; }, 0);
    var raw = e.map(function (v) { return v / s; });
    var order = raw.map(function (_, i) { return i; }).sort(function (a, b) { return raw[b] - raw[a]; });
    var keep = raw.map(function () { return false; }), cum = 0;
    for (var r = 0; r < order.length; r++) {
      var i = order[r];
      if (r >= k) break;
      keep[i] = true; cum += raw[i];
      if (cum >= p - 1e-9) break;
    }
    var ks = raw.reduce(function (a, v, i) { return a + (keep[i] ? v : 0); }, 0);
    return { raw: raw, keep: keep, fin: raw.map(function (v, i) { return keep[i] ? v / ks : 0; }) };
  }

  function init(box) {
    var T = 1, k = 8, p = 1, samples = [];
    box.insertAdjacentHTML("beforeend",
      '<div class="chips" role="group" aria-label="Presets"></div>' +
      '<div class="pg-stage" style="margin-top:12px"></div>' +
      '<div class="pg-controls">' +
        '<div style="display:grid;gap:4px">' +
          '<label><span>Temperature T = <output class="t-out"></output></span><input type="range" class="t-in" min="0.1" max="2" step="0.05" value="1"></label>' +
          '<label><span>Top-k = <output class="k-out"></output></span><input type="range" class="k-in" min="1" max="8" step="1" value="8"></label>' +
          '<label><span>Top-p = <output class="p-out"></output></span><input type="range" class="p-in" min="0.05" max="1" step="0.05" value="1"></label>' +
        '</div>' +
        '<div class="pg-buttons"><button type="button" class="btn btn-primary" data-act="one">Sample 1</button><button type="button" class="btn" data-act="many">Sample 20</button><button type="button" class="btn btn-ghost" data-act="clear">Clear</button></div>' +
      '</div>' +
      '<p class="pg-readout" aria-live="polite"></p>' +
      '<p class="pg-readout pg-samples" style="margin-top:4px"></p>');
    var chips = box.querySelector(".chips"), stage = box.querySelector(".pg-stage");
    var tIn = box.querySelector(".t-in"), kIn = box.querySelector(".k-in"), pIn = box.querySelector(".p-in");
    var tOut = box.querySelector(".t-out"), kOut = box.querySelector(".k-out"), pOut = box.querySelector(".p-out");
    var readout = box.querySelector(".pg-readout"), sampOut = box.querySelector(".pg-samples");
    PRESETS.forEach(function (pr) {
      var b = LC.el('<button type="button" class="chip" aria-pressed="false">' + LC.escape(pr.lbl) + "</button>");
      b.addEventListener("click", function () {
        T = pr.T; k = pr.k; p = pr.p; tIn.value = T; kIn.value = k; pIn.value = p; samples = [];
        chips.querySelectorAll(".chip").forEach(function (c) { c.setAttribute("aria-pressed", String(c === b)); });
        draw();
      });
      chips.appendChild(b);
    });
    function unpress() { chips.querySelectorAll(".chip").forEach(function (c) { c.setAttribute("aria-pressed", "false"); }); }
    tIn.addEventListener("input", function () { T = +tIn.value; unpress(); draw(); });
    kIn.addEventListener("input", function () { k = +kIn.value; unpress(); draw(); });
    pIn.addEventListener("input", function () { p = +pIn.value; unpress(); draw(); });
    function sample(n) {
      var d = dist(T, k, p);
      for (var j = 0; j < n; j++) {
        var u = Math.random(), c = 0, pick = 0;
        for (var i = 0; i < d.fin.length; i++) { c += d.fin[i]; if (u < c) { pick = i; break; } pick = i; }
        while (!d.keep[pick]) pick--; // guard against rounding at the very end
        samples.push(TOK[pick]);
      }
      samples = samples.slice(-30);
      draw();
    }
    box.querySelector('[data-act="one"]').addEventListener("click", function () { sample(1); });
    box.querySelector('[data-act="many"]').addEventListener("click", function () { sample(20); });
    box.querySelector('[data-act="clear"]').addEventListener("click", function () { samples = []; draw(); });

    function draw() {
      tOut.textContent = T.toFixed(2); kOut.textContent = k === 8 ? "8 (off)" : k; pOut.textContent = p >= 1 ? "1.00 (off)" : p.toFixed(2);
      var d = dist(T, k, p);
      var W = Math.max(300, Math.round(stage.clientWidth || 320));
      var compact = W < 560;
      var rowH = 30, labW = compact ? 76 : 96, valW = compact ? 44 : 56, trackW = W - labW - valW - 6;
      var S = LC.svg;
      var svg = S("svg", { viewBox: "0 0 " + W + " " + (TOK.length * rowH + 4), width: "100%", role: "img",
        "aria-label": "Next-token probabilities: " + TOK.map(function (t, i) { return t + " " + (d.keep[i] ? d.fin[i].toFixed(2) : "cut"); }).join(", ") });
      svg.style.display = "block";
      var maxFin = Math.max.apply(null, d.fin);
      TOK.forEach(function (t, i) {
        var y = i * rowH + 4;
        S("text", { x: labW - 8, y: y + 19, class: "t t-end" + (compact ? " t-sm" : ""), text: t, "font-weight": i === 0 ? 600 : 400, style: d.keep[i] ? "" : "opacity:.45" }, svg);
        S("rect", { x: labW, y: y + 5, width: trackW, height: 20, rx: 5, class: "f-surface2" }, svg);
        // ghost: the probability before top-k / top-p filtering
        S("rect", { x: labW, y: y + 5, width: Math.max(1.5, trackW * d.raw[i]), height: 20, rx: 5, class: "f-faint" }, svg);
        if (d.keep[i]) {
          S("rect", { x: labW, y: y + 5, width: Math.max(2, trackW * d.fin[i]), height: 20, rx: 5, class: d.fin[i] === maxFin ? "f-orange" : "f-blue" }, svg);
          S("text", { x: W - 4, y: y + 19, class: "t t-mono t-end" + (compact ? " t-sm" : ""), text: d.fin[i].toFixed(2) }, svg);
        } else {
          S("text", { x: W - 4, y: y + 19, class: "t t-sm t-muted t-end", text: "cut" }, svg);
        }
      });
      stage.innerHTML = ""; stage.appendChild(svg);
      var kept = d.keep.filter(Boolean).length;
      var ent = -d.fin.reduce(function (a, q) { return a + (q > 0 ? q * Math.log2(q) : 0); }, 0);
      readout.textContent = "kept " + kept + " of " + TOK.length + " tokens · top probability " + maxFin.toFixed(2) + " · entropy " + ent.toFixed(2) + " bits";
      sampOut.textContent = samples.length ? "samples: " + samples.join(" ") : "Press Sample to draw tokens from the blue/orange bars (grey = before filtering).";
    }
    draw();
    if ("ResizeObserver" in window) {
      var lw = 0;
      new ResizeObserver(function () { var w = stage.clientWidth; if (Math.abs(w - lw) > 4) { lw = w; draw(); } }).observe(stage);
    }
  }

  document.addEventListener("lc:ready", function () {
    document.querySelectorAll("[data-sampling-playground]").forEach(init);
  });
})();
