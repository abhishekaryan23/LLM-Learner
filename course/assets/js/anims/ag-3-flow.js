/* AG.3: one MCP round trip as a sequence diagram (spec revision 2026-07-28, which is
   stateless: there is no initialize handshake; server/discover is optional for clients, required for servers).
   Example: a support bot with an "orders" MCP server. */
(function () {
  var LC = window.LC;
  // lane 0 = model, 1 = host app (MCP client), 2 = MCP server; kind: req | res | mdl
  var MSGS = [
    { s: 1, from: 1, to: 2, kind: "req", c: "server/discover", w: "server/discover" },
    { s: 1, from: 2, to: 1, kind: "res", c: "versions, tools ✓", w: "versions + capabilities" },
    { s: 2, from: 1, to: 2, kind: "req", c: "tools/list", w: "tools/list" },
    { s: 2, from: 2, to: 1, kind: "res", c: "2 tools + schemas", w: "get_order, refund_order + schemas" },
    { s: 3, from: 1, to: 0, kind: "mdl", c: "tools + question", w: "tool definitions + “Where is A17?”" },
    { s: 3, from: 0, to: 1, kind: "mdl", c: "get_order(A17)", w: "use get_order {order_id: \"A17\"}" },
    { s: 4, from: 1, to: 2, kind: "req", c: "tools/call", w: "tools/call get_order" },
    { s: 5, from: 2, to: 1, kind: "res", c: "“shipped Tue”", w: "result: “A17 shipped Tuesday”" },
    { s: 6, from: 1, to: 0, kind: "mdl", c: "tool result", w: "tool result added to context" },
    { s: 6, from: 0, to: 1, kind: "mdl", c: "answer for user", w: "answer: “It shipped Tuesday”" }
  ];
  var LANES = [{ c: "Model", w: "Model (LLM)" }, { c: "App (client)", w: "Host app + MCP client" }, { c: "MCP server", w: "MCP server: orders" }];

  LC.anims["ag-3-flow"] = {
    title: "One MCP round trip",
    steps: [
      "Three parties: the <strong>model</strong>, the <strong>host app</strong> (a chat app, IDE or agent) with one <strong>MCP client</strong> per server, and the <strong>MCP server</strong>, here one that knows about orders.",
      "Optionally, the client asks <code>server/discover</code>: which protocol versions and features do you support? (Before the July 2026 spec, every connection began with an <code>initialize</code> handshake instead.)",
      "The client asks <code>tools/list</code>. The server answers with each tool's <strong>name, description and input schema</strong>.",
      "The app puts those definitions into the model's context with the user's question. The <strong>model picks a tool</strong> and writes its arguments; it never talks to the server itself.",
      "The client sends <code>tools/call</code> with the tool name and arguments. The server runs it, for example by querying the orders database.",
      "The server returns the <strong>result</strong> as content (text, structured data, images).",
      "The app adds the result to the context and the model writes the <strong>answer</strong>. The user, and the host's permission rules, can approve or deny each call along the way."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 444 } : { w: 640, h: 434 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      var lx = compact ? [52, 180, 308] : [96, 320, 544];
      var bw = compact ? 98 : 176, top = 24, bh = 36, row0 = 92, rowH = compact ? 32 : 31;
      var cls = compact ? "t t-sm" : "t";
      LANES.forEach(function (l, i) {
        S("line", { x1: lx[i], x2: lx[i], y1: top + bh, y2: row0 + MSGS.length * rowH, class: "s-grid", "stroke-dasharray": "4 4", "stroke-width": 1.5 }, svg);
        S("rect", { x: lx[i] - bw / 2, y: top, width: bw, height: bh, rx: 10, class: i === 0 ? "f-ink" : "f-surface", stroke: i === 0 ? "none" : "var(--line)", "stroke-width": 1.5 }, svg);
        S("text", { x: lx[i], y: top + bh / 2 + 4.5, class: cls + " t-mid" + (i === 0 ? " t-nohalo" : ""), "font-weight": 650, style: i === 0 ? "fill: var(--a-paper)" : "", text: compact ? l.c : l.w }, svg);
      });
      var legY = row0 + MSGS.length * rowH + 22;
      [["s-blue", "request"], ["s-orange", "response"], ["s-ink", "inside the app"]].forEach(function (k, i) {
        var x = (compact ? [4, 112, 224] : [8, 150, 300])[i];
        S("line", { x1: x, x2: x + 18, y1: legY - 4, y2: legY - 4, class: k[0], "stroke-width": 2.5 }, svg);
        S("text", { x: x + 24, y: legY, class: "t t-sm t-muted", text: k[1] }, svg);
      });
      tl.addLabel("s0", 0);

      var step = 1;
      MSGS.forEach(function (m, i) {
        var y = row0 + i * rowH + 14, x0 = lx[m.from], x1 = lx[m.to], dir = x1 > x0 ? 1 : -1;
        var sc = m.kind === "req" ? "s-blue" : (m.kind === "res" ? "s-orange" : "s-ink");
        var fc = m.kind === "req" ? "f-blue" : (m.kind === "res" ? "f-orange" : "f-ink");
        var line = S("path", { d: "M" + (x0 + dir * 4) + " " + y + "H" + (x1 - dir * 10), class: sc, "stroke-width": 2.5 }, svg);
        var head = S("path", { d: "M" + (x1 - dir * 2) + " " + y + "l" + (-dir * 10) + " -6v12z", class: fc }, svg);
        var lbl = S("text", { x: (x0 + x1) / 2, y: y - 7, class: "t t-sm t-mid" + (m.kind === "req" ? " t-mono" : ""), text: compact ? m.c : m.w }, svg);
        head.style.opacity = 0; lbl.style.opacity = 0;
        if (m.s !== step) { tl.addLabel("s" + step); step = m.s; }
        LC.drawIn(tl, line, { duration: 0.5 });
        tl.to([head, lbl], { opacity: 1, duration: 0.3 }, "-=0.15");
      });
      tl.addLabel("s" + step);
      return tl;
    }
  };
})();
