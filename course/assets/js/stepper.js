/* Animation player. Each <figure class="anim" data-anim="name"> is driven by an
   animation module registered as LC.anims[name] = {
     title, steps: [caption, ...],
     size(layout) -> {w, h}          // layout is "compact" (phones) or "wide"
     build(svg, ctx) -> gsap timeline // must add labels "s0".."s{n-1}"; s0 at time 0
   }
   Steps follow Mayer's segmenting principle: the learner controls the pace. */
(function () {
  var LC = window.LC;
  LC.anims = LC.anims || {};
  var SVGNS = "http://www.w3.org/2000/svg";
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Tiny SVG helper used by all animation modules. */
  LC.svg = function (tag, attrs, parent) {
    var n = document.createElementNS(SVGNS, tag);
    if (attrs) for (var k in attrs) {
      if (k === "text") n.textContent = attrs[k];
      else n.setAttribute(k, attrs[k]);
    }
    if (parent) parent.appendChild(n);
    return n;
  };

  /* Make a path "draw itself" on a timeline. Returns the tween. */
  LC.drawIn = function (tl, path, vars, pos) {
    var len = path.getTotalLength ? path.getTotalLength() : 1000;
    path.style.strokeDasharray = len + " " + len;
    path.style.strokeDashoffset = len;
    path.style.opacity = 0; // hide round line-caps until the stroke starts drawing
    // never exactly on a step label, or the cap shows one step early
    tl.set(path.style, { opacity: 1 }, pos == null ? "+=0.01" : pos);
    return tl.to(path.style, Object.assign({ strokeDashoffset: 0, duration: 1, ease: "power1.inOut" }, vars || {}), "<");
  };
  /* Fade/scale elements in on a timeline (they start hidden). */
  LC.popIn = function (tl, els, vars, pos) {
    els = [].concat(els);
    els.forEach(function (e) { e.style.opacity = 0; });
    return tl.to(els, Object.assign({ opacity: 1, duration: 0.4, ease: "power1.out" }, vars || {}), pos);
  };
  /* Build an SVG path "d" from a function sampled on [x0, x1]. */
  LC.fnPath = function (f, x0, x1, sx, sy, samples) {
    samples = samples || 60;
    var d = "";
    for (var i = 0; i <= samples; i++) {
      var x = x0 + (x1 - x0) * (i / samples);
      d += (i ? "L" : "M") + sx(x).toFixed(2) + " " + sy(f(x)).toFixed(2);
    }
    return d;
  };

  function Player(fig) {
    var name = fig.getAttribute("data-anim");
    var mod = LC.anims[name];
    if (!mod) return;
    var I = LC.icons;
    var n = mod.steps.length;
    var title = fig.getAttribute("data-title") || mod.title;
    fig.innerHTML =
      '<div class="anim-head"><p class="anim-title"></p><span class="anim-count" aria-hidden="true"></span></div>' +
      '<div class="anim-stage"><span class="swipe-hint" aria-hidden="true">swipe ⇆</span></div>' +
      '<p class="anim-caption" aria-live="polite"></p>' +
      '<div class="anim-controls">' +
        '<button type="button" class="btn icon-btn" data-act="prev" aria-label="Previous step">' + I.prev + "</button>" +
        '<button type="button" class="btn icon-btn btn-primary" data-act="play" aria-label="Play">' + I.play + "</button>" +
        '<button type="button" class="btn icon-btn" data-act="next" aria-label="Next step">' + I.next + "</button>" +
        '<input class="anim-scrub" type="range" min="0" max="1000" value="0" aria-label="Scrub animation">' +
      "</div>" +
      '<div class="anim-dots" role="group" aria-label="Jump to step"></div>';
    fig.querySelector(".anim-title").textContent = title;
    fig.setAttribute("role", "group");
    fig.setAttribute("aria-label", "Animation: " + title);
    var stage = fig.querySelector(".anim-stage");
    var caption = fig.querySelector(".anim-caption");
    var count = fig.querySelector(".anim-count");
    var playBtn = fig.querySelector('[data-act="play"]');
    var scrub = fig.querySelector(".anim-scrub");
    var dots = fig.querySelector(".anim-dots");
    for (var i = 0; i < n; i++) {
      var d = document.createElement("button");
      d.type = "button"; d.setAttribute("aria-label", "Step " + (i + 1) + " of " + n); d.dataset.i = i;
      dots.appendChild(d);
    }

    var tl, svg, layout, step = 0, playing = false, timer = null, moving = null;

    function times() { return mod.steps.map(function (_, i) { return tl.labels["s" + i] || 0; }); }

    function build() {
      var keep = step;
      if (tl) tl.kill();
      if (svg) svg.remove();
      layout = stage.clientWidth < 560 ? "compact" : "wide";
      var sz = mod.size(layout);
      svg = LC.svg("svg", { viewBox: "0 0 " + sz.w + " " + sz.h, role: "img", "aria-label": title + ". Use the step controls below; the caption describes each step." });
      svg.style.maxHeight = layout === "wide" ? "460px" : "none";
      stage.appendChild(svg);
      tl = mod.build(svg, { layout: layout, w: sz.w, h: sz.h, gsap: gsap });
      tl.pause(0, false);
      setStep(keep, true);
    }

    function setUI() {
      caption.innerHTML = mod.steps[step];
      count.textContent = (step + 1) + " / " + n;
      dots.querySelectorAll("button").forEach(function (b, i) { if (i === step) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current"); });
      fig.querySelector('[data-act="prev"]').disabled = step === 0;
      fig.querySelector('[data-act="next"]').disabled = step === n - 1 && !playing;
      if (LC.renderMath) LC.renderMath(caption);
    }

    function setStep(i, instant) {
      i = Math.max(0, Math.min(n - 1, i));
      step = i;
      var t = times()[i];
      if (moving) moving.kill();
      if (instant || reduce) { tl.pause(t, false); scrub.value = Math.round((t / (tl.duration() || 1)) * 1000); }
      else {
        moving = tl.tweenTo(t, { duration: Math.min(2.4, Math.max(0.35, Math.abs(tl.time() - t))), ease: "none",
          onUpdate: function () { scrub.value = Math.round((tl.time() / (tl.duration() || 1)) * 1000); } });
      }
      setUI();
    }

    function stop() {
      playing = false; clearTimeout(timer);
      playBtn.innerHTML = I.play; playBtn.setAttribute("aria-label", "Play");
      setUI();
    }
    function play() {
      if (step === n - 1) setStep(0, true);
      playing = true; playBtn.innerHTML = I.pause; playBtn.setAttribute("aria-label", "Pause");
      (function advance() {
        if (!playing) return;
        if (step >= n - 1) { stop(); playBtn.innerHTML = I.replay; playBtn.setAttribute("aria-label", "Replay"); return; }
        setStep(step + 1);
        var segment = Math.abs(times()[step] - times()[step - 1]);
        timer = setTimeout(advance, (reduce ? 0 : Math.min(2.4, segment) * 1000) + 2600);
      })();
    }

    fig.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b || !fig.contains(b)) return;
      if (b.dataset.act === "prev") { stop(); setStep(step - 1); }
      else if (b.dataset.act === "next") { stop(); setStep(step + 1); }
      else if (b.dataset.act === "play") { playing ? stop() : play(); }
      else if (b.dataset.i != null) { stop(); setStep(+b.dataset.i); }
    });
    scrub.addEventListener("input", function () {
      stop(); if (moving) moving.kill();
      var t = (scrub.value / 1000) * tl.duration();
      tl.pause(t, false); // false = run onUpdate callbacks so jumps land on the right state
      var ts = times(), s = 0;
      for (var i = 0; i < ts.length; i++) if (t >= ts[i] - 0.001) s = i;
      if (s !== step) { step = s; setUI(); }
    });

    // Swipe left/right on the stage (touch + pen).
    var sx = null, sy = null;
    stage.addEventListener("pointerdown", function (e) { if (e.pointerType !== "mouse") { sx = e.clientX; sy = e.clientY; } });
    stage.addEventListener("pointerup", function (e) {
      if (sx == null) return;
      var dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) { stop(); setStep(step + (dx < 0 ? 1 : -1)); }
    });
    stage.addEventListener("pointercancel", function () { sx = null; });

    var lastW = 0;
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        var w = stage.clientWidth; if (Math.abs(w - lastW) < 2) return; lastW = w;
        var want = w < 560 ? "compact" : "wide";
        if (want !== layout) build();
      }).observe(stage);
    }
    document.addEventListener("lc:theme", function () { /* colors are CSS vars; nothing to rebuild */ });
    build();
  }

  document.addEventListener("lc:ready", function () {
    document.querySelectorAll("figure.anim[data-anim]").forEach(function (f) { Player(f); });
  });
})();
