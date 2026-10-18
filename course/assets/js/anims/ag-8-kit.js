/* AG.8: three files plug into one agent. AGENTS.md loads whole at session start; a skill shows only
   its name + description until a task matches, then its body loads; an MCP server's tool list is
   fetched (tools/list) and a tool's result enters context only when the model calls it (tools/call). */
(function () {
  var LC = window.LC;

  LC.anims["ag-8-kit"] = {
    title: "Three files, one agent",
    steps: [
      "One agent, three files. Everything the agent knows this turn must fit in its <strong>context window</strong>; for now it holds only the system prompt.",
      "<strong>AGENTS.md</strong> plugs in first. The whole file loads at the start of <strong>every session</strong>, so keep it short.",
      "<strong>SKILL.md:</strong> only its <strong>name and description</strong> load up front, about one line. The body waits until a task needs it.",
      "<strong>MCP server:</strong> the client asks it for its tools (<code>tools/list</code>) and puts each tool's name, description and input schema in context.",
      "You ask “Draft release notes for v1.4”. That matches the skill's description, so <strong>the skill's body loads now</strong> and the agent follows its steps.",
      "You ask “What's in the standup note?”. The model calls <code>get_note</code> (<code>tools/call</code>); the server runs it and the <strong>result</strong> comes back into context.",
      "Three ways in: <strong>always</strong> (rules file), <strong>on demand</strong> (skill), <strong>on call</strong> (tool). Choose by how often the agent needs the knowledge."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 350 } : { w: 640, h: 350 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      var fx = compact ? 16 : 30, fw = compact ? 120 : 200, fh = 48;
      var px = compact ? 160 : 290, pw = W - px - (compact ? 16 : 30);
      var fy = [40, 130, 220];
      var fs = compact ? "t t-sm" : "t";

      S("text", { x: fx, y: 16, class: "t t-sm t-muted", text: "Your files" }, svg);

      // ---- files
      var files = [
        { name: "AGENTS.md", sub: "rules file", tag: "always" },
        { name: "SKILL.md", sub: "release-notes skill", tag: "on demand" },
        { name: "MCP server", sub: "team-notes tool", tag: "on call" }
      ];
      if (compact) files[1].sub = "release notes";
      var tags = [], boxes = [];
      files.forEach(function (f, i) {
        var y = fy[i];
        var r = S("rect", { x: fx, y: y, width: fw, height: fh, rx: 9, class: "f-surface", stroke: "var(--a-ink)", "stroke-width": 1.4 }, svg);
        S("text", { x: fx + 10, y: y + 20, class: "t t-sm t-mono t-nohalo", text: f.name, "font-weight": 650 }, svg);
        S("text", { x: fx + 10, y: y + 38, class: "t t-sm t-muted t-nohalo", text: f.sub }, svg);
        var t = S("text", { x: fx, y: y + fh + 18, class: "t t-sm t-orange", text: "→ " + f.tag, "font-weight": 650 }, svg);
        t.style.opacity = 0; tags.push(t); boxes.push(r);
      });

      // ---- agent panel
      S("rect", { x: px, y: fy[0], width: pw, height: 250, rx: 12, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 2 }, svg);
      S("text", { x: px + 10, y: fy[0] + 19, class: "t t-sm", text: "agent · context window", "font-weight": 650 }, svg);
      var bx = px + 10, bw = pw - 20, bh = 28, by0 = fy[0] + 30;
      function blk(k, label, opts) {
        opts = opts || {};
        var g = S("g", {}, svg), y = by0 + k * 34;
        var r = S("rect", { x: bx, y: y, width: bw, height: bh, rx: 7, class: "f-surface2", stroke: opts.stroke || "var(--line)", "stroke-width": opts.stroke ? 2 : 1 }, g);
        if (opts.dash) r.setAttribute("stroke-dasharray", "5 4");
        S("text", { x: bx + 10, y: y + 19, class: "t t-sm t-nohalo" + (opts.muted ? " t-muted" : ""), text: label }, g);
        if (k) g.style.opacity = 0;
        return { g: g, y: y + bh / 2 };
      }
      function wire(i, b, cls) {
        var x0 = fx + fw, y0 = fy[i] + fh / 2;
        var p = S("path", { d: "M" + x0 + " " + y0 + "C" + (x0 + 16) + " " + y0 + " " + (bx - 16) + " " + b.y + " " + bx + " " + b.y, class: cls, "stroke-width": 2 }, svg);
        return p;
      }
      blk(0, "system prompt", { muted: true });
      tl.addLabel("s0", 0);

      // s1: AGENTS.md
      var b1 = blk(1, compact ? "AGENTS.md: all of it" : "AGENTS.md: the whole file", { stroke: "var(--a-orange)" });
      LC.drawIn(tl, wire(0, b1, "s-orange"), { duration: 0.5 }, "+=0.02");
      LC.popIn(tl, b1.g, { duration: 0.4 });
      tl.addLabel("s1");

      // s2: skill description only
      var b2 = blk(2, compact ? "skill: description" : "skill: name + description", { stroke: "var(--a-orange)" });
      LC.drawIn(tl, wire(1, b2, "s-orange"), { duration: 0.5 }, "+=0.02");
      LC.popIn(tl, b2.g, { duration: 0.4 });
      tl.addLabel("s2");

      // s3: tool list
      var b3 = blk(3, compact ? "tool: get_note" : "tool: get_note(title) + schema", { stroke: "var(--a-orange)" });
      LC.drawIn(tl, wire(2, b3, "s-orange"), { duration: 0.5 }, "+=0.02");
      LC.popIn(tl, b3.g, { duration: 0.4 });
      tl.addLabel("s3");

      // ---- prompt row
      var py = fy[2] + fh + 34, ph = 32;
      S("rect", { x: fx, y: py, width: W - 2 * fx, height: ph, rx: 9, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.2 }, svg);
      function prompt(txt) {
        var t = S("text", { x: fx + 12, y: py + 21, class: fs + " t-nohalo", text: txt }, svg);
        t.style.opacity = 0; return t;
      }
      var q0 = prompt("you: (no request yet)");
      q0.style.opacity = 1; q0.setAttribute("class", fs + " t-muted t-nohalo");
      var q1 = prompt("you: Draft release notes for v1.4");
      var q2 = prompt("you: What's in the standup note?");

      // s4: skill body loads
      var b4 = blk(4, "skill body: 5 steps", { stroke: "var(--a-blue)" });
      tl.to(q0, { opacity: 0, duration: 0.2 }, "+=0.02");
      tl.to(q1, { opacity: 1, duration: 0.3 });
      LC.drawIn(tl, wire(1, b4, "s-blue"), { duration: 0.5 });
      LC.popIn(tl, b4.g, { duration: 0.4 });
      tl.addLabel("s4");

      // s5: tool call + result
      var b5 = blk(5, "get_note → note text", { stroke: "var(--a-blue)" });
      tl.to(q1, { opacity: 0, duration: 0.2 }, "+=0.02");
      tl.to(q2, { opacity: 1, duration: 0.3 });
      LC.drawIn(tl, wire(2, b5, "s-blue"), { duration: 0.5 });
      LC.popIn(tl, b5.g, { duration: 0.4 });
      tl.addLabel("s5");

      // s6: legend
      tl.to(q2, { opacity: 0, duration: 0.2 }, "+=0.02");
      LC.popIn(tl, tags, { duration: 0.4, stagger: 0.15 });
      var q3 = prompt(compact ? "always · on demand · on call" : "rules: always · skill: on demand · tool: on call");
      q3.setAttribute("font-weight", 650);
      tl.to(q3, { opacity: 1, duration: 0.3 });
      tl.addLabel("s6");
      return tl;
    }
  };
})();
