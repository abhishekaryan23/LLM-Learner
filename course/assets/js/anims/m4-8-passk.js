/* M4.8: agent reliability. 5 tasks × 4 independent trials (fresh sandbox each).
   12/20 trials succeed → pass^1 = 60%. Any of 4 succeeded: tasks 1–4 → pass@4 = 80%.
   All 4 succeeded: task 1 only → pass^4 = 20%.
   Curves: if every task succeeded independently with p = 0.6 per trial,
   pass@k = 1 − 0.4^k (0.974 at k = 4) and pass^k = 0.6^k (0.130 at k = 4). */
(function () {
  var LC = window.LC;
  var GRID = [[1, 1, 1, 1], [1, 0, 1, 1], [0, 1, 0, 1], [1, 1, 0, 1], [0, 0, 0, 0]];
  var P = 0.6;

  LC.anims["m4-8-passk"] = {
    title: "pass@k vs pass^k: one success, or success every time?",
    steps: [
      "An agent eval: <strong>5 tasks</strong>, each run <strong>4 times</strong> from a fresh, identical sandbox. A trial counts as a success only if the <strong>final state</strong> is right: the tests pass, or the database matches the goal.",
      "Run the trials. The same agent on the same task doesn't always do the same thing: sampling, tool timing and long multi-step plans all add randomness.",
      "Average over all trials: 12 of 20 succeed, so the plain success rate (<strong>pass^1</strong>) is <strong>60%</strong>.",
      "<strong>pass@4</strong>: does <em>at least one</em> of the 4 trials succeed? Tasks 1–4 do, so pass@4 = <strong>80%</strong>. This fits settings where you can retry and check, like generating code against tests.",
      "<strong>pass^4</strong>: do <em>all</em> 4 trials succeed? Only task 1 does, so pass^4 = <strong>20%</strong>. This is what matters when users need it to work every time.",
      "As $k$ grows the two metrics split apart. For an agent that succeeds independently 60% of the time on every task, pass@k $= 1-0.4^k$ climbs toward 100%, while pass^k $= 0.6^k$ collapses toward 0.",
      "At $k = 4$: pass@4 ≈ <strong>97%</strong> but pass^4 ≈ <strong>13%</strong>, from the same 60% agent. Real tasks vary in difficulty (task 5 never works), which is why the grid's 80% and 20% differ from the curve. Report which metric you mean, together with the cost per task."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 438 } : { w: 640, h: 282 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      var G = { lab: 4, c0: compact ? 92 : 98, dc: compact ? 34 : 38, any: compact ? 256 : 278, all: compact ? 318 : 334, head: 42, top: 52, rh: 32, cell: 24, s1: 238, s2: 258 };
      var Pl = compact
        ? { l: 44, r: 290, title: 292, t: 312, b: 398, tick: 416, xt: 434, lab: 298 }
        : { l: 412, r: 568, title: 16, t: 48, b: 228, tick: 246, xt: 268, lab: 576 };
      function cx(j) { return G.c0 + j * G.dc; }
      function ry(r) { return G.top + r * G.rh; }
      function px(k) { return Pl.l + ((k - 1) / 7) * (Pl.r - Pl.l); }
      function py(v) { return Pl.b - v * (Pl.b - Pl.t); }

      // s0: empty grid
      S("text", { x: 4, y: 16, class: "t t-sm t-muted", text: compact ? "5 tasks × 4 trials, fresh sandbox each" : "5 tasks × 4 trials, each in a fresh sandbox" }, svg);
      S("text", { x: (cx(0) + cx(3)) / 2, y: G.head - 2, class: "t t-sm t-muted t-mid", text: "trials" }, svg);
      var anyH = S("text", { x: G.any, y: G.head - 2, class: "t t-sm t-mid t-blue", "font-weight": 650, text: "any?" }, svg);
      var allH = S("text", { x: G.all, y: G.head - 2, class: "t t-sm t-mid t-orange", "font-weight": 650, text: "all?" }, svg);
      GRID.forEach(function (row, r) {
        S("text", { x: G.lab, y: ry(r) + 17, class: "t t-sm", text: "Task " + (r + 1) }, svg);
        row.forEach(function (_, j) {
          S("rect", { x: cx(j) - G.cell / 2, y: ry(r), width: G.cell, height: G.cell, rx: 5, class: "f-none", stroke: "var(--line)", "stroke-width": 1.5 }, svg);
        });
      });
      tl.addLabel("s0", 0);

      // s1: results
      var cells = [];
      GRID.forEach(function (row, r) {
        row.forEach(function (ok, j) {
          var g = S("g", {}, svg);
          S("rect", { x: cx(j) - G.cell / 2, y: ry(r), width: G.cell, height: G.cell, rx: 5, class: ok ? "f-blue" : "f-faint" }, g);
          var t = S("text", { x: cx(j), y: ry(r) + 17, class: "t t-mid t-nohalo", "font-weight": 700, text: ok ? "✓" : "✗" }, g);
          if (ok) t.setAttribute("style", "fill:#fff");
          cells[j] = cells[j] || [];
          cells[j].push(g);
        });
      });
      [0, 1, 2, 3].forEach(function (j) { LC.popIn(tl, cells[j], { duration: 0.25, stagger: 0.06 }, j ? "+=0.05" : undefined); });
      tl.addLabel("s1");

      // s2: average
      var m1 = S("text", { x: (cx(0) + cx(3)) / 2, y: G.s1, class: "t t-sm t-muted t-mid", text: "pass^1" }, svg);
      var v1 = S("text", { x: (cx(0) + cx(3)) / 2, y: G.s2, class: "t t-mono t-mid", "font-weight": 700, text: "12/20 = 60%" }, svg);
      LC.popIn(tl, [m1, v1], { duration: 0.4 });
      tl.addLabel("s2");

      // s3: any
      var anyMarks = GRID.map(function (row, r) {
        var ok = row.some(Boolean);
        return S("text", { x: G.any, y: ry(r) + 17, class: "t t-mid " + (ok ? "t-blue" : "t-muted"), "font-weight": 700, text: ok ? "✓" : "✗" }, svg);
      });
      var m2 = S("text", { x: G.any, y: G.s1, class: "t t-sm t-blue t-mid", text: "pass@4" }, svg);
      var v2 = S("text", { x: G.any, y: G.s2, class: "t t-mono t-mid t-blue", "font-weight": 700, text: "80%" }, svg);
      LC.popIn(tl, anyMarks, { duration: 0.25, stagger: 0.1 });
      LC.popIn(tl, [m2, v2], { duration: 0.35 });
      tl.addLabel("s3");

      // s4: all
      var allMarks = GRID.map(function (row, r) {
        var ok = row.every(Boolean);
        return S("text", { x: G.all, y: ry(r) + 17, class: "t t-mid " + (ok ? "t-orange" : "t-muted"), "font-weight": 700, text: ok ? "✓" : "✗" }, svg);
      });
      var m3 = S("text", { x: G.all, y: G.s1, class: "t t-sm t-orange t-mid", text: "pass^4" }, svg);
      var v3 = S("text", { x: G.all, y: G.s2, class: "t t-mono t-mid t-orange", "font-weight": 700, text: "20%" }, svg);
      LC.popIn(tl, allMarks, { duration: 0.25, stagger: 0.1 });
      LC.popIn(tl, [m3, v3], { duration: 0.35 });
      tl.addLabel("s4");

      // s5: curves
      var plot = S("g", {}, svg);
      S("text", { x: compact ? 4 : Pl.l - 34, y: Pl.title, class: "t t-sm t-muted", text: "If each trial succeeds 60% of the time" }, plot);
      [0.5, 1].forEach(function (v) { S("line", { x1: Pl.l, x2: Pl.r, y1: py(v), y2: py(v), class: "s-grid" }, plot); });
      S("path", { d: "M" + Pl.l + " " + Pl.t + "V" + Pl.b + "H" + Pl.r, class: "s-axis" }, plot);
      [[0, "0"], [0.5, "50%"], [1, "100%"]].forEach(function (t) { S("text", { x: Pl.l - 6, y: py(t[0]) + 4, class: "t t-sm t-muted t-end", text: t[1] }, plot); });
      [1, 2, 4, 6, 8].forEach(function (k) { S("text", { x: px(k), y: Pl.tick, class: "t t-sm t-muted t-mid", text: k }, plot); });
      S("text", { x: Pl.r, y: Pl.xt, class: "t t-sm t-muted t-end", text: "k (trials) →" }, plot);
      var up = S("path", { d: LC.fnPath(function (k) { return 1 - Math.pow(1 - P, k); }, 1, 8, px, py, 56), class: "s-blue" }, svg);
      var dn = S("path", { d: LC.fnPath(function (k) { return Math.pow(P, k); }, 1, 8, px, py, 56), class: "s-orange" }, svg);
      var lu = S("text", { x: Pl.lab, y: py(0.9993) + 4, class: "t t-sm t-blue", text: "pass@k" }, svg);
      var ld = S("text", { x: Pl.lab, y: py(0.0168) + 4, class: "t t-sm t-orange", text: "pass^k" }, svg);
      LC.popIn(tl, plot, { duration: 0.4 });
      LC.drawIn(tl, up, { duration: 0.9 });
      LC.drawIn(tl, dn, { duration: 0.9 }, "<");
      LC.popIn(tl, [lu, ld], { duration: 0.3 });
      tl.addLabel("s5");

      // s6: k = 4 markers
      var a = 1 - Math.pow(1 - P, 4), b = Math.pow(P, 4);
      var guide = S("line", { x1: px(4), x2: px(4), y1: Pl.t, y2: Pl.b, class: "s-faint", "stroke-dasharray": "4 4", "stroke-width": 1.5 }, svg);
      var da = S("circle", { cx: px(4), cy: py(a), r: 5, class: "f-blue" }, svg);
      var db = S("circle", { cx: px(4), cy: py(b), r: 5, class: "f-orange" }, svg);
      var la = S("text", { x: px(4) + 8, y: py(a) + 18, class: "t t-sm t-mono t-blue", text: "97%" }, svg);
      var lb = S("text", { x: px(4) + 8, y: py(b) - 8, class: "t t-sm t-mono t-orange", text: "13%" }, svg);
      LC.popIn(tl, [guide, da, db, la, lb], { duration: 0.4 });
      tl.addLabel("s6");
      return tl;
    }
  };
})();
