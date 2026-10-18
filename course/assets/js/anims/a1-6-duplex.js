/* A1.6: cascaded vs full-duplex timelines (illustrative budget from the lesson:
   endpoint 0.5 + ASR 0.1 + LLM 0.3 + TTS 0.15 + network 0.1 = 1.15 s; Moshi reports ~0.2 s). */
(function () {
  var LC = window.LC;
  var T1 = 3.4; // seconds shown

  LC.anims["a1-6-duplex"] = {
    title: "Cascade vs full-duplex, on a timeline",
    steps: [
      "Top: a <strong>cascaded</strong> assistant. You speak for 1.5 seconds.",
      "It can't know you're done until it hears silence, so it <strong>waits</strong> (here 0.5 s) before deciding your turn ended.",
      "Then the stages run in sequence: <strong>ASR</strong> finalizes the transcript, the <strong>LLM</strong> produces its first tokens, <strong>TTS</strong> makes the first audio (plus network time).",
      "The reply starts about <strong>1.15 s</strong> after you stopped, in this illustrative budget. People typically leave about 0.2 s.",
      "Bottom: a <strong>full-duplex</strong> model (Moshi-style) runs two streams all the time, yours and its own. It can even say “mm-hm” while you talk.",
      "With no endpointing wait, it can reply about <strong>0.2 s</strong> after you stop (Moshi's reported practical latency).",
      "If you <strong>cut in</strong>, it hears you on its input stream while it is speaking, and can stop and listen."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 340 } : { w: 640, h: 340 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var lx = compact ? 48 : 96, rx = W - (compact ? 12 : 20);
      function X(t) { return lx + t / T1 * (rx - lx); }
      var bh = 14, tl = gsap.timeline();
      function lbl(y, txt, cls) { return S("text", { x: lx - 8, y: y + 4, class: "t t-sm t-end " + (cls || ""), text: txt }, svg); }
      function bar(y, t0, t1, cls, text, white) {
        var g = S("g", {}, svg);
        var r = S("rect", { x: X(t0), y: y - bh / 2, width: 0, height: bh, rx: 3, class: cls }, g);
        var t = text ? S("text", { x: X(t0) + 5, y: y + 4, class: "t t-sm t-nohalo", style: white ? "fill:#fff" : "", text: text }, g) : null;
        return { g: g, r: r, t: t, w: X(t1) - X(t0) };
      }
      function grow(b, dur, pos) {
        b.g.style.opacity = 0;
        tl.set(b.g, { opacity: 1 }, pos);
        tl.fromTo(b.r, { attr: { width: 0 } }, { attr: { width: b.w }, duration: dur, ease: "none", immediateRender: false }, "<");
        if (b.t) { b.t.style.opacity = 0; tl.to(b.t, { opacity: 1, duration: 0.2 }); }
      }
      function axis(y) {
        S("line", { x1: lx, x2: rx, y1: y, y2: y, class: "s-axis" }, svg);
        [0, 1, 2, 3].forEach(function (s) { S("text", { x: X(s), y: y + 14, class: "t t-sm t-muted t-mid", text: s + (s === 3 ? " s" : "") }, svg); });
      }
      function bracket(y, t0, t1, text) {
        var g = S("g", {}, svg);
        S("path", { d: "M" + X(t0) + " " + (y - 5) + "V" + (y + 5) + "M" + X(t0) + " " + y + "H" + X(t1) + "M" + X(t1) + " " + (y - 5) + "V" + (y + 5), class: "s-orange", "stroke-width": 2 }, g);
        S("text", { x: (X(t0) + X(t1)) / 2, y: y + 18, class: "t t-sm t-orange t-mid", text: text }, g);
        g.style.opacity = 0;
        return g;
      }

      // ---- cascade panel
      S("text", { x: 4, y: 14, class: "t t-sm t-muted", text: compact ? "cascade" : "cascaded assistant (ASR → LLM → TTS)" }, svg);
      var ry = { you: 34, asr: 54, llm: 74, tts: 94, ai: 114 };
      lbl(ry.you, compact ? "you" : "user");
      lbl(ry.asr, "ASR"); lbl(ry.llm, "LLM"); lbl(ry.tts, "TTS"); lbl(ry.ai, compact ? "AI" : "assistant");
      axis(130);
      var you1 = bar(ry.you, 0, 1.5, "f-blue", "you speak", true);
      you1.r.setAttribute("width", you1.w); // visible from the start
      tl.addLabel("s0", 0);

      var wait = bar(ry.you, 1.5, 2.0, "f-faint", "wait");
      grow(wait, 0.6);
      tl.addLabel("s1");

      var asr = bar(ry.asr, 2.0, 2.1, "f-ink"), llm = bar(ry.llm, 2.1, 2.4, "f-ink"), tts = bar(ry.tts, 2.4, 2.55, "f-ink"), net = bar(ry.tts, 2.55, 2.65, "f-faint");
      grow(asr, 0.3); grow(llm, 0.5); grow(tts, 0.3); grow(net, 0.2);
      tl.addLabel("s2");

      var ai = bar(ry.ai, 2.65, T1, "f-orange", "reply", true);
      grow(ai, 0.6);
      var gap1 = bracket(150, 1.5, 2.65, compact ? "gap ≈ 1.15 s" : "gap ≈ 1.15 s after you stop");
      tl.to(gap1, { opacity: 1, duration: 0.3 });
      tl.addLabel("s3");

      // ---- full-duplex panel
      var p2 = S("g", {}, svg);
      var ry2 = { you: 210, model: 236 };
      S("text", { x: 4, y: 188, class: "t t-sm t-muted", text: compact ? "full-duplex" : "full-duplex speech model (Moshi-style)" }, p2);
      S("text", { x: lx - 8, y: ry2.you + 4, class: "t t-sm t-end", text: compact ? "you" : "user" }, p2);
      S("text", { x: lx - 8, y: ry2.model + 4, class: "t t-sm t-end", text: "model" }, p2);
      S("line", { x1: lx, x2: rx, y1: 276, y2: 276, class: "s-axis" }, p2);
      [0, 1, 2, 3].forEach(function (s) { S("text", { x: X(s), y: 290, class: "t t-sm t-muted t-mid", text: s + (s === 3 ? " s" : "") }, p2); });
      p2.style.opacity = 0;
      var stream = S("path", { d: "M" + lx + " " + ry2.model + "H" + rx, class: "s-faint", "stroke-width": 2 }, svg);
      tl.to(p2, { opacity: 1, duration: 0.3 });
      var you2 = bar(ry2.you, 0, 1.5, "f-blue", "you speak", true);
      grow(you2, 0.6);
      LC.drawIn(tl, stream, { duration: 0.6 }, "<");
      var bc = bar(ry2.model, 0.8, 1.0, "f-orange");
      grow(bc, 0.2);
      var bcT = S("text", { x: X(0.9), y: ry2.model + 24, class: "t t-sm t-orange t-mid", text: "mm-hm" }, svg);
      LC.popIn(tl, bcT, { duration: 0.3 });
      tl.addLabel("s4");

      var rep2 = bar(ry2.model, 1.7, T1, "f-orange", "reply", true);
      grow(rep2, 0.6);
      var gap2 = bracket(306, 1.5, 1.7, "≈ 0.2 s");
      tl.to(gap2, { opacity: 1, duration: 0.3 });
      tl.addLabel("s5");

      var cut = bar(ry2.you, 2.6, 3.2, "f-blue", "cut in", true);
      grow(cut, 0.5);
      tl.to(rep2.r, { attr: { width: X(2.75) - X(1.7) }, duration: 0.4 });
      var stopT = S("text", { x: X(2.75) + 6, y: ry2.model + 24, class: "t t-sm t-orange", text: "stops" }, svg);
      LC.popIn(tl, stopT, { duration: 0.3 });
      tl.addLabel("s6");
      return tl;
    }
  };
})();
