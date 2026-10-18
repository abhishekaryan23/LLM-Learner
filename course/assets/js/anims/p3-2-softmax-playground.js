/* P3.2 playground: drag four logits and a temperature, watch softmax respond.
   p_i = exp(z_i / T) / sum_j exp(z_j / T), computed with the max subtracted (stable). */
(function () {
  var LC = window.LC;
  var TOK = ["mat", "floor", "sofa", "moon"];
  var START = [3.0, 1.5, 1.0, -1.0];

  function softmax(z, T) {
    var m = Math.max.apply(null, z), e = z.map(function (v) { return Math.exp((v - m) / T); });
    var s = e.reduce(function (a, b) { return a + b; }, 0);
    return e.map(function (v) { return v / s; });
  }
  function fmt(v) { return (v < 0 ? "−" : "") + Math.abs(v).toFixed(1); }

  function init(box) {
    var z = START.slice(), T = 1;
    var html = '<div class="pg-stage" style="margin-top:8px"></div>' +
      '<div class="sm-sliders" style="display:grid;gap:2px 18px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));margin-top:6px">';
    TOK.forEach(function (t, i) {
      html += '<label style="display:grid;gap:0;font-size:.93rem"><span>logit for “' + t + '” = <output data-z="' + i + '"></output></span>' +
        '<input type="range" min="-5" max="8" step="0.1" data-i="' + i + '" style="width:100%;height:44px;accent-color:var(--accent)"></label>';
    });
    html += '</div><div class="pg-controls">' +
      '<label><span>Temperature T = <output data-t></output></span><input type="range" min="0.1" max="4" step="0.05" value="1" data-temp></label>' +
      '<div class="pg-buttons"><button type="button" class="btn" data-act="shift">Add 1 to every logit</button>' +
      '<button type="button" class="btn btn-ghost" data-act="reset">Reset</button></div></div>' +
      '<p class="pg-readout" aria-live="polite"></p>';
    box.insertAdjacentHTML("beforeend", html);
    var stage = box.querySelector(".pg-stage"), readout = box.querySelector(".pg-readout");
    var sliders = box.querySelectorAll("input[data-i]"), tSlider = box.querySelector("input[data-temp]");
    var zOut = box.querySelectorAll("output[data-z]"), tOut = box.querySelector("output[data-t]");

    function sync() {
      sliders.forEach(function (s, i) { s.value = z[i]; zOut[i].textContent = fmt(z[i]); });
      tSlider.value = T; tOut.textContent = T.toFixed(2);
    }
    sliders.forEach(function (s) {
      s.addEventListener("input", function () { z[+s.dataset.i] = parseFloat(s.value); zOut[+s.dataset.i].textContent = fmt(z[+s.dataset.i]); draw(); });
    });
    tSlider.addEventListener("input", function () { T = parseFloat(tSlider.value); tOut.textContent = T.toFixed(2); draw(); });
    box.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.act === "shift") {
        if (Math.max.apply(null, z) + 1 > 8) { draw(); readout.textContent += " (A logit is already at the slider's top; lower it first.)"; return; }
        z = z.map(function (v) { return Math.round((v + 1) * 10) / 10; });
        sync(); draw(true);
      } else if (b.dataset.act === "reset") { z = START.slice(); T = 1; sync(); draw(); }
    });

    function draw(shifted) {
      var p = softmax(z, T);
      var Wd = Math.max(280, Math.round(stage.clientWidth || 320));
      var rowH = 38, labW = 54, valW = 50, trackW = Wd - labW - valW - 8;
      var top = Math.max.apply(null, p);
      var svg = LC.svg("svg", { viewBox: "0 0 " + Wd + " " + (TOK.length * rowH + 4), width: "100%", role: "img",
        "aria-label": "Softmax probabilities at temperature " + T.toFixed(2) + ": " + TOK.map(function (t, i) { return t + " " + p[i].toFixed(2); }).join(", ") });
      svg.style.display = "block";
      TOK.forEach(function (t, i) {
        var y = i * rowH + 4;
        LC.svg("text", { x: labW - 8, y: y + 21, class: "t t-end", "font-weight": p[i] === top ? 650 : 400, text: t }, svg);
        LC.svg("rect", { x: labW, y: y + 6, width: trackW, height: 22, rx: 5, class: "f-surface2" }, svg);
        LC.svg("rect", { x: labW, y: y + 6, width: Math.max(2, trackW * p[i]), height: 22, rx: 5, class: p[i] === top ? "f-orange" : "f-blue" }, svg);
        LC.svg("text", { x: Wd - 4, y: y + 21, class: "t t-mono t-end", text: p[i].toFixed(2) }, svg);
      });
      stage.innerHTML = ""; stage.appendChild(svg);
      var H = -p.reduce(function (a, q) { return a + (q > 0 ? q * Math.log2(q) : 0); }, 0);
      var sum = p.reduce(function (a, b) { return a + b; }, 0);
      var msg = "Σp = " + sum.toFixed(3) + " · top p = " + top.toFixed(2) + " · entropy " + H.toFixed(2) + " of max 2.00 bits. ";
      if (shifted) msg += "Every logit moved by the same amount, and the probabilities didn't change.";
      else if (T < 0.3) msg += "Low T: nearly one-hot, like always picking the top token (greedy).";
      else if (T > 2.5) msg += "High T: close to uniform, so unlikely tokens get picked often.";
      else msg += "Only the gaps between logits matter. Try “Add 1 to every logit”.";
      readout.textContent = msg;
    }
    sync(); draw();
    if ("ResizeObserver" in window) {
      var lw = 0;
      new ResizeObserver(function () { var cw = stage.clientWidth; if (Math.abs(cw - lw) > 4) { lw = cw; draw(); } }).observe(stage);
    }
  }

  document.addEventListener("lc:ready", function () {
    var box = document.getElementById("softmax-playground");
    if (box) init(box);
  });
})();
