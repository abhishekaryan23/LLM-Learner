/* Capstone 3: the RAG agent with evals. All numbers are real output of cap-3-rag-agent.ipynb (offline stand-in model):
   BM25 top 3 for "How many days of leave do I get when I adopt a child?": leave-parental 5.015, leave-annual 4.368, leave-sick 2.685.
   v1 on 29 questions: recall@3 25/26 = 96.2%, correct 21/29 = 72.4%, faithful 25/27 = 92.6%.
   Dev error buckets (v1): wrong sentence 3, should abstain 1.
   v2 (synonyms + stemming): dev 10 -> 11 of 14 (2 fixed, 1 broken), test 11 -> 12 of 15 (1 fixed), recall@3 100%;
   paired b = 3, c = 1, n = 29: +6.9 pts, 95% CI [-6.4, +20.2]. */
(function () {
  var LC = window.LC;
  var NODES = ["Eval set", "Search", "Agent loop", "Answer", "Metrics", "Errors", "Improve"];

  LC.anims["cap-3-pipeline"] = {
    title: "The RAG agent, from eval set to improvement",
    steps: [
      "Write the <strong>eval set first</strong>: 29 questions about a fictional handbook, each with the section that answers it and keywords a right answer must contain; 3 have no answer in the handbook. Split it into <strong>dev</strong> and <strong>test</strong>.",
      "The agent's one tool, <strong>search_handbook</strong>, ranks the 18 sections with <strong>BM25</strong> and returns the top 3. For the adoption question, the right section comes first.",
      "The <strong>agent loop</strong>: the model reads the conversation and either calls a tool or answers. Tool results go back into the conversation, and the loop repeats, with a cap on the number of turns.",
      "The stand-in model copies the sentence that best matches the question, but here it picks the wrong one (\"adopt\" never matches \"adoptive\"), and cites the top hit, not the section its sentence came from.",
      "<strong>Metrics</strong> on all 29 questions: retrieval is nearly perfect (recall@3 96%), but only 72% of answers are correct, and 93% of cited answers are faithful to their citation.",
      "<strong>Error analysis</strong> on the dev split: 4 failures. Bucketing says where (3 wrong sentences, 1 missed abstention); reading them says why: two are vocabulary mismatches.",
      "<strong>One change</strong>: synonyms plus crude stemming. Re-run everything and read the flips: dev 10 → 11 (2 fixed, 1 broken), held-out test 11 → 12. Real progress, but with 29 questions the paired CI still includes zero."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 340 } : { w: 640, h: 296 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      var fs = compact ? " t-sm" : "";
      var nh = 30, pos = [];
      if (compact) {
        var nw = 76, gap = 12, x0 = (W - (4 * nw + 3 * gap)) / 2;
        for (var i = 0; i < 7; i++) {
          var rr = i < 4 ? 0 : 1, col = rr ? 7 - i : i;   // second row runs right to left
          pos.push({ x: x0 + col * (nw + gap), y: 24 + rr * 50, w: nw });
        }
      } else {
        var nw2 = 80, gap2 = 6, x02 = (W - (7 * nw2 + 6 * gap2)) / 2;
        for (var j = 0; j < 7; j++) pos.push({ x: x02 + j * (nw2 + gap2), y: 24, w: nw2 });
      }
      var PT = compact ? 138 : 90, L = compact ? 16 : 40, R = W - L;

      function arrow(x0, y0, x1, y1, cls, parent) {
        var a = Math.atan2(y1 - y0, x1 - x0), h = 6;
        var d = "M" + x0 + " " + y0 + "L" + x1 + " " + y1 +
          "M" + (x1 - h * Math.cos(a - 0.5)) + " " + (y1 - h * Math.sin(a - 0.5)) + "L" + x1 + " " + y1 +
          "L" + (x1 - h * Math.cos(a + 0.5)) + " " + (y1 - h * Math.sin(a + 0.5));
        return S("path", { d: d, class: cls || "s-faint", "stroke-width": 1.5 }, parent || svg);
      }
      for (var k = 0; k < 6; k++) {
        var p = pos[k], q = pos[k + 1];
        if (q.y > p.y) arrow(p.x + p.w / 2, p.y + nh + 2, q.x + q.w / 2, q.y - 2);
        else if (q.x > p.x) arrow(p.x + p.w + 1, p.y + nh / 2, q.x - 1, q.y + nh / 2);
        else arrow(p.x - 1, p.y + nh / 2, q.x + q.w + 1, q.y + nh / 2);
      }
      var act = [], done = [];
      NODES.forEach(function (n, i) {
        var p = pos[i];
        S("rect", { x: p.x, y: p.y, width: p.w, height: nh, rx: 9, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, svg);
        var dn = S("rect", { x: p.x, y: p.y, width: p.w, height: nh, rx: 9, class: "f-none", stroke: "var(--a-blue)", "stroke-width": 2 }, svg);
        var ac = S("rect", { x: p.x - 2, y: p.y - 2, width: p.w + 4, height: nh + 4, rx: 10, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 3 }, svg);
        dn.style.opacity = 0; ac.style.opacity = 0;
        S("text", { x: p.x + p.w / 2, y: p.y + 20, class: "t t-sm t-mid", text: n, "font-weight": 600 }, svg);
        act.push(ac); done.push(dn);
      });
      act[0].style.opacity = 1;

      function text(x, y, s, cls, parent, extra) {
        var a = { x: x, y: y, class: cls, text: s }; if (extra) for (var e in extra) a[e] = extra[e];
        return S("text", a, parent);
      }
      function title(s, g) { return text(W / 2, PT, s, "t t-mid" + fs, g, { "font-weight": 600 }); }
      var groups = [];
      function panel() { var g = S("g", {}, svg); groups.push(g); return g; }
      // horizontal bar with a label above and a value at its end
      function bar(y, frac, label, value, cls, g, maxW) {
        var bw = maxW || (R - L - 70);
        text(L, y, label, "t t-sm", g);
        S("rect", { x: L, y: y + 6, width: bw, height: 12, rx: 3, class: "f-faint", opacity: 0.45 }, g);
        S("rect", { x: L, y: y + 6, width: Math.max(2, bw * frac), height: 12, rx: 3, class: cls }, g);
        text(L + bw + 8, y + 17, value, "t t-sm", g, { "font-weight": 650 });
      }

      // s0: eval set
      var g0 = panel();
      title("29 questions, written before any code", g0);
      var rows0 = compact
        ? [["26", "answerable: expected section + keywords"], ["3", "not in the handbook: must say “I don't know”"], ["14 / 15", "dev (debug freely) / test (check once)"]]
        : [["26", "answerable: each with the section that answers it and keywords"], ["3", "not in the handbook: the right answer is “I don't know”"], ["14 / 15", "split: dev to debug on as much as you like / test to check once"]];
      rows0.forEach(function (r, i) {
        var y = PT + 32 + i * 28;
        text(L + 44, y, r[0], "t t-end", g0, { "font-weight": 700 });
        text(L + 54, y, r[1], "t t-sm", g0);
      });
      var ex = compact ? ["example: “How many days of leave do I get", "when I adopt a child?”"] : ["example: “How many days of leave do I get when I adopt a child?”"];
      ex.forEach(function (s, i) { text(W / 2, PT + 32 + 3 * 28 + 10 + i * 18, s, "t t-sm t-mid t-muted", g0); });

      // s1: search
      var g1 = panel();
      title(compact ? "BM25 search: the top 3 of 18" : "search_handbook(question): BM25 scores, top 3 of 18 sections", g1);
      [["leave-parental (expected)", 5.015, "f-blue"], ["leave-annual", 4.368, "f-faint"], ["leave-sick", 2.685, "f-faint"]].forEach(function (r, i) {
        bar(PT + 30 + i * 40, r[1] / 5.015, r[0], r[1].toFixed(2), r[2], g1, compact ? 240 : 420);
      });
      text(W / 2, PT + 30 + 3 * 40 + 6, "the right section is ranked first: a recall@3 hit", "t t-sm t-mid t-muted", g1);

      // s2: agent loop
      var g2 = panel();
      title("the agent loop", g2);
      var bw2 = compact ? 296 : 460, bx2 = compact ? L : (W - bw2) / 2 - 20, rh = 26, rg = 12;
      var msgs = [["user", compact ? "“How many days of leave … adopt?”" : "“How many days of leave do I get when I adopt a child?”"],
                  ["model", "calls search_handbook(query)"],
                  ["tool", compact ? "3 sections + scores, as JSON" : "returns 3 sections with scores, as JSON"],
                  ["model", compact ? "answers, citing [section-id]" : "answers in one sentence, citing [section-id]"]];
      var ys2 = [];
      msgs.forEach(function (m, i) {
        var y = PT + 16 + i * (rh + rg); ys2.push(y);
        S("rect", { x: bx2, y: y, width: bw2, height: rh, rx: 8, class: i === 0 ? "f-surface2" : "f-surface", stroke: i % 2 ? "var(--a-blue)" : "var(--line)", "stroke-width": 1.5 }, g2);
        text(bx2 + 10, y + 17, m[0], "t t-sm", g2, { "font-weight": 700 });
        text(bx2 + (compact ? 58 : 66), y + 17, m[1], "t t-sm", g2);
        if (i) arrow(bx2 + 30, y - rg + 1, bx2 + 30, y - 2, "s-faint", g2);
      });
      // loop arrow: tool row back up to the model row
      var lx = bx2 + bw2 + 8, lw = compact ? 18 : 26;
      var loop = S("path", { d: "M" + (bx2 + bw2 + 2) + " " + (ys2[2] + rh / 2) + "H" + (lx + lw) + "V" + (ys2[1] + rh / 2) + "H" + (bx2 + bw2 + 8), class: "s-orange", "stroke-width": 2 }, g2);
      var loopHead = arrow(bx2 + bw2 + 14, ys2[1] + rh / 2, bx2 + bw2 + 3, ys2[1] + rh / 2, "s-orange", g2);
      if (!compact) text(lx + lw + 8, (ys2[1] + ys2[2]) / 2 + rh / 2 + 4, "repeat", "t t-sm t-orange", g2);
      text(W / 2, ys2[3] + rh + 24, "stop when the model answers, or after 4 turns", "t t-sm t-mid t-muted", g2);

      // s3: the answer
      var g3 = panel();
      title("the stand-in's answer", g3);
      var ans = compact ? ["Full-time staff get 25 days of paid annual", "leave per year, plus public holidays.", "[leave-parental]"]
                        : ["Full-time staff get 25 days of paid annual leave per year,", "plus public holidays. [leave-parental]"];
      var bh3 = 14 + ans.length * 18;
      S("rect", { x: L, y: PT + 12, width: R - L, height: bh3, rx: 10, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, g3);
      ans.forEach(function (s, i) { text(L + 12, PT + 30 + i * 18, s, "t t-sm" + (s.charAt(0) === "[" ? " t-blue" : ""), g3); });
      var checks = compact
        ? [["✓ recall@3", "leave-parental was retrieved", ""], ["✗ correct", "needs “same entitlement”", " t-orange"], ["✗ faithful", "sentence is from leave-annual", " t-orange"]]
        : [["✓ recall@3", "the expected section, leave-parental, was retrieved", ""], ["✗ correct", "a right answer says “the same entitlement as birth parents”", " t-orange"], ["✗ faithful", "the sentence comes from leave-annual, not the cited section", " t-orange"]];
      checks.forEach(function (c, i) {
        var y = PT + 12 + bh3 + 28 + i * 24;
        text(L, y, c[0], "t t-sm" + c[2], g3, { "font-weight": 700 });
        text(L + (compact ? 88 : 96), y, c[1], "t t-sm", g3);
      });

      // s4: metrics
      var g4 = panel();
      title("v1 on all 29 questions", g4);
      [["recall@3 (retrieval)", 25 / 26, "96%  (25/26)", "f-blue"], ["correct (answers)", 21 / 29, "72%  (21/29)", "f-orange"], ["faithful (citations)", 25 / 27, "93%  (25/27)", "f-blue"]].forEach(function (r, i) {
        bar(PT + 30 + i * 40, r[1], r[0], r[2], r[3], g4, compact ? 230 : 420);
      });
      text(W / 2, PT + 30 + 3 * 40 + 6, "retrieval isn't the bottleneck: the reader is", "t t-sm t-mid t-muted", g4);

      // s5: errors
      var g5 = panel();
      title(compact ? "dev split: 4 of 14 fail" : "error analysis on the dev split: 4 of 14 questions fail", g5);
      var unit = compact ? 60 : 110;
      [["wrong sentence", 3], ["should abstain", 1]].forEach(function (r, i) {
        var y = PT + 30 + i * 40;
        text(L, y, r[0], "t t-sm", g5);
        S("rect", { x: L, y: y + 6, width: unit * r[1], height: 12, rx: 3, class: "f-orange" }, g5);
        text(L + unit * r[1] + 8, y + 17, String(r[1]), "t t-sm", g5, { "font-weight": 650 });
      });
      var reads = compact
        ? ["reading them says why:", "• 2 vocabulary: adopt/adoptive, text/SMS", "• 1 needs a comparison: 80 > 50 euros", "• “dog in the office?” got opening hours"]
        : ["reading them says why:", "• 2 vocabulary mismatches: adopt vs adoptive, text message vs SMS", "• 1 needs a comparison: a present worth 80 euros vs the 50-euro limit", "• “Can I bring my dog to the office?” was answered with opening hours"];
      reads.forEach(function (s, i) { text(L, PT + 30 + 80 + 8 + i * 20, s, "t t-sm" + (i ? "" : " t-muted"), g5); });

      // s6: improve
      var g6 = panel();
      title(compact ? "v2: synonyms + stemming" : "v2: add synonyms and stemming, then re-run everything", g6);
      var c2x = L + (compact ? 76 : 110);
      var rows6 = [["dev", "10 → 11 of 14  (2 fixed, 1 broken)"], ["test", "11 → 12 of 15  (1 fixed, held out)"], ["recall@3", "96% → 100%"], ["paired", "+6.9 points, 95% CI [−6, +20]"]];
      rows6.forEach(function (r, i) {
        var y = PT + 32 + i * 26;
        text(L, y, r[0], "t t-sm t-muted", g6, { "font-weight": 650 });
        text(c2x, y, r[1], "t t-sm", g6);
      });
      var fin = compact ? ["a real fix, not yet a proven gain:", "grow the eval set from real questions"] : ["a real fix, not yet a proven gain: grow the eval set from real questions"];
      fin.forEach(function (s, i) { text(W / 2, PT + 32 + 4 * 26 + 12 + i * 18, s, "t t-sm t-mid t-orange", g6, { "font-weight": 650 }); });

      groups.forEach(function (g, i) { if (i) g.style.opacity = 0; });
      tl.addLabel("s0", 0);
      for (var s = 1; s < 7; s++) {
        tl.to(act[s - 1], { opacity: 0, duration: 0.2 }, "+=0.02");
        tl.to(done[s - 1], { opacity: 1, duration: 0.2 }, "<");
        tl.to(act[s], { opacity: 1, duration: 0.3 }, "<");
        tl.to(groups[s - 1], { opacity: 0, duration: 0.25 }, "<");
        tl.to(groups[s], { opacity: 1, duration: 0.4 }, ">-0.05");
        if (s === 2) { LC.drawIn(tl, loop, { duration: 0.8 }); LC.popIn(tl, loopHead, { duration: 0.2 }); }
        tl.addLabel("s" + s);
      }
      return tl;
    }
  };
})();
