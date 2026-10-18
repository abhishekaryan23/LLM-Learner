# LLM Learner: "LLMs, Animated"

A free, interactive course on how large language models are **trained, evaluated and optimized**: step-through animations, plain-English ELI5s, optional Colab exercises, and a built-in spaced-repetition review deck. Works on phones, iPads and desktops, and can be installed as an offline app.

**Live site:** https://abhishekaryan23.github.io/LLM-Learner/

## What's here

| Path | What it is |
|---|---|
| `course/` | The static site (no build step). Details in [`course/README.md`](course/README.md). |
| `course/notebooks/` | Optional Colab exercises: TODO stubs, auto-checks, solutions at the end. |
| `tools/qa/check-layout.js` | Layout guard: every page and every animation step at phone, iPad and desktop sizes. Fails on overlapping or clipped labels. |
| `.github/workflows/pages.yml` | Runs the layout guard, then deploys `course/` to GitHub Pages on every push to `main`. |
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
