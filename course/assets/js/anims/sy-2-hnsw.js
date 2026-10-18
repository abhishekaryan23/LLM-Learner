/* SY.2: a greedy HNSW search (Malkov & Yashunin, 2016/2018) on 36 toy points.
   Layers: top = 3 points (fully linked), middle = 9 points (2 nearest neighbours each,
   symmetrised), bottom = all 36 (3 nearest neighbours each). Search starts at the top-layer
   entry point, hops greedily toward the query, then drops a layer. The graphs and the path
   are computed below from the fixed coordinates, so the counts in the captions are real
   for this toy. */
(function () {
  var LC = window.LC;
  var P = [[0.03,0.153],[0.212,0.856],[0.563,0.813],[0.657,0.288],[0.41,0.813],[0.061,0.719],[0.747,0.075],[0.661,0.935],[0.394,0.477],[0.991,0.311],[0.603,0.466],[0.509,0.048],[0.536,0.215],[0.623,0.118],[0.858,0.765],[0.765,0.844],[0.898,0.083],[0.244,0.517],[0.294,0.711],[0.832,0.45],[0.36,0.038],[0.974,0.899],[0.418,0.642],[0.928,0.587],[0.137,0.601],[0.444,0.288],[0.054,0.442],[0.22,0.194],[0.34,0.974],[0.072,0.957],[0.795,0.636],[0.464,0.998],[0.885,0.995],[0.124,0.307],[0.296,0.328],[0.536,0.615]];
  var Q = [0.72, 0.7], AX = 1.6; // map aspect (width : height)
  var LAYERS = [range(36), range(9), range(3)]; // index = layer number
  function range(n) { var a = []; for (var i = 0; i < n; i++) a.push(i); return a; }
  function d(a, b) { return Math.hypot((a[0] - b[0]) * AX, a[1] - b[1]); }
  function graph(layer, k) {
    var G = {};
    layer.forEach(function (i) { G[i] = G[i] || {}; });
    layer.forEach(function (i) {
      layer.filter(function (j) { return j !== i; })
        .sort(function (a, b) { return d(P[i], P[a]) - d(P[i], P[b]); })
        .slice(0, k).forEach(function (j) { G[i][j] = 1; G[j][i] = 1; });
    });
    return G;
  }
  var GS = [graph(LAYERS[0], 3), graph(LAYERS[1], 2), graph(LAYERS[2], 2)];
  function dq(i) { return d(P[i], Q); }
  // greedy search, layer by layer
  // entry point is fixed in real HNSW; we take the farthest top-layer point so the hops are visible
  var entry = LAYERS[2].slice().sort(function (a, b) { return dq(b) - dq(a); })[0];
  var cur = entry, seen = {}, hops = [[], [], []], evalsAfter = [];
  seen[cur] = 1;
  [2, 1, 0].forEach(function (lv) {
    for (;;) {
      var nb = Object.keys(GS[lv][cur]).map(Number), best = cur;
      nb.forEach(function (j) { seen[j] = 1; if (dq(j) < dq(best)) best = j; });
      if (best === cur) break;
      hops[lv].push([cur, best]); cur = best;
    }
    evalsAfter[lv] = Object.keys(seen).length;
  });
  var found = cur;
  var truth = range(36).sort(function (a, b) { return dq(a) - dq(b); })[0];

  LC.anims["sy-2-hnsw"] = {
    title: "HNSW: search a graph, top layer down",
    steps: [
      "36 stored vectors (dots) and a <strong>query</strong> (◆). Exact search compares the query with every vector: 36 here, but 100 million in a real index, for every query.",
      "HNSW builds a graph in <strong>layers</strong>. The top layer has only a few points with long links. Start at the <strong>entry point</strong> and hop to whichever neighbour is closer to the query.",
      "Drop to the <strong>middle layer</strong>: more points, shorter links. Keep hopping greedily from where you are.",
      "Drop to the <strong>bottom layer</strong>, which holds every point linked to its near neighbours. A couple of short hops close in on the query.",
      "No neighbour is closer, so stop. The search compared the query with <strong>" + evalsAfter[0] + " of 36</strong> points and still found the true nearest one. At millions of points the saving is enormous, because the number of hops grows roughly with the <em>logarithm</em> of the collection size.",
      "The catch: greedy hops can stop at a <strong>local</strong> best and miss the true nearest neighbour. Real HNSW keeps a list of candidates (size <code>efSearch</code>): a longer list means <strong>higher recall</strong> but <strong>slower</strong> queries. That knob is the recall–latency trade-off."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 366 } : { w: 640, h: 452 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact", W = ctx.w;
      var tl = gsap.timeline();
      var mw = compact ? 330 : 512, mh = mw / AX, mx = (W - mw) / 2, my = compact ? 46 : 36;
      function X(p) { return mx + p[0] * mw; }
      function Y(p) { return my + p[1] * mh; }

      // heading row (reserved; one heading per stage, cross-faded)
      var heads = ["All 36 vectors", "Top layer · 3 points", "Middle layer · 9 points", "Bottom layer · all 36", "Result", "Recall vs speed"].map(function (t, i) {
        var e = S("text", { x: mx, y: my - 16, class: "t t-sm", "font-weight": 650, text: t }, svg);
        if (i) e.style.opacity = 0;
        return e;
      });
      S("rect", { x: mx - 6, y: my - 6, width: mw + 12, height: mh + 12, rx: 10, class: "f-none", stroke: "var(--line)", "stroke-width": 1 }, svg);

      // edges per layer
      var edgeG = [0, 1, 2].map(function (lv) {
        var g = S("g", {}, svg); g.style.opacity = 0;
        Object.keys(GS[lv]).forEach(function (i) {
          Object.keys(GS[lv][i]).forEach(function (j) {
            if (+i < +j) S("line", { x1: X(P[i]), y1: Y(P[i]), x2: X(P[j]), y2: Y(P[j]), class: lv === 0 ? "s-grid" : "s-faint", "stroke-width": lv === 2 ? 2 : 1.5 }, g);
          });
        });
        return g;
      });
      // dots: size shows the highest layer a point lives in
      var dots = P.map(function (p, i) {
        var r = i < 3 ? 7 : (i < 9 ? 5 : 3.5);
        return S("circle", { cx: X(p), cy: Y(p), r: r, class: i < 3 ? "f-ink" : (i < 9 ? "f-ink" : "f-faint") }, svg);
      });
      // query
      var qx = X(Q), qy = Y(Q);
      S("path", { d: "M" + qx + " " + (qy - 9) + "l9 9l-9 9l-9 -9z", class: "f-orange", stroke: "var(--a-paper)", "stroke-width": 1.5 }, svg);

      // entry ring + visited rings
      var ring = function (i, cls) { return S("circle", { cx: X(P[i]), cy: Y(P[i]), r: (i < 3 ? 7 : i < 9 ? 5 : 3.5) + 5, class: "f-none", stroke: cls, "stroke-width": 2.5 }, svg); };
      var entryRing = ring(entry, "var(--a-blue)"); entryRing.style.opacity = 0;
      var pathSegs = [0, 1, 2].map(function (lv) {
        return hops[lv].map(function (h) {
          var a = P[h[0]], b = P[h[1]];
          return S("path", { d: "M" + X(a) + " " + Y(a) + "L" + X(b) + " " + Y(b), class: "s-orange", "stroke-width": 3 }, svg);
        });
      });
      var foundRing = ring(found, "var(--a-orange)"); foundRing.style.opacity = 0;

      // bottom strip: counter + trade-off bar
      var sy0 = my + mh + 30;
      var counter = S("text", { x: mx, y: sy0, class: "t t-sm" }, svg);
      var proxy = { v: 0, exact: 1 };
      function setCounter() {
        counter.textContent = proxy.exact > 0.5 ? "exact search: 36 of 36 compared" : "HNSW: " + Math.round(proxy.v) + " of 36 compared";
      }
      setCounter();
      var bar = S("g", {}, svg); bar.style.opacity = 0;
      var by = sy0 + (compact ? 30 : 32), bx0 = mx + 4, bx1 = mx + mw - 4;
      S("line", { x1: bx0, x2: bx1, y1: by, y2: by, class: "s-axis", "stroke-width": 2 }, bar);
      S("text", { x: bx0, y: by + 20, class: "t t-sm t-muted", text: compact ? "fast, lower recall" : "short list: fast, lower recall" }, bar);
      S("text", { x: bx1, y: by + 20, class: "t t-sm t-muted t-end", text: compact ? "slow, higher recall" : "long list: slower, higher recall" }, bar);
      var knob = S("circle", { cx: bx0 + (bx1 - bx0) * 0.2, cy: by, r: 7, class: "f-blue" }, bar);

      tl.addLabel("s0", 0);
      // s1: top layer
      tl.to(heads[0], { opacity: 0, duration: 0.25 }, "+=0.05");
      tl.to(heads[1], { opacity: 1, duration: 0.3 });
      tl.to(dots.slice(3), { opacity: 0.25, duration: 0.3 }, "<");
      tl.to(edgeG[2], { opacity: 1, duration: 0.4 });
      tl.to(entryRing, { opacity: 1, duration: 0.3 });
      tl.to(proxy, { exact: 0, duration: 0.01, onUpdate: setCounter });
      pathSegs[2].forEach(function (p) { LC.drawIn(tl, p, { duration: 0.6 }); });
      tl.to(proxy, { v: evalsAfter[2], duration: 0.4, onUpdate: setCounter });
      tl.addLabel("s1");
      // s2: middle layer
      tl.to(heads[1], { opacity: 0, duration: 0.25 }, "+=0.05");
      tl.to(heads[2], { opacity: 1, duration: 0.3 });
      tl.to(edgeG[2], { opacity: 0.25, duration: 0.3 }, "<");
      tl.to(dots.slice(3, 9), { opacity: 1, duration: 0.3 }, "<");
      tl.to(edgeG[1], { opacity: 1, duration: 0.4 });
      pathSegs[1].forEach(function (p) { LC.drawIn(tl, p, { duration: 0.5 }); });
      tl.to(proxy, { v: evalsAfter[1], duration: 0.4, onUpdate: setCounter });
      tl.addLabel("s2");
      // s3: bottom layer
      tl.to(heads[2], { opacity: 0, duration: 0.25 }, "+=0.05");
      tl.to(heads[3], { opacity: 1, duration: 0.3 });
      tl.to(edgeG[1], { opacity: 0.25, duration: 0.3 }, "<");
      tl.to(dots.slice(9), { opacity: 1, duration: 0.3 }, "<");
      tl.to(edgeG[0], { opacity: 1, duration: 0.4 });
      pathSegs[0].forEach(function (p) { LC.drawIn(tl, p, { duration: 0.45 }); });
      tl.to(proxy, { v: evalsAfter[0], duration: 0.4, onUpdate: setCounter });
      tl.addLabel("s3");
      // s4: result
      tl.to(heads[3], { opacity: 0, duration: 0.25 }, "+=0.05");
      tl.to(heads[4], { opacity: 1, duration: 0.3 });
      tl.to(foundRing, { opacity: 1, duration: 0.4 });
      tl.addLabel("s4");
      // s5: trade-off
      tl.to(heads[4], { opacity: 0, duration: 0.25 }, "+=0.05");
      tl.to(heads[5], { opacity: 1, duration: 0.3 });
      tl.to(bar, { opacity: 1, duration: 0.4 });
      tl.to(knob, { attr: { cx: bx0 + (bx1 - bx0) * 0.8 }, duration: 1, ease: "power1.inOut" });
      tl.addLabel("s5");
      if (found !== truth && window.console) console.warn("sy-2-hnsw: greedy search missed the true nearest point");
      return tl;
    }
  };
})();
