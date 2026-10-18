/* G1.1: a VAE, one step at a time. The "images" are procedurally drawn shapes and
   the decoder is a hand-made smooth function of a 2-D latent z (see LC.g1shape):
   left–right in z morphs round → star, down–up morphs wide → tall. Far outside
   N(0, I) the shape turns ragged, standing in for "the decoder never saw codes here". */
(function () {
  var LC = window.LC;

  // closed path for the decoded shape at latent (z1, z2), centred at (cx, cy), radius R
  LC.g1shape = function (z1, z2, cx, cy, R) {
    var A = 0.34 / (1 + Math.exp(-1.6 * z1));          // star-ness
    var sx = Math.exp(-0.2 * z2), sy = Math.exp(0.2 * z2); // wide ↔ tall
    var far = Math.min(0.4, 0.16 * Math.max(0, Math.hypot(z1, z2) - 2.6)); // off-prior junk
    var d = "", n = 96;
    for (var i = 0; i <= n; i++) {
      var th = 2 * Math.PI * i / n;
      var r = 1 + A * Math.cos(5 * th - Math.PI / 2)
        + far * (0.6 * Math.cos(11 * th + 1.3) + 0.5 * Math.sin(17 * th + 0.4) + 0.4 * Math.cos(7 * th + 2.1));
      r = Math.max(0.15, r) * R / (1 + A * 0.6);
      d += (i ? "L" : "M") + (cx + r * Math.cos(th) * sx).toFixed(1) + " " + (cy - r * Math.sin(th) * sy).toFixed(1);
    }
    return d + "Z";
  };

  var MU = [0.9, 0.6], SIG = [0.35, 0.25], EPS = [0.8, -1.1];
  var Z = [MU[0] + SIG[0] * EPS[0], MU[1] + SIG[1] * EPS[1]];   // (1.18, 0.325)
  var OTHERS = [[-1.1, 0.4, 0.4, 0.3], [-0.4, -1.0, 0.3, 0.4], [0.5, -0.5, 0.35, 0.3], [-0.3, 1.2, 0.3, 0.35], [1.4, -1.2, 0.3, 0.3], [-1.5, -0.6, 0.35, 0.3], [0.1, 0.2, 0.3, 0.3], [1.6, 0.9, 0.3, 0.3]];
  var NEWZ = [-0.9, -0.7];

  LC.anims["g1-1-vae"] = {
    title: "A variational autoencoder, step by step",
    steps: [
      "An <strong>autoencoder</strong> squeezes an image $x$ into a short code $z$ and rebuilds it. Here $z$ has just 2 numbers, so we can draw it as a point on a plane.",
      "A VAE's <strong>encoder</strong> $q(z\\mid x)$ outputs a whole Gaussian, not a point: a <strong>mean</strong> $\\mu = (0.9, 0.6)$ and a <strong>spread</strong> $\\sigma = (0.35, 0.25)$, drawn as the ellipse.",
      "<strong>Reparameterization</strong>: draw $\\varepsilon \\sim \\mathcal{N}(0, I)$ and set $z = \\mu + \\sigma \\odot \\varepsilon$. The randomness lives in $\\varepsilon$, so gradients flow through $\\mu$ and $\\sigma$.",
      "The <strong>decoder</strong> $p(x\\mid z)$ rebuilds the image from $z$. Because $z$ wobbles inside the ellipse, the decoder learns to give nearby codes similar images, and its reconstructions come out a little <strong>soft</strong>.",
      "The loss has two parts: <strong>reconstruction</strong> (make $\\hat x$ match $x$) plus a <strong>KL term</strong> pulling each ellipse toward the prior $\\mathcal{N}(0, I)$, the dashed circles (1σ and 2σ).",
      "Across the dataset, the KL term packs every image's ellipse into the prior's disk, overlapping and <strong>leaving no holes</strong>. That is what makes the latent space smooth.",
      "To <strong>generate</strong>, skip the encoder: sample $z \\sim \\mathcal{N}(0, I)$ and decode. Any point the prior is likely to give lands where the decoder was trained, so it decodes to a sensible new shape."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 436 } : { w: 640, h: 360 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact";
      // geometry
      var fx = compact ? { x: 14, y: 56, s: 104 } : { x: 18, y: 84, s: 128 };
      var fo = compact ? { x: 14, y: 266, s: 104 } : { x: 494, y: 84, s: 128 };
      var pl = compact ? { x: 190, y: 56, s: 156 } : { x: 222, y: 52, s: 196 };
      function px(z) { return pl.x + (z + 3) / 6 * pl.s; }
      function py(z) { return pl.y + (3 - z) / 6 * pl.s; }
      var u = pl.s / 6;   // one latent unit in SVG units
      var tl = gsap.timeline();

      // input frame + shape
      function frameAt(f, label, lblY) {
        S("rect", { x: f.x, y: f.y, width: f.s, height: f.s, rx: 8, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, svg);
        return S("text", { x: f.x + f.s / 2, y: lblY, class: "t t-sm t-mid", text: label }, svg);
      }
      frameAt(fx, "image x", fx.y - 10);
      S("path", { d: LC.g1shape(MU[0], MU[1], fx.x + fx.s / 2, fx.y + fx.s / 2, fx.s * 0.33), class: "f-blue", "fill-opacity": 0.85 }, svg);
      // latent plane
      S("rect", { x: pl.x, y: pl.y, width: pl.s, height: pl.s, rx: 8, class: "f-none", stroke: "var(--line)", "stroke-width": 1.5 }, svg);
      S("line", { x1: pl.x, x2: pl.x + pl.s, y1: py(0), y2: py(0), class: "s-grid" }, svg);
      S("line", { x1: px(0), x2: px(0), y1: pl.y, y2: pl.y + pl.s, class: "s-grid" }, svg);
      S("text", { x: pl.x + pl.s / 2, y: pl.y - 10, class: "t t-sm t-mid", text: "latent plane z" }, svg);
      tl.addLabel("s0", 0);

      // s1: encoder arrow, ellipse, mu/sigma
      var encY = compact ? fx.y + fx.s / 2 : fx.y + fx.s / 2;
      var encA = S("path", { d: "M" + (fx.x + fx.s + 6) + " " + encY + "H" + (pl.x - 8), class: "s-ink", "stroke-width": 2 }, svg);
      var encH = S("path", { d: "M" + (pl.x - 15) + " " + (encY - 6) + "L" + (pl.x - 8) + " " + encY + "L" + (pl.x - 15) + " " + (encY + 6), class: "s-ink", "stroke-width": 2 }, svg);
      var encL = S("text", { x: (fx.x + fx.s + pl.x) / 2, y: encY - 10, class: "t t-sm t-mid", text: "encoder" }, svg);
      var ell = S("ellipse", { cx: px(MU[0]), cy: py(MU[1]), rx: SIG[0] * u * 2, ry: SIG[1] * u * 2, class: "f-blue", "fill-opacity": 0.22, stroke: "var(--a-blue)", "stroke-width": 1.5 }, svg);
      var muDot = S("circle", { cx: px(MU[0]), cy: py(MU[1]), r: 3, class: "f-blue" }, svg);
      var stats = compact
        ? [S("text", { x: pl.x + pl.s / 2, y: pl.y + pl.s + 20, class: "t t-sm t-mono t-mid", text: "μ = (0.9, 0.6)" }, svg),
           S("text", { x: pl.x + pl.s / 2, y: pl.y + pl.s + 38, class: "t t-sm t-mono t-mid", text: "σ = (0.35, 0.25)" }, svg)]
        : [S("text", { x: (fx.x + fx.s + pl.x) / 2, y: encY + 22, class: "t t-sm t-mono t-mid", text: "μ, σ" }, svg)];
      LC.drawIn(tl, encA, { duration: 0.5 });
      LC.popIn(tl, [encH, encL, ell, muDot].concat(stats), { duration: 0.4 });
      tl.addLabel("s1");

      // s2: reparameterized sample
      var zDot = S("circle", { cx: px(Z[0]), cy: py(Z[1]), r: 5, class: "f-orange", stroke: "var(--a-ink)", "stroke-width": 1.5 }, svg);
      var zLbl = S("text", { x: px(Z[0]) + 9, y: py(Z[1]) + 18, class: "t t-sm t-orange", text: "z" }, svg);
      var rep = compact
        ? S("text", { x: pl.x + pl.s / 2, y: pl.y + pl.s + 56, class: "t t-sm t-mid t-orange", text: "z = μ + σ ⊙ ε" }, svg)
        : S("text", { x: pl.x + pl.s / 2, y: pl.y + pl.s + 22, class: "t t-sm t-mid t-orange", text: "z = μ + σ ⊙ ε,  ε ~ N(0, I)" }, svg);
      LC.popIn(tl, [zDot, zLbl, rep], { duration: 0.4 });
      tl.addLabel("s2");

      // s3: decoder arrow + blurry reconstruction
      var lblRec = compact ? "reconstruction x̂" : "reconstruction x̂";
      S("rect", { x: fo.x, y: fo.y, width: fo.s, height: fo.s, rx: 8, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, svg).style.opacity = 0;
      var foRect = svg.lastChild;
      var recLbl = S("text", { x: fo.x + fo.s / 2, y: fo.y - 10, class: "t t-sm t-mid", text: lblRec }, svg);
      var newLbl = S("text", { x: fo.x + fo.s / 2, y: fo.y - 10, class: "t t-sm t-mid t-orange", text: "new sample" }, svg);
      newLbl.style.opacity = 0;
      var recShape = S("g", {}, svg);
      var rd = LC.g1shape(Z[0], Z[1], fo.x + fo.s / 2, fo.y + fo.s / 2, fo.s * 0.33);
      S("path", { d: rd, class: "f-blue", "fill-opacity": 0.35, stroke: "var(--a-blue)", "stroke-opacity": 0.3, "stroke-width": 9, "stroke-linejoin": "round" }, recShape);
      S("path", { d: rd, class: "f-blue", "fill-opacity": 0.55 }, recShape);
      var decA, decH, decL;
      if (compact) {
        var sx0 = pl.x + 20, sy0 = pl.y + pl.s + 70, ex = fo.x + fo.s + 10, ey = fo.y + fo.s / 2;
        decA = S("path", { d: "M" + sx0 + " " + sy0 + "Q" + sx0 + " " + ey + " " + ex + " " + ey, class: "s-ink", "stroke-width": 2 }, svg);
        decH = S("path", { d: "M" + (ex + 7) + " " + (ey - 6) + "L" + ex + " " + ey + "L" + (ex + 7) + " " + (ey + 6), class: "s-ink", "stroke-width": 2 }, svg);
        decL = S("text", { x: sx0 + 10, y: ey + 24, class: "t t-sm", text: "decoder" }, svg);
      } else {
        decA = S("path", { d: "M" + (pl.x + pl.s + 8) + " " + encY + "H" + (fo.x - 8), class: "s-ink", "stroke-width": 2 }, svg);
        decH = S("path", { d: "M" + (fo.x - 15) + " " + (encY - 6) + "L" + (fo.x - 8) + " " + encY + "L" + (fo.x - 15) + " " + (encY + 6), class: "s-ink", "stroke-width": 2 }, svg);
        decL = S("text", { x: (pl.x + pl.s + fo.x) / 2, y: encY - 10, class: "t t-sm t-mid", text: "decoder" }, svg);
      }
      LC.drawIn(tl, decA, { duration: 0.6 });
      LC.popIn(tl, [decH, decL, foRect, recLbl], { duration: 0.3 });
      LC.popIn(tl, recShape, { duration: 0.5 });
      tl.addLabel("s3");

      // s4: prior circles + loss text
      var prior = [1, 2].map(function (k) { return S("circle", { cx: px(0), cy: py(0), r: k * u, class: "f-none", stroke: "var(--a-ink)", "stroke-width": 1.2, "stroke-dasharray": "4 4", opacity: 0.7 }, svg); });
      var lossY = compact ? 404 : 318;
      var loss = compact
        ? [S("text", { x: 180, y: lossY, class: "t t-sm t-mid", text: "loss = reconstruction error" }, svg),
           S("text", { x: 180, y: lossY + 20, class: "t t-sm t-mid", text: "+ KL( ellipse ‖ dashed N(0, I) )" }, svg)]
        : [S("text", { x: 320, y: lossY, class: "t t-mid", text: "loss = reconstruction error (x vs x̂)  +  KL( q(z|x) ‖ N(0, I) )" }, svg)];
      LC.popIn(tl, prior.concat(loss), { duration: 0.5 });
      tl.addLabel("s4");

      // s5: many ellipses fill the prior
      var many = OTHERS.map(function (o) { return S("ellipse", { cx: px(o[0]), cy: py(o[1]), rx: o[2] * u * 2, ry: o[3] * u * 2, class: "f-blue", "fill-opacity": 0.16, stroke: "var(--a-blue)", "stroke-width": 1, "stroke-opacity": 0.6 }, svg); });
      tl.to(stats.concat([rep]), { opacity: 0, duration: 0.3 });
      LC.popIn(tl, many, { duration: 0.3, stagger: 0.08 });
      tl.addLabel("s5");

      // s6: sample from the prior and decode
      var nz = S("circle", { cx: px(NEWZ[0]), cy: py(NEWZ[1]), r: 6, class: "f-orange", stroke: "var(--a-ink)", "stroke-width": 1.5 }, svg);
      var nzL = S("text", { x: px(NEWZ[0]), y: py(NEWZ[1]) + 22, class: "t t-sm t-mid t-orange", text: "z ~ N(0, I)" }, svg);
      var newShape = S("path", { d: LC.g1shape(NEWZ[0], NEWZ[1], fo.x + fo.s / 2, fo.y + fo.s / 2, fo.s * 0.33), class: "f-orange", "fill-opacity": 0.8 }, svg);
      tl.to([zDot, zLbl, recShape, recLbl], { opacity: 0, duration: 0.3 });
      tl.to(many.concat([ell, muDot]), { opacity: 0.35, duration: 0.3 }, "<");
      LC.popIn(tl, [nz, nzL], { duration: 0.4 });
      LC.popIn(tl, [newShape, newLbl], { duration: 0.5 });
      tl.addLabel("s6");
      return tl;
    }
  };
})();
