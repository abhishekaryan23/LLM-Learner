/* SY.5: a ReAct trace (Yao et al., 2022) on a two-hop question, one loop at a time.
   Tools: search[query] and finish[answer]. Facts: the Statue of Liberty was dedicated on
   28 October 1886; the Eiffel Tower was completed in March 1889. Step budget: 6 actions. */
(function () {
  var LC = window.LC;

  LC.anims["sy-5-react"] = {
    title: "ReAct: think, act, look, repeat",
    steps: [
      "The app gives the model a <strong>goal</strong> and two <strong>tools</strong>: <code>search</code> and <code>finish</code>. It also sets a <strong>budget</strong> of 6 actions. Nothing has happened yet.",
      "<strong>Thought 1:</strong> the model writes a short plan in plain text: it needs two dates, so it starts with one.",
      "<strong>Action 1:</strong> it writes a structured tool call, <code>search[Statue of Liberty]</code>. The model doesn't run anything; <strong>your code</strong> does, and counts it against the budget.",
      "<strong>Observation 1:</strong> your code pastes the tool's result into the context. On the next turn the model reads it like any other text.",
      "<strong>Thought 2 and Action 2:</strong> the new fact changes the plan. One date found, so it searches for the other. The loop goes round again.",
      "<strong>Observation 2:</strong> the second date arrives. Every observation makes the context longer, and every later turn re-reads all of it.",
      "<strong>Thought 3 and finish:</strong> it compares 1886 with 1889 and calls <code>finish</code>. That is the <strong>stop condition</strong>: the loop ends on <code>finish</code>, or when the budget runs out, whichever comes first."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 508 } : { w: 640, h: 446 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      if (compact) svg = S("g", { transform: "translate(0,22)" }, svg); // keep the top-right corner free for the swipe hint

      // ---- goal box
      var gLines = compact
        ? ["Goal: which is older, the Statue of", "Liberty or the Eiffel Tower?"]
        : ["Goal: which is older, the Statue of Liberty or the Eiffel Tower?"];
      var gH = compact ? 78 : 62;
      S("rect", { x: 8, y: 8, width: W - 16, height: gH, rx: 10, class: "f-surface", stroke: "var(--a-ink)", "stroke-width": 1.5 }, svg);
      gLines.forEach(function (t, i) { S("text", { x: 20, y: 30 + i * 19, class: "t", "font-weight": 600, text: t }, svg); });
      S("text", { x: 20, y: compact ? 30 + 2 * 19 + 2 : 52, class: "t t-sm t-muted", text: compact ? "tools: search, finish · budget: 6 actions" : "tools: search[query], finish[answer] · budget: 6 actions" }, svg);

      // ---- the loop: three pills (think, act, look) + action counter
      var names = ["think", "act", "look"];
      var pw = compact ? 62 : 70, ph = 28, py = compact ? gH + 22 : gH + 22, px0 = compact ? 12 : 16, gap = compact ? 22 : 26;
      var pills = names.map(function (n, i) {
        var x = px0 + i * (pw + gap);
        S("rect", { x: x, y: py, width: pw, height: ph, rx: 14, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, svg);
        var hi = S("rect", { x: x, y: py, width: pw, height: ph, rx: 14, class: "f-orange" }, svg);
        hi.style.opacity = 0;
        var baseT = S("text", { x: x + pw / 2, y: py + 18.5, class: "t t-sm t-mid", "font-weight": 600, text: n }, svg);
        var hiT = S("text", { x: x + pw / 2, y: py + 18.5, class: "t t-sm t-mid t-nohalo", "font-weight": 600, style: "fill:#fff", text: n }, svg);
        hiT.style.opacity = 0;
        if (i < 2) S("path", { d: "M" + (x + pw + 5) + " " + (py + ph / 2) + "h" + (gap - 12) + "m-5 -4l5 4l-5 4", class: "s-ink", "stroke-width": 1.5, fill: "none" }, svg);
        return { hi: hi, t: hiT, b: baseT };
      });
      // return arrow under the pills, from "look" back to "think"
      var xL = px0 + 2 * (pw + gap) + pw / 2, xT = px0 + pw / 2, by = py + ph + 9;
      S("path", { d: "M" + xL + " " + (py + ph + 2) + "V" + by + "H" + xT + "V" + (py + ph + 4) + "m-4 5l4 -5l4 5", class: "s-faint", "stroke-width": 1.5, fill: "none" }, svg);
      // action counter at the right of the pill row
      var cx = W - 16, counters = [];
      for (var k = 0; k <= 3; k++) {
        var ct = S("text", { x: cx, y: py + 19, class: "t t-sm t-end" + (k === 3 ? " t-orange" : " t-muted"), "font-weight": 600, text: (compact ? "" : "actions used: ") + k + " / 6" + (compact ? " actions" : "") }, svg);
        if (k) ct.style.opacity = 0;
        counters.push(ct);
      }

      // ---- the trace
      var tx = compact ? 12 : 16, tagW = compact ? 44 : 52, rowH = 28, rGap = compact ? 8 : 7;
      var ty0 = by + (compact ? 20 : 18);
      var cX = tx + tagW, cW = W - cX - (compact ? 10 : 16);
      var rows = [
        ["think", "Need two dates. Start with the statue."],
        ["act", "search[Statue of Liberty]"],
        ["look", compact ? "“…dedicated on October 28, 1886…”" : "“…the statue was dedicated on October 28, 1886…”"],
        ["think", "1886. Now the Eiffel Tower."],
        ["act", "search[Eiffel Tower]"],
        ["look", compact ? "“…completed in March 1889…”" : "“…construction was completed in March 1889…”"],
        ["think", "1886 is before 1889: the statue is older."],
        ["act", compact ? "finish[Statue of Liberty, 1886]" : "finish[The Statue of Liberty (1886)]"]
      ];
      var els = rows.map(function (r, i) {
        var y = ty0 + i * (rowH + rGap), g = S("g", {}, svg);
        S("text", { x: tx, y: y + 18.5, class: "t t-sm" + (r[0] === "act" ? " t-orange" : r[0] === "look" ? " t-blue" : " t-muted"), "font-weight": 600, text: r[0] }, g);
        if (r[0] === "think") {
          S("text", { x: cX + 2, y: y + 18.5, class: "t t-sm", "font-style": "italic", text: r[1] }, g);
        } else {
          S("rect", { x: cX - 6, y: y, width: cW + 6, height: rowH, rx: 7, class: "f-surface", stroke: r[0] === "act" ? "var(--a-orange)" : "var(--a-blue)", "stroke-width": 1.5 }, g);
          S("text", { x: cX + 4, y: y + 18.5, class: "t t-sm" + (r[0] === "act" ? " t-mono" : ""), text: r[1] }, g);
        }
        g.style.opacity = 0;
        return g;
      });
      var stopY = ty0 + rows.length * (rowH + rGap) + 6;
      var stop = S("text", { x: tx, y: stopY + 14, class: "t t-sm t-orange", "font-weight": 700, text: compact ? "■ stop: finish called (3 of 6 actions)" : "■ stop: finish was called, after 3 of the 6 allowed actions" }, svg);
      stop.style.opacity = 0;

      function light(i, pos) {
        pills.forEach(function (p, j) {
          tl.to([p.hi, p.t], { opacity: j === i ? 1 : 0, duration: 0.2 }, pos);
          pos = "<";
          tl.to(p.b, { opacity: j === i ? 0 : 1, duration: 0.2 }, pos);
        });
      }
      function count(k) {
        tl.to(counters[k - 1], { opacity: 0, duration: 0.15 }, "+=0.02");
        tl.to(counters[k], { opacity: 1, duration: 0.2 }, "<");
      }

      tl.addLabel("s0", 0);
      light(0, "+=0.02"); tl.to(els[0], { opacity: 1, duration: 0.4 });
      tl.addLabel("s1");
      light(1, "+=0.02"); tl.to(els[1], { opacity: 1, duration: 0.4 }); count(1);
      tl.addLabel("s2");
      light(2, "+=0.02"); tl.to(els[2], { opacity: 1, duration: 0.4 });
      tl.addLabel("s3");
      light(0, "+=0.02"); tl.to(els[3], { opacity: 1, duration: 0.35 });
      light(1, "+=0.1"); tl.to(els[4], { opacity: 1, duration: 0.35 }); count(2);
      tl.addLabel("s4");
      light(2, "+=0.02"); tl.to(els[5], { opacity: 1, duration: 0.4 });
      tl.addLabel("s5");
      light(0, "+=0.02"); tl.to(els[6], { opacity: 1, duration: 0.35 });
      light(1, "+=0.1"); tl.to(els[7], { opacity: 1, duration: 0.35 }); count(3);
      tl.to(stop, { opacity: 1, duration: 0.3 });
      tl.addLabel("s6");
      return tl;
    }
  };
})();
