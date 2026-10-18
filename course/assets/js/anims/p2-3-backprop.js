/* P2.3: backpropagation on a tiny computational graph, plus gradient accumulation
   at a branch. Values (blue) flow forward; gradients ∂L/∂node (orange) flow back.
   Network: z = w·x, h = relu(z), ŷ = v·h, L = (ŷ − y)²
   x = 1.5, w = 2, v = 0.5, y = 2.5  →  z = 3, h = 3, ŷ = 1.5, L = 1
   Backward: ∂L/∂ŷ = 2(ŷ − y) = −2, ∂L/∂v = −2·h = −6, ∂L/∂h = −2·v = −1,
             ∂L/∂z = −1·relu'(3) = −1, ∂L/∂w = −1·x = −1.5, ∂L/∂x = −1·w = −2
   Update (η = 0.02): w = 2.03, v = 0.62 → z = h = 3.045, ŷ = 1.888, L = 0.375 */
(function () {
  var LC = window.LC;

  /* ---- shared drawing helpers ---- */
  function edgePts(a, b, bw, bh) {
    // segment between box centres, trimmed to each box's border
    function trim(p, q) {
      var dx = q.x - p.x, dy = q.y - p.y;
      var tx = dx ? (bw / 2) / Math.abs(dx) : Infinity, ty = dy ? (bh / 2) / Math.abs(dy) : Infinity;
      var t = Math.min(tx, ty);
      return { x: p.x + dx * t, y: p.y + dy * t };
    }
    var s = trim(a, b), e = trim(b, a);
    var len = Math.hypot(e.x - s.x, e.y - s.y), gap = 4;
    return { s: { x: s.x + (e.x - s.x) * gap / len, y: s.y + (e.y - s.y) * gap / len },
             e: { x: e.x - (e.x - s.x) * gap / len, y: e.y - (e.y - s.y) * gap / len } };
  }
  function makeGraph(svg, nodes, edges, bw, bh) {
    var S = LC.svg, g = S("g", {}, svg), el = {}, E = {};
    edges.forEach(function (ed) {
      var p = edgePts(nodes[ed[0]], nodes[ed[1]], bw, bh);
      S("line", { x1: p.s.x, y1: p.s.y, x2: p.e.x, y2: p.e.y, class: "s-faint" }, g);
      var ang = Math.atan2(p.e.y - p.s.y, p.e.x - p.s.x), a = 8, sp = 0.45;
      S("path", { d: "M" + p.e.x + " " + p.e.y + "L" + (p.e.x - a * Math.cos(ang - sp)) + " " + (p.e.y - a * Math.sin(ang - sp)) +
        "L" + (p.e.x - a * Math.cos(ang + sp)) + " " + (p.e.y - a * Math.sin(ang + sp)) + "Z", class: "f-faint" }, g);
      E[ed[0] + ">" + ed[1]] = p;
    });
    Object.keys(nodes).forEach(function (k) {
      var n = nodes[k];
      S("rect", { x: n.x - bw / 2, y: n.y - bh / 2, width: bw, height: bh, rx: 9, class: "f-surface", stroke: n.leaf ? "var(--a-faint)" : "var(--a-ink)", "stroke-width": 1.5 }, g);
      S("text", { x: n.x, y: n.y - 6, class: "t t-sm t-mid", text: n.label }, g);
      el[k] = {
        val: function (txt) { return S("text", { x: n.x - bw / 2 + 10, y: n.y + 16, class: "t t-sm t-mono t-blue", text: txt, "font-weight": 600 }, svg); },
        grad: function (txt) { return S("text", { x: n.x + bw / 2 - 10, y: n.y + 16, class: "t t-sm t-mono t-orange t-end", text: txt, "font-weight": 600 }, svg); }
      };
    });
    return { el: el, E: E };
  }
  // overlay a coloured stroke along an edge; back = true draws it from target to source
  function flow(svg, p, cls, back) {
    var a = back ? p.e : p.s, b = back ? p.s : p.e;
    return LC.svg("path", { d: "M" + a.x + " " + a.y + "L" + b.x + " " + b.y, class: cls }, svg);
  }
  function legend(svg, W, y, compact) {
    var S = LC.svg;
    S("text", { x: 8, y: y, class: "t t-sm t-blue", text: compact ? "blue: value (forward)" : "blue: value, computed forward" }, svg);
    S("text", { x: compact ? W - 8 : 250, y: y, class: "t t-sm t-orange" + (compact ? " t-end" : ""), text: compact ? "orange: ∂L/∂node" : "orange: gradient ∂L/∂node, computed backward" }, svg);
  }

  /* ---- 1. the tiny network ---- */
  LC.anims["p2-3-backprop"] = {
    title: "Backpropagation on a tiny network",
    steps: [
      "A 2-layer network as a <strong>computational graph</strong>: each box is one simple operation. Inputs: $x = 1.5$, weights $w = 2$ and $v = 0.5$, target $y = 2.5$.",
      "<strong>Forward pass:</strong> compute each box from its inputs. $z = 2 \\times 1.5 = 3$, $h = \\text{relu}(3) = 3$, $\\hat y = 0.5 \\times 3 = 1.5$, $L = (1.5 - 2.5)^2 = 1$. Every value is <strong>stored</strong> for later.",
      "<strong>Backward pass</strong> starts at the loss with $\\frac{\\partial L}{\\partial L} = 1$. Local derivative of $L = (\\hat y - y)^2$: $2(\\hat y - y) = -2$. So $\\frac{\\partial L}{\\partial \\hat y} = -2$.",
      "At $\\hat y = v\\cdot h$, multiply the incoming gradient by each <strong>local derivative</strong>: $\\frac{\\partial L}{\\partial v} = -2 \\times h = -6$ and $\\frac{\\partial L}{\\partial h} = -2 \\times v = -1$. That's the chain rule, one box at a time.",
      "Through the relu: its slope is 1 where $z &gt; 0$ (and 0 where $z &lt; 0$). Here $z = 3$, so the gradient passes straight through: $\\frac{\\partial L}{\\partial z} = -1$.",
      "At $z = w\\cdot x$: $\\frac{\\partial L}{\\partial w} = -1 \\times x = -1.5$ and $\\frac{\\partial L}{\\partial x} = -1 \\times w = -2$. In a deeper net, that $-2$ would keep flowing into the layer below.",
      "Now every weight has a gradient. A gradient-descent step with $\\eta = 0.02$: $w \\to 2.03$, $v \\to 0.62$. Run forward again and the loss falls from <strong>1.00 to 0.37</strong>. Repeat millions of times: that's training."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 466 } : { w: 640, h: 334 }; },
    build: function (svg, ctx) {
      var compact = ctx.layout === "compact", W = ctx.w;
      var bw = compact ? 100 : 90, bh = 50;
      var N = compact ? {
        x: { x: 58, y: 48, label: "x (input)", leaf: 1 }, w: { x: 302, y: 48, label: "w (weight)", leaf: 1 },
        z: { x: 180, y: 133, label: "z = w·x" }, h: { x: 180, y: 218, label: "h = relu(z)" },
        v: { x: 58, y: 218, label: "v (weight)", leaf: 1 }, yh: { x: 180, y: 303, label: "ŷ = v·h" },
        y: { x: 302, y: 303, label: "y (target)", leaf: 1 }, L: { x: 180, y: 388, label: "L = (ŷ − y)²" }
      } : {
        x: { x: 64, y: 110, label: "x (input)", leaf: 1 }, w: { x: 64, y: 230, label: "w (weight)", leaf: 1 },
        z: { x: 192, y: 170, label: "z = w·x" }, h: { x: 320, y: 170, label: "h = relu(z)" },
        v: { x: 448, y: 62, label: "v (weight)", leaf: 1 }, yh: { x: 448, y: 170, label: "ŷ = v·h" },
        y: { x: 576, y: 278, label: "y (target)", leaf: 1 }, L: { x: 576, y: 170, label: "L = (ŷ − y)²" }
      };
      var G = makeGraph(svg, N, [["x", "z"], ["w", "z"], ["z", "h"], ["h", "yh"], ["v", "yh"], ["yh", "L"], ["y", "L"]], bw, bh);
      legend(svg, W, compact ? 452 : 324, compact);
      var el = G.el, E = G.E, tl = gsap.timeline();
      var fw = LC.svg("g", {}, svg);
      var bk = LC.svg("g", {}, svg);
      // leaf values (visible from the start)
      var vW = el.w.val("2"), vV = el.v.val("0.5");
      el.x.val("1.5"); el.y.val("2.5");
      tl.addLabel("s0", 0);

      // s1: forward pass
      var vals = {};
      [[["x", "z"], ["w", "z"]], [["z", "h"]], [["h", "yh"], ["v", "yh"]], [["yh", "L"], ["y", "L"]]].forEach(function (grp, gi) {
        var paths = grp.map(function (ed) { return flow(fw, E[ed[0] + ">" + ed[1]], "s-blue"); });
        paths.forEach(function (p, i) { LC.drawIn(tl, p, { duration: 0.4 }, i ? "<" : "+=0.02"); });
        var key = ["z", "h", "yh", "L"][gi], txt = ["3", "3", "1.5", "1.00"][gi];
        vals[key] = el[key].val(txt);
        LC.popIn(tl, vals[key], { duration: 0.25 });
      });
      tl.addLabel("s1");

      // s2..s5: backward pass, one node at a time
      var grads = [];
      function back(edgesBack, gradsOut, label) {
        if (edgesBack.length) tl.to(fw, { opacity: 0.35, duration: 0.2 });
        var paths = edgesBack.map(function (ed) { return flow(bk, E[ed[0] + ">" + ed[1]], "s-orange", true); });
        paths.forEach(function (p, i) { LC.drawIn(tl, p, { duration: 0.5 }, i ? "<" : "+=0.02"); });
        var ts = gradsOut.map(function (g) { var t = el[g[0]].grad(g[1]); grads.push(t); return t; });
        LC.popIn(tl, ts, { duration: 0.3, stagger: 0.1 });
        tl.addLabel(label);
      }
      var gL = el.L.grad("1"); grads.push(gL);
      LC.popIn(tl, gL, { duration: 0.3 });
      back([["yh", "L"]], [["yh", "−2"]], "s2");
      back([["h", "yh"], ["v", "yh"]], [["v", "−6"], ["h", "−1"]], "s3");
      back([["z", "h"]], [["z", "−1"]], "s4");
      back([["x", "z"], ["w", "z"]], [["w", "−1.5"], ["x", "−2"]], "s5");

      // s6: update the weights, rerun forward
      var nW = el.w.val("2.03"), nV = el.v.val("0.62");
      var nz = el.z.val("3.05"), nh = el.h.val("3.05"), ny = el.yh.val("1.89"), nL = el.L.val("0.37");
      var fresh = [nW, nV, nz, nh, ny, nL];
      fresh.forEach(function (t) { t.style.opacity = 0; });
      tl.to(grads.concat([bk]), { opacity: 0, duration: 0.4 });
      tl.to([vW, vV], { opacity: 0, duration: 0.2 });
      tl.to([nW, nV], { opacity: 1, duration: 0.3 });
      tl.to(fw, { opacity: 1, duration: 0.3 });
      tl.to([vals.z, vals.h, vals.yh, vals.L], { opacity: 0, duration: 0.2 });
      tl.to([nz, nh, ny, nL], { opacity: 1, duration: 0.3, stagger: 0.12 });
      tl.addLabel("s6");
      return tl;
    }
  };

  /* ---- 2. a branch: gradients add up ---- */
  LC.anims["p2-3-branch"] = {
    title: "When a value is used twice, its gradients add",
    steps: [
      "Here $x$ feeds <strong>two</strong> boxes: $p = 2x$ and $q = x^2$. Then $L = p + q$. Start with $x = 3$.",
      "Forward: $p = 6$, $q = 9$, $L = 15$.",
      "Backward through $L = p + q$: addition's local derivative is 1 for each input, so it passes the gradient on unchanged: $\\frac{\\partial L}{\\partial p} = \\frac{\\partial L}{\\partial q} = 1$.",
      "Path through $p$: $1 \\times \\frac{\\partial p}{\\partial x} = 1 \\times 2 = 2$.",
      "Path through $q$: $1 \\times \\frac{\\partial q}{\\partial x} = 1 \\times 2x = 6$.",
      "$x$ influenced $L$ along both paths, so its gradient is the <strong>sum</strong>: $2 + 6 = 8$. Check: $L = 2x + x^2$ gives $\\frac{dL}{dx} = 2 + 2x = 8$ ✓."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 300 } : { w: 640, h: 284 }; },
    build: function (svg, ctx) {
      var compact = ctx.layout === "compact", W = ctx.w, S = LC.svg;
      var bw = compact ? 96 : 112, bh = 50;
      var N = compact ? {
        x: { x: 58, y: 140, label: "x (input)", leaf: 1 }, p: { x: 184, y: 64, label: "p = 2x" },
        q: { x: 184, y: 216, label: "q = x²" }, L: { x: 306, y: 140, label: "L = p + q" }
      } : {
        x: { x: 96, y: 134, label: "x (input)", leaf: 1 }, p: { x: 320, y: 58, label: "p = 2x" },
        q: { x: 320, y: 210, label: "q = x²" }, L: { x: 544, y: 134, label: "L = p + q" }
      };
      var G = makeGraph(svg, N, [["x", "p"], ["x", "q"], ["p", "L"], ["q", "L"]], bw, bh);
      legend(svg, W, compact ? 290 : 272, compact);
      var el = G.el, E = G.E, tl = gsap.timeline();
      var fw = S("g", {}, svg), bk = S("g", {}, svg);
      el.x.val("3");
      tl.addLabel("s0", 0);

      // s1 forward
      [["x", "p"], ["x", "q"]].forEach(function (ed, i) { LC.drawIn(tl, flow(fw, E[ed[0] + ">" + ed[1]], "s-blue"), { duration: 0.5 }, i ? "<" : "+=0.02"); });
      LC.popIn(tl, [el.p.val("6"), el.q.val("9")], { duration: 0.3 });
      [["p", "L"], ["q", "L"]].forEach(function (ed, i) { LC.drawIn(tl, flow(fw, E[ed[0] + ">" + ed[1]], "s-blue"), { duration: 0.5 }, i ? "<" : "+=0.02"); });
      LC.popIn(tl, el.L.val("15"), { duration: 0.3 });
      tl.addLabel("s1");

      // s2 backward through the sum
      tl.to(fw, { opacity: 0.35, duration: 0.2 });
      LC.popIn(tl, el.L.grad("1"), { duration: 0.3 });
      [["p", "L"], ["q", "L"]].forEach(function (ed, i) { LC.drawIn(tl, flow(bk, E[ed[0] + ">" + ed[1]], "s-orange", true), { duration: 0.5 }, i ? "<" : "+=0.02"); });
      LC.popIn(tl, [el.p.grad("1"), el.q.grad("1")], { duration: 0.3 });
      tl.addLabel("s2");

      // s3, s4: the two contributions, labelled beside x
      var nx = N.x;
      var c1 = S("text", { x: nx.x, y: nx.y - bh / 2 - 12, class: "t t-sm t-orange t-mid", text: "+2 via p", "font-weight": 600 }, svg);
      var c2 = S("text", { x: nx.x, y: nx.y + bh / 2 + 22, class: "t t-sm t-orange t-mid", text: "+6 via q", "font-weight": 600 }, svg);
      LC.drawIn(tl, flow(bk, E["x>p"], "s-orange", true), { duration: 0.6 });
      LC.popIn(tl, c1, { duration: 0.3 });
      tl.addLabel("s3");
      LC.drawIn(tl, flow(bk, E["x>q"], "s-orange", true), { duration: 0.6 });
      LC.popIn(tl, c2, { duration: 0.3 });
      tl.addLabel("s4");

      // s5: sum
      var gx = el.x.grad("8");
      LC.popIn(tl, gx, { duration: 0.4 });
      tl.to([c1, c2], { opacity: 0.55, duration: 0.3 }, "<");
      tl.addLabel("s5");
      return tl;
    }
  };
})();
