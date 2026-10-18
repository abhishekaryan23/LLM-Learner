/* M3.3: one round of RLHF with PPO, treating the whole response as one action
   (InstructGPT's "bandit" view, with a KL penalty to the frozen SFT reference).
   r = 2.0, KL estimate 0.7, beta = 0.1 -> R = 1.93; V = 1.5 -> A = +0.43. */
(function () {
  var LC = window.LC;

  LC.anims["m3-3-rlhf"] = {
    title: "One round of RLHF with PPO",
    steps: [
      "RLHF starts from the SFT model, copied into a trainable <strong>policy</strong> $\\pi_\\theta$. Each round takes a batch of <strong>prompts only</strong>, no answers.",
      "The policy <strong>samples a response</strong>. This is on-policy data: the model learns from its own outputs, not from demonstrations.",
      "The frozen <strong>reward model</strong> from M3.2 scores the whole response: $r = 2.0$.",
      "A frozen <strong>reference</strong> copy of the SFT model scores the same tokens. The log-prob gap estimates the <strong>KL</strong> (0.7 here), and the reward actually used is $R = r - \\beta\\,\\mathrm{KL} = 1.93$ with $\\beta = 0.1$.",
      "A trained <strong>value model</strong> predicts the reward to expect for this prompt: $V = 1.5$. The <strong>advantage</strong> $A = R - V = +0.43$ says “better than expected”.",
      "<strong>PPO</strong> nudges the policy to make better-than-expected responses more likely (and worse ones less likely), but <strong>clips</strong> how far any probability may move in one update.",
      "Repeat for many rounds. The price: <strong>four models in memory</strong>, two trained (policy, value) and two frozen (reward, reference), plus slow text generation inside the training loop."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 500 } : { w: 640, h: 356 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      function box(x, y, w, h, title, sub, stroke, parent) {
        var g = S("g", {}, parent || svg);
        var r = S("rect", { x: x, y: y, width: w, height: h, rx: 10, class: "f-surface", stroke: stroke, "stroke-width": 2 }, g);
        S("text", { x: x + 12, y: y + 19, class: "t", text: title, "font-weight": 650 }, g);
        S("text", { x: x + 12, y: y + 36, class: "t t-sm t-muted", text: sub }, g);
        g.rect = r;
        return g;
      }
      function arrow(d, parent) { return S("path", { d: d, class: "s-ink", "stroke-width": 1.5 }, parent || svg); }
      function head(x, y, dir) { // small chevron pointing dir: "d" down, "r" right
        return dir === "d" ? "M" + (x - 5) + " " + (y - 6) + "L" + x + " " + y + "L" + (x + 5) + " " + (y - 6)
                           : "M" + (x - 6) + " " + (y - 5) + "L" + x + " " + y + "L" + (x - 6) + " " + (y + 5);
      }

      var L = compact ? { x: 14, w: 332 } : { x: 44, w: 256 };
      var cx = L.x + L.w / 2;
      // prompt
      var pY = compact ? 24 : 28;
      S("text", { x: L.x, y: pY - 8, class: "t t-sm t-muted", text: "prompt x (from a dataset)" }, svg);
      S("rect", { x: L.x, y: pY, width: L.w, height: 30, rx: 9, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, svg);
      S("text", { x: L.x + 12, y: pY + 20, class: "t", text: "Why is the sky blue?" }, svg);
      var polY = pY + 54;
      var policy = box(L.x, polY, L.w, 44, "Policy π", "trainable · starts as the SFT model", "var(--a-blue)");
      arrow("M" + cx + " " + (pY + 32) + "V" + (polY - 3) + head(cx, polY - 3, "d"));
      tl.addLabel("s0", 0);

      // s1: sample response
      var yY = polY + 72;
      var resp = S("g", {}, svg);
      arrow("M" + cx + " " + (polY + 46) + "V" + (yY - 3) + head(cx, yY - 3, "d"), resp);
      S("text", { x: cx + 10, y: polY + 62, class: "t t-sm t-muted", text: "sample" }, resp);
      S("rect", { x: L.x, y: yY, width: L.w, height: 30, rx: 9, class: "f-surface", stroke: "var(--a-blue)", "stroke-width": 1.5, "stroke-dasharray": "5 4" }, resp);
      S("text", { x: L.x + 12, y: yY + 20, class: "t", text: "y: “Air scatters blue light most.”" }, resp);
      LC.popIn(tl, resp, { duration: 0.5 });
      tl.addLabel("s1");

      // right-hand models
      var R = compact ? { x: 30, w: 184, y: yY + 58, gap: 56 } : { x: 360, w: 180, y: 26, gap: 74 };
      var outX = R.x + R.w + 12;
      var models = [
        ["Reward model", "frozen · from M3.2", "var(--a-ink)", "r = 2.0"],
        ["Reference model", "frozen · copy of SFT", "var(--a-ink)", "KL ≈ 0.7"],
        ["Value model", "trainable · predicts reward", "var(--a-blue)", "V = 1.5"]
      ];
      var mG = [], outs = [], links = [];
      models.forEach(function (mm, i) {
        var y = R.y + i * R.gap;
        mG.push(box(R.x, y, R.w, 44, mm[0], mm[1], mm[2]));
        outs.push(S("text", { x: outX, y: y + 27, class: "t t-mono", text: mm[3], "font-weight": 700 }, svg));
        var d;
        if (compact) d = "M" + (R.x - 16) + " " + (y + 22) + "H" + (R.x - 3) + head(R.x - 3, y + 22, "r");
        else d = "M" + (L.x + L.w + 4) + " " + (yY + 15) + "C" + (L.x + L.w + 30) + " " + (yY + 15) + " " + (R.x - 30) + " " + (y + 22) + " " + (R.x - 3) + " " + (y + 22) + head(R.x - 3, y + 22, "r");
        links.push(arrow(d));
      });
      var trunk = compact ? arrow("M" + (R.x - 16) + " " + (yY + 32) + "V" + (R.y + 2 * R.gap + 22)) : null;

      // s2: reward model
      if (trunk) LC.drawIn(tl, trunk, { duration: 0.6 });
      LC.popIn(tl, mG[0], { duration: 0.4 });
      LC.drawIn(tl, links[0], { duration: 0.5 });
      LC.popIn(tl, outs[0], { duration: 0.3 });
      tl.addLabel("s2");

      // equations
      var eY = compact ? R.y + 2 * R.gap + 76 : 262, eX = compact ? L.x : L.x;
      var eqCls = "t t-mono" + (compact ? " t-sm" : " t-sm");
      var eq1 = S("text", { x: eX, y: eY, class: eqCls, text: compact ? "R = r − β·KL = 2.0 − 0.1×0.7 = 1.93" : "reward used: R = r − β·KL = 2.0 − 0.1 × 0.7 = 1.93" }, svg);
      var eq2 = S("text", { x: eX, y: eY + 26, class: eqCls, text: compact ? "A = R − V = 1.93 − 1.5 = +0.43" : "advantage: A = R − V = 1.93 − 1.5 = +0.43" }, svg);
      var eq3 = S("text", { x: eX, y: eY + 52, class: eqCls + " t-orange", "font-weight": 700, text: compact ? "PPO: p(y) up, ratio kept in [0.8, 1.2]" : "PPO update: make y more likely, ratio kept in [0.8, 1.2]" }, svg);
      var eq4 = S("text", { x: eX, y: eY + 82, class: "t" + (compact ? " t-sm" : ""), "font-weight": 650, text: "4 models in memory: 2 trained, 2 frozen" }, svg);

      // s3: reference + KL
      LC.popIn(tl, mG[1], { duration: 0.4 });
      LC.drawIn(tl, links[1], { duration: 0.5 });
      LC.popIn(tl, [outs[1], eq1], { duration: 0.4, stagger: 0.2 });
      tl.addLabel("s3");

      // s4: value + advantage
      LC.popIn(tl, mG[2], { duration: 0.4 });
      LC.drawIn(tl, links[2], { duration: 0.5 });
      LC.popIn(tl, [outs[2], eq2], { duration: 0.4, stagger: 0.2 });
      tl.addLabel("s4");

      // s5: PPO update, loop back into the policy
      var loop;
      if (compact) loop = null;
      else loop = arrow("M" + (eX - 6) + " " + (eY + 47) + "H" + 20 + "V" + (polY + 22) + "H" + (L.x - 3) + head(L.x - 3, polY + 22, "r"));
      if (loop) { loop.setAttribute("class", "s-orange"); loop.setAttribute("stroke-width", 2); }
      LC.popIn(tl, eq3, { duration: 0.4 });
      if (loop) LC.drawIn(tl, loop, { duration: 0.8 });
      tl.to(policy.rect, { attr: { "stroke-width": 4 }, duration: 0.25, yoyo: true, repeat: 1 });
      tl.addLabel("s5");

      // s6: four models
      var frames = [policy.rect, mG[0].rect, mG[1].rect, mG[2].rect];
      LC.popIn(tl, eq4, { duration: 0.4 });
      tl.to(frames, { attr: { "stroke-width": 3.5 }, duration: 0.4 }, "<");
      tl.addLabel("s6");
      return tl;
    }
  };
})();
