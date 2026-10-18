/* P3.3 playground: learn BPE merges on a short paragraph, then slide the number of merges
   and watch the same text use fewer, longer tokens. Uses LC.bpe from p3-3-bpe.js.
   Simplification: text is split into words first (no merges across spaces), as GPT-style
   tokenizers do with their pre-tokenization step; spaces are not shown as tokens here. */
(function () {
  var LC = window.LC;
  var TEXT = "the tokenizer reads the text and splits it into tokens. tokens are the pieces a model reads. " +
    "common words become single tokens, while rare words are split into smaller pieces. the model never reads letters, only tokens. " +
    "a tokenizer that learns more merges makes longer tokens, so the same text needs fewer tokens. " +
    "fewer tokens means faster reading, but a bigger vocabulary to learn.";
  var MAX = 120;
  var COLORS = ["var(--accent-soft)", "var(--warm-soft)", "var(--good-soft)"];

  function words(s) { return s.toLowerCase().match(/[a-z]+|[^a-z\s]/g) || []; }

  function init(box) {
    if (!LC.bpe) return;
    var seq = words(TEXT), uniq = [], counts = [], idx = {};
    seq.forEach(function (w) { if (idx[w] == null) { idx[w] = uniq.length; uniq.push(w); counts.push(0); } counts[idx[w]]++; });
    var R = LC.bpe.train(uniq, counts, MAX);
    var nMerges = R.merges.length;
    var base = {}; seq.join("").split("").forEach(function (c) { base[c] = 1; });
    var nBase = Object.keys(base).length;

    box.insertAdjacentHTML("beforeend",
      '<div class="pg-controls">' +
        '<label><span>Merges learned: <output></output></span><input type="range" min="0" max="' + nMerges + '" step="1" value="10" aria-describedby="bpe-readout"></label>' +
        '<div class="pg-buttons"><button type="button" class="btn" data-k="0">0</button><button type="button" class="btn" data-k="10">10</button><button type="button" class="btn" data-k="40">40</button><button type="button" class="btn" data-k="' + nMerges + '">all ' + nMerges + '</button></div>' +
      '</div>' +
      '<p class="pg-readout" id="bpe-readout" aria-live="polite"></p>' +
      '<div class="pg-stage bpe-text" style="margin-top:6px;font:500 .95rem/2 var(--font-mono);word-break:break-word"></div>' +
      '<label style="display:grid;gap:4px;margin-top:12px;font-size:.93rem"><span>Try your own words (tokenized with the same merges):</span>' +
        '<input type="text" value="slower tokenizers" autocomplete="off" spellcheck="false"></label>' +
      '<div class="bpe-own" style="margin-top:8px;font:500 .95rem/2 var(--font-mono);word-break:break-word" aria-live="polite"></div>' +
      '<p class="pg-hint" style="margin:6px 0 0;font-size:.88rem;color:var(--ink-2)"></p>');
    var stage = box.querySelector(".bpe-text"), slider = box.querySelector("input[type=range]"), out = box.querySelector("output");
    var readout = box.querySelector(".pg-readout"), own = box.querySelector("input[type=text]"), ownBox = box.querySelector(".bpe-own"), hint = box.querySelector(".pg-hint");

    function chips(wordList, k, container) {
      var merges = R.merges.slice(0, k), n = 0, unknown = false;
      container.innerHTML = "";
      var ci = 0;
      wordList.forEach(function (w) {
        var span = document.createElement("span");
        span.style.cssText = "display:inline-block;margin:0 .45em 0 0";
        LC.bpe.encode(w, merges).tokens.forEach(function (t) {
          var c = document.createElement("span");
          var bad = Array.from(t).some(function (ch) { return !base[ch]; });
          if (bad) unknown = true;
          c.textContent = t;
          c.style.cssText = "display:inline-block;padding:0 3px;border-radius:5px;margin:0 1px 0 0;color:var(--ink);background:" +
            (bad ? "var(--bad-soft)" : COLORS[ci++ % COLORS.length]);
          span.appendChild(c); n++;
        });
        container.appendChild(span);
      });
      return { n: n, unknown: unknown };
    }
    function draw() {
      var k = +slider.value;
      out.textContent = k;
      var r = chips(seq, k, stage);
      var chars = seq.join("").length;
      readout.textContent = "Vocabulary " + (nBase + k) + " (" + nBase + " base symbols + " + k + " merges) · this text: " + r.n + " tokens, " + (chars / r.n).toFixed(2) + " characters per token";
      drawOwn();
    }
    function drawOwn() {
      var r = chips(words(own.value).slice(0, 40), +slider.value, ownBox);
      hint.textContent = r.unknown
        ? "Red pieces are characters this toy never saw in training. A byte-level tokenizer falls back to raw bytes instead, so it never gets stuck."
        : (+slider.value ? "Words the training text never contained still split into pieces it did learn." : "With no merges, every character is its own token.");
    }
    slider.addEventListener("input", draw);
    own.addEventListener("input", drawOwn);
    box.addEventListener("click", function (e) { var b = e.target.closest("button[data-k]"); if (b) { slider.value = b.dataset.k; draw(); } });
    draw();
  }

  document.addEventListener("lc:ready", function () {
    var box = document.getElementById("bpe-playground");
    if (box) init(box);
  });
})();
