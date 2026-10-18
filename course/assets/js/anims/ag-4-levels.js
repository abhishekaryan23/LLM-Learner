/* AG.4: progressive disclosure of Agent Skills in three levels. Illustrative token
   counts: metadata ~100 per skill; SKILL.md body 2,000; reference file 1,500;
   script output 200 (the script's code is never loaded).
   Progressive total = 400 + 2,000 + 1,500 + 200 = 4,100.
   Everything up front = 4 skills × (2,000 body + 3,000 references) = 20,000. */
(function () {
  var LC = window.LC;
  var SKILLS = ["pptx-deck", "contract-review", "release-notes", "brand-voice"];
  var HIT = 1, MAXT = 20000;
  var TREE = [
    { c: "SKILL.md", tag: "L2 · 2,000", lvl: 2 },
    { c: "references/nda-checklist.md", tag: "L3 · 1,500", lvl: 3 },
    { c: "scripts/redline.py", tag: "L3 · output 200", lvl: 3 }
  ];
  var CTX = [0, 400, 400, 2400, 4100, 4100];

  LC.anims["ag-4-levels"] = {
    title: "Agent Skills: three levels of loading",
    steps: [
      "Four skills are installed: four folders on disk. Nothing from them is in the model's context yet.",
      "<strong>Level 1</strong>, at start-up: only each skill's <strong>name and description</strong> go into the context, about 100 tokens each. 400 tokens for all four.",
      "You ask: <em>“Review this NDA with our checklist.”</em> The request matches the description of <strong>contract-review</strong>.",
      "<strong>Level 2</strong>: the agent reads that skill's full <strong>SKILL.md</strong> instructions (here 2,000 tokens). The other three stay as one-liners.",
      "<strong>Level 3</strong>, only as needed: the instructions point to a checklist file, which the agent reads (1,500 tokens), and a script, which it <strong>runs</strong>. The script's code never enters the context; only its short output does (about 200 tokens).",
      "Total: about <strong>4,100 tokens</strong>. Loading all four skills up front, each with its full instructions and all its reference files (about 3,000 tokens per skill), would cost about <strong>20,000</strong>, and the gap grows with every skill you install."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 420 } : { w: 640, h: 384 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      var cards = compact
        ? SKILLS.map(function (s, i) { return { x: 4 + (i % 2) * 180, y: 28 + Math.floor(i / 2) * 52, w: 172, h: 42 }; })
        : SKILLS.map(function (s, i) { return { x: 8 + i * 158, y: 30, w: 150, h: 44 }; });
      var L = compact
        ? { l1: 150, ask: 176, tree: 208, rowH: 24, mLbl: 318, mBar: 326, aLbl: 372, aBar: 380, bh: 16, x0: 4, x1: 356 }
        : { l1: 98, ask: 128, tree: 162, rowH: 26, mLbl: 284, mBar: 292, aLbl: 338, aBar: 346, bh: 18, x0: 8, x1: 632 };
      function bw(t) { return t / MAXT * (L.x1 - L.x0); }
      var cls = compact ? "t t-sm" : "t";

      S("text", { x: L.x0, y: 16, class: "t t-sm t-muted", text: compact ? "skills/ folder: 4 skills on disk" : "skills/ folder: 4 skills installed on disk" }, svg);
      var outl = [], hitHL;
      cards.forEach(function (c, i) {
        S("rect", { x: c.x, y: c.y, width: c.w, height: c.h, rx: 8, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, svg);
        S("text", { x: c.x + c.w / 2, y: c.y + c.h / 2 + 4.5, class: cls + " t-mid t-mono", text: SKILLS[i] }, svg);
        var o = S("rect", { x: c.x - 2, y: c.y - 2, width: c.w + 4, height: c.h + 4, rx: 10, class: "f-none", stroke: "var(--a-blue)", "stroke-width": 2.5 }, svg);
        o.style.opacity = 0; outl.push(o);
      });
      var hc = cards[HIT];
      hitHL = S("rect", { x: hc.x - 3, y: hc.y - 3, width: hc.w + 6, height: hc.h + 6, rx: 11, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 3.5 }, svg);
      hitHL.style.opacity = 0;
      var l1 = S("text", { x: L.x0, y: L.l1, class: "t t-sm t-blue", "font-weight": 600, text: compact ? "L1: name + description, ~100 tokens each" : "Level 1: name + description of every skill, ~100 tokens each" }, svg);
      var ask = S("text", { x: L.x0, y: L.ask, class: cls, "font-weight": 600, text: compact ? "You: “Review this NDA with our checklist”" : "You: “Review this NDA with our checklist.” → matches contract-review" }, svg);
      l1.style.opacity = 0; ask.style.opacity = 0;

      var treeHead = S("text", { x: L.x0, y: L.tree, class: cls + " t-mono", "font-weight": 650, text: "contract-review/" }, svg);
      treeHead.style.opacity = 0;
      var treeRows = TREE.map(function (r, i) {
        var y = L.tree + (i + 1) * L.rowH;
        var g = S("g", {}, svg);
        S("text", { x: L.x0 + 16, y: y, class: cls + " t-mono", text: (i === TREE.length - 1 ? "└ " : "├ ") + r.c }, g);
        S("text", { x: L.x1, y: y, class: "t t-sm t-end " + (r.lvl === 2 ? "t-blue" : "t-orange"), "font-weight": 650, text: r.tag }, g);
        g.style.opacity = 0;
        return g;
      });

      // context meter
      S("rect", { x: L.x0, y: L.mBar, width: L.x1 - L.x0, height: L.bh, rx: 4, class: "f-none", stroke: "var(--line)", "stroke-width": 1.5 }, svg);
      var bar = S("rect", { x: L.x0, y: L.mBar, width: 0, height: L.bh, rx: 4, class: "f-blue" }, svg);
      var mLabels = {};
      CTX.forEach(function (t) {
        if (mLabels[t] != null) return;
        var e = S("text", { x: L.x0, y: L.mLbl, class: "t t-sm", "font-weight": 600, text: "In context from skills: " + t.toLocaleString("en-US") + " tokens" }, svg);
        e.style.opacity = t === 0 ? 1 : 0; mLabels[t] = e;
      });
      var allLbl = S("text", { x: L.x0, y: L.aLbl, class: "t t-sm t-orange", "font-weight": 600, text: "Everything up front: 20,000 tokens" }, svg);
      var allBar = S("rect", { x: L.x0, y: L.aBar, width: 0, height: L.bh, rx: 4, class: "f-orange", "fill-opacity": 0.6 }, svg);
      allLbl.style.opacity = 0;

      function meter(from, to) {
        if (from === to) return;
        tl.to(bar, { attr: { width: bw(to) }, duration: 0.6, ease: "power2.inOut" });
        tl.to(mLabels[from], { opacity: 0, duration: 0.2 }, "<");
        tl.to(mLabels[to], { opacity: 1, duration: 0.3 }, "<0.2");
      }

      tl.addLabel("s0", 0);
      LC.popIn(tl, outl, { duration: 0.3, stagger: 0.08 });
      LC.popIn(tl, l1, { duration: 0.3 });
      meter(0, 400);
      tl.addLabel("s1");

      LC.popIn(tl, ask, { duration: 0.4 });
      tl.to(outl[HIT], { opacity: 0, duration: 0.2 });
      tl.to(hitHL, { opacity: 1, duration: 0.3 }, "<");
      tl.addLabel("s2");

      LC.popIn(tl, [treeHead, treeRows[0]], { duration: 0.4, stagger: 0.15 });
      meter(400, 2400);
      tl.addLabel("s3");

      LC.popIn(tl, treeRows.slice(1), { duration: 0.4, stagger: 0.3 });
      meter(2400, 4100);
      tl.addLabel("s4");

      LC.popIn(tl, allLbl, { duration: 0.3 });
      tl.to(allBar, { attr: { width: bw(20000) }, duration: 0.8, ease: "power2.out" });
      tl.addLabel("s5");
      return tl;
    }
  };
})();
