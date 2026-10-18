/* V1.4: one scene, five vision tasks: classification → detection → semantic →
   instance → panoptic segmentation → a SAM point prompt. Scores are illustrative. */
(function () {
  var LC = window.LC;
  LC.anims["v1-4-tasks"] = {
    title: "One photo, five vision tasks",
    steps: [
      "One photo: two cats, a ball, grass and sky. Each vision task asks a different question about it.",
      "<strong>Classification</strong>: one label for the whole image. It says “cat”, but not where, or how many.",
      "<strong>Detection</strong>: a <strong>bounding box</strong>, a class and a confidence score for every object. Now we know there are two cats and a ball, and roughly where.",
      "<strong>Semantic segmentation</strong>: a class for <strong>every pixel</strong>, including amorphous “stuff” like grass and sky. Both cats share one colour: it doesn't separate individuals.",
      "<strong>Instance segmentation</strong>: a separate pixel <strong>mask for each object</strong> (each “thing”), so cat 1 and cat 2 differ. Background stuff is ignored.",
      "<strong>Panoptic segmentation</strong> combines both: every pixel gets a class, and pixels of countable things also get an instance ID.",
      "<strong>Promptable segmentation</strong> (SAM): click a point, or draw a box, and get the mask of whatever is there, for any kind of object, with no class list at all."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 318 } : { w: 640, h: 330 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      var sx = compact ? 16 : 24, sy = compact ? 34 : 30, sw = compact ? 328 : 400, sh = compact ? 222 : 270;
      function X(u) { return sx + u * sw; } function Y(v) { return sy + v * sh; } function R(r) { return r * sh; }
      var cats = [
        { bx: 0.24, by: 0.73, hx: 0.36, hy: 0.6, s: 1, dir: 1 },
        { bx: 0.68, by: 0.75, hx: 0.585, hy: 0.635, s: 0.82, dir: -1 }
      ];
      var ball = { x: 0.88, y: 0.83, r: 0.07 };
      // Draw a cat as a group of shapes with a common fill (and tail stroke).
      function cat(c, fill, op, stroke, parent) {
        var g = S("g", {}, parent), k = c.s, d = c.dir;
        var a = { fill: fill, "fill-opacity": op };
        if (stroke) { a.stroke = stroke; a["stroke-width"] = 1.5; }
        var hx = X(c.hx), hy = Y(c.hy), bx = X(c.bx), by = Y(c.by);
        S("path", { d: "M" + (bx - d * R(0.17 * k)) + " " + (by - R(0.02 * k)) + "Q" + (bx - d * R(0.33 * k)) + " " + (by - R(0.05 * k)) + " " + (bx - d * R(0.3 * k)) + " " + (by - R(0.22 * k)),
          fill: "none", stroke: fill, "stroke-opacity": op, "stroke-width": R(0.035 * k), "stroke-linecap": "round" }, g);
        S("ellipse", Object.assign({ cx: bx, cy: by, rx: R(0.2 * k), ry: R(0.12 * k) }, a), g);
        [-1, 1].forEach(function (e) {
          S("path", Object.assign({ d: "M" + (hx + e * R(0.085 * k)) + " " + (hy - R(0.03 * k)) + "L" + (hx + e * R(0.075 * k)) + " " + (hy - R(0.155 * k)) + "L" + (hx + e * R(0.01 * k)) + " " + (hy - R(0.085 * k)) + "Z" }, a), g);
        });
        S("circle", Object.assign({ cx: hx, cy: hy, r: R(0.095 * k) }, a), g);
        return g;
      }
      function ballShape(fill, op, stroke, parent) {
        var a = { cx: X(ball.x), cy: Y(ball.y), r: R(ball.r), fill: fill, "fill-opacity": op };
        if (stroke) { a.stroke = stroke; a["stroke-width"] = 1.5; }
        return S("circle", a, parent);
      }
      var groundV = 0.56;
      function sky(fill, op, parent) { return S("rect", { x: sx, y: sy, width: sw, height: groundV * sh, fill: fill, "fill-opacity": op }, parent); }
      function grass(fill, op, parent) { return S("rect", { x: sx, y: Y(groundV), width: sw, height: (1 - groundV) * sh, fill: fill, "fill-opacity": op }, parent); }

      // s0: the scene
      var scene = S("g", {}, svg);
      sky("var(--a-blue)", 0.12, scene); grass("var(--good)", 0.25, scene);
      var catG = cats.map(function (c) { return cat(c, "var(--a-faint)", 1, "var(--a-ink)", scene); });
      var ballG = ballShape("var(--a-paper)", 1, "var(--a-ink)", scene);
      // eyes so the cats read as cats
      cats.forEach(function (c) {
        [-1, 1].forEach(function (e) { S("circle", { cx: X(c.hx) + e * R(0.035 * c.s), cy: Y(c.hy) - R(0.01), r: R(0.014), class: "f-ink" }, scene); });
      });
      S("path", { d: "M" + X(ball.x - 0.035) + " " + Y(ball.y) + "Q" + X(ball.x) + " " + Y(ball.y - 0.05) + " " + X(ball.x + 0.035) + " " + Y(ball.y), class: "f-none", stroke: "var(--a-ink)", "stroke-width": 1.2 }, scene);
      S("rect", { x: sx, y: sy, width: sw, height: sh, rx: 4, class: "f-none", stroke: "var(--line)", "stroke-width": 1.5 }, scene);
      tl.addLabel("s0", 0);

      // legend area
      var legX = compact ? sx : sx + sw + 24, legY = compact ? sy + sh + 24 : sy + 22;
      function legend(items) {
        var g = S("g", {}, svg);
        items.forEach(function (it, i) {
          var col = compact ? i % 3 : 0, row = compact ? Math.floor(i / 3) : i;
          var x = legX + col * 112, y = legY + row * (compact ? 24 : 28);
          if (it.full) { x = legX; }
          var tx = x;
          if (it.c) { S("rect", { x: x, y: y - 11, width: 14, height: 14, rx: 3, fill: it.c, "fill-opacity": it.op || 0.75 }, g); tx = x + 20; }
          if (it.star) { S("path", { d: starPath(x + 7, y - 4, 7), class: "f-orange", stroke: "var(--a-ink)", "stroke-width": 1 }, g); tx = x + 20; }
          S("text", { x: tx, y: y, class: "t t-sm" + (it.muted ? " t-muted" : ""), text: it.t }, g);
        });
        g.style.opacity = 0;
        return g;
      }
      function starPath(cx, cy, r) {
        var d = "";
        for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; d += (i ? "L" : "M") + (cx + rr * Math.cos(a)).toFixed(1) + " " + (cy + rr * Math.sin(a)).toFixed(1); }
        return d + "Z";
      }
      function swap(from, to) {
        if (from) tl.to(from, { opacity: 0, duration: 0.3 });
        tl.to(to, { opacity: 1, duration: 0.4 }, from ? ">" : "+=0");
      }

      // s1: classification
      var cls = S("g", {}, svg);
      var bw = compact ? 92 : 104;
      S("rect", { x: sx + 10, y: sy + 10, width: bw, height: 26, rx: 13, class: "f-ink" }, cls);
      S("text", { x: sx + 10 + bw / 2, y: sy + 27.5, class: "t t-sm t-mid t-nohalo", style: "fill:var(--a-paper)", "font-weight": 600, text: "label: cat" }, cls);
      cls.style.opacity = 0;
      var L1 = legend([{ t: compact ? "one label per image" : "one label for the whole image", muted: true }]);
      swap(null, [cls, L1]);
      tl.addLabel("s1");

      // s2: detection boxes + tags
      var det = S("g", {}, svg);
      var dets = [[catG[0], "cat 0.97", "var(--a-orange)"], [catG[1], "cat 0.91", "var(--a-blue)"], [ballG, "ball 0.88", "var(--bad)"]];
      dets.forEach(function (dd) {
        var b = dd[0].getBBox(), pad = 3;
        S("rect", { x: b.x - pad, y: b.y - pad, width: b.width + 2 * pad, height: b.height + 2 * pad, rx: 2, class: "f-none", stroke: dd[2], "stroke-width": 2.5 }, det);
        var tw = dd[1].length * 7 + 10, tx = Math.min(b.x - pad, sx + sw - tw);
        S("rect", { x: tx, y: b.y - pad - 18, width: tw, height: 18, rx: 3, fill: dd[2] }, det);
        S("text", { x: tx + 5, y: b.y - pad - 5, class: "t t-sm t-mono t-nohalo", style: "fill:var(--a-paper)", text: dd[1] }, det);
      });
      det.style.opacity = 0;
      var L2 = legend([{ t: compact ? "box + class + score" : "box + class + confidence", muted: true }]);
      swap([cls, L1], [det, L2]);
      tl.addLabel("s2");

      // s3: semantic segmentation
      var sem = S("g", {}, svg);
      sky("var(--accent)", 0.35, sem); grass("var(--good)", 0.6, sem);
      cats.forEach(function (c) { cat(c, "var(--a-orange)", 0.85, null, sem); });
      ballShape("var(--bad)", 0.8, null, sem);
      sem.style.opacity = 0;
      var L3 = legend([{ c: "var(--a-orange)", t: "cat" }, { c: "var(--bad)", t: "ball" }, { c: "var(--good)", t: "grass" }, { c: "var(--accent)", op: 0.35, t: "sky" }]);
      swap([det, L2], [sem, L3]);
      tl.addLabel("s3");

      // s4: instance segmentation
      var ins = S("g", {}, svg);
      cat(cats[0], "var(--a-orange)", 0.85, null, ins);
      cat(cats[1], "var(--a-blue)", 0.85, null, ins);
      ballShape("var(--bad)", 0.8, null, ins);
      ins.style.opacity = 0;
      var L4 = legend([{ c: "var(--a-orange)", t: "cat 1" }, { c: "var(--a-blue)", t: "cat 2" }, { c: "var(--bad)", t: "ball 1" }, { t: compact ? "grass, sky: ignored" : "grass and sky: ignored", muted: true, full: true }]);
      swap([sem, L3], [ins, L4]);
      tl.addLabel("s4");

      // s5: panoptic
      var pan = S("g", {}, svg);
      sky("var(--accent)", 0.35, pan); grass("var(--good)", 0.6, pan);
      cat(cats[0], "var(--a-orange)", 0.9, null, pan);
      cat(cats[1], "var(--a-blue)", 0.9, null, pan);
      ballShape("var(--bad)", 0.85, null, pan);
      pan.style.opacity = 0;
      var L5 = legend([{ c: "var(--a-orange)", t: "cat 1" }, { c: "var(--a-blue)", t: "cat 2" }, { c: "var(--bad)", t: "ball 1" }, { c: "var(--good)", t: "grass" }, { c: "var(--accent)", op: 0.35, t: "sky" }]);
      swap([ins, L4], [pan, L5]);
      tl.addLabel("s5");

      // s6: SAM point prompt → mask
      var sam = S("g", {}, svg);
      var m = cat(cats[1], "var(--a-orange)", 0.45, "var(--a-orange)", sam);
      m.setAttribute("stroke-dasharray", "4 3");
      var px = X(cats[1].bx) + R(0.02), py = Y(cats[1].by);
      S("path", { d: starPath(px, py, 9), class: "f-orange", stroke: "var(--a-ink)", "stroke-width": 1.2 }, sam);
      sam.style.opacity = 0;
      var L6 = legend([{ star: true, t: compact ? "click" : "point prompt (a click)" }, { c: "var(--a-orange)", op: 0.45, t: compact ? "SAM's mask" : "mask predicted by SAM" }]);
      swap([pan, L5], [sam, L6]);
      tl.addLabel("s6");
      return tl;
    }
  };
})();
