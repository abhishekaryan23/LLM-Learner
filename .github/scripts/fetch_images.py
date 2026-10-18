"""Download course images listed in sources.json and save them as compressed WebP.

Images already present in the folder are left alone, so committed images win.
A failed download only warns: the page shows its alt text instead of breaking the deploy.
"""
import io
import json
import sys
import urllib.request
from pathlib import Path

from PIL import Image

MAX_WIDTH = 1200
QUALITY = 72


def main(folder: str) -> None:
    out = Path(folder)
    sources = json.loads((out / "sources.json").read_text())
    for name, url in sources.items():
        if name.startswith("_"):
            continue
        dest = out / name
        if dest.exists():
            print(f"keep  {name}")
            continue
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "course-pages-build"})
            with urllib.request.urlopen(req, timeout=60) as r:
                img = Image.open(io.BytesIO(r.read())).convert("RGB")
            if img.width > MAX_WIDTH:
                img = img.resize((MAX_WIDTH, round(img.height * MAX_WIDTH / img.width)), Image.LANCZOS)
            img.save(dest, "WEBP", quality=QUALITY, method=6)
            print(f"saved {name} {img.width}x{img.height} {dest.stat().st_size // 1024} KB")
        except Exception as e:  # noqa: BLE001 - keep deploying with the remaining images
            print(f"::warning::could not fetch {name}: {e}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "course/assets/img")
