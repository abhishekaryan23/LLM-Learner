/* M3.4: the DPO loss on one preference pair, beta = 0.1.
   chosen:   log pi = -12.0, log pi_ref = -14.0 -> ratio +2.0 -> implicit reward +0.2
   rejected: log pi = -15.0, log pi_ref = -13.0 -> ratio -2.0 -> implicit reward -0.2
   margin 0.4, loss = -log sigma(0.4) = -log 0.60 = 0.51, gradient weight sigma(-0.4) = 0.40. */
(function () {
  var LC = window.LC;

  LC.anims["m3-4-dpo"] = {
    title: "The DPO loss on one preference pair (β = 0.1)",
    steps: [
      "DPO trains directly on <strong>preference pairs</strong>: a prompt, a chosen response $y_w$ and a rejected one $y_l$. No reward model, no sampling.",
      "Two models read both responses and report <strong>log-probabilities</strong>: the policy $\\pi_\\theta$ being trained, and a frozen <strong>reference</strong> $\\pi_\\text{ref}$ (the SFT model).",
      "The <strong>log-ratio</strong> $\\log\\pi_\\theta - \\log\\pi_\\text{ref}$ says how much the policy has moved toward each response. Times $\\beta$, it is DPO's <strong>implicit reward</strong>: $+0.2$ and $-0.2$.",
      "The <strong>margin</strong> is chosen minus rejected implicit reward: $0.2 - (-0.2) = 0.4$. This plays the role of $r_w - r_l$ in Bradley–Terry.",
      "Same loss as the reward model: $-\\log\\sigma(0.4) = 0.51$. At the very start $\\pi_\\theta = \\pi_\\text{ref}$, the margin is 0 and the loss is $\\log 2 = 0.69$.",
      "The gradient raises $\\log\\pi_\\theta(y_w)$ and lowers $\\log\\pi_\\theta(y_l)$, scaled by $\\sigma(-0.4) = 0.40$: <strong>pairs the model still gets wrong push hardest</strong>.",
      "Compare the pipelines: DPO replaces reward-model training <em>and</em> the whole PPO loop with <strong>one supervised-style loss</strong>, and needs only two models, one of them frozen."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 340 } : { w: 640, h: 316 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      var lx = 14;
      function sub(parent, attrs, main, subTxt) { // text with a subscript tspan
        var t = S("text", attrs, parent);
        t.appendChild(document.createTextNode(main));
        if (subTxt) { var sp = S("tspan", { dy: 4, text: subTxt }, t); void sp; }
        return t;
      }

      // ---- the pair ----
      S("text", { x: lx, y: 16, class: "t t-sm t-muted", text: "prompt: why is the sky blue?" }, svg);
      var chips = compact
        ? [{ x: lx, y: 26, w: W - 28 }, { x: lx, y: 64, w: W - 28 }]
        : [{ x: lx, y: 28, w: 300 }, { x: 326, y: 28, w: 300 }];
      var cText = ["Air scatters blue light most.", "It reflects the colour of the sea."];
      chips.forEach(function (c, i) {
        S("rect", { x: c.x, y: c.y, width: c.w, height: 30, rx: 9, class: "f-surface", stroke: i === 0 ? "var(--a-blue)" : "var(--line)", "stroke-width": 1.5 }, svg);
        sub(svg, { x: c.x + 10, y: c.y + 20, class: "t t-sm " + (i === 0 ? "t-blue" : "t-muted"), "font-weight": 700 }, i === 0 ? "✓ y" : "✗ y", i === 0 ? "w" : "l");
        S("text", { x: c.x + 46, y: c.y + 20, class: "t t-sm", text: cText[i] }, svg);
      });
      tl.addLabel("s0", 0);

      // ---- the table ----
      var T = S("g", {}, svg);
      var cols = compact ? [86, 162, 238, 314] : [200, 314, 428, 548];
      var hY = compact ? 124 : 96, rY = compact ? [170, 200] : [146, 178];
      var colG = [[], [], [], []];
      colG[0].push(sub(T, { x: cols[0], y: hY, class: "t t-sm t-mid", "font-weight": 650 }, "log π", "θ"));
      colG[0].push(S("text", { x: cols[0], y: hY + 20, class: "t t-sm t-mid t-blue", text: "policy" }, T));
      colG[1].push(sub(T, { x: cols[1], y: hY, class: "t t-sm t-mid", "font-weight": 650 }, "log π", "ref"));
      colG[1].push(S("text", { x: cols[1], y: hY + 20, class: "t t-sm t-mid t-muted", text: "frozen" }, T));
      colG[2].push(S("text", { x: cols[2], y: hY, class: "t t-sm t-mid", "font-weight": 650, text: compact ? "ratio" : "log-ratio" }, T));
      colG[2].push(S("text", { x: cols[2], y: hY + 20, class: "t t-sm t-mid t-muted", text: compact ? "(diff.)" : "(difference)" }, T));
      colG[3].push(S("text", { x: cols[3], y: hY, class: "t t-sm t-mid", "font-weight": 650, text: compact ? "β·ratio" : "β × log-ratio" }, T));
      colG[3].push(S("text", { x: cols[3], y: hY + 20, class: "t t-sm t-mid t-orange", text: compact ? "reward" : "implicit reward" }, T));
      S("line", { x1: lx, x2: W - lx, y1: hY + 30, y2: hY + 30, class: "s-grid" }, T);
      var vals = [["−12.0", "−14.0", "+2.0", "+0.2"], ["−15.0", "−13.0", "−2.0", "−0.2"]];
      rY.forEach(function (y, i) {
        sub(T, { x: lx, y: y, class: "t t-sm " + (i === 0 ? "t-blue" : "t-muted"), "font-weight": 700 }, i === 0 ? "✓ y" : "✗ y", i === 0 ? "w" : "l");
        vals[i].forEach(function (v, j) {
          colG[j].push(S("text", { x: cols[j], y: y, class: "t t-mono t-mid" + (compact ? " t-sm" : "") + (j === 3 ? " t-orange" : ""), text: v, "font-weight": j === 3 ? 700 : 450 }, T));
        });
      });
      LC.popIn(tl, colG[0].concat(colG[1]), { duration: 0.3, stagger: 0.05 });
      tl.addLabel("s1");
      LC.popIn(tl, colG[2], { duration: 0.3, stagger: 0.05 });
      LC.popIn(tl, colG[3], { duration: 0.3, stagger: 0.05 });
      tl.addLabel("s2");

      var mY = rY[1] + (compact ? 40 : 44);
      var margin = S("text", { x: lx, y: mY, class: "t t-mono" + (compact ? " t-sm" : ""), text: "margin = 0.2 − (−0.2) = 0.4" }, T);
      LC.popIn(tl, margin, { duration: 0.4 });
      tl.addLabel("s3");

      var loss = S("text", { x: lx, y: mY + 26, class: "t t-mono t-orange" + (compact ? " t-sm" : ""), "font-weight": 700, text: "loss = −log σ(0.4) = −log 0.60 = 0.51" }, T);
      var note = S("text", { x: lx, y: mY + 48, class: "t t-sm t-muted", text: compact ? "at the start (policy = ref): loss = log 2 = 0.69" : "at the very start (policy = reference): margin 0, loss = log 2 = 0.69" }, T);
      LC.popIn(tl, [loss, note], { duration: 0.4, stagger: 0.2 });
      tl.addLabel("s4");

      var up = S("text", { x: cols[0] + (compact ? 30 : 40), y: rY[0], class: "t t-orange", "font-weight": 800, text: "↑" }, T);
      var dn = S("text", { x: cols[0] + (compact ? 30 : 40), y: rY[1], class: "t t-orange", "font-weight": 800, text: "↓" }, T);
      var gl = S("text", { x: lx, y: mY + 76, class: "t t-sm t-orange", "font-weight": 650, text: compact ? "push weight σ(−0.4) = 0.40" : "push weight σ(−0.4) = 0.40: larger when the pair is still ranked wrong" }, T);
      LC.popIn(tl, [up, dn, gl], { duration: 0.4, stagger: 0.12 });
      tl.addLabel("s5");

      // ---- pipeline comparison ----
      var P = S("g", {}, svg);
      P.style.opacity = 0;
      var pY0 = compact ? 128 : 112, gapY = compact ? 110 : 100;
      function chain(y, title, items, foot, accent) {
        S("text", { x: lx, y: y, class: "t", "font-weight": 700, text: title }, P);
        var x = lx, h = 32, by = y + 12;
        items.forEach(function (it, i) {
          var w = it.length * (compact ? 6.6 : 7.2) + 22;
          S("rect", { x: x, y: by, width: w, height: h, rx: 9, class: "f-surface", stroke: accent && i === items.length - 1 ? "var(--a-orange)" : "var(--a-ink)", "stroke-width": 1.5 }, P);
          S("text", { x: x + w / 2, y: by + 21, class: "t t-sm t-mid", text: it }, P);
          x += w;
          if (i < items.length - 1) {
            S("path", { d: "M" + (x + 4) + " " + (by + 16) + "H" + (x + 16) + "M" + (x + 11) + " " + (by + 11) + "L" + (x + 16) + " " + (by + 16) + "L" + (x + 11) + " " + (by + 21), class: "s-ink", "stroke-width": 1.5 }, P);
            x += 20;
          }
        });
        S("text", { x: lx, y: by + h + 22, class: "t t-sm t-muted", text: foot }, P);
      }
      chain(pY0, "RLHF with PPO (M3.3)", compact ? ["SFT", "reward model", "PPO + sampling"] : ["SFT", "train reward model", "PPO: sample, score, update"], compact ? "4 models · sampling inside the loop" : "4 models in memory · generation inside the training loop", false);
      chain(pY0 + gapY, "DPO", ["SFT", compact ? "DPO on pairs" : "DPO on preference pairs"], compact ? "2 models (1 frozen) · no sampling" : "2 models (1 frozen; its log-probs can be precomputed) · no sampling", true);
      tl.to(T, { opacity: 0, duration: 0.4 });
      tl.to(P, { opacity: 1, duration: 0.5 });
      tl.addLabel("s6");
      return tl;
    }
  };
})();
