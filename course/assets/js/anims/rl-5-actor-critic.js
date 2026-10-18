/* RL.5: one actor-critic step on the module gridworld, then GAE's weights.
   s = row 2, col 2; action up → s' = row 1, col 2; r = 0; γ = 0.9.
   Critic: V(s) = 0.60, V(s') = 0.80 (illustrative, mid-training).
   δ = 0 + 0.9 × 0.80 − 0.60 = +0.12; critic step α_c = 0.5 → 0.66.
   GAE weights on δ_{t+l}: (γλ)^l. λ = 0.95 → 1, .855, .731, .625, .534, .457;
   λ = 0 → only δ_t; λ = 1 → γ^l (Monte Carlo return minus V). */
(function () {
  var LC = window.LC;
  var GW = LC.rlGrid, G = 0.9;

  LC.anims["rl-5-actor-critic"] = {
    title: "Actor-critic: the critic grades every step",
    steps: [
      "Two networks share the work. The <strong>actor</strong> is the policy $\\pi_\\theta(a \\mid s)$. The <strong>critic</strong> $V_\\phi(s)$ predicts the return from each state. At $s$ it says $0.60$.",
      "The actor picks up. The agent lands in $s'$ with reward 0, and the critic values $s'$ at $0.80$.",
      "The <strong>TD error</strong> compares what happened with what was expected: $\\delta = r + \\gamma V(s') - V(s) = 0 + 0.9 \\times 0.80 - 0.60 = +0.12$. Positive: the move went better than expected.",
      "Both learn from $\\delta$ at once, without waiting for the episode to end. The <strong>critic</strong> moves $V(s)$ toward its target. The <strong>actor</strong> uses $\\delta$ as the <strong>advantage</strong> and makes up a little more likely.",
      "One-step $\\delta$ is low-variance but leans on a possibly wrong critic. <strong>GAE</strong> blends the TD errors of the next steps with weights $(\\gamma\\lambda)^l$. With $\\gamma = 0.9$, $\\lambda = 0.95$ they fade slowly.",
      "$\\lambda = 0$: only the one-step TD error. Lowest variance, but as biased as the critic.",
      "$\\lambda = 1$: weights $\\gamma^l$, which adds up to the Monte Carlo return minus $V(s_t)$. Unbiased, but as noisy as REINFORCE. Values around 0.95 are the usual compromise."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 400 } : { w: 640, h: 330 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      var L = compact
        ? { cell: 40, gx: 12, gy: 40, px: 192, crit: [46, 70, 94], act: [130, 154, 178], eq: [[12, 238], [12, 262], [12, 296], [12, 320]] }
        : { cell: 52, gx: 20, gy: 36, px: 256, crit: [50, 76, 102], act: [150, 176, 202], eq: [[430, 56], [430, 82], [430, 150], [430, 176]] };
      var main = S("g", {}, svg);
      var board = GW.draw(main, L.gx, L.gy, L.cell, {});
      var ps = board.xy(2, 2), ps2 = board.xy(1, 2), cell = L.cell;
      var ring = S("rect", { x: ps.x + 1.5, y: ps.y + 1.5, width: cell - 3, height: cell - 3, rx: 6, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 2.5 }, main);
      var robot = S("circle", { cx: ps.cx, cy: ps.cy, r: compact ? 8 : 10, class: "f-orange", stroke: "var(--a-ink)", "stroke-width": 2 }, main);
      S("text", { x: L.px, y: L.crit[0], class: "t t-sm t-blue", "font-weight": 650, text: "critic V(s)" }, main);
      var vS = S("text", { x: L.px, y: L.crit[1], class: "t t-mono", text: "V(s) = 0.60" }, main);
      var vS2 = S("text", { x: L.px, y: L.crit[2], class: "t t-mono", text: "V(s′) = 0.80" }, main);
      S("text", { x: L.px, y: L.act[0], class: "t t-sm t-orange", "font-weight": 650, text: "actor π(a | s)" }, main);
      S("text", { x: L.px, y: L.act[1], class: "t t-mono", text: "π(↑ | s) = 0.40" }, main);
      var nudge = S("text", { x: L.px, y: L.act[2], class: "t t-sm t-orange", text: "↑ made more likely" }, main);
      var eqs = compact
        ? [["δ = 0 + 0.9 × 0.80 − 0.60 = +0.12", "t"], ["better than expected", "t t-sm t-muted"], ["critic: V(s) ← 0.60 + 0.5 × 0.12 = 0.66", "t t-sm t-blue"], ["actor: θ ← θ + α · δ · ∇ log π(↑ | s)", "t t-sm t-orange"]]
        : [["TD error δ = r + γV(s′) − V(s)", "t t-sm t-muted"], ["0 + 0.9 × 0.80 − 0.60 = +0.12", "t"], ["critic: V(s) ← 0.60 + 0.5 × 0.12", "t t-sm t-blue"], ["actor: θ ← θ + α · δ · ∇ log π", "t t-sm t-orange"]];
      var eqEls = eqs.map(function (e, i) { return S("text", { x: L.eq[i][0], y: L.eq[i][1], class: e[1], "font-weight": i === 0 && compact ? 600 : 400, text: e[0] }, main); });
      [vS2, nudge].concat(eqEls).forEach(function (e) { e.style.opacity = 0; });
      tl.addLabel("s0", 0);

      // s1: act
      var mv = S("path", { d: GW.arrowPath(ps.cx, ps.y, 0, cell * 0.28), class: "s-orange", "stroke-width": 2.5 }, main);
      var ring2 = S("rect", { x: ps2.x + 1.5, y: ps2.y + 1.5, width: cell - 3, height: cell - 3, rx: 6, class: "f-none", stroke: "var(--a-blue)", "stroke-width": 2.5 }, main);
      ring2.style.opacity = 0;
      LC.drawIn(tl, mv, { duration: 0.4 }, "+=0.02");
      tl.to(robot, { attr: { cy: ps2.cy }, duration: 0.5, ease: "power2.inOut" });
      tl.to(mv, { opacity: 0, duration: 0.2 }, "<");
      tl.to([ring2, vS2], { opacity: 1, duration: 0.4 });
      tl.addLabel("s1");

      // s2: TD error
      LC.popIn(tl, eqEls.slice(0, 2), { duration: 0.4, stagger: 0.15 });
      tl.addLabel("s2");

      // s3: both update
      var st = { p: 0 };
      LC.popIn(tl, eqEls.slice(2).concat([nudge]), { duration: 0.4, stagger: 0.12 });
      tl.to(st, { p: 1, duration: 0.5, onUpdate: function () { vS.textContent = st.p > 0.5 ? "V(s) = 0.66" : "V(s) = 0.60"; } });
      tl.addLabel("s3");

      // s4–s6: GAE weights
      var gae = S("g", {}, svg); gae.style.opacity = 0;
      var B = compact ? { x0: 40, step: 52, bw: 30, base: 300, h: 170 } : { x0: 120, step: 76, bw: 40, base: 250, h: 150 };
      S("text", { x: compact ? 12 : 40, y: 40, class: "t t-sm t-muted", text: "weight on the TD error l steps ahead: (γλ)ˡ" }, gae);
      var lamLbl = S("text", { x: compact ? 12 : 40, y: 68, class: "t t-lg", text: "" }, gae);
      var gbars = [], gval = [];
      for (var l = 0; l < 6; l++) {
        var x = B.x0 + l * B.step;
        gbars.push(S("rect", { x: x, y: B.base, width: B.bw, height: 0, rx: 3, class: "f-orange", "fill-opacity": 0.8 }, gae));
        gval.push(S("text", { x: x + B.bw / 2, y: B.base - 8, class: "t t-sm t-mono t-mid", text: "" }, gae));
        S("text", { x: x + B.bw / 2, y: B.base + 18, class: "t t-sm t-mid t-muted", text: l === 0 ? "δₜ" : "+" + l }, gae);
      }
      S("line", { x1: B.x0 - 8, x2: B.x0 + 5 * B.step + B.bw + 8, y1: B.base, y2: B.base, class: "s-axis" }, gae);
      var note = S("text", { x: compact ? 12 : 40, y: B.base + 50, class: "t t-sm", text: "" }, gae);
      var NOTE = { 0.95: "the usual compromise between bias and variance", 0: "λ = 0: one-step TD error only", 1: "λ = 1: Monte Carlo return minus V(s)" };
      var gs = { lam: 0.95 };
      function renderG() {
        var w = G * gs.lam;
        for (var l = 0; l < 6; l++) {
          var v = Math.pow(w, l), h = v * B.h;
          gbars[l].setAttribute("y", B.base - h); gbars[l].setAttribute("height", h);
          gval[l].setAttribute("y", B.base - h - 8);
          gval[l].textContent = l === 0 ? "1" : (v < 0.005 ? "0" : v.toFixed(2).replace(/^0/, ""));
        }
        var lr = Math.abs(gs.lam - 0.95) < 0.02 ? 0.95 : (gs.lam < 0.02 ? 0 : (gs.lam > 0.98 ? 1 : null));
        lamLbl.textContent = "λ = " + (lr === null ? gs.lam.toFixed(2) : String(lr)) + ", γ = 0.9";
        note.textContent = lr === null ? "" : NOTE[lr];
      }
      renderG();
      tl.to(main, { opacity: 0, duration: 0.4 });
      tl.to(gae, { opacity: 1, duration: 0.4 });
      tl.addLabel("s4");
      tl.to(gs, { lam: 0, duration: 0.9, ease: "power1.inOut", onUpdate: renderG });
      tl.addLabel("s5");
      tl.to(gs, { lam: 1, duration: 0.9, ease: "power1.inOut", onUpdate: renderG });
      tl.addLabel("s6");
      return tl;
    }
  };
})();
