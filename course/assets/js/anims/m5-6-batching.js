/* Compact layout keeps the top-right corner free for the stepper's swipe hint.
   M5.6: static vs continuous (iteration-level, Orca-style) batching on 4 slots.
   Eight requests need 3, 8, 4, 6, 5, 2, 6, 3 output tokens (decode steps).
   Static: batches of 4 run until their longest member finishes → 14 steps, 37/56 = 66% busy.
   Continuous: a finished request's slot is refilled at the next step → 12 steps, 37/48 = 77% busy
   (the only idle slots are at the end, when the queue is empty). */
(function () {
  var LC = window.LC;
  var LEN = [3, 8, 4, 6, 5, 2, 6, 3];
  var COL = ["f-blue", "f-orange", "f-ink", "f-orange", "f-ink", "f-blue", "f-orange", "f-blue"];
  // [request, slot, start step]
  var STATIC = [[0, 0, 0], [1, 1, 0], [2, 2, 0], [3, 3, 0], [4, 0, 8], [5, 1, 8], [6, 2, 8], [7, 3, 8]];
  var CONT = [[0, 0, 0], [1, 1, 0], [2, 2, 0], [3, 3, 0], [4, 0, 3], [5, 2, 4], [6, 2, 6], [7, 3, 6]];
  var STEPS = 14;

  LC.anims["m5-6-batching"] = {
    title: "Static vs continuous batching",
    steps: [
      "A GPU decodes <strong>4 requests at a time</strong> (4 slots). Eight requests arrive needing 3, 8, 4, 6, 5, 2, 6 and 3 output tokens. Each column is one decode step.",
      "<strong>Static batching:</strong> R1–R4 start together and generate one token per step each.",
      "R1, R3 and R4 finish early, but the batch only ends when R2 does. Their slots sit <strong>idle</strong> (grey) while R5–R8 wait in the queue.",
      "Then R5–R8 run as the next batch. All 8 requests take <strong>14 steps</strong>, and the slots are busy only 37 of 56 slot-steps (66%).",
      "<strong>Continuous batching</strong> (Orca, Yu et al., 2022) schedules <strong>every step</strong>: when a request finishes, the next one from the queue takes its slot right away.",
      "All 8 finish in <strong>12 steps</strong> (77% busy), and the idle slots only appear at the end, when the queue is empty. With a steady stream of users there are hardly any.",
      "Each newcomer (circled) needs its prompt processed, a <strong>prefill</strong>, in the step it joins. <strong>Chunked prefill</strong> splits long prompts into pieces so that the others' tokens keep flowing."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 308 } : { w: 640, h: 344 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var gx = compact ? 30 : 74, cw = compact ? 23 : 38, ch = compact ? 20 : 24, pitch = compact ? 23 : 28;
      var g1 = compact ? 44 : 32, g2 = compact ? 172 : 186, t1 = g1 - 10, t2 = g2 - 10;
      var right = gx + STEPS * cw;
      var tl = gsap.timeline();
      function cx(step) { return gx + step * cw; }
      function cy(top, slot) { return top + slot * pitch; }
      function grid(top, parent) {
        for (var s = 0; s < 4; s++) {
          S("text", { x: gx - 8, y: cy(top, s) + ch / 2 + 4, class: "t t-sm t-muted t-end", text: compact ? String(s + 1) : "slot " + (s + 1) }, parent);
          for (var t = 0; t < STEPS; t++) S("rect", { x: cx(t) + 1, y: cy(top, s), width: cw - 2, height: ch, rx: 3, class: "f-surface2" }, parent);
        }
      }
      function cells(top, sched) {
        var byCol = [];
        sched.forEach(function (r) {
          for (var k = 0; k < LEN[r[0]]; k++) {
            var t = r[2] + k, g = S("g", {}, svg);
            S("rect", { x: cx(t) + 1, y: cy(top, r[1]), width: cw - 2, height: ch, rx: 3, class: COL[r[0]], "fill-opacity": 0.9 }, g);
            if (k === 0) S("text", { x: cx(t) + cw / 2, y: cy(top, r[1]) + ch / 2 + 4, class: "t t-sm t-mid t-nohalo", style: "fill: var(--a-paper)", "font-weight": 650, text: "R" + (r[0] + 1) }, g);
            g.style.opacity = 0;
            (byCol[t] = byCol[t] || []).push(g);
          }
        });
        return byCol;
      }
      function idle(top, list) {
        return list.map(function (p) {
          var r = S("rect", { x: cx(p[1]) + 1, y: cy(top, p[0]), width: cw - 2, height: ch, rx: 3, class: "f-faint", "fill-opacity": 0.9 }, svg);
          r.style.opacity = 0; return r;
        });
      }
      function fillCols(byCol, from, to, dur) {
        for (var t = from; t < to; t++) if (byCol[t]) tl.to(byCol[t], { opacity: 1, duration: dur }, t === from ? "+=0.05" : ">-0.02");
      }

      // ---- s0: static grid ----
      S("text", { x: gx - (compact ? 24 : 70), y: t1, class: "t t-sm", "font-weight": 650, text: "static batching" }, svg);
      grid(g1, svg);
      var ticks = S("g", {}, svg);
      [0, 4, 8, 12].forEach(function (t) { S("text", { x: cx(t) + cw / 2, y: g2 + 3 * pitch + ch + 16, class: "t t-sm t-muted t-mid", text: t + 1 }, ticks); });
      S("text", { x: right, y: g2 + 3 * pitch + ch + (compact ? 36 : 38), class: "t t-sm t-muted t-end", text: "decode step →" }, svg);
      tl.addLabel("s0", 0);

      // ---- s1: batch 1 runs ----
      var sCells = cells(g1, STATIC);
      fillCols(sCells, 0, 8, 0.12);
      tl.addLabel("s1");

      // ---- s2: idle slots in batch 1 ----
      var idle1 = idle(g1, [[0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [2, 4], [2, 5], [2, 6], [2, 7], [3, 6], [3, 7]]);
      LC.popIn(tl, idle1, { duration: 0.25, stagger: 0.03 });
      tl.addLabel("s2");

      // ---- s3: batch 2 ----
      fillCols(sCells, 8, 14, 0.12);
      var idle2 = idle(g1, [[0, 13], [1, 10], [1, 11], [1, 12], [1, 13], [3, 11], [3, 12], [3, 13]]);
      LC.popIn(tl, idle2, { duration: 0.25, stagger: 0.03 });
      var res1 = S("text", { x: right, y: t1, class: "t t-sm t-end t-orange", "font-weight": 600, text: compact ? "14 steps · 66% busy" : "done in 14 steps · 66% busy" }, svg);
      LC.popIn(tl, res1, { duration: 0.3 });
      tl.addLabel("s3");

      // ---- s4: continuous ----
      var g2grp = S("g", {}, svg);
      S("text", { x: gx - (compact ? 24 : 70), y: t2, class: "t t-sm", "font-weight": 650, text: compact ? "continuous batching" : "continuous batching (Orca)" }, g2grp);
      grid(g2, g2grp);
      g2grp.style.opacity = 0;
      tl.to(g2grp, { opacity: 1, duration: 0.4 });
      var cCells = cells(g2, CONT);
      fillCols(cCells, 0, 12, 0.12);
      tl.addLabel("s4");

      // ---- s5: result ----
      var idle3 = idle(g2, [[0, 8], [0, 9], [0, 10], [0, 11], [1, 8], [1, 9], [1, 10], [1, 11], [3, 9], [3, 10], [3, 11]]);
      LC.popIn(tl, idle3, { duration: 0.25, stagger: 0.03 });
      var res2 = S("text", { x: right, y: t2, class: "t t-sm t-end t-blue", "font-weight": 600, text: compact ? "12 steps · 77% busy" : "done in 12 steps · 77% busy" }, svg);
      LC.popIn(tl, res2, { duration: 0.3 });
      tl.addLabel("s5");

      // ---- s6: joins = prefills ----
      var rings = CONT.slice(4).map(function (r) {
        var e = S("rect", { x: cx(r[2]) - 1, y: cy(g2, r[1]) - 2, width: cw + 2, height: ch + 4, rx: 5, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 2.5 }, svg);
        e.style.opacity = 0; return e;
      });
      LC.popIn(tl, rings, { duration: 0.3, stagger: 0.12 });
      tl.addLabel("s6");
      return tl;
    }
  };
})();
