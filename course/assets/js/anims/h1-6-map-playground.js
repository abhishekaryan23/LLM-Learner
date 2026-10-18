/* H1.6 playground: a clickable map of AI model families. Every node is a real <button>
   (≥ 44px tall at every layout), laid over an SVG of the family links. Tapping a node
   shows a one-line description, its year and the course lesson that teaches it.
   Filter chips dim the families that don't match a modality / paradigm / kind. */
(function () {
  var LC = window.LC;
  // tags: gen = generative, disc = discriminative; text image audio video; sup, ssl (self-supervised or unsupervised), rl
  var NODES = [
    { id: "perc", name: "Perceptron", year: "1958", lesson: "h1-1", tags: ["disc", "sup"], desc: "One artificial neuron that learns a straight-line boundary between two classes." },
    { id: "mlp", name: "MLP", year: "1986", lesson: "p3-1", tags: ["disc", "sup"], desc: "Layers of neurons trained with backpropagation: the building block inside almost every network." },
    { id: "cnn", name: "CNN", year: "1989", lesson: "p6-1", tags: ["disc", "sup", "image", "audio"], desc: "Small shared filters slide over a grid, so it finds the same pattern anywhere in an image." },
    { id: "rnn", name: "RNN / LSTM", year: "1990 · 1997", lesson: "p6-3", tags: ["disc", "gen", "sup", "text", "audio"], desc: "Reads a sequence one step at a time, carrying a memory forward. LSTM gates help it remember." },
    { id: "rl", name: "Deep RL agent", year: "2013", lesson: "rl-3", tags: ["rl"], desc: "Learns by trial and error from rewards, e.g. DQN playing Atari (2013) and AlphaGo (2016)." },
    { id: "resnet", name: "ResNet", year: "2015", lesson: "p6-2", tags: ["disc", "sup", "image"], desc: "Skip connections (x + F(x)) keep 100+ layer networks trainable. Every transformer uses them too." },
    { id: "gan", name: "GAN", year: "2014", lesson: "g1-2", tags: ["gen", "ssl", "image"], desc: "A generator and a discriminator compete; the generator learns to produce realistic images." },
    { id: "ae", name: "VAE", year: "2013", lesson: "g1-1", tags: ["gen", "ssl", "image", "audio"], desc: "Compresses data into a small latent code and generates new samples by decoding random codes." },
    { id: "diff", name: "Diffusion", year: "2015 · 2020", lesson: "g1-3", tags: ["gen", "ssl", "image", "audio", "video"], desc: "Learns to remove noise a little at a time; run backwards from pure noise, it creates images." },
    { id: "vit", name: "Vision Transformer", year: "2020", lesson: "v1-1", tags: ["disc", "sup", "ssl", "image", "video"], desc: "Cuts an image into patches and treats them like words, so a transformer can read pictures." },
    { id: "moe", name: "Mixture of experts", year: "1991 · 2017", lesson: "m5-3", tags: ["gen", "ssl", "text"], desc: "A router sends each token to a few expert sub-networks: huge capacity, modest compute per token." },
    { id: "tf", name: "Transformer", year: "2017", lesson: "m1-1", tags: ["disc", "gen", "ssl", "text", "image", "audio", "video"], desc: "Self-attention lets every token look at every other token, all in parallel. The backbone of modern AI." },
    { id: "llm", name: "GPT-style LLM", year: "2018", lesson: "m1-4", tags: ["gen", "ssl", "text"], desc: "A decoder-only transformer pretrained to predict the next token, then post-trained to be helpful." },
    { id: "flow", name: "Flow matching", year: "2022", lesson: "g1-5", tags: ["gen", "ssl", "image", "audio", "video"], desc: "Learns a smooth path from noise to data, so samples need fewer, straighter steps than diffusion." },
    { id: "mm", name: "Multimodal model", year: "2021 →", lesson: "mm-1", tags: ["gen", "ssl", "text", "image", "audio", "video"], desc: "One model across text, images, audio and video, from CLIP (2021) to GPT-4o and Gemini (2023–24)." },
    { id: "ssm", name: "State-space model", year: "2021 · 2023", lesson: "ar-3", tags: ["gen", "ssl", "text", "audio"], desc: "Recurrent-style layers (S4, Mamba) whose cost grows only linearly with sequence length." },
    { id: "reason", name: "Reasoning model", year: "2024", lesson: "rs-3", tags: ["gen", "rl", "text"], desc: "An LLM trained with reinforcement learning to think step by step before it answers." }
  ];
  var EDGES = [["perc", "mlp"], ["mlp", "cnn"], ["mlp", "rnn"], ["mlp", "rl"], ["mlp", "gan"], ["mlp", "ae"], ["cnn", "resnet"],
    ["resnet", "diff"], ["diff", "flow"], ["rnn", "tf"], ["rnn", "ssm"], ["tf", "moe"], ["tf", "vit"], ["tf", "llm"],
    ["vit", "mm"], ["llm", "mm"], ["llm", "reason"], ["rl", "reason"]];
  // grid positions: wide = [column (era), row]; compact = [column, row] with time running down
  var POS = {
    wide: { perc: [0, 0], mlp: [0, 2], cnn: [1, 0], rnn: [1, 3], rl: [2, 4], resnet: [2, 0], gan: [2, 1], ae: [2, 2],
      diff: [3, 0], vit: [3, 1], moe: [3, 2], tf: [3, 3], llm: [3, 4], flow: [4, 0], mm: [4, 1], ssm: [4, 2], reason: [4, 4] },
    compact: { perc: [1, 0], mlp: [1, 1], cnn: [0, 2], rnn: [1, 2], gan: [2, 2], resnet: [0, 3], ae: [2, 3], rl: [1, 3],
      tf: [1, 4], diff: [0, 4], moe: [2, 4], vit: [0, 5], llm: [1, 5], ssm: [2, 5], flow: [0, 6], reason: [1, 6], mm: [2, 6] } // rl sits in the rnn→tf column; links route around it
  };
  var ERAS = ["1958–1986", "1989–1997", "2013–2016", "2017–2020", "2021–2026"];
  var FILTERS = [["all", "All"], ["gen", "Generative"], ["disc", "Discriminative"], ["text", "Text"], ["image", "Images"], ["audio", "Audio"], ["video", "Video"],
    ["sup", "Supervised"], ["ssl", "Self- or unsupervised"], ["rl", "Reinforcement learning"]];
  var TAGNAME = { gen: "generative", disc: "discriminative", text: "text", image: "images", audio: "audio", video: "video", sup: "supervised", ssl: "self-supervised or unsupervised", rl: "reinforcement learning" };

  function lessonInfo(id) {
    var all = LC.allLessons ? LC.allLessons() : [], code = id.toUpperCase().replace("-", "."), title = "";
    all.forEach(function (l) {
      if (l.id === id) {
        title = l.title;
        var m = LC.course.modules[l.module];
        code = m.code + "." + (m.lessons.indexOf(m.lessons.filter(function (x) { return x.id === id; })[0]) + 1);
      }
    });
    return { code: code, title: title };
  }

  function init(root) {
    var stageBox = root.querySelector(".pg-stage");
    var filterBox = root.querySelector(".h1-6-filters");
    var detail = root.querySelector(".h1-6-detail");
    var sel = "tf", filter = "all", layout = null, map, svg, btns = {}, edgeEls = [];

    FILTERS.forEach(function (f) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.dataset.filter = f[0]; b.textContent = f[1];
      b.style.minHeight = "44px";
      filterBox.appendChild(b);
    });

    function geom() {
      var compact = layout === "compact";
      if (compact) return { W: 360, H: 7 * 74 + 4, nw: 108, nh: 56, colStep: 120, rowStep: 74, cx: function (c) { return 60 + c * 120; }, cy: function (r) { return 32 + r * 74; } };
      return { W: 640, H: 30 + 5 * 74, nw: 114, nh: 54, colStep: 128, rowStep: 74, cx: function (c) { return 64 + c * 128; }, cy: function (r) { return 60 + r * 74; } };
    }

    function build() {
      layout = stageBox.clientWidth < 560 ? "compact" : "wide";
      var G = geom(), compact = layout === "compact", P = POS[layout];
      if (map) map.remove();
      map = document.createElement("div");
      map.style.position = "relative"; map.style.width = "100%"; map.style.aspectRatio = G.W + " / " + G.H;
      map.style.maxWidth = compact ? "none" : "760px"; map.style.margin = "0 auto";
      stageBox.appendChild(map);
      var S = LC.svg;
      svg = S("svg", { viewBox: "0 0 " + G.W + " " + G.H, "aria-hidden": "true" });
      svg.style.position = "absolute"; svg.style.inset = "0"; svg.style.width = "100%"; svg.style.height = "100%";
      map.appendChild(svg);
      if (!compact) ERAS.forEach(function (e, c) { S("text", { x: G.cx(c), y: 14, class: "t t-sm t-muted t-mid", text: e }, svg); });
      else S("text", { x: 6, y: 14, class: "t t-sm t-muted", text: "time ↓" }, svg);
      edgeEls = EDGES.map(function (e) {
        var a = P[e[0]], b = P[e[1]];
        var ax = G.cx(a[0]), ay = G.cy(a[1]), bx = G.cx(b[0]), by = G.cy(b[1]), hw = G.nw / 2, hh = G.nh / 2;
        var colGap = (G.colStep - G.nw) / 2, rowGap = (G.rowStep - G.nh) / 2, pts;
        // orthogonal routing through the gaps between buttons, so no link runs behind a button
        if (!compact) {
          if (a[0] === b[0]) pts = [[ax - hw, ay], [ax - hw - colGap, ay], [ax - hw - colGap, by], [bx - hw, by]];
          else if (a[1] === b[1]) {
            // same row: straight across, unless a button sits in between; then run under the row
            var blocked = Object.keys(P).some(function (k) { return P[k][1] === a[1] && P[k][0] > Math.min(a[0], b[0]) && P[k][0] < Math.max(a[0], b[0]); });
            pts = blocked ? [[ax, ay + hh], [ax, ay + hh + rowGap], [bx, by + hh + rowGap], [bx, by + hh]] : [[ax + hw, ay], [bx - hw, by]];
          }
          else {
            var gx1 = ax + hw + colGap, gx2 = bx - hw - colGap, gy = by + (by > ay ? -1 : 1) * (hh + rowGap);
            pts = b[0] - a[0] === 1 ? [[ax + hw, ay], [gx1, ay], [gx1, by], [bx - hw, by]]
              : [[ax + hw, ay], [gx1, ay], [gx1, gy], [gx2, gy], [gx2, by], [bx - hw, by]];
          }
        } else {
          if (a[0] === b[0] && b[1] - a[1] === 1) pts = [[ax, ay + hh], [bx, by - hh]];
          else {
            var ry1 = ay + hh + rowGap, ry2 = by - hh - rowGap;
            var lane = b[0] > a[0] ? bx - hw - colGap : (b[0] < a[0] ? bx + hw + colGap : (b[0] === 2 ? bx - hw - colGap : bx + hw + colGap));
            pts = [[ax, ay + hh], [ax, ry1], [lane, ry1], [lane, ry2], [bx, ry2], [bx, by - hh]];
          }
        }
        var d = pts.map(function (q, i) { return (i ? "L" : "M") + q[0].toFixed(1) + " " + q[1].toFixed(1); }).join("");
        return { from: e[0], to: e[1], el: S("path", { d: d, class: "s-faint", "stroke-width": 2, "stroke-linejoin": "round", fill: "none" }, svg) };
      });
      btns = {};
      NODES.forEach(function (n) {
        var p = P[n.id], b = document.createElement("button");
        b.type = "button"; b.className = "chip"; b.dataset.node = n.id;
        b.innerHTML = "<span>" + n.name + "</span>";
        var st = b.style;
        st.position = "absolute"; st.boxSizing = "border-box";
        st.left = ((G.cx(p[0]) - G.nw / 2) / G.W * 100) + "%"; st.top = ((G.cy(p[1]) - G.nh / 2) / G.H * 100) + "%";
        st.width = (G.nw / G.W * 100) + "%"; st.height = (G.nh / G.H * 100) + "%";
        st.minHeight = "44px"; st.padding = "2px 6px"; st.borderRadius = "12px"; st.lineHeight = "1.15";
        st.fontSize = compact ? ".8rem" : ".82rem"; st.whiteSpace = "normal"; st.textAlign = "center";
        st.display = "flex"; st.alignItems = "center"; st.justifyContent = "center";
        st.borderColor = n.tags.indexOf("gen") >= 0 && n.tags.indexOf("disc") < 0 ? "var(--a-orange)" : "var(--a-blue)";
        b.setAttribute("aria-label", n.name + ", " + n.year);
        map.appendChild(b);
        btns[n.id] = b;
      });
      draw();
    }

    function draw() {
      var n = NODES.filter(function (x) { return x.id === sel; })[0];
      NODES.forEach(function (x) {
        var b = btns[x.id], on = filter === "all" || x.tags.indexOf(filter) >= 0;
        b.setAttribute("aria-pressed", String(x.id === sel));
        b.style.opacity = on ? "1" : "0.35";
      });
      edgeEls.forEach(function (e) {
        var hot = e.from === sel || e.to === sel;
        e.el.setAttribute("class", hot ? "s-orange" : "s-faint");
        e.el.setAttribute("stroke-width", hot ? 3 : 2);
        e.el.style.display = layout === "compact" && !hot ? "none" : "";
      });
      var li = lessonInfo(n.lesson);
      var parents = EDGES.filter(function (e) { return e[1] === sel; }).map(function (e) { return NODES.filter(function (x) { return x.id === e[0]; })[0].name; });
      var kids = EDGES.filter(function (e) { return e[0] === sel; }).map(function (e) { return NODES.filter(function (x) { return x.id === e[1]; })[0].name; });
      detail.innerHTML = "";
      var h = document.createElement("p"); h.style.margin = "0 0 4px"; h.style.fontWeight = "600";
      h.textContent = n.name + " · " + n.year;
      var d = document.createElement("p"); d.style.margin = "0 0 4px"; d.textContent = n.desc;
      var t = document.createElement("p"); t.className = "math-note"; t.style.margin = "0 0 4px";
      t.textContent = n.tags.map(function (g) { return TAGNAME[g]; }).join(" · ") +
        (parents.length ? " · grew from: " + parents.join(", ") : "") + (kids.length ? " · led to: " + kids.join(", ") : "");
      var l = document.createElement("p"); l.style.margin = "0";
      l.appendChild(document.createTextNode("Learn it in "));
      var a = document.createElement("a"); a.href = n.lesson + ".html"; a.textContent = li.code + " " + li.title;
      l.appendChild(a);
      detail.appendChild(h); detail.appendChild(d); detail.appendChild(t); detail.appendChild(l);
      filterBox.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.filter === filter)); });
    }

    root.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b || !root.contains(b)) return;
      if (b.dataset.node) { sel = b.dataset.node; draw(); }
      else if (b.dataset.filter) { filter = b.dataset.filter; draw(); }
    });
    build();
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        var want = stageBox.clientWidth < 560 ? "compact" : "wide";
        if (want !== layout) build();
      }).observe(stageBox);
    }
  }

  document.addEventListener("lc:ready", function () {
    var root = document.getElementById("h1-6-playground");
    if (root) init(root);
  });
})();
