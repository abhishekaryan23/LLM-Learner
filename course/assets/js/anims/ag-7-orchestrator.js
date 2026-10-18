/* AG.7: orchestrator-worker. A lead agent splits a broad question into three briefs; three subagents
   work in parallel, each in its own context window; each returns a compact summary; the lead writes
   the answer. Token figures are illustrative: 20k per subagent window, 1k per summary, 6k for the lead. */
(function () {
  var LC = window.LC;

  LC.anims["ag-7-orchestrator"] = {
    title: "One lead, three subagents, three fresh windows",
    steps: [
      "A broad question arrives. One agent could research the three cities one after another, piling every search result into <strong>one context window</strong>.",
      "The <strong>orchestrator</strong> (lead agent) plans, splits the question into three independent parts and writes a short <strong>brief</strong> for each.",
      "Three <strong>subagents</strong> start, each with its <strong>own fresh context window</strong>, its own tools and only its brief. They run <strong>in parallel</strong>.",
      "Each one searches and reads. Its window fills with pages and notes: about 20k tokens each here (illustrative numbers).",
      "Each returns a <strong>compact summary</strong>, about 1k tokens. The messy search results stay behind in the subagent's window.",
      "The orchestrator's window holds only the briefs and three summaries, so it stays small and focused. It writes the final answer.",
      "The trade: <strong>more tokens</strong> in total, but done in about the time of one subagent, with each window kept clean. Anthropic reported multi-agent runs using about <strong>15×</strong> the tokens of a chat."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 468 } : { w: 640, h: 414 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      var L = compact ? 16 : 20, R = W - L;
      var fs = compact ? "t t-sm" : "t";
      // compact: keep the top row free for the player's swipe hint
      var root = S("g", { transform: "translate(0," + (compact ? 22 : 0) + ")" }, svg);

      // ---- question
      S("rect", { x: L, y: 8, width: R - L, height: 36, rx: 9, class: "f-surface", stroke: "var(--a-ink)", "stroke-width": 1.4 }, root);
      S("text", { x: L + 12, y: 31, class: fs + " t-nohalo", text: "Q: How do Paris, Tokyo and NYC run bike-share?", "font-weight": 600 }, root);

      // ---- orchestrator
      var ow = compact ? 200 : 220, ox = (W - ow) / 2, oy = 66, oh = 60;
      S("rect", { x: ox, y: oy, width: ow, height: oh, rx: 10, class: "f-surface2", stroke: "var(--a-orange)", "stroke-width": 2 }, root);
      S("text", { x: ox + 12, y: oy + 20, class: "t t-sm t-nohalo", text: "orchestrator", "font-weight": 650 }, root);
      var fx = ox + 12, fy = oy + 32, fw = ow - 24, fh = 16;
      S("rect", { x: fx, y: fy, width: fw, height: fh, rx: 4, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.2 }, root);
      var oFill = S("rect", { x: fx, y: fy, width: 0, height: fh, rx: 4, class: "f-orange" }, root);
      var oLbl1 = S("text", { x: ox + ow + 8, y: fy + 13, class: "t t-sm t-muted", text: "2k" }, root);
      var oLbl2 = S("text", { x: ox + ow + 8, y: fy + 13, class: "t t-sm t-orange", text: "6k", "font-weight": 650 }, root);
      oLbl1.style.opacity = 0; oLbl2.style.opacity = 0;
      S("text", { x: ox - 8, y: fy + 13, class: "t t-sm t-muted t-end", text: "window" }, root);

      // ---- subagents
      var cx = compact ? [66, 180, 294] : [140, 320, 500];
      var bw = compact ? 96 : 130, by = compact ? 192 : 184, bh = compact ? 136 : 124;
      var names = ["Paris", "Tokyo", "NYC"];
      var subs = [], fills = [], used = [], sent = [];
      var winH = bh - 46, winW = 40, winTop = by + 32;
      names.forEach(function (n, i) {
        var g = S("g", {}, root);
        S("rect", { x: cx[i] - bw / 2, y: by, width: bw, height: bh, rx: 10, class: "f-surface2", stroke: "var(--a-blue)", "stroke-width": 2 }, g);
        S("text", { x: cx[i], y: by + 21, class: "t t-sm t-mid t-nohalo", text: n, "font-weight": 650 }, g);
        S("rect", { x: cx[i] - winW / 2, y: winTop, width: winW, height: winH, rx: 4, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.2 }, g);
        var f = S("rect", { x: cx[i] - winW / 2, y: winTop + winH, width: winW, height: 0, rx: 4, class: "f-blue" }, root);
        g.style.opacity = 0;
        subs.push(g); fills.push(f);
        var u = S("text", { x: cx[i], y: by + bh + 18, class: "t t-sm t-mid t-muted", text: "20k used" }, root);
        var s = S("text", { x: cx[i], y: by + bh + 18, class: "t t-sm t-mid t-blue", text: "1k sent ↑", "font-weight": 650 }, root);
        u.style.opacity = 0; s.style.opacity = 0;
        used.push(u); sent.push(s);
      });

      // ---- arrows
      function arrow(x0, y0, x1, y1, cls) {
        var a = Math.atan2(y1 - y0, x1 - x0), h = 7;
        var line = S("path", { d: "M" + x0 + " " + y0 + "L" + x1 + " " + y1, class: cls, "stroke-width": 2 }, root);
        var head = S("path", { d: "M" + (x1 - h * Math.cos(a - 0.5)) + " " + (y1 - h * Math.sin(a - 0.5)) + "L" + x1 + " " + y1 + "L" + (x1 - h * Math.cos(a + 0.5)) + " " + (y1 - h * Math.sin(a + 0.5)), class: cls, "stroke-width": 2 }, root);
        head.style.opacity = 0;
        return [line, head];
      }
      var down = [], up = [];
      [0, 1, 2].forEach(function (i) {
        var sx = ox + ow * (0.25 + 0.25 * i);
        down.push(arrow(sx - 6, oy + oh + 2, cx[i] - 8, by - 3, "s-orange"));
        up.push(arrow(cx[i] + 8, by - 3, sx + 6, oy + oh + 2, "s-blue"));
      });

      // ---- answer + cost rows
      var ay = by + bh + 34, ah = 34;
      var ans = S("g", {}, root);
      S("rect", { x: L, y: ay, width: R - L, height: ah, rx: 9, class: "f-surface", stroke: "var(--a-orange)", "stroke-width": 2 }, ans);
      S("text", { x: L + 12, y: ay + 22, class: fs + " t-nohalo", text: "Answer: compares all three, with sources", "font-weight": 600 }, ans);
      ans.style.opacity = 0;
      var cost = S("text", { x: L, y: ay + ah + 26, class: fs + " t-orange", text: compact ? "tokens ≈ 3×20k + 6k · time ≈ 1 subagent" : "tokens ≈ 3 × 20k + 6k = 66k · time ≈ one subagent's run", "font-weight": 650 }, root);
      cost.style.opacity = 0;

      tl.addLabel("s0", 0);

      // s1: plan + briefs
      tl.to(oFill, { attr: { width: fw * 0.1 }, duration: 0.5 }, "+=0.02");
      LC.popIn(tl, oLbl1, { duration: 0.3 }, "<");
      down.forEach(function (a) { LC.drawIn(tl, a[0], { duration: 0.4 }, "-=0.2"); tl.to(a[1], { opacity: 1, duration: 0.15 }); });
      tl.addLabel("s1");

      // s2: subagents start
      LC.popIn(tl, subs, { duration: 0.5, stagger: 0.1 }, "+=0.02");
      tl.addLabel("s2");

      // s3: windows fill in parallel
      fills.forEach(function (f, i) {
        tl.to(f, { attr: { y: winTop + winH * 0.25, height: winH * 0.75 }, duration: 1.2, ease: "power1.inOut" }, i ? "<" : "+=0.02");
      });
      tl.to(used, { opacity: 1, duration: 0.3 });
      tl.addLabel("s3");

      // s4: summaries come back
      tl.to(down.map(function (a) { return a[0]; }).concat(down.map(function (a) { return a[1]; })), { opacity: 0.2, duration: 0.3 }, "+=0.02");
      tl.to(used, { opacity: 0, duration: 0.2 }, "<");
      tl.to(sent, { opacity: 1, duration: 0.3 });
      up.forEach(function (a, i) { LC.drawIn(tl, a[0], { duration: 0.4 }, i ? "<" : "+=0.01"); });
      tl.to(up.map(function (a) { return a[1]; }), { opacity: 1, duration: 0.15 });
      tl.addLabel("s4");

      // s5: lead window grows a little; answer written
      tl.to(oFill, { attr: { width: fw * 0.3 }, duration: 0.5 }, "+=0.02");
      tl.to(oLbl1, { opacity: 0, duration: 0.2 }, "<");
      tl.to(oLbl2, { opacity: 1, duration: 0.3 });
      LC.popIn(tl, ans, { duration: 0.4 });
      tl.addLabel("s5");

      // s6: the trade-off
      tl.to(sent, { opacity: 0, duration: 0.2 }, "+=0.02");
      tl.to(used, { opacity: 1, duration: 0.3 });
      LC.popIn(tl, cost, { duration: 0.4 });
      tl.addLabel("s6");
      return tl;
    }
  };
})();
