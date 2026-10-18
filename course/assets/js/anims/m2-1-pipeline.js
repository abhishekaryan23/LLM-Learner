/* M2.1: a toy crawl of 60 web pages going through a pretraining-data pipeline.
   Counts are illustrative (real pipelines throw away a much larger share).
   The final mix is the one reported for Llama 3 (Dubey et al., 2024). */
(function () {
  var LC = window.LC;
  var N = 60, COLS = 10, ROWS = 6;
  // Deterministic shuffle so the "removed" pages look scattered but never change.
  var order = [];
  for (var i = 0; i < N; i++) order.push(i);
  var seed = 7;
  function rnd() { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }
  for (var j = N - 1; j > 0; j--) { var k = Math.floor(rnd() * (j + 1)); var t = order[j]; order[j] = order[k]; order[k] = t; }
  var CUT = { extract: 4, lang: 8, quality: 16, dedup: 6, toxic: 2, decon: 2 };
  var sets = {}, p = 0;
  Object.keys(CUT).forEach(function (key) { sets[key] = order.slice(p, p + CUT[key]); p += CUT[key]; });
  var kept = order.slice(p);                       // 22 pages survive
  var dupOf = kept.slice(0, CUT.dedup);            // originals of the 6 duplicates
  var pii = kept.slice(6, 10);                     // pages that get an email/phone redacted
  var MIX = [["general knowledge", 50, "f-blue"], ["math & reasoning", 25, "f-orange"], ["code", 17, "f-ink"], ["multilingual", 8, "f-faint"]];
  var STAGES = ["Raw crawl", "Extract text", "Language ID", "Quality filter", "Deduplicate", "PII & toxicity", "Decontaminate", "Mix sources"];

  LC.anims["m2-1-pipeline"] = {
    title: "From raw crawl to training mix",
    steps: [
      "A <strong>raw crawl</strong>: billions of HTML pages, full of menus, ads and cookie banners. Here, 60 stand-ins.",
      "<strong>Extract</strong> the main text from the HTML and drop the boilerplate. Pages with no real text left (login walls, image galleries) go.",
      "<strong>Language ID</strong>: a fast classifier labels each page's language. Keep the languages you're training on.",
      "<strong>Quality filtering</strong>, the biggest cut: rules (too short, too many symbols, no full sentences) plus a <strong>classifier</strong> that scores how useful a page looks.",
      "<strong>Deduplicate</strong>: exact copies and <strong>near-duplicates</strong> (found with MinHash) are collapsed to a single page. Blue = kept original, orange = removed copy.",
      "<strong>PII &amp; toxicity</strong>: emails and phone numbers are masked (orange lines); pages flagged as toxic or adult are removed.",
      "<strong>Decontaminate</strong>: pages that overlap with benchmark test questions are removed, so later scores aren't inflated (M4.3).",
      "<strong>Mix</strong> the cleaned sources. Llama 3's reported mix: about <strong>50%</strong> general knowledge, <strong>25%</strong> math &amp; reasoning, <strong>17%</strong> code, <strong>8%</strong> multilingual."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 330 } : { w: 640, h: 330 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var cw = compact ? 28 : 34, ch = compact ? 34 : 38, gx = 6, gy = 6;
      var gridW = COLS * cw + (COLS - 1) * gx;
      var x0 = compact ? (W - gridW) / 2 : W - gridW - 16, y0 = compact ? 60 : 40;
      var tl = gsap.timeline();
      var stage = S("g", {}, svg);

      // ---- header: stage name + kept counter (one text per step, cross-faded)
      var heads = [], counts = [], alive = N;
      var keptAfter = [N, N - CUT.extract];
      keptAfter.push(keptAfter[1] - CUT.lang, keptAfter[1] - CUT.lang - CUT.quality);
      keptAfter.push(keptAfter[3] - CUT.dedup, keptAfter[3] - CUT.dedup - CUT.toxic, keptAfter[3] - CUT.dedup - CUT.toxic - CUT.decon);
      keptAfter.push(keptAfter[6]);
      STAGES.forEach(function (s, i) {
        if (compact) heads.push(S("text", { x: 4, y: 22, class: "t t-lg", text: (i + 1) + " · " + s }, svg));
        counts.push(S("text", compact ? { x: 4, y: 44, class: "t t-sm t-muted", text: "kept " + keptAfter[i] + " of " + N + " pages" }
                                       : { x: W - 16, y: 24, class: "t t-sm t-muted t-end", text: "kept " + keptAfter[i] + " of " + N + " pages" }, svg));
      });
      // wide: a stage list down the left side
      var list = [];
      if (!compact) {
        S("text", { x: 16, y: 24, class: "t t-sm t-muted", text: "pipeline stage" }, svg);
        STAGES.forEach(function (s, i) {
          var y = 58 + i * 32;
          var dim = S("text", { x: 16, y: y, class: "t t-muted", text: (i + 1) + "  " + s }, svg);
          var on = S("text", { x: 16, y: y, class: "t t-orange", "font-weight": 650, text: (i + 1) + "  " + s }, svg);
          on.style.opacity = i === 0 ? 1 : 0;
          dim.style.opacity = i === 0 ? 0 : 1;
          list.push({ on: on, dim: dim });
        });
      }
      heads.forEach(function (h, i) { h.style.opacity = i === 0 ? 1 : 0; });
      counts.forEach(function (h, i) { h.style.opacity = i === 0 ? 1 : 0; });
      function swapHead(i) {
        var a = [], b = [];
        if (compact) { a.push(heads[i - 1]); b.push(heads[i]); }
        else { a.push(list[i - 1].on, list[i].dim); b.push(list[i - 1].dim, list[i].on); }
        if (keptAfter[i] !== keptAfter[i - 1] || i === 1) { a.push(counts[i - 1]); b.push(counts[i]); }
        else { tl.set(counts[i - 1], { opacity: 0 }); tl.set(counts[i], { opacity: 1 }); }
        tl.to(a, { opacity: 0, duration: 0.2 });
        tl.to(b, { opacity: 1, duration: 0.25 });
      }

      // ---- the pages
      var docs = [];
      for (var d = 0; d < N; d++) {
        var c = d % COLS, r = Math.floor(d / COLS);
        var x = x0 + c * (cw + gx), y = y0 + r * (ch + gy);
        var g = S("g", {}, stage);
        var box = S("rect", { x: x, y: y, width: cw, height: ch, rx: 4, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, g);
        var nav = S("rect", { x: x + 3, y: y + 3, width: cw - 6, height: 5, rx: 1.5, class: "f-faint" }, g);
        var ad = S("rect", { x: x + cw - 11, y: y + ch - 10, width: 8, height: 7, rx: 1.5, class: "f-faint" }, g);
        var lines = [0, 1, 2].map(function (l) {
          var lw = [cw - 8, cw - 12, cw - 16][l];
          return S("rect", { x: x + 4, y: y + 12 + l * 6, width: lw, height: 2.6, rx: 1, class: "f-ink", "fill-opacity": 0.45 }, g);
        });
        docs.push({ g: g, box: box, junk: [nav, ad], lines: lines });
      }
      var note = S("text", { x: compact ? 4 : x0, y: compact ? 318 : 322, class: "t t-sm t-muted", text: compact ? "faded = removed (illustrative counts)" : "faded = removed · counts are illustrative" }, svg);
      tl.addLabel("s0", 0);

      var lastCut = [];
      function cut(idx) {
        // previous step's removals fade further; this step's get an orange outline and half fade
        if (lastCut.length) tl.to(lastCut.map(function (i) { return docs[i].g; }), { opacity: 0.1, duration: 0.25 });
        tl.set(idx.map(function (i) { return docs[i].box; }), { attr: { stroke: "var(--a-orange)" } });
        tl.to(idx.map(function (i) { return docs[i].g; }), { opacity: 0.35, duration: 0.4, stagger: 0.03 });
        lastCut = idx;
      }

      // s1: extract text
      swapHead(1);
      tl.to(docs.map(function (dd) { return dd.junk; }).flat(), { opacity: 0, duration: 0.5 });
      tl.to(sets.extract.map(function (i) { return docs[i].lines; }).flat(), { opacity: 0, duration: 0.3 }, "<");
      cut(sets.extract);
      tl.addLabel("s1");

      // s2: language ID
      swapHead(2);
      cut(sets.lang);
      tl.addLabel("s2");

      // s3: quality
      swapHead(3);
      cut(sets.quality);
      tl.addLabel("s3");

      // s4: dedup (originals in blue, copies removed)
      swapHead(4);
      var origBoxes = dupOf.map(function (i) { return docs[i].box; });
      tl.set(origBoxes, { attr: { stroke: "var(--a-blue)", "stroke-width": 2.5 } });
      cut(sets.dedup);
      tl.addLabel("s4");

      // s5: PII masks + toxic removals
      swapHead(5);
      tl.set(origBoxes, { attr: { stroke: "var(--line)", "stroke-width": 1.5 } });
      tl.set(pii.map(function (i) { return docs[i].lines[1]; }), { attr: { class: "f-orange", "fill-opacity": 1, height: 3.5 } }, "+=0.2");
      cut(sets.toxic);
      tl.addLabel("s5");

      // s6: decontamination
      swapHead(6);
      cut(sets.decon);
      tl.addLabel("s6");

      // s7: the mix
      swapHead(7);
      tl.to([stage, note], { opacity: 0, duration: 0.4 });
      var mix = S("g", {}, svg);
      var bx = compact ? 12 : x0, bw = compact ? W - 24 : gridW, by = compact ? 84 : 70, bh = 40;
      var title = S("text", { x: bx, y: by - 12, class: "t t-sm t-muted", text: compact ? "Llama 3 data mix (share of tokens)" : "Llama 3 pretraining mix, share of tokens (Dubey et al., 2024)" }, mix);
      var acc = 0, segs = [], rows = [];
      MIX.forEach(function (m, i) {
        var seg = S("rect", { x: bx + bw * acc / 100, y: by, width: Math.max(0, bw * m[1] / 100 - 2), height: bh, rx: 4, class: m[2] }, mix);
        seg.setAttribute("data-w", seg.getAttribute("width")); seg.setAttribute("width", 0);
        segs.push(seg);
        acc += m[1];
        var ly = by + bh + 34 + i * 30;
        var sw = S("rect", { x: bx, y: ly - 12, width: 14, height: 14, rx: 3, class: m[2] }, mix);
        var lt = S("text", { x: bx + 22, y: ly, class: "t", text: m[0] }, mix);
        var lv = S("text", { x: bx + (compact ? 230 : 260), y: ly, class: "t t-mono t-end", "font-weight": 650, text: m[1] + "%" }, mix);
        rows.push([sw, lt, lv]);
      });
      LC.popIn(tl, title, { duration: 0.3 });
      segs.forEach(function (s, i) { tl.to(s, { attr: { width: s.getAttribute("data-w") }, duration: 0.45, ease: "power2.out" }, i ? "<0.15" : undefined); });
      LC.popIn(tl, rows.flat(), { duration: 0.3, stagger: 0.05 }, "-=0.2");
      tl.addLabel("s7");
      return tl;
    }
  };
})();
