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

  document.addEventListener("lc:ready", function () {
    buildEli5(); buildQuizzes(); buildRecall(); buildBlanks(); buildColab(); buildLockIn();
  });
})();
