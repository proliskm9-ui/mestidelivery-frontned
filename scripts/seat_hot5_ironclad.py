# -*- coding: utf-8 -*-
"""Ironclad seat: paste food onto locked_V*_45 masters. Never rembg the vessel."""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(Path(__file__).resolve().parent))

from repair_sunset_on_locked_vessels import rembg_rgba, trim, soft_shadow  # noqa: E402
from sunset_vessel_system import ASSETS, MASTER_DIR, SIZE, USER_ASSETS  # noqa: E402

USER_GEN = Path(r"C:\Users\sxclipse\.cursor\projects\c-MestiDelivery-Frontend\assets")

# stem, gen, vessel, food_as_fraction_of_plate_diameter
JOBS = [
    ("sunset-31-fried-chicken", USER_GEN / "sunset_gen_31_tabaka.png", "V1", 0.62),
    ("sunset-32-chicken-adjika", USER_GEN / "sunset_gen_32_adjika_plated.png", "V1", 0.62),
    ("sunset-33-chkmeruli", USER_GEN / "sunset_gen_chkmeruli_pilot.png", "V2", 0.76),
    ("sunset-34-stewed-beef", USER_GEN / "sunset_gen_34_stewed_beef.png", "V2", 0.76),
    ("sunset-35-stewed-tashmijabi", USER_GEN / "sunset_gen_35_tashmijabi_v2.png", "V2", 0.76),
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
        ((sat > 24) & (lum < 215) & ~((lum < 100) & (sat < 28)))
        | ((lum < 78) & (sat > 14))
        | ((g > r + 6) & (g > b + 4) & (lum < 180))
        | ((r > g + 18) & (r > b + 18) & (lum < 205))
        | ((r > 145) & (g > 110) & (b < 145) & (sat > 28) & (lum < 210))
        | ((lum > 155) & (lum < 235) & (sat < 55) & (r > 135) & (b < 195))
    )
    food_m = np.asarray(Image.fromarray((food.astype(np.uint8) * 255), "L").filter(ImageFilter.MaxFilter(11))) > 0
    charcoal = opaque & (lum < 100) & (sat < 28)
    pale = opaque & (lum > 155) & (sat < 35)
    arr[charcoal | pale | ~food_m, 3] = 0
    return trim(Image.fromarray(arr))


def plate_geom(scene: Image.Image) -> tuple[int, int, int]:
    """Return cx, cy, outer_radius of charcoal vessel on locked scene."""
    rgb = np.asarray(scene.convert("RGB")).astype(np.float32)
    lum = rgb.mean(-1)
    sat = rgb.max(-1) - rgb.min(-1)
    h, w = lum.shape
    # Prefer dark disk in lower-center (45° plate)
    cy_guess, cx_guess = int(h * 0.55), w // 2
    ys, xs = np.ogrid[:h, :w]
    rr = np.sqrt((ys - cy_guess) ** 2 + (xs - cx_guess) ** 2)
    dark = (lum < 105) & (sat < 48)
    best_r = int(0.34 * w)
    for r in range(int(0.40 * w), int(0.24 * w), -1):
        ring = (rr >= r - 2) & (rr <= r + 2)
        if ring.sum() > 40 and float(dark[ring].mean()) > 0.55:
            best_r = r
            break
    return cx_guess, cy_guess, best_r


def seat(stem: str, src: Path, vessel: str, fill: float) -> Path:
    locked = MASTER_DIR / f"locked_{vessel}_45.png"
    # Keep locked scene pixels EXACTLY — only paste food on top
    scene = Image.open(locked).convert("RGB").resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    cx, cy, plate_r = plate_geom(scene)
    food = food_only(src)
    if food.getchannel("A").getbbox() is None:
        raise RuntimeError(f"empty food {stem}")

    food_d = int(2 * plate_r * fill)
    fw, fh = food.size
    scale = food_d / max(fw, fh)
    nw, nh = max(1, int(fw * scale)), max(1, int(fh * scale))
    food = food.resize((nw, nh), Image.Resampling.LANCZOS)

    x = cx - nw // 2
    y = cy - nh // 2 + (6 if vessel == "V2" else -4)
    canvas = scene.copy()
    sh = soft_shadow(int(nw * 0.9), max(16, int(nh * 0.09)), strength=0.20)
    canvas.paste(sh, (x + (nw - sh.width) // 2, y + nh - sh.height // 2), sh)
    canvas.paste(food, (x, y), food)

    unders = stem.replace("-", "_")
    for dest in (
        ASSETS / f"{unders}.png",
        USER_ASSETS / f"{unders}.png",
        USER_ASSETS / f"{stem}.png",
        ASSETS / f"{unders}_PILOT.png",
    ):
        canvas.save(dest, "PNG")
    print(f"  plate_r={plate_r} food_d={food_d} rim~{(2*plate_r-food_d)/2:.0f}px")
    return ASSETS / f"{unders}.png"


def main() -> None:
    for stem, src, vessel, fill in JOBS:
        print(stem, flush=True)
        print(" ", seat(stem, src, vessel, fill), flush=True)


if __name__ == "__main__":
    main()
