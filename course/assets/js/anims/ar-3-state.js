/* AR.3: a Transformer's KV cache grows by one entry per token; an SSM carries one
   fixed-size state. Memory bars: KV = 1 unit per token, SSM state = 4 units (constant).
   At 1M tokens: Llama 3.1 8B KV cache 131,072 B/token -> ~131 GB; Mamba-2.8B state
   (64 x 5120 x 16 + 64 x 5120 x 4 conv) ~ 6.6M numbers ~ 26 MB in fp32.
   Mamba's per-token step sizes Delta are illustrative. */
(function () {
  var LC = window.LC;
  var TOK = ["The", "cat", "sat", "on", "the", "red", "mat", "."];
  var DELTA = [0.15, 0.9, 0.6, 0.2, 0.1, 0.55, 0.85, 0.3];
  var CELLS = [[0.3, 0.6, 0.2, 0.5], [0.8, 0.3, 0.6, 0.4], [0.5, 0.9, 0.4, 0.7]];

  LC.anims["ar-3-state"] = {
    title: "A growing KV cache versus a fixed-size state",
    steps: [
      "Eight tokens arrive one at a time. Two ways to remember them: a Transformer's <strong>KV cache</strong>, and a state-space model's single <strong>state</strong>.",
      "After 3 tokens the Transformer has stored 3 entries (one key and value per token, in every layer). The SSM has folded all 3 into its state $h_3$, which is the same size it always is. Early on, the state can even be the bigger of the two.",
      "After 8 tokens the cache holds 8 entries and keeps growing. The SSM state was <strong>updated in place</strong>: $h_t = \\bar A h_{t-1} + \\bar B x_t$. Each new token costs it the same work and no extra memory.",
      "Scale it up to <strong>1,000,000 tokens</strong>: Llama 3.1 8B's cache would need about 131 GB for one sequence. Mamba-2.8B's state stays about 26 MB, exactly what it was at token 8.",
      "<strong>Mamba</strong> makes the update selective: each token gets its own step size $\\Delta_t$. Large $\\Delta_t$ (cat, mat) means “write me into the state”; small $\\Delta_t$ (the) means “skip me, keep the memory”.",
      "The price: ask for the <strong>exact</strong> second token. Attention reads its cache entry directly. The SSM only has what survived compression in its state, which may not include it. That's the recall weakness hybrids fix."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 322 } : { w: 640, h: 322 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var m = compact ? 12 : 24, pitch = (W - 2 * m) / 8, cw = pitch - (compact ? 4 : 10);
      function cx(i) { return m + pitch * (i + 0.5); }
      var tl = gsap.timeline();
      function readout(t) { return S("text", { x: compact ? 4 : 8, y: 18, class: "t t-sm", text: t }, svg); }
      function swapR(a, b, pos) { tl.to(a, { opacity: 0, duration: 0.25 }, pos); LC.popIn(tl, b, { duration: 0.35 }, "<0.1"); }
      var tokY = 30, kvY = 84, kvH = 20, stY = 152, stH = 24;

      // tokens
      var tokR = TOK.map(function (t, i) {
        var g = S("g", {}, svg);
        S("rect", { x: cx(i) - cw / 2, y: tokY, width: cw, height: 24, rx: 6, class: "f-surface", stroke: "var(--a-ink)", "stroke-width": 1.2 }, g);
        S("text", { x: cx(i), y: tokY + 17, class: "t t-sm t-mid t-nohalo", text: t }, g);
        return g;
      });
      S("text", { x: 4, y: 76, class: "t t-sm", "font-weight": 600, text: compact ? "Transformer: KV cache" : "Transformer: KV cache (one entry per token)" }, svg);
      S("text", { x: 4, y: 138, class: "t t-sm", "font-weight": 600, text: compact ? "SSM: one fixed state" : "SSM: one fixed-size state, updated in place" }, svg);
      // KV blocks
      var kvw = Math.min(cw - 6, 40);
      var kv = TOK.map(function (_, i) {
        var r = S("rect", { x: cx(i) - kvw / 2, y: kvY, width: kvw, height: kvH, rx: 4, class: "f-blue" }, svg);
        r.style.opacity = 0; return r;
      });
      // state box (4 cells)
      var cell = compact ? 13 : 16, sw = 4 * cell + 3 * 2 + 8;
      var st = S("g", {}, svg);
      S("rect", { x: 0, y: 0, width: sw, height: stH, rx: 6, class: "f-surface", stroke: "var(--a-orange)", "stroke-width": 2 }, st);
      var cells = [0, 1, 2, 3].map(function (k) {
        return S("rect", { x: 4 + k * (cell + 2), y: (stH - cell) / 2, width: cell, height: cell, rx: 2, class: "f-orange", "fill-opacity": 0.4 }, st);
      });
      st.style.opacity = 0;
      function stX(i) { return Math.max(m, Math.min(W - m - sw, cx(i) - sw / 2)); }
      gsap.set(st, { x: stX(2), y: stY });
      var hLbl = S("text", { x: stX(2) - 6, y: stY + 17, class: "t t-sm t-orange t-end", "font-weight": 650, text: "h₃" }, svg);
      hLbl.style.opacity = 0;
      var hLbl8 = S("text", { x: stX(7) - 6, y: stY + 17, class: "t t-sm t-orange t-end", "font-weight": 650, text: "h₈" }, svg);
      hLbl8.style.opacity = 0;

      // memory bars
      var memY = 226, bx = compact ? 78 : 100, bmax = W - bx - (compact ? 8 : 24), unit = bmax / 9;
      S("text", { x: 4, y: memY, class: "t t-sm t-muted", text: "memory per sequence" }, svg);
      S("text", { x: 4, y: memY + 26, class: "t t-sm t-blue", text: "KV cache" }, svg);
      S("text", { x: 4, y: memY + 66, class: "t t-sm t-orange", text: "SSM state" }, svg);
      var kvBar = S("rect", { x: bx, y: memY + 14, width: 0.01, height: 16, rx: 3, class: "f-blue" }, svg);
      var stBar = S("rect", { x: bx, y: memY + 54, width: 0.01, height: 16, rx: 3, class: "f-orange" }, svg);
      function valT(y, cls, t) { var n = S("text", { x: W - (compact ? 4 : 12), y: y, class: "t t-sm t-mono t-end " + cls, text: t }, svg); n.style.opacity = 0; return n; }
      var kv3 = valT(memY + 8, "t-blue", "3 entries"), kv8 = valT(memY + 8, "t-blue", "8 entries"), kvM = valT(memY + 8, "t-blue", "1M tokens ≈ 131 GB");
      var st1 = valT(memY + 48, "t-orange", "fixed"), stM = valT(memY + 48, "t-orange", "still ≈ 26 MB");
      var r0 = readout("tokens arrive one at a time");
      tl.addLabel("s0", 0);

      // s1: three tokens
      var r1 = readout("after 3 tokens");
      swapR(r0, r1);
      LC.popIn(tl, kv.slice(0, 3), { duration: 0.3, stagger: 0.15 });
      LC.popIn(tl, [st, hLbl], { duration: 0.4 }, "<");
      CELLS.forEach(function (c, k) { cells.forEach(function (r, j) { tl.to(r, { attr: { "fill-opacity": c[j] }, duration: 0.15 }, k || j ? "<" : ">"); }); tl.to({}, { duration: 0.1 }); });
      tl.to(kvBar, { attr: { width: 3 * unit }, duration: 0.6 }, "<");
      tl.to(stBar, { attr: { width: 4 * unit }, duration: 0.6 }, "<");
      LC.popIn(tl, [kv3, st1], { duration: 0.3 });
      tl.addLabel("s1");

      // s2: eight tokens
      var r2 = readout("after 8 tokens");
      swapR(r1, r2);
      tl.to(kv3, { opacity: 0, duration: 0.2 }, "<");
      LC.popIn(tl, kv.slice(3), { duration: 0.25, stagger: 0.12 });
      tl.to(st, { x: stX(7), duration: 1.0, ease: "power1.inOut" }, "<");
      tl.to(hLbl, { opacity: 0, duration: 0.3 }, "<");
      [[0.6, 0.2, 0.8, 0.3], [0.4, 0.7, 0.5, 0.9]].forEach(function (c) { cells.forEach(function (r, j) { tl.to(r, { attr: { "fill-opacity": c[j] }, duration: 0.2 }, "<0.1"); }); });
      tl.to(kvBar, { attr: { width: 8 * unit }, duration: 0.7 }, "<");
      LC.popIn(tl, [kv8, hLbl8], { duration: 0.3 });
      tl.addLabel("s2");

      // s3: a million tokens
      var r3 = readout("now imagine 1,000,000 tokens");
      swapR(r2, r3);
      tl.to([kv8, st1], { opacity: 0, duration: 0.2 }, "<");
      tl.to(kvBar, { attr: { width: bmax }, duration: 0.8, ease: "power2.in" });
      tl.to(stBar, { attr: { width: 0.6 }, duration: 0.6 }, "<");
      LC.popIn(tl, [kvM, stM], { duration: 0.4 });
      tl.addLabel("s3");

      // s4: selective delta bars
      var dBase = 204, dMax = 50;
      var dBars = DELTA.map(function (d, i) {
        var r = S("rect", { x: cx(i) - kvw / 2, y: dBase - d * dMax, width: kvw, height: d * dMax, rx: 3, class: d > 0.5 ? "f-orange" : "f-faint" }, svg);
        r.style.opacity = 0; return r;
      });
      var dLbl = S("text", { x: W - (compact ? 4 : 12), y: stY - 8, class: "t t-sm t-end t-muted", text: "bar = Δₜ" }, svg);
      dLbl.style.opacity = 0;
      var r4 = readout("Mamba: a step size Δₜ per token");
      swapR(r3, r4);
      tl.to([st, hLbl8], { opacity: 0, duration: 0.3 }, "<");
      LC.popIn(tl, dBars, { duration: 0.3, stagger: 0.07 });
      LC.popIn(tl, [dLbl], { duration: 0.3 }, "<");
      tl.addLabel("s4");

      // s5: exact recall
      var arc = S("path", { d: "M" + cx(7) + " " + (kvY + kvH + 2) + "C" + cx(7) + " " + (kvY + kvH + 24) + " " + cx(1) + " " + (kvY + kvH + 24) + " " + cx(1) + " " + (kvY + kvH + 4), class: "s-blue", "stroke-width": 2 }, svg);
      var head = S("path", { d: "M" + (cx(1) - 5) + " " + (kvY + kvH + 11) + "L" + cx(1) + " " + (kvY + kvH + 3) + "L" + (cx(1) + 5) + " " + (kvY + kvH + 11), class: "s-blue", "stroke-width": 2 }, svg);
      head.style.opacity = 0;
      var q = S("text", { x: stX(7) - 8, y: stY + 17, class: "t t-sm t-end t-orange", text: compact ? "“cat” exactly? maybe lost" : "token 2 exactly? only if it survived compression" }, svg);
      q.style.opacity = 0;
      var r5 = readout("recall the 2nd token exactly?");
      swapR(r4, r5);
      tl.to(dBars.concat([dLbl]), { opacity: 0, duration: 0.3 }, "<");
      tl.to(kv[1], { attr: { class: "f-orange" }, duration: 0.01 }, "<");
      tl.to(tokR[1], { opacity: 1, duration: 0.01 }, "<");
      LC.drawIn(tl, arc, { duration: 0.6 });
      LC.popIn(tl, [head], { duration: 0.2 });
      tl.to([st], { opacity: 1, duration: 0.3 });
      LC.popIn(tl, [q], { duration: 0.3 });
      tl.addLabel("s5");
      return tl;
    }
  };
})();
