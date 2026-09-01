#!/usr/bin/env python3
"""Remove fixed 4-point sparkle watermark from Mesti hero frames.

Mark is composited at a fixed plate position in every frame
(~1158, 602 on 1280x720 desktop). Mobile/poster are scaled.
"""
from __future__ import annotations

import argparse
import os
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

DESKTOP_CX, DESKTOP_CY = 1158, 602
DESKTOP_W, DESKTOP_H = 1280, 720
BASE_RADIUS = 40


def mask_for_size(w: int, h: int) -> np.ndarray:
    sx = w / DESKTOP_W
    sy = h / DESKTOP_H
    cx = int(round(DESKTOP_CX * sx))
    cy = int(round(DESKTOP_CY * sy))
    rad = max(12, int(round(BASE_RADIUS * ((sx + sy) / 2))))

    mask = np.zeros((h, w), np.uint8)
    # Concave 4-point sparkle (tight) + small soft circle for halo
    size = rad * 2 + 1
    c = (size - 1) / 2.0
    n = 0.48
    local = np.zeros((size, size), np.uint8)
    for y in range(size):
        for x in range(size):
            dx = abs((x - c) / (c + 1e-6))
            dy = abs((y - c) / (c + 1e-6))
            if dx**n + dy**n <= 1.05:
                local[y, x] = 255
    local = cv2.dilate(local, np.ones((3, 3), np.uint8), iterations=2)
    y0, x0 = cy - size // 2, cx - size // 2
    y1, x1 = y0 + size, x0 + size
    sy0, sx0 = max(0, y0), max(0, x0)
    sy1, sx1 = min(h, y1), min(w, x1)
    mask[sy0:sy1, sx0:sx1] = np.maximum(
        mask[sy0:sy1, sx0:sx1],
        local[sy0 - y0 : sy1 - y0, sx0 - x0 : sx1 - x0],
    )
    cv2.circle(mask, (cx, cy), max(10, rad - 4), 255, -1)
    return mask


def process_one(path: str, quality: int) -> str:
    im = Image.open(path).convert("RGB")
    rgb = np.array(im)
    h, w = rgb.shape[:2]
    mask = mask_for_size(w, h)
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    out = cv2.inpaint(bgr, mask, 7, cv2.INPAINT_TELEA)
    out = cv2.inpaint(out, mask, 4, cv2.INPAINT_NS)
    out_rgb = cv2.cvtColor(out, cv2.COLOR_BGR2RGB)
    Image.fromarray(out_rgb).save(path, "WEBP", quality=quality, method=6)
    return path


def collect(root: Path) -> list[tuple[str, int]]:
    jobs: list[tuple[str, int]] = []
    desk = root / "desktop"
    mob = root / "mobile"
    poster = root / "poster.webp"
    if desk.is_dir():
        for p in sorted(desk.glob("frame_*.webp")):
            jobs.append((str(p), 80))
    if mob.is_dir():
        for p in sorted(mob.glob("frame_*.webp")):
            jobs.append((str(p), 68))
    if poster.is_file():
        jobs.append((str(poster), 60))
    return jobs


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("roots", nargs="+")
    ap.add_argument("--workers", type=int, default=max(2, (os.cpu_count() or 4) - 1))
    args = ap.parse_args()

    all_jobs: list[tuple[str, int]] = []
    for r in args.roots:
        jobs = collect(Path(r))
        print(f"{r}: {len(jobs)} files")
        all_jobs.extend(jobs)

    ok = 0
    with ProcessPoolExecutor(max_workers=args.workers) as ex:
        futs = [ex.submit(process_one, p, q) for p, q in all_jobs]
        for i, fut in enumerate(as_completed(futs), 1):
            fut.result()
            ok += 1
            if i % 50 == 0 or i == len(futs):
                print(f"  {i}/{len(futs)}")
    print(f"done {ok} files")


if __name__ == "__main__":
    main()
