/* AG.5 playground: build an AGENTS.md from section chips and see the file plus a rough token count.
   Token estimate: about 4 characters per token for English text and code (a rule of thumb;
   real tokenizers vary). The "API key" chip is a trap: secrets never go in a rules file. */
(function () {
  var LC = window.LC;

  var ORDER = ["setup", "test", "style", "gotchas", "pr", "donttouch"];
  var TITLES = { setup: "Setup", test: "Test", style: "Code style", gotchas: "Gotchas", pr: "PR rules", donttouch: "Don't touch" };
  var BODY = {
    py: {
      name: "Python API",
      setup: ["Python 3.12. Install: `pip install -e \".[dev]\"`", "Copy `.env.example` to `.env`; never commit `.env`."],
      test: ["Run `pytest -q` before you finish. It must pass.", "Lint: `ruff check .` must be clean."],
      style: ["Type hints on every public function.", "Use `httpx`, not `requests`, for HTTP calls."],
      gotchas: ["Tests need Docker running (Postgres runs in a container).", "`settings.py` reads env vars at import time: set them first."],
      pr: ["One change per PR. Title: `fix(api): ...` or `feat(api): ...`.", "Add a line to `CHANGELOG.md` under Unreleased."],
      donttouch: ["`migrations/` is generated: make new ones with `alembic revision`.", "`vendor/` is third-party code. Read only."]
    },
    web: {
      name: "TypeScript web app",
      setup: ["Node 22 and pnpm. Install: `pnpm install`", "Dev server: `pnpm dev` (port 5173)."],
      test: ["Run `pnpm test` and `pnpm typecheck` before you finish.", "E2E tests (`pnpm e2e`) are slow: run them only when asked."],
      style: ["Function components and hooks only; no class components.", "Styles live next to components as `*.module.css`."],
      gotchas: ["`src/api/client.ts` is generated from the OpenAPI file: run `pnpm gen:api`.", "Dates are UTC on the server; format them only in the UI."],
      pr: ["Small PRs (under ~300 lines). Conventional commit titles.", "Add a screenshot for any visible UI change."],
      donttouch: ["`public/legal/` is owned by the legal team.", "Never edit `pnpm-lock.yaml` by hand."]
    }
  };
  var WHY = {
    setup: "Setup: the exact install steps, so the agent doesn't guess the package manager or Python version.",
    test: "Test: the single most useful section. Agents run the checks you list and fix failures before they finish.",
    style: "Code style: only conventions a linter can't enforce. If a formatter can do it, let the formatter (or a hook) do it.",
    gotchas: "Gotchas: the traps a newcomer falls into. Each one usually comes from a real incident.",
    pr: "PR rules: how you want commits and pull requests shaped, so review is easy.",
    donttouch: "Don't touch: generated, vendored or owned-by-someone-else files. Boundaries are cheap to write and save real damage."
  };
  var SECRET_MSG = "Blocked: secrets never go in a rules file. It is committed to git, shared with every tool, and pasted into the model's context. Keep keys in environment variables or a secrets manager.";

  function init(root) {
    var pre = root.querySelector(".ab-pre code");
    var readout = root.querySelector(".pg-readout");
    var hint = root.querySelector(".pg-hint");
    var grid = root.querySelector(".ab-grid");
    var proj = "py";
    var on = { setup: true, test: true, style: false, gotchas: true, pr: false, donttouch: true };

    function text() {
      var b = BODY[proj], lines = ["# AGENTS.md", ""];
      lines.push("Rules for coding agents working on this " + b.name + ".");
      ORDER.forEach(function (k) {
        if (!on[k]) return;
        lines.push("", "## " + TITLES[k]);
        b[k].forEach(function (l) { lines.push("- " + l); });
      });
      return lines.join("\n") + "\n";
    }

    function render() {
      var t = text();
      pre.textContent = t;
      var n = ORDER.filter(function (k) { return on[k]; }).length;
      var toks = Math.round(t.length / 4);
      var lines = t.split("\n").length - 1;
      readout.textContent = "≈ " + toks + " tokens · " + lines + " lines · " + n + " of 6 sections · loaded every session";
      root.querySelectorAll("[data-sec]").forEach(function (c) {
        if (c.dataset.sec !== "secret") c.setAttribute("aria-pressed", String(!!on[c.dataset.sec]));
      });
      root.querySelectorAll("[data-proj]").forEach(function (c) { c.setAttribute("aria-pressed", String(c.dataset.proj === proj)); });
    }

    root.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b || !root.contains(b)) return;
      if (b.dataset.proj) { proj = b.dataset.proj; hint.classList.remove("ab-warn"); hint.textContent = "Same sections, different project: the commands change, the shape doesn't."; }
      else if (b.dataset.sec === "secret") {
        hint.textContent = SECRET_MSG; hint.classList.add("ab-warn");
        b.setAttribute("aria-pressed", "false");
      } else if (b.dataset.sec) {
        var k = b.dataset.sec; on[k] = !on[k];
        hint.classList.remove("ab-warn");
        hint.textContent = (on[k] ? "Added. " : "Removed. ") + WHY[k];
      }
      render();
    });

    function layout() {
      grid.classList.toggle("is-wide", root.clientWidth >= 620);
    }
    layout();
    if ("ResizeObserver" in window) new ResizeObserver(layout).observe(root);
    hint.textContent = "Tap a section to switch it on or off. Try the ⚠ chip too.";
    render();
  }

  document.addEventListener("lc:ready", function () {
    var root = document.getElementById("ag5-builder");
    if (root) init(root);
  });
})();
