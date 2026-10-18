# Research pipeline

Keeps the course current without letting anything unverified onto the site.

## 1. Inbox (automatic, weekly)

`.github/workflows/research-inbox.yml` runs `tools/research/fetch_inbox.py` every Monday. It pulls:

- recent arXiv listings in cs.CL, cs.LG, cs.CV, cs.AI, cs.SD, eess.AS and cs.RO;
- Hugging Face Daily Papers (with upvotes);
- lab blogs: OpenAI, Google DeepMind, Google Research, Hugging Face, BAIR, Microsoft Research, NVIDIA.

Sources live in `tools/research/sources.json`. Items are ranked by how many module `tags` (in `course/assets/js/course-data.js`) they mention, plus upvotes and a bonus for lab posts. The top 40 go to `inbox/<year>-W<week>.md` and `.json`. These are **candidates**, not facts.

Run it yourself: `python3 tools/research/fetch_inbox.py` (add `--out DIR` to write elsewhere, or `--offline items.json` to test without the network).

## 2. Field notes (reviewed, weekly)

A scheduled Claude session (or a person) reads the latest inbox, checks the primary source of each promising item (the paper, model card or official post, never a summary of a summary), and adds at most six notes to `course/field-notes/notes.json`. It opens a pull request; nothing goes live until a human merges it.

What earns a note: a result likely to change how people build or understand models (a new state of the art that holds up, a new method adopted by several labs, a major open release, a benchmark people now report, a policy that affects practice). Skip incremental results and anything that can't be verified.

Note format (checked by `tools/research/validate_notes.py`, which also runs in CI):

```json
{
  "id": "kebab-case-unique-id",
  "date": "2026-10-13",
  "kind": "paper | release | tool | benchmark | policy",
  "title": "≤ 120 chars",
  "summary": "≤ 600 chars: what happened, with the real numbers",
  "why": "≤ 400 chars: why a learner should care, tied to the course",
  "eli5": "optional, ≤ 300 chars",
  "lessons": ["m5-3", "ar-2"],
  "sources": [{"title": "Paper title (Author et al., 2026)", "url": "https://arxiv.org/abs/…"}]
}
```

Notes show on *What's new* (`course/whats-new.html`) and as a "Latest developments" box at the end of every lesson listed in `lessons`.

## 3. Review queue

When a note contradicts or dates a lesson, add a line to `review-queue.md`: lesson id, what changed, source. Fixing the lesson is a normal pull request; afterwards set that lesson's `reviewed` month in `course-data.js`.
