# -*- coding: utf-8 -*-
"""Bakery onto charcoal V1 topdown cutout @ 75% — no Luiza white plate."""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(Path(__file__).resolve().parent))

from repair_sunset_on_locked_vessels import rembg_rgba, trim, soft_shadow  # noqa: E402
from sunset_vessel_system import (  # noqa: E402
    ASSETS,
    BG_TOP,
    MASTER_DIR,
    SIZE,
    USER_ASSETS,
    VESSEL_CY,
    target_diameter_px,
)

CUTOUT = MASTER_DIR / "cutout_V1_top.png"
FOOD_FILL = 0.92  # of plate diameter

JOBS = {
    "sunset-49-imeretian-khachapuri": ASSETS / "luiza_26_imeretian_khachapuri.png",
    "sunset-50-megrelian-khachapuri": ASSETS / "luiza_27_megrelian_khachapuri.png",
    "sunset-28-kubdari": ASSETS / "luiza_34_kubdari.png",
    "sunset-29-millet-khachapuri": ASSETS / "luiza_36_millet_khachapuri.png",
    "sunset-57-margherita": ASSETS / "luiza_32_margherita.png",
    "sunset-51-mchadi": ASSETS / "luiza_29_mchadi.png",
    "sunset-52-lobiani": ASSETS / "luiza_30_lobiani.png",
    "sunset-26-chvishtari": ASSETS / "luiza_37_chvishtari.png",
    "sunset-27-chvishtari-millet": ASSETS / "luiza_38_chvishtari_millet.png",
    "sunset-03-suluguni": ASSETS / "luiza_44_suluguni.png",
    "sunset-01-bread": ASSETS / "luiza_31_bread.png",
    "sunset-55-pepperoni": Path(r"C:\MestiDelivery\Frontend\scripts\menu_photos\sunset\sunset_55_pepperoni.jpg"),
    "sunset-56-mushroom-pizza": Path(r"C:\MestiDelivery\Frontend\scripts\menu_photos\sunset\sunset_56_mushroom_pizza.jpg"),
    "sunset-30-royal-khachapuri": Path(r"C:\MestiDelivery\Frontend\scripts\menu_photos\sunset\sunset_30_royal_khachapuri.jpg"),
}


def extract_food_disk(src: Path) -> Image.Image:
    rgba = rembg_rgba(Image.open(src).convert("RGB"))
    arr = np.array(rgba, copy=True)
    rgb = arr[..., :3].astype(np.float32)
    a = arr[..., 3]
    opaque = a > 50
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    lum = rgb.mean(-1)
    sat = rgb.max(-1) - rgb.min(-1)

    warm_bakery = opaque & (r > 110) & (g > 70) & (b < 175) & (lum < 225) & (sat > 15) & (r + 15 >= g)
    toast = opaque & (lum < 95) & (sat > 12)
    cheese = opaque & (lum > 160) & (lum < 235) & (sat < 45) & (r > 150) & (b < 200)
    tomato = opaque & (r > g + 30) & (r > b + 25) & (lum < 200)
    green = opaque & (g > r + 8) & (g > b + 6) & (lum < 175)
    food = warm_bakery | toast | cheese | tomato | green
    food_m = np.asarray(Image.fromarray((food.astype(np.uint8) * 255), "L").filter(ImageFilter.MaxFilter(13))) > 0

    # Kill white ceramic aggressively
    white = opaque & (lum > 170) & (sat < 40)
    arr[white | ~food_m, 3] = 0
    # Erode to drop plate rim crumbs clinging to crust
    arr[..., 3] = np.asarray(Image.fromarray(arr[..., 3], "L").filter(ImageFilter.MinFilter(5)))

    cut = trim(Image.fromarray(arr))
    # Force circle on food bbox
    bb = cut.getchannel("A").getbbox()
    if not bb:
        return cut
    cut = cut.crop(bb)
    w, h = cut.size
    side = max(w, h)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(cut, ((side - w) // 2, (side - h) // 2), cut)
    mask = Image.new("L", (side, side), 0)
    ImageDraw.Draw(mask).ellipse((2, 2, side - 3, side - 3), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(1.0))
    ca = np.array(canvas, copy=True)
    # Also kill residual white inside circle
    rgb2 = ca[..., :3].astype(np.float32)
    lum2 = rgb2.mean(-1)
    sat2 = rgb2.max(-1) - rgb2.min(-1)
    kill_w = (lum2 > 195) & (sat2 < 32)
    ca[kill_w, 3] = 0
    ca[..., 3] = (ca[..., 3].astype(np.float32) * (np.asarray(mask).astype(np.float32) / 255)).astype(np.uint8)
    return Image.fromarray(ca)


def build(stem: str, src: Path) -> dict:
    if not src.exists():
        return {"stem": stem, "error": f"missing {src.name}"}
    food = extract_food_disk(src)
    if food.getchannel("A").getbbox() is None:
        return {"stem": stem, "error": "empty"}

    vessel = Image.open(CUTOUT).convert("RGBA")
    vw, vh = vessel.size
    # food diameter ~ FOOD_FILL of vessel
    target_food = int(min(vw, vh) * FOOD_FILL)
    food = food.resize((target_food, target_food), Image.Resampling.LANCZOS)

    subject = Image.new("RGBA", (vw, vh), (0, 0, 0, 0))
    subject.paste(vessel, (0, 0), vessel)
    fx = (vw - target_food) // 2
    fy = (vh - target_food) // 2
    subject.paste(food, (fx, fy), food)

    target = target_diameter_px("V1")  # 768
    bb = subject.getchannel("A").getbbox()
    width = (bb[2] - bb[0]) if bb else subject.width
    scale = target / max(width, 1)
    nw = max(1, int(subject.width * scale))
    nh = max(1, int(subject.height * scale))
    subject = subject.resize((nw, nh), Image.Resampling.LANCZOS)

    canvas = Image.open(BG_TOP).convert("RGB").resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    x = (SIZE - nw) // 2
    y = int(SIZE * VESSEL_CY["V1"] - nh / 2)
    y = max(28, min(SIZE - nh - 28, y))
    sh_h = max(24, int(nh * 0.12))
    sh_w = int(nw * 0.92)
    sh = soft_shadow(sh_w, sh_h, strength=0.28)
    canvas.paste(sh, (x + (nw - sh_w) // 2, y + nh - int(sh_h * 0.5)), sh)
    canvas.paste(subject, (x, y), subject)

    unders = stem.replace("-", "_")
    canvas.save(ASSETS / f"{unders}.png", "PNG")
    canvas.save(USER_ASSETS / f"{unders}.png", "PNG")
    canvas.save(USER_ASSETS / f"{stem}.png", "PNG")
    return {"stem": stem, "ok": True, "px": nw}


def main() -> None:
    only = set(sys.argv[1].split(",")) if len(sys.argv) > 1 else None
    for stem, src in JOBS.items():
        if only and stem not in only:
            continue
        print(stem, "…", flush=True)
        try:
            print(" ", build(stem, src), flush=True)
        except Exception as e:
            print(" ", {"stem": stem, "error": str(e)}, flush=True)


if __name__ == "__main__":
    main()
