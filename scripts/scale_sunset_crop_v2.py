# -*- coding: utf-8 -*-
"""Crop living Sunset gens to exact vessel % using table-difference mask."""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(Path(__file__).resolve().parent))
from sunset_tech_card import QA_TOL, VESSEL_FRAC  # noqa: E402
from sunset_vessel_system import ASSETS, SIZE, USER_ASSETS  # noqa: E402

USER = Path(r"C:\Users\sxclipse\.cursor\projects\c-MestiDelivery-Frontend\assets")

JOBS = [
    ("sunset-31-fried-chicken", "V1", USER / "sunset_live_31_tabaka_78.png"),
    ("sunset-33-chkmeruli", "V2", USER / "sunset_live_33_chkmeruli_80.png"),
    ("sunset-34-stewed-beef", "V2", USER / "sunset_live_34_beef_80.png"),
    ("sunset-35-stewed-tashmijabi", "V2", USER / "sunset_live_35_tashmi_80.png"),
]


def subject_mask(rgb: np.ndarray) -> np.ndarray:
    h, w = rgb.shape[:2]
    # table approx from four corner patches
    patches = [
        rgb[20:70, 20:70],
        rgb[20:70, w - 70 : w - 20],
        rgb[h - 70 : h - 20, 20:70],
        rgb[h - 70 : h - 20, w - 70 : w - 20],
    ]
    table = np.median(np.concatenate([p.reshape(-1, 3) for p in patches], 0), axis=0)
    diff = np.linalg.norm(rgb.astype(np.float32) - table.astype(np.float32), axis=-1)
    mask = diff > 28
    # kill thin edge-only noise; keep central component
    m = Image.fromarray((mask.astype(np.uint8) * 255), "L").filter(ImageFilter.MaxFilter(5))
    m = m.filter(ImageFilter.MinFilter(5))
    mask = np.asarray(m) > 0
    # remove booth strip top ~12%
    mask[: int(h * 0.10), :] = False
    return mask


def vessel_circle(rgb: np.ndarray) -> tuple[int, int, int, float]:
    h, w = rgb.shape[:2]
    mask = subject_mask(rgb)
    ys, xs = np.where(mask)
    if len(xs) < 200:
        return w // 2, int(h * 0.55), int(0.38 * w), 0.0
    cx, cy = int(np.median(xs)), int(np.median(ys))
    # radius = percentile of distance covering most subject
    dist = np.sqrt((xs - cx) ** 2 + (ys - cy) ** 2)
    rad = int(np.percentile(dist, 92))
    # refine center as mean of pixels within rad*1.05
    keep = dist <= rad * 1.05
    cx = int(xs[keep].mean())
    cy = int(ys[keep].mean())
    dist = np.sqrt((xs - cx) ** 2 + (ys - cy) ** 2)
    rad = int(np.percentile(dist, 93))
    return cx, cy, rad, (2 * rad) / w


def crop_to_frac(im: Image.Image, target: float) -> tuple[Image.Image, dict]:
    rgb = np.asarray(im.convert("RGB"))
    h, w = rgb.shape[:2]
    cx, cy, rad, before = vessel_circle(rgb)
    D = 2 * rad
    crop_side = D / target
    max_side = 2 * min(cx, cy, w - cx, h - cy)
    info = {"before": round(before, 4), "target": target, "D": D, "cx": cx, "cy": cy}
    clamped = False
    if crop_side > max_side:
        crop_side = max_side
        clamped = True
    half = crop_side / 2
    x0 = int(round(cx - half))
    y0 = int(round(cy - half))
    x1 = int(round(cx + half))
    y1 = int(round(cy + half))
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
    side = min(crop.size)
    crop = crop.crop(((crop.width - side) // 2, (crop.height - side) // 2, (crop.width - side) // 2 + side, (crop.height - side) // 2 + side))
    out = crop.resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    _, _, _, after = vessel_circle(np.asarray(out))
    info.update({"after": round(after, 4), "clamped": clamped, "ok": abs(after - target) / target <= QA_TOL + 0.04})
    return out, info


def main() -> None:
    report = []
    for stem, vessel, src in JOBS:
        target = VESSEL_FRAC[vessel]
        print(f"{stem} → {target*100:.0f}%", flush=True)
        out, info = crop_to_frac(Image.open(src), target)
        unders = stem.replace("-", "_")
        for d in (ASSETS / f"{unders}.png", USER_ASSETS / f"{unders}.png", USER_ASSETS / f"{stem}.png"):
            out.save(d, "PNG")
        info["stem"] = stem
        info["vessel"] = vessel
        report.append(info)
        print(" ", info, flush=True)
    Path(r"C:\MestiDelivery\Frontend\scripts\_sunset_hot4_scale_report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )


if __name__ == "__main__":
    main()
