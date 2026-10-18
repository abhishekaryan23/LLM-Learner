/* VD.1 playground: how many tokens is a video, and what does attention over them cost?
   frames T = round(seconds × fps); raw bytes = T·H·W·3 (8-bit RGB)
   One token covers ft frames and an s×s pixel square (ft and s already include any
   VAE compression times the transformer's patch size, e.g. VAE 4×8×8 + 2×2 patch → ft 4, s 16).
   time steps Tt = ceil(T / ft); places per step P = ceil(H/s)·ceil(W/s); tokens n = Tt·P.
   Full space-time attention: n² pairs (per head, per layer).
   Divided space-time attention (TimeSformer): n·(P + Tt) pairs. */
(function () {
  var LC = window.LC;
  var FPS = [8, 12, 16, 24, 30, 60];
  var RES = [["360p", 640, 360], ["480p", 854, 480], ["720p", 1280, 720], ["1080p", 1920, 1080], ["4K", 3840, 2160]];
  var FT = [1, 2, 4, 8, 16];
  var SP = [8, 16, 32, 64];
  var TEXT_CTX = 32768;
  var LOG0 = 2, LOG1 = 16;
  var SUP = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻" };
  function sup(n) { return String(n).split("").map(function (c) { return SUP[c]; }).join(""); }
  function sci(v) {
    if (v < 1e6) return Math.round(v).toLocaleString("en-US");
    var e = Math.floor(Math.log10(v)), m = v / Math.pow(10, e);
    if (m >= 9.95) { m /= 10; e += 1; }
    return m.toFixed(1) + "×10" + sup(e);
  }
  function bytes(b) {
    if (b >= 1e9) return (b / 1e9).toFixed(1) + " GB";
    if (b >= 1e6) return (b / 1e6).toFixed(1) + " MB";
    return (b / 1e3).toFixed(0) + " kB";
  }
  function times(v) { return v >= 10 ? Math.round(v).toLocaleString("en-US") : v.toFixed(1); }

  function init(root) {
    var stage = root.querySelector(".pg-stage");
    var inp = {}, outs = {};
    ["dur", "fps", "res", "ft", "sp"].forEach(function (k) {
      inp[k] = root.querySelector('input[data-k="' + k + '"]');
      outs[k] = root.querySelector('output[data-k="' + k + '"]');
    });
    var readout = root.querySelector(".pg-readout");
    var layout = null;

    function state() {
      var r = RES[+inp.res.value];
      return { dur: +inp.dur.value, fps: FPS[+inp.fps.value], name: r[0], W: r[1], H: r[2], ft: FT[+inp.ft.value], s: SP[+inp.sp.value] };
    }

    function draw() {
      var st = state();
      outs.dur.textContent = st.dur + " s";
      outs.fps.textContent = st.fps;
      outs.res.textContent = st.name + " (" + st.W + "×" + st.H + ")";
      outs.ft.textContent = st.ft;
      outs.sp.textContent = st.s + "×" + st.s;
      root.querySelectorAll("[data-preset]").forEach(function (c) {
        var p = c.dataset.preset.split(",").map(Number);
        c.setAttribute("aria-pressed", String(p[0] === st.ft && p[1] === st.s));
      });

      var T = Math.round(st.dur * st.fps), raw = T * st.W * st.H * 3;
      var Tt = Math.ceil(T / st.ft), P = Math.ceil(st.H / st.s) * Math.ceil(st.W / st.s), n = Tt * P;
      var full = n * n, div = n * (P + Tt);

      layout = stage.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact";
      var Wd = compact ? 360 : 640, H = 210, S = LC.svg;
      var left = 12, right = Wd - 14, sc = (right - left) / (LOG1 - LOG0);
      function xOf(v) { return left + Math.max(0, Math.min(LOG1 - LOG0, Math.log10(Math.max(v, 1)) - LOG0)) * sc; }
      var rows = [
        { lbl: "tokens: " + n.toLocaleString("en-US"), v: n, cls: "f-ink" },
        { lbl: (compact ? "divided attention: " : "divided space-time attention: ") + sci(div) + " pairs", v: div, cls: "f-blue" },
        { lbl: (compact ? "full attention: " : "full space-time attention: ") + sci(full) + " pairs", v: full, cls: "f-orange" }
      ];
      var svg = S("svg", { viewBox: "0 0 " + Wd + " " + H, role: "img",
        "aria-label": "Log-scale bars: " + n.toLocaleString("en-US") + " tokens, " + sci(div) + " pairs for divided attention, " + sci(full) + " pairs for full attention." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "260px";
      rows.forEach(function (r, i) {
        var ly = 18 + i * 52, by = ly + 8, bh = 16;
        S("text", { x: left, y: ly, class: "t t-sm", text: r.lbl, "font-weight": 600 }, svg);
        S("rect", { x: left, y: by, width: right - left, height: bh, rx: 4, class: "f-surface2" }, svg);
        S("rect", { x: left, y: by, width: Math.max(2, xOf(r.v) - left), height: bh, rx: 4, class: r.cls }, svg);
        if (Math.log10(r.v) > LOG1) S("text", { x: right - 6, y: by + 12, class: "t t-sm t-end t-nohalo", text: "off the scale →", style: "fill:#fff", "font-weight": 600 }, svg);
      });
      var axY = 18 + 2 * 52 + 8 + 16 + 12;
      S("path", { d: "M" + left + " " + axY + "H" + right, class: "s-axis" }, svg);
      for (var e = LOG0; e <= LOG1; e += 2) {
        var x = left + (e - LOG0) * sc;
        S("path", { d: "M" + x + " " + axY + "v5", class: "s-axis" }, svg);
        S("text", { x: x, y: axY + 19, class: "t t-sm t-muted " + (e === LOG0 ? "" : e === LOG1 ? "t-end" : "t-mid"), text: "10" + sup(e) }, svg);
      }
      S("text", { x: Wd / 2, y: axY + 40, class: "t t-sm t-muted t-mid", text: "log scale: each tick is 100× the last" }, svg);
      stage.innerHTML = ""; stage.appendChild(svg);

      readout.textContent = st.dur + " s × " + st.fps + " fps = " + T.toLocaleString("en-US") + " frames of " + st.W + "×" + st.H +
        " → " + bytes(raw) + " of raw 8-bit RGB. Tokens: " + Tt.toLocaleString("en-US") + " time steps × " + P.toLocaleString("en-US") +
        " places = " + n.toLocaleString("en-US") + ". Divided attention needs " + times(full / div) + "× fewer pairs than full attention; full attention costs about " +
        times(full / (TEXT_CTX * TEXT_CTX)) + "× a 32K-token text prompt's.";
    }

    Object.keys(inp).forEach(function (k) { inp[k].addEventListener("input", draw); });
    root.querySelectorAll("[data-preset]").forEach(function (b) {
      b.addEventListener("click", function () {
        var p = b.dataset.preset.split(",").map(Number);
        inp.ft.value = FT.indexOf(p[0]); inp.sp.value = SP.indexOf(p[1]);
        draw();
      });
    });
    draw();
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        var want = stage.clientWidth < 560 ? "compact" : "wide";
        if (want !== layout) draw();
      }).observe(stage);
    }
  }

  document.addEventListener("lc:ready", function () {
    var root = document.getElementById("vd1-token-playground");
    if (root) init(root);
  });
})();
