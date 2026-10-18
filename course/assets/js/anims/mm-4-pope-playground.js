/* MM.4 playground: a tiny POPE-style probe. 12 yes/no questions "Is there a <object> in the image?"
   for one kitchen scene: 6 objects present, 6 absent (2 random, 2 popular, 2 adversarial negatives,
   following POPE's three sampling settings). The simulated model's confidences are made up; the
   learner moves the threshold above which it says "yes". At t = 0 (always yes) accuracy is 50%,
   precision 50%, recall 100%, F1 0.67. */
(function () {
  var LC = window.LC;
  var ITEMS = [
    ["dining table", 1, "present", 0.95], ["pizza", 1, "present", 0.90], ["cup", 1, "present", 0.80],
    ["chair", 1, "present", 0.66], ["person", 1, "present", 0.58], ["bottle", 1, "present", 0.40],
    ["giraffe", 0, "random", 0.04], ["surfboard", 0, "random", 0.10],
    ["car", 0, "popular", 0.22], ["dog", 0, "popular", 0.30],
    ["fork", 0, "adversarial", 0.62], ["knife", 0, "adversarial", 0.48]
  ];
  var SHORT = { present: "–", random: "rand", popular: "pop", adversarial: "adv" };

  function metrics(t) {
    var tp = 0, fp = 0, tn = 0, fn = 0, byType = { random: [0, 0], popular: [0, 0], adversarial: [0, 0] };
    ITEMS.forEach(function (it) {
      var yes = it[3] >= t - 1e-9;
      if (it[1] && yes) tp++; else if (it[1]) fn++; else if (yes) fp++; else tn++;
      if (!it[1]) { byType[it[2]][1]++; if (!yes) byType[it[2]][0]++; }
    });
    var n = ITEMS.length, acc = (tp + tn) / n, prec = tp + fp ? tp / (tp + fp) : 0, rec = tp / (tp + fn);
    var f1 = prec + rec ? 2 * prec * rec / (prec + rec) : 0;
    return { tp: tp, fp: fp, tn: tn, fn: fn, acc: acc, prec: prec, rec: rec, f1: f1, yes: (tp + fp) / n, byType: byType };
  }

  function init(root) {
    var stageBox = root.querySelector(".pg-stage");
    var slider = root.querySelector("input[type=range]");
    var out = root.querySelector("output");
    var readout = root.querySelector(".pg-readout");
    var layout = null, svg, rows = [], bars = [], thrLine, cx0, cw;

    function build() {
      layout = stageBox.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact";
      var W = compact ? 360 : 640, H = compact ? 462 : 318;
      if (svg) svg.remove();
      svg = LC.svg("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "A table of 12 yes/no probe questions with the model's confidence, its answer at the current threshold and whether that answer is a true or false positive or negative, plus bars for accuracy, precision, recall, F1 and the share of yes answers. The readout below lists the same numbers." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "420px";
      stageBox.appendChild(svg);
      var S = LC.svg;
      var C = compact
        ? { obj: 10, inn: 100, typ: 126, conf: 164, cw: 64, says: 238, res: 296, y0: 40, dy: 22 }
        : { obj: 16, inn: 124, typ: 156, conf: 246, cw: 80, says: 338, res: 394, y0: 40, dy: 22 };
      cx0 = C.conf; cw = C.cw;
      [["object", C.obj, ""], ["in?", C.inn, ""], ["set", C.typ, ""], [compact ? "conf." : "confidence", C.conf, ""], ["says", C.says, ""], [compact ? "result" : "result", C.res, ""]].forEach(function (h) {
        S("text", { x: h[1], y: 22, class: "t t-sm t-muted", "font-weight": 600, text: h[0] }, svg);
      });
      rows = ITEMS.map(function (it, i) {
        var y = C.y0 + i * C.dy, g = S("g", {}, svg);
        if (i === 6) S("path", { d: "M" + C.obj + " " + (y - 6) + "H" + (C.res + 34), stroke: "var(--line)", "stroke-width": 1.5, fill: "none" }, svg);
        S("text", { x: C.obj, y: y + 9, class: "t t-sm", text: it[0] }, g);
        S("text", { x: C.inn + 6, y: y + 9, class: "t t-sm t-mid " + (it[1] ? "t-blue" : "t-muted"), text: it[1] ? "✓" : "✗" }, g);
        S("text", { x: C.typ, y: y + 9, class: "t t-sm t-muted", text: compact ? SHORT[it[2]] : (it[2] === "present" ? "–" : it[2]) }, g);
        S("rect", { x: C.conf, y: y, width: C.cw, height: 12, rx: 3, class: "f-surface2" }, g);
        S("rect", { x: C.conf, y: y, width: C.cw * it[3], height: 12, rx: 3, class: "f-ink", "fill-opacity": 0.45 }, g);
        var pill = S("rect", { x: C.says, y: y - 3, width: 40, height: 18, rx: 9, class: "f-blue" }, g);
        var pt = S("text", { x: C.says + 20, y: y + 10, class: "t t-sm t-mid t-nohalo", "font-weight": 600, text: "" }, g);
        var res = S("text", { x: C.res, y: y + 9, class: "t t-sm t-mono", "font-weight": 650, text: "" }, g);
        return { pill: pill, pt: pt, res: res, it: it };
      });
      var yEnd = C.y0 + ITEMS.length * C.dy - 6;
      thrLine = S("path", { d: "", stroke: "var(--a-orange)", "stroke-width": 2, "stroke-dasharray": "4 3", fill: "none" }, svg);
      thrLine._y = [C.y0 - 6, yEnd];

      // metric bars
      var M = compact ? { x: 10, lw: 76, bw: 220, y0: 340, dy: 24 } : { x: 440, lw: 70, bw: 84, y0: 52, dy: 30 };
      if (!compact) S("text", { x: M.x, y: 22, class: "t t-sm t-muted", "font-weight": 600, text: "scores" }, svg);
      else S("text", { x: M.x, y: M.y0 - 14, class: "t t-sm t-muted", "font-weight": 600, text: "scores (12 questions)" }, svg);
      bars = [["accuracy", "acc"], ["precision", "prec"], ["recall", "rec"], ["F1", "f1"], ["yes-ratio", "yes"]].map(function (b, i) {
        var y = M.y0 + i * M.dy;
        S("text", { x: M.x, y: y + 11, class: "t t-sm", text: b[0] }, svg);
        S("rect", { x: M.x + M.lw, y: y, width: M.bw, height: 14, rx: 4, class: "f-surface2", stroke: "var(--line)", "stroke-width": 1 }, svg);
        var f = S("rect", { x: M.x + M.lw, y: y, width: 0, height: 14, rx: 4, class: b[1] === "yes" ? "f-orange" : "f-blue" }, svg);
        var v = S("text", { x: M.x + M.lw + M.bw + 6, y: y + 11, class: "t t-sm t-mono", text: "" }, svg);
        return { key: b[1], f: f, v: v, bw: M.bw };
      });
      if (!compact) {
        S("text", { x: M.x, y: M.y0 + 5 * M.dy + 16, class: "t t-sm t-muted", text: "chance on a balanced" }, svg);
        S("text", { x: M.x, y: M.y0 + 5 * M.dy + 34, class: "t t-sm t-muted", text: "set: 50% accuracy" }, svg);
      }
      draw();
    }

    function draw() {
      var t = parseFloat(slider.value), mt = metrics(t);
      out.textContent = t.toFixed(2);
      var x = cx0 + cw * t;
      thrLine.setAttribute("d", "M" + x.toFixed(1) + " " + thrLine._y[0] + "V" + thrLine._y[1]);
      rows.forEach(function (r) {
        var yes = r.it[3] >= t - 1e-9, ok = yes === !!r.it[1];
        r.pill.setAttribute("class", yes ? "f-blue" : "f-faint");
        r.pt.textContent = yes ? "Yes" : "No";
        r.pt.setAttribute("style", yes ? "fill:#fff" : "");
        r.res.textContent = (ok ? "T" : "F") + (yes ? "P" : "N");
        r.res.setAttribute("class", "t t-sm t-mono " + (ok ? "t-blue" : "t-orange"));
      });
      bars.forEach(function (b) {
        var v = mt[b.key];
        b.f.setAttribute("width", (b.bw * v).toFixed(1));
        b.v.textContent = b.key === "f1" ? v.toFixed(2) : Math.round(v * 100) + "%";
      });
      var bt = mt.byType;
      readout.textContent = "t = " + t.toFixed(2) + " · TP " + mt.tp + " FP " + mt.fp + " TN " + mt.tn + " FN " + mt.fn +
        " · acc " + Math.round(mt.acc * 100) + "% · precision " + Math.round(mt.prec * 100) + "% · recall " + Math.round(mt.rec * 100) +
        "% · F1 " + mt.f1.toFixed(2) + " · yes " + Math.round(mt.yes * 100) + "% · negatives right: random " + bt.random[0] + "/2, popular " +
        bt.popular[0] + "/2, adversarial " + bt.adversarial[0] + "/2";
      root.querySelectorAll("[data-t]").forEach(function (c) { c.setAttribute("aria-pressed", String(Math.abs(parseFloat(c.dataset.t) - t) < 1e-9)); });
    }

    slider.addEventListener("input", draw);
    root.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-t]"); if (!b) return;
      slider.value = b.dataset.t; draw();
    });
    build();
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        var want = stageBox.clientWidth < 560 ? "compact" : "wide";
        if (want !== layout) build();
      }).observe(stageBox);
    }
  }

  document.addEventListener("lc:ready", function () {
    var root = document.getElementById("mm4-pope");
    if (root) init(root);
  });
})();
