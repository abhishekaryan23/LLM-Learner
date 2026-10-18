/* Capstone 2: the tiny-diffusion pipeline. Every picture is real output of the capstone notebook
   (cap-2-tiny-diffusion.ipynb, default CPU run): 16x16 images, brightness quantized to 9 levels (0-8).
   Numbers from that run: val loss 1.33 (step 0), 0.128 (500), 0.101 (1,000), 0.086 (1,500), 0.075 (2,000),
   0.066 (2,500), 0.064 (3,000); judge accuracy on-label: w = 0 30%, w = 3 92% (DDPM, 1,000 steps), DDIM 20 steps 88%.
   Samples in the w = 3 and DDIM rows: one judge-approved sample per class (indices 0,1,6,23 and 4,5,6,27 of the 128), not the first four.
   alpha_bar (linear schedule): t=250 0.524, t=500 0.079, t=1000 0.00004. */
(function () {
  var LC = window.LC;
  var IMG = {"data":["0000000000000000000000000000000000008888800000000008888888000000008888888880000008888888888000000888888888800000088888888880000008888888888000000088888888800000000888888800000000008888000000000000000000000000000000000000000000000000000000000000000000000000","0000000000000000000000000000000000000000000000000000000000000000000888888000000000088888800000000008888880000000000888888000000000088888800000000008888880000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000","0000000000000000000000000000000000000000800000000000000888000000000000088800000000000088888000000000008888880000000008888888000000008888888880000000888888888800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000","0000000000000000000000000000000000000000000000000000000000000000000000000000000000000888000000000000088800000000000008880000000000888888888000000088888888800000008888888880000000000888000000000000088800000000000008880000000000000888000000000000000000000000"],"noise":["0000000000000000000000000000000000008888800000000008888888000000008888888880000008888888888000000888888888800000088888888880000008888888888000000088888888800000000888888800000000008888000000000000000000000000000000000000000000000000000000000000000000000000","0240120040003424006023401100030011278555356000221016046887004003125832554881000308887488668402250884776888463120068756885843032437856515836310052184858775613001301786755502014200328588235000010204500001333311300000200004005123501020011002050300073130013010","0460240061016747028246702202050033488323088022542234014885107126343800332872010507765188448704581881654778085250048533872805154756724202804530084281838553436013503684623204027310648268468000032406800203656533500000400017208355823141023014280611086352136032","1680351082027858038357813303070044588112088033653342003884208237552700220863120606654088237815682780542668086360037422761806265865613101803640085380827442247025704582511115138521757158578100043508810304777644600110600028318467834262034125381722187463247143"],"w0":["0000000000000000000000000000000000000001000000000000000000000000000001333531000000001247743200010001057876430000001046878866010000123788887600000013578778861000002378888887200000000000000000000000000000000000000000010000000000000000100000000000000000000000","0000000000000000000000000100000000000012001000000000157753200000000027865441100000026778876410000004788888761100001478888888100000136888788600000001278775530000000002343000000000000111110010001000000010000010000001000000100000010000000000000000001000000000","0010100000000000000000000000000000001000000000000000113210000000010058776653000000008887866410000000887887751000000088888885200001008888888510000000887788730000000065566542110000001345431010000000002210001000000110000000000000000000000000000000000000000000","0000000000000000000000010000000000000000000000000000000000000000000002244761000000000125565220000000134788742100000014588866520000001678878744001000278888775500000027887887531000000123332000000000000222110000000000012220000000000000000000000000100001000000"],"w3":["0000000001001001000011000100000010000012101000001000003321100000000008865870011000027688885300110013888878870010002488878778110001266878878802000035688768861000001268888880000010013068880000001000131010000011000000010110000010000110100000000000100000010100","0000000000000000000000000000000000000001000000000006888888830000000688888872100000058888887310000005888888731000000678888873100000067888888300000006788788730000000455666652000000000000000000000000000000000000000000000000000000000000000000000000000000000000","0110010000000000001000000000000100000100000010000000002001000011100010002200000000000000181001000010000076700000100000006881000001000027887801011000017887888101010035888888862010007887888888300001234242421420000010101001011000000100000001000210001000000101","0000000000000000100001223110000000012046850000000000106885000000000000788300001010042188830230000016438874248010004888888888801000188888888881000006426886432000000000588100000000000078810000100110008882000000000000243000000000001000000010000000000000000000"],"ddim":["0000000000000000000000100010000000000100100000000000210000000000000000443100000000001888854000000002888888710000001888788877010000187887888822000018888888783100001888888888000101078888888800000004888888800100000028888500111000001123010000000000110100010000","0100000000001000000010100010000100001000000100000000001101012100010000212112320001011113333231000100156888776100010005887885510000000678888651100000068887854100001015787764320000100334443210001000110110000000001000000100000000010000000000000000000000000001","0000000000000000000000000000000000000000000000000000000010000000000000000000000000000000010000000000100016100000000011258751000000000047875310000000016888750000000002888875200000000488887661000000011211000000000000000000000000000000000000000000000000000000","0000000000000001000000001000000000000001100000000000000010000000000100012000000000000138821101000000213872110000010000287000000001148878888851000013877878886000001033377643200000000038811010000000012870110000000000378320000000000042200000000000000000000000"],"traj":["2834305232828504580030872676800836056215715583184160688384040568062611850038680473313058447487046218008086080876715000456017570800883781788840435262830067882155853040438082837104210068874837680061252266008175740538864020507402481050046384880060278886521235","3344513021853865021503488885806804103868484242043442000161880488058882376858564388021083057001108125042065040744700052468850732081274566880106006052837416380702888706836384106653340064555214808252014212684662832548486253183834052188080003208283722424353108","8001470080345383075822150680032476002143064562876000043001100208588001000610604300500100244480318250000008204760524000052080453073520031887400075000408505284636168504053846402006000137364874803442488151444831450207354270406600024002350020653082720350166065","3000340300502135520220000570041030001240301130423103020060003246057211007500310230052000288020114030000078200040060000004481011020200005388800035000005423882005051000586848870010003868837888200020488885888820010066002550810030344004000005100000010420053010","0100001100000011110000100000000010000000000000002000000010000100000000000600001010000000082000000020000048600000010000005881000001000004688810100000000887888000000000888878880000000888888888301000588888888870000032212124653000020100000000100100000000001000"],"xt500":"0460240061016747028246702202050033488323088022542234014885107126343800332872010507765188448704581881654778085250048533872805154756724202804530084281838553436013503684623204027310648268468000032406800203656533500000400017208355823141023014280611086352136032","eps":"1680351082027858038357813303070044588112088033653342003884208237552700220863120606653088237815682780542668086360037422761806265865613101803650085380827442247025704582511115148521757158578100043508810304777644600110600028318467834262034125381722187473247143"};
  var NODES = ["Data", "Noise", "Denoiser", "Train", "Sample", "Guide", "DDIM"];
  var LOSS = [[0, 1.332], [500, 0.128], [1000, 0.101], [1500, 0.086], [2000, 0.075], [2500, 0.066], [3000, 0.064]];

  LC.anims["cap-2-pipeline"] = {
    title: "The tiny diffusion model, milestone by milestone",
    steps: [
      "<strong>Data</strong>: the notebook draws 5,000 white-on-black shapes, 16×16 pixels, in four classes. No downloads, and pixel values are exactly −1 or +1, which makes samples easy to judge.",
      "<strong>Noise</strong>: one formula jumps a clean image to any step $t$. With the linear schedule only 52% of the signal's variance is left at $t = 250$, 8% at $t = 500$, and essentially none at $t = 1000$.",
      "<strong>Denoiser</strong>: a residual MLP (1.6M parameters) takes the noisy image, a <strong>time embedding</strong> of $t$ and a class embedding (or NULL), and predicts the noise that was added.",
      "<strong>Train</strong>: squared error between true and predicted noise, labels dropped 15% of the time. Validation loss falls from 1.33 to 0.064 in 3,000 steps, a minute or two on a laptop CPU.",
      "<strong>Sample</strong> with DDPM: start from pure noise and remove a slice of predicted noise 1,000 times. Here a triangle condenses out of static.",
      "<strong>Guide</strong>: classifier-free guidance, $\\varepsilon_u + w(\\varepsilon_c - \\varepsilon_u)$. A small judge network checks each sample: 30% match their label at $w = 0$ (unconditional), 92% at $w = 3$ (the four samples shown are ones the judge got right).",
      "<strong>DDIM</strong>: same network, deterministic jumps. 20 steps reach 88% on-label: 40 forward passes per image instead of 2,000. The four samples shown (one per class) are ones the judge got right; the plus is the hardest class, about 6 in 10 on-label."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 334 } : { w: 640, h: 314 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      var fs = compact ? " t-sm" : "";
      var nh = 30, pos = [];
      if (compact) {
        var nw = 76, gap = 12, x0 = (W - (4 * nw + 3 * gap)) / 2;
        for (var i = 0; i < 7; i++) {
          var rr = i < 4 ? 0 : 1, col = rr ? 7 - i : i;   // second row runs right to left: cols 3, 2, 1
          pos.push({ x: x0 + col * (nw + gap), y: 24 + rr * 50, w: nw });
        }
      } else {
        var nw2 = 78, gap2 = 8, x02 = (W - (7 * nw2 + 6 * gap2)) / 2;
        for (var j = 0; j < 7; j++) pos.push({ x: x02 + j * (nw2 + gap2), y: 24, w: nw2 });
      }
      var PT = compact ? 138 : 90;              // panel top (baseline of the first text row)
      var cell = compact ? 3.5 : 4.5, G = 16 * cell;

      function arrow(x0, y0, x1, y1, cls, parent) {
        var a = Math.atan2(y1 - y0, x1 - x0), h = 6;
        var d = "M" + x0 + " " + y0 + "L" + x1 + " " + y1 +
          "M" + (x1 - h * Math.cos(a - 0.5)) + " " + (y1 - h * Math.sin(a - 0.5)) + "L" + x1 + " " + y1 +
          "L" + (x1 - h * Math.cos(a + 0.5)) + " " + (y1 - h * Math.sin(a + 0.5));
        return S("path", { d: d, class: cls || "s-faint", "stroke-width": 1.5 }, parent || svg);
      }
      // ---- pipeline nodes
      for (var k = 0; k < 6; k++) {
        var p = pos[k], q = pos[k + 1];
        if (q.y > p.y) arrow(p.x + p.w / 2, p.y + nh + 2, q.x + q.w / 2, q.y - 2);
        else if (q.x > p.x) arrow(p.x + p.w + 1, p.y + nh / 2, q.x - 1, q.y + nh / 2);
        else arrow(p.x - 1, p.y + nh / 2, q.x + q.w + 1, q.y + nh / 2);
      }
      var act = [], done = [];
      NODES.forEach(function (n, i) {
        var p = pos[i];
        S("rect", { x: p.x, y: p.y, width: p.w, height: nh, rx: 9, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, svg);
        var dn = S("rect", { x: p.x, y: p.y, width: p.w, height: nh, rx: 9, class: "f-none", stroke: "var(--a-blue)", "stroke-width": 2 }, svg);
        var ac = S("rect", { x: p.x - 2, y: p.y - 2, width: p.w + 4, height: nh + 4, rx: 10, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 3 }, svg);
        dn.style.opacity = 0; ac.style.opacity = 0;
        S("text", { x: p.x + p.w / 2, y: p.y + 20, class: "t t-sm t-mid", text: n, "font-weight": 600 }, svg);
        act.push(ac); done.push(dn);
      });
      act[0].style.opacity = 1;

      // ---- helpers for the panel
      function grid(str, x, y, c, parent) {
        var g = S("g", {}, parent);
        S("rect", { x: x, y: y, width: 16 * c, height: 16 * c, class: "f-paper", stroke: "var(--line)", "stroke-width": 1 }, g);
        var ds = ["", "", "", "", "", "", "", "", ""];
        for (var i = 0; i < 256; i++) {
          var v = +str.charAt(i); if (!v) continue;
          var px = x + (i % 16) * c, py = y + Math.floor(i / 16) * c;
          ds[v] += "M" + px.toFixed(2) + " " + py.toFixed(2) + "h" + c + "v" + c + "h" + (-c) + "z";
        }
        for (var l = 1; l <= 8; l++) if (ds[l]) S("path", { d: ds[l], class: "f-ink", "fill-opacity": (l / 8).toFixed(3) }, g);
        return g;
      }
      function row(strs, y, c, gapX, labels, parent, labelCls) {
        var n = strs.length, gw = 16 * c, total = n * gw + (n - 1) * gapX, x0 = (W - total) / 2, xs = [];
        strs.forEach(function (s, i) {
          var x = x0 + i * (gw + gapX); xs.push(x + gw / 2);
          grid(s, x, y, c, parent);
          if (labels && labels[i]) S("text", { x: x + gw / 2, y: y + gw + 17, class: "t t-sm t-mid" + (labelCls ? " " + labelCls : ""), text: labels[i] }, parent);
        });
        return xs;
      }
      function text(x, y, s, cls, parent, extra) {
        var a = { x: x, y: y, class: cls, text: s }; if (extra) for (var e in extra) a[e] = extra[e];
        return S("text", a, parent);
      }
      var groups = [];
      function panel() { var g = S("g", {}, svg); groups.push(g); return g; }

      // s0: data
      var g0 = panel();
      text(W / 2, PT, "5,000 images · 16×16 pixels · 4 classes", "t t-mid" + fs, g0, { "font-weight": 600 });
      row(IMG.data, PT + 18, compact ? 3.5 : 5, compact ? 22 : 40, ["disk", "square", "triangle", "plus"], g0);
      text(W / 2, PT + 18 + 16 * (compact ? 3.5 : 5) + 46, "pixel values: exactly −1 (background) or +1 (shape)", "t t-sm t-mid t-muted", g0);

      // s1: noise
      var g1 = panel();
      text(W / 2, PT, compact ? "one jump from x₀ to any step t" : "one jump from the clean image x₀ to any step t", "t t-mid" + fs, g1, { "font-weight": 600 });
      var c1 = compact ? 3.5 : 5;
      row(IMG.noise, PT + 18, c1, compact ? 22 : 40, ["t = 1", "t = 250", "t = 500", "t = 1000"], g1);
      (function () {
        var n = 4, gw = 16 * c1, gx = compact ? 22 : 40, x0 = (W - (n * gw + (n - 1) * gx)) / 2;
        ["signal 100%", "52%", "8%", "0%"].forEach(function (s, i) {
          text(x0 + i * (gw + gx) + gw / 2, PT + 18 + gw + 36, s, "t t-sm t-mid t-muted", g1);
        });
      })();
      text(W / 2, PT + 18 + 16 * c1 + 66, "the share of signal left is ᾱₜ", "t t-sm t-mid t-muted", g1);

      // s2: the denoiser
      var g2 = panel();
      text(W / 2, PT, "predict the noise that was added", "t t-mid" + fs, g2, { "font-weight": 600 });
      var c2 = compact ? 3.5 : 5, gw2 = 16 * c2, gy = PT + 22;
      var lx = compact ? 12 : 60, rx = W - (compact ? 12 : 60) - gw2;
      grid(IMG.xt500, lx, gy, c2, g2); grid(IMG.eps, rx, gy, c2, g2);
      text(lx + gw2 / 2, gy + gw2 + 17, "xₜ (noisy)", "t t-sm t-mid", g2);
      text(rx + gw2 / 2, gy + gw2 + 17, "ε (target)", "t t-sm t-mid", g2);
      var bx = lx + gw2 + (compact ? 22 : 40), bw = rx - (compact ? 22 : 40) - bx, bh = compact ? 46 : 54, by = gy + gw2 / 2 - bh / 2;
      S("rect", { x: bx, y: by, width: bw, height: bh, rx: 10, class: "f-surface", stroke: "var(--a-blue)", "stroke-width": 2 }, g2);
      text(bx + bw / 2, by + bh / 2 - (compact ? 3 : 4), "MLP denoiser", "t t-mid" + fs, g2, { "font-weight": 650 });
      text(bx + bw / 2, by + bh / 2 + (compact ? 13 : 15), "1.6M parameters", "t t-sm t-mid t-muted", g2);
      arrow(lx + gw2 + 3, gy + gw2 / 2, bx - 3, gy + gw2 / 2, "s-ink", g2);
      arrow(bx + bw + 3, gy + gw2 / 2, rx - 3, gy + gw2 / 2, "s-ink", g2);
      var iy = gy + gw2 + (compact ? 44 : 46);
      var ins = compact ? ["+ time t as a sin/cos embedding", "+ class label, or NULL (dropped 15%)"]
                        : ["+ time t as a sin/cos embedding (like token positions)", "+ class label, or NULL 15% of the time (for guidance)"];
      text(W / 2, iy, ins[0], "t t-sm t-mid", g2); text(W / 2, iy + 20, ins[1], "t t-sm t-mid", g2);
      arrow(W / 2, iy - 15, W / 2, by + bh + 3, "s-faint", g2);

      // s3: training curve
      var g3 = panel();
      text(compact ? 16 : 60, PT, "validation loss (log scale)", "t t-sm t-muted", g3);
      var pl = compact ? 52 : 110, pr = W - (compact ? 22 : 110), ptop = PT + 16, pbot = PT + (compact ? 150 : 162);
      var ly0 = Math.log10(0.05), ly1 = Math.log10(2);
      function sx(v) { return pl + v / 3000 * (pr - pl); }
      function sy(v) { return pbot - (Math.log10(v) - ly0) / (ly1 - ly0) * (pbot - ptop); }
      S("path", { d: "M" + pl + " " + ptop + "V" + pbot + "H" + pr, class: "s-axis" }, g3);
      [[0.05, "0.05"], [0.1, "0.1"], [0.5, "0.5"], [1, "1"]].forEach(function (t) {
        S("path", { d: "M" + (pl - 5) + " " + sy(t[0]) + "h5", class: "s-axis" }, g3);
        text(pl - 8, sy(t[0]) + 4, t[1], "t t-sm t-end t-muted", g3);
      });
      [[0, "0"], [1000, "1k"], [2000, "2k"], [3000, "3k"]].forEach(function (t) {
        S("path", { d: "M" + sx(t[0]) + " " + pbot + "v5", class: "s-axis" }, g3);
        text(sx(t[0]), pbot + 19, t[1], "t t-sm t-mid t-muted", g3);
      });
      text((pl + pr) / 2, pbot + 38, "training steps (batch 128)", "t t-sm t-mid t-muted", g3);
      var tgt = S("path", { d: "M" + pl + " " + sy(0.09) + "H" + pr, class: "s-faint", "stroke-dasharray": "5 4" }, g3);
      text(pl + 8, sy(0.09) + 16, "target 0.09", "t t-sm t-muted", g3);
      var dpath = LOSS.map(function (p, i) { return (i ? "L" : "M") + sx(p[0]).toFixed(1) + " " + sy(p[1]).toFixed(1); }).join("");
      var curve = S("path", { d: dpath, class: "s-orange" }, g3);
      var dots = LOSS.map(function (p) { return S("circle", { cx: sx(p[0]), cy: sy(p[1]), r: 3.5, class: "f-orange" }, g3); });
      var lStart = text(sx(0) + 10, sy(1.332) + 4, "1.33 at the start", "t t-sm", g3);
      var lEnd = text(pr, sy(0.064) - 12, "0.064", "t t-sm t-end", g3, { "font-weight": 650 });

      // s4: DDPM trajectory
      var g4 = panel();
      text(W / 2, PT, compact ? "DDPM: 1,000 steps from static" : "DDPM: 1,000 small steps from static to a triangle", "t t-mid" + fs, g4, { "font-weight": 600 });
      var c4 = compact ? 3 : 4.5, gx4 = compact ? 12 : 24;
      var xs4 = row(IMG.traj, PT + 18, c4, gx4, ["t = 1000", "750", "500", "250", "0"], g4);
      var arrows4 = [];
      for (var a4 = 0; a4 < 4; a4++) arrows4.push(arrow(xs4[a4] + 8 * c4 + 2, PT + 18 + 8 * c4, xs4[a4 + 1] - 8 * c4 - 2, PT + 18 + 8 * c4, "s-faint", g4));
      text(W / 2, PT + 18 + 16 * c4 + 46, compact ? "each step: remove a slice of predicted" : "each step removes a slice of predicted noise and adds a little fresh noise", "t t-sm t-mid t-muted", g4);
      if (compact) text(W / 2, PT + 18 + 16 * c4 + 64, "noise, add a little fresh noise", "t t-sm t-mid t-muted", g4);

      // s5: guidance
      var g5 = panel();
      var c5 = compact ? 3.5 : 4.5, gx5 = compact ? 22 : 30, rh = 16 * c5;
      text(W / 2, PT, "w = 0 (label ignored): 30% on-label", "t t-mid" + fs, g5, { "font-weight": 600 });
      row(IMG.w0, PT + 10, c5, gx5, null, g5);
      var y5 = PT + 10 + rh + 30;
      text(W / 2, y5, "w = 3: 92% on-label", "t t-mid t-orange" + fs, g5, { "font-weight": 650 });
      row(IMG.w3, y5 + 10, c5, gx5, ["disk", "square", "triangle", "plus"], g5);

      // s6: DDIM
      var g6 = panel();
      text(W / 2, PT, "DDIM, 20 steps, w = 3: 88% on-label", "t t-mid" + fs, g6, { "font-weight": 600 });
      var c6 = compact ? 3.5 : 5;
      row(IMG.ddim, PT + 18, c6, compact ? 22 : 40, ["disk", "square", "triangle", "plus"], g6);
      var y6 = PT + 18 + 16 * c6 + 50;
      text(W / 2, y6, "same trained network, no fresh noise", "t t-sm t-mid", g6);
      text(W / 2, y6 + 20, "20 × 2 = 40 passes instead of 1,000 × 2 = 2,000", "t t-sm t-mid t-orange", g6, { "font-weight": 650 });

      groups.forEach(function (g, i) { if (i) g.style.opacity = 0; });
      tl.addLabel("s0", 0);
      function advance(i) {
        tl.to(act[i - 1], { opacity: 0, duration: 0.2 }, "+=0.02");
        tl.to(done[i - 1], { opacity: 1, duration: 0.2 }, "<");
        tl.to(act[i], { opacity: 1, duration: 0.3 }, "<");
        tl.to(groups[i - 1], { opacity: 0, duration: 0.25 }, "<");
        tl.to(groups[i], { opacity: 1, duration: 0.4 }, ">-0.05");
      }
      for (var s = 1; s < 7; s++) {
        advance(s);
        if (s === 3) {
          LC.drawIn(tl, curve, { duration: 1.2 });
          LC.popIn(tl, dots, { duration: 0.3, stagger: 0.08 }, "<0.1");
          LC.popIn(tl, [lStart, lEnd], { duration: 0.3 }, ">-0.2");
        }
        if (s === 4) LC.popIn(tl, arrows4, { duration: 0.3, stagger: 0.1 });
        tl.addLabel("s" + s);
      }
      return tl;
    }
  };
})();
