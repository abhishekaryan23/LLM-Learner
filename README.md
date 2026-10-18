# LLM Learner: "LLMs, Animated"

A free, interactive course on how large language models are **trained, evaluated and optimized**, with 51 lessons across 11 modules (from the math prerequisites to RLHF/DPO, eval statistics and serving): step-through animations, plain-English ELI5s, optional Colab exercises, and a built-in spaced-repetition review deck. Works on phones, iPads and desktops, and can be installed as an offline app.

**Live site:** https://abhishekaryan23.github.io/LLM-Learner/

## What's here

| Path | What it is |
|---|---|
| `course/` | The static site (no build step). Details in [`course/README.md`](course/README.md). |
| `course/notebooks/` | 28 optional Colab exercises: TODO stubs, auto-checks, solutions at the end. |
| `tools/qa/check-layout.js` | Layout guard: every page and every animation step at phone, iPad and desktop sizes. Fails on overlapping or clipped labels. |
| `.github/workflows/layout-check.yml` | Runs the layout guard on every push and pull request. |
| `index.html`, `.nojekyll` | GitHub Pages serves `main` from the repo root; `index.html` forwards visitors to `course/`. |
| `.github/workflows/fetch-images.yml` | Commits any illustration listed in `course/assets/img/sources.json` that isn't committed yet. |

## Preview locally

```bash
cd course && python3 -m http.server 8000   # open http://localhost:8000
```

## Check layout before pushing

```bash
(cd course && python3 -m http.server 8123 &)
cd tools/qa && npm install && npx playwright-core install chromium && node check-layout.js http://localhost:8123/
```
