/* H1.6: the family tree as a "subway map". Each lane is a family of architectures,
   placed on the same year axis as the timeline at the top. Dates are first papers
   or landmark models: perceptron 1958, backprop MLP 1986, LeNet 1989 / AlexNet 2012 /
   ResNet 2015, Elman RNN 1990 / LSTM 1997 / seq2seq 2014, VAE 2013 / GAN 2014,
   Transformer 2017 / GPT & BERT 2018 / ViT 2020, diffusion 2015 / DDPM 2020 / flow matching 2022,
   MoE 1991 / sparse MoE 2017 / Mixtral 2023, S4 2021 / Mamba 2023. */
(function () {
  var LC = window.LC;
  var LANES = [
    { name: "Perceptron → MLP", wide: "Perceptron 1958 → MLP + backprop 1986", years: [1958, 1986], cls: "f-ink", step: 0 },
    { name: "CNN (images)", wide: "CNN: LeNet 1989 → AlexNet 2012 → ResNet 2015", years: [1989, 2012, 2015], cls: "f-blue", step: 1 },
    { name: "RNN / LSTM (sequences)", wide: "RNN 1990 → LSTM 1997 → seq2seq 2014", years: [1990, 1997, 2014], cls: "f-blue", step: 2 },
    { name: "VAE / GAN (generators)", wide: "VAE 2013, GAN 2014: networks that generate", years: [2013, 2014], cls: "f-orange", step: 3 },
    { name: "Transformer", wide: "Transformer 2017 → GPT, BERT 2018 → ViT 2020", years: [2017, 2018, 2020], cls: "f-blue", step: 4 },
    { name: "Diffusion / flow", wide: "Diffusion 2015 → DDPM 2020 → flow matching 2022", years: [2015, 2020, 2022], cls: "f-orange", step: 5 },
    { name: "Mixture of experts", wide: "MoE 1991 → sparse MoE 2017 → Mixtral 2023", years: [1991, 2017, 2023], cls: "f-blue", step: 6 },
    { name: "State-space models", wide: "State-space models: S4 2021 → Mamba 2023", years: [2021, 2023], cls: "f-blue", step: 6 }
  ];
  LC.anims["h1-6-tree"] = {
    title: "The family tree, 1958–2026",
    steps: [
      "The root: the <strong>artificial neuron</strong> (perceptron, 1958) and the <strong>multi-layer perceptron</strong> trained by backprop (1986). Every family below is built from these layers.",
      "<strong>CNNs</strong> (1989) specialise in grids such as images: small shared filters. They won ImageNet in 2012, and ResNet's skip connections (2015) let them go 150+ layers deep.",
      "<strong>RNNs and LSTMs</strong> (1990s) specialise in sequences: text, speech, time series. They read one step at a time, carrying a memory.",
      "<strong>Generative</strong> families learn to <em>create</em> data, not just label it: <strong>VAEs</strong> (2013) and <strong>GANs</strong> (2014). Orange lanes are generative.",
      "<strong>Transformers</strong> (2017) replace recurrence with attention. They become the backbone for text (GPT, BERT, 2018), then images (ViT, 2020), audio and more.",
      "<strong>Diffusion</strong> (2015; practical with DDPM, 2020) and <strong>flow matching</strong> (2022) turn noise into images, audio and video. Many now use a transformer inside.",
      "Two newer branches: <strong>mixture of experts</strong> (an old idea from 1991, scaled up from 2017) for capacity without the compute, and <strong>state-space models</strong> (S4, Mamba) for long sequences in linear time.",
      "Since 2023 the lanes <strong>merge</strong>: multimodal models, MoE transformers, transformer–SSM hybrids and diffusion transformers mix families. Most of them still learn by gradient descent and backprop."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 330 } : { w: 640, h: 340 }; },
    build: function (svg, ctx) {
      var S = LC.svg, W = ctx.w, compact = ctx.layout === "compact";
      var steps = [
        { year: "1958", text: "Neurons and multi-layer perceptrons", short: "Neurons and MLPs" },
        { year: "1989", text: "CNNs: grids and images", short: "CNNs" },
        { year: "1997", text: "RNNs and LSTMs: sequences", short: "RNNs and LSTMs" },
        { year: "2014", text: "VAEs and GANs: networks that generate", short: "VAEs and GANs" },
        { year: "2017", text: "Transformers: attention everywhere", short: "Transformers" },
        { year: "2020", text: "Diffusion and flow matching", short: "Diffusion and flow" },
        { year: "2021", text: "Mixture of experts and state-space models", short: "MoE and SSMs" },
        { year: "2023+", text: "Hybrids and multimodal models", short: "Hybrids, multimodal" }
      ];
      steps.forEach(function (st, k) {
        st.dots = [];
        LANES.forEach(function (l) { if (l.step === k) st.dots = st.dots.concat(l.years); });
      });
      steps[7].dots = [2024];
      var T = LC.h1.timeline(svg, ctx, {
        from: 1955, to: 2026, map: [[1955, 0], [1985, 0.2], [2010, 0.45], [2026, 1]],
        ticks: [1960, 1980, 2000, 2010, 2015, 2020, 2025], ticksCompact: [1960, 1990, 2010, 2020], steps: steps
      });
      var x = T.x, top = T.top, rh = 28, tl = gsap.timeline();
      var laneEls = LANES.map(function (l, i) {
        var g = S("g", {}, svg), ly = top + i * rh + 20;
        var lbl = S("text", { x: compact ? 14 : 20, y: ly - 10, class: "t t-sm" + (l.cls === "f-orange" ? " t-orange" : ""), "font-weight": 500, text: compact ? l.name : l.wide }, g);
        var line = S("path", { d: "M" + x(l.years[0]) + " " + ly + "H" + x(2026), class: l.cls === "f-orange" ? "s-orange" : (l.cls === "f-ink" ? "s-ink" : "s-blue"), "stroke-width": 3 }, g);
        var nodes = l.years.map(function (yr) { return S("circle", { cx: x(yr), cy: ly, r: compact ? 4 : 5, class: "f-paper", stroke: l.cls === "f-orange" ? "var(--a-orange)" : (l.cls === "f-ink" ? "var(--a-ink)" : "var(--a-blue)"), "stroke-width": 2.5 }, g); });
        return { g: g, lbl: lbl, line: line, nodes: nodes };
      });
      // merge band for the last step
      var lastY = top + (LANES.length - 1) * rh + 20;
      var band = S("rect", { x: x(2023), y: top + 4, width: x(2026) - x(2023) + 6, height: lastY - top + 6, rx: 6, class: "f-orange", "fill-opacity": 0.14 }, svg);
      svg.insertBefore(band, laneEls[0].g);
      var bandLbl = S("text", { x: x(2026) + 4, y: lastY + 26, class: "t t-sm t-orange t-end", text: compact ? "2023+: families mix" : "2023+: hybrids and multimodal models mix the families" }, svg);
      S("text", { x: compact ? 14 : 20, y: lastY + 26, class: "t t-sm t-muted", text: compact ? "axis stretched after 2010" : "time axis stretched after 2010" }, svg);
      band.style.opacity = 0; bandLbl.style.opacity = 0;

      function reveal(i, first) {
        var L = laneEls[i];
        if (first) return; // lane 0 is visible at s0
        L.lbl.style.opacity = 0;
        L.nodes.forEach(function (n) { n.style.opacity = 0; });
        tl.to(L.lbl, { opacity: 1, duration: 0.3 });
        LC.drawIn(tl, L.line, { duration: 0.6 });
        tl.to(L.nodes, { opacity: 1, duration: 0.2, stagger: 0.1 }, "-=0.3");
      }
      tl.addLabel("s0", 0);
      for (var k = 1; k < 8; k++) {
        T.go(tl, k);
        LANES.forEach(function (l, i) { if (l.step === k) reveal(i); });
        if (k === 7) tl.to([band, bandLbl], { opacity: 1, duration: 0.5 });
        tl.addLabel("s" + k);
      }
      return tl;
    }
  };
})();
