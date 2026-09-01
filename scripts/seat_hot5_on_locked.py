# -*- coding: utf-8 -*-
"""Seat generated food onto LOCKED vessel masters (plate/bowl never rembg'd away)."""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(Path(__file__).resolve().parent))

from repair_sunset_on_locked_vessels import rembg_rgba, trim, soft_shadow  # noqa: E402
from sunset_vessel_system import (  # noqa: E402
    ASSETS,
    MASTER_DIR,
    SIZE,
    USER_ASSETS,
    VESSEL_MAP,
    target_diameter_px,
)

USER_GEN = Path(r"C:\Users\sxclipse\.cursor\projects\c-MestiDelivery-Frontend\assets")

JOBS = [
    ("sunset-31-fried-chicken", USER_GEN / "sunset_gen_31_tabaka.png", "V1", 0.68),
    ("sunset-32-chicken-adjika", USER_GEN / "sunset_gen_32_adjika_plated.png", "V1", 0.68),
    ("sunset-33-chkmeruli", USER_GEN / "sunset_gen_chkmeruli_pilot.png", "V2", 0.78),
    ("sunset-34-stewed-beef", USER_GEN / "sunset_gen_34_stewed_beef.png", "V2", 0.78),
    ("sunset-35-stewed-tashmijabi", USER_GEN / "sunset_gen_35_tashmijabi_v2.png", "V2", 0.78),
]


def food_only(src: Path) -> Image.Image:
    rgba = rembg_rgba(Image.open(src).convert("RGB"))
    arr = np.array(rgba, copy=True)
    rgb = arr[..., :3].astype(np.float32)
    a = arr[..., 3]
    opaque = a > 40
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    lum = rgb.mean(-1)
    sat = rgb.max(-1) - rgb.min(-1)

    food = opaque & (
        ((sat > 22) & (lum < 215) & ~((lum < 100) & (sat < 28)))  # colorful/not flat charcoal
        | ((lum < 80) & (sat > 12))  # dark grilled meat
        | ((g > r + 6) & (g > b + 4) & (lum < 180))  # herbs
        | ((r > g + 20) & (r > b + 20) & (lum < 200))  # red adjika/sauce
        | ((r > 150) & (g > 120) & (b < 140) & (sat > 25) & (lum < 210))  # golden chicken skin
        | ((lum > 160) & (lum < 235) & (sat < 50) & (r > 140) & (b < 190))  # cream sauce / cheese mash
    )
    food_m = np.asarray(Image.fromarray((food.astype(np.uint8) * 255), "L").filter(ImageFilter.MaxFilter(11))) > 0

    # Kill charcoal plate/bowl leftovers and pale studio
    charcoal = opaque & (lum < 105) & (sat < 30)
    pale = opaque & (lum > 150) & (sat < 35)
    arr[(~food_m) | (charcoal & ~food_m) | pale, 3] = 0
    # Extra: kill leftover charcoal even if weakly tagged food
    weak_char = opaque & (lum < 95) & (sat < 22)
    arr[weak_char, 3] = 0
    return trim(Image.fromarray(arr))


def seat(stem: str, src: Path, vessel: str, fill: float) -> Path:
    locked = MASTER_DIR / f"locked_{vessel}_45.png"
    scene = Image.open(locked).convert("RGB").resize((SIZE, SIZE), Image.Resampling.LANCZOS)

    # Scale whole locked scene so vessel matches target frac? Masters already sized —
    # measure dark vessel and ensure ~75% by scaling subject paste zone.
    food = food_only(src)
    if food.getchannel("A").getbbox() is None:
        raise RuntimeError(f"empty food {stem}")

    target = int(SIZE * 0.75 * fill)  # food diameter relative to frame
    # Plate food smaller than full vessel — leave charcoal rim visible
    # V1 rim visibility: food ~ 0.78 of vessel → vessel 0.75 → food ~0.585 of frame? 
    # Better: vessel is already full scene at native size. Resize food to fill plate well.
    # Detect plate radius from locked dark disk
    arr = np.asarray(scene).astype(np.float32)
    lum = arr.mean(-1)
    sat = arr.max(-1) - arr.min(-1)
    h, w = lum.shape
    cy, cx = int(h * 0.54), w // 2
    ys, xs = np.ogrid[:h, :w]
    rr = np.sqrt((ys - cy) ** 2 + (xs - cx) ** 2)
    dark = (lum < 110) & (sat < 45)
    plate_r = int(0.36 * w)
    for r in range(int(0.42 * w), int(0.26 * w), -2):
        ring = (rr >= r - 2) & (rr <= r + 2)
        if ring.any() and float(dark[ring].mean()) > 0.5:
            plate_r = r
            break

    food_d = int(2 * plate_r * fill)
    fw, fh = food.size
    scale = food_d / max(fw, fh)
    nw = max(1, int(fw * scale))
    nh = max(1, int(fh * scale))
    food = food.resize((nw, nh), Image.Resampling.LANCZOS)

    x = cx - nw // 2
    y = cy - nh // 2 + (8 if vessel == "V2" else 0)
    canvas = scene.copy()
    # tiny contact shadow under food
    sh = soft_shadow(int(nw * 0.92), max(18, int(nh * 0.10)), strength=0.22)
    canvas.paste(sh, (x + (nw - sh.width) // 2, y + nh - sh.height // 2), sh)
    canvas.paste(food, (x, y), food)

    # Ensure vessel outer width ~75%: if locked plate is smaller, scale entire canvas subject...
    # Locked masters were built at intentional size; scale whole to 75% vessel if needed.
    # Re-measure vessel after paste
    out_arr = np.asarray(canvas).astype(np.float32)
    bg = np.asarray(Image.open(MASTER_DIR.parent / "sunset_templates" / "bg_45deg.png").convert("RGB").resize((SIZE, SIZE))).astype(np.float32)
    # actually MASTER is on BG already — difference from empty BG_45
    from sunset_vessel_system import BG_45

    bg = np.asarray(Image.open(BG_45).convert("RGB").resize((SIZE, SIZE))).astype(np.float32)
    diff = np.abs(out_arr - bg).mean(-1)
    mask = diff > 12
    cols = mask.any(0)
    if cols.any():
        xs2 = np.where(cols)[0]
        cur_w = int(xs2[-1] - xs2[0] + 1)
        want = target_diameter_px(vessel)
        if abs(cur_w - want) / want > 0.04:
            # scale subject blob onto fresh BG
            ys2 = np.where(mask.any(1))[0]
            x0, x1 = int(xs2[0]), int(xs2[-1]) + 1
            y0, y1 = int(ys2[0]), int(ys2[-1]) + 1
            crop = canvas.crop((x0, y0, x1, y1)).convert("RGBA")
            # alpha from diff
            ca = np.array(crop, copy=True)
            sub = diff[y0:y1, x0:x1]
            ca[..., 3] = np.clip((sub - 8) / 20 * 255, 0, 255).astype(np.uint8)
            crop = Image.fromarray(ca)
            sc = want / max(cur_w, 1)
            crop = crop.resize((max(1, int(crop.width * sc)), max(1, int(crop.height * sc))), Image.Resampling.LANCZOS)
            fresh = Image.open(BG_45).convert("RGB").resize((SIZE, SIZE))
            px = (SIZE - crop.width) // 2
            py = int(SIZE * (0.55 if vessel == "V2" else 0.54) - crop.height / 2)
            py = max(28, min(SIZE - crop.height - 28, py))
            sh2 = soft_shadow(int(crop.width * 0.9), max(24, int(crop.height * 0.14)))
            fresh.paste(sh2, (px + (crop.width - sh2.width) // 2, py + crop.height - int(sh2.height * 0.55)), sh2)
            fresh.paste(crop, (px, py), crop)
            canvas = fresh

    unders = stem.replace("-", "_")
    canvas.save(ASSETS / f"{unders}.png", "PNG")
    canvas.save(USER_ASSETS / f"{unders}.png", "PNG")
    canvas.save(USER_ASSETS / f"{stem}.png", "PNG")
    canvas.save(ASSETS / f"{unders}_PILOT.png", "PNG")
    return ASSETS / f"{unders}.png"


def main() -> None:
    for stem, src, vessel, fill in JOBS:
        print(stem, "←", src.name, flush=True)
        if not src.exists():
            print("  MISSING")
            continue
        out = seat(stem, src, vessel, fill)
        print(" ", out, flush=True)


if __name__ == "__main__":
    main()
