/* AR.2: expert parallelism. 4 GPUs, 8 experts (2 per GPU), 3 tokens per GPU, top-1.
   Destinations (expert ids): GPU1 [3,1,4], GPU2 [3,7,2], GPU3 [4,3,6], GPU4 [8,4,1].
   Tokens received per GPU: 3, 6, 1, 2 (total 12). Timeline units: attention 50,
   all-to-all 36 each, experts 16 per token -> GPU 2 sets the pace: 50+36+96+36 = 218.
   Overlap with 2 micro-batches (half the work each): 164 units. */
(function () {
  var LC = window.LC;
  var DEST = [[3, 1, 4], [3, 7, 2], [4, 3, 6], [8, 4, 1]];
  var GOT = [3, 6, 1, 2];

  LC.anims["ar-2-alltoall"] = {
    title: "Expert parallelism: dispatch, compute, combine",
    steps: [
      "<strong>Expert parallelism</strong> on 4 GPUs: 8 experts, 2 per GPU. Attention ran data-parallel, so each GPU holds its own 3 tokens (blue).",
      "Each GPU runs the <strong>router</strong> on its own tokens. The number on a token is the expert it chose (top-1 here, to keep the picture simple).",
      "<strong>Dispatch all-to-all:</strong> every token travels to the GPU that holds its expert. Every GPU sends a different packet to every other GPU.",
      "The experts run on whatever arrived (orange = processed). The load is uneven: GPU 2 got 6 tokens, GPU 3 only 1, and the next exchange can't finish until the <strong>slowest GPU</strong> is done.",
      "<strong>Combine all-to-all:</strong> results travel back to each token's home GPU, where they are scaled by the gate and added to the residual stream.",
      "The same layer as a timeline. Two all-to-alls sit on the critical path, and GPUs 1, 3 and 4 <strong>wait</strong> for GPU 2. Balancing (AR.1) shortens the wait; faster links shorten the exchanges.",
      "<strong>Overlap</strong> hides much of the communication: split the batch into two micro-batches, and while one is on the network the other computes. In this toy, one layer drops from 218 to 164 time units. DeepSeek-V3's DualPipe schedule pushes the same idea further."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 290 } : { w: 640, h: 290 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var m = compact ? 8 : 24, pitch = (W - 2 * m) / 4, tok = compact ? 22 : 26, tg = compact ? 5 : 8;
      var tl = gsap.timeline();
      function colX(g) { return m + pitch * g; }
      function colC(g) { return colX(g) + pitch / 2; }
      function readout(t) { return S("text", { x: compact ? 4 : 8, y: 18, class: "t t-sm", text: t }, svg); }
      function swapR(a, b, pos) { tl.to(a, { opacity: 0, duration: 0.25 }, pos); LC.popIn(tl, b, { duration: 0.35 }, "<0.1"); }
      var homeY = 64, expY = 120, arrY = [166, 166 + tok + tg];

      var main = S("g", {}, svg);
      for (var g = 0; g < 4; g++) {
        S("rect", { x: colX(g) + 3, y: 28, width: pitch - 6, height: 226, rx: 10, class: "f-none", stroke: "var(--a-faint)", "stroke-width": 1.5 }, main);
        S("text", { x: colC(g), y: 50, class: "t t-sm t-mid t-muted", "font-weight": 600, text: "GPU " + (g + 1) }, main);
        var ew = compact ? 34 : 48, eg = compact ? 6 : 10;
        for (var e = 0; e < 2; e++) {
          var ex = colC(g) - ew - eg / 2 + e * (ew + eg);
          S("rect", { x: ex, y: expY, width: ew, height: 30, rx: 7, class: "f-surface", stroke: "var(--a-blue)", "stroke-width": 1.5 }, main);
          S("text", { x: ex + ew / 2, y: expY + 20, class: "t t-sm t-mid t-nohalo", text: "E" + (2 * g + e + 1) }, main);
        }
      }
      // tokens
      function slotX(g, i) { return colC(g) - (3 * tok + 2 * tg) / 2 + i * (tok + tg); }
      var toks = [], used = [0, 0, 0, 0];
      DEST.forEach(function (ds, g) {
        ds.forEach(function (d, i) {
          var grp = S("g", {}, main);
          var r = S("rect", { x: 0, y: 0, width: tok, height: tok, rx: 5, class: "f-blue" }, grp);
          var t = S("text", { x: tok / 2, y: tok / 2 + 4.5, class: "t t-sm t-mid t-nohalo", style: "fill:#fff", "font-weight": 650, text: String(d) }, grp);
          t.style.opacity = 0;
          var dg = Math.floor((d - 1) / 2), slot = used[dg]++;
          gsap.set(grp, { x: slotX(g, i), y: homeY });
          toks.push({ g: grp, r: r, t: t, hx: slotX(g, i), dx: slotX(dg, slot % 3), dy: arrY[Math.floor(slot / 3)] });
        });
      });
      var r0 = readout("each GPU: its own tokens + 2 experts");
      tl.addLabel("s0", 0);

      // s1: router picks
      var r1 = readout("router: each token picks an expert");
      swapR(r0, r1);
      LC.popIn(tl, toks.map(function (o) { return o.t; }), { duration: 0.3, stagger: 0.05 });
      tl.addLabel("s1");

      // s2: dispatch
      var r2 = readout("dispatch: all-to-all #1");
      swapR(r1, r2);
      toks.forEach(function (o, i) { tl.to(o.g, { x: o.dx, y: o.dy, duration: 1.0, ease: "power2.inOut" }, i ? "<0.03" : ">"); });
      tl.addLabel("s2");

      // s3: compute
      var cnt = GOT.map(function (n, g) {
        var t = S("text", { x: colC(g), y: 244, class: "t t-sm t-mid" + (n === 6 ? " t-orange" : " t-muted"), "font-weight": n === 6 ? 700 : 400, text: n + (n === 1 ? " token" : " tokens") }, main);
        t.style.opacity = 0; return t;
      });
      var r3 = readout("experts compute; GPU 2 is the straggler");
      swapR(r2, r3);
      LC.popIn(tl, cnt, { duration: 0.3, stagger: 0.05 });
      toks.forEach(function (o, i) { tl.to(o.r, { attr: { class: "f-orange" }, duration: 0.01 }, i ? "<0.06" : ">"); });
      tl.to({}, { duration: 0.2 });
      tl.addLabel("s3");

      // s4: combine
      var r4 = readout("combine: all-to-all #2");
      swapR(r3, r4);
      tl.to(cnt, { opacity: 0, duration: 0.25 }, "<");
      toks.forEach(function (o, i) { tl.to(o.g, { x: o.hx, y: homeY, duration: 1.0, ease: "power2.inOut" }, i ? "<0.03" : ">"); });
      tl.addLabel("s4");

      // s5: timeline
      var tlG = S("g", {}, svg);
      tlG.style.opacity = 0;
      var lx = compact ? 44 : 64, avail = W - lx - (compact ? 10 : 24), sc = avail / 218;
      S("text", { x: W - (compact ? 10 : 24), y: 44, class: "t t-sm t-muted t-end", text: "time →" }, tlG);
      var rowY0 = 56, rowH = 22, rowGap = 34;
      function seg(par, x, y, w, cls, extra) {
        var a = { x: lx + x * sc, y: y, width: Math.max(1, w * sc - 1.5), height: rowH, rx: 4, class: cls };
        for (var k in extra || {}) a[k] = extra[k];
        return S("rect", a, par);
      }
      GOT.forEach(function (n, g) {
        var y = rowY0 + g * rowGap;
        S("text", { x: lx - 6, y: y + 15, class: "t t-sm t-end", text: "GPU " + (g + 1) }, tlG);
        seg(tlG, 0, y, 50, "f-blue");
        seg(tlG, 50, y, 36, "f-ink", { "fill-opacity": 0.55 });
        seg(tlG, 86, y, 16 * n, "f-orange");
        if (n < 6) seg(tlG, 86 + 16 * n, y, 16 * (6 - n), "f-none", { stroke: "var(--a-faint)", "stroke-width": 1.5, "stroke-dasharray": "4 3" });
        seg(tlG, 182, y, 36, "f-ink", { "fill-opacity": 0.55 });
      });
      // legend
      var legY = rowY0 + 4 * rowGap + 8;
      var LEG = [["f-blue", "attention", {}], ["f-ink", "all-to-all", { "fill-opacity": 0.55 }], ["f-orange", "experts", {}], ["f-none", "waiting", { stroke: "var(--a-faint)", "stroke-width": 1.5, "stroke-dasharray": "3 2" }]];
      LEG.forEach(function (L, i) {
        var col = compact ? i % 2 : i, row = compact ? Math.floor(i / 2) : 0;
        var x = (compact ? 14 + col * 170 : lx + col * 130), y = legY + row * 22;
        var a = { x: x, y: y, width: 13, height: 13, rx: 3, class: L[0] };
        for (var k in L[2]) a[k] = L[2][k];
        S("rect", a, tlG);
        S("text", { x: x + 19, y: y + 11, class: "t t-sm t-muted", text: L[1] }, tlG);
      });
      var r5 = readout("one MoE layer, per GPU");
      swapR(r4, r5);
      tl.to(main, { opacity: 0, duration: 0.4 }, "<");
      tl.to(tlG, { opacity: 1, duration: 0.5 });
      tl.addLabel("s5");

      // s6: overlap (GPU 2 only)
      var ov = S("g", {}, svg);
      ov.style.opacity = 0;
      var ox = compact ? 64 : 96, oav = W - ox - (compact ? 10 : 24), os = oav / 218;
      function oseg(x, y, w, cls, extra) {
        var a = { x: ox + x * os, y: y, width: Math.max(1, w * os - 1.5), height: rowH, rx: 4, class: cls };
        for (var k in extra || {}) a[k] = extra[k];
        return S("rect", a, ov);
      }
      var A2A = { "fill-opacity": 0.55 };
      S("text", { x: 4, y: 52, class: "t t-sm", "font-weight": 600, text: "GPU 2, one after another: 218" }, ov);
      [[0, 25, "f-blue"], [25, 18, "f-ink"], [43, 48, "f-orange"], [91, 18, "f-ink"], [109, 25, "f-blue"], [134, 18, "f-ink"], [152, 48, "f-orange"], [200, 18, "f-ink"]].forEach(function (s) {
        oseg(s[0], 62, s[1], s[2], s[2] === "f-ink" ? A2A : {});
      });
      S("text", { x: 4, y: 122, class: "t t-sm t-orange", "font-weight": 600, text: "two micro-batches, overlapped: 164" }, ov);
      S("text", { x: ox - 6, y: 147, class: "t t-sm t-end t-muted", text: "compute" }, ov);
      S("text", { x: ox - 6, y: 177, class: "t t-sm t-end t-muted", text: "network" }, ov);
      [[0, 25, "f-blue"], [25, 25, "f-blue"], [50, 48, "f-orange"], [98, 48, "f-orange"]].forEach(function (s) { oseg(s[0], 132, s[1], s[2]); });
      [[25, 18], [50, 18], [98, 18], [146, 18]].forEach(function (s) { oseg(s[0], 162, s[1], "f-ink", A2A); });
      var oLeg = S("text", { x: 4, y: 222, class: "t t-sm t-muted", text: compact ? "blue attention · grey all-to-all" : "blue = attention · grey = all-to-all · orange = experts" }, ov);
      if (compact) S("text", { x: 4, y: 242, class: "t t-sm t-muted", text: "orange = experts" }, ov);
      var r6 = readout("overlap: compute while the network works");
      swapR(r5, r6);
      tl.to(tlG, { opacity: 0, duration: 0.4 }, "<");
      tl.to(ov, { opacity: 1, duration: 0.5 });
      tl.addLabel("s6");
      return tl;
    }
  };
})();
