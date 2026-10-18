/* H1.5: 2023–2026. Context windows are the published maximums at launch:
   GPT-3 2,048 tokens (2020), GPT-4 32K (2023), Claude 2.1 200K (Nov 2023), Gemini 1.5 Pro 1M (Feb 2024).
   Mixtral 8x7B: 8 experts, 2 per token. DeepSeek-V3: 671B total, 37B active per token.
   The reasoning curve is an illustrative sketch, not benchmark data. */
(function () {
  var LC = window.LC;
  LC.anims["h1-5-timeline"] = {
    title: "Today's landscape, 2023–2026",
    steps: [
      "<strong>2023.</strong> <strong>GPT-4</strong> (March) is far stronger than GPT-3.5 and accepts <strong>images</strong> as input. Within months, Anthropic's Claude and Google's Bard (later Gemini) join a race of chat assistants.",
      "<strong>2023 onward.</strong> <strong>Open-weight</strong> models you can download and run yourself: Meta's LLaMA (Feb 2023) and Llama 2, Mistral, Alibaba's Qwen, DeepSeek and others. The gap to the best closed models narrows.",
      "<strong>Mixture of experts.</strong> Mixtral 8×7B (Dec 2023) has 8 expert MLPs per layer and a router that sends each token to just <strong>2</strong>. DeepSeek-V3 (Dec 2024): 671B weights in total, only 37B used per token.",
      "<strong>Long context.</strong> How much text a model can read at once grows from 2,048 tokens (GPT-3) to <strong>1 million</strong> (Gemini 1.5, Feb 2024): whole codebases, books or hours of video. Note the log scale.",
      "<strong>2024.</strong> <strong>Natively multimodal</strong> models such as GPT-4o (May) and Gemini take text, images and audio into one network and can answer in speech, fast enough for natural back-and-forth conversation.",
      "<strong>2024–2025.</strong> <strong>Reasoning models</strong>: OpenAI's o1 (Sept 2024) and DeepSeek-R1 (Jan 2025) are trained with reinforcement learning to <strong>think before answering</strong>. More thinking tokens, better answers on hard problems (sketch).",
      "<strong>Agents.</strong> Models call <strong>tools</strong> (search, code, apps), read the results and keep going in a loop. Computer use and the Model Context Protocol (late 2024) and coding agents (2025) make this everyday practice.",
      "<strong>Video and sound.</strong> Sora (Feb 2024 preview) and Veo (May 2024) generate video from text; by 2025 Veo 3 and Sora 2 add synchronized sound. The field keeps moving fast: see <strong>What's new</strong> for the latest."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 316 } : { w: 640, h: 312 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact", cx = W / 2;
      var T = LC.h1.timeline(svg, ctx, {
        from: 2022.9, to: 2026.6, ticks: [2023, 2024, 2025, 2026],
        steps: [
          { year: "2023", text: "GPT-4 and the chat-assistant race", short: "GPT-4", dots: [2023.2] },
          { year: "2023", text: "Open weights: LLaMA, Mistral, Qwen, DeepSeek", short: "Open-weight models", dots: [2023.15, 2023.55] },
          { year: "2023", text: "Mixture of experts: Mixtral, DeepSeek-V3", short: "Mixture of experts", dots: [2023.95, 2024.98] },
          { year: "2024", text: "Long context: 1M tokens (Gemini 1.5)", short: "Long context", dots: [2024.12] },
          { year: "2024", text: "Natively multimodal: GPT-4o, Gemini", short: "Natively multimodal", dots: [2024.37] },
          { year: "2024", text: "Reasoning models: o1 and DeepSeek-R1", short: "Reasoning models", dots: [2024.7, 2025.05] },
          { year: "2025", text: "Agents: tools, computer use, coding", short: "Agents and tools", dots: [2024.9, 2025.5] },
          { year: "2025", text: "Video with sound: Sora, Veo", short: "Video generation", dots: [2024.13, 2025.4, 2025.75] }
        ]
      });
      var top = T.top, A = LC.h1.arrow, tl = gsap.timeline();
      var sc = [0, 1, 2, 3, 4, 5, 6, 7].map(function (k) { return LC.h1.scene(svg, k === 0); });
      function note(g, y, txt, cls) { return S("text", { x: cx, y: y, class: "t t-sm t-mid" + (cls ? " " + cls : ""), text: txt }, g); }

      // ---- scene 0: image + question → GPT-4 → answer
      var gptAns;
      (function (g) {
        var ix = compact ? 26 : 110, iy = top + 14, isz = 64;
        S("rect", { x: ix, y: iy, width: isz, height: isz, rx: 8, class: "f-surface2", stroke: "var(--line)", "stroke-width": 1.5 }, g);
        S("circle", { cx: ix + 46, cy: iy + 18, r: 8, class: "f-orange" }, g);
        S("path", { d: "M" + (ix + 6) + " " + (iy + 56) + "L" + (ix + 26) + " " + (iy + 30) + "L" + (ix + 40) + " " + (iy + 46) + "L" + (ix + 48) + " " + (iy + 38) + "L" + (ix + 60) + " " + (iy + 56) + "Z", class: "f-blue" }, g);
        S("text", { x: ix + isz / 2, y: iy + isz + 18, class: "t t-sm t-muted t-mid", text: "image" }, g);
        LC.h1.box(g, ix + isz + (compact ? 90 : 120), iy + 18, compact ? 140 : 180, 30, compact ? "“What's in it?”" : "“What's in this picture?”", { size: 12 });
        S("text", { x: ix + isz + (compact ? 90 : 120), y: iy + 56, class: "t t-sm t-muted t-mid", text: "text" }, g);
        var mx = cx, my = top + 120;
        A(g, ix + isz / 2, iy + isz + 26, mx - 40, my - 14, "s-ink", 6);
        A(g, ix + isz + (compact ? 90 : 120), iy + 62, mx + 10, my - 16, "s-ink", 6);
        LC.h1.box(g, mx, my, 110, 30, "GPT-4", { size: 13, weight: 600, stroke: "var(--a-blue)" });
        gptAns = S("text", { x: mx, y: my + 40, class: "t t-sm t-orange t-mid", text: "“A sun over blue mountains.”" }, g);
        note(g, top + 192, compact ? "2023: Claude, Bard/Gemini join the race" : "2023: Anthropic's Claude and Google's Bard (later Gemini) join the race", "t-muted");
      })(sc[0]);
      tl.addLabel("s0", 0);

      // ---- scene 1: closed vs open weights
      var openBoxes = [];
      (function (g) {
        var lx = compact ? 92 : 190, rx = compact ? 268 : 450, bw = compact ? 150 : 200;
        S("text", { x: lx, y: top + 8, class: "t t-sm t-mid", "font-weight": 600, text: "closed" }, g);
        S("text", { x: rx, y: top + 8, class: "t t-sm t-mid", "font-weight": 600, text: "open weights" }, g);
        LC.h1.box(g, lx, top + 46, bw, 44, compact ? ["use through an", "app or API"] : ["use it through", "an app or API"], { size: 12, fill: "f-surface2" });
        LC.h1.box(g, lx, top + 102, bw, 44, compact ? ["weights stay", "with the lab"] : ["the weights stay", "with the lab"], { size: 12, fill: "f-surface2" });
        ["LLaMA, Llama 2 (2023)", "Mistral, Mixtral (2023)", "Qwen, DeepSeek (2023–25)"].forEach(function (t, i) {
          var b = LC.h1.box(g, rx, top + 34 + i * 40, bw, 32, compact ? t.replace(" (2023)", "").replace(" (2023–25)", "") : t, { size: 12, stroke: "var(--a-orange)" });
          openBoxes.push(b);
        });
        note(g, top + 172, compact ? "download, run and fine-tune them yourself" : "download them, run them on your own hardware, fine-tune them");
        note(g, top + 194, compact ? "licences vary: read them" : "licences vary from fully open to restricted: read them", "t-muted");
      })(sc[1]);
      openBoxes.forEach(function (b) { b.style.opacity = 0; });
      LC.h1.swap(tl, sc[0], sc[1]); T.go(tl, 1);
      tl.to(openBoxes, { opacity: 1, duration: 0.3, stagger: 0.25 });
      tl.addLabel("s1");

      // ---- scene 2: MoE router
      var routes = [], lit = [];
      (function (g) {
        var tx = compact ? 44 : 120, ty = top + 80, rxp = compact ? 128 : 250;
        LC.h1.box(g, tx, ty, 62, 30, "token", { size: 12 });
        A(g, tx + 33, ty, rxp - 34, ty, "s-ink", 6);
        LC.h1.box(g, rxp, ty, 64, 30, "router", { size: 12, weight: 600, stroke: "var(--a-blue)" });
        var ex = compact ? 270 : 470, eh = 19, e0 = top + 8;
        for (var i = 0; i < 8; i++) {
          var ey = e0 + i * (eh + 3);
          S("rect", { x: ex - 40, y: ey, width: 80, height: eh, rx: 4, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.2 }, g);
          var on = i === 2 || i === 5;
          var L = S("rect", { x: ex - 40, y: ey, width: 80, height: eh, rx: 4, class: "f-orange" }, g);
          L.style.opacity = 0; if (on) lit.push(L);
          else L.remove();
          S("text", { x: ex, y: ey + 14, class: "t t-sm t-mid t-nohalo", "font-size": 12, style: on ? "fill:var(--a-paper)" : "", text: "expert " + (i + 1) }, g);
          if (on) routes.push(S("path", { d: "M" + (rxp + 33) + " " + ty + "C" + (rxp + 70) + " " + ty + " " + (ex - 80) + " " + (ey + eh / 2) + " " + (ex - 42) + " " + (ey + eh / 2), class: "s-orange", "stroke-width": 2.5 }, g));
        }
        note(g, top + 200, compact ? "only 2 of 8 experts run for this token" : "only 2 of 8 experts run for each token: big capacity, modest compute per token");
      })(sc[2]);
      LC.h1.swap(tl, sc[1], sc[2]); T.go(tl, 2);
      routes.forEach(function (r) { LC.drawIn(tl, r, { duration: 0.5 }, "<0.05"); });
      tl.to(lit, { opacity: 1, duration: 0.3 });
      tl.addLabel("s2");

      // ---- scene 3: context lengths, log scale
      var ctxBars = [];
      (function (g) {
        var x0 = compact ? 124 : 210, x1 = compact ? 300 : 500, lo = 3, hi = 6.3;
        function X(v) { return x0 + (Math.log10(v) - lo) / (hi - lo) * (x1 - x0); }
        var gy0 = top + 8, gy1 = top + 166;
        [[1e3, "1K"], [1e4, "10K"], [1e5, "100K"], [1e6, "1M"]].forEach(function (t) {
          S("line", { x1: X(t[0]), x2: X(t[0]), y1: gy0, y2: gy1, class: "s-grid" }, g);
          S("text", { x: X(t[0]), y: gy1 + 16, class: "t t-sm t-muted t-mid", text: t[1] }, g);
        });
        [["GPT-3 (2020)", 2048, "2K"], ["GPT-4 (2023)", 32768, "32K"], ["Claude 2.1 (2023)", 2e5, "200K"], ["Gemini 1.5 (2024)", 1e6, "1M"]].forEach(function (m, i) {
          var y = gy0 + 10 + i * 36;
          S("text", { x: x0 - 10, y: y + 17, class: "t t-sm t-end", text: compact ? m[0].replace(" (2020)", "").replace(" (2023)", "").replace(" (2024)", "") : m[0] }, g);
          var r = S("rect", { x: X(1e3), y: y + 2, width: 0, height: 22, rx: 3, class: i === 3 ? "f-orange" : "f-blue" }, g);
          var v = S("text", { x: X(m[1]) + 6, y: y + 17, class: "t t-sm t-mono", text: m[2] }, g);
          v.style.opacity = 0;
          ctxBars.push([r, X(m[1]) - X(1e3), v]);
        });
        note(g, top + 208, compact ? "max tokens per prompt, log scale" : "maximum tokens a model reads at once, log scale (each grid line 10×)", "t-muted");
      })(sc[3]);
      LC.h1.swap(tl, sc[2], sc[3]); T.go(tl, 3);
      ctxBars.forEach(function (b, i) {
        tl.to(b[0], { attr: { width: b[1] }, duration: 0.45, ease: "power2.out" }, i ? "<0.12" : undefined);
        tl.to(b[2], { opacity: 1, duration: 0.2 }, ">-0.1");
      });
      tl.addLabel("s3");

      // ---- scene 4: one model, many modalities
      var mmArrows = [];
      (function (g) {
        var inX = compact ? 50 : 130, outX = compact ? 310 : 510, mY = top + 74;
        var ins = ["text", "image", "audio"], outs = ["text", "speech"];
        LC.h1.box(g, cx, mY, compact ? 96 : 140, 46, compact ? ["one", "network"] : ["one network", "(GPT-4o, Gemini)"], { size: 12, weight: 600, stroke: "var(--a-blue)" });
        ins.forEach(function (t, i) {
          var y = top + 24 + i * 50;
          LC.h1.box(g, inX, y, 70, 28, t, { size: 12 });
          mmArrows.push(A(g, inX + 37, y, cx - (compact ? 50 : 72), mY + (i - 1) * 12, "s-blue", 6));
        });
        outs.forEach(function (t, i) {
          var y = top + 49 + i * 50;
          LC.h1.box(g, outX, y, 70, 28, t, { size: 12, stroke: "var(--a-orange)" });
          mmArrows.push(A(g, cx + (compact ? 50 : 72), mY + (i - 0.5) * 16, outX - 37, y, "s-orange", 6));
        });
        note(g, top + 186, compact ? "no separate speech-to-text step" : "no separate speech-to-text and text-to-speech steps: tone and timing survive");
        note(g, top + 208, compact ? "replies quick enough to converse" : "replies come quickly enough for a natural spoken conversation", "t-muted");
      })(sc[4]);
      mmArrows.forEach(function (a) { a[1].style.opacity = 0; });
      LC.h1.swap(tl, sc[3], sc[4]); T.go(tl, 4);
      mmArrows.forEach(function (a, i) { LC.drawIn(tl, a[0], { duration: 0.35 }, i ? "<0.08" : undefined); tl.to(a[1], { opacity: 1, duration: 0.1 }, ">-0.05"); });
      tl.addLabel("s4");

      // ---- scene 5: thinking tokens → accuracy (sketch)
      var rCurve, thinkBar;
      (function (g) {
        var bx = compact ? 24 : 70, by = top + 16, bwMax = compact ? 200 : 230;
        S("text", { x: bx, y: by, class: "t t-sm t-muted", text: "the model's output" }, g);
        S("rect", { x: bx, y: by + 10, width: bwMax, height: 24, rx: 4, class: "f-surface2" }, g);
        thinkBar = S("rect", { x: bx, y: by + 10, width: 0, height: 24, rx: 4, class: "f-blue", "fill-opacity": 0.6 }, g);
        S("text", { x: bx + 10, y: by + 27, class: "t t-sm", text: "thinking…" }, g);
        LC.h1.box(g, bx + bwMax + 40, by + 22, 64, 24, "answer", { size: 12, stroke: "var(--a-orange)" });
        var px = compact ? 64 : 400, py = compact ? top + 76 : top + 56, pw = compact ? 250 : 200, ph = compact ? 90 : 110;
        S("path", { d: "M" + px + " " + py + "V" + (py + ph) + "H" + (px + pw), class: "s-axis" }, g);
        S("text", { x: px - 6, y: py - 6, class: "t t-sm t-muted" + (compact ? "" : ""), text: "↑ accuracy on hard problems" }, g);
        S("text", { x: px + pw, y: py + ph + 16, class: "t t-sm t-muted t-end", text: "thinking tokens (log) →" }, g);
        rCurve = S("path", { d: LC.fnPath(function (u) { return 0.15 + 0.7 / (1 + Math.exp(-(u - 0.45) * 7)); }, 0, 1, function (u) { return px + 6 + u * (pw - 10); }, function (v) { return py + ph - v * ph; }, 40), class: "s-orange" }, g);
        if (!compact) {
          S("text", { x: 70, y: top + 110, class: "t t-sm", text: "o1 (Sept 2024): trained with RL" }, g);
          S("text", { x: 70, y: top + 132, class: "t t-sm", text: "DeepSeek-R1 (Jan 2025): open weights" }, g);
          S("text", { x: 70, y: top + 154, class: "t t-sm t-muted", text: "the curve is a sketch, not data" }, g);
        } else {
          note(g, top + 210, "o1 (2024), DeepSeek-R1 (2025); sketch", "t-muted");
        }
      })(sc[5]);
      LC.h1.swap(tl, sc[4], sc[5]); T.go(tl, 5);
      tl.to(thinkBar, { attr: { width: compact ? 200 : 230 }, duration: 0.8, ease: "none" });
      LC.drawIn(tl, rCurve, { duration: 0.8 });
      tl.addLabel("s5");

      // ---- scene 6: agent loop
      var loop = [];
      (function (g) {
        var mx = compact ? 90 : 220, tx = compact ? 270 : 430, y = top + 78;
        LC.h1.box(g, mx, y, compact ? 100 : 130, 40, compact ? ["model", "decides"] : ["model decides", "the next step"], { size: 12, weight: 600, stroke: "var(--a-blue)" });
        LC.h1.box(g, tx, y, compact ? 100 : 130, 40, compact ? ["tool runs", "(search, code)"] : ["tool runs", "(search, code, app)"], { size: 12, stroke: "var(--a-orange)" });
        var hw = compact ? 50 : 65;
        loop.push(S("path", { d: "M" + (mx + hw * 0.4) + " " + (y - 22) + "C" + (mx + 40) + " " + (y - 70) + " " + (tx - 40) + " " + (y - 70) + " " + (tx - hw * 0.4) + " " + (y - 22), class: "s-blue" }, g));
        loop.push(S("path", { d: "M" + (tx - hw * 0.4) + " " + (y + 22) + "C" + (tx - 40) + " " + (y + 70) + " " + (mx + 40) + " " + (y + 70) + " " + (mx + hw * 0.4) + " " + (y + 22), class: "s-orange" }, g));
        S("text", { x: (mx + tx) / 2, y: y - 66, class: "t t-sm t-blue t-mid", text: "call a tool" }, g);
        S("text", { x: (mx + tx) / 2, y: y + 80, class: "t t-sm t-orange t-mid", text: "read the result" }, g);
        note(g, top + 184, compact ? "repeat until the task is done" : "repeat until the task is done, then report back");
        note(g, top + 206, compact ? "computer use, MCP (2024); coding agents" : "computer use and MCP (late 2024); coding agents (2025)", "t-muted");
      })(sc[6]);
      LC.h1.swap(tl, sc[5], sc[6]); T.go(tl, 6);
      loop.forEach(function (p) { LC.drawIn(tl, p, { duration: 0.6 }); });
      tl.addLabel("s6");

      // ---- scene 7: film strip
      var fr = [];
      (function (g) {
        var n = compact ? 4 : 6, fw = compact ? 70 : 76, gap = 8, x0 = cx - (n * fw + (n - 1) * gap) / 2, y = top + 22, fh = 52;
        S("rect", { x: x0 - 8, y: y - 14, width: n * fw + (n - 1) * gap + 16, height: fh + 28, rx: 6, class: "f-ink" }, g);
        for (var k = 0; k < n; k++) {
          var fx = x0 + k * (fw + gap), f = S("g", {}, g);
          S("rect", { x: fx, y: y, width: fw, height: fh, rx: 3, class: "f-paper" }, f);
          S("circle", { cx: fx + 14 + k * (fw - 28) / (n - 1), cy: y + 18, r: 7, class: "f-orange" }, f);
          S("path", { d: "M" + fx + " " + (y + fh) + "L" + (fx + fw * 0.4) + " " + (y + 26) + "L" + (fx + fw) + " " + (y + fh) + "Z", class: "f-blue", "fill-opacity": 0.7 }, f);
          fr.push(f);
        }
        for (var h = 0; h < n * 3; h++) {
          var hx = x0 - 2 + h * ((n * fw + (n - 1) * gap) / (n * 3)) + 2;
          S("rect", { x: hx, y: y - 10, width: 6, height: 5, rx: 1, class: "f-paper" }, g);
          S("rect", { x: hx, y: y + fh + 5, width: 6, height: 5, rx: 1, class: "f-paper" }, g);
        }
        note(g, top + 112, compact ? "text → video: Sora, Veo (2024)" : "text → video: Sora (Feb 2024 preview), Veo (May 2024)");
        note(g, top + 134, compact ? "with synchronized sound by 2025" : "Veo 3 and Sora 2 (2025) add synchronized dialogue and sound", "t-muted");
        note(g, top + 168, compact ? "still moving fast: see What's new" : "the field still moves month by month: see What's new for the latest", "t-orange");
      })(sc[7]);
      fr.forEach(function (f) { f.style.opacity = 0; });
      LC.h1.swap(tl, sc[6], sc[7]); T.go(tl, 7);
      tl.to(fr, { opacity: 1, duration: 0.2, stagger: 0.15 });
      tl.addLabel("s7");
      return tl;
    }
  };
})();
