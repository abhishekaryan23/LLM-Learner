/* AG.5: what a coding agent reads, and when. Root AGENTS.md loads at session start,
   the nearest nested AGENTS.md loads when the agent works in that folder (closest wins),
   explicit chat instructions override files, and a memory note carries to the next session. */
(function () {
  var LC = window.LC;

  LC.anims["ag-5-load"] = {
    title: "What the agent reads, and when",
    steps: [
      "A coding agent starts every session with an <strong>empty context window</strong>. Left: the repo on disk. Right: what the model will actually see.",
      "Session start: the agent finds the <strong>root AGENTS.md</strong> and loads all of it. Every line costs tokens, in every session.",
      "You ask it to fix a bug in <code>packages/api/users.ts</code>. Working there pulls in the <strong>nearest AGENTS.md</strong>, the one in <code>packages/api/</code>.",
      "The two files disagree about the test command. For work in that folder <strong>the closest file wins</strong>: <code>pnpm test:api</code>, not <code>npm test</code>.",
      "You type “skip the e2e tests today”. <strong>Explicit chat instructions override</strong> every file, for this conversation only.",
      "Some agents also save a <strong>memory note</strong> (here: “prefers small PRs”) that loads next session. You write the rules; the agent writes its memories."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 474 } : { w: 640, h: 284 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var tl = gsap.timeline();

      // ---- geometry
      var treeX = compact ? 16 : 20, treeTop = compact ? 46 : 52, rowH = compact ? 24 : 30, ind = 16;
      var tagX = compact ? 168 : 168;
      var panX = compact ? 16 : 300, panW = compact ? W - 32 : W - 320;
      var panTop = compact ? treeTop + 7 * rowH + 34 : 52;
      var blkH = 28, blkGap = 6, blkPad = 10;

      // ---- titles (own row)
      S("text", { x: treeX, y: 20, class: "t t-sm t-muted", text: "Repo on disk" }, svg);
      S("text", { x: panX, y: compact ? panTop - 12 : 20, class: "t t-sm t-muted", text: "Context window (what the model sees)" }, svg);

      // ---- file tree
      var rows = [
        { d: 0, n: "my-app/" }, { d: 1, n: "AGENTS.md" }, { d: 1, n: "packages/" },
        { d: 2, n: "web/" }, { d: 2, n: "api/" }, { d: 3, n: "AGENTS.md" }, { d: 3, n: "users.ts" }
      ];
      var rowY = [];
      var hl = []; // highlight rects per row
      rows.forEach(function (r, i) {
        var y = treeTop + i * rowH;
        rowY.push(y);
        var x = treeX + r.d * ind;
        var tw = r.n.length * 7.3 + 10;
        var h = S("rect", { x: x - 5, y: y - 15, width: tw, height: 21, rx: 5, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 2 }, svg);
        h.style.opacity = 0; hl.push(h);
        S("text", { x: x, y: y, class: "t t-sm t-mono", text: r.n }, svg);
      });
      // faint tree guides
      [[1, 0], [2, 0], [3, 2], [4, 2], [5, 4], [6, 4]].forEach(function (p) {
        var child = p[0], parent = p[1];
        var px = treeX + rows[parent].d * ind + 3, cx = treeX + rows[child].d * ind - 4;
        S("path", { d: "M" + px + " " + (rowY[child] - 9 - (child - parent - 1) * 0) + "H" + cx, class: "s-faint", "stroke-width": 1.2 }, svg);
      });
      [[0, 2], [2, 4], [4, 6]].forEach(function (p) {
        var x = treeX + rows[p[0]].d * ind + 3;
        S("path", { d: "M" + x + " " + (rowY[p[0]] + 6) + "V" + (rowY[p[1]] - 9), class: "s-faint", "stroke-width": 1.2 }, svg);
      });
      function tag(i, txt, cls) {
        return S("text", { x: tagX, y: rowY[i], class: "t t-sm " + cls, text: txt }, svg);
      }

      // ---- context panel
      var panH = 6 * (blkH + blkGap) + blkPad * 2 - blkGap;
      S("rect", { x: panX, y: panTop, width: panW, height: panH, rx: 12, class: "f-none", stroke: "var(--line)", "stroke-width": 1.5 }, svg);
      function blockY(k) { return panTop + blkPad + k * (blkH + blkGap); }
      function block(k, left, right, opts) {
        opts = opts || {};
        var g = S("g", {}, svg);
        var y = blockY(k), x = panX + blkPad, w = panW - 2 * blkPad;
        var r = S("rect", { x: x, y: y, width: w, height: blkH, rx: 7, class: "f-surface2", stroke: opts.stroke || "var(--line)", "stroke-width": opts.stroke ? 2 : 1 }, g);
        if (opts.dash) r.setAttribute("stroke-dasharray", "5 4");
        var lt = S("text", { x: x + 10, y: y + 19, class: "t t-sm t-nohalo" + (opts.muted ? " t-muted" : ""), text: left }, g);
        if (!opts.muted) lt.setAttribute("font-weight", 600);
        var rt = right ? S("text", { x: x + w - 10, y: y + 19, class: "t t-sm t-mono t-end t-nohalo" + (opts.rcls ? " " + opts.rcls : ""), text: right }, g) : null;
        return { g: g, rect: r, left: lt, right: rt, y: y };
      }

      var b0 = block(0, "system prompt + tool list", "", { muted: true });
      tl.addLabel("s0", 0);

      // s1: root AGENTS.md loads
      var b1 = block(1, compact ? "root AGENTS.md" : "root AGENTS.md", "test: npm test", { stroke: "var(--a-orange)" });
      var t1 = tag(1, "loads at start", "t-orange");
      b1.g.style.opacity = 0;
      tl.to(hl[1], { opacity: 1, duration: 0.3 }, "+=0.02");
      LC.popIn(tl, [t1, b1.g], { duration: 0.5 });
      tl.addLabel("s1");

      // s2: nested AGENTS.md (nearest to the edited file)
      var b2 = block(2, "api/AGENTS.md", "test: pnpm test:api", { stroke: "var(--a-blue)" });
      b2.g.style.opacity = 0;
      var hlEdit = S("rect", { x: treeX + 3 * ind - 5, y: rowY[6] - 15, width: "users.ts".length * 7.3 + 10, height: 21, rx: 5, class: "f-none", stroke: "var(--a-blue)", "stroke-width": 2, "stroke-dasharray": "4 3" }, svg);
      hlEdit.style.opacity = 0;
      var t6 = tag(6, "you edit this", "t-blue");
      var t5 = tag(5, "nearest file", "t-blue");
      hl[5].setAttribute("stroke", "var(--a-blue)");
      tl.to(hl[1], { opacity: 0.35, duration: 0.3 }, "+=0.02");
      tl.to(t1, { opacity: 0.45, duration: 0.3 }, "<");
      LC.popIn(tl, [hlEdit, t6], { duration: 0.4 });
      tl.to(hl[5], { opacity: 1, duration: 0.3 });
      LC.popIn(tl, [t5, b2.g], { duration: 0.5 });
      tl.addLabel("s2");

      // s3: closest wins: strike the root command
      var bb = b1.right.getBBox();
      var strike = S("path", { d: "M" + (bb.x - 2) + " " + (bb.y + bb.height / 2 + 1) + "H" + (bb.x + bb.width + 2), class: "s-orange", "stroke-width": 2 }, svg);
      LC.drawIn(tl, strike, { duration: 0.5 }, "+=0.02");
      tl.to(b1.g, { opacity: 0.55, duration: 0.3 }, "<");
      var win = S("text", { x: b2.right.getBBox().x - 6, y: b2.y + 19, class: "t t-sm t-blue t-end t-nohalo", text: "✓", "font-weight": 700 }, svg);
      var t4 = tag(4, "closest wins", "t-blue");
      t4.setAttribute("font-weight", 650);
      LC.popIn(tl, [win, t4], { duration: 0.4 });
      tl.addLabel("s3");

      // s4: chat overrides
      var b3 = block(3, "you: “skip e2e tests today”", "overrides", { stroke: "var(--a-ink)", rcls: "t-orange" });
      b3.g.style.opacity = 0;
      LC.popIn(tl, b3.g, { duration: 0.5 }, "+=0.02");
      tl.addLabel("s4");

      // s5: memory note for next session
      var b4 = block(4, "memory: “prefers small PRs”", "→ next time", { stroke: "var(--a-faint)", dash: true, rcls: "t-muted" });
      b4.g.style.opacity = 0;
      LC.popIn(tl, b4.g, { duration: 0.5 }, "+=0.02");
      var legend = S("text", { x: panX + blkPad, y: blockY(5) + 19, class: "t t-sm t-muted", text: "rules: you write · memory: agent writes" }, svg);
      LC.popIn(tl, legend, { duration: 0.4 });
      tl.addLabel("s5");
      return tl;
    }
  };
})();
