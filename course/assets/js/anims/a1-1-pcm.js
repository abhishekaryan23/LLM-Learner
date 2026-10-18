/* A1.1: from a waveform to PCM numbers, then why the sequence is so long.
   Signal over 2 ms: 0.62·sin(2π·1kHz·t) + 0.3·sin(2π·2.5kHz·t + 0.6), sampled at 16 kHz
   (32 samples), quantized to 3 bits (levels k/4, k = −4..3) for visibility. */
(function () {
  var LC = window.LC;
  function sig(tms) { return 0.62 * Math.sin(2 * Math.PI * 1 * tms) + 0.3 * Math.sin(2 * Math.PI * 2.5 * tms + 0.6); }
  var FS = 16, DUR = 2, N = FS * DUR; // kHz, ms, samples
  function q(v) { return Math.max(-4, Math.min(3, Math.round(v * 4))); }

  LC.anims["a1-1-pcm"] = {
    title: "From a sound wave to a list of numbers",
    steps: [
      "A microphone turns air pressure into a voltage that rises and falls: the <strong>waveform</strong>. This is 2 milliseconds of a sound made of two tones.",
      "<strong>Sampling:</strong> measure the wave at regular ticks. At 16 kHz that's one measurement every 62.5 µs, so these 2 ms give <strong>32 samples</strong>.",
      "<strong>Quantizing:</strong> round each sample to the nearest allowed level. With 3 bits there are only $2^3 = 8$ levels (grey lines), so the rounding is easy to see. Real audio uses 16 bits: 65,536 levels.",
      "Write down each sample's level and you have <strong>PCM</strong> (pulse-code modulation): just a list of integers. That list <em>is</em> the audio file.",
      "Data rate $=$ sample rate $\\times$ bits $\\times$ channels: $16{,}000 \\times 16 \\times 1 =$ <strong>256 kbit/s</strong>. One second of speech is 16,000 numbers.",
      "Text needs only about 3 tokens for that second, so models <strong>shorten audio first</strong>: about 100 log-mel frames per second, or 12.5–75 codec frames per second (A1.3)."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 344 } : { w: 640, h: 330 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, H = ctx.h, compact = ctx.layout === "compact";
      var m = compact ? { l: 34, r: 12, t: 62, b: 0 } : { l: 44, r: 20, t: 62, b: 0 };
      var plotB = 210;
      var pw = W - m.l - m.r;
      function sx(t) { return m.l + (t / DUR) * pw; }
      function sy(v) { return m.t + (1 - (v + 1.05) / 2.1) * (plotB - m.t); }
      var tl = gsap.timeline();
      var plot = S("g", {}, svg);

      // axes + labels (s0)
      S("text", { x: 4, y: 18, class: "t t-sm t-muted", text: "↑ amplitude" }, plot);
      S("line", { x1: m.l, x2: W - m.r, y1: sy(0), y2: sy(0), class: "s-grid" }, plot);
      S("path", { d: "M" + m.l + " " + (m.t - 4) + "V" + plotB, class: "s-axis" }, plot);
      [0, 1, 2].forEach(function (t) { S("text", { x: sx(t), y: plotB + 18, class: "t t-sm t-muted t-mid", text: t }, plot); });
      S("text", { x: sx(1.5), y: plotB + 18, class: "t t-sm t-muted t-mid", text: "time (ms) →" }, plot);
      S("text", { x: m.l - 6, y: sy(1) + 4, class: "t t-sm t-muted t-end", text: "+1" }, plot);
      S("text", { x: m.l - 6, y: sy(-1) + 4, class: "t t-sm t-muted t-end", text: "−1" }, plot);
      var wave = S("path", { d: LC.fnPath(sig, 0, DUR, sx, sy, 200), class: "s-blue", "stroke-width": 2.5 }, plot);
      tl.addLabel("s0", 0);

      // s1: samples (stems + dots)
      var stems = S("g", {}, plot), dots = [], vals = [];
      for (var i = 0; i < N; i++) {
        var t = i / FS, v = sig(t);
        vals.push(v);
        S("line", { x1: sx(t), x2: sx(t), y1: sy(0), y2: sy(v), class: "s-ink", "stroke-width": 1.2, opacity: 0.55 }, stems);
        dots.push(S("circle", { cx: sx(t), cy: sy(v), r: compact ? 3 : 3.5, class: "f-orange" }, plot));
      }
      var fsLbl = S("text", { x: W - m.r, y: 40, class: "t t-sm t-orange t-end", text: compact ? "16 kHz: 32 samples" : "sampled at 16 kHz: 32 samples in 2 ms" }, plot);
      stems.style.opacity = 0;
      tl.to(wave, { opacity: 0.35, duration: 0.4 });
      LC.popIn(tl, [stems, fsLbl], { duration: 0.4 }, "<");
      LC.popIn(tl, dots, { duration: 0.25, stagger: 0.02 }, "<0.1");
      tl.addLabel("s1");

      // s2: quantization levels; dots snap
      var lv = S("g", {}, plot);
      for (var k = -4; k <= 3; k++) S("line", { x1: m.l, x2: W - m.r, y1: sy(k / 4), y2: sy(k / 4), class: "s-faint", "stroke-width": 1 }, lv);
      plot.insertBefore(lv, wave);
      var qLbl = S("text", { x: W - m.r, y: (compact ? 266 : 264) - 22, class: "t t-sm t-muted t-end", text: "3 bits = 8 levels" }, plot);
      LC.popIn(tl, [lv, qLbl], { duration: 0.4 });
      tl.to(stems, { opacity: 0, duration: 0.3 }, "<");
      dots.forEach(function (d, i) { tl.to(d, { attr: { cy: sy(q(vals[i]) / 4) }, duration: 0.5, ease: "power2.inOut" }, i ? "<" : ">"); });
      tl.addLabel("s2");

      // s3: the integers
      var nShow = compact ? 9 : 14;
      var numY = compact ? 266 : 264;
      var listLbl = S("text", { x: 4, y: numY - 22, class: "t t-sm t-muted", text: compact ? "PCM: the file stores" : "PCM: what the file stores, one integer per sample" }, svg);
      var nums = vals.slice(0, nShow).map(function (v) { return String(q(v)).replace("-", "−"); }).join(", ") + ", …";
      var numT = S("text", { x: 4, y: numY, class: "t t-mono", text: "[" + nums + "]" }, svg);
      LC.popIn(tl, [listLbl, numT], { duration: 0.5 });
      tl.addLabel("s3");

      // s4: data rate
      var rateY = compact ? 308 : 306;
      var rate = S("text", { x: 4, y: rateY, class: "t t-lg", text: compact ? "16,000 × 16 bit × 1 =" : "16,000 samples/s × 16 bits × 1 channel = 256 kbit/s" }, svg);
      var rate2 = compact ? S("text", { x: 4, y: rateY + 24, class: "t t-lg t-orange", text: "256 kbit/s" }, svg) : null;
      LC.popIn(tl, [rate].concat(rate2 ? [rate2] : []), { duration: 0.5 });
      tl.addLabel("s4");

      // s5: sequence lengths per second of speech (log scale)
      var bars = S("g", {}, svg);
      bars.style.opacity = 0;
      var rows = [
        [compact ? "raw samples" : "raw samples (16 kHz)", 16000, "16,000", "f-orange"],
        [compact ? "log-mel frames" : "log-mel frames (10 ms hop)", 100, "100", "f-blue"],
        [compact ? "codec frames" : "codec frames (Mimi, A1.3)", 12.5, "12.5", "f-blue"],
        [compact ? "text tokens" : "text tokens (≈150 words/min)", 3, "≈ 3", "f-ink"]
      ];
      S("text", { x: 4, y: 18, class: "t t-sm t-muted", text: compact ? "positions per second (log scale)" : "positions per second of speech (log scale)" }, bars);
      var bx = compact ? 8 : 12, bmax = W - bx - (compact ? 56 : 70), rowH = compact ? 62 : 60, by0 = 58;
      rows.forEach(function (r, i) {
        var y = by0 + i * rowH, len = Math.max(6, (Math.log10(r[1]) + 0.3) / 4.5 * bmax);
        S("text", { x: bx, y: y, class: "t t-sm", text: r[0] }, bars);
        S("rect", { x: bx, y: y + 8, width: len, height: 18, rx: 4, class: r[3] }, bars);
        S("text", { x: bx + len + 8, y: y + 22, class: "t t-sm t-mono", text: r[2] }, bars);
      });
      tl.to([plot, listLbl, numT, rate].concat(rate2 ? [rate2] : []), { opacity: 0, duration: 0.4 });
      tl.to(bars, { opacity: 1, duration: 0.5 });
      tl.addLabel("s5");
      return tl;
    }
  };
})();
