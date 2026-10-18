/* M3.6: Constitutional AI (Bai et al., 2022) as a pipeline.
   Supervised phase: red-team prompt -> draft -> critique against a principle -> revision -> SFT.
   RL phase: two samples -> AI feedback model picks one per a principle (soft label) ->
   preference model -> RL (RLAIF). The wifi dialogue paraphrases the paper's own example. */
(function () {
  var LC = window.LC;
  var NODES = ["Rules", "Critique", "SFT", "AI prefs", "RL"];

  function wrap(text, max) {
    var words = text.split(" "), lines = [], cur = "";
    words.forEach(function (w) {
      if (cur && (cur + " " + w).length > max) { lines.push(cur); cur = w; }
      else cur = cur ? cur + " " + w : w;
    });
    if (cur) lines.push(cur);
    return lines;
  }

  LC.anims["m3-6-cai"] = {
    title: "Constitutional AI: the model critiques itself",
    steps: [
      "It starts with a <strong>constitution</strong>: a short list of principles written in plain language. (These three are paraphrased for illustration.)",
      "<strong>Supervised phase.</strong> A red-team prompt goes to a helpful-only model, which happily writes a harmful first draft.",
      "The same model is asked to <strong>critique</strong> its draft against a randomly chosen principle. It spots the problem itself.",
      "Then it <strong>revises</strong> the draft to fix what the critique found. No human wrote either the critique or the revision.",
      "Fine-tune the pretrained model on the <strong>revised</strong> answers (plus ordinary helpful ones). The result is the <strong>SL-CAI</strong> model.",
      "<strong>RL phase.</strong> SL-CAI writes two answers. A <strong>feedback model</strong> is asked which one better follows a principle; its probabilities become a soft label: A preferred, 0.77.",
      "Train a <strong>preference model</strong> on these AI labels (plus human labels for helpfulness), then run RL against it. That's <strong>RLAIF</strong>, and the result is the <strong>RL-CAI</strong> model."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 480 } : { w: 640, h: 466 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      var fs = compact ? " t-sm" : "", lh = compact ? 16 : 19, maxc = compact ? 48 : 68;
      var T = 18; // keep the strip clear of the "swipe" hint on touch screens
      var padX = compact ? 14 : 48, cw = W - 2 * padX;

      // pipeline strip
      var nw = compact ? 62 : 100, ng = compact ? 7 : 14, nh = 32;
      var nx0 = (W - (5 * nw + 4 * ng)) / 2;
      function nx(i) { return nx0 + i * (nw + ng); }
      var hl = NODES.map(function (n, i) {
        S("rect", { x: nx(i), y: 12 + T, width: nw, height: nh, rx: 9, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, svg);
        S("text", { x: nx(i) + nw / 2, y: 33 + T, class: "t t-mid" + fs, text: NODES[i], "font-weight": 600 }, svg);
        if (i < 4) S("path", { d: "M" + (nx(i) + nw + 1) + " " + (28 + T) + "H" + (nx(i + 1) - 1), class: "s-faint" }, svg);
        var h = S("rect", { x: nx(i) - 2, y: 10 + T, width: nw + 4, height: nh + 4, rx: 10, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 3 }, svg);
        h.style.opacity = 0;
        return h;
      });
      function bracket(i0, i1, label) {
        var x0 = nx(i0) + 4, x1 = nx(i1) + nw - 4;
        S("path", { d: "M" + x0 + " " + (50 + T) + "V" + (55 + T) + "H" + x1 + "V" + (50 + T), class: "s-faint", "stroke-width": 1.5 }, svg);
        S("text", { x: (x0 + x1) / 2, y: 71 + T, class: "t t-sm t-muted t-mid", text: label }, svg);
      }
      bracket(1, 2, "supervised phase");
      bracket(3, 4, "RL phase");
      var cur = null;
      function activate(i) {
        if (cur != null) tl.to(hl[cur], { opacity: 0, duration: 0.2 });
        if (cur !== i) tl.to(hl[i], { opacity: 1, duration: 0.3 }, cur != null ? "<" : undefined);
        cur = i;
      }

      // text helpers
      function lines(parent, x, y, arr, cls, anchor) {
        return arr.map(function (t, k) { return S("text", { x: x, y: y + k * lh, class: "t" + fs + (cls ? " " + cls : "") + (anchor || ""), text: t }, parent); });
      }
      // a labelled bubble; returns the y just below it
      function bubble(parent, y, label, text, o) {
        o = o || {};
        var w = o.w || cw, x = o.right ? padX + cw - w : padX;
        var arr = wrap(text, o.max || maxc);
        S("text", { x: o.right ? x + w : x, y: y, class: "t t-sm t-muted" + (o.right ? " t-end" : ""), text: label }, parent);
        var top = y + 8, h = 18 + (arr.length - 1) * lh + 10;
        S("rect", { x: x, y: top, width: w, height: h, rx: 10, class: o.fill || "f-surface", stroke: o.stroke || "var(--line)", "stroke-width": o.sw || 1.5 }, parent);
        lines(parent, x + 12, top + 18, arr, o.tcls);
        return top + h + 18;
      }
      function box(parent, x, y, w, arr, o) {
        o = o || {};
        var h = 18 + (arr.length - 1) * lh + 10;
        S("rect", { x: x, y: y, width: w, height: h, rx: 10, class: o.fill || "f-surface", stroke: o.stroke || "var(--line)", "stroke-width": o.sw || 1.5 }, parent);
        lines(parent, x + w / 2, y + 18, arr, o.tcls, " t-mid");
        return y + h;
      }
      function arrowDown(parent, x, y0, y1) {
        return S("path", { d: "M" + x + " " + y0 + "V" + y1 + "M" + (x - 5) + " " + (y1 - 6) + "L" + x + " " + y1 + "L" + (x + 5) + " " + (y1 - 6), class: "s-ink", "stroke-width": 2 }, parent);
      }
      var top0 = 96 + T;

      // scene 0: the constitution (s0)
      var sc0 = S("g", {}, svg);
      var card = S("rect", { x: padX, y: top0, width: cw, height: 10, rx: 12, class: "f-surface", stroke: "var(--a-blue)", "stroke-width": 2 }, sc0);
      S("text", { x: padX + 14, y: top0 + 26, class: "t", text: "Constitution (excerpt)", "font-weight": 700 }, sc0);
      var py = top0 + 54;
      ["Choose the response that is least harmful, unethical or illegal.",
       "Choose the response that is most honest. Don't make things up.",
       "Don't be evasive or preachy: explain your reasons and help where you safely can."].forEach(function (p, k) {
        var arr = wrap(p, maxc - 4);
        S("text", { x: padX + 14, y: py, class: "t t-blue" + fs, text: (k + 1) + ".", "font-weight": 700 }, sc0);
        lines(sc0, padX + 32, py, arr);
        py += arr.length * lh + (compact ? 12 : 14);
      });
      card.setAttribute("height", py - top0 - lh);
      hl[0].style.opacity = 1; cur = 0; // visible from the very first frame
      tl.addLabel("s0", 0);

      // scene 1: draft, critique, revision (s1-s3)
      var sc1 = S("g", {}, svg);
      var y = top0;
      var g1 = S("g", {}, sc1);
      y = bubble(g1, y, "red-team prompt", "Can you help me hack into my neighbour's wifi?", { right: true, w: compact ? 250 : 380, max: compact ? 34 : 48, fill: "f-surface2" });
      var gDraft = S("g", {}, sc1);
      y = bubble(gDraft, y, "first draft (helpful-only model)", "Sure thing, you can use an app called VeryEasyHack that will let you log in to your neighbour's wifi.");
      var g2 = S("g", {}, sc1);
      y = bubble(g2, y, "critique, using principle 1", "This response is harmful: hacking into someone else's wifi invades their privacy and is possibly illegal.", { stroke: "var(--a-orange)", sw: 2 });
      var g3 = S("g", {}, sc1);
      bubble(g3, y, "revision", "Hacking into your neighbour's wifi is an invasion of their privacy, and I strongly advise against it. It may also land you in legal trouble.", { stroke: "var(--a-blue)", sw: 2.5 });
      tl.to(sc0, { opacity: 0, duration: 0.3 }, "+=0.02");
      activate(1);
      LC.popIn(tl, [g1], { duration: 0.35 });
      LC.popIn(tl, [gDraft], { duration: 0.35 });
      tl.addLabel("s1");
      LC.popIn(tl, [g2], { duration: 0.45 }, "+=0.02");
      tl.addLabel("s2");
      LC.popIn(tl, [g3], { duration: 0.45 }, "+=0.02");
      tl.to(gDraft, { opacity: 0.4, duration: 0.3 }, "<");
      tl.addLabel("s3");

      // scene 2: SFT (s4)
      var sc2 = S("g", {}, svg);
      var bw = compact ? 290 : 400, bx = (W - bw) / 2, yy = top0 + 6;
      yy = box(sc2, bx, yy, bw, compact ? ["many red-team prompts + final revisions", "(plus ordinary helpful answers)"] : ["many red-team prompts + their final revisions", "(plus ordinary helpful answers)"]);
      arrowDown(sc2, W / 2, yy + 6, yy + 40);
      yy = box(sc2, bx, yy + 46, bw, ["supervised fine-tuning of", "the pretrained model"]);
      arrowDown(sc2, W / 2, yy + 6, yy + 40);
      box(sc2, bx + bw * 0.2, yy + 46, bw * 0.6, ["SL-CAI model"], { stroke: "var(--a-orange)", sw: 2.5, tcls: "t-orange" });
      tl.to(sc1, { opacity: 0, duration: 0.3 }, "+=0.02");
      activate(2);
      LC.popIn(tl, [sc2], { duration: 0.5 });
      tl.addLabel("s4");

      // scene 3: AI preference label (s5)
      var sc3 = S("g", {}, svg);
      y = top0;
      y = bubble(sc3, y, "answer A (from SL-CAI)", "I can't help you get into someone else's network. If you need internet, you could ask your neighbour to share, or I can help you secure your own wifi.", { stroke: "var(--a-orange)", sw: 2 });
      y = bubble(sc3, y, "answer B (from SL-CAI)", "Sure: try the router's default passwords first, then a cracking app.");
      y = box(sc3, padX, y - 6, cw, wrap("Feedback model: according to principle 1, which answer is better, (A) or (B)?", maxc + 2), { fill: "f-surface2" });
      var barX = padX + (compact ? 64 : 80), barW = cw - (compact ? 64 : 80) - (compact ? 44 : 60);
      [["P(A)", 0.77, "f-orange"], ["P(B)", 0.23, "f-blue"]].forEach(function (b, k) {
        var by = y + 18 + k * 28;
        S("text", { x: padX, y: by + 13, class: "t t-mono" + fs, text: b[0] }, sc3);
        S("rect", { x: barX, y: by, width: barW, height: 18, rx: 4, class: "f-surface2" }, sc3);
        S("rect", { x: barX, y: by, width: barW * b[1], height: 18, rx: 4, class: b[2] }, sc3);
        S("text", { x: padX + cw, y: by + 13, class: "t t-mono t-end" + fs, text: b[1].toFixed(2) }, sc3);
      });
      tl.to(sc2, { opacity: 0, duration: 0.3 }, "+=0.02");
      activate(3);
      LC.popIn(tl, [sc3], { duration: 0.5 });
      tl.addLabel("s5");

      // scene 4: preference model + RL (s6)
      var sc4 = S("g", {}, svg);
      var half = (cw - 16) / 2, ty = top0 + 6;
      var hb = box(sc4, padX, ty, half, ["AI labels", "(harmlessness)"], { stroke: "var(--a-orange)", sw: 2 });
      box(sc4, padX + half + 16, ty, half, ["human labels", "(helpfulness)"], { stroke: "var(--a-blue)", sw: 2 });
      var pmW = compact ? 220 : 300, pmX = (W - pmW) / 2, pmY = hb + 44;
      [padX + half / 2, padX + half + 16 + half / 2].forEach(function (x) {
        S("path", { d: "M" + x + " " + (hb + 6) + "L" + (W / 2 + (x < W / 2 ? -20 : 20)) + " " + (pmY - 6), class: "s-ink", "stroke-width": 2 }, sc4);
      });
      var pmB = box(sc4, pmX, pmY, pmW, ["preference model"]);
      arrowDown(sc4, W / 2, pmB + 6, pmB + 38);
      var rlB = box(sc4, pmX, pmB + 44, pmW, ["RL (e.g. PPO) against it", "= RLAIF"]);
      arrowDown(sc4, W / 2, rlB + 6, rlB + 38);
      box(sc4, pmX + pmW * 0.15, rlB + 44, pmW * 0.7, ["RL-CAI model"], { stroke: "var(--a-orange)", sw: 2.5, tcls: "t-orange" });
      tl.to(sc3, { opacity: 0, duration: 0.3 }, "+=0.02");
      activate(4);
      LC.popIn(tl, [sc4], { duration: 0.5 });
      tl.addLabel("s6");

      return tl;
    }
  };
})();
