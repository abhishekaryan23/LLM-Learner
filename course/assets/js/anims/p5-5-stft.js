/* P5.5: from waveform to log-mel spectrogram, computed live (deterministic).
   Signal: fs = 8 kHz, 1.2 s. 0–0.4 s: 500 Hz (+ quiet 1 kHz overtone, amplitude ×0.1);
   0.4–0.8 s: 1.2 kHz (+ quiet 2.4 kHz); 0.8–1.2 s: chord 500 Hz + 2 kHz. 10 ms fades, tiny seeded noise.
   STFT: Hann window 25 ms (200 samples), hop 20 ms (160 samples) → 59 frames; 101 bins of 40 Hz (0–4 kHz).
   Views: linear magnitude in 40 rows of 100 Hz; the same in dB (60 dB range); 40 mel bands (HTK mel,
   triangular filters from 0 to 4 kHz) in dB. */
(function () {
  var LC = window.LC;
  var FS = 8000, DUR = 1.2, NW = 200, HOP = 160, NB = 101, NF = 59, ROWS = 40;
  var DATA = null;
  function mel(f) { return 2595 * Math.log10(1 + f / 700); }
  function imel(m) { return 700 * (Math.pow(10, m / 2595) - 1); }

  function compute() {
    if (DATA) return DATA;
    var n = Math.round(FS * DUR), x = new Float64Array(n), seed = 99;
    function rnd() { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 - 0.5; }
    function ramp(t, a, b) { var r = 0.01; if (t < a || t >= b) return 0; return Math.min(1, (t - a) / r, (b - t) / r); }
    for (var i = 0; i < n; i++) {
      var t = i / FS, s = 0, tw = 2 * Math.PI * t;
      var g1 = ramp(t, 0, 0.4), g2 = ramp(t, 0.4, 0.8), g3 = ramp(t, 0.8, 1.2);
      if (g1) s += g1 * (0.8 * Math.sin(tw * 500) + 0.08 * Math.sin(tw * 1000));
      if (g2) s += g2 * (0.8 * Math.sin(tw * 1200) + 0.08 * Math.sin(tw * 2400));
      if (g3) s += g3 * (0.6 * Math.sin(tw * 500) + 0.6 * Math.sin(tw * 2000));
      x[i] = s + 0.004 * rnd();
    }
    var win = [], C = [], Sn = [];
    for (var j = 0; j < NW; j++) win.push(0.5 - 0.5 * Math.cos(2 * Math.PI * j / (NW - 1)));
    for (var k = 0; k < NB; k++) { C.push([]); Sn.push([]); for (var j2 = 0; j2 < NW; j2++) { C[k].push(Math.cos(2 * Math.PI * k * j2 / NW)); Sn[k].push(Math.sin(2 * Math.PI * k * j2 / NW)); } }
    var pow = [];   // [frame][bin]
    for (var f = 0; f < NF; f++) {
      var p = new Float64Array(NB), o = f * HOP;
      for (var k2 = 0; k2 < NB; k2++) {
        var re = 0, im = 0;
        for (var j3 = 0; j3 < NW; j3++) { var v = x[o + j3] * win[j3]; re += v * C[k2][j3]; im -= v * Sn[k2][j3]; }
        p[k2] = re * re + im * im;
      }
      pow.push(p);
    }
    // 40 linear rows of 100 Hz; 40 mel bands
    var lin = [], melE = [], mlo = mel(0), mhi = mel(4000), pts = [];
    for (var q = 0; q < ROWS + 2; q++) pts.push(imel(mlo + (mhi - mlo) * q / (ROWS + 1)));
    for (var f2 = 0; f2 < NF; f2++) {
      var L = new Float64Array(ROWS), M = new Float64Array(ROWS);
      for (var k3 = 0; k3 < NB; k3++) {
        var hz = k3 * FS / NW, r = Math.min(ROWS - 1, Math.floor(hz / 100));
        L[r] += pow[f2][k3];
        for (var b = 0; b < ROWS; b++) {
          var lo = pts[b], c = pts[b + 1], hi = pts[b + 2], wgt = 0;
          if (hz > lo && hz <= c) wgt = (hz - lo) / (c - lo); else if (hz > c && hz < hi) wgt = (hi - hz) / (hi - c);
          if (wgt > 0) M[b] += wgt * pow[f2][k3];
        }
      }
      lin.push(L); melE.push(M);
    }
    function norm(A, db) {
      var mx = 0; A.forEach(function (row) { row.forEach(function (v) { mx = Math.max(mx, v); }); });
      return A.map(function (row) {
        return Array.prototype.map.call(row, function (v) {
          if (!db) return Math.sqrt(v / mx);   // magnitude, 0..1
          var d = 10 * Math.log10((v + 1e-12) / mx);
          return Math.max(0, Math.min(1, (d + 60) / 60));
        });
      });
    }
    DATA = { x: x, lin: norm(lin, false), log: norm(lin, true), mel: norm(melE, true), pts: pts };
    return DATA;
  }

  LC.anims["p5-5-stft"] = {
    title: "From waveform to log-mel spectrogram",
    steps: [
      "A 1.2-second clip sampled at 8 kHz: a low note, a higher note, then a two-note chord. The <strong>waveform</strong> shows loudness over time, but not which frequencies are playing.",
      "Cut out a short <strong>window</strong> (25 ms = 200 samples), taper its ends with a Hann window, and take its Fourier transform. The result is one column: energy at each frequency, darker = more.",
      "Move along by the <strong>hop</strong> (here 20 ms) and repeat for the next column. Hops shorter than the window make neighbouring windows overlap.",
      "All 59 columns side by side make a <strong>spectrogram</strong>: time runs right, frequency runs up. Each note is a horizontal stripe; the chord is two stripes at once.",
      "Colour by the <strong>log</strong> of the energy (decibels) instead. Quiet detail appears: faint overtones at twice each note's frequency, and splashes where notes start and stop.",
      "Finally pool the frequencies into 40 <strong>mel</strong> bands, narrow at low frequencies and wide at high ones, roughly like the ear. This <strong>log-mel spectrogram</strong> is the input to speech models such as Whisper."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 318 } : { w: 640, h: 300 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact", W = ctx.w, D = compute();
      var G = compact ? { l: 40, r: 12, wy: 26, wh: 56, ty: 112, hy: 124, hh: 160 } : { l: 60, r: 20, wy: 26, wh: 56, ty: 112, hy: 124, hh: 144 };
      var pw = W - G.l - G.r;
      function tx(t) { return G.l + t / DUR * pw; }
      var tl = gsap.timeline();
      S("text", { x: 4, y: 16, class: "t t-sm t-muted", text: "waveform" }, svg);
      // waveform envelope, one vertical stroke per x unit
      var d = "", step = Math.max(1, Math.floor(D.x.length / pw)), wmid = G.wy + G.wh / 2;
      for (var px = 0; px < pw; px++) {
        var a = Math.floor(px / pw * D.x.length), b = Math.min(D.x.length, a + step), lo = 0, hi = 0;
        for (var i = a; i < b; i++) { lo = Math.min(lo, D.x[i]); hi = Math.max(hi, D.x[i]); }
        d += "M" + (G.l + px + 0.5) + " " + (wmid - hi * G.wh / 2.6).toFixed(1) + "V" + (wmid - lo * G.wh / 2.6 + 0.5).toFixed(1);
      }
      S("path", { d: d, class: "s-blue", "stroke-width": 1, "stroke-linecap": "butt" }, svg);
      var win = S("rect", { x: tx(0), y: G.wy - 4, width: Math.max(3, tx(NW / FS) - tx(0)), height: G.wh + 8, rx: 2, class: "f-orange", "fill-opacity": 0.25, stroke: "var(--a-orange)", "stroke-width": 2 }, svg);
      win.style.opacity = 0;

      // heatmap frame + labels
      S("text", { x: 4, y: G.ty, class: "t t-sm t-muted", text: "frequency (Hz) ↑" }, svg);
      var modes = ["linear energy", "log energy (dB)", "log-mel, 40 bands"].map(function (t, k) {
        var e = S("text", { x: W - G.r, y: G.ty, class: "t t-sm t-end" + (k ? " t-orange" : " t-muted"), "font-weight": k ? 650 : 400, text: t }, svg);
        e.style.opacity = 0; return e;
      });
      S("rect", { x: G.l, y: G.hy, width: pw, height: G.hh, class: "f-surface2", "fill-opacity": 0.6 }, svg);
      var cw = tx(HOP / FS) - tx(0), rh = G.hh / ROWS;
      function heat(V, perCol) {
        var root = S("g", {}, svg), cols = [];
        for (var f = 0; f < NF; f++) {
          var g = perCol ? S("g", {}, root) : root;
          for (var r = 0; r < ROWS; r++) {
            var v = V[f][r]; if (v < 0.04) continue;
            S("rect", { x: (tx(f * HOP / FS)).toFixed(2), y: (G.hy + G.hh - (r + 1) * rh).toFixed(2), width: (cw + 0.3).toFixed(2), height: (rh + 0.3).toFixed(2), class: "f-blue", "fill-opacity": v.toFixed(2) }, g);
          }
          if (perCol) { g.style.opacity = 0; cols.push(g); }
        }
        if (!perCol) root.style.opacity = 0;
        return perCol ? cols : root;
      }
      var LIN = heat(D.lin, true), LOG = heat(D.log, false), MEL = heat(D.mel, false);
      // y labels: linear Hz and mel positions
      function yl(fracs, labels) {
        var g = S("g", {}, svg);
        fracs.forEach(function (fr, k) { S("text", { x: G.l - 5, y: G.hy + G.hh - fr * G.hh + 4, class: "t t-sm t-muted t-end", text: labels[k] }, g); });
        return g;
      }
      var ylin = yl([0, 0.25, 0.5, 0.75, 1], ["0", "1k", "2k", "3k", "4k"]);
      var mf = function (f) { return (mel(f) - mel(0)) / (mel(4000) - mel(0)); };
      var ymel = yl([0, mf(500), mf(1000), mf(2000), 1], ["0", "500", "1k", "2k", "4k"]);
      ymel.style.opacity = 0;
      [[0, "0", "t-mid"], [0.6, "0.6 s", "t-mid"], [1.2, "1.2 s", "t-end"]].forEach(function (p) { S("text", { x: tx(p[0]), y: G.hy + G.hh + 16, class: "t t-sm t-muted " + p[2], text: p[1] }, svg); });
      var st = { f: 0 };
      function place() { win.setAttribute("x", tx(Math.round(st.f) * HOP / FS)); }
      tl.addLabel("s0", 0);

      // s1: first window → first column
      LC.popIn(tl, [win, modes[0]], { duration: 0.4 });
      LC.popIn(tl, LIN[0], { duration: 0.4 });
      tl.addLabel("s1");
      // s2: hop
      tl.to(st, { f: 1, duration: 0.5, onUpdate: place });
      LC.popIn(tl, LIN[1], { duration: 0.3 });
      tl.addLabel("s2");
      // s3: all columns
      tl.to(st, { f: NF - 1, duration: 2.0, ease: "none", onUpdate: place });
      tl.to(LIN.slice(2), { opacity: 1, duration: 0.05, stagger: 2.0 / (NF - 2) }, "<");
      tl.to(win, { opacity: 0, duration: 0.3 });
      tl.addLabel("s3");
      // s4: log
      tl.to(LIN, { opacity: 0, duration: 0.5 });
      tl.to(LOG, { opacity: 1, duration: 0.5 }, "<");
      tl.to(modes[0], { opacity: 0, duration: 0.3 }, "<");
      tl.to(modes[1], { opacity: 1, duration: 0.3 });
      tl.addLabel("s4");
      // s5: mel
      tl.to([LOG, ylin, modes[1]], { opacity: 0, duration: 0.5 });
      tl.to([MEL, ymel, modes[2]], { opacity: 1, duration: 0.5 }, "<");
      tl.addLabel("s5");
      return tl;
    }
  };
})();
