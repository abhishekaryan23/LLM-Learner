# CLAUDE.md

## Course site (`course/`): "LLMs, Animated"

Static, mobile-first course on LLM training/eval/optimization. See `course/README.md` for layout and lesson markup.

### Non-negotiable: no overlapping or clipped text, ever

Every animation and playground must be legible at **every step** on **phone (360–430px), iPad (portrait + landscape) and desktop**. Overlapping labels have shipped before (forgetting-curve axis title colliding with "learned!"/"R1" on phones), so before any commit that touches `course/`:

1. Run the layout guard and make it pass. It also runs in CI and blocks deploys:
   ```bash
   (cd course && python3 -m http.server 8123 &)
   cd tools/qa && npm install && node check-layout.js http://localhost:8123/
   # in cloud sessions: CHROME_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome
   ```
   It fails on overlapping SVG text, text outside its drawing, visible undrawn paths (stray dots) and sideways page scroll.
2. Then **look at screenshots yourself** of every animation step on a phone width: the guard can't see text colliding with lines, dots or shapes.

When designing an animation:
- Give it a `compact` layout (≈360 units wide) and a `wide` one (≈640); never just scale the wide one down.
- Reserve space for labels: axis titles get their own row above the plot (top margin ≥ 44 units), not on the same line as data labels.
- Labels near the top of a plot (e.g. markers at 100%) must not share a y-band with titles; prefer short labels on phones ("R1" not "review 1").
- Keep labels off curves and other labels at **every** step, including the final, most crowded one.
- Draw paths with `LC.drawIn` (never set opacity on a step label yourself) so round line-caps don't show as dots before the line draws.
- Text inside SVG ≥ 12 viewBox units in compact layouts (dense number grids such as heatmaps: ≥ 9.5).
- All SVG labels get a background-coloured halo from `main.css`, so a line passing behind stays legible. Text drawn *on* a coloured fill (heatmap cells, badges) must add class `t-nohalo`.

### Other course conventions
- Lesson pages follow `course/lessons/m0-1.html`: pretest → learn (animation) → ELI5 → explain-it-back → quiz → takeaways → lock-in cards.
- Mark a lesson `ready: true` in `assets/js/course-data.js` only when its page exists.
- Images: OpenArt, GPT Image 2.5 Flare (ELI5) / Sunburst (covers), `quality: low`, `resolutionTier: 1k` (5 credits each). No text inside generated images; labels are drawn in code. Add new image URLs to `assets/img/sources.json` (the Pages build downloads them).
- Colab notebooks: `course/notebooks/`, TODO stubs + assert checks + solutions at the end, outputs cleared; execute a solved copy before committing.
