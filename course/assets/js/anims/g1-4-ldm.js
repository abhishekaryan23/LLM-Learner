/* G1.4: the latent-diffusion pipeline (Rombach et al., 2022), Stable Diffusion style:
   512×512×3 pixels → VAE encoder (f = 8) → 64×64×4 latent → U-Net denoising loop with
   cross-attention to a text encoder and classifier-free guidance → VAE decoder. */
(function () {
  var LC = window.LC;

  LC.anims["g1-4-ldm"] = {
    title: "Latent diffusion: denoise a small latent, decode once",
    steps: [
      "Diffusing in <strong>pixel space</strong> is expensive: a 512×512 RGB image is $512 \\times 512 \\times 3 = 786{,}432$ numbers, and the denoiser runs on all of them at every step.",
      "A <strong>VAE encoder</strong>, trained once and then frozen, shrinks each side by 8: the image becomes a $64 \\times 64 \\times 4$ <strong>latent</strong>, $16{,}384$ numbers, <strong>48× fewer</strong>.",
      "Diffusion now happens entirely in the latent: start from a random $64 \\times 64 \\times 4$ latent and let the <strong>denoiser</strong> (a U-Net) clean it over a few dozen steps.",
      "The prompt goes through a frozen <strong>text encoder</strong> (CLIP in Stable Diffusion 1.x; T5 joined later). The denoiser reads its token vectors through <strong>cross-attention</strong>: queries from image features, keys and values from text.",
      "<strong>Classifier-free guidance</strong>: each step runs the denoiser twice, with the prompt and with an empty prompt, and extrapolates: $\\tilde\\varepsilon = \\varepsilon_u + w(\\varepsilon_c - \\varepsilon_u)$.",
      "Only at the very end does the <strong>VAE decoder</strong> turn the clean latent into a 512×512 image: one decode per picture, not one per step."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 528 } : { w: 640, h: 340 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact";
      var tl = gsap.timeline();

      function landscape(x, y, s, alt) {
        var g = S("g", {}, svg);
        S("rect", { x: x, y: y, width: s, height: s, rx: 8, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, g);
        S("circle", { cx: x + s * (alt ? 0.3 : 0.7), cy: y + s * 0.3, r: s * 0.11, class: "f-orange" }, g);
        S("path", { d: "M" + (x + 2) + " " + (y + s * 0.68) + "L" + (x + s * 0.3) + " " + (y + s * 0.38) + "L" + (x + s * 0.5) + " " + (y + s * 0.56) + "L" + (x + s * 0.68) + " " + (y + s * 0.42) + "L" + (x + s - 2) + " " + (y + s * 0.68) + "Z", class: "f-blue", "fill-opacity": 0.85 }, g);
        S("rect", { x: x + 2, y: y + s * 0.68, width: s - 4, height: s * 0.3, rx: 4, class: "f-blue", "fill-opacity": 0.3 }, g);
        return g;
      }
      function latent(x, y, s, seed) {
        var g = S("g", {}, svg), r = LC.g1.rng(seed), off = s * 0.09;
        for (var k = 3; k >= 1; k--) S("rect", { x: x + k * off, y: y - k * off, width: s, height: s, rx: 3, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.2 }, g);
        S("rect", { x: x, y: y, width: s, height: s, rx: 3, class: "f-surface", stroke: "var(--a-ink)", "stroke-width": 1.2 }, g);
        var n = 4, c = s / n, clean = S("g", {}, g), noisy = S("g", {}, g);
        for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) {
          var v = 0.2 + 0.6 * (j / (n - 1)) * (0.6 + 0.4 * Math.sin(i + j));
          S("rect", { x: x + i * c + 1, y: y + j * c + 1, width: c - 2, height: c - 2, class: "f-blue", "fill-opacity": v.toFixed(2) }, clean);
          S("rect", { x: x + i * c + 1, y: y + j * c + 1, width: c - 2, height: c - 2, class: "f-ink", "fill-opacity": (0.1 + 0.7 * r()).toFixed(2) }, noisy);
        }
        return { g: g, clean: clean, noisy: noisy };
      }
      function box(x, y, w, h, title, sub) {
        var g = S("g", {}, svg);
        S("rect", { x: x, y: y, width: w, height: h, rx: 10, class: "f-surface", stroke: "var(--a-ink)", "stroke-width": 1.5 }, g);
        S("text", { x: x + w / 2, y: y + (sub ? h / 2 - 2 : h / 2 + 5), class: "t t-sm t-mid", "font-weight": 650, text: title }, g);
        if (sub) S("text", { x: x + w / 2, y: y + h / 2 + 14, class: "t t-sm t-mid t-muted", text: sub }, g);
        return g;
      }
      function arrow(d, x2, y2, dir) {
        var g = S("g", {}, svg);
        var p = S("path", { d: d, class: "s-ink", "stroke-width": 2 }, g);
        var hd = dir === "down" ? "M" + (x2 - 6) + " " + (y2 - 8) + "L" + x2 + " " + y2 + "L" + (x2 + 6) + " " + (y2 - 8)
          : dir === "up" ? "M" + (x2 - 6) + " " + (y2 + 8) + "L" + x2 + " " + y2 + "L" + (x2 + 6) + " " + (y2 + 8)
          : dir === "left" ? "M" + (x2 + 8) + " " + (y2 - 6) + "L" + x2 + " " + y2 + "L" + (x2 + 8) + " " + (y2 + 6)
          : "M" + (x2 - 8) + " " + (y2 - 6) + "L" + x2 + " " + y2 + "L" + (x2 - 8) + " " + (y2 + 6);
        var h = S("path", { d: hd, class: "s-ink", "stroke-width": 2 }, g);
        return { p: p, h: h };
      }
      function txt(x, y, s, cls) { return S("text", { x: x, y: y, class: "t t-sm " + (cls || ""), text: s }, svg); }
      function show(els, pos) { return LC.popIn(tl, els, { duration: 0.4 }, pos); }
      function draw(a) { LC.drawIn(tl, a.p, { duration: 0.45 }); LC.popIn(tl, a.h, { duration: 0.15 }); }

      var L = {};
      if (compact) {
        L.img = landscape(20, 40, 108);
        L.imgT = [txt(146, 84, "512 × 512 × 3"), txt(146, 102, "786,432 numbers", "t-muted")];
        L.enc = arrow("M74 154V186", 74, 186, "down");
        L.encT = [txt(86, 176, "VAE encoder (÷8 per side)")];
        L.lat = latent(52, 206, 48, 3);
        L.latT = [txt(146, 222, "64 × 64 × 4"), txt(146, 240, "16,384 numbers: 48× fewer", "t-muted")];
        L.down = arrow("M74 258V286", 74, 286, "down");
        L.unet = box(16, 290, 190, 52, "U-Net denoiser", "~25–50 steps");
        L.loop = S("path", { d: "M206 300 C236 300 236 332 206 332", class: "s-orange", "stroke-width": 2 }, svg);
        L.loopH = S("path", { d: "M214 326 L206 332 L214 338", class: "s-orange", "stroke-width": 2 }, svg);
        L.prompt = txt(296, 266, "“a lake at sunset”", "t-mid t-orange");
        L.pArrow = arrow("M296 271V284", 296, 284, "down");
        L.tenc = box(246, 286, 100, 44, "text encoder");
        L.xat = arrow("M296 330V352H128V346", 128, 344, "up");
        L.xatT = [txt(214, 368, "cross-attention", "t-mid")];
        L.cfg = [txt(202, 396, "each step: guided ε = ε_u + w (ε_c − ε_u)", "t-mid t-mono")];
        L.dec = arrow("M44 342V426", 44, 426, "down");
        L.decT = [txt(56, 420, "VAE decoder")];
        L.out = landscape(20, 432, 88, true);
        L.outT = [txt(124, 470, "new 512 × 512 image")];
      } else {
        L.img = landscape(16, 52, 100);
        L.imgT = [txt(66, 172, "512 × 512 × 3", "t-mid"), txt(66, 190, "786,432 numbers", "t-mid t-muted")];
        L.enc = arrow("M122 102H156", 156, 102, "right");
        L.encT = [txt(139, 90, "VAE", "t-mid"), txt(139, 122, "encode", "t-mid t-muted")];
        L.lat = latent(170, 82, 44, 3);
        L.latT = [txt(208, 172, "64 × 64 × 4", "t-mid"), txt(208, 190, "48× fewer", "t-mid t-muted")];
        L.down = arrow("M232 102H266", 266, 102, "right");
        L.unet = box(270, 70, 146, 64, "U-Net denoiser", "~25–50 steps");
        L.loop = S("path", { d: "M318 70 C318 40 368 40 368 70", class: "s-orange", "stroke-width": 2 }, svg);
        L.loopH = S("path", { d: "M362 62 L368 70 L374 62", class: "s-orange", "stroke-width": 2 }, svg);
        L.prompt = txt(100, 290, "“a lake at sunset”", "t-mid t-orange");
        L.pArrow = arrow("M172 286H206", 206, 286, "right");
        L.tenc = box(210, 264, 120, 44, "text encoder");
        L.xat = arrow("M330 286H343V138", 343, 138, "up");
        L.xatT = [txt(351, 222, "cross-attention")];
        L.cfg = [txt(508, 240, "every step, two passes:", "t-mid"), txt(508, 260, "guided ε = ε_u + w (ε_c − ε_u)", "t-mid t-mono")];
        L.dec = arrow("M422 102H482", 482, 102, "right");
        L.decT = [txt(452, 90, "VAE", "t-mid"), txt(452, 122, "decode", "t-mid t-muted")];
        L.out = landscape(494, 52, 100, true);
        L.outT = [txt(544, 172, "new 512 × 512", "t-mid"), txt(544, 190, "image", "t-mid")];
      }
      // everything after the input image starts hidden
      tl.addLabel("s0", 0);
      draw(L.enc);
      show([L.lat.g].concat(L.encT, L.latT));
      L.lat.noisy.style.opacity = 0;
      tl.addLabel("s1");
      draw(L.down);
      show([L.unet, L.loop, L.loopH]);
      tl.to(L.lat.noisy, { opacity: 1, duration: 0.4 }, "<");
      tl.to(L.lat.clean, { opacity: 0.15, duration: 0.4 }, "<");
      tl.addLabel("s2");
      show([L.prompt]);
      draw(L.pArrow);
      show([L.tenc]);
      draw(L.xat);
      show(L.xatT);
      tl.addLabel("s3");
      show(L.cfg);
      tl.to(L.lat.noisy, { opacity: 0, duration: 0.8 });
      tl.to(L.lat.clean, { opacity: 1, duration: 0.8 }, "<");
      tl.addLabel("s4");
      draw(L.dec);
      show(L.decT);
      show([L.out].concat(L.outT));
      tl.addLabel("s5");
      return tl;
    }
  };
})();
