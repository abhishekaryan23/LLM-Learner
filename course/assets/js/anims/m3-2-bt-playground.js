/* M3.2 playground: Bradley–Terry loss for one preference pair.
   P(chosen > rejected) = sigma(d), d = r_chosen - r_rejected,
   loss = -log sigma(d), d loss / d r_chosen = -(1 - sigma(d)) = -d loss / d r_rejected. */
(function () {
  var LC = window.LC;
  function sig(x) { return 1 / (1 + Math.exp(-x)); }
  function f(v, k) { var t = v.toFixed(k); return t.charAt(0) === "-" ? "−" + t.slice(1) : t; }
  function nll(d) { return Math.log1p(Math.exp(-d)); }
  var D0 = -6, D1 = 6, Y1 = 6;

  function init(root) {
    var stage = root.querySelector(".pg-stage");
    var sc = root.querySelector('[data-r="c"]'), sr = root.querySelector('[data-r="r"]');
    var oc = root.querySelector('[data-out="c"]'), or = root.querySelector('[data-out="r"]');
    var readout = root.querySelector(".pg-readout"), hint = root.querySelector(".pg-hint");
    var layout = null, svg, parts = {}, shifted = false;

    function build() {
      layout = stage.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact";
      var W = compact ? 360 : 640, H = compact ? 250 : 240;
      var m = compact ? { l: 34, r: 14 } : { l: 44, r: 20 };
      var pt = 96, pb = H - 40;
      var sx = function (d) { return m.l + (d - D0) / (D1 - D0) * (W - m.l - m.r); };
      var sy = function (v) { return pb - Math.min(v, Y1) / Y1 * (pb - pt); };
      if (svg) svg.remove();
      var S = LC.svg;
      svg = S("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Top: a bar showing the probability that the chosen response beats the rejected one. Bottom: the loss minus log sigma of the reward difference, with the current pair marked. The readout below gives the values." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "360px";
      stage.appendChild(svg);
      // probability bar
      S("text", { x: m.l, y: 16, class: "t t-sm t-muted", text: "P(chosen beats rejected) = σ(Δ)" }, svg);
      var trackW = W - m.l - m.r - 52;
      S("rect", { x: m.l, y: 26, width: trackW, height: 18, rx: 5, class: "f-surface2" }, svg);
      S("line", { x1: m.l + trackW / 2, x2: m.l + trackW / 2, y1: 22, y2: 48, class: "s-grid" }, svg);
      parts.bar = S("rect", { x: m.l, y: 26, width: 0, height: 18, rx: 5, class: "f-blue" }, svg);
      parts.pTxt = S("text", { x: W - m.r, y: 40, class: "t t-mono t-end", text: "" }, svg);
      // loss plot
      S("text", { x: 4, y: pt - 18, class: "t t-sm t-muted", text: "↑ loss = −log σ(Δ)" }, svg);
      [3, 6].forEach(function (v) { S("line", { x1: m.l, x2: W - m.r, y1: sy(v), y2: sy(v), class: "s-grid" }, svg); });
      S("path", { d: "M" + m.l + " " + pt + "V" + pb + "H" + (W - m.r), class: "s-axis" }, svg);
      [0, 3, 6].forEach(function (v) { S("text", { x: m.l - 6, y: sy(v) + 4, class: "t t-sm t-muted t-end", text: v }, svg); });
      [-6, -3, 0, 3, 6].forEach(function (d) { S("text", { x: sx(d), y: pb + 16, class: "t t-sm t-muted t-mid", text: (d < 0 ? "−" + (-d) : d) }, svg); });
      S("text", { x: W - m.r, y: H - 4, class: "t t-sm t-muted t-end", text: "Δ = r_chosen − r_rejected →" }, svg);
      S("path", { d: LC.fnPath(nll, D0, D1, sx, sy, 80), class: "s-blue" }, svg);
      parts.guide = S("path", { d: "", class: "s-orange", "stroke-width": 1.5, "stroke-dasharray": "4 4" }, svg);
      parts.dot = S("circle", { r: 7, class: "f-orange", stroke: "var(--a-ink)", "stroke-width": 1.5 }, svg);
      parts.sx = sx; parts.sy = sy; parts.trackW = trackW; parts.pb = pb;
      draw();
    }

    function draw() {
      var rc = parseFloat(sc.value), rr = parseFloat(sr.value), d = rc - rr, p = sig(d), L = nll(d);
      oc.textContent = f(rc, 1); or.textContent = f(rr, 1);
      parts.bar.setAttribute("width", Math.max(2, p * parts.trackW));
      parts.pTxt.textContent = p.toFixed(2);
      var x = parts.sx(d), y = parts.sy(L);
      parts.guide.setAttribute("d", "M" + x + " " + parts.pb + "V" + y);
      parts.dot.setAttribute("cx", x); parts.dot.setAttribute("cy", y);
      readout.textContent = "Δ = " + f(d, 1) + " · P = " + p.toFixed(2) + " · loss = " + L.toFixed(2) +
        " · ∂loss/∂r_chosen = " + f(-(1 - p), 2);
      var msg;
      if (shifted) msg = "You moved both rewards by the same amount and nothing changed: Bradley–Terry only sees the difference. That's why reward models are often normalized afterwards.";
      else if (d < -0.5) msg = "The reward model disagrees with the person: big loss, and a big push (gradient magnitude well above 0.5, approaching 1 as Δ gets more negative) to fix it.";
      else if (d <= 0.5) msg = "Unsure: P is near 0.5, the loss is near log 2 ≈ 0.69, and the gradient is about 0.5.";
      else if (d < 3) msg = "Agrees with the person: the loss and the push are getting small.";
      else msg = "Confidently agrees: almost no loss and almost no gradient, so this pair barely changes the model any more.";
      hint.textContent = msg;
    }

    function onInput() { shifted = false; root.querySelectorAll("[data-preset]").forEach(function (c) { c.setAttribute("aria-pressed", "false"); }); draw(); }
    sc.addEventListener("input", onInput);
    sr.addEventListener("input", onInput);
    root.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.preset) {
        var v = b.dataset.preset.split(",");
        sc.value = v[0]; sr.value = v[1]; shifted = false;
        root.querySelectorAll("[data-preset]").forEach(function (c) { c.setAttribute("aria-pressed", String(c === b)); });
        draw();
      } else if (b.dataset.act === "shift") {
        var a = parseFloat(sc.value), c = parseFloat(sr.value);
        var up = Math.max(a, c) <= 2 ? 1 : (Math.min(a, c) >= -2 ? -1 : 0);
        if (!up) { hint.textContent = "The rewards are too far apart to shift both inside the slider range. Bring them closer first."; return; }
        sc.value = (parseFloat(sc.value) + up).toFixed(1); sr.value = (parseFloat(sr.value) + up).toFixed(1);
        shifted = true; draw();
      }
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
    var root = document.getElementById("bt-playground");
    if (root) init(root);
  });
})();
