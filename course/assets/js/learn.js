/* Learning engine: pre-tests, quizzes (with confidence), free recall / explain-it-back,
   fill-in blanks for faded examples, ELI5 summaries, and the spaced-repetition deck. */
(function () {
  var LC = window.LC;
  var I = LC.icons;
  var KEYS = "ABCDEFGH";
  var HOUR = 3600e3, DAY = 24 * HOUR;

  /* ---------- Spaced repetition ----------
     A simple expanding ladder (Cepeda et al. 2006: gaps that grow with the retention interval).
     Step 0 = same day; each "Good" climbs one rung, "Easy" two, "Hard" holds, "Again" resets. */
  var LADDER = [4 * HOUR, 1 * DAY, 3 * DAY, 7 * DAY, 16 * DAY, 35 * DAY, 90 * DAY, 180 * DAY];
  LC.srs = {
    LADDER: LADDER,
    schedule: function (card, grade, now) {
      now = now || Date.now();
      var step = card.step || 0;
      if (grade === "again") { step = 0; card.lapses = (card.lapses || 0) + 1; card.due = now + 10 * 60e3; }
      else {
        if (grade === "hard") step = Math.max(0, step);
        else if (grade === "good") step = step + 1;
        else if (grade === "easy") step = step + 2;
        step = Math.min(step, LADDER.length - 1);
        card.due = now + (grade === "hard" ? Math.max(LADDER[step] * 0.6, 2 * HOUR) : LADDER[step]);
      }
      card.step = step;
      card.reviews = (card.reviews || 0) + 1;
      card.last = now;
      return card;
    },
    label: function (ms) {
      if (ms < HOUR) return Math.max(1, Math.round(ms / 60e3)) + "m";
      if (ms < DAY) return Math.round(ms / HOUR) + "h";
      return Math.round(ms / DAY) + "d";
    },
    addCards: function (lessonId, lessonTitle, list, weak) {
      var cards = LC.store.get("cards", {}), now = Date.now(), added = 0;
      list.forEach(function (c) {
        if (cards[c.id]) return;
        // New cards wait at least a few hours: spacing beats immediate re-reading.
        cards[c.id] = { id: c.id, front: c.front, back: c.back, lesson: lessonId, lessonTitle: lessonTitle, step: weak ? 0 : 1, due: now + (weak ? LADDER[0] : LADDER[1]), added: now, reviews: 0 };
        added++;
      });
      LC.store.set("cards", cards);
      LC.refreshBadge();
      return added;
    }
  };

  /* ---------- Multiple-choice questions ---------- */
  function buildMCQ(q, opts) {
    var src = q.querySelector("ol.q-src");
    if (!src) return;
    var answer = parseInt(q.getAttribute("data-answer"), 10);
    var items = Array.prototype.slice.call(src.children);
    var wrap = LC.el('<div class="q-options" role="group"></div>');
    var feedback = LC.el('<div class="q-feedback" hidden aria-live="polite"></div>');
    var explain = q.querySelector(".q-explain");
    var conf = null;

    if (opts.confidence) {
      var cbox = LC.el('<div class="confidence"><span>How sure are you?</span></div>');
      ["Guessing", "Unsure", "Sure"].forEach(function (lbl, i) {
        var b = LC.el('<button type="button" class="chip" aria-pressed="false">' + lbl + "</button>");
        b.addEventListener("click", function () {
          conf = i; cbox.querySelectorAll(".chip").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        });
        cbox.appendChild(b);
      });
      q.insertBefore(cbox, src);
    }

    items.forEach(function (li, i) {
      var why = li.querySelector(".why"); if (why) why.remove();
      var b = LC.el('<button type="button" class="q-option"><span class="key" aria-hidden="true">' + KEYS[i] + "</span><span></span></button>");
      b.lastChild.innerHTML = li.innerHTML;
      b.addEventListener("click", function () {
        var right = i === answer;
        wrap.querySelectorAll(".q-option").forEach(function (o, j) {
          o.disabled = true;
          if (j === answer) o.classList.add("correct");
          else if (j === i) o.classList.add("wrong");
        });
        var msg = opts.pretest
          ? '<span class="verdict ' + (right ? "ok" : "no") + '">' + (right ? "Good guess!" : "Not quite, and that's fine.") + "</span> " +
            (right ? "" : "Guessing first makes the real answer stick better later. ")
          : '<span class="verdict ' + (right ? "ok" : "no") + '">' + (right ? "Correct." : "Not this one.") + "</span> ";
        if (why) msg += why.innerHTML + " ";
        if (explain) msg += explain.innerHTML;
        feedback.innerHTML = msg; feedback.hidden = false;
        q.dataset.result = right ? "1" : "0";
        q.dataset.conf = conf == null ? "" : String(conf);
        q.dispatchEvent(new CustomEvent("lc:answered", { bubbles: true, detail: { right: right, conf: conf } }));
      });
      wrap.appendChild(b);
    });
    if (explain) explain.hidden = true;
    src.replaceWith(wrap);
    q.appendChild(feedback);
  }

  function buildQuizzes() {
    document.querySelectorAll("[data-pretest] .q").forEach(function (q) { buildMCQ(q, { pretest: true }); });
    document.querySelectorAll("[data-quiz]").forEach(function (quiz) {
      var qs = quiz.querySelectorAll(".q");
      qs.forEach(function (q) { buildMCQ(q, { confidence: true }); });
      var line = LC.el('<p class="score-line" aria-live="polite"></p>');
      quiz.appendChild(line);
      quiz.addEventListener("lc:answered", function () {
        var answered = quiz.querySelectorAll(".q[data-result]");
        if (answered.length < qs.length) { line.textContent = answered.length + " of " + qs.length + " answered"; return; }
        var right = 0, sure = 0, sureRight = 0, guessed = 0;
        answered.forEach(function (q) {
          var r = q.dataset.result === "1"; if (r) right++;
          if (q.dataset.conf === "2") { sure++; if (r) sureRight++; }
          if (q.dataset.conf === "0") guessed++;
        });
        var txt = "You got " + right + " / " + qs.length + ".";
        if (sure) txt += " When you felt sure, you were right " + sureRight + " of " + sure + " times.";
        if (right < qs.length || guessed) txt += " Your review cards for this lesson will come back sooner.";
        line.textContent = txt;
        LC.markProgress(LC.lessonId, { quiz: right / qs.length, weak: right < qs.length || guessed > 0 });
      });
    });
  }

  /* ---------- Free recall & explain-it-back ---------- */
  function buildRecall() {
    document.querySelectorAll(".recall").forEach(function (box) {
      var id = (LC.lessonId || "page") + ":" + (box.getAttribute("data-id") || "recall");
      var model = box.querySelector(".model-answer");
      if (model) model.hidden = true;
      var ta = LC.el('<textarea aria-label="Your answer" placeholder="Type from memory, no peeking. A rough sentence is fine."></textarea>');
      var saved = LC.store.get("recall:" + id, "");
      ta.value = saved;
      ta.addEventListener("input", function () { LC.store.set("recall:" + id, ta.value); });
      var row = LC.el('<div class="row"><button type="button" class="btn">' + I.check + "Compare with model answer</button></div>");
      var grade = LC.el('<div class="row self-grade" hidden><span>How close were you?</span></div>');
      ["Missed it", "Partly", "Nailed it"].forEach(function (lbl, i) {
        var b = LC.el('<button type="button" class="chip" aria-pressed="false">' + lbl + "</button>");
        b.addEventListener("click", function () {
          grade.querySelectorAll(".chip").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
          LC.store.set("recallgrade:" + id, i);
          if (i < 2) LC.markProgress(LC.lessonId, { weak: true });
        });
        grade.appendChild(b);
      });
      var anchor = model || null;
      box.insertBefore(ta, anchor); box.insertBefore(row, anchor);
      if (model) box.appendChild(grade);
      row.querySelector("button").addEventListener("click", function () {
        if (!ta.value.trim()) { ta.focus(); LC.toast("Give it a go first. Even a guess helps you remember."); return; }
        if (model) { model.hidden = false; grade.hidden = false; }
        this.disabled = true;
      });
    });
  }

  /* ---------- Fill-in blanks (faded worked examples) ---------- */
  function buildBlanks() {
    document.querySelectorAll(".blank").forEach(function (sp) {
      var ans = parseFloat(sp.getAttribute("data-answer"));
      var tol = parseFloat(sp.getAttribute("data-tol") || "0.01");
      var hint = sp.getAttribute("data-hint") || "";
      var w = LC.el('<span class="blank-input"><input type="text" inputmode="decimal" autocomplete="off" aria-label="Your answer"><button type="button" class="btn">Check</button><span class="res" aria-live="polite"></span></span>');
      var inp = w.querySelector("input"), res = w.querySelector(".res");
      function check() {
        var v = parseFloat(String(inp.value).replace(",", "."));
        if (isNaN(v)) { res.className = "res no-text"; res.textContent = "Enter a number"; return; }
        if (Math.abs(v - ans) <= tol) { res.className = "res ok-text"; res.textContent = "✓ Yes, " + ans; inp.disabled = true; }
        else { res.className = "res no-text"; res.textContent = "Not quite. " + hint; }
      }
      w.querySelector("button").addEventListener("click", check);
      inp.addEventListener("keydown", function (e) { if (e.key === "Enter") check(); });
      sp.replaceWith(w);
    });
  }

  /* ---------- ELI5 summary chrome ---------- */
  function buildEli5() {
    document.querySelectorAll("details.eli5 > summary").forEach(function (s) {
      if (s.querySelector(".chev")) return;
      s.insertAdjacentHTML("afterbegin", I.spark);
      s.insertAdjacentHTML("beforeend", I.chev);
      s.firstChild.setAttribute("width", "20"); s.firstChild.setAttribute("height", "20");
    });
  }

  /* ---------- Colab links ---------- */
  function buildColab() {
    document.querySelectorAll("[data-colab]").forEach(function (a) {
      var nb = a.getAttribute("data-colab");
      a.href = "https://colab.research.google.com/github/" + LC.config.repo + "/blob/" + LC.config.branch + "/" + LC.config.notebookDir + "/" + nb;
      a.target = "_blank"; a.rel = "noopener";
    });
  }

  /* ---------- Lock-in: complete lesson + add cards ---------- */
  function buildLockIn() {
    var box = document.querySelector("[data-lockin]");
    var data = document.getElementById("cards");
    if (!box || !data) return;
    var list = [];
    try { list = JSON.parse(data.textContent); } catch (e) { return; }
    var title = document.querySelector("h1") ? document.querySelector("h1").textContent.trim() : LC.lessonId;
    var btn = LC.el('<button type="button" class="btn btn-primary">' + I.check + "Mark complete &amp; add " + list.length + " cards to my review deck</button>");
    var note = LC.el('<p class="math-note" aria-live="polite"></p>');
    function doneState() {
      btn.disabled = true; btn.innerHTML = I.check + "Lesson complete. Cards are in your deck";
      note.innerHTML = 'Your first review is scheduled. Open <a href="' + LC.root + 'review.html">Review</a> when the badge appears.';
    }
    if (LC.isDone(LC.lessonId)) doneState();
    btn.addEventListener("click", function () {
      var p = LC.progress()[LC.lessonId] || {};
      var n = LC.srs.addCards(LC.lessonId, title, list, !!p.weak);
      LC.markProgress(LC.lessonId, { done: Date.now() });
      doneState();
      LC.toast(n ? n + " cards added. First review " + (p.weak ? "in a few hours." : "tomorrow.") : "Already in your deck.");
    });
    var preview = LC.el('<details class="eli5" style="border-style:solid;border-color:var(--line)"><summary style="color:var(--ink)">Preview the ' + list.length + " cards</summary><div class=\"eli5-body\"><ol></ol></div></details>");
    var ol = preview.querySelector("ol");
    list.forEach(function (c) { var li = document.createElement("li"); li.innerHTML = "<strong>" + c.front + "</strong><br>" + c.back; ol.appendChild(li); });
    box.appendChild(btn); box.appendChild(note); box.appendChild(preview);
    LC.renderMath(preview);
  }

  /* ---------- Bytes: every lesson as a series of 3–6 minute chunks ----------
     Chunks are cut at the lesson's top-level <h2>s. Everything before the first
     <h2> is the warm-up; everything from the first wrap-up block (explain-it-back,
     quiz, takeaways, Colab, lock-in) on is the wrap-up. Focus mode shows one byte
     at a time. A byte counts as done when its end scrolls into view or its byte
     check is answered. Deep links: lesson.html#byte-3, add ?focus=1 for focus mode. */
  var WRAP_SEL = ".recall, [data-quiz], .takeaways, [data-lockin], .colab";

  function readMinutes(sec) {
    var words = (sec.textContent || "").trim().split(/\s+/).length;
    var visuals = sec.querySelectorAll("figure.anim, .playground").length;
    var m = words / 200 + visuals * 1.0;
    return Math.max(1, Math.round(m * 2) / 2);
  }

  function buildBytes() {
    var main = document.getElementById("main");
    if (!main || !LC.lessonId) return;
    var kids = Array.prototype.slice.call(main.children);
    var firstH2 = kids.findIndex(function (n) { return n.tagName === "H2"; });
    if (firstH2 < 0) return;
    // the lesson head (kicker, title, meta) stays outside the bytes so it's always visible
    var meta0 = main.querySelector(":scope > .lesson-meta");
    var head = document.createElement("header"); head.className = "lesson-head";
    main.insertBefore(head, main.firstChild);
    kids.slice(0, kids.indexOf(meta0) + 1).forEach(function (n) { head.appendChild(n); });
    kids = Array.prototype.slice.call(main.children).filter(function (n) { return n !== head; });
    firstH2 = kids.findIndex(function (n) { return n.tagName === "H2"; });
    var groups = [{ kind: "warmup", nodes: kids.slice(0, firstH2) }], cur = null, wrapping = false;
    kids.slice(firstH2).forEach(function (n) {
      if (n.classList && n.classList.contains("lesson-nav")) return;
      if (!wrapping && n.matches && (n.matches(WRAP_SEL) || (n.tagName === "SCRIPT" && n.id === "cards"))) {
        wrapping = true; cur = { kind: "wrapup", nodes: [] }; groups.push(cur);
      } else if (!wrapping && n.tagName === "H2") {
        cur = { kind: "learn", nodes: [] }; groups.push(cur);
      }
      cur.nodes.push(n);
    });
    var total = groups.length, P = LC.progress()[LC.lessonId] || {}, done = P.bytes || {};
    var secs = groups.map(function (g, i) {
      var sec = document.createElement("section");
      sec.className = "byte byte-" + g.kind; sec.id = "byte-" + i; sec.dataset.byte = i;
      g.nodes[0].parentNode.insertBefore(sec, g.nodes[0]);
      g.nodes.forEach(function (n) { sec.appendChild(n); });
      var label = g.kind === "warmup" ? "Warm-up" : g.kind === "wrapup" ? "Wrap-up" : "Byte " + i + " of " + (total - 2);
      var tag = LC.el('<p class="byte-tag"><span class="byte-num"></span><span class="byte-mins"></span></p>');
      tag.firstChild.textContent = label;
      tag.lastChild.textContent = "~" + readMinutes(sec) + " min";
      sec.insertBefore(tag, sec.firstChild);
      // end-of-byte navigation (shown in focus mode) + sentinel for "read"
      var nav = LC.el('<div class="byte-nav"></div>');
      if (i > 0) nav.appendChild(LC.el('<button type="button" class="btn" data-go="' + (i - 1) + '">' + I.prev + 'Previous</button>'));
      if (i < total - 1) nav.appendChild(LC.el('<button type="button" class="btn btn-primary" data-go="' + (i + 1) + '">Next byte' + I.next + '</button>'));
      sec.appendChild(nav);
      sec.appendChild(LC.el('<div class="byte-end" aria-hidden="true"></div>')); // always-visible "read to here" marker
      return sec;
    });

    // byte strip in the lesson header
    var strip = LC.el('<div class="byte-strip" role="group" aria-label="Bytes in this lesson"></div>');
    secs.forEach(function (s, i) {
      var g = groups[i];
      var b = LC.el('<button type="button" class="byte-dot" data-go="' + i + '"></button>');
      b.textContent = g.kind === "warmup" ? "▶" : g.kind === "wrapup" ? "✓" : i;
      b.setAttribute("aria-label", (g.kind === "learn" ? "Byte " + i : g.kind === "warmup" ? "Warm-up" : "Wrap-up") + (done[i] ? " (done)" : ""));
      if (done[i]) b.classList.add("done");
      strip.appendChild(b);
    });
    var focusBtn = LC.el('<button type="button" class="btn btn-ghost focus-toggle" aria-pressed="false"></button>');
    var meta = head.querySelector(".lesson-meta");
    var bar = LC.el('<div class="byte-bar"></div>');
    bar.appendChild(strip); bar.appendChild(focusBtn);
    head.appendChild(bar);
    var minsEl = meta.querySelector("[data-mins]");
    if (minsEl) minsEl.insertAdjacentHTML("afterend", '<span>' + (total - 2) + " bytes</span>");

    function markDone(i) {
      if (done[i]) return;
      done[i] = true;
      LC.markProgress(LC.lessonId, { bytes: done });
      var dot = strip.children[i]; if (dot) { dot.classList.add("done"); dot.setAttribute("aria-label", dot.getAttribute("aria-label") + " (done)"); }
    }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) markDone(+e.target.closest(".byte").dataset.byte); });
      }, { rootMargin: "0px 0px -10% 0px" });
      secs.forEach(function (s) { io.observe(s.querySelector(".byte-end")); });
    }
    secs.forEach(function (s, i) {
      s.addEventListener("lc:answered", function (e) { if (e.target.closest(".byte-check")) markDone(i); });
    });

    var focus = false, current = 0;
    function show(i, scroll) {
      current = Math.max(0, Math.min(total - 1, i));
      secs.forEach(function (s, k) { s.classList.toggle("current", k === current); });
      document.body.classList.toggle("byte-last", current === total - 1);
      Array.prototype.forEach.call(strip.children, function (b, k) { if (k === current) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current"); });
      if (scroll) {
        if (focus) window.scrollTo(0, 0); // keep the title and byte strip in view
        else secs[current].scrollIntoView({ behavior: "auto", block: "start" });
      }
    }
    function setFocus(on) {
      focus = on;
      document.body.classList.toggle("focus-mode", on);
      focusBtn.setAttribute("aria-pressed", String(on));
      focusBtn.textContent = on ? "Show whole lesson" : "Focus: one byte at a time";
      window.dispatchEvent(new Event("resize")); // let animations re-measure
    }
    focusBtn.addEventListener("click", function () { setFocus(!focus); LC.store.set("focus", focus); show(current, true); });
    main.addEventListener("click", function (e) {
      var b = e.target.closest("[data-go]"); if (!b) return;
      show(+b.dataset.go, true);
      history.replaceState(null, "", "#byte-" + current);
    });

    var m = /#byte-(\d+)/.exec(location.hash);
    var wantFocus = /[?&]focus=1/.test(location.search) || LC.store.get("focus", false) === true;
    setFocus(wantFocus);
    show(m ? +m[1] : 0, !!m);
  }

  /* ---------- Latest developments (from the weekly field notes) ---------- */
  function buildLatest() {
    if (!LC.lessonId || !window.fetch) return;
    fetch(LC.root + "field-notes/notes.json", { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : []; }).then(function (notes) {
      var mine = (notes || []).filter(function (n) { return (n.lessons || []).indexOf(LC.lessonId) >= 0; })
        .sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 3);
      if (!mine.length) return;
      var box = LC.el('<section class="card latest" aria-labelledby="latest-h"><div class="card-label" id="latest-h">Latest developments</div><ul class="latest-list"></ul>' +
        '<p class="math-note" style="margin:0"><a href="' + LC.root + 'whats-new.html">All field notes →</a></p></section>');
      var ul = box.querySelector("ul");
      mine.forEach(function (n) {
        var li = document.createElement("li");
        li.innerHTML = '<span class="latest-date"></span> <a></a><br><span class="latest-why"></span>';
        li.querySelector(".latest-date").textContent = n.date;
        var a = li.querySelector("a"); a.textContent = n.title; a.href = LC.root + "whats-new.html#" + encodeURIComponent(n.id);
        li.querySelector(".latest-why").textContent = n.why || "";
        ul.appendChild(li);
      });
      var wrap = document.querySelector(".byte-wrapup") || document.querySelector("[data-quiz]");
      if (wrap) wrap.insertBefore(box, wrap.querySelector(".byte-tag") ? wrap.querySelector(".byte-tag").nextSibling : wrap.firstChild);
    }).catch(function () {});
  }

  document.addEventListener("lc:ready", function () {
    buildEli5(); buildQuizzes(); buildRecall(); buildBlanks(); buildColab(); buildLockIn();
    document.querySelectorAll(".byte-check .q").forEach(function (q) { buildMCQ(q, {}); });
    buildBytes(); buildLatest();
  });
})();
