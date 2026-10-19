/* AR.7: a sentence generated coarse to fine, with a forward-pass counter.
   Toy hierarchy (illustrative; real NCM levels are learned codes, not aligned to words):
   level 1: 1 code, level 2: 2 codes, level 3: 4 codes, level 4: 8 tokens (the last level has one code per token).
   Positions processed per pass = positions of that level: 1, 2, 4, 8 -> cumulative 1, 3, 7, 15.
   Last comparison: one 128-token sample. AR with KV cache: 128 passes, 128 positions. Diffusion with N = 64 steps:
   64 passes x 128 positions = 8,192. NCM with the 12 levels of the released LM1B config
   (1, 8, 16, 24, 32, 40, 52, 64, 76, 92, 108, 128 positions): 12 passes, 641 positions. */
(function () {
  var LC = window.LC;
  var WORDS = ["She", "sold", "the", "old", "boat", "and", "left", "town"];
  var CODES = [["#412"], ["#97", "#3051"], ["#18", "#733", "#2210", "#505"]];
  var COUNT = ["NCM passes: 0 · positions: 0", "NCM passes: 1 · positions: 1", "NCM passes: 2 · positions: 3", "NCM passes: 3 · positions: 7", "NCM passes: 4 · positions: 15"];

  LC.anims["ar-7-levels"] = {
    title: "Writing coarse to fine, one pass per level",
    steps: [
      "A learned tokenizer has turned the sentence into a <strong>hierarchy of codes</strong>: level 1 has one code, level 2 two, level 3 four, and the last level (L4) has one code per token. Generation starts with nothing and fills the levels from the top. (Real models use about 9 to 12 levels; this toy has 4.)",
      "<strong>Pass 1, level 1.</strong> The transformer predicts the single coarsest code, the rough plan for the whole sentence. One forward pass, one position.",
      "<strong>Pass 2, level 2.</strong> Given the level-1 code, it predicts <em>both</em> level-2 codes at once, in one pass. They refine the plan: each now covers half of the sentence.",
      "<strong>Pass 3, level 3.</strong> Four codes, again all in one pass, conditioned on the coarser codes. The positions of a level are sampled in parallel, but each already knows the plan above it.",
      "<strong>Pass 4, the last level.</strong> One code per token, all eight in parallel, and the tokenizer's decoder turns them into the words. <strong>4 passes</strong> and 15 positions processed for 8 tokens, instead of 8 passes.",
      "At a realistic size, one <strong>128-token</strong> sample: an autoregressive model needs 128 passes; a diffusion model with 64 steps needs 64 passes over all 128 positions each; NCM with 12 levels needs 12 passes over 641 positions in total (positions processed shown below each bar).",
      "<strong>Why parallel is safer here.</strong> Recall “New Francisco”. Once a coarse code has fixed “San Francisco”, both blanks are certain, so filling them in the same pass cannot disagree. Without a plan they agree only 1/3 of the time."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 244 } : { w: 640, h: 252 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact", W = ctx.w;
      var tl = gsap.timeline();
      var lx = compact ? 2 : 4, bx0 = compact ? 34 : 56, bwTot = W - bx0 - 4;
      var rowY = compact ? [28, 64, 100, 136] : [28, 72, 116, 160], bh = compact ? 30 : 34; // top 28 units stay free for the swipe hint
      var gTree = S("g", {}, svg), gBars = S("g", {}, svg), gCity = S("g", {}, svg);
      gBars.style.opacity = 0; gCity.style.opacity = 0;
      function swap(a, b, pos) { tl.to(a, { opacity: 0, duration: 0.25 }, pos); LC.popIn(tl, b, { duration: 0.35 }, pos + 0.1); }

      // ---- the tree of levels
      var fills = [], levelEls = [];
      for (var k = 0; k < 4; k++) {
        var n = k === 3 ? 8 : CODES[k].length, gp = compact ? 3 : 4;
        var bw = (bwTot - (n - 1) * gp) / n;
        S("text", { x: lx, y: rowY[k] + bh / 2 + 4, class: "t t-sm t-muted", "font-weight": 600, text: "L" + (k + 1) }, gTree);
        var els = [];
        for (var i = 0; i < n; i++) {
          var x = bx0 + i * (bw + gp);
          S("rect", { x: x, y: rowY[k], width: bw, height: bh, rx: 6, class: "f-faint", "fill-opacity": 0.3 }, gTree);
          var r = S("rect", { x: x, y: rowY[k], width: bw, height: bh, rx: 6, class: k === 3 ? "f-blue" : "f-orange" }, gTree);
          var t = S("text", { x: x + bw / 2, y: rowY[k] + bh / 2 + 4, class: "t t-sm t-mid t-nohalo", style: "fill:#fff", "font-weight": 650, text: k === 3 ? WORDS[i] : CODES[k][i] }, gTree);
          r.style.opacity = 0; t.style.opacity = 0;
          els.push(r, t);
        }
        levelEls.push(els);
      }
      var cy = rowY[3] + bh + (compact ? 30 : 26);
      var cnt = COUNT.map(function (s, i) {
        var t = S("text", { x: bx0, y: cy, class: "t t-sm t-muted", text: s }, gTree);
        t.style.opacity = i === 0 ? 1 : 0; return t;
      });
      S("text", { x: bx0, y: cy + 22, class: "t t-sm t-muted", text: compact ? "the last level has one code per token" : "level L4: one code per token, decoded into words" }, gTree);

      // ---- bars view (128 tokens)
      S("text", { x: 4, y: 18, class: "t t-sm", "font-weight": 650, text: "One 128-token sample" }, gBars);
      var rows = [
        { name: "autoregressive", passes: 128, detail: "128 positions (with KV cache)", cls: "f-blue" },
        { name: "diffusion, N = 64", passes: 64, detail: compact ? "8,192 positions (64 × 128)" : "8,192 positions processed (64 × 128)", cls: "f-faint" },
        { name: "NCM, 12 levels", passes: 12, detail: compact ? "641 positions (1 + 8 + … + 128)" : "641 positions processed (1 + 8 + 16 + … + 128)", cls: "f-orange" }
      ];
      var pitch = compact ? 68 : 70, ry0 = compact ? 44 : 46;
      rows.forEach(function (r, i) {
        var y = ry0 + i * pitch, x0 = 4, x1 = W - 4;
        S("text", { x: x0, y: y, class: "t t-sm", "font-weight": 600, text: r.name }, gBars);
        S("text", { x: x1, y: y, class: "t t-sm t-mono t-end", "font-weight": 650, text: r.passes + " passes" }, gBars);
        S("rect", { x: x0, y: y + 6, width: x1 - x0, height: 18, rx: 4, class: "f-faint", "fill-opacity": 0.3 }, gBars);
        S("rect", { x: x0, y: y + 6, width: Math.max(3, (x1 - x0) * r.passes / 128), height: 18, rx: 4, class: r.cls === "f-faint" ? "f-ink" : r.cls, "fill-opacity": r.cls === "f-faint" ? 0.55 : 1 }, gBars);
        S("text", { x: x0, y: y + 42, class: "t t-sm t-muted", text: r.detail }, gBars);
      });

      // ---- city view
      var cx = compact ? 6 : 60, cw = W - cx - (compact ? 6 : 60);
      S("text", { x: cx, y: 18, class: "t t-sm", "font-weight": 650, text: "A coarse code fixes the plan" }, gCity);
      S("rect", { x: cx, y: 30, width: cw, height: 32, rx: 6, class: "f-orange" }, gCity);
      S("text", { x: cx + cw / 2, y: 51, class: "t t-sm t-mid t-nohalo", style: "fill:#fff", "font-weight": 650, text: compact ? "coarse code: San Francisco" : "coarse code says: the city is San Francisco" }, gCity);
      var half = (cw - 8) / 2;
      [0, 1].forEach(function (i) {
        var x = cx + i * (half + 8);
        S("line", { x1: x + half / 2, x2: x + half / 2, y1: 64, y2: 96, class: "s-faint" }, gCity);
        S("rect", { x: x, y: 98, width: half, height: 32, rx: 6, class: "f-blue" }, gCity);
        S("text", { x: x + half / 2, y: 119, class: "t t-sm t-mid t-nohalo", style: "fill:#fff", "font-weight": 650, text: i ? "Francisco" : "San" }, gCity);
      });
      S("text", { x: cx, y: 158, class: "t t-sm", text: "both blanks are now certain (100%)," }, gCity);
      S("text", { x: cx, y: 178, class: "t t-sm", text: "so one parallel pass cannot disagree." }, gCity);
      S("text", { x: cx, y: 208, class: "t t-sm t-muted", text: compact ? "no plan: the blanks agree 1/3 of the time" : "with no plan above them, the two blanks agree only 1/3 of the time" }, gCity);

      // ---- timeline (absolute step times, so labels are exact)
      tl.addLabel("s0", 0);
      function next(name) { var t = tl.duration() + 0.2; tl.addLabel(name, t); tl.to({}, { duration: 0.01 }, t); return t; }
      var T = 0.3;
      for (var lv = 0; lv < 4; lv++) {
        tl.to(levelEls[lv], { opacity: 1, duration: 0.4, stagger: 0.04 }, T);
        swap(cnt[lv], cnt[lv + 1], T);
        T = next("s" + (lv + 1));
      }
      tl.to(gTree, { opacity: 0, duration: 0.4 }, T);
      tl.to(gBars, { opacity: 1, duration: 0.5 }, T + 0.2);
      T = next("s5");
      tl.to(gBars, { opacity: 0, duration: 0.35 }, T);
      tl.to(gCity, { opacity: 1, duration: 0.5 }, T + 0.2);
      next("s6");
      return tl;
    }
  };
})();
