/* M0.3: one flashcard's journey up the spacing ladder. Mirrors LC.srs in learn.js. */
(function () {
  var LC = window.LC;
  var RUNGS = ["4h", "1d", "3d", "7d", "16d", "35d", "90d"];
  // [rung index the card moves to, grade badge]
  var MOVES = [[1, null], [2, "Good"], [3, "Good"], [5, "Easy"], [0, "Again"], [1, "Good"]];

  LC.anims["review-ladder"] = {
    title: "One card's journey through your review deck",
    steps: [
      "You finish a lesson and tap <strong>Lock it in</strong>. The card's first review is due <strong>tomorrow</strong>.",
      "Next day you recall it and tap <strong>Good</strong>. It climbs one rung: back in <strong>3 days</strong>.",
      "Good again. Now it waits <strong>a week</strong>. Each success buys a longer gap.",
      "This time it was effortless, so you tap <strong>Easy</strong>. It skips a rung: see you in about <strong>5 weeks</strong>.",
      "Weeks later… blank. You tap <strong>Again</strong>. The card drops to the bottom rung and comes back <strong>in about 10 minutes</strong>, later in the same session. Forgetting is part of the process, not a failure.",
      "You get it right, and it starts climbing again: next review in <strong>1 day</strong>. Over time, cards you know well rarely appear, and your daily review stays <strong>short</strong>."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 330 } : { w: 640, h: 230 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, H = ctx.h, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      var n = RUNGS.length, pos;
      if (compact) {
        // a staircase rising to the right, two rows high so labels have room
        var x0 = 34, x1 = W - 30, yb = H - 60, yt = 78;
        pos = RUNGS.map(function (_, i) { return { x: x0 + (i / (n - 1)) * (x1 - x0), y: yb - (i / (n - 1)) * (yb - yt) }; });
      } else {
        var xa = 50, xb = W - 50, yb2 = H - 50, yt2 = 70;
        pos = RUNGS.map(function (_, i) { return { x: xa + (i / (n - 1)) * (xb - xa), y: yb2 - (i / (n - 1)) * (yb2 - yt2) }; });
      }
      pos.forEach(function (p, i) {
        S("line", { x1: p.x - 22, x2: p.x + 22, y1: p.y + 16, y2: p.y + 16, class: "s-ink" }, svg);
        S("text", { x: p.x, y: p.y + 36, class: "t t-sm t-muted t-mid t-mono", text: RUNGS[i] }, svg);
      });
      S("text", { x: compact ? 12 : 20, y: 22, class: "t t-sm t-muted", text: "next review in…" }, svg);
      S("text", { x: W - 12, y: H - 8, class: "t t-sm t-muted t-end", text: "longer gaps →" }, svg);

      // the card
      var card = S("g", {}, svg);
      S("rect", { x: -18, y: -14, width: 36, height: 26, rx: 5, class: "f-orange" }, card);
      S("path", { d: "M-10 -5H10M-10 2H4", stroke: "var(--a-paper)", "stroke-width": 2.5, "stroke-linecap": "round" }, card);
      gsap.set(card, { x: pos[1].x, y: pos[1].y - 2 });

      function makeBadge(grade) {
        var b = S("g", {}, svg);
        S("rect", { x: -34, y: -15, width: 68, height: 26, rx: 13, class: grade === "Again" ? "f-orange" : "f-ink" }, b);
        S("text", { x: 0, y: 3, class: "t t-sm t-mid t-nohalo", style: "fill:var(--a-paper)", "font-weight": 600, text: grade }, b);
        b.style.opacity = 0;
        return b;
      }

      tl.addLabel("s0", 0);
      var cur = 1, prevBadge = null, by = compact ? 38 : 34;   // badge height above its rung (compact: clear of the next rung up)
      MOVES.slice(1).forEach(function (mv, k) {
        if (prevBadge) tl.to(prevBadge, { opacity: 0, duration: 0.2 });
        var to = mv[0], from = pos[cur], dest = pos[to];
        var badge = makeBadge(mv[1]);
        var bx = Math.min(Math.max(from.x, 40), W - 40);
        tl.fromTo(badge, { opacity: 0, x: bx, y: from.y - by - 6 }, { opacity: 1, y: from.y - by, duration: 0.3, immediateRender: false });
        var midY = Math.min(from.y, dest.y) - 50;
        tl.to(card, { keyframes: [{ x: (from.x + dest.x) / 2, y: midY, duration: 0.45, ease: "power1.out" }, { x: dest.x, y: dest.y - 2, duration: 0.45, ease: "power1.in" }] });
        // the grade stays pinned above the card's new rung until the next step
        tl.to(badge, { x: Math.min(Math.max(dest.x, 40), W - 40), y: dest.y - by, duration: 0.9, ease: "power1.inOut" }, "<");
        tl.addLabel("s" + (k + 1));
        prevBadge = badge;
        cur = to;
      });
      return tl;
    }
  };
})();
