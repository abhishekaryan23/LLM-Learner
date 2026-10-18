/* M0.2: the six-stage loop every lesson follows. */
(function () {
  var LC = window.LC;
  var NODES = [
    { label: "Guess", sci: "Pre-testing" },
    { label: "Learn", sci: "Dual coding" },
    { label: "Explain", sci: "Elaboration" },
    { label: "Quiz", sci: "Retrieval practice" },
    { label: "Lock in", sci: "Spacing (scheduled)" },
    { label: "Review", sci: "Spacing + interleaving" }
  ];

  LC.anims["learning-loop"] = {
    title: "The learning loop inside every lesson",
    steps: [
      "Every lesson runs the same <strong>six-stage loop</strong>. Each stage is there because research shows it improves long-term memory.",
      "<strong>Guess.</strong> Two warm-up questions <em>before</em> you learn. Wrong guesses still help: they tell your brain what to look for.",
      "<strong>Learn.</strong> Short sections pairing an animation you control with a few words. Pictures plus words beat words alone.",
      "<strong>Explain.</strong> Write the idea in your own words, then compare with a model answer. Connecting ideas is what makes them stick.",
      "<strong>Quiz.</strong> Answer from memory and rate your confidence. You'll learn where \"I'm sure\" can be trusted.",
      "<strong>Lock in.</strong> One tap adds the lesson's flashcards to your deck and schedules the first review.",
      "<strong>Review.</strong> A few minutes a day on cards from <em>all</em> lessons, mixed together, at growing gaps. Then on to the next lesson."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 380 } : { w: 640, h: 380 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, H = ctx.h, compact = ctx.layout === "compact";
      var cx = W / 2, cy = H / 2 + 4, R = compact ? 128 : 140;
      var bw = compact ? 92 : 112, bh = 40;
      var tl = gsap.timeline();
      var pts = NODES.map(function (n, i) {
        var a = -Math.PI / 2 + (i / NODES.length) * Math.PI * 2;
        return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
      });

      // faint ring
      S("circle", { cx: cx, cy: cy, r: R, class: "s-faint", "stroke-dasharray": "3 7" }, svg);

      // arcs between nodes (drawn as the loop advances)
      var arcs = pts.map(function (p, i) {
        var q = pts[(i + 1) % pts.length];
        var a0 = Math.atan2(p.y - cy, p.x - cx) + 0.32, a1 = Math.atan2(q.y - cy, q.x - cx) - 0.32;
        if (a1 < a0) a1 += Math.PI * 2;
        var d = "M" + (cx + R * Math.cos(a0)) + " " + (cy + R * Math.sin(a0)) + "A" + R + " " + R + " 0 0 1 " + (cx + R * Math.cos(a1)) + " " + (cy + R * Math.sin(a1));
        return S("path", { d: d, class: "s-orange" }, svg);
      });
      // arrow heads
      var heads = pts.map(function (p, i) {
        var q = pts[(i + 1) % pts.length];
        var a1 = Math.atan2(q.y - cy, q.x - cx) - 0.32;
        var x = cx + R * Math.cos(a1), y = cy + R * Math.sin(a1), t = a1 + Math.PI / 2;
        var d = "M" + (x - 9 * Math.cos(t) + 6 * Math.cos(t + Math.PI / 2)) + " " + (y - 9 * Math.sin(t) + 6 * Math.sin(t + Math.PI / 2)) +
                "L" + x + " " + y + "L" + (x - 9 * Math.cos(t) - 6 * Math.cos(t + Math.PI / 2)) + " " + (y - 9 * Math.sin(t) - 6 * Math.sin(t + Math.PI / 2));
        var h = S("path", { d: d, class: "s-orange" }, svg); h.style.opacity = 0; return h;
      });

      // nodes
      var boxes = pts.map(function (p, i) {
        var g = S("g", {}, svg);
        var r = S("rect", { x: p.x - bw / 2, y: p.y - bh / 2, width: bw, height: bh, rx: 12, class: "f-surface", stroke: "var(--a-faint)", "stroke-width": 2 }, g);
        var t = S("text", { x: p.x, y: p.y + 5, class: "t t-mid", text: NODES[i].label, "font-weight": 600 }, g);
        S("text", { x: p.x - bw / 2 + 8, y: p.y - bh / 2 - 6, class: "t t-sm t-muted", text: i + 1 }, g);
        return { g: g, r: r, t: t };
      });

      // centre label: science name for the current stage
      var centre = NODES.map(function (n) {
        var t = S("text", { x: cx, y: cy + 6, class: "t t-mid t-orange", "font-size": compact ? 15 : 17, "font-weight": 600, text: n.sci }, svg);
        t.style.opacity = 0; return t;
      });
      var intro = S("text", { x: cx, y: cy + 6, class: "t t-mid t-muted", text: "one lesson" }, svg);
      arcs.forEach(function (a) { var len = a.getTotalLength(); a.style.strokeDasharray = len + " " + len; a.style.strokeDashoffset = len; a.style.opacity = 0; });

      tl.addLabel("s0", 0);
      NODES.forEach(function (n, i) {
        var prev = i ? centre[i - 1] : intro;
        tl.to(prev, { opacity: 0, duration: 0.25 });
        if (i) {
          tl.set(arcs[i - 1].style, { opacity: 1 });
          tl.to(arcs[i - 1].style, { strokeDashoffset: 0, duration: 0.6, ease: "power1.inOut" });
          tl.to(heads[i - 1], { opacity: 1, duration: 0.15 });
          tl.set(boxes[i - 1].r, { attr: { stroke: "var(--a-blue)", "stroke-width": 2 } }, "<");
        }
        tl.set(boxes[i].r, { attr: { stroke: "var(--a-orange)", "stroke-width": 3 } });
        tl.fromTo(boxes[i].g, { scale: 1 }, { scale: 1.08, svgOrigin: pts[i].x + " " + pts[i].y, duration: 0.2, yoyo: true, repeat: 1 }, "<");
        tl.to(centre[i], { opacity: 1, duration: 0.3 });
        if (i === NODES.length - 1) {
          tl.set(arcs[i].style, { opacity: 1 });
          tl.to(arcs[i].style, { strokeDashoffset: 0, duration: 0.6, ease: "power1.inOut" });
          tl.to(heads[i], { opacity: 1, duration: 0.15 });
        }
        tl.addLabel("s" + (i + 1));
      });
      return tl;
    }
  };
})();
