/* M3.7: a LoRA adapter on one d × d layer. Freeze W, add a rank-r bypass B·A (B = 0 at
   init), run the forward pass through both paths, count parameters, then merge.
   d = 4096, r = 8: W has 16,777,216 entries; A (r × d) + B (d × r) = 65,536 (0.39%). */
(function () {
  var LC = window.LC;
  var D = 4096, RK = 8;
  var FULL = D * D, LORA = 2 * D * RK;
  function commas(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }

  LC.anims["m3-7-lora"] = {
    title: "LoRA: freeze W, learn a thin bypass",
    steps: [
      "A pretrained layer computes $h = Wx$. With $d = 4096$, $W$ holds $4096^2 \\approx 16.8$M numbers, and full fine-tuning updates <strong>every one</strong> of them, with gradients and optimizer state for each.",
      "LoRA <strong>freezes</strong> $W$: no gradients, no optimizer state, and it can stay in low precision.",
      "Next to it, add two small matrices: $A$ squeezes $x$ from $d$ numbers down to $r = 8$, and $B$ expands them back to $d$. Their product $\\Delta W = BA$ is a $d \\times d$ update of <strong>rank at most $r$</strong>.",
      "<strong>Initialisation:</strong> $A$ is random and $B = 0$, so $BA = 0$. Training starts from <em>exactly</em> the pretrained model's behaviour.",
      "Forward pass: $h = Wx + \\frac{\\alpha}{r}\\,B(Ax)$. Both paths run; only $A$ and $B$ receive gradient updates. $\\alpha$ is a fixed scaling knob.",
      "Count: $W$ has 16,777,216 entries, while $A$ and $B$ together have $2 \\times 4096 \\times 8 = 65{,}536$. That's <strong>0.39%</strong> of the layer.",
      "After training you can <strong>merge</strong>: $W' = W + \\frac{\\alpha}{r}BA$ has the same shape as $W$, so inference costs nothing extra. Or keep adapters separate and swap them per task."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 424 } : { w: 640, h: 340 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      // diagram geometry (same in both layouts; the wide layout adds a side panel)
      var L = 26, Rr = 338, wx0 = 30, wx1 = 190, wy0 = 100, wy1 = 260;
      var ax = 280, aw = 120, rw = 22; // adapter column centre, full width, bottleneck width
      var hy = 56, xy = 286, vh = 18;

      // s0: x, W, h and the main path
      S("rect", { x: L, y: hy, width: Rr - L, height: vh, rx: 5, class: "f-surface2", stroke: "var(--line)", "stroke-width": 1.5 }, svg);
      S("text", { x: (L + Rr) / 2, y: hy - 8, class: "t t-sm t-mid", text: "output h  (d numbers)" }, svg);
      S("rect", { x: L, y: xy, width: Rr - L, height: vh, rx: 5, class: "f-surface2", stroke: "var(--line)", "stroke-width": 1.5 }, svg);
      S("text", { x: (L + Rr) / 2, y: xy + vh + 18, class: "t t-sm t-mid", text: "input x  (d = 4096 numbers)" }, svg);
      var wRect = S("rect", { x: wx0, y: wy0, width: wx1 - wx0, height: wy1 - wy0, rx: 8, class: "f-surface", stroke: "var(--a-blue)", "stroke-width": 2 }, svg);
      var wShade = S("rect", { x: wx0, y: wy0, width: wx1 - wx0, height: wy1 - wy0, rx: 8, class: "f-faint", "fill-opacity": 0.45 }, svg);
      wShade.style.opacity = 0;
      var wcx = (wx0 + wx1) / 2;
      var wLbl = [S("text", { x: wcx, y: 178, class: "t t-lg t-mid", text: "W" }, svg),
                  S("text", { x: wcx, y: 200, class: "t t-sm t-mid t-muted", text: "d × d, pretrained" }, svg)];
      function arrowUp(x, y0, y1, cls) {
        return S("path", { d: "M" + x + " " + y0 + "V" + y1 + "M" + (x - 5) + " " + (y1 + 6) + "L" + x + " " + y1 + "L" + (x + 5) + " " + (y1 + 6), class: cls, "stroke-width": 2 }, svg);
      }
      arrowUp(wcx, xy - 3, wy1 + 4, "s-ink");
      arrowUp(wcx, wy0 - 3, hy + vh + 4, "s-ink");
      tl.addLabel("s0", 0);

      // s1: freeze
      var lock = S("g", {}, svg);
      var lx = wx1 - 24, ly = wy0 + 12;
      S("path", { d: "M" + (lx + 3) + " " + (ly + 8) + "V" + (ly + 4) + "A5 5 0 0 1 " + (lx + 13) + " " + (ly + 4) + "V" + (ly + 8), class: "s-ink", "stroke-width": 2 }, lock);
      S("rect", { x: lx, y: ly + 8, width: 16, height: 12, rx: 2, class: "f-ink" }, lock);
      var frozen = S("text", { x: wx0 + 10, y: wy0 + 24, class: "t t-sm t-muted", text: "frozen" }, svg);
      LC.popIn(tl, [wShade, lock, frozen], { duration: 0.5 });
      tl.to(wRect, { attr: { stroke: "var(--a-faint)" }, duration: 0.4 }, "<");
      tl.addLabel("s1");

      // s2: the adapter: A (d -> r) below, B (r -> d) above, bottleneck between
      var ad = S("g", {}, svg);
      var aTop = 212, aBot = 260, bTop = 100, bBot = 148;
      var Apath = S("path", { d: "M" + (ax - aw / 2) + " " + aBot + "L" + (ax + aw / 2) + " " + aBot + "L" + (ax + rw / 2) + " " + aTop + "L" + (ax - rw / 2) + " " + aTop + "Z", class: "f-surface", stroke: "var(--a-orange)", "stroke-width": 2 }, ad);
      var Bpath = S("path", { d: "M" + (ax - rw / 2) + " " + bBot + "L" + (ax + rw / 2) + " " + bBot + "L" + (ax + aw / 2) + " " + bTop + "L" + (ax - aw / 2) + " " + bTop + "Z", class: "f-surface", stroke: "var(--a-orange)", "stroke-width": 2 }, ad);
      S("rect", { x: ax - rw / 2, y: bBot, width: rw, height: aTop - bBot, class: "f-surface2", stroke: "var(--a-orange)", "stroke-width": 1.5 }, ad);
      var aLbl = S("text", { x: ax, y: 248, class: "t t-mid t-orange", text: "A", "font-weight": 700 }, ad);
      var bLbl = S("text", { x: ax, y: 122, class: "t t-mid t-orange", text: "B", "font-weight": 700 }, ad);
      S("text", { x: ax + rw / 2 + 6, y: 184, class: "t t-sm", text: "r = 8" }, ad);
      S("text", { x: ax - rw / 2 - 6, y: 184, class: "t t-sm t-muted t-end", text: "ΔW = BA" }, ad);
      var a1 = arrowUp(ax, xy - 3, aBot + 4, "s-orange"), a2 = arrowUp(ax, bTop - 3, hy + vh + 4, "s-orange");
      LC.popIn(tl, [ad], { duration: 0.5 }, "+=0.02");
      LC.drawIn(tl, a1, { duration: 0.35 });
      LC.drawIn(tl, a2, { duration: 0.35 });
      tl.addLabel("s2");

      // info rows: below the diagram (compact) or in a side panel (wide)
      var ix = compact ? 180 : 368, anchor = compact ? " t-mid" : "";
      var rows = compact ? [346, 368, 390, 412] : [112, 146, 180, 214, 248, 290];
      var cls = "t" + (compact ? " t-sm" : "") + anchor;

      // s3: init
      var b0 = S("text", { x: ax, y: 122, class: "t t-mid t-orange", text: "B = 0", "font-weight": 700 }, svg);
      var aR = S("text", { x: ax, y: 248, class: "t t-sm t-mid t-orange", text: "A random", "font-weight": 600 }, svg);
      var init = S("text", { x: ix, y: rows[0], class: cls, text: "start: B = 0, so BA = 0 (no change yet)" }, svg);
      tl.to([bLbl, aLbl], { opacity: 0, duration: 0.25 });
      LC.popIn(tl, [b0, aR, init], { duration: 0.4 });
      tl.addLabel("s3");

      // s4: forward pass pulses through both paths
      var form = S("text", { x: ix, y: rows[1], class: cls + " t-mono", text: "h = Wx + (α/r)·B(Ax)" }, svg);
      var pulses = [wcx, ax].map(function (x, k) {
        var c = S("circle", { cx: x, cy: xy, r: 6, class: k ? "f-orange" : "f-blue" }, svg);
        c.style.opacity = 0;
        return c;
      });
      tl.to(b0, { opacity: 0, duration: 0.2 });
      tl.set(pulses, { opacity: 1 });
      tl.to(pulses, { attr: { cy: hy + vh / 2 }, duration: 1.2, ease: "power1.inOut" });
      tl.to(pulses, { opacity: 0, duration: 0.2 });
      var bLbl2 = S("text", { x: ax, y: 122, class: "t t-mid t-orange", text: "B", "font-weight": 700 }, svg);
      LC.popIn(tl, [bLbl2], { duration: 0.2 }, "<");
      LC.popIn(tl, [form], { duration: 0.4 }, "<");
      tl.addLabel("s4");

      // s5: parameter count
      var counts = compact
        ? [S("text", { x: ix, y: rows[2], class: cls, text: "W: " + commas(FULL) + "  ·  A+B: " + commas(LORA) }, svg),
           S("text", { x: ix, y: rows[3], class: cls + " t-orange", text: "trainable: " + (100 * LORA / FULL).toFixed(2) + "% of the layer", "font-weight": 600 }, svg)]
        : [S("text", { x: ix, y: rows[2], class: cls, text: "W:  " + commas(FULL) + " numbers" }, svg),
           S("text", { x: ix, y: rows[3], class: cls, text: "A + B:  " + commas(LORA) + " numbers" }, svg),
           S("text", { x: ix, y: rows[4], class: cls + " t-orange", text: "trainable: " + (100 * LORA / FULL).toFixed(2) + "% of the layer", "font-weight": 600 }, svg)];
      LC.popIn(tl, counts, { duration: 0.35, stagger: 0.15 });
      tl.addLabel("s5");

      // s6: merge
      var merged = [S("text", { x: wcx, y: 178, class: "t t-mid", text: "W′ = W + (α/r)·BA", "font-weight": 650 }, svg),
                    S("text", { x: wcx, y: 200, class: "t t-sm t-mid t-muted", text: "still d × d" }, svg)];
      tl.to([a1, a2, aR, bLbl2, lock, frozen, wShade].concat(wLbl), { opacity: 0, duration: 0.4 });
      tl.to(ad, { opacity: 0.15, duration: 0.4 }, "<");
      tl.to(wRect, { attr: { stroke: "var(--a-orange)", "stroke-width": 3 }, duration: 0.4 }, "<");
      if (!compact) merged.push(S("text", { x: ix, y: rows[5], class: cls, text: "merged: one matrix, no extra latency", "font-weight": 600 }, svg));
      LC.popIn(tl, merged, { duration: 0.4 });
      tl.addLabel("s6");
      return tl;
    }
  };
})();
