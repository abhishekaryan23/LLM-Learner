/* AG.1: one request flowing through a coding agent. Four sources (rules file, skills
   folder, the user, an MCP server) feed rows into the context window, which is all the
   model reads. Illustrative: a "release-notes" skill and a GitHub MCP server. */
(function () {
  var LC = window.LC;
  // src: index into SOURCES; kind: "in" (loaded into context), "you", "out" (model writes)
  var ROWS = [
    { src: 0, kind: "in", c: "Rules: AGENTS.md", w: "Rules: AGENTS.md (always loaded)" },
    { src: 1, kind: "in", c: "Skill names ×3", w: "Skill names + descriptions (3 skills)" },
    { src: 2, kind: "you", c: "You: “notes for v2.1”", w: "You: “Write release notes for v2.1”" },
    { src: 1, kind: "in", c: "SKILL.md: release-notes", w: "Full SKILL.md: release-notes" },
    { src: 3, kind: "out", c: "Call: list_merged_prs", w: "Model asks: list_merged_prs(v2.1)" },
    { src: 3, kind: "in", c: "Result: 14 merged PRs", w: "Tool result: 14 merged PRs" },
    { src: 2, kind: "out", c: "Answer: release notes ✓", w: "Answer: release notes, in our format ✓" }
  ];
  var SOURCES = [
    { c: "AGENTS.md", w: "AGENTS.md" },
    { c: "skills/", w: "skills/ folder" },
    { c: "You", w: "You" },
    { c: "MCP server", w: "GitHub MCP server" }
  ];

  LC.anims["ag-1-flow"] = {
    title: "One request through a coding agent",
    steps: [
      "A coding agent starts a session. Everything the model will know comes in through its <strong>context window</strong>, filled from four places: a rules file, a skills folder, you, and tools.",
      "First, the <strong>rules file</strong> (AGENTS.md or CLAUDE.md) is loaded. It is in the window on every turn, so the agent always follows these conventions.",
      "Next, only the <strong>names and descriptions</strong> of the installed skills are listed: a few dozen tokens each, like the spines of books on a shelf.",
      "You ask: <em>“Write release notes for v2.1.”</em> Your message joins the window.",
      "The request matches the description of the <strong>release-notes skill</strong>, so the agent now loads that skill's full instructions. The other skills stay on the shelf.",
      "The skill says to list merged pull requests. The model writes a <strong>tool call</strong>; the agent sends it to the GitHub <strong>MCP server</strong>.",
      "The server talks to GitHub and sends back a <strong>tool result</strong>, which is added to the window like any other text.",
      "With rules, the skill's steps and real data all in the window, the model writes the <strong>answer</strong>: release notes in your team's format."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 438 } : { w: 640, h: 376 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      var srcBox = [], rowY = [];
      var L;
      if (compact) {
        L = { boxW: 84, boxH: 38, gap: 4, boxY: 30, title: 96, panX: 4, panY: 106, panW: 352, rowH: 40, rowX: 22, legY: 428, legX: [4, 112, 212] };
        SOURCES.forEach(function (s, i) { srcBox.push({ x: 4 + i * (L.boxW + L.gap), y: L.boxY, w: L.boxW, h: L.boxH }); });
      } else {
        L = { boxW: 168, boxH: 46, boxY: 0, title: 22, panX: 232, panY: 34, panW: 404, rowH: 44, rowX: 252, legY: 364, legX: [232, 352, 462] };
        [52, 124, 196, 268].forEach(function (y) { srcBox.push({ x: 8, y: y, w: L.boxW, h: L.boxH }); });
      }
      ROWS.forEach(function (r, i) { rowY.push(L.panY + 14 + i * L.rowH); });
      var cls = compact ? "t t-sm" : "t";

      // sources
      var hl = [];
      srcBox.forEach(function (b, i) {
        S("rect", { x: b.x, y: b.y, width: b.w, height: b.h, rx: 10, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, svg);
        S("text", { x: b.x + b.w / 2, y: b.y + b.h / 2 + 4.5, class: cls + " t-mid", "font-weight": 600, text: compact ? SOURCES[i].c : SOURCES[i].w }, svg);
        var h = S("rect", { x: b.x - 3, y: b.y - 3, width: b.w + 6, height: b.h + 6, rx: 12, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 3 }, svg);
        h.style.opacity = 0; hl.push(h);
      });
      if (!compact) S("text", { x: 8, y: L.title, class: "t t-sm t-muted", text: "Where text comes from" }, svg);

      // context window panel
      S("text", { x: compact ? 4 : L.panX, y: L.title, class: "t t-sm t-muted", text: compact ? "Context window: all the model reads" : "Context window: everything the model reads" }, svg);
      var panH = 14 + ROWS.length * L.rowH + 6;
      S("rect", { x: L.panX, y: L.panY, width: L.panW, height: panH, rx: 12, class: "f-surface2", stroke: "var(--line)", "stroke-width": 1.5 }, svg);

      [["f-blue", "loaded in"], ["f-ink", "from you"], ["f-orange", "written by model"]].forEach(function (k, i) {
        S("rect", { x: L.legX[i], y: L.legY - 10, width: 10, height: 10, rx: 2, class: k[0] }, svg);
        S("text", { x: L.legX[i] + 15, y: L.legY, class: "t t-sm t-muted", text: k[1] }, svg);
      });
      var rows = ROWS.map(function (r, i) {
        var g = S("g", {}, svg);
        var y = rowY[i];
        S("rect", { x: L.panX + 8, y: y, width: L.panW - 16, height: L.rowH - 8, rx: 8, class: "f-paper", stroke: "var(--line)", "stroke-width": 1 }, g);
        S("rect", { x: L.panX + 8, y: y, width: 6, height: L.rowH - 8, rx: 3, class: r.kind === "out" ? "f-orange" : (r.kind === "you" ? "f-ink" : "f-blue") }, g);
        S("text", { x: L.rowX, y: y + (L.rowH - 8) / 2 + 4.5, class: cls + (r.kind === "out" ? " t-orange" : ""), "font-weight": r.kind === "out" ? 650 : 500, text: compact ? r.c : r.w }, g);
        g.style.opacity = 0;
        return g;
      });
      tl.addLabel("s0", 0);

      function srcPoint(i) {
        var b = srcBox[i];
        return compact ? { x: b.x + b.w / 2 - 7, y: b.y + b.h + 2 } : { x: b.x + b.w + 4, y: b.y + b.h / 2 - 7 };
      }
      function rowPoint(i) { return { x: compact ? L.panX + 160 : L.panX + 200, y: rowY[i] + (L.rowH - 8) / 2 - 7 }; }

      var prevHL = null;
      ROWS.forEach(function (r, i) {
        var from = r.kind === "out" ? rowPoint(i) : srcPoint(r.src);
        var to = r.kind === "out" ? srcPoint(r.src) : rowPoint(i);
        var chip = S("rect", { x: from.x, y: from.y, width: 14, height: 14, rx: 4, class: r.kind === "out" ? "f-orange" : "f-blue" }, svg);
        chip.style.opacity = 0;
        if (prevHL) tl.to(prevHL, { opacity: 0, duration: 0.25 });
        tl.to(hl[r.src], { opacity: 1, duration: 0.3 }, prevHL ? "<" : undefined);
        prevHL = hl[r.src];
        if (r.kind === "out") LC.popIn(tl, rows[i], { duration: 0.4 });
        tl.set(chip, { opacity: 1 }, "+=0.05");
        tl.to(chip, { attr: { x: to.x, y: to.y }, duration: 0.8, ease: "power2.inOut" });
        tl.to(chip, { opacity: 0, duration: 0.2 });
        if (r.kind !== "out") LC.popIn(tl, rows[i], { duration: 0.4 }, "-=0.15");
        tl.addLabel("s" + (i + 1));
      });
      return tl;
    }
  };
})();
