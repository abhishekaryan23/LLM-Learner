/* RL.6: one simulation of AlphaZero-style MCTS on a tiny tree, c_puct = 1.5.
   Root children (P, N, Q): A (.50, 6, .55), B (.30, 4, .50), C (.20, 0, –); ΣN = 10.
   U = c·P·√ΣN/(1+N): A .339 → .889, B .285 → .785, C .949 → .949 ⇒ select C.
   Expand C (priors .6/.4), value net v = 0.40, back up: C N=1 Q=.40, root N=11.
   Final counts (illustrative): A 1100, B 380, C 120 of 1,600 simulations. */
(function () {
  var LC = window.LC;
  var KIDS = [{ n: "A", P: 0.5, N: 6, Q: 0.55 }, { n: "B", P: 0.3, N: 4, Q: 0.5 }, { n: "C", P: 0.2, N: 0, Q: null }];
  var C = 1.5, SUMN = 10;
  function score(k) { return (k.Q || 0) + C * k.P * Math.sqrt(SUMN) / (1 + k.N); }
  function d2(v) { return v.toFixed(2).replace(/^0/, ""); }

  LC.anims["rl-6-mcts"] = {
    title: "Monte Carlo tree search: one simulation",
    steps: [
      "MCTS grows a tree from the current position. Each move stores a <strong>prior</strong> $P$ from the policy network, a <strong>visit count</strong> $N$ and the <strong>mean value</strong> $Q$ of the simulations that went through it.",
      "<strong>Select</strong>: walk down by the PUCT rule, taking the move with the largest $Q + U$, where $U = c\\,P\\,\\sqrt{N_\\text{parent}}/(1 + N)$ rewards promising, rarely tried moves. With $c = 1.5$: A 0.89, B 0.78, C 0.95, so C.",
      "<strong>Expand</strong>: C has never been visited, so it becomes a new node. The policy network gives priors for the moves after it.",
      "<strong>Evaluate</strong>: instead of playing the game out, the <strong>value network</strong> scores the new position: $v = 0.40$. (The original AlphaGo mixed this with fast random playouts; AlphaGo Zero dropped them.)",
      "<strong>Back up</strong>: every move on the path gets one more visit and adds $v$ to its total. C now has $N = 1$, $Q = 0.40$, and the root has $N = 11$. (In two-player games the value's sign flips at each level, since the players alternate.)",
      "Repeat many times (AlphaGo Zero used 1,600 simulations per move). Then <strong>play the most-visited move</strong>; the visit shares become the training target for the policy network. (Counts here are illustrative.)"
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 420 } : { w: 640, h: 370 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      var L = compact
        ? { root: { x: 180, y: 46, w: 132, h: 46 }, kx: [62, 180, 298], ky: 148, kw: 104, kh: 64, sy: 232, gx: [252, 326], gy: 280, gw: 64, info: [12, 300], foot: [12, 372, 396] }
        : { root: { x: 320, y: 44, w: 160, h: 46 }, kx: [150, 320, 490], ky: 140, kw: 140, kh: 64, sy: 224, gx: [452, 548], gy: 270, gw: 84, info: [40, 290], foot: [40, 330, 354] };
      // phase row
      var PH = ["select", "expand", "evaluate", "backup"], phX = compact ? [10, 74, 148, 232] : [40, 110, 190, 280], phEls = [];
      PH.forEach(function (p, i) {
        phEls.push(S("text", { x: phX[i], y: 20, class: "t t-sm t-muted", text: p }, svg));
        if (i) S("text", { x: phX[i] - 12, y: 20, class: "t t-sm t-muted t-mid", text: "→" }, svg);
      });
      function setPhase(i) { phEls.forEach(function (e, j) { e.setAttribute("class", "t t-sm " + (j === i ? "t-orange" : "t-muted")); e.setAttribute("font-weight", j === i ? 700 : 400); }); }
      var edges = [], hot = [];
      var r = L.root;
      L.kx.forEach(function (x, i) {
        edges.push(S("path", { d: "M" + r.x + " " + (r.y + r.h) + "L" + x + " " + L.ky, class: "s-faint", "stroke-width": 2 }, svg));
      });
      S("rect", { x: r.x - r.w / 2, y: r.y, width: r.w, height: r.h, rx: 10, class: "f-surface", stroke: "var(--a-ink)", "stroke-width": 2 }, svg);
      S("text", { x: r.x, y: r.y + 19, class: "t t-sm t-mid", "font-weight": 650, text: "current position" }, svg);
      var rootN = S("text", { x: r.x, y: r.y + 37, class: "t t-sm t-mono t-mid", text: "N = 10" }, svg);
      var kidEls = KIDS.map(function (k, i) {
        var x = L.kx[i], y = L.ky;
        var box = S("rect", { x: x - L.kw / 2, y: y, width: L.kw, height: L.kh, rx: 10, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, svg);
        S("text", { x: x, y: y + 18, class: "t t-sm t-mid", "font-weight": 650, text: "move " + k.n }, svg);
        var l2 = S("text", { x: x, y: y + 36, class: "t t-sm t-mono t-mid", text: "P " + d2(k.P) + " · N " + k.N }, svg);
        var l3 = S("text", { x: x, y: y + 54, class: "t t-sm t-mono t-mid", text: "Q " + (k.Q === null ? "–" : d2(k.Q)) }, svg);
        var sc = S("text", { x: x, y: L.sy, class: "t t-sm t-mono t-mid" + (i === 2 ? " t-orange" : ""), "font-weight": i === 2 ? 700 : 400, text: "Q+U = " + score(k).toFixed(2) }, svg);
        sc.style.opacity = 0;
        return { box: box, l2: l2, l3: l3, sc: sc };
      });
      setPhase(-1);
      tl.addLabel("s0", 0);

      // s1: select
      var hotEdge = S("path", { d: "M" + r.x + " " + (r.y + r.h) + "L" + L.kx[2] + " " + L.ky, class: "s-orange", "stroke-width": 3.5 }, svg);
      var ring = S("rect", { x: L.kx[2] - L.kw / 2 - 3, y: L.ky - 3, width: L.kw + 6, height: L.kh + 6, rx: 12, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 3 }, svg);
      var ph = { i: -1 };
      function phaseTo(i) { tl.to(ph, { i: i, duration: 0.2, onUpdate: function () { setPhase(Math.round(ph.i)); } }); }
      phaseTo(0);
      LC.popIn(tl, kidEls.map(function (k) { return k.sc; }), { duration: 0.3, stagger: 0.12 });
      LC.drawIn(tl, hotEdge, { duration: 0.5 });
      LC.popIn(tl, ring, { duration: 0.3 });
      tl.addLabel("s1");

      // s2: expand
      var gk = S("g", {}, svg); gk.style.opacity = 0;
      var cx = L.kx[2], cyb = L.ky + L.kh;
      [0.6, 0.4].forEach(function (p, j) {
        var x = L.gx[j];
        S("path", { d: "M" + cx + " " + (L.sy + 7) + "L" + x + " " + L.gy, class: "s-faint", "stroke-width": 2 }, gk);
        S("rect", { x: x - L.gw / 2, y: L.gy, width: L.gw, height: 34, rx: 8, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, gk);
        S("text", { x: x, y: L.gy + 22, class: "t t-sm t-mono t-mid", text: "P " + d2(p) }, gk);
      });
      phaseTo(1);
      tl.to(kidEls.slice(0, 2).map(function (k) { return k.sc; }), { opacity: 0.35, duration: 0.3 }, "<");
      tl.to(gk, { opacity: 1, duration: 0.5 });
      tl.addLabel("s2");

      // s3: evaluate
      var ev1 = S("text", { x: L.info[0], y: L.info[1], class: "t t-orange", "font-weight": 650, text: "value net: v = 0.40" }, svg);
      var ev2 = S("text", { x: L.info[0], y: L.info[1] + 22, class: "t t-sm t-muted", text: compact ? "no playout needed" : "no random playout needed" }, svg);
      phaseTo(2);
      LC.popIn(tl, [ev1, ev2], { duration: 0.4 });
      tl.addLabel("s3");

      // s4: backup
      var up = S("path", { d: "M" + (L.kx[2] - 10) + " " + (L.ky - 6) + "L" + (r.x + 6) + " " + (r.y + r.h + 4), class: "s-orange", "stroke-width": 2.5 }, svg);
      var head = S("path", { d: "M" + (r.x + 6) + " " + (r.y + r.h + 4) + "l9 -1 M" + (r.x + 6) + " " + (r.y + r.h + 4) + "l4 8", class: "s-orange", "stroke-width": 2.5 }, svg);
      var bk = S("text", { x: L.foot[0], y: L.foot[1], class: "t t-sm", text: "along the path: N += 1, W += v, Q = W / N" }, svg);
      var st = { p: 0 };
      phaseTo(3);
      LC.drawIn(tl, up, { duration: 0.5 });
      LC.drawIn(tl, head, { duration: 0.15 });
      LC.popIn(tl, bk, { duration: 0.3 });
      tl.to(st, { p: 1, duration: 0.4, onUpdate: function () {
        var done = st.p > 0.5;
        kidEls[2].l2.textContent = "P .20 · N " + (done ? 1 : 0);
        kidEls[2].l3.textContent = "Q " + (done ? ".40" : "–");
        rootN.textContent = "N = " + (done ? 11 : 10);
      } });
      tl.addLabel("s4");

      // s5: many simulations later
      var FIN = [1100, 380, 120];
      var fin1 = S("text", { x: L.foot[0], y: L.foot[2], class: "t t-orange", "font-weight": 650, text: compact ? "play A · target π ≈ .69 / .24 / .08" : "play A, the most visited · policy target ≈ .69 / .24 / .08" }, svg);
      fin1.style.opacity = 0;
      var st2 = { p: 0 };
      tl.to([ev1, ev2, gk, up, head, hotEdge, ring, bk].concat(kidEls.map(function (k) { return k.sc; })), { opacity: 0, duration: 0.3 });
      tl.to(ph, { i: -1, duration: 0.2, onUpdate: function () { setPhase(Math.round(ph.i)); } }, "<");
      tl.to(st2, { p: 1, duration: 0.6, onUpdate: function () {
        var done = st2.p > 0.5;
        if (done) {
          KIDS.forEach(function (k, i) { kidEls[i].l2.textContent = "N " + FIN[i]; });
          kidEls[0].l3.textContent = "Q .58"; kidEls[1].l3.textContent = "Q .49"; kidEls[2].l3.textContent = "Q .31";
          rootN.textContent = "N = 1,600";
          kidEls[0].box.setAttribute("stroke", "var(--a-orange)"); kidEls[0].box.setAttribute("stroke-width", 3);
        } else {
          kidEls[0].l2.textContent = "P .50 · N 6"; kidEls[1].l2.textContent = "P .30 · N 4"; kidEls[2].l2.textContent = "P .20 · N 1";
          kidEls[0].l3.textContent = "Q .55"; kidEls[1].l3.textContent = "Q .50"; kidEls[2].l3.textContent = "Q .40";
          rootN.textContent = st.p > 0.5 ? "N = 11" : "N = 10";
          kidEls[0].box.setAttribute("stroke", "var(--line)"); kidEls[0].box.setAttribute("stroke-width", 1.5);
        }
      } });
      LC.popIn(tl, fin1, { duration: 0.4 });
      tl.addLabel("s5");
      return tl;
    }
  };
})();
