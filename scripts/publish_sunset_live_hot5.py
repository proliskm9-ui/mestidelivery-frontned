# -*- coding: utf-8 -*-
"""Publish live full-scene gens (no rembg) to Assets + upload SSH."""
from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image

sys.stdout.reconfigure(encoding="utf-8")

USER = Path(r"C:\Users\sxclipse\.cursor\projects\c-MestiDelivery-Frontend\assets")
ASSETS = Path(r"C:\MestiDelivery\Frontend\Assets")
REPO = Path(r"C:\MestiDelivery\Frontend")

MAP = [
    ("sunset-31-fried-chicken", "sunset_live_31_tabaka.png"),
    ("sunset-32-chicken-adjika", "sunset_live_32_adjika.png"),
    ("sunset-33-chkmeruli", "sunset_live_33_chkmeruli.png"),
    ("sunset-34-stewed-beef", "sunset_live_34_stewed_beef.png"),
    ("sunset-35-stewed-tashmijabi", "sunset_live_35_tashmijabi.png"),
]


def normalize(src: Path, dest: Path) -> None:
    im = Image.open(src).convert("RGB")
    w, h = im.size
    side = min(w, h)
    left, top = (w - side) // 2, (h - side) // 2
    im = im.crop((left, top, left + side, top + side))
    if side != 1024:
        im = im.resize((1024, 1024), Image.Resampling.LANCZOS)
    im.save(dest, "PNG")


def main() -> None:
    stems = []
    for stem, gen_name in MAP:
        src = USER / gen_name
        if not src.exists():
            raise SystemExit(f"missing {src}")
        unders = stem.replace("-", "_")
        normalize(src, ASSETS / f"{unders}.png")
        normalize(src, USER / f"{unders}.png")
        normalize(src, USER / f"{stem}.png")
        stems.append(stem)
        print("ok", stem)
    only = ",".join(stems)
    cmd = [
        sys.executable,
        str(REPO / "scripts" / "upload_sunset_ssh.py"),
        "admin",
        "423Qq!cv",
        "IW42VUUxBlQgRc1I",
        only,
    ]
    subprocess.check_call(cmd, cwd=str(REPO))


if __name__ == "__main__":
    main()
