/* H1 "The story of AI": shared timeline kit for the h1-* stepper animations.
   Draws a year axis across the top with one dot per event, a headline row above it
   (one <text> per step, crossfaded so nothing ever overlaps) and leaves the area
   below (from `top`) for each lesson's own "scene" per step.
   Phones get only decade ticks and short headlines; the full names appear on wide. */
(function () {
  var LC = window.LC;
  LC.h1 = LC.h1 || {};

  /* cfg = { from, to, ticks:[years], bands:[{from,to}], steps:[{year:"1958", text, short, dots:[years]}] } */
  LC.h1.timeline = function (svg, ctx, cfg) {
    var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
    var padX = compact ? 20 : 28;
    var headY = compact ? 22 : 24, axisY = compact ? 46 : 50, tickY = axisY + 22;
    var g = S("g", {}, svg);
    // optional piecewise-linear axis: cfg.map = [[year, fraction], ...] from cfg.from to cfg.to
    function frac(yr) {
      if (!cfg.map) return (yr - cfg.from) / (cfg.to - cfg.from);
      for (var i = 1; i < cfg.map.length; i++) {
        var a = cfg.map[i - 1], b = cfg.map[i];
        if (yr <= b[0] || i === cfg.map.length - 1) return a[1] + (yr - a[0]) / (b[0] - a[0]) * (b[1] - a[1]);
      }
    }
    function x(yr) { return padX + frac(yr) * (W - 2 * padX); }

    (cfg.bands || []).forEach(function (b) {
      S("rect", { x: x(b.from), y: axisY - 6, width: Math.max(4, x(b.to) - x(b.from)), height: 12, rx: 4, class: "f-faint", "fill-opacity": 0.7 }, g);
    });
    S("line", { x1: padX - 8, x2: W - padX + 8, y1: axisY, y2: axisY, class: "s-axis" }, g);
    (compact && cfg.ticksCompact ? cfg.ticksCompact : cfg.ticks).forEach(function (t) {
      S("line", { x1: x(t), x2: x(t), y1: axisY + 3, y2: axisY + 8, class: "s-axis" }, g);
      S("text", { x: x(t), y: tickY, class: "t t-sm t-muted t-mid", text: t }, g);
    });

    // dots: a faint base for every event, a blue "visited" dot and an orange "now" ring
    var base = {}, done = {}, ring = {};
    cfg.steps.forEach(function (st) {
      (st.dots || []).forEach(function (yr) {
        if (base[yr]) return;
        base[yr] = S("circle", { cx: x(yr), cy: axisY, r: 3.5, class: "f-faint" }, g);
        done[yr] = S("circle", { cx: x(yr), cy: axisY, r: 4.5, class: "f-blue" }, g);
        ring[yr] = S("circle", { cx: x(yr), cy: axisY, r: 8, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 3 }, g);
        done[yr].style.opacity = 0; ring[yr].style.opacity = 0;
      });
    });

    var heads = cfg.steps.map(function (st, k) {
      var t = S("text", { x: compact ? 14 : 20, y: headY, class: "t", "font-size": compact ? 15 : 17, "font-weight": 600 }, g);
      S("tspan", { class: "t-orange", "font-weight": 700, text: st.year }, t);
      S("tspan", { dx: 9, text: compact && st.short ? st.short : st.text }, t);
      t.style.opacity = k === 0 ? 1 : 0;
      return t;
    });
    function els(map, k) { return (cfg.steps[k].dots || []).map(function (yr) { return map[yr]; }); }
    els(done, 0).concat(els(ring, 0)).forEach(function (e) { e.style.opacity = 1; });

    return {
      x: x,
      compact: compact,
      top: tickY + 16,          // first free y for the scene
      /* add the tweens that move the axis + headline from step k-1 to step k */
      go: function (tl, k) {
        var off = els(ring, k - 1), on = els(done, k).concat(els(ring, k));
        tl.to(heads[k - 1], { opacity: 0, duration: 0.25 });
        if (off.length) tl.to(off, { opacity: 0, duration: 0.25 }, "<");
        tl.to(heads[k], { opacity: 1, duration: 0.3 }, ">-0.05");
        if (on.length) tl.to(on, { opacity: 1, duration: 0.3 }, "<");
      }
    };
  };

  /* Swap scenes: fade the old group out, the new one in. */
  LC.h1.swap = function (tl, from, to) {
    tl.to(from, { opacity: 0, duration: 0.3 });
    tl.to(to, { opacity: 1, duration: 0.35 });
  };
  /* A scene group that starts hidden unless it is the first one. */
  LC.h1.scene = function (svg, first) {
    var g = LC.svg("g", {}, svg);
    g.style.opacity = first ? 1 : 0;
    return g;
  };
  /* Arrow from (x1,y1) to (x2,y2): returns [shaft, head]. */
  LC.h1.arrow = function (parent, x1, y1, x2, y2, cls, size) {
    var S = LC.svg, a = Math.atan2(y2 - y1, x2 - x1), h = size || 8;
    var shaft = S("path", { d: "M" + x1 + " " + y1 + "L" + x2 + " " + y2, class: cls || "s-ink" }, parent);
    var p1 = [x2 - h * Math.cos(a - 0.45), y2 - h * Math.sin(a - 0.45)];
    var p2 = [x2 - h * Math.cos(a + 0.45), y2 - h * Math.sin(a + 0.45)];
    var head = S("path", { d: "M" + p1.join(" ") + "L" + x2 + " " + y2 + "L" + p2.join(" "), class: cls || "s-ink" }, parent);
    return [shaft, head];
  };
  /* Rounded box with centred text (one or two lines). Returns the group. */
  LC.h1.box = function (parent, cx, cy, w, h, lines, opt) {
    var S = LC.svg; opt = opt || {};
    var g = S("g", {}, parent);
    S("rect", { x: cx - w / 2, y: cy - h / 2, width: w, height: h, rx: opt.rx || 9, class: opt.fill || "f-surface", stroke: opt.stroke || "var(--line)", "stroke-width": 1.5 }, g);
    lines = [].concat(lines);
    var fs = opt.size || 13, lh = Math.round(fs * 1.45);
    lines.forEach(function (ln, i) {
      S("text", { x: cx, y: cy + (i - (lines.length - 1) / 2) * lh + fs * 0.36, class: "t t-mid" + (opt.cls ? " " + opt.cls : ""), "font-size": fs, "font-weight": opt.weight || 500, text: ln }, g);
    });
    return g;
  };
})();
