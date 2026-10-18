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
    document.getElementById("map-note").textContent = ready.length + " of " + all.length + " lessons are live; more are added module by module.";

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
  });
})();
