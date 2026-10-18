/* SY.1: one vague prompt improved in five visible edits (role, task, constraints,
   example, output format). The outputs are illustrative, written to show the typical
   effect of each edit on a review-triage task; they are not measured model outputs. */
(function () {
  var LC = window.LC;

  // Prompt rows in their final order. step = the edit that fills the slot (0 = there from the start).
  var ROWS = [
    { tag: "role", step: 1, c: "You triage app reviews for a product team.", w: "You help a product team triage app-store reviews." },
    { tag: "task", step: 0, c: "Summarize this review.", w: "Summarize this review.",
      c2: "List each problem the user reports.", w2: "List each problem the user reports, one per line." },
    { tag: "rules", step: 3, c: "Max 3 items, under 8 words. No praise.", w: "At most 3 items, each under 8 words. Leave out praise." },
    { tag: "e.g.", step: 4, c: "“Nice, but it logs me out” → Logs out often", w: "Example: “Nice app, but it keeps logging me out” → Logs out often" },
    { tag: "format", step: 5, c: "Reply as JSON: {\"issues\": [...]}", w: "Reply only with JSON: {\"issues\": [ ...strings ]}" },
    { tag: "input", step: 0, c: "Review: {review}", w: "Review: {review}" }
  ];
  var OUT = [
    { mono: false, l: ["The user has mixed feelings about the app. They", "like the design and the price, but mention some", "issues, and also talk about their old phone…"] },
    { mono: false, l: ["For the product team: users praise the design", "and price; there are login and sync complaints,", "and battery use is mentioned as well."] },
    { mono: false, l: ["1. The app logs them out every day, so annoying", "2. Photo sync fails on Wi-Fi  3. Battery drains", "4. They love the new colours"] },
    { mono: false, l: ["1. Logged out every day", "2. Photo sync fails on Wi-Fi", "3. Heavy battery drain"] },
    { mono: false, l: ["Logs out daily", "Photo sync fails on Wi-Fi", "Battery drains fast"] },
    { mono: true, l: ["{\"issues\": [\"Logs out daily\",", "  \"Photo sync fails on Wi-Fi\",", "  \"Battery drains fast\"]}"] }
  ];
  var CHECKS = ["focus", "problems", "short", "style", "JSON"];
  var CW = [60, 80, 60, 60, 60]; // compact chip widths (sum + gaps = 340)

  LC.anims["sy-1-edits"] = {
    title: "Five edits to one prompt",
    steps: [
      "A <strong>vague prompt</strong>: “Summarize this review.” The model has to guess who the summary is for, what matters and what shape it should take, so it rambles. (Outputs here are illustrative.)",
      "Edit 1, <strong>role and context</strong>: say who the answer is for and why. The summary now centres on product issues, but it is still loose prose.",
      "Edit 2, a <strong>clear task</strong>: “summarize” becomes “list each problem”. Now it lists problems, but it mixes in praise and runs long.",
      "Edit 3, <strong>constraints</strong>: how many items, how long, what to leave out. The list is short and contains only problems.",
      "Edit 4, <strong>an example</strong> (few-shot): one input → output pair shows the exact style. The items now read like the example.",
      "Edit 5, <strong>an output format</strong> your code can parse (better still, enforce it with a schema). All five checks pass on this review; on a real project you would confirm it on a <strong>test set</strong>, not one example."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 366 } : { w: 640, h: 408 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      var g = S("g", { transform: compact ? "translate(0,22)" : "translate(0,4)" }, svg); // compact: keep the swipe-hint corner free
      var cls = compact ? "t t-sm" : "t";
      var pad = compact ? 10 : 16, rowH = compact ? 26 : 28, tagW = compact ? 50 : 62;
      var px = pad, pw = W - 2 * pad, top = 20;
      var textX = px + 10 + tagW + 10;

      // Prompt panel
      S("text", { x: px, y: 12, class: "t t-sm t-muted", "font-weight": 600, text: "PROMPT" }, g);
      S("rect", { x: px, y: top, width: pw, height: ROWS.length * rowH + 12, rx: 10, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, g);
      var rows = ROWS.map(function (r, i) {
        var y = top + 6 + i * rowH;
        var o = {};
        o.hl = S("rect", { x: px + 4, y: y + 1, width: pw - 8, height: rowH - 2, rx: 7, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 2 }, g);
        o.hl.style.opacity = 0;
        if (r.step > 0) {
          o.ph = S("g", {}, g);
          S("rect", { x: px + 10, y: y + 4, width: pw - 20, height: rowH - 8, rx: 6, class: "f-none", stroke: "var(--a-faint)", "stroke-width": 1.5, "stroke-dasharray": "4 4" }, o.ph);
          S("text", { x: px + 20, y: y + rowH / 2 + 4, class: "t t-sm t-muted", text: "+ " + (r.tag === "e.g." ? "example" : r.tag) }, o.ph);
        }
        o.body = S("g", {}, g);
        S("rect", { x: px + 10, y: y + 5, width: tagW, height: rowH - 10, rx: 5, class: "f-surface2" }, o.body);
        S("text", { x: px + 10 + tagW / 2, y: y + rowH / 2 + 4, class: "t t-sm t-mid t-nohalo", "font-weight": 600, text: r.tag }, o.body);
        o.txt = S("text", { x: textX, y: y + rowH / 2 + 4.5, class: cls + (r.tag === "format" || r.tag === "input" ? " t-mono" : ""), text: compact ? r.c : r.w }, o.body);
        if (r.c2) {
          o.txt2 = S("text", { x: textX, y: y + rowH / 2 + 4.5, class: cls, text: compact ? r.c2 : r.w2 }, o.body);
          o.txt2.style.opacity = 0;
        }
        if (r.step > 0) o.body.style.opacity = 0;
        return o;
      });
      var pBottom = top + ROWS.length * rowH + 12;

      // Output panel + checks
      var oy = pBottom + 28;
      var ow = compact ? pw : 400, oh = compact ? 76 : 154;
      S("text", { x: px, y: oy - 8, class: "t t-sm t-muted", "font-weight": 600, text: "OUTPUT (ILLUSTRATIVE)" }, g);
      S("rect", { x: px, y: oy, width: ow, height: oh, rx: 10, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, g);
      var lineH = compact ? 19 : 22;
      var outs = OUT.map(function (o, k) {
        var og = S("g", {}, g);
        o.l.forEach(function (t, j) {
          S("text", { x: px + 12, y: oy + 22 + j * lineH, class: (o.mono ? "t t-sm t-mono" : cls), style: "white-space:pre", text: t }, og);
        });
        if (k > 0) og.style.opacity = 0;
        return og;
      });

      var chips = [];
      var cy0 = compact ? oy + oh + 16 : oy, ch = compact ? 28 : 26, gap = compact ? 6.5 : 6;
      var cx0 = compact ? px : px + ow + 18;
      if (!compact) S("text", { x: cx0, y: oy - 8, class: "t t-sm t-muted", "font-weight": 600, text: "CHECKS" }, g);
      CHECKS.forEach(function (c, i) {
        var x = compact ? cx0 + CW.slice(0, i).reduce(function (a, b) { return a + b + 5; }, 0) : cx0, y = compact ? cy0 : cy0 + i * (ch + gap);
        var cw = compact ? CW[i] : 190;
        var off = S("g", {}, g), on = S("g", {}, g);
        S("rect", { x: x, y: y, width: cw, height: ch, rx: ch / 2, class: "f-none", stroke: "var(--a-faint)", "stroke-width": 1.5 }, off);
        S("text", { x: x + cw / 2, y: y + ch / 2 + 4, class: "t t-sm t-muted t-mid", text: c }, off);
        S("rect", { x: x, y: y, width: cw, height: ch, rx: ch / 2, class: "f-blue" }, on);
        S("text", { x: x + cw / 2, y: y + ch / 2 + 4, class: "t t-sm t-mid t-nohalo", "font-weight": 600, style: "fill:#fff", text: "✓ " + c }, on);
        on.style.opacity = 0;
        chips.push({ off: off, on: on });
      });

      tl.addLabel("s0", 0);
      for (var s = 1; s <= 5; s++) {
        var at = "s" + (s - 1);
        // highlight moves to the edited row
        rows.forEach(function (r, i) {
          var target = ROWS[i].step === s || (s === 2 && ROWS[i].tag === "task") ? 1 : 0;
          tl.to(r.hl, { opacity: target, duration: 0.3 }, at + "+=0.05");
        });
        rows.forEach(function (r, i) {
          if (ROWS[i].step === s) {
            tl.to(r.ph, { opacity: 0, duration: 0.3 }, at + "+=0.05");
            tl.to(r.body, { opacity: 1, duration: 0.45 }, at + "+=0.3");
          }
          if (s === 2 && r.txt2) {
            tl.to(r.txt, { opacity: 0, duration: 0.3 }, at + "+=0.05");
            tl.to(r.txt2, { opacity: 1, duration: 0.45 }, at + "+=0.3");
          }
        });
        tl.to(outs[s - 1], { opacity: 0, duration: 0.3 }, at + "+=0.6");
        tl.to(outs[s], { opacity: 1, duration: 0.45 }, at + "+=0.9");
        tl.to(chips[s - 1].off, { opacity: 0, duration: 0.3 }, at + "+=1.1");
        tl.to(chips[s - 1].on, { opacity: 1, duration: 0.35 }, at + "+=1.1");
        tl.addLabel("s" + s, at + "+=1.5");
      }
      return tl;
    }
  };
})();
