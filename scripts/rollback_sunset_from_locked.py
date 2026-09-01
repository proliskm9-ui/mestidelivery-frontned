# -*- coding: utf-8 -*-
"""Rollback Sunset Assets from sunset_locked (post-scale75, pre-reseat)."""
from __future__ import annotations

import shutil
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

LOCKED = Path(r"C:\Users\sxclipse\.cursor\projects\c-MestiDelivery-Frontend\assets\sunset_locked")
ASSETS = Path(r"C:\MestiDelivery\Frontend\Assets")
USER = Path(r"C:\Users\sxclipse\.cursor\projects\c-MestiDelivery-Frontend\assets")


def main() -> None:
    files = sorted(LOCKED.glob("sunset-*.png"))
    n = 0
    for src in files:
        stem = src.stem  # sunset-01-bread
        unders = stem.replace("-", "_")
        for dest in (ASSETS / f"{unders}.png", USER / f"{unders}.png", USER / f"{stem}.png"):
            shutil.copy2(src, dest)
        n += 1
        print(f"restored {stem}")
    print(f"done {n} files from {LOCKED}")


if __name__ == "__main__":
    main()
