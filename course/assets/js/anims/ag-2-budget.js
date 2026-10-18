/* AG.2 playground: a context-budget bar. Six sliders (thousands of tokens) fill a window
   of 128k, 200k or 1M. Three technique toggles shrink the parts that grow.
   "Needed right now" is an illustrative assumption, stated in the lesson:
   all instructions + the 2k of tool definitions in use + the best 5k of documents +
   the latest 8k of tool results + the latest 8k of history (+ a 2k summary if compacted). */
(function () {
  var LC = window.LC;
  var PARTS = [
    { k: "sys", n: "System", cls: "f-ink", op: 0.85 },
    { k: "rules", n: "Rules", cls: "f-ink", op: 0.5 },
    { k: "tools", n: "Tools", cls: "f-blue", op: 0.45 },
    { k: "docs", n: "Docs", cls: "f-blue", op: 0.9 },
    { k: "results", n: "Results", cls: "f-orange", op: 0.5 },
    { k: "hist", n: "History", cls: "f-orange", op: 0.9 }
  ];

  function compute(v, opt) {
    var tools = opt.tools && v.tools > 3 ? 3 : v.tools;                 // search tool + the few in use
    var results = opt.results ? Math.min(v.results, 8) : v.results;    // keep only recent results
    var hist = opt.hist && v.hist > 10 ? 10 : v.hist;                  // latest 8k + 2k summary
    var used = { sys: v.sys, rules: v.rules, tools: tools, docs: v.docs, results: results, hist: hist };
    var need = v.sys + v.rules + Math.min(v.tools, 2) + Math.min(v.docs, 5) + Math.min(v.results, 8) +
      Math.min(v.hist, 8) + (opt.hist && v.hist > 10 ? 2 : 0);
    var total = 0; for (var k in used) total += used[k];
    return { used: used, total: total, need: Math.min(need, total) };
  }

  function init(root) {
    var stage = root.querySelector(".pg-stage");
    var readout = root.querySelector(".pg-readout");
    var hint = root.querySelector(".pg-hint");
    var sliders = {};
    root.querySelectorAll("input[type=range]").forEach(function (s) { sliders[s.dataset.k] = s; });
    var limit = 200, opt = { tools: false, results: false, hist: false }, layout = null, svg = null, els = null;

    function vals() { var v = {}; for (var k in sliders) v[k] = +sliders[k].value; return v; }

    function build() {
      layout = stage.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact", S = LC.svg;
      var W = compact ? 360 : 640, H = compact ? 240 : 206;
      if (svg) svg.remove();
      svg = S("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Context window budget: a stacked bar of the six parts against the window limit, and a second bar splitting the used tokens into what the model needs right now and clutter. The readout below gives the numbers." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "260px";
      stage.appendChild(svg);
      var x0 = compact ? 4 : 8, x1 = W - x0;
      var L = compact
        ? { title: 14, limY: 34, bar: 42, bh: 30, leg: [96, 116, 136], legX: [4, 184], t2: 168, bar2: 178, bh2: 24, leg2: 222 }
        : { title: 16, limY: 36, bar: 44, bh: 32, leg: [98], legX: null, t2: 134, bar2: 144, bh2: 26, leg2: 192 };
      els = { x0: x0, x1: x1, L: L, segs: [], need: null, clutter: null, free2: null };
      els.title = S("text", { x: x0, y: L.title, class: "t t-sm", "font-weight": 600, text: "" }, svg);
      els.frame = S("rect", { x: x0, y: L.bar, width: x1 - x0, height: L.bh, rx: 4, class: "f-none", stroke: "var(--ink-2)", "stroke-width": 1.5, "stroke-dasharray": "5 4" }, svg);
      PARTS.forEach(function (p) {
        els.segs.push(S("rect", { x: x0, y: L.bar, width: 0, height: L.bh, class: p.cls, "fill-opacity": p.op, stroke: "var(--a-paper)", "stroke-width": 1 }, svg));
      });
      els.limLine = S("line", { x1: x1, x2: x1, y1: L.bar - 4, y2: L.bar + L.bh + 4, class: "s-ink", "stroke-width": 2.5 }, svg);
      els.limLbl = S("text", { x: x1, y: L.limY, class: "t t-sm t-end", "font-weight": 600, text: "limit ▾" }, svg);
      // legend
      PARTS.forEach(function (p, i) {
        var lx, ly;
        if (compact) { lx = L.legX[i % 2]; ly = L.leg[Math.floor(i / 2)]; }
        else { lx = x0 + i * 104; ly = L.leg[0]; }
        S("rect", { x: lx, y: ly - 10, width: 12, height: 12, rx: 2, class: p.cls, "fill-opacity": p.op }, svg);
        S("text", { x: lx + 18, y: ly, class: "t t-sm", text: p.n }, svg);
      });
      S("text", { x: x0, y: L.t2, class: "t t-sm", "font-weight": 600, text: compact ? "Needed right now vs clutter" : "Of what's loaded: needed right now vs clutter" }, svg);
      els.frame2 = S("rect", { x: x0, y: L.bar2, width: x1 - x0, height: L.bh2, rx: 4, class: "f-none", stroke: "var(--ink-2)", "stroke-width": 1.5, "stroke-dasharray": "5 4" }, svg);
      els.need = S("rect", { x: x0, y: L.bar2, width: 0, height: L.bh2, class: "f-blue", "fill-opacity": 0.9 }, svg);
      els.clutter = S("rect", { x: x0, y: L.bar2, width: 0, height: L.bh2, class: "f-orange", "fill-opacity": 0.45 }, svg);
      [["f-blue", 0.9, "needed"], ["f-orange", 0.45, "clutter"]].forEach(function (k, i) {
        var lx = x0 + i * (compact ? 110 : 140);
        S("rect", { x: lx, y: L.leg2 - 10, width: 12, height: 12, rx: 2, class: k[0], "fill-opacity": k[1] }, svg);
        S("text", { x: lx + 18, y: L.leg2, class: "t t-sm", text: k[2] }, svg);
      });
      draw();
    }

    function fmt(k) { return k >= 1000 ? (k / 1000).toFixed(k % 1000 ? 2 : 0) + "M" : k + "k"; }

    function draw() {
      var v = vals(), r = compute(v, opt), L = els.L, x0 = els.x0, x1 = els.x1, w = x1 - x0;
      var scale = Math.max(limit, r.total);
      var acc = 0;
      PARTS.forEach(function (p, i) {
        var val = r.used[p.k];
        els.segs[i].setAttribute("x", x0 + acc / scale * w);
        els.segs[i].setAttribute("width", Math.max(0, val / scale * w));
        acc += val;
      });
      var lx = x0 + limit / scale * w;
      els.limLine.setAttribute("x1", lx); els.limLine.setAttribute("x2", lx);
      els.limLbl.setAttribute("x", lx);
      els.frame.setAttribute("width", w * limit / scale);
      els.title.textContent = "Context window: " + fmt(limit) + " limit";
      var tot = Math.max(r.total, 0.0001);
      els.need.setAttribute("width", r.total ? r.need / tot * w : 0);
      els.clutter.setAttribute("x", x0 + (r.total ? r.need / tot * w : 0));
      els.clutter.setAttribute("width", r.total ? (r.total - r.need) / tot * w : 0);
      var pctUsed = Math.round(r.total / limit * 100), pctNeed = r.total ? Math.round(r.need / r.total * 100) : 0;
      readout.textContent = "used " + fmt(r.total) + " of " + fmt(limit) + " (" + pctUsed + "%) · needed now " + r.need + "k (" + pctNeed + "% of used) · free " + (r.total > limit ? "none" : fmt(limit - r.total));
      var msg;
      if (r.total > limit) msg = "⚠ Over the limit. The request fails, or the app has to cut something, often older context you still needed.";
      else if (pctNeed < 25) msg = "⚠ Mostly clutter: only " + pctNeed + "% of what the model reads matters for the next step. Instructions and key facts get buried, and quality drops (context rot). Try the techniques.";
      else if (r.total > 0.8 * limit) msg = "Nearly full. One more large tool result and you are over the limit.";
      else msg = "Lean: most of what the model reads is relevant, with room to spare.";
      hint.textContent = msg;
      root.querySelectorAll("output[data-k]").forEach(function (o) { o.textContent = sliders[o.dataset.k].value + "k"; });
    }

    root.addEventListener("input", function (e) { if (e.target.matches("input[type=range]")) draw(); });
    root.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.limit) {
        limit = +b.dataset.limit;
        root.querySelectorAll("[data-limit]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      } else if (b.dataset.opt) {
        opt[b.dataset.opt] = !opt[b.dataset.opt];
        b.setAttribute("aria-pressed", String(opt[b.dataset.opt]));
      } else if (b.dataset.act === "reset") {
        for (var k in sliders) sliders[k].value = sliders[k].defaultValue;
        opt = { tools: false, results: false, hist: false }; limit = 200;
        root.querySelectorAll("[data-limit]").forEach(function (x) { x.setAttribute("aria-pressed", String(x.dataset.limit === "200")); });
        root.querySelectorAll("[data-opt]").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
      } else return;
      draw();
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
    var root = document.getElementById("ag2-budget");
    if (root) init(root);
  });
})();
