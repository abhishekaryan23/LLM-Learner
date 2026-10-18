/* AG.3: the N×M integration problem. 5 apps × 8 tools = 40 custom connectors;
   with a shared protocol each app implements a client once and each tool gets one
   server: 5 + 8 = 13 pieces. */
(function () {
  var LC = window.LC;
  var APPS = ["Chat app", "IDE", "Support bot", "Agent", "Desktop app"];
  var TOOLS = ["GitHub", "Slack", "Postgres", "Drive", "Calendar", "Jira", "Browser", "Files"];

  LC.anims["ag-3-nxm"] = {
    title: "Why a shared protocol: N × M becomes N + M",
    steps: [
      "Five AI apps and eight tools they would like to use. Before MCP, every pairing needed its own custom connector.",
      "Wire every app to every tool: <strong>5 × 8 = 40</strong> connectors to write, test and maintain.",
      "Then GitHub changes its API. Every app that talks to GitHub must be fixed: <strong>one change, five repairs</strong>.",
      "With a shared protocol, each app learns to speak it <strong>once</strong>: 5 MCP clients.",
      "And each tool is wrapped <strong>once</strong>, as an MCP server: 8 servers. Total: <strong>5 + 8 = 13</strong> pieces, and any app can use any tool. A GitHub change now means one fix, in one server."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 414 } : { w: 640, h: 380 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      var L = compact
        ? { ax: 4, aw: 92, tx: 264, tw: 92, top: 56, step: 40, bh: 30, hub: [138, 222], cY: 402, hy: 38, cls: "t t-sm" }
        : { ax: 8, aw: 150, tx: 482, tw: 150, top: 34, step: 38, bh: 30, hub: [272, 368], cY: 368, hy: 16, cls: "t" };
      var span = (TOOLS.length - 1) * L.step;
      function ty(i) { return L.top + i * L.step + L.bh / 2; }
      function ay(i) { return L.top + i * span / (APPS.length - 1) + L.bh / 2; }
      var hubY0 = L.top + span / 2 - 40, hubY1 = L.top + span / 2 + L.bh + 40;

      S("text", { x: L.ax, y: L.hy, class: "t t-sm t-muted", text: "5 AI apps" }, svg);
      S("text", { x: L.tx + L.tw, y: L.hy, class: "t t-sm t-muted t-end", text: "8 tools" }, svg);

      function curve(x0, y0, x1, y1) { var m = (x0 + x1) / 2; return "M" + x0 + " " + y0 + "C" + m + " " + y0 + " " + m + " " + y1 + " " + x1 + " " + y1; }
      // all-pairs lines (drawn behind boxes)
      var pairs = [], gh = [];
      APPS.forEach(function (a, i) {
        TOOLS.forEach(function (t, j) {
          var p = S("path", { d: curve(L.ax + L.aw, ay(i), L.tx, ty(j)), class: "s-faint", "stroke-width": 1.5 }, svg);
          pairs.push(p);
          if (j === 0) gh.push(S("path", { d: curve(L.ax + L.aw, ay(i), L.tx, ty(j)), class: "s-orange", "stroke-width": 2.5 }, svg));
        });
      });
      var appLines = APPS.map(function (a, i) { return S("path", { d: curve(L.ax + L.aw, ay(i), L.hub[0], L.top + span / 2 + L.bh / 2), class: "s-blue", "stroke-width": 2.5 }, svg); });
      var toolLines = TOOLS.map(function (t, j) { return S("path", { d: curve(L.tx, ty(j), L.hub[1], L.top + span / 2 + L.bh / 2), class: "s-orange", "stroke-width": 2.5 }, svg); });

      APPS.forEach(function (a, i) {
        S("rect", { x: L.ax, y: ay(i) - L.bh / 2, width: L.aw, height: L.bh, rx: 8, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, svg);
        S("text", { x: L.ax + L.aw / 2, y: ay(i) + 4.5, class: L.cls + " t-mid", "font-weight": 600, text: a }, svg);
      });
      var ghBox;
      TOOLS.forEach(function (t, j) {
        var r = S("rect", { x: L.tx, y: ty(j) - L.bh / 2, width: L.tw, height: L.bh, rx: 8, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, svg);
        if (j === 0) ghBox = r;
        S("text", { x: L.tx + L.tw / 2, y: ty(j) + 4.5, class: L.cls + " t-mid", "font-weight": 600, text: t }, svg);
      });
      var ghHL = S("rect", { x: L.tx - 3, y: ty(0) - L.bh / 2 - 3, width: L.tw + 6, height: L.bh + 6, rx: 10, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 3 }, svg);
      ghHL.style.opacity = 0;
      var hub = S("g", {}, svg);
      S("rect", { x: L.hub[0], y: hubY0, width: L.hub[1] - L.hub[0], height: hubY1 - hubY0, rx: 14, class: "f-ink" }, hub);
      S("text", { x: (L.hub[0] + L.hub[1]) / 2, y: (hubY0 + hubY1) / 2 + 6, class: "t t-lg t-mid t-nohalo", style: "fill: var(--a-paper)", text: "MCP" }, hub);
      hub.style.opacity = 0;

      function counter(txt, cls) {
        var e = S("text", { x: W / 2, y: L.cY, class: "t t-mid " + (cls || ""), "font-weight": 650, text: txt }, svg);
        e.style.opacity = 0; return e;
      }
      var c1 = counter(compact ? "5 × 8 = 40 connectors" : "5 × 8 = 40 custom connectors");
      var c2 = counter(compact ? "1 API change → 5 fixes" : "1 API change → 5 apps to fix", "t-orange");
      var c3 = counter(compact ? "5 clients, written once" : "5 MCP clients, each written once", "t-blue");
      var c4 = counter(compact ? "5 + 8 = 13 pieces" : "5 clients + 8 servers = 13 pieces");

      tl.addLabel("s0", 0);
      pairs.forEach(function (p, k) { LC.drawIn(tl, p, { duration: 0.35 }, k ? "<0.03" : undefined); });
      LC.popIn(tl, c1, { duration: 0.3 });
      tl.addLabel("s1");

      tl.to(ghHL, { opacity: 1, duration: 0.3 });
      gh.forEach(function (p, k) { LC.drawIn(tl, p, { duration: 0.5 }, k ? "<0.08" : undefined); });
      tl.to(c1, { opacity: 0, duration: 0.2 }, "<");
      tl.to(c2, { opacity: 1, duration: 0.3 });
      tl.addLabel("s2");

      tl.to(pairs.concat(gh, [ghHL, c2]), { opacity: 0, duration: 0.4 });
      tl.to(hub, { opacity: 1, duration: 0.4 });
      appLines.forEach(function (p, k) { LC.drawIn(tl, p, { duration: 0.5 }, k ? "<0.08" : undefined); });
      LC.popIn(tl, c3, { duration: 0.3 });
      tl.addLabel("s3");

      toolLines.forEach(function (p, k) { LC.drawIn(tl, p, { duration: 0.5 }, k ? "<0.06" : undefined); });
      tl.to(c3, { opacity: 0, duration: 0.2 }, "<");
      tl.to(c4, { opacity: 1, duration: 0.3 });
      tl.addLabel("s4");
      return tl;
    }
  };
})();
