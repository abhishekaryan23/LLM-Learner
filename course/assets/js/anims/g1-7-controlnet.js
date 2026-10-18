/* G1.7: ControlNet (Zhang, Rao & Agrawala, 2023) as a block diagram. The base U-Net is
   frozen; a trainable copy of its encoder and middle block reads the control image and
   feeds the frozen decoder through zero-initialised convolutions. */
(function () {
  var LC = window.LC;

  LC.anims["g1-7-controlnet"] = {
    title: "ControlNet: a trainable copy that steers a frozen model",
    steps: [
      "Start from a pretrained text-to-image denoiser (here a U-Net). It is <strong>frozen</strong>: none of its weights will change.",
      "ControlNet makes a <strong>trainable copy</strong> of its encoder and middle block, initialised with the same weights, so it starts out already understanding images.",
      "The copy also reads the <strong>control image</strong>, here an edge map of a house, through a few small convolution layers.",
      "The copy's outputs are added into the frozen decoder through <strong>zero convolutions</strong>: 1×1 convolutions whose weights start at exactly 0. On day one ControlNet adds nothing, so it can't damage the base model.",
      "Training on (image, control map, caption) triples updates <strong>only the copy</strong> (orange). Gradients grow the zero convolutions away from zero as the copy learns to follow the edges.",
      "At inference, the same prompt plus an edge map gives an image that <strong>follows the edges</strong>. Swap in a pose, depth or segmentation map with a ControlNet trained for it."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 452 } : { w: 640, h: 318 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      var B = compact ? {
        lat: [14, 44, 150, 42, "noisy latent", "+ prompt"], enc: [14, 104, 150, 42, "encoder", "frozen"], mid: [14, 164, 150, 42, "middle block", "frozen"],
        dec: [14, 224, 150, 42, "decoder", "frozen"], out: [14, 284, 150, 42, "predicted noise", ""],
        edge: [196, 44, 150, 42, "", ""], cenc: [196, 104, 150, 42, "encoder copy", "trainable"], cmid: [196, 164, 150, 42, "middle copy", "trainable"],
        zero: [196, 224, 150, 42, "zero convs", "start at 0"]
      } : {
        lat: [14, 52, 104, 46, "noisy latent", "+ prompt"], enc: [148, 52, 112, 46, "encoder", "frozen"], mid: [290, 52, 100, 46, "middle", "frozen"],
        dec: [420, 52, 100, 46, "decoder", "frozen"], out: [550, 52, 80, 46, "output", ""],
        edge: [14, 168, 104, 64, "", ""], cenc: [148, 168, 112, 46, "encoder copy", "trainable"], cmid: [290, 168, 100, 46, "middle copy", "trainable"],
        zero: [420, 168, 100, 46, "zero convs", "start at 0"]
      };
      var rects = {}, groups = {};
      function box(k) {
        var b = B[k], g = S("g", {}, svg);
        rects[k] = S("rect", { x: b[0], y: b[1], width: b[2], height: b[3], rx: 9, class: "f-surface", stroke: "var(--a-ink)", "stroke-width": 1.5 }, g);
        if (b[4]) S("text", { x: b[0] + b[2] / 2, y: b[1] + (b[5] ? 18 : b[3] / 2 + 5), class: "t t-sm t-mid", "font-weight": 650, text: b[4] }, g);
        if (b[5]) S("text", { x: b[0] + b[2] / 2, y: b[1] + 34, class: "t t-sm t-mid t-muted", text: b[5] }, g);
        groups[k] = g; return g;
      }
      function arrow(x1, y1, x2, y2, cls) {
        var g = S("g", {}, svg), a = Math.atan2(y2 - y1, x2 - x1);
        S("path", { d: "M" + x1 + " " + y1 + "L" + x2 + " " + y2, class: cls || "s-ink", "stroke-width": 1.8 }, g);
        S("path", { d: "M" + (x2 - 8 * Math.cos(a - 0.5)) + " " + (y2 - 8 * Math.sin(a - 0.5)) + "L" + x2 + " " + y2 + "L" + (x2 - 8 * Math.cos(a + 0.5)) + " " + (y2 - 8 * Math.sin(a + 0.5)), class: cls || "s-ink", "stroke-width": 1.8 }, g);
        return g;
      }
      function R(k) { var b = B[k]; return { l: b[0], r: b[0] + b[2], t: b[1], b: b[1] + b[3], cx: b[0] + b[2] / 2, cy: b[1] + b[3] / 2 }; }
      function house(x, y, w, h, filled) { // a house drawn in a w×h box
        var g = S("g", {}, svg), bx = x + w * 0.25, bw = w * 0.5, by = y + h * 0.45, bh = h * 0.45;
        if (filled) {
          S("rect", { x: x, y: y, width: w, height: h, rx: 6, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, g);
          S("rect", { x: bx, y: by, width: bw, height: bh, class: "f-blue", "fill-opacity": 0.75 }, g);
          S("path", { d: "M" + (bx - w * 0.06) + " " + by + "L" + (x + w / 2) + " " + (y + h * 0.12) + "L" + (bx + bw + w * 0.06) + " " + by + "Z", class: "f-orange" }, g);
          S("rect", { x: x + w / 2 - w * 0.06, y: by + bh * 0.45, width: w * 0.12, height: bh * 0.55, class: "f-ink", "fill-opacity": 0.8 }, g);
        } else {
          S("rect", { x: x, y: y, width: w, height: h, rx: 6, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, g);
          S("path", { d: "M" + bx + " " + by + "v" + bh + "h" + bw + "v" + (-bh) + "M" + (bx - w * 0.06) + " " + by + "L" + (x + w / 2) + " " + (y + h * 0.12) + "L" + (bx + bw + w * 0.06) + " " + by + "Z" +
            "M" + (x + w / 2 - w * 0.06) + " " + (by + bh) + "v" + (-bh * 0.55) + "h" + (w * 0.12) + "v" + (bh * 0.55), class: "s-ink", "stroke-width": 1.6, "stroke-linejoin": "round" }, g);
        }
        return g;
      }

      // s0: frozen model
      ["lat", "enc", "mid", "dec", "out"].forEach(box);
      var fz = [];
      var order = ["lat", "enc", "mid", "dec", "out"];
      for (var i = 0; i < 4; i++) {
        var a = R(order[i]), b = R(order[i + 1]);
        fz.push(compact ? arrow(a.cx, a.b + 2, b.cx, b.t - 3) : arrow(a.r + 2, a.cy, b.l - 3, b.cy));
      }
      var fzLbl = S("text", compact ? { x: 89, y: 30, class: "t t-sm t-mid t-muted", text: "frozen base model" } : { x: 14, y: 34, class: "t t-sm t-muted", text: "frozen base model (Stable Diffusion's U-Net)" }, svg);
      tl.addLabel("s0", 0);

      // s1: trainable copy
      var cp = [box("cenc"), box("cmid")];
      var ce = R("cenc"), cm = R("cmid");
      cp.push(compact ? arrow(ce.cx, ce.b + 2, cm.cx, cm.t - 3, "s-orange") : arrow(ce.r + 2, ce.cy, cm.l - 3, cm.cy, "s-orange"));
      var cpLbl = S("text", compact ? { x: 271, y: 30, class: "t t-sm t-mid t-orange", text: "ControlNet" } : { x: 196, y: 154, class: "t t-sm t-orange", text: "ControlNet: trainable copy" }, svg);
      [rects.cenc, rects.cmid].forEach(function (r) { r.setAttribute("stroke", "var(--a-orange)"); });
      var lc = R("lat");
      cp.push(compact ? arrow(lc.r + 2, lc.b - 4, ce.l - 3, ce.t + 8, "s-orange") : arrow(lc.r - 10, lc.b + 2, ce.l + 12, ce.t - 3, "s-orange"));
      LC.popIn(tl, cp.concat([cpLbl]), { duration: 0.4 });
      tl.addLabel("s1");

      // s2: control image
      var ed = R("edge");
      var edgeG = compact ? house(ed.l, ed.t, 60, ed.b - ed.t, false) : house(ed.l + 16, ed.t, 72, ed.b - ed.t, false);
      var edL = S("text", compact ? { x: ed.l + 70, y: ed.cy + 5, class: "t t-sm", text: "edge map" } : { x: ed.cx, y: ed.b + 18, class: "t t-sm t-mid", text: "edge map" }, svg);
      var edA = compact ? arrow(ed.l + 30, ed.b + 2, ed.l + 30, ce.t - 3, "s-orange") : arrow(ed.r - 12, ed.cy, ce.l - 3, ce.cy + 4, "s-orange");
      LC.popIn(tl, [edgeG, edL, edA], { duration: 0.4 });
      tl.addLabel("s2");

      // s3: zero convs into the decoder
      var zg = box("zero");
      var zr = R("zero"), dr = R("dec");
      rects.zero.setAttribute("stroke", "var(--a-orange)");
      var za = compact ? arrow(cm.cx, cm.b + 2, zr.cx, zr.t - 3, "s-orange") : arrow(cm.r + 2, cm.cy, zr.l - 3, zr.cy, "s-orange");
      var zd = compact ? arrow(zr.l - 2, zr.cy, dr.r + 3, dr.cy, "s-orange") : arrow(zr.cx, zr.t - 2, dr.cx, dr.b + 3, "s-orange");
      var plus = S("text", compact ? { x: (zr.l + dr.r) / 2, y: dr.cy - 8, class: "t t-sm t-mid t-orange", text: "+" } : { x: zr.cx + 10, y: (zr.t + dr.b) / 2 + 5, class: "t t-sm t-orange", text: "+ added" }, svg);
      LC.popIn(tl, [zg, za, zd, plus], { duration: 0.4 });
      tl.addLabel("s3");

      // s4: training: only the copy learns
      var trainLbl = S("text", compact ? { x: 180, y: 352, class: "t t-sm t-mid", text: "training: only the orange part changes" } : { x: 420, y: 252, class: "t t-sm", text: "training updates only the orange part" }, svg);
      var frozenEls = order.map(function (k) { return groups[k]; }).concat(fz);
      tl.to(frozenEls, { opacity: 0.45, duration: 0.4 });
      LC.popIn(tl, trainLbl, { duration: 0.4 }, "<");
      tl.addLabel("s4");

      // s5: inference result
      tl.to(frozenEls, { opacity: 1, duration: 0.3 });
      tl.to(trainLbl, { opacity: 0, duration: 0.3 }, "<");
      var res = S("g", {}, svg);
      if (compact) {
        house(40, 370, 90, 70, false).setAttribute("data-k", "a");
        res.appendChild(svg.lastChild);
        arrow(148, 405, 210, 405).querySelectorAll("path").forEach(function (p) { res.appendChild(p); });
        var hf = house(228, 370, 90, 70, true); res.appendChild(hf);
        S("text", { x: 179, y: 397, class: "t t-sm t-mid", text: "+ prompt" }, res);
      } else {
        var o = R("out");
        res.appendChild(house(o.l, 122, 80, 70, true));
        res.appendChild(arrow(o.cx, o.b + 2, o.cx, 119));
        S("text", { x: o.cx, y: 210, class: "t t-sm t-mid", text: "follows" }, res);
        S("text", { x: o.cx, y: 228, class: "t t-sm t-mid", text: "the edges" }, res);
      }
      LC.popIn(tl, res, { duration: 0.5 });
      tl.addLabel("s5");
      return tl;
    }
  };
})();
