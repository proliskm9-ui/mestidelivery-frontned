#!/usr/bin/env python3
"""
Prepare optimized hero "video" frames for the scroll-driven canvas hero.

Input : src/video/frame_0001.webp .. frame_0240.webp  (lossless, ~570KB each)
Output: public/hero-frames/
          desktop/frame_0001.webp ..  (1280x720, lossy q80, ~45KB)
          mobile/frame_0001.webp  ..  (854x480,  lossy q68, ~22KB)
          poster.webp                 (640x360,  instant first paint)
          manifest.json               (count + dims)

Re-runnable: existing, correctly-sized outputs are skipped.
"""
from __future__ import annotations
import os
import json
import sys
from multiprocessing import Pool, cpu_count

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(ROOT, "src", "video")
OUT_ROOT = os.path.join(ROOT, "public", "hero-frames")

DESKTOP_W, DESKTOP_H, DESKTOP_Q = 1280, 720, 80
MOBILE_W, MOBILE_H, MOBILE_Q = 854, 480, 68
POSTER_W, POSTER_H, POSTER_Q = 640, 360, 60

PAD = 4  # frame_0001


def list_sources() -> list[str]:
    files = sorted(
        f for f in os.listdir(SRC_DIR)
        if f.lower().startswith("frame_") and f.lower().endswith(".webp")
    )
    if not files:
        sys.exit(f"No frame_*.webp found in {SRC_DIR}")
    return files


def needs(dst: str, src_mtime: float) -> bool:
    return not (os.path.exists(dst) and os.path.getmtime(dst) >= src_mtime)


def save_frame(task: tuple[str, str, int, int, int]) -> int:
    src, dst, w, h, q = task
    src_mtime = os.path.getmtime(src)
    if not needs(dst, src_mtime):
        return 0  # already up to date
    im = Image.open(src).convert("RGB")
    if im.size != (w, h):
        im = im.resize((w, h), Image.LANCZOS)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    im.save(dst, "WEBP", quality=q, method=6)
    return os.path.getsize(dst)


def main() -> None:
    sources = list_sources()
    n = len(sources)
    print(f"Found {n} source frames in {SRC_DIR}")

    desktop_dir = os.path.join(OUT_ROOT, "desktop")
    mobile_dir = os.path.join(OUT_ROOT, "mobile")

    tasks: list[tuple[str, str, int, int, int]] = []
    for i, name in enumerate(sources, start=1):
        src = os.path.join(SRC_DIR, name)
        tag = f"frame_{i:0{PAD}d}.webp"
        tasks.append((src, os.path.join(desktop_dir, tag), DESKTOP_W, DESKTOP_H, DESKTOP_Q))
        tasks.append((src, os.path.join(mobile_dir, tag), MOBILE_W, MOBILE_H, MOBILE_Q))

    workers = max(2, cpu_count() - 1)
    print(f"Encoding {len(tasks)} images with {workers} workers...")
    sizes: list[int] = []
    with Pool(workers) as pool:
        for k, sz in enumerate(pool.imap_unordered(save_frame, tasks), start=1):
            sizes.append(sz)
            if k % 40 == 0 or k == len(tasks):
                print(f"  {k}/{len(tasks)}")

    written = [s for s in sizes if s > 0]
    total_bytes = sum(os.path.getsize(os.path.join(d, f))
                      for d in (desktop_dir, mobile_dir)
                      for f in os.listdir(d))
    desk_bytes = sum(os.path.getsize(os.path.join(desktop_dir, f)) for f in os.listdir(desktop_dir))
    mob_bytes = sum(os.path.getsize(os.path.join(mobile_dir, f)) for f in os.listdir(mobile_dir))
    print(f"\nEncoded {len(written)} new files; {len(tasks) - len(written)} skipped (up to date).")
    print(f"Desktop set: {n} frames, {desk_bytes/1024/1024:5.2f} MB "
          f"({desk_bytes/n/1024:.1f} KB/frame avg)")
    print(f"Mobile  set: {n} frames, {mob_bytes/1024/1024:5.2f} MB "
          f"({mob_bytes/n/1024:.1f} KB/frame avg)")

    # Poster (instant first paint) — built from frame 1.
    poster_path = os.path.join(OUT_ROOT, "poster.webp")
    with Image.open(os.path.join(SRC_DIR, sources[0])).convert("RGB") as im:
        im.resize((POSTER_W, POSTER_H), Image.LANCZOS).save(poster_path, "WEBP", quality=POSTER_Q, method=6)
    print(f"Poster: {os.path.getsize(poster_path)/1024:.1f} KB")

    manifest = {
        "count": n,
        "desktop": {"dir": "desktop", "width": DESKTOP_W, "height": DESKTOP_H},
        "mobile": {"dir": "mobile", "width": MOBILE_W, "height": MOBILE_H},
        "poster": "poster.webp",
        "pad": PAD,
        "ext": "webp",
    }
    with open(os.path.join(OUT_ROOT, "manifest.json"), "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, indent=2)
    print(f"manifest.json written. Total hero-frames: {total_bytes/1024/1024:.2f} MB")


if __name__ == "__main__":
    main()
