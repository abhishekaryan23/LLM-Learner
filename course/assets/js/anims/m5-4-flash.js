/* M5.4: where attention's time goes. Standard attention writes the n×n score
   matrix S and the probability matrix P to slow HBM and reads them back;
   FlashAttention streams Q/K/V tiles through fast on-chip SRAM, keeps a running
   max m, sum ℓ and output accumulator, and only ever writes O.
   Traffic numbers: Dao et al. 2022, Fig. 1 (right) (GPT-2 medium, A100, fwd+bwd):
   standard 40.3 GB of HBM reads/writes, FlashAttention 4.4 GB. */
(function () {
  var LC = window.LC;
  var STD_GB = 40.3, FLASH_GB = 4.4, NB = 4; // NB = blocks per matrix in the drawing

  LC.anims["m5-4-flash"] = {
    title: "Standard vs FlashAttention: who touches HBM?",
    steps: [
      "A GPU has two kinds of memory. <strong>HBM</strong> is big (80 GB on an A100) but comparatively slow (~2 TB/s). <strong>On-chip SRAM</strong> is tiny (~20 MB in total) but roughly 10× faster. $Q$, $K$, $V$ live in HBM.",
      "<strong>Standard attention</strong>, step 1: load $Q$ and $K$, compute the scores $S = QK^\\top$ and <strong>write all $n \\times n$ of them</strong> back to HBM.",
      "Step 2: read $S$ back, apply softmax row by row, and <strong>write another $n \\times n$ matrix</strong> $P$ to HBM.",
      "Step 3: read $P$ and $V$ again to compute $O = PV$. The arithmetic was quick; most of the time went on <strong>moving $n^2$-sized matrices</strong> through the slow link.",
      "<strong>FlashAttention</strong> never stores $S$ or $P$. It cuts $Q$, $K$, $V$ into <strong>tiles</strong> small enough for SRAM and loads one $Q$ tile plus one $K$/$V$ tile.",
      "In SRAM it scores the tile, then updates a <strong>running max $m$</strong>, a <strong>running sum $\\ell$</strong> and an unnormalised output for each row. The next $K$/$V$ tiles stream through the same way.",
      "After the last $K$/$V$ tile it divides by $\\ell$ and <strong>writes only that block of $O$</strong> to HBM. Then the next $Q$ tile repeats the loop.",
      "Same $O$ up to floating-point rounding: <strong>exact, not approximate</strong>. Extra memory is $O(n)$ (just $m$ and $\\ell$ per row), and in the paper's GPT-2 benchmark HBM traffic fell from 40.3 GB to 4.4 GB."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 470 } : { w: 640, h: 400 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var L = compact ? {
        hbmTitle: [12, 18], hbm: [6, 26, 348, 156], labY: 46, mY: 54, mH: 100, mW: 20, mX: [18, 46, 74, 102],
        sX: 136, pX: 246, sq: 100, bus: [150, 210, 182, 240], busLbl: [222, 216],
        sramTitle: [180, 254, "t-mid"], sram: [60, 262, 240, 108], sramTxt: [180, 320],
        tileLabY: 280, tileY: 286, tileW: 32, tileH: 24, tileX: [72, 112, 152, 204], statY: 334, noteY: 358,
        meterTitle: [12, 398], rowLblX: 12, barX: 84, barW: 200, row1: 422, row2: 452
      } : {
        hbmTitle: [12, 18], hbm: [6, 26, 628, 160], labY: 46, mY: 56, mH: 110, mW: 24, mX: [30, 64, 98, 132],
        sX: 200, pX: 340, sq: 110, bus: [140, 200, 186, 240], busLbl: [214, 218],
        sramTitle: [20, 254, ""], sram: [20, 262, 300, 118], sramTxt: [170, 326],
        tileLabY: 282, tileY: 288, tileW: 40, tileH: 26, tileX: [40, 92, 144, 214], statY: 342, noteY: 366,
        meterTitle: [350, 280], rowLblX: 350, barX: 424, barW: 150, row1: 310, row2: 344
      };
      var tl = gsap.timeline();

      // ---- static scene (s0) ----
      S("text", { x: L.hbmTitle[0], y: L.hbmTitle[1], class: "t t-sm t-muted", text: compact ? "HBM · 80 GB · ~2 TB/s" : "HBM (GPU main memory) · 80 GB · ~2 TB/s" }, svg);
      S("rect", { x: L.hbm[0], y: L.hbm[1], width: L.hbm[2], height: L.hbm[3], rx: 10, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, svg);
      var names = ["Q", "K", "V", "O"], cls = ["f-orange", "f-blue", "f-ink", "f-orange"];
      var mats = names.map(function (nm, i) {
        S("text", { x: L.mX[i] + L.mW / 2, y: L.labY, class: "t t-sm t-mid", text: nm, "font-weight": 600 }, svg);
        var frame = S("rect", { x: L.mX[i], y: L.mY, width: L.mW, height: L.mH, rx: 3, class: "f-none", stroke: "var(--a-faint)", "stroke-width": 1.5 }, svg);
        var fill = S("rect", { x: L.mX[i], y: L.mY, width: L.mW, height: L.mH, rx: 3, class: cls[i], "fill-opacity": 0.55 }, svg);
        if (i === 3) fill.style.opacity = 0; // O starts empty
        return { frame: frame, fill: fill };
      });
      S("path", { d: "M" + L.bus[0] + " " + (L.bus[2] + 6) + "V" + (L.bus[3] - 8) + "M" + (L.bus[0] - 6) + " " + (L.bus[3] - 15) + "L" + L.bus[0] + " " + (L.bus[3] - 8) + "L" + (L.bus[0] + 6) + " " + (L.bus[3] - 15), class: "s-faint" }, svg);
      S("path", { d: "M" + L.bus[1] + " " + (L.bus[3] - 8) + "V" + (L.bus[2] + 6) + "M" + (L.bus[1] - 6) + " " + (L.bus[2] + 13) + "L" + L.bus[1] + " " + (L.bus[2] + 6) + "L" + (L.bus[1] + 6) + " " + (L.bus[2] + 13), class: "s-faint" }, svg);
      S("text", { x: L.busLbl[0], y: L.busLbl[1], class: "t t-sm t-muted", text: "~2 TB/s link" }, svg);
      S("text", { x: L.sramTitle[0], y: L.sramTitle[1], class: "t t-sm t-muted " + L.sramTitle[2], text: "on-chip SRAM · ~20 MB · ~19 TB/s" }, svg);
      S("rect", { x: L.sram[0], y: L.sram[1], width: L.sram[2], height: L.sram[3], rx: 10, class: "f-surface", stroke: "var(--a-blue)", "stroke-width": 1.5 }, svg);
      var sramCX = L.sram[0] + L.sram[2] / 2, sramCY = L.sram[1] + L.sram[3] / 2;

      // traffic meter
      S("text", { x: L.meterTitle[0], y: L.meterTitle[1], class: "t t-sm t-muted", text: "HBM reads + writes" }, svg);
      S("text", { x: L.rowLblX, y: L.row1, class: "t t-sm", text: "standard" }, svg);
      S("text", { x: L.rowLblX, y: L.row2, class: "t t-sm", text: "flash" }, svg);
      S("rect", { x: L.barX, y: L.row1 - 11, width: L.barW, height: 13, rx: 3, class: "f-surface2" }, svg);
      S("rect", { x: L.barX, y: L.row2 - 11, width: L.barW, height: 13, rx: 3, class: "f-surface2" }, svg);
      var stdBar = S("rect", { x: L.barX, y: L.row1 - 11, width: 0, height: 13, rx: 3, class: "f-blue" }, svg);
      var flBar = S("rect", { x: L.barX, y: L.row2 - 11, width: 0, height: 13, rx: 3, class: "f-orange" }, svg);
      var stdVal = S("text", { x: L.barX + L.barW + 6, y: L.row1, class: "t t-sm t-mono", text: STD_GB + " GB" }, svg);
      var flVal = S("text", { x: L.barX + L.barW + 6, y: L.row2, class: "t t-sm t-mono", text: FLASH_GB + " GB" }, svg);
      stdVal.style.opacity = 0; flVal.style.opacity = 0;
      tl.addLabel("s0", 0);

      // helpers
      function flyer(x, y, w, h, c, tx, ty) {
        var r = S("rect", { x: x, y: y, width: w, height: h, rx: 3, class: c, "fill-opacity": 0.7 }, svg);
        r.style.opacity = 0;
        return { el: r, dx: tx - (x + w / 2), dy: ty - (y + h / 2) };
      }
      function fly(f, dur, pos) {
        tl.set(f.el, { opacity: 1, x: 0, y: 0 }, pos);
        tl.to(f.el, { x: f.dx, y: f.dy, duration: dur, ease: "power1.inOut" }, "<");
        tl.to(f.el, { opacity: 0, duration: 0.15 });
      }
      function sramText(txt) {
        var t = S("text", { x: L.sramTxt[0], y: L.sramTxt[1], class: "t t-mid", text: txt, "font-weight": 600 }, svg);
        t.style.opacity = 0;
        return t;
      }

      // ---- s1: S = QKᵀ written to HBM ----
      var sLbl = S("text", { x: L.sX + L.sq / 2, y: L.labY, class: "t t-sm t-mid", text: "S = QKᵀ (n×n)" }, svg);
      var sFill = S("rect", { x: L.sX, y: L.mY, width: L.sq, height: L.sq, rx: 4, class: "f-blue", "fill-opacity": 0.35 }, svg);
      var sFrame = S("rect", { x: L.sX, y: L.mY, width: L.sq, height: L.sq, rx: 4, class: "f-none", stroke: "var(--a-faint)", "stroke-width": 1.5, "stroke-dasharray": "5 4" }, svg);
      var pLbl = S("text", { x: L.pX + L.sq / 2, y: L.labY, class: "t t-sm t-mid", text: compact ? "P = softmax" : "P = softmax(S)" }, svg);
      var pFill = S("rect", { x: L.pX, y: L.mY, width: L.sq, height: L.sq, rx: 4, class: "f-blue", "fill-opacity": 0.55 }, svg);
      var pFrame = S("rect", { x: L.pX, y: L.mY, width: L.sq, height: L.sq, rx: 4, class: "f-none", stroke: "var(--a-faint)", "stroke-width": 1.5, "stroke-dasharray": "5 4" }, svg);
      [sLbl, sFill, sFrame, pLbl, pFill, pFrame].forEach(function (e) { e.style.opacity = 0; });
      var tQK = sramText("QKᵀ"), tSm = sramText("softmax"), tPV = sramText("P · V");
      var fQ = flyer(L.mX[0], L.mY, L.mW, L.mH, "f-orange", sramCX - 20, sramCY);
      var fK = flyer(L.mX[1], L.mY, L.mW, L.mH, "f-blue", sramCX + 20, sramCY);
      var fS = flyer(sramCX - 20, sramCY - 20, 40, 40, "f-blue", L.sX + L.sq / 2, L.mY + L.sq / 2);
      fly(fQ, 0.7, "+=0.02"); fly(fK, 0.7, "<-0.1");
      LC.popIn(tl, tQK, { duration: 0.3 });
      fly(fS, 0.7);
      LC.popIn(tl, [sLbl, sFill, sFrame], { duration: 0.4 }, "-=0.1");
      tl.to(stdBar, { attr: { width: L.barW * 0.4 }, duration: 0.6 }, "<");
      tl.addLabel("s1");

      // ---- s2: read S, softmax, write P ----
      tl.to(tQK, { opacity: 0, duration: 0.2 });
      var fS2 = flyer(L.sX, L.mY, L.sq, L.sq, "f-blue", sramCX, sramCY);
      var fP = flyer(sramCX - 20, sramCY - 20, 40, 40, "f-blue", L.pX + L.sq / 2, L.mY + L.sq / 2);
      fly(fS2, 0.7);
      LC.popIn(tl, tSm, { duration: 0.3 });
      fly(fP, 0.7);
      LC.popIn(tl, [pLbl, pFill, pFrame], { duration: 0.4 }, "-=0.1");
      tl.to(stdBar, { attr: { width: L.barW * 0.8 }, duration: 0.6 }, "<");
      tl.addLabel("s2");

      // ---- s3: read P and V, write O ----
      tl.to(tSm, { opacity: 0, duration: 0.2 });
      var fP2 = flyer(L.pX, L.mY, L.sq, L.sq, "f-blue", sramCX - 20, sramCY);
      var fV = flyer(L.mX[2], L.mY, L.mW, L.mH, "f-ink", sramCX + 20, sramCY);
      var fO = flyer(sramCX - 12, sramCY - 20, 24, 40, "f-orange", L.mX[3] + L.mW / 2, L.mY + L.mH / 2);
      fly(fP2, 0.7); fly(fV, 0.7, "<-0.1");
      LC.popIn(tl, tPV, { duration: 0.3 });
      fly(fO, 0.7);
      tl.to(mats[3].fill, { opacity: 1, duration: 0.4 }, "-=0.1");
      tl.to(stdBar, { attr: { width: L.barW }, duration: 0.5 }, "<");
      LC.popIn(tl, stdVal, { duration: 0.3 });
      tl.addLabel("s3");

      // ---- s4: FlashAttention: tiles ----
      var never = [L.sX, L.pX].map(function (x) {
        var t = S("text", { x: x + L.sq / 2, y: L.mY + L.sq / 2 + 4, class: "t t-sm t-mid t-muted", text: "not stored" }, svg);
        t.style.opacity = 0; return t;
      });
      tl.to([tPV, sFill, pFill, mats[3].fill], { opacity: 0, duration: 0.4 });
      tl.to([sLbl, pLbl], { opacity: 0.45, duration: 0.4 }, "<");
      LC.popIn(tl, never, { duration: 0.3 });
      var bh = L.mH / NB, dividers = [];
      for (var mi = 0; mi < 4; mi++) for (var b = 1; b < NB; b++) {
        dividers.push(S("line", { x1: L.mX[mi], x2: L.mX[mi] + L.mW, y1: L.mY + b * bh, y2: L.mY + b * bh, stroke: "var(--a-paper)", "stroke-width": 2 }, svg));
      }
      LC.popIn(tl, dividers, { duration: 0.3 }, "<");
      function hl(i) { var r = S("rect", { x: L.mX[i] - 3, y: L.mY - 2, width: L.mW + 6, height: bh + 4, rx: 4, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 2.5 }, svg); r.style.opacity = 0; return r; }
      var hQ = hl(0), hK = hl(1), hV = hl(2);
      LC.popIn(tl, [hQ, hK, hV], { duration: 0.3 });
      // SRAM tiles
      var tileNames = ["Qᵢ", "Kⱼ", "Vⱼ", "Sᵢⱼ"], tileCls = ["f-orange", "f-blue", "f-ink", "f-blue"];
      var tiles = tileNames.map(function (nm, i) {
        var g = S("g", {}, svg);
        S("text", { x: L.tileX[i] + L.tileW / 2, y: L.tileLabY, class: "t t-sm t-mid", text: nm }, g);
        S("rect", { x: L.tileX[i], y: L.tileY, width: L.tileW, height: L.tileH, rx: 3, class: tileCls[i], "fill-opacity": i === 3 ? 0.35 : 0.6 }, g);
        g.style.opacity = 0;
        return g;
      });
      var tileFly = [0, 1, 2].map(function (i) { return flyer(L.mX[i], L.mY, L.mW, bh, tileCls[i], L.tileX[i] + L.tileW / 2, L.tileY + L.tileH / 2); });
      fly(tileFly[0], 0.6); fly(tileFly[1], 0.6, "<-0.1"); fly(tileFly[2], 0.6, "<-0.1");
      LC.popIn(tl, tiles.slice(0, 3), { duration: 0.3 });
      tl.to(flBar, { attr: { width: L.barW * FLASH_GB / STD_GB * 0.25 }, duration: 0.4 }, "<");
      tl.addLabel("s4");

      // ---- s5: score the tile, running stats, stream the other K/V tiles ----
      var stats = S("text", { x: sramCX, y: L.statY, class: "t t-sm t-mid t-mono", text: compact ? "running m, ℓ, acc" : "running max m · sum ℓ · acc" }, svg);
      LC.popIn(tl, [tiles[3], stats], { duration: 0.4 });
      for (var j = 1; j < NB; j++) {
        tl.to([hK, hV], { attr: { y: L.mY - 2 + j * bh }, duration: 0.35, ease: "power1.inOut" }, "+=0.15");
        var fk = flyer(L.mX[1], L.mY + j * bh, L.mW, bh, "f-blue", L.tileX[1] + L.tileW / 2, L.tileY + L.tileH / 2);
        var fv = flyer(L.mX[2], L.mY + j * bh, L.mW, bh, "f-ink", L.tileX[2] + L.tileW / 2, L.tileY + L.tileH / 2);
        fly(fk, 0.45); fly(fv, 0.45, "<-0.05");
        tl.fromTo(tiles[3], { opacity: 0.3 }, { opacity: 1, duration: 0.2, immediateRender: false });
        tl.to(flBar, { attr: { width: L.barW * FLASH_GB / STD_GB * (0.25 + 0.15 * j) }, duration: 0.25 }, "<");
      }
      tl.addLabel("s5");

      // ---- s6: write O block, next Q tiles ----
      var oBlocks = [];
      for (var k = 0; k < NB; k++) {
        var ob = S("rect", { x: L.mX[3], y: L.mY + k * bh + 1, width: L.mW, height: bh - 2, rx: 2, class: "f-orange", "fill-opacity": 0.75 }, svg);
        ob.style.opacity = 0; oBlocks.push(ob);
      }
      var fO1 = flyer(L.tileX[0], L.tileY, L.tileW, L.tileH, "f-orange", L.mX[3] + L.mW / 2, L.mY + bh / 2);
      fly(fO1, 0.6, "+=0.05");
      tl.to(oBlocks[0], { opacity: 1, duration: 0.3 }, "-=0.1");
      for (var q = 1; q < NB; q++) {
        tl.to(hQ, { attr: { y: L.mY - 2 + q * bh }, duration: 0.3 }, "+=0.1");
        tl.to([hK, hV], { attr: { y: L.mY - 2 }, duration: 0.01 }, "<");
        tl.to([hK, hV], { attr: { y: L.mY - 2 + (NB - 1) * bh }, duration: 0.45, ease: "none" });
        tl.to(oBlocks[q], { opacity: 1, duration: 0.25 });
      }
      tl.to(flBar, { attr: { width: L.barW * FLASH_GB / STD_GB }, duration: 0.4 }, "<");
      tl.addLabel("s6");

      // ---- s7: the punchline ----
      var note = S("text", { x: sramCX, y: L.noteY, class: "t t-sm t-mid t-orange", text: "same O, exactly ✓", "font-weight": 600 }, svg);
      tl.to([hQ, hK, hV].concat(dividers), { opacity: 0, duration: 0.3 });
      LC.popIn(tl, [note, flVal], { duration: 0.4 });
      tl.addLabel("s7");
      return tl;
    }
  };
})();
