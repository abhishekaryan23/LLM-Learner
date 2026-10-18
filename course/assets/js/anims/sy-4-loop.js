/* SY.4: one tool-calling round trip, seen as the context window filling up.
   Model emits a structured call → app validates and runs it → result is appended to the
   context → model answers. Message formats are vendor-neutral sketches. */
(function () {
  var LC = window.LC;
  var ROWS = [
    { role: "system", c: "tools: get_weather(city, unit)", w: "tools: get_weather(city, unit) + schema", mono: true },
    { role: "user", c: "Do I need an umbrella in Paris today?", w: "Do I need an umbrella in Paris today?" },
    { role: "model", c: "get_weather {\"city\": \"Paris\"}", w: "tool call: get_weather {\"city\": \"Paris\"}", mono: true },
    { role: "tool", c: "{\"rain_chance\": 0.8, \"temp_c\": 14}", w: "{\"rain_chance\": 0.8, \"temp_c\": 14}", mono: true },
    { role: "model", c: "Yes, take one: 80% chance of rain, 14 °C.", w: "Yes, take one: 80% chance of rain, 14 °C." }
  ];
  var APP = ["waiting", "got a tool call", "✓ arguments valid", "calling the API…", "result → context", "done"];

  LC.anims["sy-4-loop"] = {
    title: "One tool call, start to finish",
    steps: [
      "Before the user types, the app puts the <strong>tool definitions</strong> in the context: each tool's name, description and parameter schema.",
      "The user asks a question the model can't answer from memory: today's weather.",
      "The model replies with a <strong>tool call</strong> instead of text: a tool name and JSON arguments. It can't run anything itself; it only asks.",
      "<strong>Your app</strong> checks the call: is the tool allowed, do the arguments match the schema, does this action need the user's OK?",
      "The app <strong>executes</strong> the call, here an HTTP request to a weather service, and gets a result back.",
      "The app <strong>appends the result</strong> to the context as a tool-result message and calls the model again.",
      "Now the model writes the <strong>answer</strong> from the result. If it needed more data, it would make another call, and the loop would repeat."
    ],
    size: function (layout) { return layout === "compact" ? { w: 360, h: 352 } : { w: 640, h: 330 }; },
    build: function (svg, ctx) {
      var S = LC.svg, compact = ctx.layout === "compact", W = ctx.w;
      var tl = gsap.timeline();
      var g = S("g", { transform: compact ? "translate(0,20)" : "translate(0,4)" }, svg);
      var px = compact ? 10 : 16, pw = compact ? 340 : 418, top = 22, rowH = 36, pillW = 54;
      var cls = compact ? "t t-sm" : "t t-sm";
      S("text", { x: px, y: 12, class: "t t-sm t-muted", "font-weight": 600, text: "CONTEXT WINDOW" }, g);
      S("rect", { x: px, y: top, width: pw, height: ROWS.length * rowH + 8, rx: 10, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, g);
      var rows = ROWS.map(function (r, i) {
        var y = top + 4 + i * rowH, gg = S("g", {}, g);
        var hl = S("rect", { x: px + 4, y: y + 3, width: pw - 8, height: rowH - 6, rx: 7, class: "f-none", stroke: i === 2 || i === 3 ? "var(--a-orange)" : "none", "stroke-width": 2 }, gg);
        S("rect", { x: px + 10, y: y + 9, width: pillW, height: rowH - 18, rx: 5, class: r.role === "model" ? "f-ink" : "f-surface2" }, gg);
        S("text", { x: px + 10 + pillW / 2, y: y + rowH / 2 + 4, class: "t t-sm t-mid t-nohalo", "font-weight": 600, style: r.role === "model" ? "fill: var(--a-paper)" : "", text: r.role }, gg);
        S("text", { x: px + 10 + pillW + 10, y: y + rowH / 2 + 4.5, class: cls + (r.mono ? " t-mono" : ""), text: compact ? r.c : r.w }, gg);
        if (i > 0) gg.style.opacity = 0;
        return gg;
      });
      var pBottom = top + ROWS.length * rowH + 8;

      // app and API boxes
      var ax, ay, aw, ah, bx, by, bw, bh;
      if (compact) { ax = 10; ay = pBottom + 52; aw = 160; ah = 54; bx = 200; by = ay; bw = 150; bh = 54; }
      else { ax = 480; ay = 60; aw = 144; ah = 60; bx = 480; by = 220; bw = 144; bh = 60; }
      S("rect", { x: ax, y: ay, width: aw, height: ah, rx: 10, class: "f-surface", stroke: "var(--a-blue)", "stroke-width": 2 }, g);
      S("text", { x: ax + aw / 2, y: ay + 22, class: "t t-sm t-mid", "font-weight": 700, text: "Your app" }, g);
      var appTxt = APP.map(function (t, i) {
        var e = S("text", { x: ax + aw / 2, y: ay + 42, class: "t t-sm t-mid t-muted", text: t }, g);
        if (i) e.style.opacity = 0;
        return e;
      });
      S("rect", { x: bx, y: by, width: bw, height: bh, rx: 10, class: "f-surface", stroke: "var(--line)", "stroke-width": 1.5 }, g);
      S("text", { x: bx + bw / 2, y: by + 22, class: "t t-sm t-mid", "font-weight": 700, text: "Weather API" }, g);
      var apiTxt = S("text", { x: bx + bw / 2, y: by + 42, class: "t t-sm t-mid t-muted", text: "rain 80%, 14 °C" }, g);
      apiTxt.style.opacity = 0;

      // arrows
      function arrow(d, cl) { return S("path", { d: d, class: cl || "s-orange", "stroke-width": 2.5 }, g); }
      var rowY = function (i) { return top + 4 + i * rowH + rowH / 2; };
      var callA, resA, toApi, fromApi, callL, resL;
      if (compact) {
        var x1 = 60, x2 = 130;
        callA = arrow("M" + x1 + " " + (pBottom + 4) + "V" + (ay - 4) + "m-5 -7l5 7l5 -7");
        resA = arrow("M" + x2 + " " + (ay - 4) + "V" + (pBottom + 4) + "m-5 7l5 -7l5 7", "s-blue");
        callL = S("text", { x: x1 - 8, y: pBottom + 30, class: "t t-sm t-end", text: "call" }, g);
        resL = S("text", { x: x2 + 8, y: pBottom + 30, class: "t t-sm", text: "result" }, g);
        toApi = arrow("M" + (ax + aw + 4) + " " + (ay + 18) + "H" + (bx - 4) + "m-7 -5l7 5l-7 5");
        fromApi = arrow("M" + (bx - 4) + " " + (ay + 38) + "H" + (ax + aw + 4) + "m7 -5l-7 5l7 5", "s-blue");
      } else {
        var r2 = rowY(2), r3 = rowY(3), ex = px + pw;
        callA = arrow("M" + (ex + 4) + " " + r2 + "H" + 440 + "V" + (ay + 20) + "H" + (ax - 4) + "m-7 -5l7 5l-7 5");
        resA = arrow("M" + (ax - 4) + " " + (ay + 42) + "H" + 452 + "V" + r3 + "H" + (ex + 4) + "m7 -5l-7 5l7 5", "s-blue");
        callL = S("text", { x: 446, y: ay + 8, class: "t t-sm", text: "call" }, g);
        resL = S("text", { x: 458, y: r3 + 18, class: "t t-sm", text: "result" }, g);
        toApi = arrow("M" + (ax + 50) + " " + (ay + ah + 4) + "V" + (by - 4) + "m-5 -7l5 7l5 -7");
        fromApi = arrow("M" + (ax + aw - 50) + " " + (by - 4) + "V" + (ay + ah + 4) + "m-5 7l5 -7l5 7", "s-blue");
      }
      [callL, resL].forEach(function (e) { e.style.opacity = 0; });

      function app(i, at) { tl.to(appTxt, { opacity: 0, duration: 0.2 }, at); tl.to(appTxt[i], { opacity: 1, duration: 0.3 }, ">"); }
      tl.addLabel("s0", 0);
      tl.to(rows[1], { opacity: 1, duration: 0.4 }, "+=0.05"); tl.addLabel("s1");
      tl.to(rows[2], { opacity: 1, duration: 0.4 }, "+=0.05");
      LC.drawIn(tl, callA, { duration: 0.5 }); tl.to(callL, { opacity: 1, duration: 0.2 });
      app(1); tl.addLabel("s2");
      app(2, "+=0.05"); tl.addLabel("s3");
      app(3, "+=0.05");
      LC.drawIn(tl, toApi, { duration: 0.4 });
      tl.to(apiTxt, { opacity: 1, duration: 0.3 });
      LC.drawIn(tl, fromApi, { duration: 0.4 }); tl.addLabel("s4");
      app(4, "+=0.05");
      LC.drawIn(tl, resA, { duration: 0.5 }); tl.to(resL, { opacity: 1, duration: 0.2 });
      tl.to(rows[3], { opacity: 1, duration: 0.4 }); tl.addLabel("s5");
      app(5, "+=0.05");
      tl.to(rows[4], { opacity: 1, duration: 0.4 }); tl.addLabel("s6");
      return tl;
    }
  };
})();
