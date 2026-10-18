// Layout guard for course pages. For every page × viewport, and every step of every
// animation, it fails on:
//   - overlapping visible SVG text (labels colliding)
//   - SVG text that sticks out of its drawing
//   - "stray caps": a visible stroked path that hasn't started drawing (shows as a dot)
//   - horizontal page overflow
//   - math that failed to render (KaTeX errors, raw $ left in text), checked once per page
// Usage: node tools/qa/check-layout.js [baseUrl] [page ...]
//   baseUrl defaults to http://localhost:8123/ (serve the course/ folder there)
//   CHROME_PATH overrides the browser binary.
const { chromium } = require("playwright-core");
const fs = require("fs");
const path = require("path");

const base = (process.argv[2] || "http://localhost:8123/").replace(/\/?$/, "/");
let pages = process.argv.slice(3);
if (!pages.length) {
  const root = path.join(__dirname, "../../course");
  pages = ["index.html", "review.html"].concat(
    fs.readdirSync(path.join(root, "lessons")).filter(f => f.endsWith(".html")).map(f => "lessons/" + f));
}
const VIEWPORTS = {
  phone: { width: 360, height: 780, isMobile: true, hasTouch: true },
  phoneL: { width: 430, height: 932, isMobile: true, hasTouch: true },
  ipad: { width: 820, height: 1180, isMobile: true, hasTouch: true },
  ipadL: { width: 1180, height: 820, isMobile: true, hasTouch: true },
  desktop: { width: 1440, height: 900 }
};
const MIN_OVERLAP = 2; // px on both axes before two labels count as colliding

function inspectSvg() {
  // runs in the page, per <svg> in figure.anim / .playground
  function visible(el) {
    for (let n = el; n && n.nodeType === 1; n = n.parentNode) {
      const cs = getComputedStyle(n);
      if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) < 0.05) return false;
      if (n.tagName.toLowerCase() === "svg" && n.closest("figure, .playground")) break;
    }
    return true;
  }
  const out = [];
  document.querySelectorAll("figure.anim svg, .playground svg").forEach((svg, si) => {
    const host = svg.closest("figure.anim, .playground");
    const name = host.getAttribute("data-anim") || host.id || "svg" + si;
    const sb = svg.getBoundingClientRect();
    const texts = [...svg.querySelectorAll("text")].filter(t => t.textContent.trim() && visible(t))
      .map(t => ({ t: t.textContent.trim(), r: t.getBoundingClientRect() }));
    for (let i = 0; i < texts.length; i++) {
      const a = texts[i].r;
      if (a.left < sb.left - 1 || a.right > sb.right + 1 || a.top < sb.top - 1 || a.bottom > sb.bottom + 1)
        out.push(`${name}: text "${texts[i].t}" sticks out of the drawing`);
      for (let j = i + 1; j < texts.length; j++) {
        const b = texts[j].r;
        const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (ox > 2 && oy > 2) out.push(`${name}: "${texts[i].t}" overlaps "${texts[j].t}"`);
      }
    }
    svg.querySelectorAll("path, line, polyline").forEach(p => {
      if (!visible(p) || !p.style.strokeDasharray || !p.getTotalLength) return;
      const len = p.getTotalLength(), off = parseFloat(p.style.strokeDashoffset || "0");
      if (len > 4 && off >= len - 0.5) out.push(`${name}: undrawn path is visible (stray dot)`);
    });
  });
  return out;
}

(async () => {
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  const problems = [];
  for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch, reducedMotion: "reduce" });
    for (const pg of pages) {
      const page = await ctx.newPage();
      const errs = [];
      page.on("pageerror", e => errs.push(e.message));
      await page.goto(base + pg, { waitUntil: "networkidle" });
      await page.waitForTimeout(150);
      const where = `${pg} @ ${vpName} (${vp.width}px)`;
      errs.forEach(e => problems.push(`${where}: JS error: ${e}`));
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (overflow > 0) problems.push(`${where}: page scrolls sideways by ${overflow}px`);
      (await page.evaluate(inspectSvg)).forEach(p => problems.push(`${where}: ${p}`));
      if (vpName === "desktop") {
        // math that failed to render: KaTeX errors, or raw $…$ / \( left in visible text
        const math = await page.evaluate(() => {
          const out = [];
          document.querySelectorAll(".katex-error").forEach(e => out.push("KaTeX error: " + e.textContent.slice(0, 60)));
          const w = document.createTreeWalker(document.querySelector("main") || document.body, NodeFilter.SHOW_TEXT);
          for (let n; (n = w.nextNode());) {
            const el = n.parentElement;
            if (!el || el.closest(".katex, script, style, code, pre, textarea, svg, .pg-readout")) continue; // readouts are live text, never typeset
            if (/\$|\\\(|\\\[/.test(n.textContent)) out.push("unrendered math: \"" + n.textContent.trim().slice(0, 60) + "\"");
          }
          return out;
        });
        math.forEach(m => problems.push(`${where}: ${m}`));
      }
      // every step of every animation (reduced motion => steps jump instantly)
      const figs = await page.$$("figure.anim");
      for (const fig of figs) {
        const dots = await fig.$$(".anim-dots button");
        for (let i = 0; i < dots.length; i++) {
          await dots[i].click();
          await page.waitForTimeout(60);
          (await page.evaluate(inspectSvg)).forEach(p => problems.push(`${where} step ${i + 1}: ${p}`));
        }
      }
      await page.close();
    }
    await ctx.close();
  }
  await browser.close();
  const unique = [...new Set(problems)];
  if (unique.length) {
    console.error("Layout problems found:\n  " + unique.join("\n  "));
    process.exit(1);
  }
  console.log(`Layout OK: ${pages.length} pages × ${Object.keys(VIEWPORTS).length} viewports, every animation step checked.`);
})();
