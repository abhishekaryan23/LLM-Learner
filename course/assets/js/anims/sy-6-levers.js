/* SY.6: three levers on one support-bot question ("How much is the Pro plan?").
   Prompting and RAG change what the model READS (slots in the context window);
   fine-tuning changes what the model IS (its weights, here a LoRA adapter).
   Then a price changes (49 → 59): retrieval picks it up at once, weights don't. */
(function () {
  var LC = window.LC;

  LC.anims["sy-6-levers"] = {
    title: "Three levers: what each one changes",
    steps: [
      "A user asks a support bot: <em>How much is the Pro plan?</em> The base model reads only the question, so it gives a <strong>generic answer</strong> and may invent a price.",
      "<strong>Prompting:</strong> instructions and a few examples go into the context window. Tone and format improve at once, but the model still doesn't know your price. Every query pays for these tokens.",
      "<strong>RAG:</strong> a retriever finds the right passage in your docs and pastes it in. Now the answer is correct and can <strong>cite its source</strong>. The weights are untouched.",
      "<strong>Fine-tuning</strong> changes the weights instead (here a small LoRA adapter, <a href=\"m3-7.html\">M3.7</a>). The style is now built in, so the instructions and examples can shrink to a line. Facts still come from retrieval.",
      "The price changes to 59. <strong>RAG</strong> sees it as soon as the index is updated, minutes later. A model that had <em>memorised</em> 49 in training would keep saying 49 until you retrain it.",
      "The common combination: a <strong>short prompt</strong>, <strong>retrieval</strong> for facts, and <strong>fine-tuning</strong> only for behaviour, style or a smaller, cheaper model. Prompt and RAG change what it reads; fine-tuning changes what it is."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 440 } : { w: 640, h: 340 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      if (compact) svg = S("g", { transform: "translate(0,22)" }, svg);

      // geometry
      var cw = compact ? { x: 8, y: 8, w: 344, h: 196 } : { x: 8, y: 8, w: 400, h: 218 };
      var mb = compact ? { x: 8, y: 232, w: 344, h: 70 } : { x: 444, y: 46, w: 188, h: 120 };
      var sx = cw.x + 12, sw = cw.w - 24, sh = compact ? 30 : 34, sg = compact ? 8 : 10, sy0 = cw.y + 36;
      var ay = compact ? 330 : 258, ny = compact ? 404 : 312;

      // context window
      S("rect", { x: cw.x, y: cw.y, width: cw.w, height: cw.h, rx: 12, class: "f-none", stroke: "var(--a-ink)", "stroke-width": 1.5 }, svg);
      S("text", { x: cw.x + 14, y: cw.y + 22, class: "t t-sm t-muted", "font-weight": 600, text: "context window: what the model reads" }, svg);
      function slot(i, label, cls) {
        var y = sy0 + i * (sh + sg), g = S("g", {}, svg);
        var r = S("rect", { x: sx, y: y, width: sw, height: sh, rx: 8, class: "f-surface", stroke: cls === "o" ? "var(--a-orange)" : cls === "b" ? "var(--a-blue)" : "var(--line)", "stroke-width": 1.5 }, g);
        var t = S("text", { x: sx + 12, y: y + sh / 2 + 4.5, class: "t t-sm", text: label }, g);
        return { g: g, r: r, t: t, y: y };
      }
      var sIns = slot(0, compact ? "instructions: tone, format, rules" : "instructions: tone, format, rules (≈ 1,500 tokens)", "o");
      var sEx = slot(1, compact ? "examples: 5 ideal replies" : "examples: 5 ideal replies (≈ 2,500 tokens)", "o");
      var sRag = slot(2, compact ? "retrieved: “Pro plan: 49/month” [doc 2]" : "retrieved passage: “Pro plan: 49 per month” [doc 2]", "b");
      var sQ = slot(3, "question: How much is the Pro plan?", "");
      // shortened instruction slot (after fine-tuning) and the updated passage (after the price change)
      var sInsShort = S("text", { x: sx + 12, y: sIns.y + sh / 2 + 4.5, class: "t t-sm", text: compact ? "one line of instructions" : "one line of instructions (≈ 50 tokens)" }, svg);
      var sRag59 = S("text", { x: sx + 12, y: sRag.y + sh / 2 + 4.5, class: "t t-sm", text: compact ? "retrieved: “Pro plan: 59/month” [doc 2]" : "retrieved passage: “Pro plan: 59 per month” [doc 2]" }, svg);
      var sExGone = S("text", { x: sx + 12, y: sEx.y + sh / 2 + 4.5, class: "t t-sm t-muted", "font-style": "italic", text: compact ? "examples: now learned in the weights" : "examples: no longer needed, learned in the weights" }, svg);
      [sIns.g, sEx.g, sRag.g, sInsShort, sRag59, sExGone].forEach(function (e) { e.style.opacity = 0; });

      // model box
      S("rect", { x: mb.x, y: mb.y, width: mb.w, height: mb.h, rx: 12, class: "f-ink" }, svg);
      S("text", { x: mb.x + 14, y: mb.y + 24, class: "t t-sm t-nohalo", "font-weight": 600, style: "fill: var(--a-paper)", text: "model weights: what it is" }, svg);
      var ad = compact ? { x: mb.x + 14, y: mb.y + 34, w: 150, h: 26 } : { x: mb.x + 14, y: mb.y + 44, w: 160, h: 28 };
      var adG = S("g", {}, svg);
      S("rect", { x: ad.x, y: ad.y, width: ad.w, height: ad.h, rx: 8, class: "f-orange" }, adG);
      S("text", { x: ad.x + ad.w / 2, y: ad.y + ad.h / 2 + 4.5, class: "t t-sm t-mid t-nohalo", "font-weight": 600, style: "fill:#fff", text: "+ LoRA adapter" }, adG);
      adG.style.opacity = 0;
      var smallT = S("text", { x: compact ? ad.x + ad.w + 12 : mb.x + 14, y: compact ? ad.y + 17.5 : ad.y + ad.h + 26, class: "t t-sm t-nohalo", style: "fill: var(--a-paper)", text: compact ? "small, fast model" : "small, fast model" }, svg);
      smallT.style.opacity = 0;
      // arrow from window to model
      var arr = compact
        ? S("path", { d: "M180 " + (cw.y + cw.h + 4) + "V" + (mb.y - 6) + "m-5 -6l5 6l5 -6", class: "s-faint", "stroke-width": 2, fill: "none" }, svg)
        : S("path", { d: "M" + (cw.x + cw.w + 4) + " " + (mb.y + mb.h / 2) + "H" + (mb.x - 6) + "m-6 -5l6 5l-6 5", class: "s-faint", "stroke-width": 2, fill: "none" }, svg);
      void arr;

      // answer row
      S("text", { x: 8, y: ay - 8, class: "t t-sm t-muted", "font-weight": 600, text: "answer" }, svg);
      S("rect", { x: 8, y: ay, width: W - 16, height: compact ? 54 : 36, rx: 8, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, svg);
      var answers = compact ? [
        ["“Our Pro plan is great value! It costs", "about 30 a month.” (invented)"],
        ["“Hi! The Pro plan costs 30 per month.”", "Nice tone, still invented."],
        ["“Hi! The Pro plan costs 49 per month", "[doc 2].” Correct and cited."],
        ["“Hi! The Pro plan costs 49 per month", "[doc 2].” Same, shorter prompt."],
        ["“Hi! The Pro plan costs 59 per month", "[doc 2].” Updated at once."],
        ["Right facts, house style, short prompt,", "small model: cheap and fast."]
      ] : [
        ["“Our Pro plan is great value! It costs about 30 a month.” (invented)"],
        ["“Hi! The Pro plan costs 30 per month.” Nice tone, still invented."],
        ["“Hi! The Pro plan costs 49 per month [doc 2].” Correct and cited."],
        ["“Hi! The Pro plan costs 49 per month [doc 2].” Same, far shorter prompt."],
        ["“Hi! The Pro plan costs 59 per month [doc 2].” Updated at once."],
        ["Right facts, house style, short prompt, small model: cheap and fast."]
      ];
      var aEls = answers.map(function (lines, i) {
        var g = S("g", {}, svg);
        lines.forEach(function (t, j) { S("text", { x: 20, y: ay + (compact ? 22 + j * 19 : 23), class: "t t-sm", text: t }, g); });
        if (i) g.style.opacity = 0;
        return g;
      });
      // note about stale weights (step 4)
      var note = S("text", { x: 8, y: ny, class: "t t-sm t-orange", "font-weight": 600, text: compact ? "Facts trained into weights: stale till retrained" : "A model that memorised “49” in training would stay stale until retrained." }, svg);
      note.style.opacity = 0;

      function swap(i, pos) { tl.to(aEls[i - 1], { opacity: 0, duration: 0.2 }, pos); tl.to(aEls[i], { opacity: 1, duration: 0.3 }); }

      tl.addLabel("s0", 0);
      LC.popIn(tl, [sIns.g, sEx.g], { duration: 0.45, stagger: 0.15 }, "+=0.02");
      swap(1);
      tl.addLabel("s1");
      LC.popIn(tl, [sRag.g], { duration: 0.45 }, "+=0.02");
      swap(2);
      tl.addLabel("s2");
      tl.to(adG, { opacity: 1, duration: 0.45 }, "+=0.02");
      tl.to(sEx.r, { opacity: 0.35, duration: 0.4 });
      tl.to(sIns.t, { opacity: 0, duration: 0.25 }, "<");
      tl.to(sInsShort, { opacity: 1, duration: 0.3 });
      tl.to(sEx.t, { opacity: 0, duration: 0.2 }, "<");
      tl.to(sExGone, { opacity: 1, duration: 0.3 });
      swap(3);
      tl.addLabel("s3");
      tl.to(sRag.t, { opacity: 0, duration: 0.2 }, "+=0.02");
      tl.to(sRag59, { opacity: 1, duration: 0.35 });
      swap(4);
      tl.to(note, { opacity: 1, duration: 0.3 });
      tl.addLabel("s4");
      tl.to(note, { opacity: 0, duration: 0.2 }, "+=0.02");
      tl.to(smallT, { opacity: 1, duration: 0.3 });
      swap(5);
      tl.addLabel("s5");
      return tl;
    }
  };
})();
