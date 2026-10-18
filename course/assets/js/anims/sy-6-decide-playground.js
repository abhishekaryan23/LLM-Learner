/* SY.6 playground: a decision guide for prompting vs RAG vs fine-tuning.
   Five questions (real buttons). The picture splits the options by what they change:
   what the model READS (prompt, retrieved passages) vs what the model IS (its weights),
   plus four related tools (Agent Skill, rules file, LLM wiki, structured output).
   State per node: 2 = recommended, 1 = worth considering / later, 0 = not needed.
   The rules are a teaching heuristic, written out in the lesson text. */
(function () {
  var LC = window.LC;
  var NODES = [
    { id: "prompt", label: "Prompt" },
    { id: "rag", label: "RAG" },
    { id: "ft", label: "Fine-tune" },
    { id: "skill", label: "Agent Skill" },
    { id: "rules", label: "Rules file" },
    { id: "wiki", label: "LLM wiki" },
    { id: "json", label: "Structured output" }
  ];

  function recommend(a) {
    var need = a[0], change = a[1], fmt = a[2], tight = a[3], data = a[4];
    var st = { prompt: 2, rag: 0, ft: 0, skill: 0, rules: 0, wiki: 0, json: 0 };
    var why = ["<strong>Start with prompting</strong> and a small eval set (<a href=\"m4-7.html\">M4.7</a>). It is the cheapest thing to change, and every other option is measured against it."];
    var knowledge = need === 0 || need === 2, behaviour = need === 1 || need === 2;

    if (knowledge) {
      st.rag = 2;
      if (change === 2) why.push("<strong>RAG</strong>, because the knowledge changes daily: update the index and the next question sees it. Retraining can't keep up, and RAG can cite its sources.");
      else if (change === 1) {
        why.push("<strong>RAG</strong>: re-index monthly changes in minutes, and show citations. For a small, evolving body of knowledge you want summarised and cross-linked once, an <strong>LLM wiki</strong> also fits (<a href=\"ag-6.html\">AG.6</a>).");
        st.wiki = 1;
      } else if (change === 0) why.push("<strong>RAG</strong> for anything large or private, even if it rarely changes. If it fits in a few thousand tokens, simply put it in the prompt and use prompt caching. Fine-tuning doesn't reliably store exact facts.");
      else why.push("<strong>RAG</strong> for knowledge: fetch the relevant passages per question, with citations.");
    }

    if (fmt === 2) { st.json = 2; why.push("Strict format: if the output is machine-readable (JSON), use <strong>structured outputs</strong> where your API offers them, which constrain decoding to a schema. For a house style or a format prompts can't hold, fine-tuning is the reliable fix."); }
    else if (fmt === 1) why.push("Some format or style: a few examples in the prompt (few-shot) usually hold it.");

    var wantsFt = behaviour && (fmt === 2 || tight === 1 || need === 1);
    if (wantsFt && data >= 1) {
      st.ft = 2;
      why.push("<strong>Fine-tune</strong> (usually LoRA, <a href=\"m3-7.html\">M3.7</a>): you have " + (data === 2 ? "thousands of" : "hundreds of") + " examples of the behaviour, and " + (tight === 1 ? "a smaller fine-tuned model can be much cheaper and faster than a big model with a long prompt." : "training bakes the habit in, so it no longer needs instructions in every prompt."));
    } else if (wantsFt && data === 0) {
      st.ft = 1;
      why.push("Fine-tuning would fit, but you have too few examples. Use few-shot prompting now, log real traffic, and build a training set. To get a small, fast model later: <strong>distil</strong> one, by generating examples with a big model and filtering them with your eval.");
    } else if (need === 0 && tight === 1 && data >= 1) {
      st.ft = 1;
      why.push("Optional: fine-tune a <strong>small</strong> model to answer well from retrieved passages, so you can drop the big model. That's a combination of RAG and fine-tuning.");
    }

    if (behaviour && (data === 0 || data == null)) {
      st.skill = 1; st.rules = 1;
      why.push("If the behaviour is a procedure needed only sometimes, an <strong>Agent Skill</strong> fits (<a href=\"ag-4.html\">AG.4</a>); conventions a coding agent needs on every task belong in a <strong>rules file</strong> (<a href=\"ag-5.html\">AG.5</a>).");
    }
    if (tight === 1 && st.ft !== 2) why.push("Tight latency or cost: shorten the prompt, cache its stable prefix (<a href=\"ag-2.html\">AG.2</a>) and try a smaller model before anything else.");
    if (data === 2 && st.ft !== 2 && !behaviour && need != null) why.push("Lots of labelled data is also your eval set: use it to measure retrieval and answers, not only to train.");

    var main = ["Prompting"];
    if (st.rag === 2) main.push("RAG");
    if (st.ft === 2) main.push("fine-tuning");
    var title = main.length === 1 ? "Prompting" + (st.json === 2 ? " + structured output" : "") : main.join(" + ");
    if (st.rag === 2 && st.ft === 2) title += " (a combination)";
    return { st: st, title: title, why: why };
  }

  function init(root) {
    var stage = root.querySelector(".pg-stage");
    var out = root.querySelector(".pg-hint");
    var groups = [].slice.call(root.querySelectorAll("[data-q]"));
    var ans = [null, null, null, null, null];
    var layout = null, svg = null, els = {};

    function build() {
      layout = stage.clientWidth < 560 ? "compact" : "wide";
      var compact = layout === "compact", S = LC.svg;
      var W = compact ? 360 : 640, H = compact ? 336 : 206;
      if (svg) svg.remove();
      svg = S("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Diagram: prompt and RAG change what the model reads; fine-tuning changes the model's weights; four related tools sit below. The recommended options for your answers are highlighted, and the text below explains why." });
      svg.style.display = "block"; svg.style.width = "100%"; svg.style.height = "auto";
      svg.style.maxHeight = compact ? "none" : "300px";
      stage.appendChild(svg);
      els = {};
      var boxes;
      if (compact) {
        boxes = {
          A: { x: 8, y: 8, w: 344, h: 92, label: "changes what the model reads" },
          B: { x: 8, y: 130, w: 344, h: 92, label: "changes the model's weights" }
        };
        place("prompt", 22, 46, 152); place("rag", 186, 46, 152); place("ft", 22, 168, 316);
        S("path", { d: "M180 103V125m-5 -6l5 6l5 -6", class: "s-faint", "stroke-width": 2, fill: "none" }, svg);
        S("text", { x: 8, y: 252, class: "t t-sm t-muted", text: "also on the AG.1 map" }, svg);
        place("skill", 8, 262, 170, true); place("rules", 182, 262, 170, true);
        place("wiki", 8, 300, 170, true); place("json", 182, 300, 170, true);
      } else {
        boxes = {
          A: { x: 8, y: 8, w: 392, h: 104, label: "changes what the model reads" },
          B: { x: 440, y: 8, w: 192, h: 104, label: "changes the model's weights" }
        };
        place("prompt", 24, 50, 172); place("rag", 212, 50, 172); place("ft", 456, 50, 160);
        S("path", { d: "M404 60H434m-6 -5l6 5l-6 5", class: "s-faint", "stroke-width": 2, fill: "none" }, svg);
        S("text", { x: 8, y: 150, class: "t t-sm t-muted", text: "also on the AG.1 map" }, svg);
        place("skill", 8, 162, 148, true); place("rules", 169, 162, 148, true);
        place("wiki", 330, 162, 140, true); place("json", 483, 162, 149, true);
      }
      ["A", "B"].forEach(function (k) {
        var b = boxes[k];
        var r = S("rect", { x: b.x, y: b.y, width: b.w, height: b.h, rx: 12, class: "f-none", stroke: "var(--a-ink)", "stroke-width": 1.5 }, svg);
        svg.insertBefore(r, svg.firstChild);
        S("text", { x: b.x + 14, y: b.y + 22, class: "t t-sm t-muted", "font-weight": 600, text: b.label }, svg);
      });
      function place(id, x, y, w, small) {
        var h = small ? 32 : 40, g = S("g", {}, svg);
        var r = S("rect", { x: x, y: y, width: w, height: h, rx: small ? 16 : 10, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, g);
        var lab = NODES.filter(function (n) { return n.id === id; })[0].label;
        var t = S("text", { x: x + w / 2, y: y + h / 2 + 4.5, class: "t t-mid" + (small ? " t-sm" : ""), "font-weight": 600, text: lab }, g);
        els[id] = { g: g, r: r, t: t, small: small };
      }
      paint();
    }

    function paint() {
      var answered = ans.filter(function (v) { return v != null; }).length;
      var rec = recommend(ans);
      NODES.forEach(function (n) {
        var e = els[n.id], s = answered ? rec.st[n.id] : 0;
        e.r.setAttribute("class", s === 2 ? "f-orange" : "f-surface");
        e.r.setAttribute("stroke", s === 2 ? "var(--a-orange)" : s === 1 ? "var(--a-orange)" : "var(--line)");
        e.r.setAttribute("stroke-dasharray", s === 1 ? "6 4" : "");
        e.t.setAttribute("class", "t t-mid" + (e.small ? " t-sm" : "") + (s === 2 ? " t-nohalo" : ""));
        e.t.style.fill = s === 2 ? "#fff" : "";
        e.g.style.opacity = !answered || s ? 1 : 0.45;
      });
      if (!answered) { out.innerHTML = "Answer the five questions above. Recommended options turn solid orange; dashed ones are worth considering later."; return; }
      out.innerHTML = "<strong>" + (answered < 5 ? "So far: " : "Recommendation: ") + rec.title + "</strong>" +
        (answered < 5 ? " <span class=\"t-muted\">(" + answered + " of 5 answered)</span>" : "") +
        "<ul>" + rec.why.map(function (w) { return "<li>" + w + "</li>"; }).join("") + "</ul>";
    }

    root.addEventListener("click", function (e) {
      var b = e.target.closest("[data-v]"); if (!b || !root.contains(b)) return;
      var g = b.closest("[data-q]"), q = +g.dataset.q;
      ans[q] = +b.dataset.v;
      g.querySelectorAll("[data-v]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      paint();
    });
    root.querySelector('[data-act="reset"]').addEventListener("click", function () {
      ans = [null, null, null, null, null];
      groups.forEach(function (g) { g.querySelectorAll("[data-v]").forEach(function (x) { x.setAttribute("aria-pressed", "false"); }); });
      paint();
    });
    build();
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        var want = stage.clientWidth < 560 ? "compact" : "wide";
        if (want !== layout) build();
      }).observe(stage);
    }
  }

  document.addEventListener("lc:ready", function () {
    var root = document.getElementById("sy6-decide");
    if (root) init(root);
  });
})();
