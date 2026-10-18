/* A1.2: the CTC collapse rule on 12 frames ("hhe_ll_loo__" -> "hello"),
   why the blank is needed, and that many alignments collapse to the same text. */
(function () {
  var LC = window.LC;
  var PATH = "hhe_ll_loo__".split("");
  var ALTS = ["_heel_llo___", "he__l__loooo", "hhhel_lo____"];
  function merge(a) { return a.filter(function (c, i) { return i === 0 || c !== a[i - 1]; }); }
  function sym(c) { return c === "_" ? "ε" : c; }
  // pseudo-random but fixed "spectrogram" shades
  function shade(i, j) { var v = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453; return 0.15 + 0.75 * (v - Math.floor(v)); }

  LC.anims["a1-2-ctc"] = {
    title: "CTC: from frames to text",
    steps: [
      "The recognizer sees speech as a sequence of short <strong>frames</strong>, here 12 of them. The transcript, “hello”, has only 5 letters, and nothing says which frames belong to which letter.",
      "CTC lets the network output <strong>one symbol per frame</strong>: a letter, or the <strong>blank</strong> ε meaning “nothing new here”. These are the most likely symbols, frame by frame.",
      "Collapse rule, part 1: <strong>merge runs of the same symbol</strong>. hh → h, ll → l, oo → o, εε → ε.",
      "Part 2: <strong>drop the blanks</strong>. The blank between the two l's kept them apart, so the result keeps its double l: <strong>hello</strong>.",
      "Without a blank, “l l l” would merge into a single l, and the model could never spell <em>hello</em>. That's why the blank is part of the alphabet.",
      "Many different frame paths, called <strong>alignments</strong>, collapse to the same text. Here are three more for “hello”.",
      "CTC never chooses one. Training <strong>adds up the probability of every alignment</strong> that collapses to the transcript (with a fast dynamic program) and minimizes $-\\log$ of that sum."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 330 } : { w: 640, h: 330 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var cw = compact ? 26 : 40, ch = compact ? 26 : 30, gap = compact ? 2 : 4;
      var x0 = (W - (12 * cw + 11 * gap)) / 2;
      function cx(i, n, left) { var start = left != null ? left : (W - (n * cw + (n - 1) * gap)) / 2; return start + i * (cw + gap); }
      var tl = gsap.timeline();
      var main = S("g", {}, svg);

      // s0: frames as a spectrogram strip
      S("text", { x: x0, y: 18, class: "t t-sm t-muted", text: compact ? "12 audio frames · target “hello”" : "12 audio frames (about 20 ms each) · target text “hello”" }, main);
      var specTop = 28, specRows = 6, sh = 7;
      for (var i = 0; i < 12; i++) for (var j = 0; j < specRows; j++)
        S("rect", { x: cx(i, 12, x0), y: specTop + j * sh, width: cw, height: sh - 1, class: "f-blue", "fill-opacity": shade(i, j).toFixed(2) }, main);
      tl.addLabel("s0", 0);

      function row(chars, y, left, cls) {
        var g = S("g", {}, main), cells = [];
        chars.forEach(function (c, k) {
          var x = cx(k, chars.length, left), cg = S("g", {}, g);
          S("rect", { x: x, y: y, width: cw, height: ch, rx: 5, class: c === "_" ? "f-surface2" : "f-surface", stroke: c === "_" ? "var(--a-faint)" : "var(--a-ink)", "stroke-width": 1.2 }, cg);
          S("text", { x: x + cw / 2, y: y + ch / 2 + 5, class: "t t-mid t-mono" + (c === "_" ? " t-muted" : ""), text: sym(c) }, cg);
          cells.push(cg);
        });
        return { g: g, cells: cells };
      }

      // s1: per-frame best symbols
      var y1 = compact ? 104 : 106;
      var l1 = S("text", { x: x0, y: y1 - 8, class: "t t-sm t-muted", text: "best symbol per frame" }, main);
      var r1 = row(PATH, y1, x0);
      LC.popIn(tl, l1, { duration: 0.3 });
      LC.popIn(tl, r1.cells, { duration: 0.25, stagger: 0.05 }, "<");
      tl.addLabel("s1");

      // s2: highlight runs, then the merged row
      var runs = [], start = 0;
      for (var k = 1; k <= PATH.length; k++) if (k === PATH.length || PATH[k] !== PATH[start]) { if (k - start > 1) runs.push([start, k - 1]); start = k; }
      var hl = runs.map(function (r) {
        return S("rect", { x: cx(r[0], 12, x0) - 2, y: y1 - 2, width: (r[1] - r[0] + 1) * (cw + gap) - gap + 4, height: ch + 4, rx: 7, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 2.5 }, main);
      });
      var merged = merge(PATH);
      var y2 = y1 + (compact ? 64 : 66);
      var l2 = S("text", { x: cx(0, merged.length), y: y2 - 8, class: "t t-sm t-orange", text: "1 · merge repeats" }, main);
      var r2 = row(merged, y2);
      LC.popIn(tl, hl, { duration: 0.3, stagger: 0.08 });
      LC.popIn(tl, [l2], { duration: 0.3 });
      LC.popIn(tl, r2.cells, { duration: 0.25, stagger: 0.04 }, "<");
      tl.addLabel("s2");

      // s3: drop blanks
      var word = merged.filter(function (c) { return c !== "_"; });
      var y3 = y2 + (compact ? 64 : 66);
      var l3 = S("text", { x: cx(0, word.length), y: y3 - 8, class: "t t-sm t-orange", text: "2 · drop blanks" }, main);
      var r3 = row(word, y3);
      var blanks2 = r2.cells.filter(function (_, i) { return merged[i] === "_"; });
      tl.to(blanks2, { opacity: 0.25, duration: 0.3 });
      LC.popIn(tl, [l3], { duration: 0.3 });
      LC.popIn(tl, r3.cells, { duration: 0.25, stagger: 0.05 }, "<");
      var ok = S("text", { x: cx(4, 5) + cw + 10, y: y3 + ch / 2 + 5, class: "t t-orange", text: "✓" }, main);
      LC.popIn(tl, ok, { duration: 0.3 });
      tl.addLabel("s3");

      // s4: what goes wrong without a blank
      var y4 = y3 + ch + (compact ? 30 : 34);
      var bad = S("text", { x: W / 2, y: y4, class: "t t-sm t-mid", text: compact ? "no blank: hhellloo → “helo” ✗" : "without a blank:  h h e l l l o o  →  merge  →  “helo” ✗" }, main);
      LC.popIn(tl, bad, { duration: 0.4 });
      tl.addLabel("s4");

      // s5: three other alignments
      var alt = S("g", {}, svg);
      alt.style.opacity = 0;
      var ax = compact ? 8 : 40, ay0 = compact ? 104 : 106, astep = compact ? 50 : 52;
      var altRows = ALTS.map(function (a, n) {
        var y = ay0 + n * astep, g = S("g", {}, alt);
        a.split("").forEach(function (c, k) {
          var x = ax + k * (cw - (compact ? 4 : 0) + gap), w = cw - (compact ? 4 : 0);
          S("rect", { x: x, y: y, width: w, height: ch - 2, rx: 5, class: c === "_" ? "f-surface2" : "f-surface", stroke: c === "_" ? "var(--a-faint)" : "var(--a-ink)", "stroke-width": 1.2 }, g);
          S("text", { x: x + w / 2, y: y + ch / 2 + 4, class: "t t-mid t-mono" + (c === "_" ? " t-muted" : ""), text: sym(c) }, g);
        });
        var endX = ax + 12 * (cw - (compact ? 4 : 0) + gap) + 4;
        S("text", { x: endX, y: y + ch / 2 + 4, class: "t t-sm t-orange", text: compact ? "→ hello" : "→  “hello”" }, g);
        g.style.opacity = 0;
        return g;
      });
      var altLbl = S("text", { x: ax, y: ay0 - 8, class: "t t-sm t-muted", text: "other alignments of the same text" }, alt);
      tl.to(main.querySelectorAll("g, text, rect"), { opacity: function (i, el) { return el.parentNode === main && el.tagName === "rect" && +el.getAttribute("y") < 80 ? 1 : 0; }, duration: 0.4 });
      tl.set(alt, { opacity: 1 });
      tl.to(altRows, { opacity: 1, duration: 0.3, stagger: 0.15 });
      tl.addLabel("s5");

      // s6: sum of probabilities
      var sy = ay0 + 3 * astep + (compact ? 14 : 10);
      var sum1 = S("text", { x: ax, y: sy, class: "t t-sm", text: compact ? "P(“hello”) = sum over all paths" : "P(“hello” | audio) = sum over every path that collapses to “hello”" }, alt);
      var sum2 = S("text", { x: ax, y: sy + 22, class: "t t-sm t-muted", text: compact ? "of the product of per-frame probs" : "of the product of its per-frame probabilities; loss = −log P" }, alt);
      var plus = [0, 1].map(function (n) { return S("text", { x: compact ? W - 14 : W - 40, y: ay0 + n * astep + astep - 4, class: "t t-orange t-mid", text: "+" }, alt); });
      LC.popIn(tl, plus.concat([sum1, sum2]), { duration: 0.4, stagger: 0.1 });
      tl.addLabel("s6");
      return tl;
    }
  };
})();
