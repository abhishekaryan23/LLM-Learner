/* H1.1: 1943–1986 on one axis. Each step lights an event and shows a small scene. */
(function () {
  var LC = window.LC;
  LC.anims["h1-1-timeline"] = {
    title: "From a logic neuron to backprop, 1943–1986",
    steps: [
      "<strong>1943.</strong> McCulloch and Pitts model a neuron as a <strong>threshold switch</strong>: it outputs 1 when enough inputs are on. Networks of them can compute logic, but every connection is set by hand.",
      "<strong>1949.</strong> Donald Hebb proposes that a connection <strong>strengthens when the two cells are active together</strong>. That's the first idea of learning by changing connection strengths.",
      "<strong>1958.</strong> Frank Rosenblatt's <strong>perceptron</strong> learns its own weights from examples: when it's wrong, it nudges each weight toward the right answer. The Mark I machine wired it to a 20×20 grid of photocells.",
      "<strong>1969.</strong> Minsky and Papert's book <em>Perceptrons</em> proves the limits of a single layer: it can't even compute <strong>XOR</strong>, because no single straight line separates the two classes.",
      "<strong>1973.</strong> The Lighthill report in the UK, and US cuts soon after, slash funding. Neural-network research enters the first <strong>AI winter</strong> (grey band).",
      "<strong>1980s.</strong> AI's comeback is <strong>symbolic</strong>: expert systems built from hand-written IF–THEN rules. They work in narrow domains, but are brittle and costly to maintain. Their market collapses in the late 1980s.",
      "<strong>1970–1986.</strong> The fix for multi-layer nets: <strong>backpropagation</strong>. Linnainmaa (1970) and Werbos (1974) had the maths; Rumelhart, Hinton and Williams (1986) showed it learns useful hidden features."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 308 } : { w: 640, h: 306 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, H = ctx.h, compact = ctx.layout === "compact", cx = W / 2;
      var T = LC.h1.timeline(svg, ctx, {
        from: 1940, to: 1990, ticks: [1940, 1950, 1960, 1970, 1980, 1990],
        bands: [{ from: 1974, to: 1980 }, { from: 1987, to: 1990 }],
        steps: [
          { year: "1943", text: "McCulloch & Pitts: a logic neuron", short: "McCulloch & Pitts neuron", dots: [1943] },
          { year: "1949", text: "Hebb: fire together, wire together", short: "Hebb's learning idea", dots: [1949] },
          { year: "1958", text: "Rosenblatt's perceptron", dots: [1958] },
          { year: "1969", text: "Minsky & Papert, Perceptrons: XOR", short: "Perceptrons and XOR", dots: [1969] },
          { year: "1973", text: "Lighthill report → the first AI winter", short: "First AI winter", dots: [1973] },
          { year: "1980s", text: "Symbolic AI: expert systems boom", short: "Expert systems", dots: [1980] },
          { year: "1986", text: "Backprop: Rumelhart, Hinton & Williams", short: "Backpropagation", dots: [1970, 1974, 1986] }
        ]
      });
      var top = T.top, A = LC.h1.arrow, tl = gsap.timeline();
      var sc = [0, 1, 2, 3, 4, 5, 6].map(function (k) { return LC.h1.scene(svg, k === 0); });
      function note(g, y, txt, cls) { return S("text", { x: cx, y: y, class: "t t-sm t-mid" + (cls ? " " + cls : ""), text: txt }, g); }

      // ---- scene 0: threshold neuron
      (function (g) {
        var xi = compact ? 60 : 170, xn = compact ? 190 : 330, xo = compact ? 306 : 480;
        var ys = [top + 34, top + 84, top + 134], yn = top + 84;
        S("text", { x: xi, y: top + 6, class: "t t-sm t-muted t-mid", text: "inputs" }, g);
        ["1", "0", "1"].forEach(function (v, i) {
          S("line", { x1: xi + 16, y1: ys[i], x2: xn - 34, y2: yn + (i - 1) * 14, class: "s-ink" }, g);
          S("circle", { cx: xi, cy: ys[i], r: 15, class: v === "1" ? "f-blue" : "f-surface2", stroke: "var(--line)" }, g);
          S("text", { x: xi, y: ys[i] + 5, class: "t t-mid t-nohalo", text: v, style: v === "1" ? "fill:var(--a-paper)" : "" }, g);
        });
        S("circle", { cx: xn, cy: yn, r: 36, class: "f-surface", stroke: "var(--a-ink)", "stroke-width": 2 }, g);
        S("text", { x: xn, y: yn + 5, class: "t t-mid", "font-weight": 600, text: "≥ 2 ?" }, g);
        S("text", { x: xn, y: yn - 46, class: "t t-sm t-muted t-mid", text: "threshold" }, g);
        A(g, xn + 38, yn, xo - 18, yn, "s-ink");
        S("circle", { cx: xo, cy: yn, r: 15, class: "f-orange" }, g);
        S("text", { x: xo, y: yn + 5, class: "t t-mid t-nohalo", style: "fill:var(--a-paper)", text: "1" }, g);
        S("text", { x: xo, y: yn - 26, class: "t t-sm t-muted t-mid", text: "output" }, g);
        note(g, top + 186, "fires (1) when at least 2 inputs are on");
        note(g, top + 208, "every connection set by hand: no learning", "t-muted");
      })(sc[0]);
      tl.addLabel("s0", 0);

      // ---- scene 1: Hebb
      var hebbLine, glowA, glowB;
      (function (g) {
        var xa = cx - (compact ? 100 : 130), xb = cx + (compact ? 100 : 130), y = top + 76;
        hebbLine = S("line", { x1: xa + 28, y1: y, x2: xb - 28, y2: y, class: "s-blue", "stroke-width": 2 }, g);
        [[xa, "A"], [xb, "B"]].forEach(function (p) {
          S("circle", { cx: p[0], cy: y, r: 26, class: "f-surface", stroke: "var(--a-ink)", "stroke-width": 2 }, g);
        });
        glowA = S("circle", { cx: xa, cy: y, r: 26, class: "f-orange" }, g);
        glowB = S("circle", { cx: xb, cy: y, r: 26, class: "f-orange" }, g);
        glowA.style.opacity = 0; glowB.style.opacity = 0;
        S("text", { x: xa, y: y + 5, class: "t t-mid t-nohalo", "font-weight": 600, text: "A" }, g);
        S("text", { x: xb, y: y + 5, class: "t t-mid t-nohalo", "font-weight": 600, text: "B" }, g);
        S("text", { x: cx, y: y - 22, class: "t t-sm t-blue t-mid", text: "connection" }, g);
        note(g, top + 160, "“cells that fire together, wire together”");
        note(g, top + 182, "(a later slogan for Hebb's 1949 idea)", "t-muted");
      })(sc[1]);
      LC.h1.swap(tl, sc[0], sc[1]); T.go(tl, 1);
      [0, 1, 2].forEach(function (i) {
        tl.to([glowA, glowB], { opacity: 0.85, duration: 0.25 });
        tl.to(hebbLine, { attr: { "stroke-width": 2 + 3 * (i + 1) }, duration: 0.3 }, "<");
        tl.to([glowA, glowB], { opacity: 0, duration: 0.3 });
      });
      tl.addLabel("s1");

      // ---- scene 2: perceptron with photocell grid
      var wLines = [];
      (function (g) {
        var cell = compact ? 12 : 15, gap = 2, gx = compact ? 22 : 90, gy = top + 34;
        var pat = ["01110", "10001", "11111", "10001", "10001"]; // a blocky "A"
        pat.forEach(function (row, r) {
          row.split("").forEach(function (c, k) {
            S("rect", { x: gx + k * (cell + gap), y: gy + r * (cell + gap), width: cell, height: cell, rx: 2, class: c === "1" ? "f-ink" : "f-faint" }, g);
          });
        });
        var gw = 5 * cell + 4 * gap;
        S("text", { x: gx + gw / 2, y: top + 18, class: "t t-sm t-muted t-mid", text: compact ? "photocells" : "photocells (Mark I: 20×20)" }, g);
        var xs = compact ? 214 : 360, ys = gy + gw / 2;
        var widths = [1.5, 4, 2.5, 5, 1.5];
        for (var r = 0; r < 5; r++) {
          var yy = gy + r * (cell + gap) + cell / 2;
          wLines.push(S("line", { x1: gx + gw + 4, y1: yy, x2: xs - 28, y2: ys + (r - 2) * 8, class: r % 2 ? "s-blue" : "s-orange", "stroke-width": widths[r] }, g));
        }
        S("text", { x: (gx + gw + xs - 28) / 2, y: top + 18, class: "t t-sm t-blue t-mid", text: "weights" }, g);
        S("circle", { cx: xs, cy: ys, r: 26, class: "f-surface", stroke: "var(--a-ink)", "stroke-width": 2 }, g);
        S("text", { x: xs, y: ys + 6, class: "t t-mid", "font-size": 18, "font-weight": 600, text: "Σ" }, g);
        var xo = compact ? 296 : 500;
        A(g, xs + 28, ys, xo - 6, ys, "s-ink");
        S("text", { x: xo + (compact ? 22 : 30), y: ys + 5, class: "t t-mid", "font-weight": 600, text: compact ? "A?" : "“A”?" }, g);
        note(g, top + 160, compact ? "wrong? nudge each weight toward the answer" : "wrong answer? nudge every weight toward the right one");
        S("text", { x: cx, y: top + 184, class: "t t-sm t-mono t-mid t-muted", text: "w ← w + η·(target − output)·x" }, g);
      })(sc[2]);
      LC.h1.swap(tl, sc[1], sc[2]); T.go(tl, 2);
      tl.to(wLines[1], { attr: { "stroke-width": 1.5 }, duration: 0.4 });
      tl.to(wLines[3], { attr: { "stroke-width": 7 }, duration: 0.4 }, "<");
      tl.to(wLines[0], { attr: { "stroke-width": 3.5 }, duration: 0.4 }, "<");
      tl.addLabel("s2");

      // ---- scene 3: XOR
      var tryLine, cross;
      (function (g) {
        var s = compact ? 120 : 140, px = compact ? cx - s / 2 : 150, py = top + 14;
        S("rect", { x: px, y: py, width: s, height: s, class: "f-none", stroke: "var(--line)", "stroke-width": 1.5 }, g);
        function P(u, v) { return [px + (0.15 + 0.7 * u) * s, py + (0.85 - 0.7 * v) * s]; }
        [[0, 0, 0], [1, 1, 0], [0, 1, 1], [1, 0, 1]].forEach(function (q) {
          var p = P(q[0], q[1]);
          if (q[2]) S("circle", { cx: p[0], cy: p[1], r: 9, class: "f-blue" }, g);
          else S("rect", { x: p[0] - 8, y: p[1] - 8, width: 16, height: 16, rx: 2, class: "f-orange" }, g);
        });
        S("text", { x: P(0, 0)[0], y: py + s + 16, class: "t t-sm t-muted t-mid", text: "0" }, g);
        S("text", { x: P(1, 0)[0], y: py + s + 16, class: "t t-sm t-muted t-mid", text: "1" }, g);
        S("text", { x: px - 9, y: P(0, 0)[1] + 4, class: "t t-sm t-muted t-end", text: "0" }, g);
        S("text", { x: px - 9, y: P(0, 1)[1] + 4, class: "t t-sm t-muted t-end", text: "1" }, g);
        var a = P(-0.05, 0.62), b = P(1.1, -0.05);
        tryLine = S("path", { d: "M" + a[0] + " " + a[1] + "L" + b[0] + " " + b[1], class: "s-ink", "stroke-dasharray": "6 5" }, g);
        tryLine.style.opacity = 0;
        cross = S("text", { x: px + s + 16, y: py + 22, class: "t t-lg t-orange", text: "✗" }, g);
        cross.style.opacity = 0;
        var tx = compact ? cx : 440, ty = compact ? top + 172 : top + 50;
        var lines = compact ? ["XOR is 1 when the two inputs differ.", "No straight line puts ● and ■ apart."]
          : ["XOR is 1 when the inputs differ", "(● = 1, ■ = 0).", "", "No single straight line", "puts all ● on one side."];
        lines.forEach(function (t, i) { if (t) S("text", { x: tx, y: ty + i * 22, class: "t t-sm t-mid", text: t }, g); });
      })(sc[3]);
      LC.h1.swap(tl, sc[2], sc[3]); T.go(tl, 3);
      tl.to(tryLine, { opacity: 1, duration: 0.35 });
      tl.to(cross, { opacity: 1, duration: 0.3 });
      tl.addLabel("s3");

      // ---- scene 4: AI winter
      var flake = [];
      (function (g) {
        var fx = cx, fy = top + 62, R = 44;
        for (var i = 0; i < 6; i++) {
          var a = i * Math.PI / 3, ex = fx + R * Math.cos(a), ey = fy + R * Math.sin(a);
          var mx = fx + 0.6 * R * Math.cos(a), my = fy + 0.6 * R * Math.sin(a);
          var d = "M" + fx + " " + fy + "L" + ex.toFixed(1) + " " + ey.toFixed(1) +
            "M" + mx.toFixed(1) + " " + my.toFixed(1) + "L" + (mx + 14 * Math.cos(a + 0.8)).toFixed(1) + " " + (my + 14 * Math.sin(a + 0.8)).toFixed(1) +
            "M" + mx.toFixed(1) + " " + my.toFixed(1) + "L" + (mx + 14 * Math.cos(a - 0.8)).toFixed(1) + " " + (my + 14 * Math.sin(a - 0.8)).toFixed(1);
          flake.push(S("path", { d: d, class: "s-blue" }, g));
        }
        note(g, top + 136, compact ? "UK: Lighthill report (1973) → cuts" : "UK: the Lighthill report (1973) leads to deep cuts");
        note(g, top + 158, compact ? "US: DARPA cuts back (mid-1970s)" : "US: DARPA narrows its AI funding (mid-1970s)");
        note(g, top + 180, "grey band on the axis = an “AI winter”", "t-muted");
      })(sc[4]);
      LC.h1.swap(tl, sc[3], sc[4]); T.go(tl, 4);
      flake.forEach(function (p, i) { LC.drawIn(tl, p, { duration: 0.35 }, i ? "<0.08" : undefined); });
      tl.addLabel("s4");

      // ---- scene 5: expert systems
      var cards = [];
      (function (g) {
        var bw = compact ? 300 : 380, x0 = cx;
        var rules = [
          ["IF gram-positive AND grows in chains", "THEN streptococcus (certainty 0.7)"],
          ["IF streptococcus AND patient allergic", "THEN avoid penicillin"]
        ];
        rules.forEach(function (r, i) {
          var c = LC.h1.box(g, x0, top + 30 + i * 56, bw, 46, r, { size: compact ? 12 : 13, rx: 8 });
          cards.push(c);
        });
        note(g, top + 148, compact ? "experts' knowledge, typed in as rules" : "an expert's knowledge, typed in by hand as rules");
        note(g, top + 170, compact ? "brittle outside its rules" : "works in a narrow domain, brittle outside it", "t-muted");
        note(g, top + 192, compact ? "(rules in the style of MYCIN, 1970s)" : "(rules written in the style of MYCIN, 1970s)", "t-muted");
      })(sc[5]);
      cards.forEach(function (c) { c.style.opacity = 0; });
      LC.h1.swap(tl, sc[4], sc[5]); T.go(tl, 5);
      tl.to(cards, { opacity: 1, duration: 0.35, stagger: 0.25 });
      tl.addLabel("s5");

      // ---- scene 6: backprop
      var fwd = [], bwd = [];
      (function (g) {
        var xI = compact ? 60 : 150, xH = cx, xO = compact ? 300 : 490;
        var yI = [top + 40, top + 112], yH = [top + 20, top + 76, top + 132], yO = top + 76, r = 13;
        function edge(x1, y1, x2, y2) {
          var a = Math.atan2(y2 - y1, x2 - x1);
          return [x1 + r * Math.cos(a), y1 + r * Math.sin(a), x2 - r * Math.cos(a), y2 - r * Math.sin(a)];
        }
        var pairs = [];
        yI.forEach(function (a) { yH.forEach(function (b) { pairs.push([xI, a, xH, b]); }); });
        yH.forEach(function (b) { pairs.push([xH, b, xO, yO]); });
        pairs.forEach(function (p) {
          var e = edge(p[0], p[1], p[2], p[3]);
          S("line", { x1: e[0], y1: e[1], x2: e[2], y2: e[3], class: "s-faint" }, g);
        });
        // backward error arrows on the output layer edges, drawn from output to hidden
        yH.forEach(function (b) {
          var e = edge(xH, b, xO, yO);
          bwd.push(A(g, e[2] - 4, e[3] + 6, e[0] + 8, e[1] + 6, "s-orange", 7));
        });
        yI.forEach(function (a) {
          var e = edge(xI, a, xH, yH[1]);
          bwd.push(A(g, e[2] - 6, e[3] + 6, e[0] + 8, e[1] + 6, "s-orange", 7));
        });
        yI.forEach(function (y) { S("circle", { cx: xI, cy: y, r: r, class: "f-blue" }, g); });
        yH.forEach(function (y) { S("circle", { cx: xH, cy: y, r: r, class: "f-surface", stroke: "var(--a-ink)", "stroke-width": 2 }, g); });
        S("circle", { cx: xO, cy: yO, r: r, class: "f-orange" }, g);
        S("text", { x: xH, y: top + 2, class: "t t-sm t-muted t-mid", text: "hidden" }, g);
        S("text", { x: xO, y: yO + 32, class: "t t-sm t-orange t-mid", text: "error" }, g);
        fwd.push(A(g, cx - 60, top + 168, cx + 60, top + 168, "s-blue", 8));
        S("text", { x: cx, y: top + 160, class: "t t-sm t-blue t-mid", text: "forward: make a guess" }, g);
        S("text", { x: cx, y: top + 194, class: "t t-sm t-orange t-mid", text: "backward: share out the blame" }, g);
      })(sc[6]);
      fwd.concat(bwd).forEach(function (a) { a[1].style.opacity = 0; });
      LC.h1.swap(tl, sc[5], sc[6]); T.go(tl, 6);
      fwd.forEach(function (a) { LC.drawIn(tl, a[0], { duration: 0.5 }); LC.popIn(tl, a[1], { duration: 0.15 }); });
      bwd.forEach(function (a, i) { LC.drawIn(tl, a[0], { duration: 0.4 }, i ? "<0.1" : undefined); tl.to(a[1], { opacity: 1, duration: 0.15 }, ">-0.05"); });
      tl.addLabel("s6");
      return tl;
    }
  };
})();
