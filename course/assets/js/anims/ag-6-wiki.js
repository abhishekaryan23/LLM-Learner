/* AG.6: the LLM wiki pattern (Karpathy, April 2026). Three layers (raw sources, wiki, schema)
   and three operations: ingest (summary page + update related pages + index/log), query
   (read index, open pages, answer with citations, file the answer back) and lint (find contradictions). */
(function () {
  var LC = window.LC;

  LC.anims["ag-6-wiki"] = {
    title: "Ingest, query, lint: a wiki that grows",
    steps: [
      "Three layers. <strong>Raw sources</strong> are never edited. The <strong>wiki</strong> is a folder of linked Markdown pages the LLM writes. The <strong>schema</strong> (a rules file such as AGENTS.md) says how.",
      "<strong>Ingest:</strong> a new source, <em>doc 3</em>, lands in <code>raw/</code>. The LLM reads it in full, once.",
      "It writes a notes page for doc 3 and <strong>updates the related pages</strong> (here three), adding links. In Karpathy's words, one source “might touch 10-15 wiki pages”.",
      "It adds a line to <code>index.md</code>, the catalogue it reads first, and to <code>log.md</code>, the running record of what changed.",
      "<strong>Query:</strong> “How does method A compare with B?” The LLM reads the index, opens two pages and answers <strong>with citations</strong> back to the raw sources.",
      "A good answer is <strong>filed back</strong> as a new page, <em>A vs B</em>. The next question starts from it instead of from scratch: the wiki <strong>compounds</strong>.",
      "<strong>Lint:</strong> a periodic health check finds two pages that <strong>contradict</strong> each other. It flags them and points at the raw source to settle it."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 372 } : { w: 640, h: 372 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      var cx = compact ? [68, 180, 292] : [120, 320, 520];
      var nw = compact ? 96 : 150, nh = 30;
      var rows = [112, 168, 224];
      var L = compact ? 20 : 45;
      var fs = compact ? "t t-sm" : "t";

      // ---- layer labels (own row)
      S("text", { x: L, y: 16, class: "t t-sm t-muted", text: "raw/ · read-only" }, svg);
      S("text", { x: cx[2] - nw / 2, y: 16, class: "t t-sm t-muted", text: "schema" }, svg);
      S("text", { x: L, y: 100, class: "t t-sm t-muted", text: "wiki/ (LLM-written)" }, svg);

      // ---- raw docs
      function doc(x, label) {
        var g = S("g", {}, svg), w = compact ? 46 : 56;
        S("rect", { x: x, y: 26, width: w, height: 40, rx: 4, class: "f-surface", stroke: "var(--a-ink)", "stroke-width": 1.4 }, g);
        S("path", { d: "M" + (x + w - 10) + " 26v8h10", class: "s-faint", "stroke-width": 1.4 }, g);
        S("text", { x: x + w / 2, y: 51, class: "t t-sm t-mid t-nohalo", text: label }, g);
        return g;
      }
      doc(L, "doc 1");
      doc(L + (compact ? 54 : 70), "doc 2");
      var dw = compact ? 46 : 56;
      var doc3 = doc(cx[1] - dw / 2, "doc 3");
      doc3.style.opacity = 0;
      var sch = S("g", {}, svg);
      S("rect", { x: cx[2] - nw / 2, y: 26, width: nw, height: 40, rx: 8, class: "f-surface2", stroke: "var(--line)", "stroke-width": 1.4 }, sch);
      S("text", { x: cx[2], y: 50, class: "t t-sm t-mono t-mid t-nohalo", text: "AGENTS.md" }, sch);

      // ---- wiki pages
      var N = {};
      function node(key, c, r, label, hidden) {
        var x = cx[c] - nw / 2, y = rows[r];
        var g = S("g", {}, svg);
        S("rect", { x: x, y: y, width: nw, height: nh, rx: 8, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, g);
        var t = S("text", { x: cx[c], y: y + 20, class: "t t-sm t-mid t-nohalo", text: label }, g);
        var ring = function (color, dash) {
          var o = S("rect", { x: x - 2, y: y - 2, width: nw + 4, height: nh + 4, rx: 9, class: "f-none", stroke: color, "stroke-width": 2.5 }, svg);
          if (dash) o.setAttribute("stroke-dasharray", "5 3");
          o.style.opacity = 0; return o;
        };
        if (hidden) g.style.opacity = 0;
        N[key] = { g: g, x: x, y: y, c: c, r: r, t: t, ring: ring };
        return N[key];
      }
      node("index", 0, 0, "index");
      node("over", 2, 0, "overview");
      node("mA", 0, 1, "method A");
      node("notes", 1, 1, "doc 3 notes", true);
      node("mB", 2, 1, "method B");
      node("dY", 0, 2, "dataset Y");
      node("avb", 1, 2, "A vs B", true);
      node("log", 2, 2, "log");

      function link(d, cls) { return S("path", { d: d, class: cls || "s-faint", "stroke-width": 2 }, svg); }
      function vlink(a, b) { var n = N[a], m = N[b]; return link("M" + cx[n.c] + " " + (n.y + nh) + "V" + m.y); }
      function hlink(a, b) { // a right of b or left
        var n = N[a], m = N[b], y = n.y + nh / 2;
        return n.c > m.c ? link("M" + n.x + " " + y + "H" + (m.x + nw)) : link("M" + (n.x + nw) + " " + y + "H" + m.x);
      }
      function dlink(a, b) { // corner to corner, a below-ish b
        var n = N[a], m = N[b];
        var x1 = n.c < m.c ? n.x + nw : n.x, y1 = n.r > m.r ? n.y : n.y + nh;
        var x2 = n.c < m.c ? m.x : m.x + nw, y2 = n.r > m.r ? m.y + nh : m.y;
        return link("M" + x1 + " " + y1 + "L" + x2 + " " + y2);
      }
      // links that exist from the start, drawn under the nodes' halo-free labels
      var base = [vlink("index", "mA"), vlink("mA", "dY"), vlink("over", "mB")];
      base.forEach(function (p) { svg.insertBefore(p, svg.firstChild); });

      // ---- activity panel (bottom)
      var panTop = rows[2] + nh + 18;
      S("path", { d: "M" + L + " " + panTop + "H" + (W - L), class: "s-grid" }, svg);
      function panel(lines, cls) {
        var g = S("g", {}, svg);
        lines.forEach(function (ln, i) {
          var t = S("text", { x: L, y: panTop + 22 + i * 22, class: fs + (cls && cls[i] ? " " + cls[i] : ""), text: ln }, g);
          if (i === 0) t.setAttribute("font-weight", 600);
        });
        g.style.opacity = 0;
        return g;
      }
      var prevPanel = null;
      function showPanel(g) {
        if (prevPanel) tl.to(prevPanel, { opacity: 0, duration: 0.25 });
        tl.to(g, { opacity: 1, duration: 0.4 });
        prevPanel = g;
      }
      tl.addLabel("s0", 0);

      // s1: ingest doc 3
      var p1 = panel(["Ingest: doc 3 arrives in raw/", "the LLM reads it once, in full"], ["t-orange", ""]);
      LC.popIn(tl, doc3, { duration: 0.4 }, "+=0.02");
      showPanel(p1);
      tl.addLabel("s1");

      // s2: notes page + three updated pages + links
      var arrow = link("M" + cx[1] + " 68V" + (rows[1] - 4), "s-orange");
      var head = S("path", { d: "M" + (cx[1] - 5) + " " + (rows[1] - 10) + "L" + cx[1] + " " + (rows[1] - 3) + "L" + (cx[1] + 5) + " " + (rows[1] - 10), class: "s-orange", "stroke-width": 2 }, svg);
      head.style.opacity = 0;
      LC.drawIn(tl, arrow, { duration: 0.5 }, "+=0.02");
      tl.to(head, { opacity: 1, duration: 0.15 });
      LC.popIn(tl, N.notes.g, { duration: 0.35 });
      var newLinks = [hlink("notes", "mA"), hlink("notes", "mB"), dlink("notes", "over")];
      newLinks.forEach(function (p) { p.setAttribute("class", "s-orange"); p.setAttribute("stroke-width", 2); LC.drawIn(tl, p, { duration: 0.35 }); });
      var upd = [N.mA.ring("var(--a-orange)"), N.mB.ring("var(--a-orange)"), N.over.ring("var(--a-orange)")];
      tl.to(upd, { opacity: 1, duration: 0.3 });
      var p2 = panel(["Writes: doc 3 notes (new page)", compact ? "updates method A, method B, overview" : "updates 3 related pages: method A, method B, overview", "and links them together"], ["t-orange", "", ""]);
      showPanel(p2);
      tl.addLabel("s2");

      // s3: index + log
      var ixr = [N.index.ring("var(--a-orange)"), N.log.ring("var(--a-orange)")];
      tl.to(upd, { opacity: 0, duration: 0.25 }, "+=0.02");
      tl.to(newLinks.concat([arrow, head]), { opacity: 0.45, duration: 0.25 }, "<");
      tl.to(ixr, { opacity: 1, duration: 0.3 });
      var p3 = panel(["Bookkeeping", "index: + doc 3 notes, one-line summary", "log: + ingest | doc 3 | 4 pages touched"], ["t-orange", "", ""]);
      showPanel(p3);
      tl.addLabel("s3");

      // s4: query
      var qr = [N.index.ring("var(--a-blue)"), N.mA.ring("var(--a-blue)"), N.mB.ring("var(--a-blue)")];
      tl.to(ixr, { opacity: 0, duration: 0.25 }, "+=0.02");
      tl.to(qr[0], { opacity: 1, duration: 0.3 });
      tl.to([qr[1], qr[2]], { opacity: 1, duration: 0.3 });
      var p4 = panel(["Q: How does method A compare with B?", "reads index → method A, method B", "A: A is faster; B is more accurate", compact ? "[A: doc 1] [B: doc 3]" : "sources: [method A ← doc 1] [method B ← doc 3]"], ["t-blue", "t-muted", "", "t-muted"]);
      showPanel(p4);
      tl.addLabel("s4");

      // s5: file the answer back
      LC.popIn(tl, N.avb.g, { duration: 0.35 }, "+=0.02");
      var backLinks = [dlink("avb", "mA"), dlink("avb", "mB"), vlink("notes", "avb")];
      backLinks.forEach(function (p) { p.setAttribute("class", "s-blue"); p.setAttribute("stroke-width", 2); LC.drawIn(tl, p, { duration: 0.3 }); });
      var p5 = panel(["Filed back as a new page: A vs B", "the next question starts from it"], ["t-blue", ""]);
      showPanel(p5);
      tl.addLabel("s5");

      // s6: lint finds a contradiction
      tl.to(qr, { opacity: 0, duration: 0.25 }, "+=0.02");
      var lr = [N.mA.ring("var(--a-orange)", true), N.dY.ring("var(--a-orange)", true)];
      var conflict = S("path", { d: "M" + (cx[0] + 0) + " " + (rows[1] + nh + 3) + "V" + (rows[2] - 3), class: "s-orange", "stroke-width": 3, "stroke-dasharray": "3 4" }, svg);
      conflict.style.opacity = 0;
      tl.to(lr, { opacity: 1, duration: 0.3 });
      tl.to(conflict, { opacity: 1, duration: 0.3 }, "<");
      var warn = [
        S("text", { x: N.mA.x + nw - 8, y: N.mA.y + 20, class: "t t-sm t-orange t-end t-nohalo", text: "⚠", "font-weight": 700 }, svg),
        S("text", { x: N.dY.x + nw - 8, y: N.dY.y + 20, class: "t t-sm t-orange t-end t-nohalo", text: "⚠", "font-weight": 700 }, svg)
      ];
      if (compact) { N.mA.t.setAttribute("x", cx[0] - 6); N.dY.t.setAttribute("x", cx[0] - 6); }
      LC.popIn(tl, warn, { duration: 0.3 });
      var p6 = panel(["Lint: method A says 10k rows,", "dataset Y says 12k → flagged", "fix: re-read doc 1; every claim keeps", "a link to its raw source"], ["t-orange", "", "", ""]);
      showPanel(p6);
      tl.addLabel("s6");
      return tl;
    }
  };
})();
