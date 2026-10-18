/* P2.2: one parameter, one loss curve, a few steps of gradient descent. */
(function () {
  var LC = window.LC;
  function L(t) { return t * t; }
  function dL(t) { return 2 * t; }
  var ETA = 0.3, T0 = 2.6;
  var THETAS = [T0];
  for (var k = 0; k < 4; k++) THETAS.push(THETAS[k] - ETA * dL(THETAS[k]));   // 2.6, 1.04, 0.416, 0.166, 0.067
  function f2(x) { return (x >= 0 ? "+" : "−") + Math.abs(x).toFixed(2); }

  LC.anims["gradient-descent"] = {
    title: "Gradient descent, one step at a time",
    steps: [
      "This curve is the <strong>loss</strong> $L(\\theta)=\\theta^2$: how wrong the model is for each value of one parameter $\\theta$. The best $\\theta$ sits at the <strong>bottom</strong>.",
      "Training starts at an arbitrary $\\theta = 2.6$. The model can't see the whole curve. It only knows the loss <em>right where it stands</em>: $L = 6.76$.",
      "The <strong>derivative</strong> $\\frac{dL}{d\\theta} = 2\\theta = 5.2$ is the <strong>slope</strong> here. Positive slope means \"loss goes up if you move right\".",
      "So move the other way. The step is $-\\eta \\cdot \\text{slope} = -0.3 \\times 5.2 = -1.56$, where $\\eta$ (eta) is the <strong>learning rate</strong>.",
      "Take the step: $\\theta \\leftarrow \\theta - \\eta\\,\\frac{dL}{d\\theta} = 1.04$. Loss drops from 6.76 to <strong>1.08</strong>.",
      "Repeat. Near the bottom the slope is gentler, so <strong>steps shrink automatically</strong>, even though $\\eta$ never changes.",
      "After four steps $\\theta \\approx 0.07$ and the slope is almost zero: we've <strong>converged</strong>. Training an LLM is this same loop, on billions of parameters at once."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 300 } : { w: 640, h: 330 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, H = ctx.h, compact = ctx.layout === "compact";
      var m = compact ? { l: 40, r: 14, t: 50, b: 40 } : { l: 52, r: 24, t: 40, b: 42 };
      var X0 = -3, X1 = 3.2, Y1 = 10;
      var pw = W - m.l - m.r, ph = H - m.t - m.b;
      function sx(t) { return m.l + ((t - X0) / (X1 - X0)) * pw; }
      function sy(v) { return m.t + (1 - v / Y1) * ph; }
      var tl = gsap.timeline();

      // axes + curve (visible at s0)
      var g = S("g", {}, svg);
      [2.5, 5, 7.5].forEach(function (v) { S("line", { x1: m.l, x2: W - m.r, y1: sy(v), y2: sy(v), class: "s-grid" }, g); });
      S("path", { d: "M" + m.l + " " + m.t + "V" + sy(0) + "H" + (W - m.r), class: "s-axis" }, g);
      [-2, -1, 0, 1, 2, 3].forEach(function (t) { S("text", { x: sx(t), y: sy(0) + 18, class: "t t-sm t-muted t-mid", text: t }, g); });
      [0, 5, 10].forEach(function (v) { S("text", { x: m.l - 8, y: sy(v) + 4, class: "t t-sm t-muted t-end", text: v }, g); });
      S("text", { x: W - m.r, y: H - 4, class: "t t-sm t-muted t-end", text: "parameter θ →" }, g);
      S("text", { x: 4, y: 16, class: "t t-sm t-muted", text: "↑ loss L(θ)" }, g);
      S("path", { d: LC.fnPath(L, X0, X1, sx, sy, 80), class: "s-blue" }, svg);
      S("circle", { cx: sx(0), cy: sy(0), r: 5, class: "f-blue" }, svg);
      var minLbl = S("text", { x: sx(0), y: sy(0) - 12, class: "t t-sm t-blue t-mid", text: "minimum" }, svg);
      tl.addLabel("s0", 0);

      // readout (top right)
      var read = compact
        ? S("text", { x: 4, y: 36, class: "t t-sm t-mono", text: "" }, svg)
        : S("text", { x: W - m.r, y: 16, class: "t t-sm t-mono t-end", text: "" }, svg);
      var trail = S("g", {}, svg);
      var tangentG = S("g", {}, svg);
      var ball = S("circle", { cx: sx(T0), cy: sy(L(T0)), r: compact ? 8 : 9, class: "f-orange", stroke: "var(--a-ink)", "stroke-width": 2 }, svg);
      var st = { t: T0 };
      function place() {
        ball.setAttribute("cx", sx(st.t)); ball.setAttribute("cy", sy(L(st.t)));
        read.textContent = "θ = " + st.t.toFixed(2) + "   L = " + L(st.t).toFixed(2);
      }
      place();

      // step 1: ball appears
      LC.popIn(tl, [ball, read], { duration: 0.5 });
      tl.addLabel("s1");

      function tangent(t, big) {
        var d = big ? 0.55 : 0.5;
        var line = S("path", { d: "M" + sx(t - d) + " " + sy(L(t) - dL(t) * d) + "L" + sx(t + d) + " " + sy(L(t) + dL(t) * d), class: "s-ink" }, tangentG);
        line.setAttribute("stroke-width", 2.5);
        return line;
      }
      function arrow(t0, t1) {
        var y = sy(0) - 14;
        var a = S("path", { d: "M" + sx(t0) + " " + y + "H" + sx(t1), class: "s-orange" }, svg);
        var dir = t1 < t0 ? 1 : -1;
        var head = S("path", { d: "M" + (sx(t1) + 9 * dir) + " " + (y - 6) + "L" + sx(t1) + " " + y + "L" + (sx(t1) + 9 * dir) + " " + (y + 6), class: "s-orange" }, svg);
        return [a, head];
      }

      // step 2: tangent + slope label
      var t0line = tangent(T0, true);
      var slopeLbl = S("text", { x: sx(T0) - 10, y: sy(L(T0)) - 14, class: "t t-sm t-end", text: "slope = " + f2(dL(T0)) }, svg);
      LC.drawIn(tl, t0line, { duration: 0.8 }, "+=0.02"); // offset: keep the start off the step label
      LC.popIn(tl, slopeLbl, {}, "-=0.2");
      tl.addLabel("s2");

      // step 3: step arrow
      var ar = arrow(T0, THETAS[1]);
      // right-aligned near the ball, just above the arrow: the curve is further left at this height
      var stepLbl = S("text", { x: Math.min(W - 6, sx(T0) + 20), y: sy(0) - 26, class: "t t-sm t-orange t-end", text: (compact ? "step = " : "−η·slope = ") + f2(-ETA * dL(T0)) }, svg);
      LC.drawIn(tl, ar[0], { duration: 0.7 }, "+=0.02");
      LC.popIn(tl, [ar[1], stepLbl], { duration: 0.3 });
      tl.addLabel("s3");

      // step 4: move the ball
      function move(i, dur) {
        var dot = S("circle", { cx: sx(THETAS[i]), cy: sy(L(THETAS[i])), r: 4, class: "f-faint" }, trail);
        LC.popIn(tl, dot, { duration: 0.01 });
        tl.to(st, { t: THETAS[i + 1], duration: dur, ease: "power2.inOut", onUpdate: place });
      }
      tl.to([t0line, slopeLbl, ar[0], ar[1], stepLbl], { opacity: 0.25, duration: 0.3 });
      move(0, 1.0);
      tl.addLabel("s4");

      // step 5: iterations 2 and 3
      tl.to([t0line, slopeLbl, ar[0], ar[1], stepLbl, minLbl], { opacity: 0, duration: 0.3 });
      [1, 2].forEach(function (i) {
        var tg = tangent(THETAS[i], false);
        var a2 = arrow(THETAS[i], THETAS[i + 1]);
        LC.drawIn(tl, tg, { duration: 0.45 });
        LC.drawIn(tl, a2[0], { duration: 0.4 });
        LC.popIn(tl, a2[1], { duration: 0.15 });
        move(i, 0.7);
        tl.to([tg, a2[0], a2[1]], { opacity: 0, duration: 0.25 });
      });
      tl.addLabel("s5");

      // step 6: last iteration + converged badge
      var tg3 = tangent(THETAS[3], false);
      LC.drawIn(tl, tg3, { duration: 0.4 }, "+=0.02");
      move(3, 0.6);
      var done = S("text", { x: sx(0), y: sy(L(0)) - 34, class: "t t-lg t-orange t-mid", text: "converged ✓" }, svg);
      LC.popIn(tl, done, { duration: 0.4 });
      tl.addLabel("s6");
      return tl;
    }
  };
})();
