# LLMs, Animated

An interactive, mobile-first course on how large language models are **trained, evaluated and optimized**: step-through animations, ELI5 explanations, optional Colab exercises, and a built-in spaced-repetition review deck.

It is a plain static site (HTML/CSS/JS, no build step) served by GitHub Pages.

## Preview locally

```bash
cd course
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy (GitHub Pages, free for public repos)

Pages is set to **Deploy from a branch → `main` / (root)**: every push to `main` is live at
`https://abhishekaryan23.github.io/LLM-Learner/` (the root `index.html` forwards to `course/`).
Images must be committed: add the URL to `assets/img/sources.json` and the
`fetch-images.yml` workflow downloads it, converts it to WebP and commits it.

## Layout

```
course/
  index.html, review.html      home/course map, spaced-repetition review
  lessons/<id>.html            one page per lesson (ids match assets/js/course-data.js)
  notebooks/*.ipynb            optional Colab exercises
  assets/js/course-data.js     the syllabus: mark a lesson `ready: true` when its page exists
  assets/js/app.js             shell: nav, theme, progress, math rendering, offline
  assets/js/learn.js           pre-tests, quizzes, explain-it-back, blanks, review deck (SRS)
  assets/js/stepper.js         animation player (step / play / scrub / swipe)
  assets/js/anims/*.js         one file per animation or playground
  sw.js, manifest.webmanifest  installable app + offline support
```

## Writing a lesson

Copy an existing lesson page and keep its structure. Every lesson follows the same learning loop:

| Block | Markup |
|---|---|
| Warm-up guess | `<section class="card" data-pretest>` with `.q[data-answer]` + `ol.q-src` |
| Animation | `<figure class="anim" data-anim="name">` + `assets/js/anims/name.js` |
| ELI5 | `<details class="eli5"><summary>Explain like I'm 5</summary>…` |
| Faded example | `<span class="blank" data-answer="0.8" data-tol="0.01" data-hint="…">` |
| Explain it back | `<section class="card recall">` + `.model-answer` |
| Quiz | `<section class="card" data-quiz>` (adds confidence ratings) |
| Colab | `<a class="btn btn-primary" data-colab="file.ipynb">` |
| Lock in + cards | `<section data-lockin>` + `<script type="application/json" id="cards">` |

Animations export `{ title, steps: [captions], size(layout), build(svg, ctx) }`, where `build` returns a GSAP
timeline with labels `s0…s{n-1}`. Provide a `compact` layout (≈360 wide) so text stays legible on phones.

Learner progress and cards live in `localStorage` only; the Review page can export/import them.

Third-party: GSAP 3.12.5 (GreenSock standard license), KaTeX 0.16.11 (MIT), IBM Plex Sans, Space Grotesk and JetBrains Mono (SIL OFL).
Illustrations generated with OpenArt (GPT Image 2.5 Flare / Sunburst).
