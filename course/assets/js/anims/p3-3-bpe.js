/* P3.3: byte-pair encoding, merge by merge, on a tiny corpus.
   Corpus: low ×4, lowest ×7, fastest ×5, longest ×5 (10 distinct characters, 124 symbols).
   Merges: s+t (22), e+st (17), l+o (16), lo+w (11), low+est (7); symbols after each merge:
   102, 85, 69, 58, 51. "slowest" (unseen) encodes to s | lowest. Verified in Python.
   LC.bpe is shared with the playground. */
(function () {
  var LC = window.LC;

  /* ---- a tiny BPE ---- */
  function countPairs(segs, counts) {
    var pc = new Map();
    segs.forEach(function (t, w) {
      for (var i = 0; i + 1 < t.length; i++) {
        var k = t[i] + "\u0000" + t[i + 1];
        pc.set(k, (pc.get(k) || 0) + counts[w]);
      }
    });
    var arr = [];
    pc.forEach(function (c, k) { var ab = k.split("\u0000"); arr.push({ a: ab[0], b: ab[1], c: c }); });
    arr.sort(function (x, y) { return y.c - x.c; }); // stable: ties keep first-seen order
    return arr;
  }
  function applyMerge(t, a, b) {
    var out = [];
    for (var i = 0; i < t.length; i++) {
      if (i + 1 < t.length && t[i] === a && t[i + 1] === b) { out.push(a + b); i++; }
      else out.push(t[i]);
    }
    return out;
  }
  function train(words, counts, n) {
    var segs = words.map(function (w) { return Array.from(w); });
    var states = [segs], merges = [], tables = [];
    for (var k = 0; k < n; k++) {
      var pc = countPairs(segs, counts);
      tables.push(pc);
      if (!pc.length || pc[0].c < 2) break;
      var best = pc[0];
      merges.push([best.a, best.b, best.c]);
      segs = segs.map(function (t) { return applyMerge(t, best.a, best.b); });
      states.push(segs);
    }
    tables.push(countPairs(segs, counts));
    return { states: states, merges: merges, tables: tables };
  }
  function encode(word, merges) {
    var t = Array.from(word), steps = [t];
    merges.forEach(function (m) { var n = applyMerge(t, m[0], m[1]); if (n.length !== t.length) steps.push(n); t = n; });
    return { tokens: t, steps: steps };
  }
  LC.bpe = { train: train, encode: encode, countPairs: countPairs, applyMerge: applyMerge };

  var WORDS = ["low", "lowest", "fastest", "longest"], COUNTS = [4, 7, 5, 5];
  var R = train(WORDS, COUNTS, 5);
  function total(segs) { return segs.reduce(function (a, t, w) { return a + t.length * COUNTS[w]; }, 0); }

  LC.anims["p3-3-bpe"] = {
    title: "Byte-pair encoding, one merge at a time",
    steps: [
      "A tiny training corpus: four words and how often each appears. Start by splitting everything into <strong>single characters</strong>. That's 10 distinct symbols, and the corpus is 124 symbols long.",
      "<strong>Count every adjacent pair</strong>, weighted by how often its word appears. <strong>s t</strong> occurs 22 times (once in lowest ×7, twice in fastest ×5, once in longest ×5), more than any other pair.",
      "<strong>Merge</strong> the winner: every “s t” becomes one new symbol, <strong>st</strong>, which is added to the vocabulary. Then recount. Now <strong>e st</strong> leads with 17.",
      "Merge #2 creates <strong>est</strong>, a suffix shared by three words. Merges can build on earlier merges. Next up: <strong>l o</strong> (16).",
      "Merge #3: <strong>lo</strong>. The corpus keeps getting shorter: 124 symbols at the start, 69 now.",
      "Merge #4: <strong>low</strong> becomes a single token, since it's a frequent word on its own.",
      "Merge #5: <strong>lowest</strong>. Frequent words end up as one token, rarer ones as a few pieces. We stop at our target size: 10 characters + 5 merges = <strong>15 tokens</strong>, and the corpus shrank from 124 to 51 symbols.",
      "To <strong>encode</strong> new text, replay the merges in the order they were learned. “slowest” never appeared in training, yet it splits cleanly into known tokens: <strong>s + lowest</strong>."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 330 } : { w: 640, h: 330 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var slot = compact ? 30 : 40, tileH = 26, x0 = compact ? 40 : 70, rowY0 = 58, rowH = 36;
      var sm = compact ? " t-sm" : "";
      var tl = gsap.timeline();

      S("text", { x: 4, y: 18, class: "t t-muted" + sm, text: "corpus (word × count)" }, svg);
      WORDS.forEach(function (w, i) { S("text", { x: x0 - 8, y: rowY0 + i * rowH + 18, class: "t t-sm t-muted t-end", text: "×" + COUNTS[i] }, svg); });

      // counters (row 2) — one text per state, crossfaded
      var counters = R.states.map(function (segs, k) {
        var t = S("text", { x: 4, y: 42, class: "t t-sm t-mono", text: "vocab " + (10 + k) + " · corpus " + total(segs) + " symbols" }, svg);
        t.style.opacity = k ? 0 : 1; return t;
      });

      // tiles: one element per (word, start, end); reused across states while unchanged
      var tiles = {};
      function tile(w, s, e, label, y) {
        var key = w + ":" + s + ":" + e + ":" + y;
        if (tiles[key]) return tiles[key];
        var g = S("g", {}, svg);
        var x = x0 + s * slot + 2, wd = (e - s) * slot - 4;
        S("rect", { x: x, y: y, width: wd, height: tileH, rx: 6, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, g);
        S("text", { x: x + wd / 2, y: y + 18, class: "t t-mono t-mid t-nohalo" + sm, text: label }, g);
        var hl = S("rect", { x: x - 1, y: y - 1, width: wd + 2, height: tileH + 2, rx: 7, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 2.5 }, g);
        hl.style.opacity = 0;
        tiles[key] = { g: g, hl: hl };
        return tiles[key];
      }
      function stateTiles(segs) {
        var list = [];
        segs.forEach(function (t, w) {
          var pos = 0;
          t.forEach(function (tok) { var L = Array.from(tok).length; list.push(tile(w, pos, pos + L, tok, rowY0 + w * rowH)); pos += L; });
        });
        return list;
      }
      var stTiles = R.states.map(stateTiles);
      Object.keys(tiles).forEach(function (k) { tiles[k].g.style.opacity = 0; });
      stTiles[0].forEach(function (t) { t.g.style.opacity = 1; });

      // pair panel: top-3 pair counts for each state
      var pairY = 226;
      var pairHead = S("text", { x: 4, y: pairY - 14, class: "t t-sm t-muted", text: "most frequent pairs" }, svg);
      pairHead.style.opacity = 0;
      var colX = compact ? [4, 124, 244] : [4, 190, 376];
      var panels = R.tables.slice(0, 5).map(function (pc) {
        var g = S("g", {}, svg);
        pc.slice(0, 3).forEach(function (p, j) {
          var txt = p.a + " + " + p.b + ": " + p.c;
          if (j === 0) S("rect", { x: colX[j] - 2, y: pairY - 2, width: compact ? 112 : 150, height: 24, rx: 6, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 2 }, g);
          S("text", { x: colX[j] + 6, y: pairY + 15, class: "t t-mono" + sm + (j === 0 ? " t-orange" : ""), "font-weight": j === 0 ? 700 : 400, text: txt }, g);
        });
        g.style.opacity = 0;
        return g;
      });

      // merges learned (new vocabulary entries)
      var mY = 284;
      var mHead = S("text", { x: 4, y: mY - 12, class: "t t-sm t-muted", text: "merges learned → new tokens" }, svg);
      mHead.style.opacity = 0;
      var cx = 4, chips = R.merges.map(function (m, i) {
        var lab = m[0] + m[1], wd = 18 + lab.length * (compact ? 7.5 : 9);
        var g = S("g", {}, svg);
        S("rect", { x: cx, y: mY, width: wd, height: 26, rx: 13, class: "f-orange" }, g);
        S("text", { x: cx + wd / 2, y: mY + 18, class: "t t-mono t-mid t-nohalo" + sm, style: "fill:#fff", "font-weight": 650, text: lab }, g);
        cx += wd + 8;
        g.style.opacity = 0;
        return g;
      });
      tl.addLabel("s0", 0);

      // s1: count pairs; outline every occurrence of the winning pair
      var occ = S("g", {}, svg);
      R.states[0].forEach(function (t, w) {
        for (var i = 0; i + 1 < t.length; i++) if (t[i] === R.merges[0][0] && t[i + 1] === R.merges[0][1])
          S("rect", { x: x0 + i * slot, y: rowY0 + w * rowH - 2, width: 2 * slot, height: tileH + 4, rx: 8, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 2.5 }, occ);
      });
      occ.style.opacity = 0;
      LC.popIn(tl, [pairHead, panels[0]], { duration: 0.35 }, "+=0.02");
      LC.popIn(tl, occ, { duration: 0.4 });
      tl.addLabel("s1");

      // s2..s6: merges
      var lastHL = [];
      for (var k = 1; k <= R.merges.length; k++) {
        var before = stTiles[k - 1], after = stTiles[k];
        var gone = before.filter(function (t) { return after.indexOf(t) < 0; });
        var born = after.filter(function (t) { return before.indexOf(t) < 0; });
        var fadeOut = gone.map(function (t) { return t.g; }).concat(lastHL, k === 1 ? [occ] : []);
        tl.to(fadeOut, { opacity: 0, duration: 0.3 }, "+=0.02");
        tl.to(born.map(function (t) { return t.g; }), { opacity: 1, duration: 0.35 }, "<0.15");
        tl.to(born.map(function (t) { return t.hl; }), { opacity: 1, duration: 0.25 }, "<");
        tl.to(counters[k - 1], { opacity: 0, duration: 0.2 }, "<");
        tl.to(counters[k], { opacity: 1, duration: 0.3 }, "<0.1");
        if (k === 1) LC.popIn(tl, mHead, { duration: 0.3 }, "<");
        tl.to(chips[k - 1], { opacity: 1, duration: 0.3 }, "<");
        tl.to(panels[k - 1], { opacity: 0, duration: 0.25 });
        if (k < R.merges.length) tl.to(panels[k], { opacity: 1, duration: 0.3 });
        else tl.to(pairHead, { opacity: 0, duration: 0.25 }, "<");
        lastHL = born.map(function (t) { return t.hl; });
        tl.addLabel("s" + (k + 1));
      }

      // s7: encode an unseen word, replaying the merges in order
      var enc = encode("slowest", R.merges);
      var eY = 214, eTiles = [];
      var eHead = S("text", { x: 4, y: eY + 18, class: "t t-sm t-muted", text: compact ? "new:" : "new word:" }, svg);
      var ex0 = x0;
      var encG = S("g", {}, svg);
      var stepGroups = enc.steps.map(function (toks) {
        var g = S("g", {}, encG), pos = 0;
        toks.forEach(function (tok) {
          var L = Array.from(tok).length, x = ex0 + pos * slot + 2, wd = L * slot - 4;
          S("rect", { x: x, y: eY, width: wd, height: tileH, rx: 6, class: L > 1 ? "f-surface" : "f-surface", stroke: L > 1 ? "var(--a-orange)" : "var(--line)", "stroke-width": L > 1 ? 2.5 : 1.5 }, g);
          S("text", { x: x + wd / 2, y: eY + 18, class: "t t-mono t-mid t-nohalo" + sm, text: tok }, g);
          pos += L;
        });
        g.style.opacity = 0;
        return g;
      });
      eHead.style.opacity = 0;
      tl.to(lastHL, { opacity: 0, duration: 0.3 }, "+=0.02");
      LC.popIn(tl, [eHead], { duration: 0.3 }, "<");
      tl.to(stepGroups[0], { opacity: 1, duration: 0.3 });
      for (var s = 1; s < stepGroups.length; s++) {
        tl.to(stepGroups[s - 1], { opacity: 0, duration: 0.15 }, "+=0.25");
        tl.to(stepGroups[s], { opacity: 1, duration: 0.15 }, "<");
      }
      tl.addLabel("s7");
      return tl;
    }
  };
})();
