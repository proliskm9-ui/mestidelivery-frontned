# -*- coding: utf-8 -*-
"""Publish remaining Hot living gens (36-48) — no rembg."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

from PIL import Image

sys.stdout.reconfigure(encoding="utf-8")

USER = Path(r"C:\Users\sxclipse\.cursor\projects\c-MestiDelivery-Frontend\assets")
ASSETS = Path(r"C:\MestiDelivery\Frontend\Assets")
REPO = Path(r"C:\MestiDelivery\Frontend")

MAP = [
    ("sunset-36-khashlama", "sunset_live_36_khashlama.png"),
    ("sunset-37-pork-mtsvadi", "sunset_live_37_pork_mtsvadi.png"),
    ("sunset-38-pork-ribs", "sunset_live_38_ribs.png"),
    ("sunset-39-trout", "sunset_live_39_trout.png"),
    ("sunset-40-stewed-mushrooms", "sunset_live_40_mushrooms.png"),
    ("sunset-41-chicken-liver-ketsi", "sunset_live_41_liver.png"),
    ("sunset-42-chicken-bbq-rice", "sunset_live_42_chicken_bbq.png"),
    ("sunset-43-ajapsandali", "sunset_live_43_ajapsandali.png"),
    ("sunset-44-lobio-pot", "sunset_live_44_lobio.png"),
    ("sunset-45-lobio-walnut", "sunset_live_45_lobio_walnut.png"),
    ("sunset-46-ojakhuri", "sunset_live_46_ojakhuri.png"),
    ("sunset-47-carbonara", "sunset_live_47_carbonara.png"),
    ("sunset-48-bolognese", "sunset_live_48_bolognese.png"),
]


def normalize(src: Path, dest: Path) -> None:
    im = Image.open(src).convert("RGB")
    w, h = im.size
    side = min(w, h)
    im = im.crop(((w - side) // 2, (h - side) // 2, (w - side) // 2 + side, (h - side) // 2 + side))
    if side != 1024:
        im = im.resize((1024, 1024), Image.Resampling.LANCZOS)
    im.save(dest, "PNG")


def main() -> None:
    stems = []
    for stem, gen in MAP:
        src = USER / gen
        if not src.exists():
            print("SKIP missing", gen)
            continue
        unders = stem.replace("-", "_")
        normalize(src, ASSETS / f"{unders}.png")
        normalize(src, USER / f"{unders}.png")
        normalize(src, USER / f"{stem}.png")
        stems.append(stem)
        print("ok", stem)
    if not stems:
        raise SystemExit("nothing to upload")
    only = ",".join(stems)
    subprocess.check_call(
        [
            sys.executable,
            str(REPO / "scripts" / "upload_sunset_ssh.py"),
            "admin",
            "423Qq!cv",
            "IW42VUUxBlQgRc1I",
            only,
        ],
        cwd=str(REPO),
    )


if __name__ == "__main__":
    main()
