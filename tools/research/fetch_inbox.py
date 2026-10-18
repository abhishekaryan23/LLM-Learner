#!/usr/bin/env python3
"""Weekly research inbox: gather candidate papers and posts, rank them against the course.

Pulls recent arXiv listings, Hugging Face Daily Papers and lab blog feeds (sources.json),
scores each item by how many course-module tags it mentions (course-data.js), and writes
research/inbox/<YYYY>-W<ww>.json and .md. A human (or a scheduled Claude session) reads the
inbox, verifies against primary sources and turns the few that matter into field notes.

Standard library only. Any source that fails is skipped with a warning.
Usage: fetch_inbox.py [--offline FIXTURE.json] [--out DIR]
"""
import argparse, datetime as dt, json, re, sys, urllib.parse, urllib.request
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
UA = {"User-Agent": "LLM-Learner research inbox (+https://github.com/abhishekaryan23/LLM-Learner)"}
ATOM = "{http://www.w3.org/2005/Atom}"
LAB_BONUS = 3


def warn(msg):
    print("warning:", msg, file=sys.stderr)


def get(url, timeout=40):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r:
        return r.read()


def module_tags():
    """{module_id: {"title":..., "tags":[...]}} parsed from course-data.js."""
    src = (ROOT / "course/assets/js/course-data.js").read_text()
    out = {}
    for m in re.finditer(r'(\w+): \{ code: "[^"]+", title: "([^"]+)"[^\n]*?tags: \[([^\]]*)\]', src):
        tags = re.findall(r'"([^"]+)"', m.group(3))
        if tags:
            out[m.group(1)] = {"title": m.group(2), "tags": tags}
    return out


def parse_date(s):
    if not s:
        return None
    try:
        return dt.datetime.fromisoformat(s.replace("Z", "+00:00")).astimezone(dt.timezone.utc)
    except ValueError:
        pass
    try:
        return parsedate_to_datetime(s).astimezone(dt.timezone.utc)
    except (TypeError, ValueError):
        return None


def clean(s):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", s or "")).strip()


def fetch_arxiv(cfg):
    q = " OR ".join("cat:" + c for c in cfg["categories"])
    url = "https://export.arxiv.org/api/query?" + urllib.parse.urlencode(
        {"search_query": q, "sortBy": "submittedDate", "sortOrder": "descending",
         "max_results": cfg.get("max_results", 300)})
    root = ET.fromstring(get(url, timeout=90))
    items = []
    for e in root.iter(ATOM + "entry"):
        link = (e.findtext(ATOM + "id") or "").strip()
        items.append({"title": clean(e.findtext(ATOM + "title")),
                      "summary": clean(e.findtext(ATOM + "summary"))[:600],
                      "url": re.sub(r"v\d+$", "", link.replace("http://", "https://")),
                      "date": e.findtext(ATOM + "published"), "source": "arXiv"})
    return items


def fetch_hf(url):
    items = []
    for p in json.loads(get(url)):
        paper = p.get("paper", {})
        pid = paper.get("id")
        if not pid:
            continue
        items.append({"title": clean(paper.get("title") or p.get("title")),
                      "summary": clean(paper.get("summary"))[:600],
                      "url": "https://arxiv.org/abs/" + pid,
                      "date": p.get("publishedAt") or paper.get("publishedAt"),
                      "source": "HF Daily Papers", "upvotes": paper.get("upvotes", 0)})
    return items


def fetch_feed(feed):
    root = ET.fromstring(get(feed["url"]))
    items = []
    for it in root.iter("item"):  # RSS 2.0
        items.append({"title": clean(it.findtext("title")), "summary": clean(it.findtext("description"))[:600],
                      "url": (it.findtext("link") or "").strip(), "date": it.findtext("pubDate"),
                      "source": feed["name"], "lab": True})
    for e in root.iter(ATOM + "entry"):  # Atom
        link = e.find(ATOM + "link")
        items.append({"title": clean(e.findtext(ATOM + "title")),
                      "summary": clean(e.findtext(ATOM + "summary") or e.findtext(ATOM + "content"))[:600],
                      "url": link.get("href") if link is not None else "",
                      "date": e.findtext(ATOM + "published") or e.findtext(ATOM + "updated"),
                      "source": feed["name"], "lab": True})
    return items


def gather(cfg):
    items = []
    jobs = [("arXiv", lambda: fetch_arxiv(cfg["arxiv"])), ("HF Daily Papers", lambda: fetch_hf(cfg["hf_daily_papers"]))]
    jobs += [(f["name"], (lambda f=f: fetch_feed(f))) for f in cfg["feeds"]]
    for name, job in jobs:
        try:
            got = job()
            print(f"{name}: {len(got)} items", file=sys.stderr)
            items += got
        except Exception as ex:  # one dead feed must not sink the run
            warn(f"{name} failed: {ex}")
    return items


def merge(items):
    """One entry per URL; keep the highest upvotes and every source that listed it."""
    by_url = {}
    for it in items:
        if not it.get("url") or not it.get("title"):
            continue
        key = it["url"].rstrip("/")
        if key in by_url:
            cur = by_url[key]
            cur["sources"] = sorted(set(cur["sources"]) | {it["source"]})
            cur["upvotes"] = max(cur.get("upvotes", 0), it.get("upvotes", 0))
            cur["lab"] = cur.get("lab") or it.get("lab", False)
            if len(it.get("summary", "")) > len(cur.get("summary", "")):
                cur["summary"] = it["summary"]
        else:
            by_url[key] = dict(it, sources=[it["source"]])
            by_url[key].pop("source", None)
    return list(by_url.values())


def score(items, modules, since):
    ranked = []
    for it in items:
        when = parse_date(it.get("date"))
        if when and when < since:
            continue
        text = (it["title"] + " " + it.get("summary", "")).lower()
        hits = {}
        for mid, m in modules.items():
            found = [t for t in m["tags"] if re.search(r"\b" + re.escape(t.lower()) + r"\b", text)]
            if found:
                hits[mid] = found
        n = sum(len(v) for v in hits.values())
        if not n and not it.get("lab"):
            continue
        s = 2 * n + it.get("upvotes", 0) / 10 + (LAB_BONUS if it.get("lab") else 0)
        ranked.append(dict(it, date=when.date().isoformat() if when else None,
                           modules=sorted(hits), matched=sorted({t for v in hits.values() for t in v}),
                           score=round(s, 2)))
    ranked.sort(key=lambda x: -x["score"])
    return ranked


def write(ranked, modules, out_dir, today):
    year, week, _ = today.isocalendar()
    stem = f"{year}-W{week:02d}"
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / f"{stem}.json").write_text(json.dumps(
        {"generated": today.isoformat(), "items": ranked}, indent=1, ensure_ascii=False) + "\n")
    lines = [f"# Research inbox {stem}", "",
             f"Generated {today.isoformat()}. Candidates only: verify against the primary source before writing a field note.", ""]
    papers = [x for x in ranked if not x.get("lab")]
    labs = [x for x in ranked if x.get("lab")]
    for title, group in (("Papers", papers), ("Lab announcements", labs)):
        lines += [f"## {title} ({len(group)})", ""]
        lines += entries(group, modules)
    (out_dir / f"{stem}.md").write_text("\n".join(lines))
    return out_dir / f"{stem}.md"


def entries(group, modules):
    lines = []
    for i, it in enumerate(group, 1):
        mods = ", ".join(f"{m} ({modules[m]['title']})" for m in it["modules"]) or "lab post, no tag match"
        lines += [f"### {i}. {it['title']}", "",
                  f"- {it['url']} · {', '.join(it['sources'])} · {it['date'] or 'undated'} · score {it['score']}",
                  f"- Modules: {mods}"]
        if it["matched"]:
            lines.append(f"- Matched: {', '.join(it['matched'])}")
        if it.get("summary"):
            lines += ["", "> " + it["summary"][:400]]
        lines.append("")
    return lines


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--offline", help="JSON list of raw items to use instead of the network")
    ap.add_argument("--out", default=str(ROOT / "research/inbox"))
    args = ap.parse_args()
    cfg = json.loads((ROOT / "tools/research/sources.json").read_text())
    modules = module_tags()
    today = dt.datetime.now(dt.timezone.utc)
    raw = json.loads(Path(args.offline).read_text()) if args.offline else gather(cfg)
    ranked = score(merge(raw), modules, today - dt.timedelta(days=cfg["days"]))
    # Lab announcements get their own quota so a busy arXiv week can't crowd out releases.
    ranked = ([x for x in ranked if not x.get("lab")][: cfg["top_n"]] +
              [x for x in ranked if x.get("lab")][: cfg.get("lab_top_n", 15)])
    path = write(ranked, modules, Path(args.out), today.date())
    print(f"{len(ranked)} items -> {path}")
    if not raw:
        warn("no items fetched from any source")


if __name__ == "__main__":
    main()
