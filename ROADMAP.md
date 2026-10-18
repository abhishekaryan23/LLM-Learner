# Roadmap: Phase 2, "all of modern AI, in bytes"

Goal: one end-to-end course for anyone who wants to learn modern AI from its roots, covering text, images, audio, video, multimodal models, mixture-of-experts, reinforcement learning and reasoning, plus the history and prerequisites behind each. It must stay current and be easy to retain.

## Principles

1. **Consumable bytes.** Every lesson is split into 3–6 minute bytes (one `<h2>` section each), plus a warm-up and a wrap-up. Focus mode shows one byte at a time; the home page offers a "today's byte". Short chunks, retrieval after each, spaced review afterwards.
2. **Prerequisites are explicit.** Every lesson lists its immediate prerequisites (`pre` in `course-data.js`). Pick a goal and the site builds the shortest path through the graph, skipping what you've done.
3. **History is the spine.** Each track opens with why the idea was needed and what it replaced (H1 tells the full story from the perceptron to today).
4. **Current, and honest about it.** Each lesson shows a "Reviewed" month. A weekly pipeline gathers new papers and lab posts; a reviewer turns the few that matter into short field notes that appear on *What's new* and in the matching lessons.
5. **Same quality bar as Phase 1.** Animations legible at every step on every device (see `CLAUDE.md`), real numbers, cited papers, Colab where it helps.

## Syllabus (126 lessons, 26 modules, 6 tracks)

| Module | Title | Lessons | Live |
|---|---|---|---|
| M0 | How to learn this course | 3 | 3 |
| H1 | The story of AI | 6 | 0 |
| P1 | Math you actually need | 6 | 6 |
| P2 | Machine-learning basics | 4 | 4 |
| P3 | Neural nets → language | 4 | 4 |
| P4 | PyTorch in an hour | 2 | 2 |
| P5 | Math for generative models | 5 | 0 |
| P6 | Classic deep-learning architectures | 4 | 0 |
| M1 | Transformers | 5 | 5 |
| M2 | Pretraining | 5 | 5 |
| M3 | Post-training | 7 | 7 |
| M4 | Evaluation | 8 | 8 |
| M5 | Optimization | 6 | 6 |
| AR | Beyond the dense transformer | 5 | 0 |
| ★ | Capstone: build an LLM pipeline | 1 | 1 |
| V1 | Vision | 4 | 0 |
| G1 | Image generation | 7 | 0 |
| A1 | Audio & speech | 6 | 0 |
| MM | Multimodal models | 4 | 0 |
| VD | Video | 4 | 0 |
| RL | Reinforcement learning from scratch | 6 | 0 |
| RS | Reasoning & test-time compute | 4 | 0 |
| SY | Building with LLMs | 7 | 0 |
| AG | The agent toolkit: MCP, skills & more | 8 | 0 |
| IN | Interpretability | 3 | 0 |
| ★ | More capstones | 2 | 0 |

Eleven goal paths are built from these modules: understand LLMs, image generation, audio & speech, video, multimodal, reinforcement learning, building apps, building agents (MCP, skills & more), evaluation, efficiency, and the history of AI.

## Delivery

| Step | What | Status |
|---|---|---|
| Infrastructure | New syllabus with prerequisite graph; byte engine with focus mode and deep links; goal paths and today's byte on the home page; "Reviewed" dates; *What's new* page; research pipeline | done |
| Wave A | H1 history, P5 generative-model math, P6 classic architectures, RL from scratch, RS reasoning | in progress |
| Wave B | V1 vision, G1 image generation, A1 audio, MM multimodal, VD video | in progress |
| Agent toolkit | AG: where to use what (a one-page map for builders), context engineering, MCP, Agent Skills, AGENTS.md and memory files, the LLM wiki, subagents/multi-agent/A2A, a hands-on starter kit | in progress |
| Wave C | AR beyond dense transformers (MoE, SSMs, long context), SY building with LLMs, IN interpretability, two more capstones | planned |
| Retrofit | One-question byte checks inside the 51 existing lessons | planned |

Each wave: lessons written to `AGENT_BRIEF`-style spec, illustrations from OpenArt (Flare for ELI5s, Sunburst for covers, low quality, 1k), layout guard plus screenshot review, then the `ready` flags flip.

## Staying current: the research pipeline

```
Mondays 05:17 UTC   research-inbox.yml  →  research/inbox/<year>-W<week>.md   (ranked candidates)
Mondays, later      scheduled Claude session reads the inbox, checks primary sources,
                    drafts ≤ 6 field notes + flags lessons to revisit  →  pull request
Human               reviews and merges  →  notes appear on What's new and in lessons
```

Details and the field-note format: [`research/README.md`](research/README.md).
