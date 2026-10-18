/* Review page: due cards, shuffled across lessons (interleaving), graded on the SRS ladder. */
(function () {
  var LC = window.LC;

  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function cards() { return LC.store.get("cards", {}); }
  function saveCard(c) { var all = cards(); all[c.id] = c; LC.store.set("cards", all); }

  var root, statsEl, stage, queue = [], current = null, practice = false, doneCount = 0;

  function renderStats() {
    var all = cards(), ids = Object.keys(all), now = Date.now();
    var due = ids.filter(function (k) { return all[k].due <= now; }).length;
    var solid = ids.filter(function (k) { return (all[k].step || 0) >= 4; }).length;
    statsEl.innerHTML =
      '<div class="stat"><b>' + due + '</b><span>due now</span></div>' +
      '<div class="stat"><b>' + ids.length + '</b><span>in your deck</span></div>' +
      '<div class="stat"><b>' + solid + '</b><span>long-term (16d+)</span></div>';
    LC.refreshBadge();
  }

  function nextDueText() {
    var all = cards(), now = Date.now(), soonest = Infinity;
    Object.keys(all).forEach(function (k) { if (all[k].due > now) soonest = Math.min(soonest, all[k].due); });
    return soonest === Infinity ? "" : "Next card is due in " + LC.srs.label(soonest - now) + ".";
  }

  function empty() {
    var all = cards();
    if (!Object.keys(all).length) {
      stage.innerHTML = '<div class="empty"><p><strong>Your deck is empty.</strong></p><p>Finish a lesson and tap <em>Lock it in</em> to add its cards.</p>' +
        '<a class="btn btn-primary" href="lessons/m0-1.html">Start with “How memory works”</a></div>';
      return;
    }
    stage.innerHTML = '<div class="empty"><p><strong>All caught up' + (doneCount ? " (" + doneCount + " reviewed)" : "") + '.</strong> ' + nextDueText() + '</p>' +
      '<p>Want more? Practise upcoming cards without changing their schedule.</p>' +
      '<button type="button" class="btn" id="practise">Practise early</button></div>';
    document.getElementById("practise").addEventListener("click", function () {
      var all = cards();
      queue = shuffle(Object.keys(all).map(function (k) { return all[k]; }).sort(function (a, b) { return a.due - b.due; }).slice(0, 10));
      practice = true; doneCount = 0; next();
    });
  }

  function next() {
    renderStats();
    if (!queue.length) { practice = false; empty(); return; }
    current = queue.shift();
    var now = Date.now();
    var previews = ["again", "hard", "good", "easy"].map(function (g) {
      var c = LC.srs.schedule(Object.assign({}, current), g, now);
      return LC.srs.label(c.due - now);
    });
    stage.innerHTML =
      '<article class="flashcard" aria-live="polite">' +
        '<p class="from">' + (practice ? "Practice · " : "") + LC.escape(current.lessonTitle || current.lesson) + ' · ' + (queue.length + 1) + ' left</p>' +
        '<div class="front"></div>' +
        '<div class="back" hidden></div>' +
        '<div class="row" id="reveal-row"><button type="button" class="btn btn-primary" id="reveal">Show answer</button>' +
        '<span class="math-note" style="margin:0">Answer in your head first.</span></div>' +
        (practice
          ? '<div class="grade-row" hidden style="grid-template-columns:1fr 1fr"><button class="btn" data-g="again">Didn’t know</button><button class="btn" data-g="good">Knew it</button></div>'
          : '<div class="grade-row" hidden>' +
              '<button class="btn" data-g="again" style="color:var(--bad)">Again<small>' + previews[0] + '</small></button>' +
              '<button class="btn" data-g="hard">Hard<small>' + previews[1] + '</small></button>' +
              '<button class="btn" data-g="good" style="color:var(--good)">Good<small>' + previews[2] + '</small></button>' +
              '<button class="btn" data-g="easy" style="color:var(--accent)">Easy<small>' + previews[3] + '</small></button>' +
            '</div>') +
      '</article>';
    var art = stage.querySelector(".flashcard");
    art.querySelector(".front").innerHTML = current.front;
    art.querySelector(".back").innerHTML = current.back;
    LC.renderMath(art);
    var reveal = art.querySelector("#reveal");
    reveal.focus({ preventScroll: true });
    reveal.addEventListener("click", function () {
      art.querySelector(".back").hidden = false;
      art.querySelector("#reveal-row").hidden = true;
      art.querySelector(".grade-row").hidden = false;
      var first = art.querySelector('.grade-row [data-g="good"]'); if (first) first.focus({ preventScroll: true });
    });
    art.querySelector(".grade-row").addEventListener("click", function (e) {
      var b = e.target.closest("[data-g]"); if (!b) return;
      var g = b.getAttribute("data-g");
      doneCount++;
      if (!practice) {
        var c = LC.srs.schedule(current, g, Date.now());
        saveCard(c);
        if (g === "again") queue.push(c); // see it again before the session ends
      } else if (g === "again") { queue.push(current); }
      next();
    });
  }

  function exportDeck() {
    var data = { version: 1, exported: new Date().toISOString(), cards: cards(), progress: LC.progress() };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "llms-animated-progress.json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }
  function importDeck(file) {
    var r = new FileReader();
    r.onload = function () {
      try {
        var data = JSON.parse(r.result);
        if (!data || typeof data.cards !== "object") throw new Error("bad file");
        var all = cards(), n = 0;
        Object.keys(data.cards).forEach(function (k) {
          var c = data.cards[k];
          if (!c || typeof c.front !== "string" || typeof c.due !== "number") return;
          // keep whichever copy was reviewed more recently
          if (!all[k] || (c.last || 0) > (all[k].last || 0)) { all[k] = c; n++; }
        });
        LC.store.set("cards", all);
        var p = LC.progress();
        Object.keys(data.progress || {}).forEach(function (k) { p[k] = Object.assign({}, data.progress[k], p[k] || {}); });
        LC.store.set("progress", p);
        LC.toast("Imported " + n + " cards.");
        queue = dueQueue(); next();
      } catch (e) { LC.toast("That file doesn't look like a course export."); }
    };
    r.readAsText(file);
  }

  function dueQueue() {
    var all = cards(), now = Date.now();
    return shuffle(Object.keys(all).map(function (k) { return all[k]; }).filter(function (c) { return c.due <= now; }));
  }

  document.addEventListener("lc:ready", function () {
    root = document.getElementById("review");
    if (!root) return;
    statsEl = root.querySelector(".review-stats");
    stage = root.querySelector("#review-stage");
    queue = dueQueue();
    next();
    root.querySelector("#export").addEventListener("click", exportDeck);
    var inp = root.querySelector("#import-file");
    root.querySelector("#import").addEventListener("click", function () { inp.click(); });
    inp.addEventListener("change", function () { if (inp.files[0]) importDeck(inp.files[0]); inp.value = ""; });
  });
})();
