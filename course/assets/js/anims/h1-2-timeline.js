/* H1.2: 1989–2015, from LeNet to ResNet. ImageNet numbers are the published
   ILSVRC classification winners' top-5 error rates (2010 NEC-UIUC 28.2, 2011 XRCE 25.8,
   2012 AlexNet 15.3, 2013 Clarifai 11.7, 2014 GoogLeNet 6.7, 2015 ResNet 3.6). */
(function () {
  var LC = window.LC;
  var WIN = [[2010, 28.2, ""], [2011, 25.8, ""], [2012, 15.3, "AlexNet"], [2013, 11.7, ""], [2014, 6.7, "GoogLeNet"], [2015, 3.6, "ResNet"]];
  LC.anims["h1-2-timeline"] = {
    title: "Deep learning arrives, 1989–2015",
    steps: [
      "<strong>1989.</strong> Yann LeCun's team trains a <strong>convolutional network</strong> with backprop to read handwritten digits. A small filter slides over the image, reusing the same weights everywhere. LeNet-5 (1998) went on to read bank cheques.",
      "<strong>1995.</strong> <strong>Support vector machines</strong> find the line with the widest margin between classes. They are reliable, mathematically neat and need little tuning, and they beat neural nets on most tasks for a decade.",
      "<strong>1997.</strong> Hochreiter and Schmidhuber's <strong>LSTM</strong> gives recurrent networks a protected memory line, so a learning signal can travel back over many time steps. It later powers speech recognition and translation.",
      "<strong>2006.</strong> Hinton's group shows <strong>deep</strong> networks can be trained by <strong>pretraining one layer at a time</strong>, then fine-tuning. The term “deep learning” takes off.",
      "<strong>2009.</strong> Two missing ingredients arrive: <strong>GPUs</strong>, graphics chips with thousands of simple cores, make training many times faster, and <strong>ImageNet</strong> provides millions of labelled photos.",
      "<strong>2012.</strong> <strong>AlexNet</strong> wins the ImageNet challenge with 15.3% top-5 error; the runner-up had 26.2%. It used two GPUs, ReLU activations and dropout. Almost overnight, computer vision switches to deep learning.",
      "<strong>2013–2014.</strong> The ideas spread. <strong>word2vec</strong> learns word vectors where directions carry meaning (king − man + woman ≈ queen). <strong>GANs</strong> pit a generator against a discriminator to create new images.",
      "<strong>2014–2015.</strong> Deeper and deeper: VGG and <strong>GoogLeNet</strong> (2014), then <strong>ResNet</strong> (2015, 152 layers, with skip connections) at 3.6% top-5 error, below the roughly 5% measured for one trained human."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 322 } : { w: 640, h: 310 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact", cx = W / 2;
      var T = LC.h1.timeline(svg, ctx, {
        from: 1986, to: 2016, ticks: [1990, 1995, 2000, 2005, 2010, 2015], ticksCompact: [1990, 2000, 2010],
        bands: [{ from: 1987, to: 1993 }],
        steps: [
          { year: "1989", text: "LeCun: convolutional nets read digits", short: "Convolutional nets", dots: [1989, 1998] },
          { year: "1995", text: "Support vector machines take over", short: "Support vector machines", dots: [1995] },
          { year: "1997", text: "LSTM: a memory for sequences", short: "LSTM", dots: [1997] },
          { year: "2006", text: "Deep belief nets: layer-by-layer", short: "Deep belief nets", dots: [2006] },
          { year: "2009", text: "GPUs + ImageNet", dots: [2009] },
          { year: "2012", text: "AlexNet wins ImageNet", short: "AlexNet", dots: [2012] },
          { year: "2013", text: "word2vec (2013) and GANs (2014)", short: "word2vec and GANs", dots: [2013, 2014] },
          { year: "2015", text: "ResNet: 152 layers deep", short: "ResNet", dots: [2015] }
        ]
      });
      var top = T.top, A = LC.h1.arrow, tl = gsap.timeline();
      var sc = [0, 1, 2, 3, 4, 5, 6, 7].map(function (k) { return LC.h1.scene(svg, k === 0); });
      function note(g, y, txt, cls, x) { return S("text", { x: x == null ? cx : x, y: y, class: "t t-sm t-mid" + (cls ? " " + cls : ""), text: txt }, g); }

      // ---- scene 0: convolution over a digit
      var filt;
      (function (g) {
        var c = compact ? 16 : 18, gx = compact ? 24 : 110, gy = top + 14;
        var pat = ["0000000", "0111110", "0000010", "0000100", "0001000", "0010000", "0010000"]; // a "7"
        pat.forEach(function (row, r) { row.split("").forEach(function (v, k) {
          S("rect", { x: gx + k * c, y: gy + r * c, width: c - 1.5, height: c - 1.5, rx: 1.5, class: v === "1" ? "f-ink" : "f-faint", "fill-opacity": v === "1" ? 1 : 0.5 }, g);
        }); });
        filt = S("rect", { x: gx - 1, y: gy - 1, width: 3 * c + 0.5, height: 3 * c + 0.5, rx: 3, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 3 }, g);
        var fx = gx + 7 * c + (compact ? 34 : 60), fy = gy + 18, mc = compact ? 11 : 12;
        A(g, gx + 7 * c + 8, gy + 3.5 * c, fx - 10, gy + 3.5 * c, "s-ink");
        [0, 1, 2].forEach(function (m) {
          S("rect", { x: fx + m * 8, y: fy + m * 8, width: 5 * mc, height: 5 * mc, rx: 3, class: "f-surface", stroke: "var(--a-blue)", "stroke-width": 1.5 }, g);
        });
        var ox = compact ? 318 : 480;
        A(g, fx + 5 * mc + 24, gy + 3.5 * c, ox - 18, gy + 3.5 * c, "s-ink");
        S("text", { x: ox, y: gy + 3.5 * c + 7, class: "t t-mid", "font-size": 20, "font-weight": 700, text: "7" }, g);
        S("text", { x: fx + 2.5 * mc + 8, y: fy + 5 * mc + 36, class: "t t-sm t-blue t-mid", text: compact ? "feature maps" : "feature maps" }, g);
        note(g, top + 168, compact ? "one small filter, reused at every position" : "one small filter slides over the image, reusing the same weights");
        note(g, top + 190, compact ? "LeNet-5 (1998) read handwritten cheques" : "LeNet-5 (1998) was used to read handwritten bank cheques", "t-muted");
      })(sc[0]);
      tl.addLabel("s0", 0);

      // ---- scene 1: SVM max margin
      (function (g) {
        var px = compact ? 40 : 150, py = top + 6, s = compact ? 150 : 160;
        var pts = [[0.15, 0.7, 0], [0.25, 0.88, 0], [0.32, 0.6, 0], [0.12, 0.45, 0], [0.62, 0.3, 1], [0.8, 0.45, 1], [0.72, 0.12, 1], [0.9, 0.22, 1]];
        function P(u, v) { return [px + u * s, py + (1 - v) * s]; }
        // boundary: through (0.47,1)…(0.47,0) tilted: line u - 0.35 v = 0.3
        function L(off) { var a = P(0.3 + off, 0), b = P(0.3 + 0.35 + off, 1); return "M" + a[0] + " " + a[1] + "L" + b[0] + " " + b[1]; }
        S("rect", { x: px, y: py, width: s, height: s, class: "f-none", stroke: "var(--line)", "stroke-width": 1.5 }, g);
        S("path", { d: L(-0.1), class: "s-faint", "stroke-dasharray": "5 5" }, g);
        S("path", { d: L(0.1), class: "s-faint", "stroke-dasharray": "5 5" }, g);
        S("path", { d: L(0), class: "s-ink", "stroke-width": 2.5 }, g);
        pts.forEach(function (p) {
          var q = P(p[0], p[1]);
          if (p[2]) S("circle", { cx: q[0], cy: q[1], r: 7, class: "f-blue" }, g);
          else S("rect", { x: q[0] - 6.5, y: q[1] - 6.5, width: 13, height: 13, rx: 2, class: "f-orange" }, g);
        });
        var tx = compact ? 272 : 470, ty = top + 40;
        var lines = compact ? ["widest", "margin", "between", "classes"] : ["the widest margin", "between the classes", "", "convex training:", "one best answer"];
        lines.forEach(function (t, i) { if (t) S("text", { x: tx, y: ty + i * 20, class: "t t-sm t-mid", text: t }, g); });
        note(g, top + 186, compact ? "SVMs (1995) led ML through the 2000s" : "support vector machines (Cortes & Vapnik, 1995) led machine learning in the 2000s", "t-muted");
      })(sc[1]);
      LC.h1.swap(tl, sc[0], sc[1]); T.go(tl, 1);
      tl.addLabel("s1");

      // ---- scene 2: LSTM memory line
      var belt, gates = [];
      (function (g) {
        var x0 = compact ? 26 : 90, x1 = W - x0, y = top + 40, n = 5, step = (x1 - x0) / n;
        belt = S("path", { d: "M" + x0 + " " + y + "H" + x1, class: "s-orange", "stroke-width": 5 }, g);
        S("text", { x: x0, y: y - 16, class: "t t-sm t-orange", text: compact ? "memory line (cell state)" : "memory line (cell state): information flows along it" }, g);
        for (var i = 0; i < n; i++) {
          var xx = x0 + step * (i + 0.5);
          var gt = S("circle", { cx: xx, cy: y, r: 9, class: "f-surface", stroke: "var(--a-ink)", "stroke-width": 2 }, g);
          gates.push(gt);
          S("line", { x1: xx, y1: y + 10, x2: xx, y2: y + 46, class: "s-faint" }, g);
          LC.h1.box(g, xx, y + 62, compact ? 50 : 70, 30, compact ? "x" + (i + 1) : "word " + (i + 1), { size: 12 });
        }
        note(g, top + 136, compact ? "gates decide what to keep, forget, write" : "learned gates decide what to keep, what to forget and what to write");
        note(g, top + 158, compact ? "so gradients survive many steps" : "so the learning signal survives across many time steps", "t-muted");
      })(sc[2]);
      LC.h1.swap(tl, sc[1], sc[2]); T.go(tl, 2);
      tl.to(gates, { attr: { "stroke-width": 4 }, duration: 0.2, stagger: 0.12, yoyo: true, repeat: 1 });
      tl.addLabel("s2");

      // ---- scene 3: layer-wise pretraining
      var layers = [];
      (function (g) {
        var lw = compact ? 200 : 260, lx = cx - lw / 2, ys = [top + 120, top + 78, top + 36];
        LC.h1.box(g, cx, top + 162, lw, 26, "input (e.g. pixels)", { size: 12, fill: "f-surface2" });
        ys.forEach(function (y, i) {
          var b = LC.h1.box(g, cx, y, lw, 26, "layer " + (i + 1), { size: 12, stroke: "var(--a-blue)" });
          layers.push(b);
        });
        var nx = compact ? cx + lw / 2 + 8 : cx + lw / 2 + 20;
        if (!compact) {
          S("text", { x: nx, y: top + 124, class: "t t-sm t-blue", text: "1. train layer 1" }, g);
          S("text", { x: nx, y: top + 82, class: "t t-sm t-blue", text: "2. freeze, add layer 2" }, g);
          S("text", { x: nx, y: top + 40, class: "t t-sm t-blue", text: "3. …then fine-tune all" }, g);
        }
        note(g, top + 200, compact ? "pretrain one layer at a time, then fine-tune" : "Hinton, Osindero & Teh (2006): pretrain one layer at a time, then fine-tune", "t-muted");
      })(sc[3]);
      layers.forEach(function (b) { b.style.opacity = 0; });
      LC.h1.swap(tl, sc[2], sc[3]); T.go(tl, 3);
      tl.to(layers, { opacity: 1, duration: 0.35, stagger: 0.4 });
      tl.addLabel("s3");

      // ---- scene 4: GPU + ImageNet
      var tiles = [];
      (function (g) {
        var gx = compact ? 90 : 190, gy = top + 70, cs = compact ? 64 : 72;
        S("rect", { x: gx - cs / 2, y: gy - cs / 2, width: cs, height: cs, rx: 8, class: "f-ink" }, g);
        for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) {
          S("rect", { x: gx - cs / 2 + 8 + i * (cs - 16) / 4, y: gy - cs / 2 + 8 + j * (cs - 16) / 4, width: (cs - 16) / 4 - 3, height: (cs - 16) / 4 - 3, rx: 1.5, class: "f-paper" }, g);
        }
        for (var p = 0; p < 6; p++) {
          var o = -cs / 2 + 6 + p * (cs - 12) / 5;
          S("line", { x1: gx + o, x2: gx + o, y1: gy - cs / 2 - 7, y2: gy - cs / 2, class: "s-ink" }, g);
          S("line", { x1: gx + o, x2: gx + o, y1: gy + cs / 2, y2: gy + cs / 2 + 7, class: "s-ink" }, g);
        }
        S("text", { x: gx, y: top + 138, class: "t t-sm t-mid", "font-weight": 600, text: "GPU" }, g);
        S("text", { x: gx, y: top + 158, class: "t t-sm t-muted t-mid", text: compact ? "many cores at once" : "thousands of simple cores" }, g);
        var ix = compact ? 196 : 380, iy = top + 22, tsz = compact ? 15 : 15, cols = compact ? 8 : 11;
        for (var r = 0; r < 6; r++) for (var k = 0; k < cols; k++) {
          var cls = ["f-blue", "f-orange", "f-faint", "f-ink"][(r * 3 + k * 7 + (r * k) % 3) % 4];
          tiles.push(S("rect", { x: ix + k * (tsz + 2), y: iy + r * (tsz + 2), width: tsz, height: tsz, rx: 2, class: cls, "fill-opacity": 0.75 }, g));
        }
        var icx = ix + cols * (tsz + 2) / 2;
        S("text", { x: icx, y: top + 138, class: "t t-sm t-mid", "font-weight": 600, text: "ImageNet" }, g);
        S("text", { x: icx, y: top + 158, class: "t t-sm t-muted t-mid", text: compact ? "14M+ labelled photos" : "14M+ photos, 20,000+ categories" }, g);
        note(g, top + 192, compact ? "contest: 1.2M images, 1000 classes" : "the yearly contest used 1.2M training images in 1000 classes", "t-muted");
      })(sc[4]);
      tiles.forEach(function (t) { t.style.opacity = 0; });
      LC.h1.swap(tl, sc[3], sc[4]); T.go(tl, 4);
      tl.to(tiles, { opacity: 1, duration: 0.15, stagger: { each: 0.012, from: "random" } });
      tl.addLabel("s4");

      // ---- scene 5: AlexNet bars
      var bars = [];
      (function (g) {
        var x0 = compact ? 92 : 170, maxW = compact ? 200 : 300, scale = maxW / 30;
        S("text", { x: x0, y: top + 6, class: "t t-sm t-muted", text: "ImageNet 2012, top-5 error (lower is better)" }, g);
        [["runner-up", 26.2, "f-faint"], ["AlexNet", 15.3, "f-orange"]].forEach(function (b, i) {
          var y = top + 26 + i * 44;
          S("text", { x: x0 - 10, y: y + 20, class: "t t-sm t-end", "font-weight": i ? 600 : 400, text: b[0] }, g);
          var r = S("rect", { x: x0, y: y, width: 0, height: 30, rx: 4, class: b[2] }, g);
          var v = S("text", { x: x0 + b[1] * scale + 8, y: y + 20, class: "t t-sm t-mono", text: b[1].toFixed(1) + "%" }, g);
          v.style.opacity = 0;
          bars.push([r, b[1] * scale, v]);
        });
        note(g, top + 140, compact ? "8 layers, 60M weights, 2 GPUs" : "8 layers, about 60 million weights, trained on two GPUs for about a week");
        note(g, top + 162, compact ? "new tricks: ReLU and dropout" : "new tricks: ReLU activations, dropout and data augmentation", "t-muted");
      })(sc[5]);
      LC.h1.swap(tl, sc[4], sc[5]); T.go(tl, 5);
      bars.forEach(function (b, i) {
        tl.to(b[0], { attr: { width: b[1] }, duration: 0.6, ease: "power2.out" }, i ? "<0.15" : undefined);
        tl.to(b[2], { opacity: 1, duration: 0.25 }, ">-0.1");
      });
      tl.addLabel("s5");

      // ---- scene 6: word2vec + GAN
      var vecs = [];
      (function (g) {
        var ox = compact ? 30 : 60, oy = top + 10;
        var P = { man: [ox + 20, oy + 92], woman: [ox + 90, oy + 64], king: [ox + 34, oy + 26], queen: [ox + 104, oy - 2] };
        if (compact) { P = { man: [ox + 10, oy + 96], woman: [ox + 84, oy + 70], king: [ox + 24, oy + 36], queen: [ox + 98, oy + 10] }; }
        Object.keys(P).forEach(function (k) { S("circle", { cx: P[k][0], cy: P[k][1], r: 4.5, class: "f-ink" }, g); });
        S("text", { x: P.man[0], y: P.man[1] + 18, class: "t t-sm t-mid", text: "man" }, g);
        S("text", { x: P.woman[0] + 8, y: P.woman[1] + 16, class: "t t-sm", text: "woman" }, g);
        S("text", { x: P.king[0] - 8, y: P.king[1] + 4, class: "t t-sm t-end", text: "king" }, g);
        S("text", { x: P.queen[0] + 8, y: P.queen[1] + 4, class: "t t-sm", text: "queen" }, g);
        vecs.push(A(g, P.man[0] + 5, P.man[1] - 2, P.woman[0] - 6, P.woman[1] + 2, "s-blue", 7));
        vecs.push(A(g, P.king[0] + 5, P.king[1] - 2, P.queen[0] - 6, P.queen[1] + 2, "s-blue", 7));
        S("text", { x: compact ? 86 : 150, y: top + 150, class: "t t-sm t-mid t-blue", text: "word2vec (2013)" }, g);
        // GAN
        var gx = compact ? 250 : 430, gy = top + 24;
        LC.h1.box(g, gx, gy, compact ? 116 : 150, 34, compact ? "generator" : "generator: fakes", { size: 12, stroke: "var(--a-orange)" });
        LC.h1.box(g, gx, gy + 76, compact ? 116 : 150, 34, compact ? "discriminator" : "discriminator: real?", { size: 12, stroke: "var(--a-blue)" });
        vecs.push(A(g, gx - 20, gy + 18, gx - 20, gy + 56, "s-orange", 7));
        vecs.push(A(g, gx + 20, gy + 58, gx + 20, gy + 20, "s-blue", 7));
        S("text", { x: gx, y: top + 150, class: "t t-sm t-mid t-orange", text: "GANs (2014)" }, g);
        note(g, top + 186, compact ? "a game: each network improves the other" : "word directions carry meaning; a two-player game creates images", "t-muted");
      })(sc[6]);
      vecs.forEach(function (a) { a[1].style.opacity = 0; });
      LC.h1.swap(tl, sc[5], sc[6]); T.go(tl, 6);
      vecs.forEach(function (a, i) { LC.drawIn(tl, a[0], { duration: 0.4 }, i ? "<0.15" : undefined); tl.to(a[1], { opacity: 1, duration: 0.1 }, ">-0.05"); });
      tl.addLabel("s6");

      // ---- scene 7: ImageNet winners by year
      var wb = [];
      (function (g) {
        var x0 = compact ? 30 : 110, x1 = compact ? 340 : 520, base = top + 150, hmax = 116, sc30 = hmax / 30;
        var bw = (x1 - x0) / WIN.length;
        S("text", { x: compact ? 14 : x0, y: top + 6, class: "t t-sm t-muted", text: compact ? "ImageNet winners, top-5 error" : "ImageNet challenge winners, top-5 error" }, g);
        S("line", { x1: x0, x2: x1, y1: base, y2: base, class: "s-axis" }, g);
        var hy = base - 5.1 * sc30;
        S("path", { d: "M" + x0 + " " + hy + "H" + x1, class: "s-ink", "stroke-dasharray": "4 4", "stroke-width": 1.5 }, g);
        if (!compact) S("text", { x: x1 + 8, y: hy + 4, class: "t t-sm", text: "one human ≈ 5.1%" }, g);
        WIN.forEach(function (w, i) {
          var xc = x0 + bw * (i + 0.5), h = w[1] * sc30;
          var r = S("rect", { x: xc - bw * 0.3, y: base, width: bw * 0.6, height: 0, rx: 3, class: w[0] >= 2012 ? "f-orange" : "f-faint" }, g);
          var v = S("text", { x: xc, y: Math.min(base - h - 6, hy - 6), class: "t t-sm t-mono t-mid", text: w[1].toFixed(1) }, g);
          S("text", { x: xc, y: base + 16, class: "t t-sm t-muted t-mid", text: compact ? "'" + String(w[0]).slice(2) : w[0] }, g);
          if (w[2]) S("text", { x: xc, y: base + (compact && w[0] === 2014 ? 50 : 34), class: "t t-sm t-mid", text: w[2] }, g);
          v.style.opacity = 0;
          wb.push([r, h, v, base]);
        });
        if (compact) note(g, top + 224, "dashed line: one trained human, ≈ 5.1%", "t-muted");
      })(sc[7]);
      LC.h1.swap(tl, sc[6], sc[7]); T.go(tl, 7);
      wb.forEach(function (b, i) {
        tl.to(b[0], { attr: { y: b[3] - b[1], height: b[1] }, duration: 0.45, ease: "power2.out" }, i ? "<0.12" : undefined);
        tl.to(b[2], { opacity: 1, duration: 0.2 }, ">-0.1");
      });
      tl.addLabel("s7");

      return tl;
    }
  };
})();
