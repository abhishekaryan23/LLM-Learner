/* M5.5: one round of speculative sampling (Leviathan et al., 2023; Chen et al., 2023).
   The draft proposes k = 4 tokens; the target scores all of them in ONE forward pass;
   each draft token is accepted with probability min(1, p/q); the first rejection is
   replaced by a sample from norm(max(0, p − q)) and everything after it is dropped.
   Uniform draws used in the story: u2 = 0.42 (< 0.90, accept), u3 = 0.71 (> 0.20, reject). */
(function () {
  var LC = window.LC;
  var TOK = ["mat", "and", "purred", "loudly"];
  var Q = [0.60, 0.50, 0.40, 0.30];
  var P = [0.70, 0.45, 0.08];
  var ACC = P.map(function (p, i) { return Math.min(1, p / Q[i]); }); // 1.00, 0.90, 0.20

  LC.anims["m5-5-spec"] = {
    title: "One round of speculative decoding",
    steps: [
      "Prompt: “The cat sat on the”. Normally the big <strong>target</strong> model runs one full forward pass per token, reading all its weights from memory every time.",
      "A small <strong>draft</strong> model quickly proposes $k = 4$ tokens, one after another. It records its probability $q$ for each token it picked.",
      "The target runs <strong>one forward pass</strong> over the prompt plus all 4 drafts. That gives its own probability $p$ for every draft token, at about the cost of generating one token.",
      "Each draft token is kept with probability $\\min(1, p/q)$. If the target likes a token at least as much as the draft did ($p \\ge q$), it is always kept.",
      "Check left to right with a random $u$: “mat” is kept (prob 1), “and” is kept ($u = 0.42 &lt; 0.90$), “purred” is <strong>rejected</strong> ($u = 0.71 &gt; 0.20$). Everything after a rejection is thrown away.",
      "At the rejected position, sample a replacement from the <strong>residual</strong> $\\max(0, p - q)$, renormalised: tokens the target likes <em>more</em> than the draft did. Here: “slept”.",
      "Result: <strong>3 tokens from one target pass</strong> (plus 4 cheap draft passes). Had all 4 drafts been accepted, the target's prediction after “loudly” would have given a 5th token for free."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 344 } : { w: 640, h: 340 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var labW = compact ? 78 : 170, colW = compact ? 68 : 110, boxW = compact ? 60 : 92, boxH = 30;
      var x0 = compact ? 6 : 20;
      function cx(i) { return x0 + labW + i * colW + colW / 2; }
      var Y = compact
        ? { prompt: 20, sec1: 46, tok: 54, q: 106, sec2: 136, p: 160, acc: 186, ver: 212, sec3: 242, out: 250, resLbl: 298, sum: 330 }
        : { prompt: 22, sec1: 50, tok: 58, q: 110, sec2: 140, p: 164, acc: 190, ver: 216, sec3: 246, out: 254, resLbl: 302, sum: 326 };
      var tl = gsap.timeline();
      function lbl(x, y, txt, cls) { return S("text", { x: x, y: y, class: "t t-sm " + (cls || ""), text: txt }, svg); }
      function hide(els) { [].concat(els).forEach(function (e) { e.style.opacity = 0; }); return els; }
      function box(i, y, txt, cls, txtCls) {
        var g = S("g", {}, svg);
        S("rect", { x: cx(i) - boxW / 2, y: y, width: boxW, height: boxH, rx: 8, class: cls || "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, g);
        S("text", { x: cx(i), y: y + 20, class: "t t-mid " + (compact ? "t-sm " : "") + (txtCls || ""), text: txt }, g);
        return g;
      }

      // ---- s0 ----
      S("text", { x: x0, y: Y.prompt, class: "t", text: compact ? "Prompt: The cat sat on the …" : "Prompt: “The cat sat on the …”" }, svg);
      tl.addLabel("s0", 0);

      // ---- s1: draft proposes ----
      var sec1 = hide(lbl(x0, Y.sec1, compact ? "① draft (small, fast)" : "① draft model (small, fast) proposes k = 4", "t-muted"));
      var qLbl = hide(lbl(x0, Y.q, "q (draft)", "t-blue"));
      var toks = TOK.map(function (t, i) { return hide(box(i, Y.tok, t)); });
      var qv = Q.map(function (q, i) { return hide(S("text", { x: cx(i), y: Y.q, class: "t t-sm t-mono t-mid t-blue", text: q.toFixed(2) }, svg)); });
      LC.popIn(tl, [sec1, qLbl], { duration: 0.3 });
      toks.forEach(function (g, i) {
        LC.popIn(tl, g, { duration: 0.3 });
        LC.popIn(tl, qv[i], { duration: 0.2 });
      });
      tl.addLabel("s1");

      // ---- s2: target, one pass ----
      var sec2 = hide(lbl(x0, Y.sec2, compact ? "② target (big): one pass" : "② target model (big): ONE forward pass over all 4", "t-muted"));
      var pass = hide(S("rect", { x: cx(0) - colW / 2 + 2, y: Y.tok - 4, width: 4 * colW - 4, height: boxH + 8, rx: 10, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 2.5 }, svg));
      var pLbl = hide(lbl(x0, Y.p, "p (target)", "t-orange"));
      var pv = P.map(function (p, i) { return hide(S("text", { x: cx(i), y: Y.p, class: "t t-sm t-mono t-mid t-orange", text: p.toFixed(2) }, svg)); });
      pv.push(hide(S("text", { x: cx(3), y: Y.p, class: "t t-sm t-mono t-mid t-orange", text: "0.25" }, svg)));
      LC.popIn(tl, [sec2, pass], { duration: 0.4 });
      LC.popIn(tl, [pLbl].concat(pv), { duration: 0.4, stagger: 0.08 });
      tl.addLabel("s2");

      // ---- s3: acceptance probabilities ----
      var aLbl = hide(lbl(x0, Y.acc, "min(1, p/q)", ""));
      var av = ACC.map(function (a, i) { return hide(S("text", { x: cx(i), y: Y.acc, class: "t t-sm t-mono t-mid", text: a.toFixed(2), "font-weight": 600 }, svg)); });
      tl.to(pass, { opacity: 0.25, duration: 0.3 });
      LC.popIn(tl, [aLbl].concat(av), { duration: 0.4, stagger: 0.1 });
      tl.addLabel("s3");

      // ---- s4: verdicts, accepted tokens drop to the output row ----
      var vLbl = hide(lbl(x0, Y.ver, "verdict", ""));
      var ver = [["✓ keep", "t-blue"], ["✓ keep", "t-blue"], ["✗ reject", "t-orange"], ["dropped", "t-muted"]].map(function (v, i) {
        return hide(S("text", { x: cx(i), y: Y.ver, class: "t t-sm t-mid " + v[1], text: v[0], "font-weight": 600 }, svg));
      });
      var sec3 = hide(lbl(x0, Y.sec3, compact ? "③ output" : "③ output of this round", "t-muted"));
      var out = [box(0, Y.out, "mat", "f-surface"), box(1, Y.out, "and", "f-surface")];
      hide(out);
      var strike = S("path", { d: "M" + (cx(3) - boxW / 2 + 6) + " " + (Y.tok + boxH / 2) + "H" + (cx(3) + boxW / 2 - 6), class: "s-orange", "stroke-width": 2.5 }, svg);
      LC.popIn(tl, [vLbl, ver[0]], { duration: 0.3 });
      LC.popIn(tl, [sec3, out[0]], { duration: 0.3 });
      LC.popIn(tl, ver[1], { duration: 0.3 }, "+=0.2");
      LC.popIn(tl, out[1], { duration: 0.3 });
      LC.popIn(tl, ver[2], { duration: 0.3 }, "+=0.2");
      tl.to([toks[2], toks[3]], { opacity: 0.35, duration: 0.3 });
      LC.drawIn(tl, strike, { duration: 0.3 });
      LC.popIn(tl, ver[3], { duration: 0.3 }, "<");
      tl.addLabel("s4");

      // ---- s5: resample from the residual ----
      var slept = hide(box(2, Y.out, "slept", "f-surface", "t-orange"));
      var ring = hide(S("rect", { x: cx(2) - boxW / 2 - 3, y: Y.out - 3, width: boxW + 6, height: boxH + 6, rx: 10, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 2.5 }, svg));
      var resTxt = hide(S("text", { x: compact ? cx(2) : cx(2), y: Y.resLbl, class: "t t-sm t-mid t-orange", text: compact ? "max(0, p−q)" : "from max(0, p − q)" }, svg));
      LC.popIn(tl, [slept, ring], { duration: 0.4 });
      LC.popIn(tl, resTxt, { duration: 0.3 });
      tl.addLabel("s5");

      // ---- s6: summary ----
      var sum = hide(S("text", compact
        ? { x: W / 2, y: Y.sum, class: "t t-mid", text: "1 target pass → 3 tokens", "font-weight": 650 }
        : { x: cx(3) + colW / 2, y: Y.sum, class: "t t-end", text: "1 target pass → 3 tokens", "font-weight": 650 }, svg));
      tl.to(ring, { opacity: 0, duration: 0.2 });
      LC.popIn(tl, sum, { duration: 0.4 });
      tl.addLabel("s6");
      return tl;
    }
  };
})();
