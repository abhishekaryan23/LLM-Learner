/* M3.1: from a base model's continuation to one SFT training example:
   chat template with role tokens, next-token targets, loss mask on the prompt,
   and the mean cross-entropy over the assistant tokens only.
   Probabilities are illustrative: p(Lima)=0.25, p(.)=0.80, p(<end>)=0.50
   -> losses 1.39, 0.22, 0.69 -> mean 0.77. After one step (illustrative):
   0.40, 0.85, 0.60 -> 0.92, 0.16, 0.51 -> mean 0.53. */
(function () {
  var LC = window.LC;
  var TOKS = ["<user>", "Capital", "of", "Peru", "?", "<asst>", "Lima", ".", "<end>"];
  var ROLE = { 0: 1, 5: 1, 8: 1 };
  var FIRST_ANS = 5;                 // positions >= 5 predict assistant tokens
  var LOSS = { 5: "1.39", 6: "0.22", 7: "0.69" };
  var LOSS2 = { 5: "0.92", 6: "0.16", 7: "0.51" };

  LC.anims["m3-1-sft"] = {
    title: "One SFT example, as the model sees it",
    steps: [
      "A <strong>base model</strong> only continues documents. Asked “Capital of Peru?”, it may continue a quiz list instead of answering.",
      "SFT data is pairs of <strong>prompt → ideal response</strong>, written by people or, increasingly, by stronger models and then filtered. Here the ideal response is just “Lima.”",
      "A <strong>chat template</strong> turns the conversation into one token stream, with special <strong>role tokens</strong> (orange) marking who speaks and where the reply ends.",
      "Training is still <strong>next-token prediction</strong>: at every position the target is simply the following token.",
      "But we <strong>mask the prompt</strong>: those targets get label −100 and add nothing to the loss. Only the assistant's tokens, including <code>&lt;end&gt;</code>, are trained.",
      "The model gave “Lima” probability 0.25, so that token's loss is $-\\log 0.25 = 1.39$. The <strong>SFT loss</strong> is the mean over the 3 trained tokens: <strong>0.77</strong>.",
      "A gradient step makes this reply more likely after this prompt (numbers illustrative). Repeat over thousands of demos and the model learns to <strong>answer, then stop</strong>."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 296 } : { w: 640, h: 236 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var tl = gsap.timeline();

      // ---------- phase A: base model vs demonstration ----------
      var A = S("g", {}, svg);
      var ax = compact ? 14 : 40, aw = W - 2 * ax;
      var ay = compact ? 18 : 0;
      function bubble(y, label, text, opts) {
        y += ay;
        var g = S("g", {}, A);
        S("text", { x: ax, y: y, class: "t t-sm t-muted", text: label }, g);
        var tw = opts.w || aw;
        S("rect", { x: ax, y: y + 8, width: tw, height: 34, rx: 10, class: "f-surface", stroke: opts.stroke || "var(--line)", "stroke-width": 1.5, "stroke-dasharray": opts.dash || "none" }, g);
        S("text", { x: ax + 12, y: y + 30, class: "t" + (opts.cls ? " " + opts.cls : ""), text: text }, g);
        return g;
      }
      var gPrompt = bubble(22, "prompt", "Capital of Peru?", { w: compact ? 170 : 220 });
      var gBase = bubble(88, compact ? "base model continues:" : "base model continues the “document”:", "Capital of Chile? Capital of Spain? …", { cls: "t-muted", stroke: "var(--a-faint)", dash: "5 4" });
      var gDemo = bubble(154, compact ? "SFT demo: ideal response" : "SFT demonstration: the ideal response (from a person)", "Lima.", { stroke: "var(--a-blue)", w: compact ? 170 : 220 });
      var noTag = S("text", { x: ax + aw - 10, y: 88 + ay, class: "t t-sm t-muted t-end", text: "✗ not an answer" }, A);
      void gPrompt; void gBase;
      tl.addLabel("s0", 0);
      LC.popIn(tl, gDemo, { duration: 0.5 }, "+=0.05");
      tl.addLabel("s1");

      // ---------- phase B: the token stream ----------
      var B = S("g", {}, svg);
      B.style.opacity = 0;
      var bw = compact ? 60 : 58, gap = compact ? 8 : 6, bh = 32;
      var x0 = compact ? 14 : 62;
      var rows = compact ? [{ y: 34, from: 0, to: 5 }, { y: 150, from: 5, to: 9 }] : [{ y: 60, from: 0, to: 9 }];
      var pos = TOKS.map(function (_, i) {
        var r = rows[0];
        rows.forEach(function (rr) { if (i >= rr.from && i < rr.to) r = rr; });
        return { x: x0 + (i - r.from) * (bw + gap) + bw / 2, y: r.y };
      });
      var tgY = 24 + bh, lossY = 46 + bh;   // offsets below the box top
      if (!compact) {
        S("text", { x: x0 - 8, y: rows[0].y + 21, class: "t t-sm t-muted t-end", text: "input" }, B);
        S("text", { x: x0 - 8, y: rows[0].y + tgY, class: "t t-sm t-muted t-end", text: "target" }, B);
      }
      var boxes = TOKS.map(function (t, i) {
        var g = S("g", {}, B), p = pos[i], role = ROLE[i];
        S("rect", { x: p.x - bw / 2, y: p.y, width: bw, height: bh, rx: 8, class: "f-surface", stroke: role ? "var(--a-orange)" : "var(--line)", "stroke-width": role ? 2 : 1.5 }, g);
        S("text", { x: p.x, y: p.y + 21, class: "t t-mid" + (role ? " t-orange t-sm" : ""), text: t, "font-weight": role ? 600 : 450 }, g);
        return g;
      });
      tl.to(A, { opacity: 0, duration: 0.4 });
      tl.set(B, { opacity: 1 });
      LC.popIn(tl, boxes, { duration: 0.25, stagger: 0.06 });
      tl.addLabel("s2");

      // targets
      var targets = [], lossLbl = null;
      TOKS.forEach(function (t, i) {
        if (i === TOKS.length - 1) return;
        var p = pos[i];
        targets[i] = S("text", { x: p.x, y: p.y + tgY, class: "t t-sm t-mono t-mid", text: TOKS[i + 1] }, B);
      });
      if (!compact) lossLbl = S("text", { x: x0 - 8, y: rows[0].y + lossY, class: "t t-sm t-muted t-end", text: "loss" }, B);
      LC.popIn(tl, targets.filter(Boolean), { duration: 0.2, stagger: 0.07 });
      tl.addLabel("s3");

      // mask
      var dashes = [], ansT = [];
      for (var i = 0; i < FIRST_ANS; i++) {
        dashes.push(S("text", { x: pos[i].x, y: pos[i].y + lossY, class: "t t-sm t-muted t-mid", text: "masked" }, B));
      }
      for (i = FIRST_ANS; i < TOKS.length - 1; i++) {
        ansT.push(S("text", { x: pos[i].x, y: pos[i].y + tgY, class: "t t-sm t-mono t-mid t-blue", text: TOKS[i + 1], "font-weight": 700 }, B));
      }
      tl.to(targets.slice(0, FIRST_ANS), { opacity: 0.3, duration: 0.4 });
      tl.to(targets.slice(FIRST_ANS), { opacity: 0, duration: 0.3 }, "<");
      LC.popIn(tl, ansT, { duration: 0.3 }, "<");
      LC.popIn(tl, (lossLbl ? [lossLbl] : []).concat(dashes), { duration: 0.3, stagger: 0.04 });
      tl.addLabel("s4");

      // losses + mean
      var sumY = compact ? 268 : 168;
      var l1 = [], l2 = [];
      for (i = FIRST_ANS; i < TOKS.length - 1; i++) {
        l1.push(S("text", { x: pos[i].x, y: pos[i].y + lossY, class: "t t-sm t-mono t-mid t-orange", text: LOSS[i], "font-weight": 700 }, B));
        l2.push(S("text", { x: pos[i].x, y: pos[i].y + lossY, class: "t t-sm t-mono t-mid t-blue", text: LOSS2[i], "font-weight": 700 }, B));
      }
      var sum1 = S("text", { x: W / 2, y: sumY, class: "t t-mono t-mid" + (compact ? " t-sm" : ""), text: "loss = (1.39 + 0.22 + 0.69) / 3 = 0.77" }, B);
      LC.popIn(tl, l1, { duration: 0.25, stagger: 0.12 });
      LC.popIn(tl, sum1, { duration: 0.4 });
      tl.addLabel("s5");

      // after one step
      var sum2 = S("text", { x: W / 2, y: sumY + (compact ? -2 : 30), class: "t t-mono t-mid t-blue" + (compact ? " t-sm" : ""), text: (compact ? "after a step: " : "after one step: ") + "(0.92 + 0.16 + 0.51) / 3 = 0.53" }, B);
      tl.to(l1, { opacity: 0, duration: 0.3 });
      LC.popIn(tl, l2, { duration: 0.3 }, "<");
      if (compact) tl.to(sum1, { opacity: 0, duration: 0.3 }, "<");
      else tl.to(sum1, { opacity: 0.45, duration: 0.3 }, "<");
      LC.popIn(tl, sum2, { duration: 0.4 });
      tl.addLabel("s6");
      return tl;
    }
  };
})();
