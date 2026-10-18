/* AG.2: what fills a 200k-token context window over one long agent session, and how
   context engineering empties it again. Illustrative numbers (thousands of tokens);
   the tool-definition figure follows Anthropic's Nov 2025 example (5 MCP servers,
   58 tools ≈ 55k tokens, ≈ 9k with on-demand tool search).
   Totals: s1 60k, s2 75k, s3 180k, s5 85k, s6 31k. */
(function () {
  var LC = window.LC;
  var LIMIT = 200, SCALE = 60;
  // value per step index 0..6 (k tokens)
  var ROWS = [
    { n: "System prompt", c: "System prompt", cls: "f-ink", op: 0.85, v: [0, 3, 3, 3, 3, 3, 3] },
    { n: "Rules files", c: "Rules files", cls: "f-ink", op: 0.5, v: [0, 2, 2, 2, 2, 2, 2] },
    { n: "Tool definitions", c: "Tool definitions", cls: "f-blue", op: 0.45, v: [0, 55, 55, 55, 55, 55, 9] },
    { n: "Retrieved documents", c: "Documents", cls: "f-blue", op: 0.9, v: [0, 0, 15, 15, 15, 15, 5] },
    { n: "Tool results", c: "Tool results", cls: "f-orange", op: 0.5, v: [0, 0, 0, 50, 50, 4, 4] },
    { n: "Conversation history", c: "History", cls: "f-orange", op: 0.9, v: [0, 0, 0, 55, 55, 6, 6] },
    { n: "Notes & summaries", c: "Notes", cls: "f-faint", op: 1, v: [0, 0, 0, 0, 0, 0, 2] }
  ];
  function total(s) { return ROWS.reduce(function (a, r) { return a + r.v[s]; }, 0); }

  LC.anims["ag-2-window"] = {
    title: "Filling, and emptying, a context window",
    steps: [
      "The <strong>context window</strong> is the model's working memory, with a hard limit. Here it holds 200k tokens (illustrative; 2026 models range from about 128k to over a million).",
      "Before you type a word, the <strong>system prompt</strong>, <strong>rules files</strong> and <strong>tool definitions</strong> are loaded. Five MCP servers with 58 tools took about 55k tokens in one published example: 30% of the window is gone.",
      "The task starts: the agent retrieves <strong>documents</strong> it might need. 75k used.",
      "An hour of work later, old <strong>tool results</strong> (file reads, test logs) and the <strong>conversation history</strong> have piled up: 180k of 200k. Most of it is no longer needed.",
      "Long, cluttered context hurts quality, not just cost. Models use the <strong>start and end</strong> of their input best and often miss facts in the <strong>middle</strong> (“lost in the middle”).",
      "<strong>Compaction</strong>: summarise the history into a few thousand tokens and clear old tool results. 85k used, and the important decisions are still there.",
      "Load <strong>tool definitions on demand</strong>, retrieve <strong>just in time</strong>, and keep <strong>notes</strong> outside the window, reading back only what matters. 31k: the model now sees mostly what it needs."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 370 } : { w: 640, h: 352 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      var L = compact
        ? { lx: 4, bx: 120, bmax: 186, top: 40, rowH: 30, bh: 16, tY: 274, tBar: 284, tH: 24, tx0: 4, tx1: 356, mY: 334, cls: "t t-sm" }
        : { lx: 8, bx: 190, bmax: 360, top: 40, rowH: 30, bh: 16, tY: 270, tBar: 280, tH: 26, tx0: 8, tx1: 632, mY: 330, cls: "t" };
      function bw(v) { return v / SCALE * L.bmax; }
      var tW = L.tx1 - L.tx0;
      function tx(v) { return v / LIMIT * tW; }

      S("text", { x: L.lx, y: 16, class: "t t-sm t-muted", text: compact ? "Thousands of tokens (illustrative)" : "What is in the window, in thousands of tokens (illustrative)" }, svg);

      // per-row bars + value labels (one label per distinct value, cross-faded)
      var bars = [], labels = [];
      ROWS.forEach(function (r, i) {
        var y = L.top + i * L.rowH;
        S("text", { x: L.lx, y: y + L.bh - 3, class: L.cls, text: compact ? r.c : r.n }, svg);
        bars.push(S("rect", { x: L.bx, y: y, width: 0, height: L.bh, rx: 3, class: r.cls, "fill-opacity": r.op }, svg));
        var lab = {};
        r.v.forEach(function (v, s) {
          if (v === 0 || lab[v + "@" + s]) return;
          if (s > 0 && r.v[s - 1] === v) return; // same value as before: reuse
          var t = S("text", { x: L.bx + bw(v) + 6, y: y + L.bh - 3, class: "t t-sm t-mono t-muted", text: v + "k" }, svg);
          t.style.opacity = 0;
          lab[v + "@" + s] = t;
        });
        labels.push(lab);
      });

      // whole-window stacked bar
      S("rect", { x: L.tx0, y: L.tBar, width: tW, height: L.tH, rx: 4, class: "f-none", stroke: "var(--ink-2)", "stroke-width": 1.5, "stroke-dasharray": "5 4" }, svg);
      var segs = ROWS.map(function (r) {
        return S("rect", { x: L.tx0, y: L.tBar, width: 0, height: L.tH, class: r.cls, "fill-opacity": r.op, stroke: "var(--a-paper)", "stroke-width": 1 }, svg);
      });
      var totLabels = {};
      [0, 1, 2, 3, 5, 6].forEach(function (s) {
        var t = total(s);
        var txt = (compact ? "Whole window: " : "Whole window: ") + t + "k of " + LIMIT + "k used" + (compact ? "" : " (" + Math.round(t / LIMIT * 100) + "%)");
        var e = S("text", { x: L.tx0, y: L.tY, class: "t t-sm", "font-weight": 600, text: txt }, svg);
        e.style.opacity = s === 0 ? 1 : 0;
        totLabels[s] = e;
      });
      // "lost in the middle" markers (step 4)
      var uEnd = L.tx0 + tx(total(3)), uW = tx(total(3));
      var mid = [
        S("text", { x: L.tx0, y: L.mY, class: "t t-sm t-blue", "font-weight": 600, text: "start: used well" }, svg),
        S("text", { x: L.tx0 + uW / 2, y: L.mY + (compact ? 22 : 0), class: "t t-sm t-orange t-mid", "font-weight": 650, text: "middle: often missed" }, svg),
        S("text", { x: uEnd, y: L.mY, class: "t t-sm t-blue t-end", "font-weight": 600, text: "end: used well" }, svg)
      ];
      var brace = S("path", { d: "M" + (L.tx0 + uW * 0.3) + " " + (L.tBar + L.tH + 8) + "h" + (uW * 0.4), class: "s-orange", "stroke-width": 3 }, svg);
      mid.forEach(function (m) { m.style.opacity = 0; });

      tl.addLabel("s0", 0);
      var lastTot = 0;
      for (var s = 1; s <= 6; s++) {
        if (s === 4) {
          LC.drawIn(tl, brace, { duration: 0.5 });
          LC.popIn(tl, mid, { duration: 0.4, stagger: 0.1 }, "<");
          tl.addLabel("s4");
          continue;
        }
        if (s === 5) tl.to(mid.concat([brace]), { opacity: 0, duration: 0.3 });
        var first = true;
        ROWS.forEach(function (r, i) {
          var prev = r.v[s === 5 ? 3 : s - 1], v = r.v[s];
          if (prev === v) return;
          tl.to(bars[i], { attr: { width: bw(v) }, duration: 0.7, ease: "power2.inOut" }, first ? undefined : "<0.05");
          first = false;
          var old = labels[i][prev + "@" + findStart(r, prev, s)], nu = labels[i][v + "@" + s];
          if (old) tl.to(old, { opacity: 0, duration: 0.2 }, "<");
          if (nu) tl.to(nu, { opacity: 1, duration: 0.3 }, "<0.4");
        });
        // stacked bar
        var acc = 0;
        ROWS.forEach(function (r, i) {
          tl.to(segs[i], { attr: { x: L.tx0 + tx(acc), width: tx(r.v[s]) }, duration: 0.6, ease: "power2.inOut" }, i ? "<" : ">-0.2");
          acc += r.v[s];
        });
        tl.to(totLabels[lastTot], { opacity: 0, duration: 0.2 }, "<");
        tl.to(totLabels[s], { opacity: 1, duration: 0.3 }, "<0.2");
        lastTot = s;
        tl.addLabel("s" + s, "+=0.1");
      }
      function findStart(r, val, s) {
        // index of the step where row r first took value val, looking back from s
        var k = s === 5 ? 3 : s - 1;
        while (k > 0 && r.v[k - 1] === val) k--;
        return k;
      }
      return tl;
    }
  };
})();
