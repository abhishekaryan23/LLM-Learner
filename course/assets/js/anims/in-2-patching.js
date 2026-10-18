/* IN.2: activation patching on a toy two-prompt example. Clean "Eiffel Tower is in" → Paris,
   corrupted "Big Ben is in" → London. Patch one (layer, position) residual-stream state from the
   clean run into the corrupted run and watch P(Paris) recover. The numbers are illustrative,
   shaped like the causal-tracing results of Meng et al. (2022): the last subject token in early
   and middle layers, and the last token in late layers. Patched probabilities are computed from
   the recovery fractions below, so the heatmap and the bars agree. */
(function () {
  var LC = window.LC;
  var CLEAN = ["Eiffel", "Tower", "is", "in"];
  var CORR = ["Big", "Ben", "is", "in"];
  var NL = 6;
  // REC[layer-1][pos]: fraction of the clean P(Paris) recovered by patching that state
  var REC = [
    [0.55, 0.95, 0.00, 0.00],
    [0.45, 0.92, 0.03, 0.02],
    [0.30, 0.85, 0.05, 0.10],
    [0.10, 0.50, 0.08, 0.45],
    [0.03, 0.15, 0.06, 0.85],
    [0.00, 0.03, 0.03, 0.97]
  ];
  var P_CLEAN = { paris: 0.82, london: 0.01 }, P_CORR = { paris: 0.01, london: 0.79 };
  function patched(r) {
    return { paris: P_CORR.paris + r * (P_CLEAN.paris - P_CORR.paris), london: P_CORR.london + r * (P_CLEAN.london - P_CORR.london) };
  }
  var PATCH1 = { l: 2, p: 1 }, PATCH2 = { l: 2, p: 2 };
  var O1 = patched(REC[PATCH1.l - 1][PATCH1.p]), O2 = patched(REC[PATCH2.l - 1][PATCH2.p]);

  LC.anims["in-2-patching"] = {
    title: "Activation patching: which component carries the fact?",
    steps: [
      "<strong>Clean run</strong>: “Eiffel Tower is in” → the model gives <strong>Paris</strong> probability 0.82. Each cell is the residual-stream state at one layer and one token position.",
      "<strong>Corrupted run</strong>: “Big Ben is in”, same length, different subject → Paris 0.01, London 0.79. Every state that depends on the subject has changed (orange).",
      "<strong>Patch one cell</strong>: rerun the corrupted prompt, but at layer 2 on the token “Tower/Ben” paste in the state from the clean run. Paris jumps back to " + O1.paris.toFixed(2) + ": that state carries the fact.",
      "Patch a different cell, layer 2 on “is”, instead: Paris stays at " + O2.paris.toFixed(2) + ". This state doesn't carry the fact on its own.",
      "Repeat for <strong>every cell</strong>, one patch per run. Each number is the <strong>fraction of the clean answer recovered</strong>: $(p_{\\text{patched}} - p_{\\text{corrupt}}) / (p_{\\text{clean}} - p_{\\text{corrupt}})$.",
      "Two hot spots: the <strong>last subject token</strong> in early and middle layers, where the fact is looked up, and the <strong>last token</strong> in late layers, after attention has moved it there to be output. Meng et al. (2022) found this shape in GPT-2 XL. (Numbers here are illustrative.)"
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 326 } : { w: 640, h: 314 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact";
      var L = compact
        ? { title: [8, 20], out: { lx: 8, bx: 70, sc: 200, y1: 46, y2: 70, bh: 14 }, status: [8, 100], gx: 84, gy: 112, cw: 66, ch: 28, tok1: 298, tok2: 314, legend: [8, 100] }
        : { title: [20, 24], out: { lx: 452, bx: 506, sc: 90, y1: 72, y2: 102, bh: 16, head: 50 }, status: [452, 150], gx: 106, gy: 50, cw: 80, ch: 31, tok1: 258, tok2: 276, legend: [106, 304] };
      var tl = gsap.timeline();
      function cx(p) { return L.gx + p * L.cw; }
      function cy(l) { return L.gy + (NL - l) * L.ch; }   // layer 6 at the top

      // titles (cross-faded per step)
      var titles = ["Clean run", "Corrupted run", "Corrupted run + one patch", "Corrupted run + a different patch", "Patch every cell, one at a time", "Where the fact lives"].map(function (t, i) {
        var e = S("text", { x: L.title[0], y: L.title[1], class: "t t-sm", "font-weight": 650, text: t }, svg);
        if (i) e.style.opacity = 0;
        return e;
      });

      // output bars
      var outHead = compact ? null : S("text", { x: L.out.lx, y: L.out.head, class: "t t-sm t-muted", text: "next-token probability" }, svg);
      function outRow(y, name, cls) {
        var n = S("text", { x: L.out.lx, y: y + L.out.bh - 3, class: "t t-sm", text: name }, svg);
        var bg = S("rect", { x: L.out.bx, y: y, width: L.out.sc, height: L.out.bh, rx: 3, class: "f-surface2" }, svg);
        var r = S("rect", { x: L.out.bx, y: y, width: 0, height: L.out.bh, rx: 3, class: cls }, svg);
        var v = S("text", { x: L.out.bx + 6, y: y + L.out.bh - 3, class: "t t-sm t-mono", text: "" }, svg);
        return { r: r, v: v, n: n, bg: bg };
      }
      var rowP = outRow(L.out.y1, "Paris", "f-blue"), rowL = outRow(L.out.y2, "London", "f-orange");
      function setOut(o) {
        [[rowP, o.paris], [rowL, o.london]].forEach(function (a) {
          a[0].r.setAttribute("width", (a[1] * L.out.sc).toFixed(1));
          a[0].v.textContent = a[1].toFixed(2);
          a[0].v.setAttribute("x", (L.out.bx + L.out.sc + 6).toFixed(1));
        });
      }

      // number colour from the cell's effective lightness (blue at alpha over surface-2), theme-aware
      function rgb(h) { h = (h || "").trim().replace("#", ""); if (h.length === 3) h = h.replace(/./g, "$&$&"); var v = parseInt(h, 16); return isNaN(v) ? null : [(v >> 16) & 255, (v >> 8) & 255, v & 255]; }
      function lum(c) { var u = c.map(function (x) { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }); return 0.2126 * u[0] + 0.7152 * u[1] + 0.0722 * u[2]; }
      function numInk(alpha) {
        var cs = getComputedStyle(svg), fg = rgb(cs.getPropertyValue("--a-blue")), bg = rgb(cs.getPropertyValue("--surface-2"));
        if (!fg || !bg) return "";
        var mix = fg.map(function (x, i) { return x * alpha + bg[i] * (1 - alpha); }), L = lum(mix);
        var dark = [16, 19, 26], white = [255, 255, 255];
        var cw = 1.05 / (L + 0.05), cd = (L + 0.05) / (lum(dark) + 0.05);
        return cd > cw ? "#10131a" : "#fff";
      }

      // grid
      for (var l = 1; l <= NL; l++) S("text", { x: L.gx - 8, y: cy(l) + L.ch / 2 + 4, class: "t t-sm t-muted t-end", text: "L" + l }, svg);
      var cells = [], nums = [];
      for (var l2 = 1; l2 <= NL; l2++) {
        cells[l2] = []; nums[l2] = [];
        for (var p = 0; p < 4; p++) {
          S("rect", { x: cx(p) + 2, y: cy(l2) + 2, width: L.cw - 4, height: L.ch - 4, rx: 4, class: "f-surface2" }, svg);
          var c = S("rect", { x: cx(p) + 2, y: cy(l2) + 2, width: L.cw - 4, height: L.ch - 4, rx: 4, class: "f-blue", "fill-opacity": 0.3 }, svg);
          cells[l2][p] = c;
          var r = REC[l2 - 1][p];
          var n = S("text", { x: cx(p) + L.cw / 2, y: cy(l2) + L.ch / 2 + 4, class: "t t-sm t-mono t-mid t-nohalo", text: r.toFixed(2) }, svg);
          n.style.opacity = 0;
          nums[l2][p] = n;
        }
      }
      // token labels: clean (blue) and corrupted (orange)
      var tokC = [], tokX = [];
      for (var q = 0; q < 4; q++) {
        tokC.push(S("text", { x: cx(q) + L.cw / 2, y: L.tok1, class: "t t-sm t-mid t-blue", "font-weight": 600, text: CLEAN[q] }, svg));
        var t2 = S("text", { x: cx(q) + L.cw / 2, y: L.tok2, class: "t t-sm t-mid t-orange", "font-weight": 600, text: CORR[q] }, svg);
        t2.style.opacity = 0; tokX.push(t2);
      }
      if (!compact) {
        S("text", { x: L.gx - 8, y: L.tok1, class: "t t-sm t-muted t-end", text: "clean" }, svg);
        var corrLbl = S("text", { x: L.gx - 8, y: L.tok2, class: "t t-sm t-muted t-end", text: "corrupt" }, svg);
        corrLbl.style.opacity = 0; tokX.push(corrLbl);
      }
      var ring = S("rect", { x: 0, y: 0, width: L.cw + 2, height: L.ch + 2, rx: 6, class: "f-none", stroke: "var(--a-ink)", "stroke-width": 3 }, svg);
      ring.style.opacity = 0;
      var status = S("text", { x: L.status[0], y: L.status[1], class: "t t-sm", text: "" }, svg);
      var legend = S("text", { x: L.legend[0], y: L.legend[1], class: "t t-sm t-muted", text: compact ? "cell = fraction of Paris recovered" : "number in each cell = fraction of the clean answer recovered by patching it" }, svg);
      legend.style.opacity = 0;
      var hotA = S("rect", { x: cx(1) + 1, y: cy(3) + 1, width: L.cw - 2, height: 3 * L.ch - 2, rx: 6, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 2.5, "stroke-dasharray": "5 4" }, svg);
      var hotB = S("rect", { x: cx(3) + 1, y: cy(6) + 1, width: L.cw - 2, height: 2 * L.ch - 2, rx: 6, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 2.5, "stroke-dasharray": "5 4" }, svg);
      hotA.style.opacity = 0; hotB.style.opacity = 0;

      // A pure function of the step drives cells, bars, ring and status, so any jump lands right.
      var STATUS = ["", "", "patched: layer 2 · “Tower/Ben”", "patched: layer 2 · “is”", "", ""];
      var OUTS = [P_CLEAN, P_CORR, O1, O2, O2, O2];
      function render(kf) {
        kf = Math.max(0, Math.min(5, kf));
        var k = Math.round(kf);
        titles.forEach(function (t, i) { t.style.opacity = i === k ? 1 : 0; });
        status.textContent = STATUS[k];
        var a = OUTS[Math.floor(kf)], b = OUTS[Math.ceil(kf)], f = kf - Math.floor(kf);
        setOut({ paris: a.paris + (b.paris - a.paris) * f, london: a.london + (b.london - a.london) * f });
        var showOut = k <= 3;
        [rowP.r, rowP.v, rowP.n, rowP.bg, rowL.r, rowL.v, rowL.n, rowL.bg].concat(outHead ? [outHead] : []).forEach(function (e) { e.style.opacity = showOut ? 1 : 0; });
        for (var l = 1; l <= NL; l++) for (var p = 0; p < 4; p++) {
          var c = cells[l][p], n = nums[l][p];
          if (k === 0) { c.setAttribute("class", "f-blue"); c.setAttribute("fill-opacity", 0.3); n.style.opacity = 0; }
          else if (k <= 3) {
            var isPatch = (k === 2 && l === PATCH1.l && p === PATCH1.p) || (k === 3 && l === PATCH2.l && p === PATCH2.p);
            c.setAttribute("class", isPatch ? "f-blue" : "f-orange");
            c.setAttribute("fill-opacity", isPatch ? 0.75 : 0.3);
            n.style.opacity = 0;
          } else {
            c.setAttribute("class", "f-blue");
            c.setAttribute("fill-opacity", (0.06 + 0.94 * REC[l - 1][p]).toFixed(2));
            n.style.opacity = 1;
            n.style.fill = numInk(0.06 + 0.94 * REC[l - 1][p]);
          }
        }
        var pt = k === 2 ? PATCH1 : k === 3 ? PATCH2 : null;
        if (pt) { ring.setAttribute("x", cx(pt.p) + 1 - 2); ring.setAttribute("y", cy(pt.l) + 1 - 2); ring.style.opacity = 1; }
        else ring.style.opacity = 0;
        tokX.forEach(function (t) { t.style.opacity = k >= 1 ? 1 : 0; });
        legend.style.opacity = k >= 4 ? 1 : 0;
        hotA.style.opacity = hotB.style.opacity = k >= 5 ? 1 : 0;
      }
      tl.addLabel("s0", 0);
      var drive = { k: 0 };
      for (var s = 1; s < 6; s++) {
        tl.to(drive, { k: s, duration: 0.6, ease: "none" });
        tl.addLabel("s" + s);
      }
      tl.eventCallback("onUpdate", function () { render(drive.k); });
      render(0);
      return tl;
    }
  };
})();
