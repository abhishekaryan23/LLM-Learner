/* G1 shared toy: a 2-D "two moons" dataset, used by every image-generation lesson.
   The data is a mixture of 24 small Gaussians (12 per moon, std S), so the
   denoiser E[x0 | x_t], the noise prediction and the flow-matching velocity are
   all exact closed forms: no trained network, the pictures are the true answers.
   Schedule: DDPM linear betas 1e-4 → 0.02 over T = 1000 steps (Ho et al., 2020). */
(function () {
  var LC = window.LC;
  var K = 12, S = 0.10, T = 1000;
  var C = [], CLS = [];
  for (var i = 0; i < K; i++) {           // upper moon (class 0)
    var th = Math.PI * i / (K - 1);
    C.push([(Math.cos(th) - 0.5) * 1.3, (Math.sin(th) - 0.25) * 1.3]); CLS.push(0);
  }
  for (i = 0; i < K; i++) {               // lower moon (class 1)
    th = Math.PI * i / (K - 1);
    C.push([(1 - Math.cos(th) - 0.5) * 1.3, (0.5 - Math.sin(th) - 0.25) * 1.3]); CLS.push(1);
  }
  var AB = new Float64Array(T + 1), BETA = new Float64Array(T + 1);
  AB[0] = 1;
  for (var t = 1; t <= T; t++) { BETA[t] = 1e-4 + (0.02 - 1e-4) * (t - 1) / (T - 1); AB[t] = AB[t - 1] * (1 - BETA[t]); }

  function rng(seed) {                    // mulberry32
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var r = Math.imul(a ^ (a >>> 15), 1 | a);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(r) { var u = 1 - r(), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  // noise points, kept inside the plotting window so nothing is drawn off-plot
  function noise(n, seed) {
    var r = rng(seed), out = [];
    while (out.length < n) { var p = [gauss(r), gauss(r)]; if (Math.abs(p[0]) < 2.85 && Math.abs(p[1]) < 2.1) out.push(p); }
    return out;
  }
  function data(n, seed, cls) {
    var r = rng(seed), out = [];
    for (var j = 0; j < n; j++) {
      var k = Math.floor(r() * K) + (cls === 1 ? K : cls === 0 ? 0 : (r() < 0.5 ? 0 : K));
      out.push([C[k][0] + S * gauss(r), C[k][1] + S * gauss(r), CLS[k]]);
    }
    return out;
  }
  // posterior weights over mixture components, given a Gaussian around m*c_k with variance v
  function weights(x, y, m, v, cls) {
    var w = [], mx = -Infinity;
    for (var k = 0; k < C.length; k++) {
      if (cls != null && CLS[k] !== cls) { w.push(-Infinity); continue; }
      var dx = x - m * C[k][0], dy = y - m * C[k][1], l = -(dx * dx + dy * dy) / (2 * v);
      w.push(l); if (l > mx) mx = l;
    }
    var s = 0;
    for (k = 0; k < w.length; k++) { w[k] = Math.exp(w[k] - mx); s += w[k]; }
    for (k = 0; k < w.length; k++) w[k] /= s;
    return w;
  }
  // exact E[x0 | x_t] for the VP process x_t = sqrt(ab) x0 + sqrt(1-ab) eps
  function x0hat(x, y, ab, cls) {
    var sa = Math.sqrt(ab), v = ab * S * S + 1 - ab, g = sa * S * S / v;
    var w = weights(x, y, sa, v, cls), ox = 0, oy = 0;
    for (var k = 0; k < C.length; k++) {
      if (!w[k]) continue;
      ox += w[k] * (C[k][0] + g * (x - sa * C[k][0]));
      oy += w[k] * (C[k][1] + g * (y - sa * C[k][1]));
    }
    return [ox, oy];
  }
  function eps(x, y, ab, cls) {
    var h = x0hat(x, y, ab, cls), sa = Math.sqrt(ab), s1 = Math.sqrt(1 - ab);
    return [(x - sa * h[0]) / s1, (y - sa * h[1]) / s1];
  }
  // classifier-free guidance: eps_u + w (eps_c - eps_u)
  function epsCFG(x, y, ab, w, cls) {
    var u = eps(x, y, ab, null);
    if (w === 0 || cls == null) return u;
    var c = eps(x, y, ab, cls);
    return [u[0] + w * (c[0] - u[0]), u[1] + w * (c[1] - u[1])];
  }
  // deterministic DDIM from step t0 down to 0 in n jumps; returns the trajectory per point
  function ddim(pts, n, opt) {
    opt = opt || {};
    var t0 = opt.t0 || T, ts = [];
    for (var i = 0; i <= n; i++) ts.push(Math.round(t0 * (1 - i / n)));
    return pts.map(function (p) {
      var x = p[0], y = p[1], tr = [[x, y]];
      for (var i = 0; i < n; i++) {
        var a = AB[ts[i]], ap = AB[ts[i + 1]];
        var e = opt.w != null ? epsCFG(x, y, a, opt.w, opt.cls) : eps(x, y, a, null);
        var hx = (x - Math.sqrt(1 - a) * e[0]) / Math.sqrt(a), hy = (y - Math.sqrt(1 - a) * e[1]) / Math.sqrt(a);
        x = Math.sqrt(ap) * hx + Math.sqrt(1 - ap) * e[0];
        y = Math.sqrt(ap) * hy + Math.sqrt(1 - ap) * e[1];
        tr.push([x, y]);
      }
      return tr;
    });
  }
  // DDPM ancestral sampling (all 1000 steps), recording every `every` steps
  function ddpm(pts, seed, every) {
    var r = rng(seed);
    every = every || 10;
    return pts.map(function (p) {
      var x = p[0], y = p[1], tr = [[x, y]];
      for (var t = T; t >= 1; t--) {
        var a = AB[t], al = 1 - BETA[t], e = eps(x, y, a, null), c = BETA[t] / Math.sqrt(1 - a);
        x = (x - c * e[0]) / Math.sqrt(al); y = (y - c * e[1]) / Math.sqrt(al);
        if (t > 1) { var sd = Math.sqrt(BETA[t]); x += sd * gauss(r); y += sd * gauss(r); }
        if ((t - 1) % every === 0) tr.push([x, y]);
      }
      return tr;  // tr[k] is the state at step T - k*every
    });
  }
  // flow matching, x_t = (1-t) x0 + t x1 with x0 ~ N(0, I) noise and x1 ~ data:
  // exact marginal velocity E[x1 - x0 | x_t = x]
  function vel(x, y, t) {
    var v = (1 - t) * (1 - t) + t * t * S * S;
    var w = weights(x, y, t, v, null), ox = 0, oy = 0;
    for (var k = 0; k < C.length; k++) {
      if (!w[k]) continue;
      var dx = x - t * C[k][0], dy = y - t * C[k][1];
      ox += w[k] * (C[k][0] + (t * S * S / v) * dx - ((1 - t) / v) * dx);
      oy += w[k] * (C[k][1] + (t * S * S / v) * dy - ((1 - t) / v) * dy);
    }
    return [ox, oy];
  }
  function euler(pts, n) {
    return pts.map(function (p) {
      var x = p[0], y = p[1], tr = [[x, y]];
      for (var i = 0; i < n; i++) { var v = vel(x, y, i / n); x += v[0] / n; y += v[1] / n; tr.push([x, y]); }
      return tr;
    });
  }
  function nearest(x, y) {
    var best = Infinity, bk = 0;
    for (var k = 0; k < C.length; k++) { var d = Math.hypot(x - C[k][0], y - C[k][1]); if (d < best) { best = d; bk = k; } }
    return { d: best, cls: CLS[bk] };
  }

  /* Plot frame: data window x ∈ [-3, 3], y ∈ [-2.25, 2.25] mapped into box {x, y, w, h}
     (keep w:h = 4:3). Draws a light frame and the moons as faint thick bands. */
  var X0 = -3, X1 = 3, Y0 = -2.25, Y1 = 2.25, clipN = 0;
  function frame(parent, box, opt) {
    opt = opt || {};
    var S_ = LC.svg, g = S_("g", {}, parent);
    function sx(x) { return box.x + (x - X0) / (X1 - X0) * box.w; }
    function sy(y) { return box.y + (Y1 - y) / (Y1 - Y0) * box.h; }
    S_("rect", { x: box.x, y: box.y, width: box.w, height: box.h, rx: 8, class: "f-none", stroke: "var(--line)", "stroke-width": 1 }, g);
    var cid = "g1clip" + (++clipN);
    var cp = S_("clipPath", { id: cid }, g);
    S_("rect", { x: box.x, y: box.y, width: box.w, height: box.h, rx: 8 }, cp);
    var bands = null;
    if (opt.moons !== false) {
      bands = S_("g", {}, g);
      [0, 1].forEach(function (m) {
        var d = "";
        for (var k = 0; k < K; k++) { var c = C[m * K + k]; d += (k ? "L" : "M") + sx(c[0]).toFixed(1) + " " + sy(c[1]).toFixed(1); }
        S_("path", { d: d, class: "s-faint", "stroke-width": Math.max(8, 2.6 * S * box.w / (X1 - X0)).toFixed(1), "stroke-linecap": "round", "stroke-linejoin": "round", opacity: 0.55 }, bands);
      });
    }
    return { g: g, sx: sx, sy: sy, bands: bands, clip: "url(#" + cid + ")" };
  }
  function dots(parent, pts, fr, cls, r) {
    return pts.map(function (p) { return LC.svg("circle", { cx: fr.sx(p[0]).toFixed(1), cy: fr.sy(p[1]).toFixed(1), r: r || 3, class: cls }, parent); });
  }
  function place(els, pts, fr) {
    for (var i = 0; i < els.length; i++) { els[i].setAttribute("cx", fr.sx(pts[i][0]).toFixed(1)); els[i].setAttribute("cy", fr.sy(pts[i][1]).toFixed(1)); }
  }
  // position along a recorded trajectory, u ∈ [0, 1]
  function along(tr, u) {
    var f = Math.max(0, Math.min(1, u)) * (tr.length - 1), i = Math.min(tr.length - 2, Math.floor(f)), r = f - i;
    if (tr.length === 1) return tr[0];
    return [tr[i][0] + (tr[i + 1][0] - tr[i][0]) * r, tr[i][1] + (tr[i + 1][1] - tr[i][1]) * r];
  }
  function polyline(tr, fr) {
    return tr.map(function (p, i) { return (i ? "L" : "M") + fr.sx(p[0]).toFixed(1) + " " + fr.sy(p[1]).toFixed(1); }).join("");
  }

  LC.g1 = { C: C, CLS: CLS, K: K, S: S, T: T, AB: AB, BETA: BETA, rng: rng, gauss: gauss, noise: noise, data: data,
    x0hat: x0hat, eps: eps, epsCFG: epsCFG, ddim: ddim, ddpm: ddpm, vel: vel, euler: euler, nearest: nearest,
    frame: frame, dots: dots, place: place, along: along, polyline: polyline };
})();
