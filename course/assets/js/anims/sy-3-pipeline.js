/* SY.3: the RAG pipeline in two halves. Indexing (offline): ingest → chunk → embed → index.
   Answering (per question): question → retrieve (hybrid top-20) → rerank (keep 3) →
   generate with citations. Chunk ids and scores are illustrative. */
(function () {
  var LC = window.LC;

  LC.anims["sy-3-pipeline"] = {
    title: "The RAG pipeline, step by step",
    steps: [
      "RAG has two halves. <strong>Indexing</strong> runs ahead of time, whenever documents change. <strong>Answering</strong> runs for every question.",
      "<strong>Ingest:</strong> load the sources (help pages, PDFs, tickets), extract clean text, and keep metadata such as title, URL, date and who may see it.",
      "<strong>Chunk:</strong> split each document into passages, ideally at headings and paragraphs, with a little overlap.",
      "<strong>Embed:</strong> run every chunk through the embedding model, giving one vector per chunk.",
      "<strong>Index:</strong> store the vectors in an ANN index (and the text in a keyword index), together with each chunk's text and metadata.",
      "A question arrives. <strong>Retrieve:</strong> embed it with the same model and fetch the top candidates, here 20, by hybrid search.",
      "<strong>Rerank:</strong> a cross-encoder scores each candidate against the question; keep the best 3. Note the order changed.",
      "<strong>Generate:</strong> the prompt holds instructions, the 3 numbered sources and the question. The model answers <strong>from the sources</strong> and cites them, so a reader (or a script) can check every claim."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 424 } : { w: 640, h: 412 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact", W = ctx.w;
      var tl = gsap.timeline();
      var g = S("g", { transform: compact ? "translate(0,20)" : "translate(0,0)" }, svg);
      var bw = compact ? 75 : 136, gap = compact ? 10 : 18, x0 = compact ? 10 : 16, bh = 32;
      var cls = compact ? "t t-sm" : "t";
      function bx(i) { return x0 + i * (bw + gap); }
      function cx(i) { return bx(i) + bw / 2; }
      var r1 = 22, r2 = compact ? 196 : 196;

      function row(y, title, names, ly) {
        S("text", { x: x0, y: y - ly, class: "t t-sm t-muted", "font-weight": 600, text: title }, g);
        return names.map(function (n, i) {
          var gg = S("g", {}, g);
          var rect = S("rect", { x: bx(i), y: y, width: bw, height: bh, rx: 8, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, gg);
          S("text", { x: cx(i), y: y + bh / 2 + 4.5, class: cls + " t-mid", "font-weight": 650, text: n }, gg);
          if (i < names.length - 1) {
            var a = S("path", { d: "M" + (bx(i) + bw + 2) + " " + (y + bh / 2) + "h" + (gap - 4) + "m-4 -4l4 4l-4 4", class: "s-ink", "stroke-width": 1.5 }, g);
            a.style.opacity = 0.5;
          }
          return rect;
        });
      }
      var top = row(r1, compact ? "INDEXING · ahead of time" : "INDEXING · ahead of time, when documents change", ["Ingest", "Chunk", "Embed", "Index"], 10);
      var bot = row(r2, compact ? "ANSWERING · every question" : "ANSWERING · for every question", ["Question", "Retrieve", "Rerank", "Generate"], 20);
      function lightOn(rect) { return tl.to(rect, { attr: { stroke: "var(--a-orange)" }, duration: 0.3 }); }

      var d1 = r1 + bh + 12; // detail area, row 1
      // ingest: two documents
      var docs = S("g", {}, g); docs.style.opacity = 0;
      [0, 1].forEach(function (k) {
        var x = cx(0) - 26 + k * 20, y = d1 + k * 12;
        S("rect", { x: x, y: y, width: 30, height: 40, rx: 3, class: "f-surface", stroke: "var(--a-ink)", "stroke-width": 1.5 }, docs);
        [8, 15, 22, 29].forEach(function (ly) { S("line", { x1: x + 6, x2: x + 24, y1: y + ly, y2: y + ly, class: "s-faint", "stroke-width": 1.5 }, docs); });
      });
      // chunk: four passages
      var chunks = S("g", {}, g); chunks.style.opacity = 0;
      [0, 1, 2, 3].forEach(function (k) { S("rect", { x: cx(1) - 22, y: d1 + k * 15, width: 44, height: 11, rx: 3, class: "f-surface2", stroke: "var(--a-ink)", "stroke-width": 1 }, chunks); });
      // embed: four tiny vectors (bar strips)
      var vecs = S("g", {}, g); vecs.style.opacity = 0;
      var hts = [[6, 3, 8, 5, 2, 7], [4, 8, 2, 6, 7, 3], [8, 2, 5, 3, 6, 4], [3, 6, 7, 2, 4, 8]];
      hts.forEach(function (h, k) {
        h.forEach(function (v, j) { S("rect", { x: cx(2) - 21 + j * 7, y: d1 + k * 15 + 11 - v, width: 5, height: v, class: k % 2 ? "f-orange" : "f-blue" }, vecs); });
      });
      // index: a database cylinder
      var db = S("g", {}, g); db.style.opacity = 0;
      var cyx = cx(3), cyy = d1 + 4;
      S("path", { d: "M" + (cyx - 24) + " " + cyy + "v40a24 7 0 0 0 48 0v-40", class: "f-surface", stroke: "var(--a-ink)", "stroke-width": 1.5 }, db);
      S("ellipse", { cx: cyx, cy: cyy, rx: 24, ry: 7, class: "f-surface2", stroke: "var(--a-ink)", "stroke-width": 1.5 }, db);
      S("text", { x: cyx, y: cyy + 30, class: "t t-sm t-mid t-muted", text: "index" }, db);

      // link from the index down to Retrieve
      var linkY = r2 - 7;
      var link = S("path", { d: "M" + (cyx + 26) + " " + (cyy + 22) + "H" + (W - 5) + "V" + linkY + "H" + cx(1) + "V" + (r2 - 1), class: "s-blue", "stroke-width": 2 }, g);
      link.style.opacity = 0;

      var d2 = r2 + bh + 16, lh = compact ? 16 : 17;
      // question bubble
      var qg = S("g", {}, g); qg.style.opacity = 0;
      S("rect", { x: bx(0) + 2, y: d2 - 4, width: bw - 4, height: 42, rx: 8, class: "f-surface", stroke: "var(--a-orange)", "stroke-width": 1.5 }, qg);
      (compact ? ["Return a", "sale item?"] : ["Can I return", "a sale item?"]).forEach(function (t, i) { S("text", { x: cx(0), y: d2 + 13 + i * 15, class: "t t-sm t-mid", text: t }, qg); });
      // retrieve: top candidates with scores
      var ret = S("g", {}, g); ret.style.opacity = 0;
      [["c7", ".82"], ["c2", ".79"], ["c9", ".77"], ["c4", ".75"]].forEach(function (r, i) {
        S("text", { x: bx(1) + 8, y: d2 + 8 + i * lh, class: "t t-sm t-mono", text: r[0] + " " + r[1] }, ret);
      });
      S("text", { x: bx(1) + 8, y: d2 + 8 + 4 * lh, class: "t t-sm t-muted", text: "… 20 in all" }, ret);
      // rerank: kept 3, new order
      var rr = S("g", {}, g); rr.style.opacity = 0;
      ["1 · c2", "2 · c9", "3 · c7"].forEach(function (t, i) { S("text", { x: bx(2) + 8, y: d2 + 8 + i * lh, class: "t t-sm t-mono", text: t }, rr); });
      S("text", { x: bx(2) + 8, y: d2 + 8 + 3 * lh, class: "t t-sm t-muted", text: "17 dropped" }, rr);
      // generate: prompt stack
      var pr = S("g", {}, g); pr.style.opacity = 0;
      ["rules", "[1] c2", "[2] c9", "[3] c7", compact ? "query" : "question"].forEach(function (t, i) {
        S("rect", { x: bx(3) + 6, y: d2 - 9 + i * lh, width: bw - 12, height: lh - 2, rx: 3, class: i === 0 || i === 4 ? "f-surface2" : "f-surface", stroke: "var(--line)", "stroke-width": 1 }, pr);
        S("text", { x: bx(3) + 12, y: d2 + 2.5 + i * lh, class: "t t-sm t-mono t-nohalo", text: t }, pr);
      });
      // answer
      var ay = d2 + 5 * lh + 10;
      var ans = S("g", {}, g); ans.style.opacity = 0;
      S("rect", { x: x0, y: ay, width: W - 2 * x0, height: compact ? 50 : 40, rx: 10, class: "f-surface", stroke: "var(--a-orange)", "stroke-width": 1.5 }, ans);
      var lines = compact
        ? [["Sale items: return within 14 days for", ""], ["store credit ", "[1]", "; refunds take 5–10 days ", "[2]", "."]]
        : [["Sale items can be returned within 14 days for store credit ", "[1]"], [", and refunds take 5–10 days ", "[2]"]];
      if (compact) {
        lines.forEach(function (l, i) {
          var t = S("text", { x: x0 + 12, y: ay + 20 + i * 18, class: "t t-sm" }, ans);
          l.forEach(function (part, j) { if (part) S("tspan", j % 2 ? { class: "t-blue", "font-weight": 700, text: part } : { text: part }, t); });
        });
      } else {
        var t = S("text", { x: x0 + 14, y: ay + 25, class: "t" }, ans);
        lines.forEach(function (l) { S("tspan", { text: l[0] }, t); S("tspan", { class: "t-blue", "font-weight": 700, text: l[1] }, t); });
        S("tspan", { text: "." }, t);
      }

      tl.addLabel("s0", 0);
      lightOn(top[0]); tl.to(docs, { opacity: 1, duration: 0.4 }); tl.addLabel("s1");
      lightOn(top[1]); tl.to(chunks, { opacity: 1, duration: 0.4 }); tl.addLabel("s2");
      lightOn(top[2]); tl.to(vecs, { opacity: 1, duration: 0.4 }); tl.addLabel("s3");
      lightOn(top[3]); tl.to(db, { opacity: 1, duration: 0.4 }); tl.addLabel("s4");
      lightOn(bot[0]); tl.to(qg, { opacity: 1, duration: 0.4 });
      LC.drawIn(tl, link, { duration: 0.7 });
      lightOn(bot[1]); tl.to(ret, { opacity: 1, duration: 0.4 }); tl.addLabel("s5");
      lightOn(bot[2]); tl.to(rr, { opacity: 1, duration: 0.4 }); tl.addLabel("s6");
      lightOn(bot[3]); tl.to(pr, { opacity: 1, duration: 0.4 }); tl.to(ans, { opacity: 1, duration: 0.5 }); tl.addLabel("s7");
      return tl;
    }
  };
})();
