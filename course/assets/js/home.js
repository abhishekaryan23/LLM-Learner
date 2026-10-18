/* Home page: course map with per-module progress, resume button, stats. */
(function () {
  var LC = window.LC;
  document.addEventListener("lc:ready", function () {
    var all = LC.allLessons();
    var ready = all.filter(function (l) { return l.ready; });
    var done = all.filter(function (l) { return LC.isDone(l.id); });
    var mods = Object.keys(LC.course.modules).length;

    document.getElementById("stats").innerHTML =
      "<span><b>" + all.length + "</b> lessons</span><span><b>" + mods + "</b> modules</span><span><b>" + ready.length + "</b> live now</span>" +
      (done.length ? "<span><b>" + done.length + "</b> completed by you</span>" : "");
    document.getElementById("map-note").textContent = ready.length === all.length
      ? "All " + all.length + " lessons are live. Start anywhere: prerequisites are linked from each lesson."
      : ready.length + " of " + all.length + " lessons are live; more are added module by module.";

    // Resume where the learner left off: first ready lesson not yet done.
    var nextUp = ready.find(function (l) { return !LC.isDone(l.id); });
    var start = document.getElementById("start-btn");
    if (done.length && nextUp) { start.textContent = "Continue: " + nextUp.title; start.href = LC.lessonHref(nextUp.id); }
    else if (done.length && !nextUp) { start.textContent = "Review what you've learned"; start.href = "review.html"; }
    var due = LC.dueCount(), rc = document.getElementById("review-cta");
    if (due) { rc.hidden = false; rc.textContent = due + " card" + (due === 1 ? "" : "s") + " due for review"; }

    var html = "";
    LC.course.tracks.forEach(function (t) {
      html += '<section class="track" aria-labelledby="tr-' + t.id + '"><div class="track-head"><h3 id="tr-' + t.id + '">' + LC.escape(t.title) + "</h3>" +
        (t.note ? "<p>" + LC.escape(t.note) + "</p>" : "") + '</div><div class="module-grid">';
      t.modules.forEach(function (mid) {
        var m = LC.course.modules[mid];
        var n = m.lessons.length, d = m.lessons.filter(function (l) { return LC.isDone(l.id); }).length;
        var live = m.lessons.filter(function (l) { return l.ready; }).length;
        html += '<article class="module"><div class="module-top"><span class="module-code" aria-hidden="true">' + LC.escape(m.code) + "</span><div><h4>" +
          LC.escape(m.title) + '</h4><span class="mprog">' + d + " / " + n + " done" + (live && live < n ? " · " + live + " live" : live ? "" : " · coming soon") + "</span></div></div>" +
          '<div class="mbar" aria-hidden="true"><span style="width:' + Math.round((d / n) * 100) + '%"></span></div>' +
          LC.lessonListHTML(mid, { tags: true }) + "</article>";
      });
      html += "</div></section>";
    });
    document.getElementById("course-map").innerHTML = html;
    buildGoals();
    buildDaily();
  });

  /* ---------- Goals → learning path ---------- */
  function currentGoal() {
    var gid = LC.store.get("goal", null);
    return LC.course.goals.find(function (g) { return g.id === gid; }) || null;
  }
  function pathFor(g) { return LC.pathTo(LC.goalTargets(g)); }

  function buildGoals() {
    var chips = document.getElementById("goal-chips"), box = document.getElementById("goal-path");
    if (!chips) return;
    LC.course.goals.forEach(function (g) {
      var b = LC.el('<button type="button" class="chip" aria-pressed="false"></button>');
      b.textContent = g.title; b.dataset.goal = g.id;
      chips.appendChild(b);
    });
    function render() {
      var g = currentGoal();
      chips.querySelectorAll(".chip").forEach(function (c) { c.setAttribute("aria-pressed", String(!!g && c.dataset.goal === g.id)); });
      if (!g) { box.innerHTML = ""; return; }
      var path = pathFor(g), done = path.filter(function (l) { return LC.isDone(l.id); }).length;
      var live = path.filter(function (l) { return l.ready; }).length;
      var mins = path.reduce(function (s, l) { return s + (LC.isDone(l.id) ? 0 : l.mins); }, 0);
      var next = path.find(function (l) { return l.ready && !LC.isDone(l.id); });
      var html = '<section class="path" aria-labelledby="path-h"><div class="path-head"><h3 id="path-h"></h3>' +
        '<span class="path-stats">' + path.length + " lessons · " + done + " done · about " + Math.round(mins / 60 * 2) / 2 + " h left" +
        (live < path.length ? " · " + (path.length - live) + " coming soon" : "") + "</span></div>" +
        (next ? '<div class="row"><a class="btn btn-primary" href="' + LC.lessonHref(next.id) + '?focus=1">' + (done ? "Continue: " : "Start: ") + LC.escape(next.title) + "</a></div>" : "") +
        '<ol class="path-list"></ol></section>';
      box.innerHTML = html;
      box.querySelector("#path-h").textContent = g.title;
      var ol = box.querySelector("ol"), SHOW = 8;
      path.forEach(function (l, i) {
        var li = document.createElement("li");
        li.className = LC.isDone(l.id) ? "is-done" : l.ready ? "" : "is-soon";
        li.innerHTML = (l.ready ? '<a href="' + LC.lessonHref(l.id) + '"></a>' : '<span class="soon"></span>') + '<span class="mcode"></span>';
        li.firstChild.textContent = l.title + (l.ready ? "" : " (soon)");
        li.lastChild.textContent = l.moduleCode;
        if (i >= SHOW) li.hidden = true;
        ol.appendChild(li);
      });
      if (path.length > SHOW) {
        var more = LC.el('<button type="button" class="btn btn-ghost path-more">Show all ' + path.length + " lessons</button>");
        more.addEventListener("click", function () { ol.querySelectorAll("li[hidden]").forEach(function (li) { li.hidden = false; }); more.remove(); });
        box.querySelector(".path").appendChild(more);
      }
    }
    chips.addEventListener("click", function (e) {
      var b = e.target.closest("[data-goal]"); if (!b) return;
      var cur = currentGoal();
      LC.store.set("goal", cur && cur.id === b.dataset.goal ? null : b.dataset.goal);
      render(); buildDaily();
    });
    render();
  }

  /* ---------- Today's byte: the next unread byte on your path ---------- */
  function buildDaily() {
    var box = document.getElementById("daily"); if (!box) return;
    var g = currentGoal();
    var list = g ? pathFor(g) : LC.allLessons();
    var l = list.find(function (x) { return x.ready && !LC.isDone(x.id); });
    if (!l) { box.hidden = true; return; }
    var bytes = (LC.progress()[l.id] || {}).bytes || {}, k = 0;
    while (bytes[k]) k++;
    box.hidden = false;
    box.innerHTML = '<span class="lbl">Today\'s byte</span><span class="ttl"></span>' +
      '<a class="btn btn-primary" href="' + LC.lessonHref(l.id) + "?focus=1#byte-" + k + '">Start · ~3 min</a>';
    box.querySelector(".ttl").textContent = l.title + (k ? " · byte " + k : "");
  }
})();
