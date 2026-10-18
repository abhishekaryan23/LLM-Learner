/* AG.1 playground: "What are you trying to do?" Tap a goal; the recommended building
   block(s) light up around the model + context window, with one sentence of why and a
   link to the lesson that teaches it. Same map as the table in the lesson. */
(function () {
  var LC = window.LC;
  // left column, then right column
  var NODES = ["RAG", "LLM wiki", "Rules file", "Memory files", "Fine-tuning",
               "Agent Skill", "MCP server", "Function call", "Subagents", "Hooks"];
  var GOALS = [
    { use: [0, 1], why: "Facts the model was never trained on: look up the relevant passages when a question comes in (<strong>RAG</strong>). For a small body of knowledge that changes slowly and that you want summarised and cross-linked once, keep an <strong>LLM wiki</strong>.",
      links: [["sy-3", "SY.3 RAG"], ["ag-6", "AG.6 The LLM wiki"]] },
    { use: [2], why: "Conventions that apply to every task (build commands, code style, “never edit generated files”) go in a <strong>rules file</strong> such as AGENTS.md or CLAUDE.md, which is loaded at the start of every session.",
      links: [["ag-5", "AG.5 AGENTS.md &amp; memory files"]] },
    { use: [5], why: "A procedure you need only sometimes (“make a slide deck our way”, “review a contract with our checklist”) belongs in an <strong>Agent Skill</strong>: only its one-line description sits in context until a task matches.",
      links: [["ag-4", "AG.4 Agent Skills"]] },
    { use: [6, 7], why: "Reading or changing another system (GitHub, Slack, a database, a calendar) needs a <strong>tool</strong>. If many apps or agents should share it, wrap it as an <strong>MCP server</strong>; for a one-off inside your own app, plain <strong>function calling</strong> is enough.",
      links: [["ag-3", "AG.3 MCP"], ["sy-4", "SY.4 Function calling"]] },
    { use: [8], why: "A big task with separable parts, or a context window that keeps overflowing: hand parts to <strong>subagents</strong>, each with a clean window, and keep only their short summaries.",
      links: [["ag-7", "AG.7 Subagents, multi-agent systems &amp; A2A"]] },
    { use: [9], why: "Run the formatter, block a dangerous command: anything that must happen <em>every</em> time belongs in deterministic code such as a <strong>hook</strong>. A prompt is only a request the model can miss.",
      links: [["ag-7", "AG.7 (hooks and deterministic checks)"]] },
    { use: [3, 1], why: "To carry decisions and progress into the next session, write them down: <strong>memory files</strong> the agent reads at start-up, or an <strong>LLM wiki</strong> for knowledge that keeps growing.",
      links: [["ag-5", "AG.5 Memory files"], ["ag-6", "AG.6 The LLM wiki"]] },
    { use: [4], why: "To change the model's built-in behaviour, style or cost at scale (a house tone in millions of replies, a smaller model that copies a bigger one), train it: <strong>fine-tuning</strong>. It is the wrong tool for facts that change.",
      links: [["sy-6", "SY.6 Prompt, RAG or fine-tune?"], ["m3-7", "M3.7 LoRA"]] }
  ];

  function init(root) {
    var stage = root.querySelector(".pg-stage");
    var hint = root.querySelector(".pg-hint");
    var buttons = [].slice.call(root.querySelectorAll("[data-goal]"));
    var current = -1, layout = null, svg = null, nodeEls = [], lineEls = [];

    function build() {
      layout = stage.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact", S = LC.svg;
      var W = compact ? 360 : 640, H = compact ? 292 : 280;
      if (svg) svg.remove();
      svg = S("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Diagram: ten building blocks around the model and its context window. The highlighted ones are recommended for the goal you picked; the text below explains why." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "340px";
      stage.appendChild(svg);
      var nw = compact ? 104 : 168, nh = 40, lx = compact ? 4 : 8, rx = W - (compact ? 4 : 8) - nw;
      var ys = compact ? [8, 64, 120, 176, 232] : [8, 62, 116, 170, 224];
      var cx0 = compact ? 128 : 232, cx1 = W - cx0, cy0 = compact ? 110 : 102, cy1 = compact ? 182 : 178;
      nodeEls = []; lineEls = [];
      // lines first (behind)
      NODES.forEach(function (n, i) {
        var left = i < 5, y = ys[i % 5] + nh / 2;
        var x0 = left ? lx + nw : rx, x1 = left ? cx0 : cx1;
        var ty = Math.max(cy0 + 10, Math.min(cy1 - 10, y));
        var mid = (x0 + x1) / 2;
        lineEls.push(S("path", { d: "M" + x0 + " " + y + "C" + mid + " " + y + " " + mid + " " + ty + " " + x1 + " " + ty, class: "s-faint", "stroke-width": 2 }, svg));
      });
      S("rect", { x: cx0, y: cy0, width: cx1 - cx0, height: cy1 - cy0, rx: 14, class: "f-ink" }, svg);
      S("text", { x: W / 2, y: (cy0 + cy1) / 2 - 4, class: "t t-mid t-nohalo" + (compact ? " t-sm" : ""), "font-weight": 650, style: "fill: var(--a-paper)", text: "Model +" }, svg);
      S("text", { x: W / 2, y: (cy0 + cy1) / 2 + 14, class: "t t-mid t-nohalo" + (compact ? " t-sm" : ""), "font-weight": 650, style: "fill: var(--a-paper)", text: "context window" }, svg);
      NODES.forEach(function (n, i) {
        var left = i < 5, x = left ? lx : rx, y = ys[i % 5];
        var g = S("g", {}, svg);
        var r = S("rect", { x: x, y: y, width: nw, height: nh, rx: 10, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, g);
        var t = S("text", { x: x + nw / 2, y: y + nh / 2 + 4.5, class: "t t-mid" + (compact ? " t-sm" : ""), "font-weight": 600, text: n }, g);
        nodeEls.push({ g: g, r: r, t: t });
      });
      paint();
    }

    function paint() {
      var on = current >= 0 ? GOALS[current].use : null;
      nodeEls.forEach(function (n, i) {
        var hot = on && on.indexOf(i) >= 0;
        n.r.setAttribute("class", hot ? "f-orange" : "f-surface");
        n.r.setAttribute("stroke", hot ? "var(--a-orange)" : "var(--line)");
        n.t.setAttribute("class", "t t-mid" + (layout === "compact" ? " t-sm" : "") + (hot ? " t-nohalo" : ""));
        n.t.style.fill = hot ? "#fff" : "";
        n.g.style.opacity = !on || hot ? 1 : 0.4;
        lineEls[i].setAttribute("class", hot ? "s-orange" : "s-faint");
        lineEls[i].style.opacity = !on || hot ? 1 : 0.4;
      });
      if (current < 0) { hint.innerHTML = "Tap a goal above. The building blocks that fit light up, with the reason and the lesson to read next."; return; }
      var g = GOALS[current];
      hint.innerHTML = g.why + " <span class=\"pg-links\">Read: " + g.links.map(function (l) { return '<a href="' + l[0] + '.html">' + l[1] + "</a>"; }).join(" · ") + "</span>";
    }

    root.addEventListener("click", function (e) {
      var b = e.target.closest("[data-goal]"); if (!b) return;
      current = +b.dataset.goal;
      buttons.forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      paint();
    });
    build();
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        var want = stage.clientWidth < 560 ? "compact" : "wide";
        if (want !== layout) build();
      }).observe(stage);
    }
  }

  document.addEventListener("lc:ready", function () {
    var root = document.getElementById("ag1-chooser");
    if (root) init(root);
  });
})();
