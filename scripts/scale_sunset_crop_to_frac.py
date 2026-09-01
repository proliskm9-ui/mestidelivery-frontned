# -*- coding: utf-8 -*-
"""Crop-to-scale living Sunset photos to exact VESSEL_FRAC (no rembg)."""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(Path(__file__).resolve().parent))

from sunset_tech_card import QA_TOL, VESSEL_FRAC  # noqa: E402
from sunset_vessel_system import ASSETS, SIZE, USER_ASSETS, VESSEL_MAP  # noqa: E402

USER = Path(r"C:\Users\sxclipse\.cursor\projects\c-MestiDelivery-Frontend\assets")

# First 4 Hot without adjika
JOBS = [
    ("sunset-31-fried-chicken", "V1", USER / "sunset_live_31_tabaka.png"),
    ("sunset-33-chkmeruli", "V2", USER / "sunset_live_33_chkmeruli.png"),
    ("sunset-34-stewed-beef", "V2", USER / "sunset_live_34_stewed_beef.png"),
    ("sunset-35-stewed-tashmijabi", "V2", USER / "sunset_live_35_tashmijabi.png"),
]


def vessel_disk(rgb: np.ndarray) -> tuple[int, int, int]:
    """Estimate vessel center + outer radius (works for dark or white ceramic)."""
    h, w = rgb.shape[:2]
    lum = rgb.astype(np.float32).mean(-1)
    sat = rgb.max(-1) - rgb.min(-1)
    cy, cx = int(h * 0.54), w // 2
    ys, xs = np.ogrid[:h, :w]
    rr = np.sqrt((ys - cy) ** 2 + (xs - cx) ** 2)

    # Prefer high-contrast circular subject vs light table (~140)
    # Vessel = dark charcoal OR pale ceramic sitting on mid-grey cloth
    dark = (lum < 115) & (sat < 55)
    pale = (lum > 175) & (sat < 45)
    subject = dark | pale

    best_r = None
    best_score = 0.0
    for r in range(int(0.48 * w), int(0.22 * w), -2):
        ring = (rr >= r - 2.5) & (rr <= r + 2.5)
        if ring.sum() < 40:
            continue
        # interior more "vessel-like" than exterior ring of table
        interior = rr < r * 0.85
        exterior = (rr > r + 8) & (rr < r + 40)
        if not exterior.any():
            continue
        # score: how different interior lum is from near table
        score = abs(float(lum[interior].mean()) - float(lum[exterior].mean()))
        ring_hit = float(subject[ring].mean())
        score = score * (0.5 + ring_hit)
        if score > best_score:
            best_score = score
            best_r = r
    if best_r is None:
        # fallback: non-table mass bbox
        tableish = (lum > 125) & (lum < 165) & (sat < 35)
        mass = ~tableish
        mass[:40, :] = mass[-40:, :] = mass[:, :40] = mass[:, -40:] = False
        ys2, xs2 = np.where(mass)
        if len(xs2) == 0:
            return cx, cy, int(0.38 * w)
        return int(xs2.mean()), int(ys2.mean()), int(max(xs2.max() - xs2.min(), ys2.max() - ys2.min()) / 2)
    return cx, cy, best_r


def crop_to_frac(im: Image.Image, target_frac: float) -> tuple[Image.Image, dict]:
    rgb = np.asarray(im.convert("RGB"))
    h, w = rgb.shape[:2]
    cx, cy, rad = vessel_disk(rgb)
    D = 2 * rad
    crop_side = D / target_frac
    crop_side = max(crop_side, D * 1.02)
    # clamp to available max square around center
    max_side = 2 * min(cx, cy, w - cx, h - cy)
    info = {
        "cx": cx,
        "cy": cy,
        "D": D,
        "before_frac": round(D / w, 4),
        "target": target_frac,
        "crop_side_raw": round(crop_side, 1),
    }
    if crop_side > max_side:
        # can't enlarge relative size further by crop — use max zoom
        crop_side = max_side
        info["clamped"] = True
    half = crop_side / 2
    x0 = int(round(cx - half))
    y0 = int(round(cy - half))
    x1 = int(round(cx + half))
    y1 = int(round(cy + half))
    # shift into bounds
    if x0 < 0:
        x1 -= x0
        x0 = 0
    if y0 < 0:
        y1 -= y0
        y0 = 0
    if x1 > w:
        x0 -= x1 - w
        x1 = w
    if y1 > h:
        y0 -= y1 - h
        y1 = h
    x0, y0 = max(0, x0), max(0, y0)
    crop = im.crop((x0, y0, x1, y1)).convert("RGB")
    # force square
    side = min(crop.size)
    crop = crop.crop((0, 0, side, side))
    out = crop.resize((SIZE, SIZE), Image.Resampling.LANCZOS)

    # measure after
    arr = np.asarray(out)
    _, _, rad2 = vessel_disk(arr)
    after = (2 * rad2) / SIZE
    info["after_frac"] = round(after, 4)
    info["ok"] = abs(after - target_frac) / target_frac <= QA_TOL + 0.02
    return out, info


def publish(stem: str, im: Image.Image) -> None:
    unders = stem.replace("-", "_")
    for dest in (ASSETS / f"{unders}.png", USER_ASSETS / f"{unders}.png", USER_ASSETS / f"{stem}.png"):
        im.save(dest, "PNG")


def main() -> None:
    only = set(sys.argv[1].split(",")) if len(sys.argv) > 1 else None
    report = []
    for stem, vessel, src in JOBS:
        if only and stem not in only:
            continue
        if vessel not in VESSEL_FRAC and vessel in VESSEL_MAP.values():
            pass
        target = VESSEL_FRAC[vessel]
        if not src.exists():
            # fallback assets
            src = ASSETS / f"{stem.replace('-', '_')}.png"
        print(f"{stem} {vessel} → {target*100:.0f}% …", flush=True)
        im = Image.open(src).convert("RGB")
        out, info = crop_to_frac(im, target)
        publish(stem, out)
        info["stem"] = stem
        info["vessel"] = vessel
        report.append(info)
        print(f"  {info}", flush=True)
    path = Path(__file__).with_name("_sunset_hot4_scale_report.json")
    path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print("wrote", path)


if __name__ == "__main__":
    main()
