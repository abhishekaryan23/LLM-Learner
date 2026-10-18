/* P4.2: the five-line PyTorch training loop, one line at a time.
   Numbers come from a real run (torch 2.x, CPU, seed 0): nn.Linear(1, 1) initialised to 0,
   fitting y = 2x + 1 + noise (64 points, batches of 8, SGD lr = 0.1, 5 epochs = 40 steps).
   Shown: the 2nd batch. */
(function () {
  var LC = window.LC;
  var LOSSES = [5.119, 2.9516, 1.1697, 1.4398, 2.3509, 0.4932, 0.2503, 0.2197, 0.1234, 0.0428, 0.0223, 0.0611, 0.0425, 0.0157, 0.0148, 0.0224, 0.0081, 0.0083, 0.0076, 0.0149, 0.0121, 0.0117, 0.0197, 0.0141, 0.0054, 0.0189, 0.0064, 0.0123, 0.0067, 0.0089, 0.0092, 0.0218, 0.0147, 0.0069, 0.0044, 0.0178, 0.0171, 0.0138, 0.0089, 0.0059];
  var BEFORE = { w: 0.3735, b: 0.2754 }, STALE = { w: -3.7345, b: -2.7545 }, GRAD = { w: -3.4228, b: -0.4917 };
  var AFTER = { w: 0.7157, b: 0.3246 }, FINAL = { w: 1.9994, b: 1.0037 };
  var CODE = [
    "for xb, yb in loader:",
    "    opt.zero_grad()",
    "    pred = model(xb)",
    "    loss = loss_fn(pred, yb)",
    "    loss.backward()",
    "    opt.step()"
  ];
  function f2(v) { return (v < 0 ? "−" : "") + Math.abs(v).toFixed(2); }

  LC.anims["p4-2-loop"] = {
    title: "The training loop, line by line",
    steps: [
      "Mid-training. The model is $\\hat y = w\\,x + b$ (an <code>nn.Linear(1, 1)</code>) and has taken one step already. The <code>loader</code> hands over the next <strong>batch</strong> of 8 $(x, y)$ pairs. The old gradients are still sitting in <code>.grad</code>.",
      "<code>opt.zero_grad()</code> clears them (in PyTorch 2.x it sets each <code>.grad</code> to <code>None</code>). Skip this and the new gradients would be <strong>added</strong> to the old ones.",
      "<strong>Forward pass:</strong> <code>model(xb)</code> computes a prediction for all 8 examples at once, shape (8, 1), recording the autograd graph as it goes.",
      "<code>loss_fn</code> (here <code>nn.MSELoss()</code>) squashes the batch into <strong>one number</strong>: 2.95.",
      "<code>loss.backward()</code> runs backprop and fills <code>.grad</code> for every parameter: $\\partial L/\\partial w = -3.42$, $\\partial L/\\partial b = -0.49$.",
      "<code>opt.step()</code> updates every parameter from its gradient. Plain SGD with lr $= 0.1$: $w \\leftarrow 0.37 - 0.1 \\times (-3.42) = 0.72$.",
      "Repeat for every batch, epoch after epoch. After 5 epochs (40 steps) the loss is near 0.01 and $w \\approx 2.00$, $b \\approx 1.00$: the line the data came from."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 486 } : { w: 640, h: 330 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var tl = gsap.timeline();

      // ---- code panel ----
      var C = { x: 6, y: compact ? 24 : 8, w: compact ? W - 12 : 330, lh: 21 };
      S("rect", { x: C.x, y: C.y, width: C.w, height: CODE.length * C.lh + 12, rx: 10, class: "f-surface2" }, svg);
      var hl = S("rect", { x: C.x + 4, y: C.y + 6, width: C.w - 8, height: C.lh, rx: 6, class: "f-orange", "fill-opacity": 0.22 }, svg);
      CODE.forEach(function (line, i) {
        S("text", { x: C.x + 10, y: C.y + 6 + i * C.lh + C.lh / 2 + 4, class: "t t-mono t-nohalo", "font-size": 12, text: line, style: "white-space:pre" }, svg);
      });
      function hlTo(i) { return tl.to(hl, { attr: { y: C.y + 6 + i * C.lh }, duration: 0.3 }); }

      // ---- status line (one text per step, cross-faded) ----
      var sy0 = C.y + CODE.length * C.lh + 34;
      function status(txt, cls) { var t = S("text", { x: 8, y: sy0, class: "t t-sm t-mono " + (cls || ""), text: txt }, svg); t.style.opacity = 0; return t; }
      var st0 = status("xb, yb: shape (8, 1) each", "t-muted"), st1 = status(".grad → None", "t-orange");
      var st2 = status("pred: shape (8, 1)", "t-blue"), st3 = status("loss = 2.95", "t-blue");
      var st4 = status("w.grad, b.grad filled in", "t-orange"), st5 = status("w −= lr·w.grad;  b −= lr·b.grad", "");
      var st6 = status("…40 steps later", "t-muted");
      st0.style.opacity = 1;
      function swap(a, b) { tl.to(a, { opacity: 0, duration: 0.2 }); tl.to(b, { opacity: 1, duration: 0.25 }); }

      // ---- parameter + gradient panels ----
      var py = sy0 + 26;
      var Pp = { x: 6, y: py }, Pg = { x: compact ? 184 : 176, y: py };
      var pw = compact ? 170 : 164;
      [Pp, Pg].forEach(function (p) { S("rect", { x: p.x, y: p.y, width: pw, height: 92, rx: 10, class: "f-none", stroke: "var(--line)", "stroke-width": 1 }, svg); });
      S("text", { x: Pp.x + 8, y: Pp.y + 20, class: "t t-sm t-muted", text: "parameters" }, svg);
      S("text", { x: Pg.x + 8, y: Pg.y + 20, class: "t t-sm t-muted", text: ".grad" }, svg);
      var rows = { w: Pp.y + 48, b: Pp.y + 76 };
      var pBar = {}, pVal = {}, gBar = {}, gVal = {};
      var barX0 = 24, barLen = compact ? 92 : 88;
      S("line", { x1: Pg.x + barX0 + barLen / 2, x2: Pg.x + barX0 + barLen / 2, y1: Pg.y + 32, y2: Pg.y + 86, class: "s-grid" }, svg);
      ["w", "b"].forEach(function (k) {
        S("text", { x: Pp.x + 10, y: rows[k] + 4, class: "t t-sm t-mono", text: k }, svg);
        pBar[k] = S("rect", { x: Pp.x + barX0, y: rows[k] - 7, height: 14, rx: 3, class: "f-blue", "fill-opacity": 0.8 }, svg);
        pVal[k] = S("text", { x: Pp.x + pw - 8, y: rows[k] + 4, class: "t t-sm t-mono t-end", text: "" }, svg);
        S("text", { x: Pg.x + 10, y: rows[k] + 4, class: "t t-sm t-mono", text: k }, svg);
        gBar[k] = S("rect", { y: rows[k] - 7, height: 14, rx: 3, class: "f-orange", "fill-opacity": 0.85 }, svg);
        gVal[k] = S("text", { x: Pg.x + pw - 8, y: rows[k] + 4, class: "t t-sm t-mono t-end t-orange", text: "" }, svg);
      });
      var st = { p: 0, g: 0, fin: 0 };
      // p: 0 = before step, 1 = after step; fin: 0..1 toward the final values
      // g: 0 = stale grads, 1 = None, 2 = new grads
      function render() {
        ["w", "b"].forEach(function (k) {
          var v = BEFORE[k] + (AFTER[k] - BEFORE[k]) * st.p;
          v = v + (FINAL[k] - v) * st.fin;
          pBar[k].setAttribute("width", Math.max(1, (v / 2.2) * barLen));
          pVal[k].textContent = v.toFixed(2);
          var gv = st.g <= 1 ? STALE[k] * (1 - st.g) : GRAD[k] * (st.g - 1);
          var c = Pg.x + barX0 + barLen / 2, len = (gv / 4) * (barLen / 2);
          gBar[k].setAttribute("x", Math.min(c, c + len)); gBar[k].setAttribute("width", Math.max(0.01, Math.abs(len)));
          gVal[k].textContent = Math.abs(st.g - 1) < 0.02 ? "None" : f2(gv);
        });
      }
      render();

      // ---- loss chart ----
      var L = compact ? { l: 34, r: W - 12, t: py + 128, b: py + 252, head: py + 116 } : { l: 384, r: W - 14, t: 40, b: 290, head: 18 };
      var LMAX = 5.5;
      function lx(i) { return L.l + (i / (LOSSES.length - 1)) * (L.r - L.l); }
      function ly(v) { return L.b - (v / LMAX) * (L.b - L.t); }
      S("path", { d: "M" + L.l + " " + L.t + "V" + L.b + "H" + L.r, class: "s-axis" }, svg);
      S("line", { x1: L.l, x2: L.r, y1: ly(5), y2: ly(5), class: "s-grid" }, svg);
      [0, 5].forEach(function (v) { S("text", { x: L.l - 7, y: ly(v) + 4, class: "t t-sm t-muted t-end", text: v }, svg); });
      S("text", { x: compact ? 8 : L.l - 30, y: L.head, class: "t t-sm t-muted", text: "↑ loss, one dot per batch" }, svg);
      S("text", { x: L.r, y: L.b + 17, class: "t t-sm t-muted t-end", text: "training step →" }, svg);
      var dots = LOSSES.map(function (v, i) { return S("circle", { cx: lx(i), cy: ly(v), r: 3.5, class: i === 1 ? "f-orange" : "f-blue" }, svg); });
      dots.slice(1).forEach(function (d) { d.style.opacity = 0; });
      tl.addLabel("s0", 0);

      // s1 zero_grad
      hlTo(1); swap(st0, st1);
      tl.to(st, { g: 1, duration: 0.6, onUpdate: render }, "<");
      tl.addLabel("s1");
      // s2 forward
      hlTo(2); swap(st1, st2);
      tl.addLabel("s2");
      // s3 loss
      hlTo(3); swap(st2, st3);
      LC.popIn(tl, dots[1], { duration: 0.3 });
      tl.addLabel("s3");
      // s4 backward
      hlTo(4); swap(st3, st4);
      tl.to(st, { g: 2, duration: 0.7, onUpdate: render }, "<");
      tl.addLabel("s4");
      // s5 step
      hlTo(5); swap(st4, st5);
      tl.to(st, { p: 1, duration: 0.7, onUpdate: render }, "<");
      tl.addLabel("s5");
      // s6 repeat
      hlTo(0); swap(st5, st6);
      tl.to([gBar.w, gBar.b, gVal.w, gVal.b], { opacity: 0.3, duration: 0.3 }, "<");
      tl.to(dots.slice(2), { opacity: 1, duration: 0.15, stagger: 0.04 }, "<");
      tl.to(st, { fin: 1, duration: 1.5, onUpdate: render }, "<");
      tl.addLabel("s6");
      return tl;
    }
  };
})();
