/* RL.3: the pieces of DQN (Mnih et al., 2013/2015): a Q-network on stacked frames,
   experience replay, a frozen target network, and the Double DQN target
   (van Hasselt et al., 2016). Schematic; bar heights are illustrative. */
(function () {
  var LC = window.LC;
  var QH = [0.45, 0.8, 0.3, 0.6];   // illustrative Q-values for 4 actions

  LC.anims["rl-3-dqn"] = {
    title: "DQN: a Q-table becomes a network",
    steps: [
      "<strong>DQN</strong> replaces the table with a neural network $Q_\\theta(s,a)$. For Atari, the input is the last 4 frames (84×84 greyscale) and the output is <strong>one Q-value per action</strong>, all in one forward pass.",
      "The agent plays $\\varepsilon$-greedily and stores every transition $(s, a, r, s')$ in a large <strong>replay buffer</strong> (the last million in the Nature paper).",
      "Training samples a <strong>random minibatch</strong> from the buffer. Consecutive frames are nearly identical; random sampling breaks that correlation and reuses each experience many times.",
      "The TD target comes from a <strong>target network</strong> $\\theta^-$, a frozen copy: $y = r + \\gamma \\max_{a'} Q_{\\theta^-}(s', a')$. Without it, the target would shift with every update.",
      "Minimize the squared TD error $\\big(y - Q_\\theta(s,a)\\big)^2$ by gradient descent on the online network $\\theta$ only.",
      "Every $C$ steps (10,000 in the Nature paper), <strong>copy</strong> $\\theta$ into $\\theta^-$. The target moves, but in occasional jumps, which keeps training stable.",
      "<strong>Double DQN</strong> fixes the max's optimism: the online net <em>picks</em> the best next action, the target net <em>scores</em> it. $y = r + \\gamma\\, Q_{\\theta^-}\\big(s', \\arg\\max_{a'} Q_\\theta(s',a')\\big)$."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 380 } : { w: 640, h: 300 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact";
      var tl = gsap.timeline();
      var L = compact
        ? { fx: 14, fy: 40, fs: 46, net: { x: 110, y: 44, w: 120, h: 48 }, bars: { x: 262, y0: 98, w: 78, hmax: 50 }, qlbl: [262, 40],
            buf: { x: 110, y: 140, w: 236, n: 10, h: 24 }, bufLbl: [14, 150], tgt: { x: 110, y: 236, w: 120, h: 48 }, copyX: 92, copyLbl: [14, 266],
            eq: [[14, 316], [14, 340], [14, 364]], mb: [346, 182] }
        : { fx: 20, fy: 36, fs: 50, net: { x: 140, y: 40, w: 140, h: 50 }, bars: { x: 330, y0: 96, w: 90, hmax: 52 }, qlbl: [330, 30],
            buf: { x: 140, y: 140, w: 330, n: 14, h: 26 }, bufLbl: [20, 158], tgt: { x: 140, y: 222, w: 140, h: 50 }, copyX: 118, copyLbl: [20, 252],
            eq: [[310, 230], [310, 256], [310, 282]], mb: [470, 186] };
      function hArrow(x0, y, x1, cls) {
        return S("path", { d: "M" + x0 + " " + y + "H" + x1 + "M" + (x1 - 7) + " " + (y - 5) + "L" + x1 + " " + y + "L" + (x1 - 7) + " " + (y + 5), class: cls || "s-faint", "stroke-width": 2 }, svg);
      }
      function vArrow(x, y0, y1, cls) {
        return S("path", { d: "M" + x + " " + y0 + "V" + y1 + "M" + (x - 5) + " " + (y1 - 7) + "L" + x + " " + y1 + "L" + (x + 5) + " " + (y1 - 7), class: cls || "s-faint", "stroke-width": 2 }, svg);
      }
      // text with simple subscripts: parts = [[str, sub?], ...]
      function rich(x, y, parts, cls, extra) {
        var t = S("text", Object.assign({ x: x, y: y, class: cls }, extra || {}), svg), down = false;
        parts.forEach(function (p) {
          var ts = S("tspan", { text: p[0] }, t);
          if (p[1] && !down) { ts.setAttribute("dy", 4); ts.setAttribute("font-size", "0.75em"); down = true; }
          else if (p[1]) ts.setAttribute("font-size", "0.75em");
          else if (down) { ts.setAttribute("dy", -4); down = false; }
        });
        return t;
      }
      function box(b, label, cls) {
        var r = S("rect", { x: b.x, y: b.y, width: b.w, height: b.h, rx: 10, class: "f-surface", stroke: cls, "stroke-width": 2 }, svg);
        var t = S("text", { x: b.x + b.w / 2, y: b.y + b.h / 2 + 5, class: "t t-mid", "font-weight": 600, text: label }, svg);
        return [r, t];
      }
      // frames
      for (var i = 3; i >= 0; i--) S("rect", { x: L.fx + i * 4, y: L.fy + i * 4, width: L.fs, height: L.fs, rx: 3, class: i ? "f-surface2" : "f-surface", stroke: "var(--a-faint)", "stroke-width": 1.5 }, svg);
      S("text", { x: L.fx, y: L.fy + L.fs + 30, class: "t t-sm t-muted", text: "4 frames" }, svg);
      var net = box(L.net, "online Q-net θ", "var(--a-blue)");
      hArrow(L.fx + L.fs + 16, L.net.y + L.net.h / 2, L.net.x - 4);
      hArrow(L.net.x + L.net.w + 4, L.net.y + L.net.h / 2, L.bars.x - 6);
      S("text", { x: L.qlbl[0], y: L.qlbl[1], class: "t t-sm t-muted", text: compact ? "Q per action" : "Q(s, a) per action" }, svg);
      var bw = L.bars.w / 4 - 6, bars = [];
      QH.forEach(function (q, a) {
        var h = q * L.bars.hmax;
        bars.push(S("rect", { x: L.bars.x + a * (bw + 6), y: L.bars.y0 - h, width: bw, height: h, rx: 2, class: "f-blue", "fill-opacity": 0.75 }, svg));
      });
      S("line", { x1: L.bars.x - 2, x2: L.bars.x + L.bars.w, y1: L.bars.y0, y2: L.bars.y0, class: "s-axis" }, svg);
      tl.addLabel("s0", 0);

      // s1: store transitions in the replay buffer
      S("text", { x: L.bufLbl[0], y: L.bufLbl[1], class: "t t-sm", "font-weight": 600, text: "replay" }, svg);
      S("text", { x: L.bufLbl[0], y: L.bufLbl[1] + 16, class: "t t-sm", "font-weight": 600, text: "buffer" }, svg);
      var sw = L.buf.w / L.buf.n, slots = [];
      for (var k = 0; k < L.buf.n; k++) slots.push(S("rect", { x: L.buf.x + k * sw + 1.5, y: L.buf.y, width: sw - 3, height: L.buf.h, rx: 3, class: "f-blue", "fill-opacity": 0.08, stroke: "var(--line)", "stroke-width": 1 }, svg));
      var store = vArrow(L.bars.x + L.bars.w / 2, L.bars.y0 + 8, L.buf.y - 6, "s-orange");
      LC.drawIn(tl, store, { duration: 0.4 }, "+=0.02");
      tl.to(slots, { attr: { "fill-opacity": 0.45 }, duration: 0.12, stagger: 0.06 });
      tl.addLabel("s1");

      // s2: random minibatch
      var pick = compact ? [1, 4, 6, 9] : [1, 5, 8, 12];
      var rings = pick.map(function (k) { return S("rect", { x: L.buf.x + k * sw, y: L.buf.y - 1.5, width: sw, height: L.buf.h + 3, rx: 4, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 2.5 }, svg); });
      var mbLbl = S("text", { x: L.mb[0], y: L.mb[1], class: "t t-sm t-orange t-end", text: "random minibatch" }, svg);
      tl.to(store, { opacity: 0.25, duration: 0.2 });
      LC.popIn(tl, rings.concat([mbLbl]), { duration: 0.3, stagger: 0.08 });
      tl.addLabel("s2");

      // s3: target network
      var tgt = box(L.tgt, "target net θ⁻", "var(--a-orange)");
      var toT = vArrow(L.tgt.x + L.tgt.w / 2, L.buf.y + L.buf.h + 6, L.tgt.y - 4, "s-faint");
      var eq1 = rich(L.eq[0][0], L.eq[0][1], [["y = r + γ · max Q"], ["θ⁻", 1], ["(s′, a′)"]], "t");
      LC.popIn(tl, tgt, { duration: 0.4 });
      LC.drawIn(tl, toT, { duration: 0.3 });
      LC.popIn(tl, eq1, { duration: 0.3 });
      tl.addLabel("s3");

      // s4: loss and gradient step on θ
      var eq2 = rich(L.eq[1][0], L.eq[1][1], [["loss = (y − Q"], ["θ", 1], ["(s, a))²"]], "t");
      var glow = S("rect", { x: L.net.x - 4, y: L.net.y - 4, width: L.net.w + 8, height: L.net.h + 8, rx: 13, class: "f-none", stroke: "var(--a-blue)", "stroke-width": 3 }, svg);
      LC.popIn(tl, eq2, { duration: 0.3 });
      LC.popIn(tl, glow, { duration: 0.3 });
      tl.addLabel("s4");

      // s5: copy θ → θ⁻ every C steps
      var cx = L.copyX, y0 = L.net.y + L.net.h / 2, y1 = L.tgt.y + L.tgt.h / 2;
      var copy = S("path", { d: "M" + (L.net.x - 4) + " " + (y0 + 12) + "H" + cx + "V" + y1 + "H" + (L.tgt.x - 4) + "M" + (L.tgt.x - 11) + " " + (y1 - 5) + "L" + (L.tgt.x - 4) + " " + y1 + "L" + (L.tgt.x - 11) + " " + (y1 + 5), class: "s-orange", "stroke-width": 2 }, svg);
      var copyLbl = S("text", { x: L.copyLbl[0], y: L.copyLbl[1], class: "t t-sm t-orange", text: "copy θ→θ⁻" }, svg);
      var copyLbl2 = S("text", { x: L.copyLbl[0], y: L.copyLbl[1] + 16, class: "t t-sm t-orange", text: "every C steps" }, svg);
      tl.to(glow, { opacity: 0, duration: 0.2 });
      LC.drawIn(tl, copy, { duration: 0.7 });
      LC.popIn(tl, [copyLbl, copyLbl2], { duration: 0.3 });
      tl.addLabel("s5");

      // s6: Double DQN
      var eq3 = S("text", { x: L.eq[2][0], y: L.eq[2][1], class: "t t-orange", "font-weight": 600, text: compact ? "Double: θ picks a′, θ⁻ scores it" : "Double DQN: θ picks a′, θ⁻ scores it" }, svg);
      var pickRing = S("rect", { x: L.bars.x + 1 * (bw + 6) - 3, y: L.bars.y0 - QH[1] * L.bars.hmax - 3, width: bw + 6, height: QH[1] * L.bars.hmax + 3, rx: 3, class: "f-none", stroke: "var(--a-orange)", "stroke-width": 2.5 }, svg);
      LC.popIn(tl, [eq3, pickRing], { duration: 0.4 });
      tl.addLabel("s6");
      return tl;
    }
  };
})();
