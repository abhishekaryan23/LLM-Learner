/* What's new: renders field-notes/notes.json, newest first, filterable by track. */
(function () {
  var LC = window.LC;
  var KIND = { paper: "Paper", release: "Release", tool: "Tool", benchmark: "Benchmark", policy: "Policy" };

  function trackOf(lessonId) {
    var hit = null;
    LC.course.tracks.forEach(function (t) { t.modules.forEach(function (mid) {
      LC.course.modules[mid].lessons.forEach(function (l) { if (l.id === lessonId) hit = t; });
    }); });
    return hit;
  }

  function render(notes, filter) {
    var box = document.getElementById("notes");
    var list = notes.filter(function (n) {
      return !filter || (n.lessons || []).some(function (id) { var t = trackOf(id); return t && t.id === filter; });
    });
    if (!list.length) {
      box.innerHTML = '<div class="empty"><p><strong>No field notes yet.</strong></p><p>The first ones arrive with the next weekly research run.</p></div>';
      return;
    }
    var lessons = {}; LC.allLessons().forEach(function (l) { lessons[l.id] = l; });
    box.innerHTML = "";
    var month = "";
    list.forEach(function (n) {
      var m = (n.date || "").slice(0, 7);
      if (m !== month) { month = m; var h = document.createElement("h2"); h.style.fontSize = "1.05rem"; h.textContent = new Date(m + "-01T00:00:00").toLocaleDateString(undefined, { year: "numeric", month: "long" }); box.appendChild(h); }
      var a = document.createElement("article"); a.className = "note"; a.id = n.id;
      a.innerHTML = '<div class="note-top"><span class="note-kind"></span><span class="note-date"></span></div><h3></h3><p class="sum"></p>' +
        '<p><strong>Why it matters:</strong> <span class="note-why"></span></p>' + (n.eli5 ? '<p class="eli5-line"><strong>ELI5:</strong> <span></span></p>' : "") +
        '<div class="lessons"></div><p class="srcs"></p>';
      a.querySelector(".note-kind").textContent = KIND[n.kind] || "Update";
      a.querySelector(".note-date").textContent = n.date;
      a.querySelector("h3").textContent = n.title;
      a.querySelector(".sum").textContent = n.summary;
      a.querySelector(".note-why").textContent = n.why;
      if (n.eli5) a.querySelector(".eli5-line span").textContent = n.eli5;
      var ls = a.querySelector(".lessons");
      (n.lessons || []).forEach(function (id) {
        if (!lessons[id]) return;
        var link = document.createElement(lessons[id].ready ? "a" : "span");
        if (lessons[id].ready) link.href = LC.lessonHref(id);
        link.textContent = lessons[id].moduleCode + " · " + lessons[id].title + (lessons[id].ready ? "" : " (coming soon)"); ls.appendChild(link);
      });
      var src = a.querySelector(".srcs"); src.textContent = "Sources: ";
      (n.sources || []).forEach(function (s, i) {
        if (i) src.appendChild(document.createTextNode(" · "));
        var l = document.createElement("a"); l.href = s.url; l.textContent = s.title; l.rel = "noopener"; l.target = "_blank"; src.appendChild(l);
      });
      box.appendChild(a);
    });
    if (location.hash) { var t = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (t) t.scrollIntoView(); }
  }

  document.addEventListener("lc:ready", function () {
    fetch("field-notes/notes.json", { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }).then(function (notes) {
      notes = (notes || []).slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
      var f = document.getElementById("note-filter"), active = null;
      [{ id: null, title: "All" }].concat(LC.course.tracks.filter(function (t) { return t.id !== "start"; })).forEach(function (t) {
        var b = LC.el('<button type="button" class="chip" aria-pressed="false"></button>');
        b.textContent = t.title; b.dataset.t = t.id || "";
        if (!t.id) b.setAttribute("aria-pressed", "true");
        f.appendChild(b);
      });
      f.addEventListener("click", function (e) {
        var b = e.target.closest(".chip"); if (!b) return;
        active = b.dataset.t || null;
        f.querySelectorAll(".chip").forEach(function (c) { c.setAttribute("aria-pressed", String(c === b)); });
        render(notes, active);
      });
      render(notes, null);
    });
  });
})();
