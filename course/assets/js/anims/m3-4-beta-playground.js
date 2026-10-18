/* M3.4 playground: the DPO loss -log sigma(beta * m) as a function of the
   log-ratio margin m = [log pi(y_w) - log pi_ref(y_w)] - [log pi(y_l) - log pi_ref(y_l)],
   for a choice of beta. Loss < 0.1 needs beta * m > logit(e^-0.1) = 2.25. */
(function () {
  var LC = window.LC;
  var BETAS = [0.01, 0.05, 0.1, 0.2, 0.5, 1];
  var M0 = -20, M1 = 20, Y1 = 3;
  var NEED = Math.log(Math.exp(-0.1) / (1 - Math.exp(-0.1))); // 2.252
  function nll(z) { return Math.log1p(Math.exp(-z)); }
  function sig(z) { return 1 / (1 + Math.exp(-z)); }
  function f(v, k) { var t = v.toFixed(k); return t.charAt(0) === "-" ? "−" + t.slice(1) : t; }
  var uid = 0;

  function init(root) {
    var stage = root.querySelector(".pg-stage");
    var bS = root.querySelector('[data-k="beta"]'), mS = root.querySelector('[data-k="m"]');
    var bO = root.querySelector('[data-o="beta"]'), mO = root.querySelector('[data-o="m"]');
    var readout = root.querySelector(".pg-readout"), hint = root.querySelector(".pg-hint");
    var layout = null, svg, P = {};

    function build() {
      layout = stage.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact";
      var W = compact ? 360 : 640, H = compact ? 236 : 230;
      var m = compact ? { l: 30, r: 14, t: 34, b: 40 } : { l: 40, r: 20, t: 34, b: 40 };
      var sx = function (v) { return m.l + (v - M0) / (M1 - M0) * (W - m.l - m.r); };
      var sy = function (v) { return H - m.b - v / Y1 * (H - m.t - m.b); };
      if (svg) svg.remove();
      var S = LC.svg, id = "dpoclip" + (++uid);
      svg = S("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "DPO loss as a function of the log-ratio margin, for the chosen beta (blue) and the other betas (grey). The readout below gives the values." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "340px";
      stage.appendChild(svg);
      var cp = S("clipPath", { id: id }, S("defs", {}, svg));
      S("rect", { x: m.l, y: m.t - 4, width: W - m.l - m.r, height: H - m.t - m.b + 4 }, cp);
      S("text", { x: 4, y: 16, class: "t t-sm t-muted", text: "↑ loss = −log σ(β·m)" }, svg);
      [1, 2, 3].forEach(function (v) { S("line", { x1: m.l, x2: W - m.r, y1: sy(v), y2: sy(v), class: "s-grid" }, svg); });
      S("line", { x1: sx(0), x2: sx(0), y1: m.t, y2: sy(0), class: "s-grid" }, svg);
      S("path", { d: "M" + m.l + " " + m.t + "V" + sy(0) + "H" + (W - m.r), class: "s-axis" }, svg);
      [0, 1, 2, 3].forEach(function (v) { S("text", { x: m.l - 6, y: sy(v) + 4, class: "t t-sm t-muted t-end", text: v }, svg); });
      [-10, 0, 10, 20].forEach(function (v) { S("text", { x: sx(v), y: sy(0) + 16, class: "t t-sm t-muted t-mid", text: f(v, 0) }, svg); });
      S("text", { x: W - m.r, y: H - 4, class: "t t-sm t-muted t-end", text: compact ? "log-ratio margin m →" : "log-ratio margin m (chosen minus rejected, in nats) →" }, svg);
      var g = S("g", { "clip-path": "url(#" + id + ")" }, svg);
      P.others = BETAS.map(function (b) {
        return S("path", { d: LC.fnPath(function (x) { return Math.min(nll(b * x), Y1 + 1); }, M0, M1, sx, sy, 160), class: "s-faint", "stroke-width": 1.5 }, g);
      });
      P.cur = S("path", { d: "", class: "s-blue" }, g);
      P.guide = S("path", { d: "", class: "s-orange", "stroke-width": 1.5, "stroke-dasharray": "4 4" }, svg);
      P.dot = S("circle", { r: 7, class: "f-orange", stroke: "var(--a-ink)", "stroke-width": 1.5 }, svg);
      P.sx = sx; P.sy = sy; P.y0 = sy(0);
      draw();
    }

    function draw() {
      var b = BETAS[+bS.value], mm = parseFloat(mS.value);
      bO.textContent = b; mO.textContent = f(mm, 1);
      P.others.forEach(function (p, i) { p.style.opacity = BETAS[i] === b ? 0 : 1; });
      P.cur.setAttribute("d", LC.fnPath(function (x) { return Math.min(nll(b * x), Y1 + 1); }, M0, M1, P.sx, P.sy, 160));
      var L = nll(b * mm), x = P.sx(mm), y = P.sy(Math.min(L, Y1));
      P.guide.setAttribute("d", "M" + x + " " + P.y0 + "V" + y);
      P.dot.setAttribute("cx", x); P.dot.setAttribute("cy", y);
      P.dot.style.opacity = L > Y1 ? 0.4 : 1;
      readout.textContent = "β = " + b + " · m = " + f(mm, 1) + " · reward margin β·m = " + f(b * mm, 2) +
        " · loss = " + L.toFixed(2) + " · push weight σ(−β·m) = " + sig(-b * mm).toFixed(2);
      var need = NEED / b;
      hint.textContent = "To push this pair's loss below 0.1, the policy's log-ratio margin must reach about " +
        (need >= 100 ? Math.round(need) : need.toFixed(1)) + " nats. " +
        (b <= 0.05 ? "Small β: the loss barely reacts, so the policy has to move far from the reference before it is satisfied."
          : b >= 0.5 ? "Large β: a small move already satisfies the pair, so the policy stays close to the reference."
          : "β around 0.1 is the common default from the DPO paper.");
    }

    bS.addEventListener("input", draw);
    mS.addEventListener("input", draw);
    build();
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        var want = stage.clientWidth < 560 ? "compact" : "wide";
        if (want !== layout) build();
      }).observe(stage);
    }
  }

  document.addEventListener("lc:ready", function () {
    var root = document.getElementById("beta-playground");
    if (root) init(root);
  });
})();
