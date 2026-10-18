/* VD.3: an action-conditioned world model as a game engine.
   Loop: last 3 frames + action → predicted next frame → slide the window → repeat.
   Then: compounding error when the model reads its own outputs, and planning by
   imagining the result of each candidate action. Toy platform scene: an orange
   player, a blue coin up in the air, a ground strip. */
(function () {
  var LC = window.LC;
  // world states: player x (0..1 of frame width), jump height (0..1 of frame height), coin visible, ghost x
  var ST = {
    S0: { px: 0.12, py: 0, coin: true }, S1: { px: 0.22, py: 0, coin: true }, S2: { px: 0.32, py: 0, coin: true },
    S3: { px: 0.42, py: 0, coin: true }, S4: { px: 0.5, py: 0.3, coin: true },
    BAD: { px: 0.6, py: 0.12, coin: false, ghost: 0.5 },
    L: { px: 0.4, py: 0.1, coin: true }, R: { px: 0.6, py: 0.08, coin: true }, U: { px: 0.66, py: 0.42, coin: true, got: true }
  };
  var PHASES = [
    { ctx: ["S0", "S1", "S2"], act: "?", next: null },
    { ctx: ["S0", "S1", "S2"], act: "→", next: null },
    { ctx: ["S0", "S1", "S2"], act: "→", next: "S3" },
    { ctx: ["S1", "S2", "S3"], act: "↑", next: "S4" },
    { ctx: ["S2", "S3", "S4"], act: "→", next: "BAD" }
  ];

  LC.anims["vd-3-world-loop"] = {
    title: "A world model: frames + action → next frame",
    steps: [
      "A <strong>world model</strong> keeps a short memory of recent frames (here the last 3) from a simple platform game. Its job: predict what you would see next.",
      "The player, or an agent, picks an <strong>action</strong>: → (move right). The action is an extra input, like a one-frame prompt.",
      "The model predicts the <strong>next frame</strong> from the frames plus the action. GameNGen (2024) did this for DOOM with a diffusion model, at 20 frames per second.",
      "The new frame joins the context and the oldest drops out: a <strong>sliding window</strong>. Next action ↑ (jump), next prediction. Repeat, and you are playing a game that exists only inside a neural network.",
      "The catch: the model now reads <strong>its own outputs</strong>. A small error (a ghost of the player, a vanished coin) gets copied forward and can snowball. Training on noisy or self-generated context fights this drift.",
      "Because it can imagine, an agent can <strong>plan</strong>: try each action inside the model, compare the imagined futures, and pick the best (here ↑ reaches the coin). That is why agent and robotics research wants world models."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 338 } : { w: 640, h: 366 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact", W = ctx.w;
      var L = compact
        ? { fw: 76, fh: 54, gap: 8, lblY: 32, fy: 40, model: [100, 128, 160, 46], chip: [16, 134, 64, 34], chipLblY: 126, infoY: 204, planLblY: 236, planY: 246 }
        : { fw: 120, fh: 72, gap: 12, lblY: 22, fy: 32, model: [200, 140, 240, 52], chip: [62, 146, 88, 40], chipLblY: 138, infoY: 222, planLblY: 252, planY: 262 };
      var x0 = (W - (4 * L.fw + 3 * L.gap)) / 2;
      function slotX(i) { return x0 + i * (L.fw + L.gap); }
      var tl = gsap.timeline();

      function scene(g, x, y, st) {
        while (g.firstChild) g.removeChild(g.firstChild);
        if (!st) {
          S("rect", { x: x, y: y, width: L.fw, height: L.fh, rx: 4, class: "f-none", stroke: "var(--a-faint)", "stroke-width": 1.5, "stroke-dasharray": "4 3" }, g);
          S("text", { x: x + L.fw / 2, y: y + L.fh / 2 + 6, class: "t t-lg t-mid t-muted", text: "?" }, g);
          return;
        }
        var gh = L.fh * 0.18, gy = y + L.fh - gh, sz = L.fh * 0.2;
        S("rect", { x: x, y: y, width: L.fw, height: L.fh, rx: 4, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, g);
        S("rect", { x: x + 0.75, y: gy, width: L.fw - 1.5, height: gh - 0.75, class: "f-faint" }, g);
        if (st.coin && !st.got) S("circle", { cx: x + L.fw * 0.78, cy: y + L.fh * 0.3, r: L.fh * 0.08, class: "f-blue" }, g);
        if (st.ghost != null) S("rect", { x: x + L.fw * st.ghost - sz / 2, y: gy - sz, width: sz, height: sz, rx: 2, class: "f-orange", "fill-opacity": 0.35 }, g);
        S("rect", { x: x + L.fw * st.px - sz / 2, y: gy - sz - st.py * L.fh, width: sz, height: sz, rx: 2, class: "f-orange" }, g);
        if (st.got) S("circle", { cx: x + L.fw * 0.78, cy: y + L.fh * 0.3, r: L.fh * 0.13, class: "f-none", stroke: "var(--a-blue)", "stroke-width": 2, "stroke-dasharray": "3 3" }, g);
      }

      // ---- static frame of the loop ----
      S("text", { x: slotX(0), y: L.lblY, class: "t t-sm t-muted", text: compact ? "context: last 3 frames" : "context: the last 3 frames" }, svg);
      S("text", { x: slotX(3), y: L.lblY, class: "t t-sm t-muted", text: "next" }, svg);
      var ctxG = [0, 1, 2].map(function () { return S("g", {}, svg); });
      var nextG = S("g", {}, svg);
      var m = L.model;
      S("rect", { x: m[0], y: m[1], width: m[2], height: m[3], rx: 10, class: "f-surface2", stroke: "var(--a-blue)", "stroke-width": 2 }, svg);
      S("text", { x: m[0] + m[2] / 2, y: m[1] + 20, class: "t t-mid", text: "world model", "font-weight": 600 }, svg);
      S("text", { x: m[0] + m[2] / 2, y: m[1] + 38, class: "t t-sm t-mid t-muted", text: "frames + action → frame" }, svg);
      // context → model arrow
      var cxm = slotX(1) + L.fw / 2, fyb = L.fy + L.fh;
      S("path", { d: "M" + cxm + " " + (fyb + 6) + "V" + (m[1] - 4) + "M" + (cxm - 5) + " " + (m[1] - 10) + "L" + cxm + " " + (m[1] - 4) + "L" + (cxm + 5) + " " + (m[1] - 10), class: "s-ink", "stroke-width": 1.8 }, svg);
      // action chip
      var c = L.chip;
      S("text", { x: c[0], y: L.chipLblY, class: "t t-sm t-muted", text: "action" }, svg);
      var chipBox = S("rect", { x: c[0], y: c[1], width: c[2], height: c[3], rx: c[3] / 2, class: "f-surface", stroke: "var(--a-orange)", "stroke-width": 2 }, svg);
      var chipTxt = S("text", { x: c[0] + c[2] / 2, y: c[1] + c[3] / 2 + 6, class: "t t-lg t-mid t-orange", text: "?" }, svg);
      var chipArrow = S("path", { d: "M" + (c[0] + c[2] + 4) + " " + (c[1] + c[3] / 2) + "H" + (m[0] - 4) + "M" + (m[0] - 10) + " " + (c[1] + c[3] / 2 - 5) + "L" + (m[0] - 4) + " " + (c[1] + c[3] / 2) + "L" + (m[0] - 10) + " " + (c[1] + c[3] / 2 + 5), class: "s-orange", "stroke-width": 2 }, svg);
      // model → next frame arrow
      var nx = slotX(3) + L.fw / 2, my = m[1] + m[3] / 2;
      var outArrow = S("path", { d: "M" + (m[0] + m[2] + 4) + " " + my + "H" + nx + "V" + (fyb + 6) + "M" + (nx - 5) + " " + (fyb + 12) + "L" + nx + " " + (fyb + 6) + "L" + (nx + 5) + " " + (fyb + 12), class: "s-blue", "stroke-width": 2 }, svg);
      var errRing = S("circle", { cx: slotX(3) + L.fw * 0.5, cy: L.fy + L.fh * 0.62, r: L.fh * 0.3, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 2, "stroke-dasharray": "4 3" }, svg);
      var info = S("text", { x: W / 2, y: L.infoY, class: "t t-sm t-mid", text: "" }, svg);
      var INFO = compact
        ? ["the model has seen 3 frames", "action → is an extra input", "predicted the next frame", "slide the window, act again: ↑", "errors feed back in and compound", "plan: imagine, then choose"]
        : ["the model has seen 3 frames so far", "the action → is an extra input", "it predicts the next frame", "slide the window, then act again: ↑ (jump)", "its own errors feed back in and compound", "planning: imagine each action, then choose"];

      var st = { k: 0 };
      function render() {
        var k = Math.min(PHASES.length - 1, Math.floor(st.k + 1e-6)), ph = PHASES[k];
        ph.ctx.forEach(function (name, i) { scene(ctxG[i], slotX(i), L.fy, ST[name]); });
        scene(nextG, slotX(3), L.fy, ph.next ? ST[ph.next] : null);
        chipTxt.textContent = ph.act;
        errRing.style.opacity = k >= 4 ? 1 : 0;
        info.textContent = INFO[Math.min(INFO.length - 1, Math.floor(st.k + 1e-6))];
      }
      render();
      tl.addLabel("s0", 0);

      function phase(n) { tl.to(st, { k: n, duration: 0.05, ease: "none", onUpdate: render }); }

      // s1: action
      phase(1);
      LC.drawIn(tl, chipArrow, { duration: 0.5 });
      tl.to(chipBox, { attr: { "stroke-width": 3.5 }, duration: 0.25, yoyo: true, repeat: 1 });
      tl.addLabel("s1");

      // s2: prediction
      LC.drawIn(tl, outArrow, { duration: 0.6 });
      phase(2);
      tl.addLabel("s2");

      // s3: slide + next prediction
      tl.to(ctxG.concat([nextG]), { opacity: 0.2, duration: 0.25 });
      phase(3);
      tl.to(ctxG.concat([nextG]), { opacity: 1, duration: 0.35 });
      tl.addLabel("s3");

      // s4: compounding error
      tl.to(ctxG.concat([nextG]), { opacity: 0.2, duration: 0.25 });
      phase(4);
      tl.to(ctxG.concat([nextG]), { opacity: 1, duration: 0.35 });
      tl.addLabel("s4");

      // s5: planning by imagination
      var planLbl = S("text", { x: W / 2, y: L.planLblY, class: "t t-sm t-mid", text: compact ? "imagine 3 actions from the last frame" : "imagine 3 different actions from the last real frame", "font-weight": 600 }, svg);
      var opts = [["L", "←"], ["R", "→"], ["U", "↑ jump ✓"]];
      var pw = 3 * L.fw + 2 * (compact ? 24 : 40), px0 = (W - pw) / 2;
      var planEls = [planLbl];
      opts.forEach(function (o, i) {
        var g = S("g", {}, svg), x = px0 + i * (L.fw + (compact ? 24 : 40));
        scene(g, x, L.planY, ST[o[0]]);
        if (o[0] === "U") S("rect", { x: x - 3, y: L.planY - 3, width: L.fw + 6, height: L.fh + 6, rx: 6, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 2.5 }, g);
        S("text", { x: x + L.fw / 2, y: L.planY + L.fh + 18, class: "t t-sm t-mid" + (o[0] === "U" ? " t-orange" : " t-muted"), text: o[1], "font-weight": o[0] === "U" ? 650 : 400 }, g);
        planEls.push(g);
      });
      phase(5);
      LC.popIn(tl, planEls, { duration: 0.35, stagger: 0.15 });
      tl.addLabel("s5");
      return tl;
    }
  };
})();
