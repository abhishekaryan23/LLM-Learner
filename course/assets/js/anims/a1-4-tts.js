/* A1.4: two ways to turn text into speech.
   (1) front-end → acoustic model → mel spectrogram → vocoder → waveform;
   (2) VALL-E style codec LM: prompt tokens + phonemes → codebook 1 autoregressively →
       codebooks 2–8 in parallel passes → codec decoder → waveform. */
(function () {
  var LC = window.LC;
  function rnd(i, j) { var v = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453; return v - Math.floor(v); }
  function wave(x) { // x in [0,1]: three "words" with envelopes
    var env = 0;
    [[0.04, 0.26], [0.34, 0.58], [0.66, 0.96]].forEach(function (w) { if (x > w[0] && x < w[1]) env = Math.sin(Math.PI * (x - w[0]) / (w[1] - w[0])); });
    return env * (0.65 * Math.sin(2 * Math.PI * 38 * x) + 0.35 * Math.sin(2 * Math.PI * 91 * x + 1));
  }

  LC.anims["a1-4-tts"] = {
    title: "Text to speech, two ways",
    steps: [
      "Start with text. The classic neural pipeline has <strong>two stages</strong> after a text front-end.",
      "The <strong>front-end</strong> normalizes the text (2 → two) and converts it to <strong>phonemes</strong>. “read” is ambiguous (reed or red); here context says past tense.",
      "An <strong>acoustic model</strong> (Tacotron 2, or FastSpeech with predicted durations) turns phonemes into a <strong>mel spectrogram</strong>: 80 frames per second of 80 frequency bands.",
      "A <strong>vocoder</strong> (WaveNet, later HiFi-GAN) turns the spectrogram into a waveform. The voice is one the model was trained on.",
      "A <strong>codec language model</strong> (VALL-E) works on audio tokens instead. Its prompt: the phonemes plus the codec tokens of a <strong>3-second recording</strong> of the target voice (8 codebooks per frame).",
      "An <strong>autoregressive</strong> Transformer generates <strong>codebook 1</strong> one frame at a time, continuing the prompt. This step decides timing and intonation, and sampling makes each run a little different.",
      "A <strong>non-autoregressive</strong> model fills <strong>codebooks 2–8</strong>: one pass per codebook, all frames at once, each pass using the codebooks above it.",
      "The <strong>codec decoder</strong> turns all the tokens into a waveform, in a voice that sounds like the 3-second prompt."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 300 } : { w: 640, h: 322 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var tl = gsap.timeline(), cx = W / 2;
      var A = S("g", {}, svg), B = S("g", {}, svg);

      function arrow(g, y0, y1, label) {
        var p = S("path", { d: "M" + cx + " " + y0 + "V" + (y1 - 2) + "M" + (cx - 5) + " " + (y1 - 8) + "L" + cx + " " + (y1 - 2) + "L" + (cx + 5) + " " + (y1 - 8), class: "s-ink", "stroke-width": 1.8 }, g);
        var t = S("text", { x: cx + 12, y: (y0 + y1) / 2 + 4, class: "t t-sm t-muted", text: label }, g);
        return [p, t];
      }
      function waveform(g, y, h, cls) {
        var x0 = compact ? 30 : 120, x1 = W - x0;
        return S("path", { d: LC.fnPath(wave, 0, 1, function (x) { return x0 + x * (x1 - x0); }, function (v) { return y + h / 2 - v * h / 2; }, 400), class: cls, "stroke-width": 1.6 }, g);
      }

      // ---- Part A: two-stage pipeline
      S("text", { x: 8, y: 16, class: "t t-sm t-muted", text: compact ? "two-stage TTS" : "classic two-stage neural TTS" }, A);
      var bw = compact ? 190 : 230;
      S("rect", { x: cx - bw / 2, y: 28, width: bw, height: 28, rx: 8, class: "f-surface", stroke: "var(--a-ink)", "stroke-width": 1.2 }, A);
      S("text", { x: cx, y: 47, class: "t t-mid", text: "“I read 2 books.”" }, A);
      tl.addLabel("s0", 0);

      var a1 = arrow(A, 58, 82, "front-end");
      var pw = compact ? 240 : 300;
      var ph = S("g", {}, A);
      S("rect", { x: cx - pw / 2, y: 84, width: pw, height: 26, rx: 8, class: "f-surface", stroke: "var(--a-ink)", "stroke-width": 1.2 }, ph);
      S("text", { x: cx, y: 102, class: "t t-sm t-mono t-mid", text: "AY · R EH D · T UW · B UH K S" }, ph);
      LC.drawIn(tl, a1[0], { duration: 0.4 });
      LC.popIn(tl, [a1[1], ph], { duration: 0.4 });
      tl.addLabel("s1");

      var a2 = arrow(A, 112, 136, compact ? "acoustic model" : "acoustic model (Tacotron 2 / FastSpeech)");
      var cols = compact ? 26 : 36, rows = 8, cw = compact ? 11 : 10, chh = 8;
      var mx0 = cx - cols * cw / 2, mel = S("g", {}, A);
      for (var c = 0; c < cols; c++) for (var r = 0; r < rows; r++) {
        var band = Math.exp(-Math.pow(r - (5 + 1.5 * Math.sin(c / 3)), 2) / 3) + 0.6 * Math.exp(-Math.pow(r - (1.5 + Math.sin(c / 2)), 2) / 2);
        var gapc = (c % 9 === 8) ? 0.15 : 1;
        S("rect", { x: mx0 + c * cw, y: 140 + r * chh, width: cw - 1, height: chh - 1, class: "f-blue", "fill-opacity": (0.08 + 0.8 * Math.min(1, band * gapc * (0.7 + 0.3 * rnd(c, r)))).toFixed(2) }, mel);
      }
      LC.drawIn(tl, a2[0], { duration: 0.4 });
      LC.popIn(tl, [a2[1]], { duration: 0.3 });
      mel.style.opacity = 0;
      tl.to(mel, { opacity: 1, duration: 0.6 });
      tl.addLabel("s2");

      var a3 = arrow(A, 206, 230, compact ? "vocoder" : "vocoder (WaveNet / HiFi-GAN)");
      var wA = waveform(A, 236, 52, "s-blue");
      LC.drawIn(tl, a3[0], { duration: 0.4 });
      LC.popIn(tl, [a3[1]], { duration: 0.3 });
      LC.drawIn(tl, wA, { duration: 1 });
      tl.addLabel("s3");

      // ---- Part B: codec language model
      B.style.opacity = 0;
      S("text", { x: 8, y: 16, class: "t t-sm t-muted", text: compact ? "codec language model" : "codec language model (VALL-E style)" }, B);
      S("text", { x: 8, y: 38, class: "t t-sm t-mono", text: compact ? "text: AY R EH D T UW B UH K S" : "text phonemes: AY · R EH D · T UW · B UH K S" }, B);
      var nP = 4, nG = compact ? 14 : 20, cs = compact ? 15 : 18, gx0 = compact ? 46 : (W - (nP + nG) * cs - 14) / 2 + 20;
      var gy0 = 70, genX0 = gx0 + nP * cs + 14;
      S("text", { x: gx0, y: gy0 - 8, class: "t t-sm", text: compact ? "prompt" : "3 s prompt" }, B);
      S("text", { x: genX0, y: gy0 - 8, class: "t t-sm t-orange", text: "new speech →" }, B);
      S("text", { x: gx0 - 8, y: gy0 + cs - 4, class: "t t-sm t-end t-orange", text: "c1" }, B);
      S("text", { x: gx0 - 8, y: gy0 + 4.5 * cs + 4, class: "t t-sm t-end t-blue", text: "c2–8" }, B);
      for (var pr = 0; pr < 8; pr++) for (var pc = 0; pc < nP; pc++)
        S("rect", { x: gx0 + pc * cs, y: gy0 + pr * cs, width: cs - 2, height: cs - 2, rx: 2, class: "f-ink", "fill-opacity": (0.25 + 0.6 * rnd(pr, pc)).toFixed(2) }, B);
      var outline = S("rect", { x: genX0 - 2, y: gy0 - 2, width: nG * cs + 2, height: 8 * cs + 2, rx: 4, class: "f-none", stroke: "var(--a-faint)", "stroke-width": 1.2, "stroke-dasharray": "4 3" }, B);
      var gen = [];
      for (var gr = 0; gr < 8; gr++) {
        var rowCells = [];
        for (var gc = 0; gc < nG; gc++) {
          var cell = S("rect", { x: genX0 + gc * cs, y: gy0 + gr * cs, width: cs - 2, height: cs - 2, rx: 2, class: gr ? "f-blue" : "f-orange", "fill-opacity": (0.35 + 0.6 * rnd(gr + 9, gc)).toFixed(2) }, B);
          cell.style.opacity = 0;
          rowCells.push(cell);
        }
        gen.push(rowCells);
      }
      tl.to(A, { opacity: 0, duration: 0.4 });
      tl.to(B, { opacity: 1, duration: 0.4 });
      tl.addLabel("s4");

      var arT = S("text", { x: W - 8, y: gy0 + 8 * cs + 20, class: "t t-sm t-end t-orange", text: compact ? "c1: one frame per step" : "codebook 1: autoregressive, one frame per step" }, B);
      LC.popIn(tl, arT, { duration: 0.3 });
      tl.to(gen[0], { opacity: 1, duration: 0.12, stagger: 0.09 });
      tl.addLabel("s5");

      var narT = S("text", { x: W - 8, y: gy0 + 8 * cs + 20, class: "t t-sm t-end t-blue", text: compact ? "c2–8: one pass per row" : "codebooks 2–8: one parallel pass per codebook" }, B);
      narT.style.opacity = 0;
      tl.to(arT, { opacity: 0, duration: 0.2 });
      tl.to(narT, { opacity: 1, duration: 0.2 }, "<");
      for (var k = 1; k < 8; k++) tl.to(gen[k], { opacity: 1, duration: 0.25 });
      tl.addLabel("s6");

      var yA = gy0 + 8 * cs + 28;
      var a4 = arrow(B, yA, yA + 22, "codec decoder");
      var wB = waveform(B, yA + 26, 46, "s-orange");
      tl.to(narT, { opacity: 0, duration: 0.2 });
      LC.drawIn(tl, a4[0], { duration: 0.4 });
      LC.popIn(tl, [a4[1]], { duration: 0.3 });
      LC.drawIn(tl, wB, { duration: 1 });
      tl.addLabel("s7");
      return tl;
    }
  };
})();
