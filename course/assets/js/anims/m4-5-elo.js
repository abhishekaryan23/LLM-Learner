/* M4.5: the Elo update, one battle at a time.
   E_A = 1 / (1 + 10^((R_B − R_A)/400)),  R_A ← R_A + K (S_A − E_A),  K = 32.
   A = 1600, B = 1500 → E_A = 0.640. Battle 1: B wins → A −20.5, B +20.5 (gap 59.0, E_A = 0.584).
   Battle 2: A wins → A +13.3, B −13.3 (gap 85.7, E_A = 0.621). */
(function () {
  var LC = window.LC;
  var K = 32;
  function E(d) { return 1 / (1 + Math.pow(10, -d / 400)); }
  var A0 = 1600, B0 = 1500;
  var d1 = K * (0 - E(A0 - B0));             // −20.48
  var A1 = A0 + d1, B1 = B0 - d1;
  var d2 = K * (1 - E(A1 - B1));             // +13.31
  var A2 = A1 + d2, B2 = B1 - d2;
  function sgn(v) { return (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(1); }

  LC.anims["m4-5-elo"] = {
    title: "Elo: predict the result, then move by the surprise",
    steps: [
      "Two models with ratings: <strong>A = 1600</strong>, <strong>B = 1500</strong>. A rating means nothing alone; only the <strong>gap</strong> between two ratings predicts anything.",
      "Elo turns the gap into an <strong>expected score</strong> (A's chance of winning): $E_A = 1/(1+10^{(R_B-R_A)/400})$. Equal ratings give 0.5; a 400-point lead gives about 0.91.",
      "A leads by 100, so $E_A = 0.64$. Elo predicts A wins about <strong>64%</strong> of battles against B.",
      "Battle 1: a user prefers <strong>B's answer</strong>. A's actual score is $S_A = 0$, so the <strong>surprise</strong> is $S_A - E_A = -0.64$.",
      "Update with $K = 32$: $R_A \\leftarrow 1600 + 32(0 - 0.64) = 1579.5$. B gains the same <strong>20.5</strong> points. The gap shrinks to 59, so $E_A$ drops to 0.58.",
      "Battle 2: <strong>A wins</strong>. That was expected, so the surprise is small: $32(1 - 0.584) = +13.3$. Upsets move ratings a lot; expected results barely move them.",
      "After thousands of votes, a leaderboard fits all battles at once (<strong>Bradley–Terry</strong>) and shows each rating with a <strong>confidence interval</strong> (bars, illustrative). Overlapping intervals mean the ranking between them is not settled."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 362 } : { w: 640, h: 300 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      // --- geometry ---
      var P = compact ? { l: 44, r: 340, t: 44, b: 190, tick: 208, xt: 226 } : { l: 52, r: 330, t: 44, b: 218, tick: 236, xt: 256 };
      var L = compact ? { x0: 30, x1: 330, title: 254, delta: 276, val: 294, cy: 314, axis: 336, tick: 354 }
                      : { x0: 384, x1: 620, title: 108, delta: 138, val: 156, cy: 178, axis: 202, tick: 220 };
      function sx(d) { return P.l + ((d + 400) / 800) * (P.r - P.l); }
      function sy(e) { return P.b - e * (P.b - P.t); }
      function lx(r) { return L.x0 + ((r - 1450) / 200) * (L.x1 - L.x0); }

      // --- logistic plot axes (s0) ---
      [1].forEach(function (e) { S("line", { x1: P.l, x2: P.r, y1: sy(e), y2: sy(e), class: "s-grid" }, svg); });
      S("line", { x1: sx(0), x2: sx(0), y1: P.t, y2: P.b, class: "s-grid" }, svg);
      S("path", { d: "M" + P.l + " " + P.t + "V" + P.b + "H" + P.r, class: "s-axis" }, svg);
      [[0, "0"], [0.5, "0.5"], [1, "1"]].forEach(function (t) { S("text", { x: P.l - 7, y: sy(t[0]) + 4, class: "t t-sm t-muted t-end", text: t[1] }, svg); });
      [[-400, "−400"], [0, "0"], [400, "+400"]].forEach(function (t) { S("text", { x: sx(t[0]), y: P.tick, class: "t t-sm t-muted t-mid", text: t[1] }, svg); });
      S("text", { x: 4, y: 16, class: "t t-sm t-muted", text: "↑ expected score of A" }, svg);
      S("text", { x: P.r, y: P.xt, class: "t t-sm t-muted t-end", text: "rating gap A − B →" }, svg);

      // --- rating ladder (s0) ---
      S("text", { x: compact ? 4 : L.x0 - 4, y: L.title, class: "t t-sm t-muted", text: "Ratings (K = 32)" }, svg);
      S("line", { x1: L.x0, x2: L.x1, y1: L.axis, y2: L.axis, class: "s-axis" }, svg);
      [1450, 1500, 1550, 1600, 1650].forEach(function (r) {
        S("line", { x1: lx(r), x2: lx(r), y1: L.axis, y2: L.axis + 5, class: "s-axis" }, svg);
        S("text", { x: lx(r), y: L.tick, class: "t t-sm t-muted t-mid", text: r }, svg);
      });
      var ciG = S("g", {}, svg);
      // Moving parts are tweened as attributes (not via onUpdate), so instant jumps between
      // steps (reduced motion) render the right state. Changing numbers are separate labels.
      function token(cls, letter, r) {
        var c = S("circle", { cx: lx(r), cy: L.cy, r: 11, class: cls }, svg);
        var t = S("text", { x: lx(r), y: L.cy + 5, class: "t t-mid t-nohalo", style: "fill:#fff", "font-weight": 700, text: letter }, svg);
        return [c, t];
      }
      var tokA = token("f-orange", "A", A0), tokB = token("f-blue", "B", B0);
      function moveTok(tok, r, dur) {
        tl.to(tok[0], { attr: { cx: lx(r) }, duration: dur, ease: "power2.inOut" }, "<");
        tl.to(tok[1], { attr: { x: lx(r) }, duration: dur, ease: "power2.inOut" }, "<");
      }
      function fmtR(r) { return Math.abs(r % 1) < 1e-9 ? String(r) : r.toFixed(1); }
      function vals(ra, rb) {
        return [S("text", { x: lx(ra), y: L.val, class: "t t-sm t-mono t-mid t-orange", text: fmtR(ra) }, svg),
                S("text", { x: lx(rb), y: L.val, class: "t t-sm t-mono t-mid t-blue", text: fmtR(rb) }, svg)];
      }
      var vals0 = vals(A0, B0), vals1 = vals(A1, B1), vals2 = vals(A2, B2);
      [vals1, vals2].forEach(function (v) { v.forEach(function (e) { e.style.opacity = 0; }); });
      tl.addLabel("s0", 0);

      // --- s1: the curve ---
      var curve = S("path", { d: LC.fnPath(E, -400, 400, sx, sy, 80), class: "s-blue" }, svg);
      LC.drawIn(tl, curve, { duration: 1.1 }, "+=0.02");
      tl.addLabel("s1");

      // --- s2: marker at the current gap ---
      function mk(d) { return { x: sx(d), y: sy(E(d)) }; }
      var m0 = mk(A0 - B0), m1 = mk(A1 - B1), m2 = mk(A2 - B2);
      var gV = S("line", { x1: m0.x, x2: m0.x, y1: m0.y, y2: P.b, class: "s-faint", "stroke-dasharray": "4 4", "stroke-width": 1.5 }, svg);
      var gH = S("line", { x1: P.l, x2: m0.x, y1: m0.y, y2: m0.y, class: "s-faint", "stroke-dasharray": "4 4", "stroke-width": 1.5 }, svg);
      var dot = S("circle", { cx: m0.x, cy: m0.y, r: 5.5, class: "f-orange" }, svg);
      function eLabel(d) {
        var m = mk(d), t = S("text", { x: m.x + 10, y: m.y + 18, class: "t t-orange" }, svg);
        S("tspan", { text: "E" }, t);
        S("tspan", { dy: 4, "font-size": 12, text: "A" }, t);
        S("tspan", { dy: -4, class: "t-mono", text: " = " + E(d).toFixed(2) }, t);
        return t;
      }
      function gLabel(d) { return S("text", { x: mk(d).x, y: P.tick, class: "t t-sm t-mono t-orange t-mid", text: "+" + Math.round(d) }, svg); }
      var e0 = eLabel(A0 - B0), e1 = eLabel(A1 - B1), e2 = eLabel(A2 - B2);
      var g0 = gLabel(A0 - B0), g1 = gLabel(A1 - B1), g2 = gLabel(A2 - B2);
      [e1, e2, g1, g2].forEach(function (e) { e.style.opacity = 0; });
      function moveMarker(m, dur) {
        tl.to(dot, { attr: { cx: m.x, cy: m.y }, duration: dur, ease: "power2.inOut" }, "<");
        tl.to(gV, { attr: { x1: m.x, x2: m.x, y1: m.y }, duration: dur, ease: "power2.inOut" }, "<");
        tl.to(gH, { attr: { x2: m.x, y1: m.y, y2: m.y }, duration: dur, ease: "power2.inOut" }, "<");
      }
      LC.popIn(tl, [gV, gH, dot, e0, g0], { duration: 0.5 });
      tl.addLabel("s2");

      // --- s3: battle 1, B wins ---
      var bx = compact ? W - 4 : L.x1;
      var badge1 = S("text", { x: bx, y: L.title, class: "t t-sm t-blue t-end", "font-weight": 650, text: "Battle 1: B wins" }, svg);
      LC.popIn(tl, badge1, { duration: 0.4 });
      tl.addLabel("s3");

      // --- s4: update ---
      var dA1 = S("text", { x: lx(A1), y: L.delta, class: "t t-sm t-mono t-mid t-orange", text: sgn(d1) }, svg);
      var dB1 = S("text", { x: lx(B1), y: L.delta, class: "t t-sm t-mono t-mid t-blue", text: sgn(-d1) }, svg);
      tl.to(vals0.concat([e0, g0]), { opacity: 0, duration: 0.25 });
      moveTok(tokA, A1, 1.0); moveTok(tokB, B1, 1.0); moveMarker(m1, 1.0);
      tl.to(vals1.concat([e1, g1, dA1, dB1]), { opacity: 1, duration: 0.35 });
      tl.addLabel("s4");

      // --- s5: battle 2, A wins ---
      var badge2 = S("text", { x: bx, y: L.title, class: "t t-sm t-orange t-end", "font-weight": 650, text: "Battle 2: A wins" }, svg);
      var dA2 = S("text", { x: lx(A2), y: L.delta, class: "t t-sm t-mono t-mid t-orange", text: sgn(d2) }, svg);
      var dB2 = S("text", { x: lx(B2), y: L.delta, class: "t t-sm t-mono t-mid t-blue", text: sgn(-d2) }, svg);
      [dA1, dB1, dA2, dB2].forEach(function (e) { e.style.opacity = 0; });
      tl.to([badge1, dA1, dB1], { opacity: 0, duration: 0.3 });
      LC.popIn(tl, badge2, { duration: 0.35 });
      tl.to(vals1.concat([e1, g1]), { opacity: 0, duration: 0.25 });
      moveTok(tokA, A2, 0.9); moveTok(tokB, B2, 0.9); moveMarker(m2, 0.9);
      tl.to(vals2.concat([e2, g2, dA2, dB2]), { opacity: 1, duration: 0.35 });
      tl.addLabel("s5");

      // --- s6: confidence intervals (illustrative ±30 points) ---
      var half = 30;
      function ci(r) {
        var y = L.cy, x0 = lx(r - half), x1 = lx(r + half);
        return S("path", { d: "M" + x0 + " " + (y - 6) + "V" + (y + 6) + "M" + x0 + " " + y + "H" + x1 + "M" + x1 + " " + (y - 6) + "V" + (y + 6), class: "s-ink", "stroke-width": 2 }, ciG);
      }
      var ciA = ci(A2), ciB = ci(B2);
      tl.to([badge2, dA2, dB2], { opacity: 0, duration: 0.3 });
      LC.drawIn(tl, ciA, { duration: 0.6 });
      LC.drawIn(tl, ciB, { duration: 0.6 }, "<");
      tl.addLabel("s6");
      return tl;
    }
  };
})();
