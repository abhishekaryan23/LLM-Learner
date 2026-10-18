/* RL.4: REINFORCE on a softmax policy over 3 answer tokens, α = 0.5.
   θ = [0,0,0] → π = [1/3]*3. Sample "Paris", G = +1: ∇θ log π = onehot − π = [+.67, −.33, −.33];
   θ ← θ + α G ∇ = [.333, −.167, −.167] → π = [.452, .274, .274].
   Sample "Lyon", G = −1: ∇ = [−.452, +.726, −.274]; θ ← θ − 0.5 ∇ = [.559, −.530, −.030]
   → π = [.529, .178, .293]. Then baselines, then a 3-token response: log-probs add. */
(function () {
  var LC = window.LC;
  var TOK = ["Paris", "Lyon", "Nice"];
  function softmax(t) { var m = Math.max.apply(null, t), e = t.map(function (v) { return Math.exp(v - m); }), s = e[0] + e[1] + e[2]; return e.map(function (v) { return v / s; }); }
  var TH = [[0, 0, 0]];
  (function () {
    var a = 0.5, p = softmax(TH[0]), g = p.map(function (v, i) { return (i === 0 ? 1 : 0) - v; });
    TH.push(TH[0].map(function (v, i) { return v + a * 1 * g[i]; }));
    p = softmax(TH[1]); g = p.map(function (v, i) { return (i === 1 ? 1 : 0) - v; });
    TH.push(TH[1].map(function (v, i) { return v + a * -1 * g[i]; }));
  })();
  var GRAD = [null, softmax(TH[0]).map(function (v, i) { return (i === 0 ? 1 : 0) - v; }), softmax(TH[1]).map(function (v, i) { return (i === 1 ? 1 : 0) - v; })];
  function sg(v) { return (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(2); }

  LC.anims["rl-4-reinforce"] = {
    title: "REINFORCE on one question, step by step",
    steps: [
      "A tiny policy answers \"capital of France?\" with one of three tokens. It is a <strong>softmax over logits</strong> $\\theta$. All logits start at 0, so each answer has probability $1/3$.",
      "<strong>Sample</strong> an answer from the policy: Paris. A verifier checks it and returns reward $G = +1$.",
      "The <strong>score function</strong> $\\nabla_\\theta \\log \\pi_\\theta(\\text{Paris})$ points to the logit change that makes Paris more likely. For a softmax it is one-hot minus the probabilities: $(+0.67, -0.33, -0.33)$.",
      "<strong>REINFORCE update</strong>: $\\theta \\leftarrow \\theta + \\alpha\\,G\\,\\nabla_\\theta \\log\\pi_\\theta$ with $\\alpha = 0.5$. Paris rises to 0.45; the others fall to 0.27.",
      "Next sample: Lyon, reward $G = -1$. A negative return flips the push: Lyon's logit goes <strong>down</strong> (to 0.18) and probability flows to the others.",
      "If every reward is positive, every sample gets pushed up and only the sizes differ: noisy. Subtract a <strong>baseline</strong> $b$ (here the average reward, 0.8): better-than-average answers go up, worse ones go down.",
      "For an LLM the action is a whole <strong>response</strong>. Its log-probability is the <strong>sum of its token log-probs</strong>, so the gradient is a sum too, and every token in the response is pushed by the same return."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 384 } : { w: 640, h: 384 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      var colX = compact ? [110, 200, 290] : [250, 370, 490], lblX = compact ? 10 : 90;
      var base = 214, scale = 220, bw = compact ? 52 : 64;
      var main = S("g", {}, svg);
      S("text", { x: lblX, y: 22, class: "t t-sm t-muted", text: "prompt: “capital of France?”" }, main);
      var status = S("text", { x: lblX, y: 46, class: "t", "font-weight": 600, text: "" }, main);
      S("line", { x1: colX[0] - bw, x2: colX[2] + bw, y1: base, y2: base, class: "s-axis" }, main);
      var bars = [], pl = [], lg = [], gr = [];
      TOK.forEach(function (t, i) {
        bars.push(S("rect", { x: colX[i] - bw / 2, y: base, width: bw, height: 0, rx: 4, class: "f-blue", "fill-opacity": 0.7 }, main));
        pl.push(S("text", { x: colX[i], y: base - 8, class: "t t-sm t-mono t-mid", text: "" }, main));
        S("text", { x: colX[i], y: base + 20, class: "t t-mid", "font-weight": 650, text: t }, main);
        lg.push(S("text", { x: colX[i], y: base + 46, class: "t t-sm t-mono t-mid", text: "" }, main));
        gr.push(S("text", { x: colX[i], y: base + 70, class: "t t-sm t-mono t-mid t-orange", text: "" }, main));
      });
      S("text", { x: lblX, y: base + 46, class: "t t-sm t-muted", text: compact ? "logit θ" : "logit θ" }, main);
      var grLbl = S("text", { x: lblX, y: base + 70, class: "t t-sm t-orange", text: compact ? "∇ log π" : "∇θ log π" }, main);
      // baseline table (s5)
      var tab = S("g", {}, main); tab.style.opacity = 0;
      var ty = base + 104;
      S("text", { x: lblX, y: ty, class: "t t-sm t-muted", text: "reward r" }, tab);
      S("text", { x: lblX, y: ty + 24, class: "t t-sm", "font-weight": 600, text: "r − b" }, tab);
      [["1.0", "+0.2"], ["0.6", "−0.2"], ["–", "–"]].forEach(function (v, i) {
        S("text", { x: colX[i], y: ty, class: "t t-sm t-mono t-mid t-muted", text: v[0] }, tab);
        S("text", { x: colX[i], y: ty + 24, class: "t t-sm t-mono t-mid" + (i === 0 ? " t-orange" : i === 1 ? " t-blue" : " t-muted"), "font-weight": 600, text: v[1] }, tab);
      });
      S("text", { x: lblX, y: ty + 50, class: "t t-sm t-muted", text: "baseline b = average reward = 0.8" }, tab);

      var st = { k: 0, ph: 0 };
      var STATUS = ["", "sampled: Paris → reward +1", "sampled: Paris → reward +1", "update: θ ← θ + 0.5 · G · ∇", "sampled: Lyon → reward −1", "all-positive rewards? use r − b", "all-positive rewards? use r − b"];
      function render() {
        var k = Math.min(2, st.k), i0 = Math.floor(k), i1 = Math.min(2, i0 + 1), f = k - i0, ph = Math.round(st.ph);
        var th = TH[i0].map(function (v, i) { return v + (TH[i1][i] - v) * f; }), p = softmax(th);
        var hi = ph >= 1 && ph <= 3 ? 0 : (ph === 4 ? 1 : -1);
        p.forEach(function (v, i) {
          var h = v * scale;
          bars[i].setAttribute("y", base - h); bars[i].setAttribute("height", h);
          bars[i].setAttribute("class", i === hi ? "f-orange" : "f-blue");
          pl[i].setAttribute("y", base - h - 8); pl[i].textContent = v.toFixed(2);
          lg[i].textContent = sg(th[i]).replace("+0.00", "0.00").replace("−0.00", "0.00");
          var g = ph >= 4 ? GRAD[2] : (ph >= 2 ? GRAD[1] : null);
          gr[i].textContent = g ? sg(g[i]) : "";
        });
        grLbl.style.opacity = ph >= 2 ? 1 : 0;
        status.textContent = STATUS[Math.min(ph, 6)];
        status.setAttribute("class", "t" + (ph === 4 ? " t-blue" : ph >= 1 ? " t-orange" : ""));
      }
      render();
      tl.addLabel("s0", 0);
      function phase(n) { tl.to(st, { ph: n, duration: 0.3, onUpdate: render }); }
      phase(1); tl.addLabel("s1");
      phase(2); tl.addLabel("s2");
      phase(3); tl.to(st, { k: 1, duration: 0.8, ease: "power2.inOut", onUpdate: render }); tl.addLabel("s3");
      phase(4); tl.to(st, { k: 2, duration: 0.8, ease: "power2.inOut", onUpdate: render }); tl.addLabel("s4");
      phase(5); tl.to(tab, { opacity: 1, duration: 0.4 }); tl.addLabel("s5");

      // s6: a response is a sequence of tokens
      var seq = S("g", {}, svg); seq.style.opacity = 0;
      var toks = [["It", -0.2], ["is", -0.9], ["Paris", -1.6]];
      var bx = compact ? [40, 140, 240] : [150, 290, 430], bW = compact ? 84 : 110;
      S("text", { x: compact ? 10 : 90, y: 40, class: "t t-sm t-muted", text: "one sampled response = 3 actions" }, seq);
      toks.forEach(function (t, i) {
        S("rect", { x: bx[i], y: 64, width: bW, height: 40, rx: 9, class: "f-surface", stroke: "var(--a-blue)", "stroke-width": 2 }, seq);
        S("text", { x: bx[i] + bW / 2, y: 89, class: "t t-mid", "font-weight": 600, text: t[0] }, seq);
        S("text", { x: bx[i] + bW / 2, y: 130, class: "t t-sm t-mono t-mid", text: (compact ? "" : "log π = ") + t[1].toFixed(1).replace("-", "−") }, seq);
        if (i) S("text", { x: bx[i] - 8, y: 130, class: "t t-sm t-mid t-muted", text: "+" }, seq);
      });
      if (compact) S("text", { x: 4, y: 130, class: "t t-sm t-muted", text: "log π" }, seq);
      var sx = compact ? 10 : 90;
      S("text", { x: sx, y: 180, class: "t", text: "log π(response) = −0.2 − 0.9 − 1.6 = −2.7" }, seq);
      S("text", { x: sx, y: 206, class: "t t-sm t-muted", text: "probability = exp(−2.7) ≈ 0.067" }, seq);
      S("text", { x: sx, y: 246, class: "t t-orange", "font-weight": 600, text: "∇ log π(response) = Σ ∇ log π(token)" }, seq);
      S("text", { x: sx, y: 272, class: "t t-sm", text: compact ? "every token is scaled by the same G" : "every token's gradient is scaled by the same return G" }, seq);
      tl.to(main, { opacity: 0, duration: 0.4 });
      tl.to(seq, { opacity: 1, duration: 0.5 });
      tl.addLabel("s6");
      return tl;
    }
  };
})();
