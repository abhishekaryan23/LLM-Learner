#!/usr/bin/env python3
"""Check course/field-notes/notes.json against the schema the site expects.

Every note needs: id (unique, kebab-case), date (YYYY-MM-DD, not in the future),
kind, title, summary, why, lessons (ids that exist in course-data.js) and at least one
https source. eli5 is optional. Keeps notes short enough to read in one sitting.
Exit code 1 on any problem.
"""
import datetime as dt, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
KINDS = {"paper", "release", "tool", "benchmark", "policy"}
LIMITS = {"title": 120, "summary": 600, "why": 400, "eli5": 300}


def main():
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "course/field-notes/notes.json"
    lesson_ids = set(re.findall(r'\bid: "([a-z0-9]+-\d+)"', (ROOT / "course/assets/js/course-data.js").read_text()))
    notes = json.loads(path.read_text())
    errs, seen = [], set()
    if not isinstance(notes, list):
        sys.exit(f"{path}: top level must be a list")
    today = dt.date.today()
    for i, n in enumerate(notes):
        where = f"note {i} ({n.get('id', '?')})"
        for k in ("id", "date", "kind", "title", "summary", "why", "lessons", "sources"):
            if not n.get(k):
                errs.append(f"{where}: missing {k}")
        if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", n.get("id", "")):
            errs.append(f"{where}: id must be kebab-case")
        if n.get("id") in seen:
            errs.append(f"{where}: duplicate id")
        seen.add(n.get("id"))
        try:
            if dt.date.fromisoformat(n.get("date", "")) > today + dt.timedelta(days=1):
                errs.append(f"{where}: date is in the future")
        except ValueError:
            errs.append(f"{where}: date must be YYYY-MM-DD")
        if n.get("kind") not in KINDS:
            errs.append(f"{where}: kind must be one of {sorted(KINDS)}")
        for k, lim in LIMITS.items():
            if len(n.get(k) or "") > lim:
                errs.append(f"{where}: {k} longer than {lim} chars (keep notes bite-sized)")
            if "$" in (n.get(k) or "") or "<" in (n.get(k) or ""):
                errs.append(f"{where}: {k} is plain text: no $ math or HTML (write '2 dollars', 'O(n^2)')")
        for lid in n.get("lessons") or []:
            if lid not in lesson_ids:
                errs.append(f"{where}: unknown lesson id {lid}")
        for s in n.get("sources") or []:
            if not (isinstance(s, dict) and s.get("title") and str(s.get("url", "")).startswith("https://")):
                errs.append(f"{where}: each source needs a title and an https url")
    if errs:
        print("\n".join(errs))
        sys.exit(1)
    print(f"{path.name}: {len(notes)} notes OK")


if __name__ == "__main__":
    main()
