/* SY.2 playground: vector search over 20 help-centre snippets.
   Toy embedding = 6 hand-made topic dimensions (billing, refunds, account, shipping,
   app problems, privacy) from a small word list, concatenated with a hashed bag of words
   (weight 0.5). Words containing digits (codes such as E1042) are left out of the hashed
   part, mimicking how embedding models handle rare identifiers poorly. Ranking uses
   cosine similarity on the full vectors; the 2-D map is a hand-drawn sketch of the clusters,
   so distances on it are only approximate.
   Keyword mode adds BM25 (k1 = 1.2, b = 0.75) and fuses both rankings with reciprocal rank
   fusion: score = sum over lists of 1 / (60 + rank). */
(function () {
  var LC = window.LC;
  var DOCS = [
    ["Update the card you pay with", [1, 0, .25, 0, 0, .05], [0.08, 0.08]],
    ["Error E1042: your card was declined", [.9, 0, 0, 0, .25, 0], [0.25, 0.05]],
    ["Why was I charged twice this month?", [.9, .35, 0, 0, 0, 0], [0.14, 0.22]],
    ["Switch to yearly billing and save", [1, .05, .1, 0, 0, 0], [0.32, 0.18]],
    ["Request a refund within 30 days", [.3, 1, 0, 0, 0, 0], [0.06, 0.44]],
    ["Return an item for a refund", [.1, .9, 0, .35, 0, 0], [0.16, 0.58]],
    ["Refunds reach your bank in 5–10 days", [.45, .9, 0, 0, 0, 0], [0.22, 0.38]],
    ["Reset a forgotten password", [0, 0, 1, 0, .05, .1], [0.78, 0.10]],
    ["Turn on two-step sign-in", [0, 0, .9, 0, 0, .4], [0.94, 0.24]],
    ["Locked out after too many attempts", [0, 0, 1, 0, .2, 0], [0.66, 0.22]],
    ["Change the email on your account", [.05, 0, .9, 0, 0, .2], [0.86, 0.38]],
    ["Track your parcel with the order ID", [0, 0, 0, 1, 0, 0], [0.12, 0.84]],
    ["Delivery times by country", [0, 0, 0, 1, 0, .05], [0.30, 0.92]],
    ["Parcel says delivered but isn't here", [0, .35, 0, .9, 0, 0], [0.26, 0.74]],
    ["Change the delivery address", [0, 0, .15, .9, 0, 0], [0.44, 0.86]],
    ["The app drains my battery", [0, 0, 0, 0, 1, 0], [0.60, 0.62]],
    ["Fix crashes after the latest update", [0, 0, 0, 0, 1, .05], [0.52, 0.48]],
    ["Photo sync is slow on Wi-Fi", [0, 0, 0, 0, .9, .15], [0.70, 0.52]],
    ["Download a copy of your data", [0, 0, .2, 0, 0, 1], [0.80, 0.70]],
    ["Delete your account and all data", [0, 0, .45, 0, 0, .9], [0.92, 0.56]]
  ];
  var CLUSTERS = [["billing", 0.36, 0.06], ["refunds", 0.28, 0.50], ["account", 0.54, 0.06], ["app problems", 0.40, 0.36], ["privacy", 0.74, 0.84], ["shipping", 0.52, 0.97]];
  var LEX = {
    card: [1, 0, 0, 0, 0, 0], pay: [1, 0, 0, 0, 0, 0], paid: [1, 0, 0, 0, 0, 0], payment: [1, 0, 0, 0, 0, 0], charge: [1, .2, 0, 0, 0, 0], charged: [1, .2, 0, 0, 0, 0],
    bill: [1, 0, 0, 0, 0, 0], billing: [1, 0, 0, 0, 0, 0], price: [.8, 0, 0, 0, 0, 0], subscription: [.9, 0, .2, 0, 0, 0], invoice: [1, 0, 0, 0, 0, 0], declined: [.9, 0, 0, 0, 0, 0],
    money: [.5, .6, 0, 0, 0, 0], refund: [.2, 1, 0, 0, 0, 0], back: [0, .4, 0, 0, 0, 0], "return": [0, .9, 0, .3, 0, 0], cancel: [.4, .6, .2, 0, 0, 0], cost: [.8, 0, 0, 0, 0, 0],
    login: [0, 0, 1, 0, 0, 0], log: [0, 0, .9, 0, 0, 0], sign: [0, 0, .9, 0, 0, 0], signin: [0, 0, 1, 0, 0, 0], password: [0, 0, 1, 0, 0, .1], account: [0, 0, .8, 0, 0, .2], email: [0, 0, .8, 0, 0, .1],
    locked: [0, 0, 1, 0, 0, 0], username: [0, 0, 1, 0, 0, 0], access: [0, 0, .8, 0, 0, .2], "in": [0, 0, .1, 0, 0, 0],
    parcel: [0, 0, 0, 1, 0, 0], "package": [0, 0, 0, 1, 0, 0], delivery: [0, 0, 0, 1, 0, 0], deliver: [0, 0, 0, 1, 0, 0], shipping: [0, 0, 0, 1, 0, 0], ship: [0, 0, 0, 1, 0, 0], order: [.2, .1, 0, .8, 0, 0],
    track: [0, 0, 0, 1, 0, 0], where: [0, 0, 0, .4, 0, 0], arrive: [0, 0, 0, 1, 0, 0], late: [0, 0, 0, .8, 0, 0], address: [0, 0, .2, .8, 0, 0],
    battery: [0, 0, 0, 0, 1, 0], crash: [0, 0, 0, 0, 1, 0], crashes: [0, 0, 0, 0, 1, 0], crashing: [0, 0, 0, 0, 1, 0], slow: [0, 0, 0, 0, 1, 0], bug: [0, 0, 0, 0, 1, 0], error: [.2, 0, .1, 0, .7, 0], update: [0, 0, 0, 0, .7, 0],
    app: [0, 0, 0, 0, .6, 0], phone: [0, 0, 0, 0, .8, 0], sync: [0, 0, 0, 0, .9, 0], freeze: [0, 0, 0, 0, 1, 0], broken: [0, .2, 0, 0, .8, 0],
    data: [0, 0, .1, 0, 0, 1], privacy: [0, 0, 0, 0, 0, 1], "delete": [0, 0, .4, 0, 0, .8], gdpr: [0, 0, 0, 0, 0, 1], personal: [0, 0, 0, 0, 0, .9], "export": [0, 0, 0, 0, 0, .9], download: [0, 0, 0, 0, .2, .7]
  };
  var STOP = {};
  "a an the my me i is are was to of for and or on in with your you it this that cant can not how do does what why".split(" ").forEach(function (w) { STOP[w] = 1; });
  var H = 48, WB = 0.5;
  function toks(s) { return (s.toLowerCase().replace(/can't/g, "cant").match(/[a-z0-9]+/g) || []); }
  function stem(t) { var suf = ["ing", "es", "s", "ed"]; for (var i = 0; i < suf.length; i++) if (t.length > 4 && t.slice(-suf[i].length) === suf[i]) return t.slice(0, -suf[i].length); return t; }
  function hash(t) { var h = 2166136261; for (var i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) % H; }
  function norm(v) { var s = 0; v.forEach(function (x) { s += x * x; }); s = Math.sqrt(s); return s ? v.map(function (x) { return x / s; }) : v; }
  function bow(s) {
    var v = new Array(H).fill(0);
    toks(s).forEach(function (t) { if (STOP[t] || /\d/.test(t)) return; v[hash(stem(t))] += 1; });
    return norm(v);
  }
  function embed(topic, text) { return norm(norm(topic).concat(bow(text).map(function (x) { return WB * x; }))); }
  function qTopic(q) { var v = [0, 0, 0, 0, 0, 0]; toks(q).forEach(function (t) { var l = LEX[t]; if (l) for (var i = 0; i < 6; i++) v[i] += l[i]; }); return v; }
  function dot(a, b) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i] * b[i]; return s; }
  var E = DOCS.map(function (d) { return embed(d[1], d[0]); });
  // BM25 index
  var DT = DOCS.map(function (d) { return toks(d[0]).filter(function (t) { return !STOP[t]; }).map(stem); });
  var N = DOCS.length, avg = DT.reduce(function (a, d) { return a + d.length; }, 0) / N, DF = {};
  DT.forEach(function (d) { var seen = {}; d.forEach(function (t) { if (!seen[t]) { seen[t] = 1; DF[t] = (DF[t] || 0) + 1; } }); });
  function bm25(q) {
    var qs = toks(q).filter(function (t) { return !STOP[t]; }).map(stem);
    return DT.map(function (d) {
      var s = 0;
      qs.forEach(function (t) {
        if (!DF[t]) return;
        var idf = Math.log(1 + (N - DF[t] + 0.5) / (DF[t] + 0.5)), f = d.filter(function (x) { return x === t; }).length;
        s += idf * f * 2.2 / (f + 1.2 * (0.25 + 0.75 * d.length / avg));
      });
      return s;
    });
  }
  function search(q, hybrid) {
    var qt = qTopic(q), qe = embed(qt, q);
    // "known" = the toy model recognises at least one word (topic word or a word from the snippets)
    var known = qt.some(function (x) { return x !== 0; }) || toks(q).some(function (t) { return !STOP[t] && DF[stem(t)]; });
    var cos = E.map(function (e) { return known ? dot(e, qe) : 0; });
    var dense = range(N).sort(function (a, b) { return cos[b] - cos[a]; });
    var dRank = {}; dense.forEach(function (i, r) { dRank[i] = r + 1; });
    var b = bm25(q), kw = range(N).filter(function (i) { return b[i] > 0; }).sort(function (x, y) { return b[y] - b[x]; });
    var kRank = {}; kw.forEach(function (i, r) { kRank[i] = r + 1; });
    var order = dense, rrf = {};
    if (hybrid) {
      range(N).forEach(function (i) { rrf[i] = (known ? 1 / (60 + dRank[i]) : 0) + (kRank[i] ? 1 / (60 + kRank[i]) : 0); });
      order = range(N).sort(function (x, y) { return rrf[y] - rrf[x] || cos[y] - cos[x]; });
    }
    return { known: known, cos: cos, order: order, dRank: dRank, kRank: kRank, rrf: rrf, kwCount: kw.length };
  }
  function range(n) { var a = []; for (var i = 0; i < n; i++) a.push(i); return a; }
  LC.sy2search = search; // exposed for checking in the console

  function init(root) {
    var stage = root.querySelector(".pg-stage"), slider = root.querySelector("input[type=range]"), out = root.querySelector("output");
    var toggle = root.querySelector("input[type=checkbox]"), form = root.querySelector("form"), input = root.querySelector("input[type=search]");
    var list = root.querySelector(".sy2-results"), readout = root.querySelector(".pg-readout");
    var query = "get my money back", layout = null, svg, W, Hh, m, linesG, marksG, qMark;

    function X(p) { return m.l + p[0] * (W - m.l - m.r); }
    function Y(p) { return m.t + p[1] * (Hh - m.t - m.b); }
    function build() {
      layout = stage.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact";
      W = compact ? 360 : 640; Hh = compact ? 280 : 330;
      m = compact ? { l: 22, r: 22, t: 22, b: 22 } : { l: 40, r: 40, t: 24, b: 24 };
      if (svg) svg.remove();
      svg = LC.svg("svg", { viewBox: "0 0 " + W + " " + Hh, role: "img", "aria-label": "A map of 20 help-centre snippets grouped by topic. The query appears as a diamond, linked to its top results, which are numbered by rank. The list below gives the same results in words." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "400px";
      stage.appendChild(svg);
      var S = LC.svg;
      S("rect", { x: 4, y: 4, width: W - 8, height: Hh - 8, rx: 12, class: "f-none", stroke: "var(--line)", "stroke-width": 1 }, svg);
      CLUSTERS.forEach(function (c) { S("text", { x: X([c[1], 0]), y: Y([0, c[2]]) + 4, class: "t t-sm t-muted", "font-style": "italic", text: c[0] }, svg); });
      linesG = S("g", {}, svg);
      DOCS.forEach(function (d) { S("circle", { cx: X(d[2]), cy: Y(d[2]), r: 4.5, class: "f-faint" }, svg); });
      marksG = S("g", {}, svg);
      qMark = S("path", { d: "", class: "f-orange", stroke: "var(--a-paper)", "stroke-width": 1.5 }, svg);
      render();
    }

    function render() {
      var k = parseInt(slider.value, 10), hybrid = toggle.checked, r = search(query, hybrid);
      out.textContent = k;
      while (linesG.firstChild) linesG.removeChild(linesG.firstChild);
      while (marksG.firstChild) marksG.removeChild(marksG.firstChild);
      list.innerHTML = "";
      var top = r.known || (hybrid && r.kwCount) ? r.order.slice(0, k) : [];
      if (hybrid && !r.known) top = r.order.filter(function (i) { return r.kRank[i]; }).slice(0, k);
      // query position: weighted mean of the best three dense matches (a sketch, not a projection)
      var qp = [0.5, 0.5];
      if (top.length) {
        var best = (r.known ? range(N).sort(function (a, b) { return r.cos[b] - r.cos[a]; }) : top).slice(0, 3), ws = 0, x = 0, y = 0;
        best.forEach(function (i) { var w = Math.exp(8 * (r.known ? r.cos[i] : 1)); ws += w; x += w * DOCS[i][2][0]; y += w * DOCS[i][2][1]; });
        qp = [x / ws, y / ws];
      }
      var qx = X(qp), qy = Y(qp);
      // keep the diamond off the numbered badges
      for (var it = 0; it < 6; it++) {
        top.forEach(function (i) {
          var px = X(DOCS[i][2]), py = Y(DOCS[i][2]), dx = qx - px, dy = qy - py, dd = Math.hypot(dx, dy);
          if (dd < 22) { if (dd < 0.5) { dx = 0; dy = -1; dd = 1; } qx = px + dx / dd * 22; qy = py + dy / dd * 22; }
        });
      }
      qx = Math.max(m.l, Math.min(W - m.r, qx)); qy = Math.max(m.t, Math.min(Hh - m.b, qy));
      top.forEach(function (i, n) {
        var p = DOCS[i][2];
        LC.svg("line", { x1: qx, y1: qy, x2: X(p), y2: Y(p), class: "s-ink", "stroke-width": 1.5, opacity: 0.45 }, linesG);
        var kwOnly = hybrid && r.kRank[i] && (!r.known || r.dRank[i] > k);
        LC.svg("circle", { cx: X(p), cy: Y(p), r: 9.5, class: kwOnly ? "f-orange" : "f-blue" }, marksG);
        LC.svg("text", { x: X(p), y: Y(p) + 4, class: "t t-sm t-mid t-nohalo", "font-weight": 700, style: "fill:#fff", text: n + 1 }, marksG);
      });
      qMark.setAttribute("d", top.length ? "M" + qx + " " + (qy - 10) + "l10 10l-10 10l-10 -10z" : "");
      top.forEach(function (i) {
        var li = document.createElement("li"), meta = [];
        if (r.known) meta.push("cos " + r.cos[i].toFixed(2));
        if (hybrid) {
          if (r.known) meta.push("meaning #" + r.dRank[i]);
          meta.push(r.kRank[i] ? "keyword #" + r.kRank[i] : "no keyword match");
          meta.push("RRF " + r.rrf[i].toFixed(4));
        }
        li.innerHTML = "<span></span><small></small>";
        li.firstChild.textContent = DOCS[i][0];
        li.lastChild.textContent = meta.join(" · ");
        list.appendChild(li);
      });
      if (!top.length) {
        readout.textContent = "No result: this toy model knows only about 80 words. Try words like refund, parcel, password, battery or data" + (hybrid ? ", or words that appear in the snippets." : ", or switch on keyword matching.");
      } else {
        readout.textContent = "“" + query + "” · top " + k + (hybrid ? " by RRF of meaning + keywords (" + r.kwCount + " keyword hit" + (r.kwCount === 1 ? "" : "s") + ")" : " by cosine similarity") + (r.known ? "" : " · no known meaning words, keywords only");
      }
      root.querySelectorAll("[data-q]").forEach(function (c) { c.setAttribute("aria-pressed", String(c.dataset.q === query)); });
    }

    slider.addEventListener("input", render);
    toggle.addEventListener("change", render);
    form.addEventListener("submit", function (e) { e.preventDefault(); var v = input.value.trim(); if (v) { query = v.slice(0, 80); render(); } });
    root.addEventListener("click", function (e) {
      var b = e.target.closest("[data-q]"); if (!b) return;
      query = b.dataset.q; input.value = ""; render();
    });
    build();
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () { var want = stage.clientWidth < 560 ? "compact" : "wide"; if (want !== layout) build(); }).observe(stage);
    }
  }

  document.addEventListener("lc:ready", function () {
    var root = document.getElementById("sy2-search");
    if (root) init(root);
  });
})();
